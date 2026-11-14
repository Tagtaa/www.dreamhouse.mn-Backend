const Withdraw = require('../models/Withdraw');
const User = require('../models/User');
const errorMessageService = require('../services/errorMessageService');

// @desc    Get all withdrawals with filtering
// @route   GET /api/admin/withdrawals
// @access  Admin
const getWithdrawals = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Filter parameters
    const phone = req.query.phone;
    const orderId = req.query.orderId;
    const date = req.query.date;
    const amount = req.query.amount;
    const processedBy = req.query.processedBy;
    const status = req.query.status;

    const filter = {};

    if (phone) {
      // Escape special regex characters (especially + for phone numbers like +976)
      const escapedPhone = phone.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.phone = { $regex: escapedPhone, $options: 'i' };
    }
    if (orderId) {
      filter.orderId = { $regex: orderId, $options: 'i' };
    }
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.date = { $gte: startDate, $lt: endDate };
    }
    if (amount) {
      filter.amount = parseInt(amount);
    }
    if (processedBy) {
      filter.processedBy = { $regex: processedBy, $options: 'i' };
    }
    if (status) {
      filter.status = status;
    }

    const withdrawals = await Withdraw.find(filter)
      .limit(limit)
      .skip(skip)
      .sort({ date: -1 });

    const total = await Withdraw.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        withdrawals,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Get withdrawal by ID
// @route   GET /api/admin/withdrawals/:id
// @access  Admin
const getWithdrawalById = async (req, res) => {
  try {
    const withdrawal = await Withdraw.findById(req.params.id);

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('WITHDRAWAL_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Get user information
    const user = await User.findOne({ phone: withdrawal.phone }).select('_id username phone wallet');

    res.status(200).json({
      success: true,
      data: {
        withdrawal,
        user: user || null
      }
    });
  } catch (error) {
    console.error('Get withdrawal by ID error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Create new withdrawal
// @route   POST /api/admin/withdrawals
// @access  Admin
const createWithdrawal = async (req, res) => {
  try {
    const { phone, userId, amount, processedBy, notes } = req.body;

    // Validate required fields
    if ((!phone && !userId) || !amount || !processedBy) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('WITHDRAWAL_FIELDS_REQUIRED', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Validate amount
    if (amount < 1000 || amount > 1000000) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('AMOUNT_RANGE', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Validate processedBy
    if (processedBy.length < 2 || processedBy.length > 50) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('PROCESSED_BY_LENGTH', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Find user by userId or phone
    let user;
    if (userId) {
      user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: errorMessageService.getMessage('USER_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
        });
      }
    } else {
      // Validate phone format
      const phoneRegex = /^\+976[0-9]{8}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          success: false,
          message: errorMessageService.getMessage('INVALID_PHONE_FORMAT_MONGOLIA', errorMessageService.getLocaleFromRequest(req))
        });
      }
      user = await User.findOne({ phone });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: errorMessageService.getMessage('USER_NOT_FOUND_PHONE', errorMessageService.getLocaleFromRequest(req))
        });
      }
    }

    // Check if user has sufficient wallet balance
    if (user.wallet < amount) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('INSUFFICIENT_WALLET_BALANCE', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Create withdrawal
    const withdrawal = new Withdraw({
      phone: user.phone,
      amount,
      processedBy,
      notes,
      status: 'pending'
    });

    await withdrawal.save();

    // Update user wallet
    user.wallet -= amount;
    await user.save();

    res.status(201).json({
      success: true,
      message: errorMessageService.getMessage('WITHDRAWAL_CREATED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        withdrawal,
        user: {
          _id: user._id,
          username: user.username,
          phone: user.phone,
          wallet: user.wallet
        }
      }
    });
  } catch (error) {
    console.error('Create withdrawal error:', error);

    // Handle specific MongoDB errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('DUPLICATE_WITHDRAWAL', errorMessageService.getLocaleFromRequest(req))
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('VALIDATION_ERROR', errorMessageService.getLocaleFromRequest(req)),
        errors: Object.values(error.errors).map(err => errorMessageService.localizeValidationError(err, errorMessageService.getLocaleFromRequest(req)))
      });
    }

    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Update withdrawal (full update)
