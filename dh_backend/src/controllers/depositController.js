const Deposit = require('../models/Deposit');
const User = require('../models/User');
const errorMessageService = require('../services/errorMessageService');

// @desc    Get all deposits with filtering
// @route   GET /api/admin/deposits
// @access  Admin
const getDeposits = async (req, res) => {
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
    if (status && status !== 'All') {
      filter.status = status;
    }

    const deposits = await Deposit.find(filter)
      .limit(limit)
      .skip(skip)
      .sort({ date: -1 });

    const total = await Deposit.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        deposits,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get deposits error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Get deposit by ID
// @route   GET /api/admin/deposits/:id
// @access  Admin
const getDepositById = async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id);

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('DEPOSIT_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    res.status(200).json({
      success: true,
      data: {
        deposit
      }
    });
  } catch (error) {
    console.error('Get deposit by ID error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Create new deposit
// @route   POST /api/admin/deposits
// @access  Admin
const createDeposit = async (req, res) => {
  try {
    const { phone, amount, processedBy, notes } = req.body;

    // Validate required fields
    if (!phone || !amount || !processedBy) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('DEPOSIT_FIELDS_REQUIRED', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Validate phone format
    const phoneRegex = /^\+976[0-9]{8}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('INVALID_PHONE_FORMAT_MONGOLIA', errorMessageService.getLocaleFromRequest(req))
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

    // Check if user exists to determine deposit status
    const user = await User.findOne({ phone });

    // Set deposit status based on whether user exists
    // If user exists: status = 'confirmed', if not: status = 'wrong'
    const depositStatus = user ? 'confirmed' : 'wrong';

    // Create deposit
    const deposit = new Deposit({
      phone,
      amount,
      processedBy,
      notes,
      status: depositStatus
    });

    await deposit.save();

    // If user exists and status is confirmed, add to wallet
    let updatedUser = user;
    if (user && depositStatus === 'confirmed') {
      // Add amount to user wallet using atomic operation
      updatedUser = await User.findByIdAndUpdate(
        user._id,
        { $inc: { wallet: amount } },
        { new: true, runValidators: true }
      );
    }

    res.status(201).json({
      success: true,
      message: errorMessageService.getMessage('DEPOSIT_CREATED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        deposit,
        ...(updatedUser && {
          user: {
            _id: updatedUser._id,
            username: updatedUser.username,
            phone: updatedUser.phone,
            wallet: updatedUser.wallet
          }
        })
      }
    });
  } catch (error) {
    console.error('Create deposit error:', error);

    // Handle specific MongoDB errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('DUPLICATE_DEPOSIT', errorMessageService.getLocaleFromRequest(req))
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

// @desc    Update wrong deposit (for wrong transactions)
// @route   PUT /api/admin/deposits/:id
// @access  Admin
const updateDeposit = async (req, res) => {
  try {
    const { phone, amount, processedBy, notes } = req.body;

    const deposit = await Deposit.findById(req.params.id);

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('DEPOSIT_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Only allow updating wrong deposits
    if (deposit.status !== 'wrong') {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('ONLY_WRONG_DEPOSIT_UPDATE', errorMessageService.getLocaleFromRequest(req))
      });
    }

    const oldAmount = deposit.amount;
    const oldPhone = deposit.phone;
    const oldStatus = deposit.status;

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
      deposit.phone = phone;
    }

    if (amount !== undefined) {
      // Validate amount
      if (amount < 1000 || amount > 1000000) {
        return res.status(400).json({
          success: false,
          message: errorMessageService.getMessage('AMOUNT_RANGE', errorMessageService.getLocaleFromRequest(req))
        });
      }
      deposit.amount = amount;
    }

    if (processedBy !== undefined) {
      // Validate processedBy
      if (processedBy.length < 2 || processedBy.length > 50) {
        return res.status(400).json({
          success: false,
          message: errorMessageService.getMessage('PROCESSED_BY_LENGTH', errorMessageService.getLocaleFromRequest(req))
        });
      }
      deposit.processedBy = processedBy;
    }

    if (notes !== undefined) {
      deposit.notes = notes;
    }

    // Automatically determine status based on phone number
    // Check if user exists with the current phone number
    const user = await User.findOne({ phone: deposit.phone });
    const newStatus = user ? 'confirmed' : 'wrong';

    // Handle wallet changes based on status transition
    if (oldStatus === 'wrong' && newStatus === 'confirmed') {
      // Status changing from wrong to confirmed - add to wallet
      await User.findOneAndUpdate(
        { phone: deposit.phone },
        { $inc: { wallet: deposit.amount } },
        { runValidators: true }
      );
    } else if (oldStatus === 'confirmed' && newStatus === 'wrong') {
      // Status changing from confirmed to wrong - remove from wallet
      const userToUpdate = await User.findOne({ phone: deposit.phone });
      if (userToUpdate) {
        const newBalance = Math.max(0, userToUpdate.wallet - deposit.amount);
        await User.findOneAndUpdate(
          { phone: deposit.phone },
          { $set: { wallet: newBalance } },
          { runValidators: true }
        );
      }
    } else if (oldStatus === 'confirmed' && newStatus === 'confirmed' && phone !== undefined && phone !== oldPhone) {
      // Phone changed but both old and new have users - adjust wallet
      // Remove from old user's wallet
      const oldUser = await User.findOne({ phone: oldPhone });
      if (oldUser) {
        const oldBalance = Math.max(0, oldUser.wallet - oldAmount);
        await User.findOneAndUpdate(
          { phone: oldPhone },
          { $set: { wallet: oldBalance } },
          { runValidators: true }
        );
      }
      // Add to new user's wallet
      await User.findOneAndUpdate(
        { phone: deposit.phone },
        { $inc: { wallet: deposit.amount } },
        { runValidators: true }
      );
    }

    // Set status automatically based on user existence
    deposit.status = newStatus;

    await deposit.save();

    // Get updated user info if status is confirmed
    let updatedUser = null;
    if (deposit.status === 'confirmed') {
      updatedUser = await User.findOne({ phone: deposit.phone }).select('_id username phone wallet');
    }

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('DEPOSIT_UPDATED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        deposit,
        ...(updatedUser && {
          user: {
            _id: updatedUser._id,
            username: updatedUser.username,
            phone: updatedUser.phone,
            wallet: updatedUser.wallet
          }
        })
      }
    });
  } catch (error) {
    console.error('Update deposit error:', error);

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

// @desc    Update deposit notes only (status is automatically determined by phone)
// @route   PUT /api/admin/deposits/:id/status
// @access  Admin
const updateDepositStatus = async (req, res) => {
  try {
    const { notes } = req.body;

    const deposit = await Deposit.findById(req.params.id);

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('DEPOSIT_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    const oldStatus = deposit.status;

    // Automatically determine status based on phone number
    const user = await User.findOne({ phone: deposit.phone });
    const newStatus = user ? 'confirmed' : 'wrong';

    // Handle wallet changes based on status transition
    if (oldStatus === 'wrong' && newStatus === 'confirmed') {
      // Status changing from wrong to confirmed - add to wallet
      await User.findOneAndUpdate(
        { phone: deposit.phone },
        { $inc: { wallet: deposit.amount } },
        { runValidators: true }
      );
    } else if (oldStatus === 'confirmed' && newStatus === 'wrong') {
      // Status changing from confirmed to wrong - remove from wallet
      const userToUpdate = await User.findOne({ phone: deposit.phone });
      if (userToUpdate) {
        const newBalance = Math.max(0, userToUpdate.wallet - deposit.amount);
        await User.findOneAndUpdate(
          { phone: deposit.phone },
          { $set: { wallet: newBalance } },
          { runValidators: true }
        );
      }
    }

    // Set status automatically based on user existence
    deposit.status = newStatus;
    if (notes) deposit.notes = notes;

    await deposit.save();

    // Get updated user info if status is confirmed
    let updatedUser = null;
    if (deposit.status === 'confirmed') {
      updatedUser = await User.findOne({ phone: deposit.phone }).select('_id username phone wallet');
    }

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('DEPOSIT_UPDATED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        deposit,
        ...(updatedUser && {
          user: {
            _id: updatedUser._id,
            username: updatedUser.username,
            phone: updatedUser.phone,
            wallet: updatedUser.wallet
          }
        })
      }
    });
  } catch (error) {
    console.error('Update deposit status error:', error);

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

// @desc    Delete deposit
// @route   DELETE /api/admin/deposits/:id
// @access  Admin
const deleteDeposit = async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id);

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('DEPOSIT_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Only allow deletion of wrong deposits
    if (deposit.status !== 'wrong') {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('ONLY_WRONG_DEPOSIT_DELETE', errorMessageService.getLocaleFromRequest(req))
      });
    }

    await Deposit.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('DEPOSIT_DELETED', errorMessageService.getLocaleFromRequest(req))
    });
  } catch (error) {
    console.error('Delete deposit error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

module.exports = {
  getDeposits,
  getDepositById,
  createDeposit,
  updateDeposit,
  updateDepositStatus,
  deleteDeposit
};
