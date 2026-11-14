const Purchase = require('../models/Purchase');
const User = require('../models/User');
const errorMessageService = require('../services/errorMessageService');

// @desc    Get all purchases with filtering
// @route   GET /api/admin/purchases
// @access  Admin
const getPurchases = async (req, res) => {
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
    const item = req.query.item;

    const filter = {};
    
    if (phone) {
      filter.phone = { $regex: phone, $options: 'i' };
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
    if (item) {
      filter.item = { $regex: item, $options: 'i' };
    }

    const purchases = await Purchase.find(filter)
      .limit(limit)
      .skip(skip)
      .sort({ date: -1 });

    const total = await Purchase.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        purchases,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get purchases error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Get purchase by ID
// @route   GET /api/admin/purchases/:id
// @access  Admin
const getPurchaseById = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('PURCHASE_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    res.status(200).json({
      success: true,
      data: {
        purchase
      }
    });
  } catch (error) {
    console.error('Get purchase by ID error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Create new purchase
// @route   POST /api/admin/purchases
// @access  Admin
const createPurchase = async (req, res) => {
  try {
    const { phone, item, amount, processedBy, notes } = req.body;

    // Validate required fields
    if (!phone || !item || !amount || !processedBy) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('PURCHASE_FIELDS_REQUIRED', errorMessageService.getLocaleFromRequest(req))
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

    // Validate item
    if (item.length < 2 || item.length > 100) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('ITEM_NAME_LENGTH', errorMessageService.getLocaleFromRequest(req))
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

    // Check if user exists
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('USER_NOT_FOUND_PHONE', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Create purchase
    const purchase = new Purchase({
      phone,
      item,
      amount,
      processedBy,
      notes,
      status: 'pending'
    });

    await purchase.save();

    res.status(201).json({
      success: true,
      message: errorMessageService.getMessage('PURCHASE_CREATED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        purchase
      }
    });
  } catch (error) {
    console.error('Create purchase error:', error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('DUPLICATE_PURCHASE', errorMessageService.getLocaleFromRequest(req))
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

// @desc    Update purchase status
// @route   PUT /api/admin/purchases/:id/status
// @access  Admin
const updatePurchaseStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (!['pending', 'processing', 'completed', 'failed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('INVALID_STATUS', errorMessageService.getLocaleFromRequest(req))
      });
    }

    const purchase = await Purchase.findById(req.params.id);

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('PURCHASE_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    purchase.status = status;
    if (notes) purchase.notes = notes;
    
    await purchase.save();

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('PURCHASE_UPDATED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        purchase
      }
    });
  } catch (error) {
    console.error('Update purchase status error:', error);
    
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

// @desc    Delete purchase
// @route   DELETE /api/admin/purchases/:id
// @access  Admin
const deletePurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('PURCHASE_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Only allow deletion of pending purchases
    if (purchase.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('ONLY_PENDING_PURCHASE_DELETE', errorMessageService.getLocaleFromRequest(req))
      });
    }

    await Purchase.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('PURCHASE_DELETED', errorMessageService.getLocaleFromRequest(req))
    });
  } catch (error) {
    console.error('Delete purchase error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

module.exports = {
  getPurchases,
  getPurchaseById,
  createPurchase,
  updatePurchaseStatus,
  deletePurchase
};