// @route   PUT /api/admin/withdrawals/:id
// @access  Admin
const updateWithdrawal = async (req, res) => {
  try {
    const { phone, amount, processedBy, status, notes } = req.body;

    const withdrawal = await Withdraw.findById(req.params.id);

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('WITHDRAWAL_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    const oldStatus = withdrawal.status;
    const oldAmount = withdrawal.amount;

    // Update fields if provided
    if (phone !== undefined) {
      // Validate phone format
      const phoneRegex = /^\+976[0-9]{8}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          success: false,
          message: errorMessageService.getMessage('INVALID_PHONE_FORMAT_MONGOLIA', errorMessageService.getLocaleFromRequest(req))
        });
      }
      withdrawal.phone = phone;
    }

    if (amount !== undefined) {
      if (amount < 1000 || amount > 1000000) {
        return res.status(400).json({
          success: false,
          message: errorMessageService.getMessage('AMOUNT_RANGE', errorMessageService.getLocaleFromRequest(req))
        });
      }
      withdrawal.amount = amount;
    }

    if (processedBy !== undefined) {
      if (processedBy.length < 2 || processedBy.length > 50) {
        return res.status(400).json({
          success: false,
          message: errorMessageService.getMessage('PROCESSED_BY_LENGTH', errorMessageService.getLocaleFromRequest(req))
        });
      }
      withdrawal.processedBy = processedBy;
    }

    if (status !== undefined) {
      if (!['pending', 'processing', 'completed', 'failed', 'cancelled'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: errorMessageService.getMessage('INVALID_STATUS', errorMessageService.getLocaleFromRequest(req))
        });
      }
      withdrawal.status = status;
    }

    if (notes !== undefined) {
      withdrawal.notes = notes;
    }

    // Handle wallet updates based on status changes
    const user = await User.findOne({ phone: withdrawal.phone });
    if (user) {
      // If status changed to failed or cancelled from pending/processing, refund
      if ((withdrawal.status === 'failed' || withdrawal.status === 'cancelled') &&
        (oldStatus === 'pending' || oldStatus === 'processing')) {
        user.wallet += oldAmount;
      }

      // If status changed from failed/cancelled to completed, deduct again
      if (withdrawal.status === 'completed' &&
        (oldStatus === 'failed' || oldStatus === 'cancelled')) {
        if (user.wallet < withdrawal.amount) {
          return res.status(400).json({
            success: false,
            message: errorMessageService.getMessage('INSUFFICIENT_WALLET_BALANCE', errorMessageService.getLocaleFromRequest(req))
          });
        }
        user.wallet -= withdrawal.amount;
      }

      // If amount changed and status is completed, adjust wallet
      if (withdrawal.status === 'completed' && oldStatus === 'completed' && amount !== undefined) {
        const amountDiff = withdrawal.amount - oldAmount;
        if (amountDiff > 0) {
          // Amount increased, need to deduct more
          if (user.wallet < amountDiff) {
            return res.status(400).json({
              success: false,
              message: errorMessageService.getMessage('INSUFFICIENT_WALLET_BALANCE', errorMessageService.getLocaleFromRequest(req))
            });
          }
          user.wallet -= amountDiff;
        } else if (amountDiff < 0) {
          // Amount decreased, refund the difference
          user.wallet += Math.abs(amountDiff);
        }
      }

      await user.save();
    }

    await withdrawal.save();

    // Get updated user info
    const updatedUser = await User.findOne({ phone: withdrawal.phone }).select('_id username phone wallet');

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('WITHDRAWAL_UPDATED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        withdrawal,
        user: updatedUser
      }
    });
  } catch (error) {
    console.error('Update withdrawal error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('VALIDATION_ERROR', errorMessageService.getLocaleFromRequest(req)),
        errors: Object.values(error.errors).map(err => errorMessageService.localizeValidationError(err, errorMessageService.getLocaleFromRequest(req)))
      });
    }

    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Update withdrawal status
// @route   PUT /api/admin/withdrawals/:id/status
// @access  Admin
const updateWithdrawalStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (!['pending', 'processing', 'completed', 'failed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('INVALID_STATUS', errorMessageService.getLocaleFromRequest(req))
      });
    }

    const withdrawal = await Withdraw.findById(req.params.id);

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('WITHDRAWAL_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    const oldStatus = withdrawal.status;

    // If status is being changed to failed or cancelled, refund the user
    if ((status === 'failed' || status === 'cancelled') &&
      (oldStatus === 'pending' || oldStatus === 'processing')) {

      const user = await User.findOne({ phone: withdrawal.phone });
      if (user) {
        user.wallet += withdrawal.amount;
        await user.save();
      }
    }

    // If status changed from failed/cancelled to completed, deduct again
    if (status === 'completed' && (oldStatus === 'failed' || oldStatus === 'cancelled')) {
      const user = await User.findOne({ phone: withdrawal.phone });
      if (user) {
        if (user.wallet < withdrawal.amount) {
          return res.status(400).json({
            success: false,
            message: errorMessageService.getMessage('INSUFFICIENT_WALLET_BALANCE', errorMessageService.getLocaleFromRequest(req))
          });
        }
        user.wallet -= withdrawal.amount;
        await user.save();
      }
    }

    withdrawal.status = status;
    if (notes) withdrawal.notes = notes;

    await withdrawal.save();

    // Get updated user info
    const user = await User.findOne({ phone: withdrawal.phone }).select('_id username phone wallet');

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('WITHDRAWAL_UPDATED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        withdrawal,
        user: user || null
      }
    });
  } catch (error) {
    console.error('Update withdrawal status error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('VALIDATION_ERROR', errorMessageService.getLocaleFromRequest(req)),
        errors: Object.values(error.errors).map(err => errorMessageService.localizeValidationError(err, errorMessageService.getLocaleFromRequest(req)))
      });
    }

    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Delete withdrawal
// @route   DELETE /api/admin/withdrawals/:id
// @access  Admin
const deleteWithdrawal = async (req, res) => {
  try {
    const withdrawal = await Withdraw.findById(req.params.id);

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('WITHDRAWAL_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Only allow deletion of pending withdrawals
    if (withdrawal.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('ONLY_PENDING_DELETE', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Refund the user if withdrawal was pending
    const user = await User.findOne({ phone: withdrawal.phone });
    if (user) {
      user.wallet += withdrawal.amount;
      await user.save();
    }

    await Withdraw.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('WITHDRAWAL_DELETED', errorMessageService.getLocaleFromRequest(req))
    });
  } catch (error) {
    console.error('Delete withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

module.exports = {
  getWithdrawals,
  getWithdrawalById,
  createWithdrawal,
  updateWithdrawal,
  updateWithdrawalStatus,
  deleteWithdrawal
};
