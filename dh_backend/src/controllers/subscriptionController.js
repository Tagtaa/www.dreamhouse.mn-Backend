const Subscription = require('../models/Subscription');
const errorMessageService = require('../services/errorMessageService');

// @desc    Get all active subscriptions (for users)
// @route   GET /api/subscriptions
// @access  Private (User)
const getActiveSubscriptions = async (req, res) => {
  try {
    // Get language from Accept-Language header or query param
    const acceptLanguage = req.headers['accept-language'] || '';
    const language = req.query.lang || (acceptLanguage.startsWith('mn') ? 'mn' : 'en');

    const subscriptions = await Subscription.find({ isActive: true })
      .select('name plan day price isActive')
      .sort({ day: 1 });

    // Add title field and localize name to each subscription
    const subscriptionsWithTitle = subscriptions.map(subscription => ({
      ...subscription.toObject(),
      name: subscription.generateName(language),
      title: subscription.generateTitle(language)
    }));

    res.status(200).json({
      success: true,
      data: {
        subscriptions: subscriptionsWithTitle
      }
    });
  } catch (error) {
    console.error('Get active subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Get subscription by ID (for users)
// @route   GET /api/subscriptions/:id
// @access  Private (User)
const getActiveSubscriptionById = async (req, res) => {
  try {
    // Get language from Accept-Language header or query param
    const acceptLanguage = req.headers['accept-language'] || '';
    const language = req.query.lang || (acceptLanguage.startsWith('mn') ? 'mn' : 'en');

    const subscription = await Subscription.findOne({
      _id: req.params.id,
      isActive: true
    }).select('name plan day price isActive');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('SUBSCRIPTION_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Add title field and localize name
    const subscriptionWithTitle = {
      ...subscription.toObject(),
      name: subscription.generateName(language),
      title: subscription.generateTitle(language)
    };

    res.status(200).json({
      success: true,
      data: {
        subscription: subscriptionWithTitle
      }
    });
  } catch (error) {
    console.error('Get active subscription by ID error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Get all subscriptions (admin)
// @route   GET /api/admin/subscriptions
// @access  Admin
const getSubscriptions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search;
    const isActive = req.query.isActive;

    const filter = {};
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const subscriptions = await Subscription.find(filter)
      .limit(limit)
      .skip(skip)
      .sort({ day: 1 });

    const total = await Subscription.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        subscriptions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Get subscription by ID
// @route   GET /api/admin/subscriptions/:id
// @access  Admin
const getSubscriptionById = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('SUBSCRIPTION_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    res.status(200).json({
      success: true,
      data: {
        subscription
      }
    });
  } catch (error) {
    console.error('Get subscription by ID error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Create new subscription
// @route   POST /api/admin/subscriptions
// @access  Admin
const createSubscription = async (req, res) => {
  try {
    const { name, plan, day, price } = req.body;

    // Check if subscription with same name already exists
    const existingSubscription = await Subscription.findOne({ name });
    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('SUBSCRIPTION_NAME_EXISTS', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Check if subscription with same plan already exists
    const existingPlan = await Subscription.findOne({ plan });
    if (existingPlan) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('SUBSCRIPTION_PLAN_EXISTS', errorMessageService.getLocaleFromRequest(req))
      });
    }

    const subscription = new Subscription({
      name,
      plan,
      day,
      price
    });

    await subscription.save();

    res.status(201).json({
      success: true,
      message: errorMessageService.getMessage('SUBSCRIPTION_CREATED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        subscription
      }
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Update subscription
// @route   PUT /api/admin/subscriptions/:id
// @access  Admin
const updateSubscription = async (req, res) => {
  try {
    const { name, plan, day, price, isActive } = req.body;

    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('SUBSCRIPTION_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Check if name is being changed and if it conflicts with existing subscription
    if (name && name !== subscription.name) {
      const existingSubscription = await Subscription.findOne({ name });
      if (existingSubscription) {
        return res.status(400).json({
          success: false,
          message: errorMessageService.getMessage('SUBSCRIPTION_NAME_EXISTS', errorMessageService.getLocaleFromRequest(req))
        });
      }
    }

    // Check if plan is being changed and if it conflicts with existing subscription
    if (plan && plan !== subscription.plan) {
      const existingPlan = await Subscription.findOne({ plan });
      if (existingPlan) {
        return res.status(400).json({
          success: false,
          message: errorMessageService.getMessage('SUBSCRIPTION_PLAN_EXISTS', errorMessageService.getLocaleFromRequest(req))
        });
      }
    }

    // Update fields
    if (name !== undefined) subscription.name = name;
    if (plan !== undefined) subscription.plan = plan;
    if (day !== undefined) subscription.day = day;
    if (price !== undefined) subscription.price = price;
    if (isActive !== undefined) subscription.isActive = isActive;

    await subscription.save();

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('SUBSCRIPTION_UPDATED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        subscription
      }
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Delete subscription
// @route   DELETE /api/admin/subscriptions/:id
// @access  Admin
const deleteSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('SUBSCRIPTION_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Soft delete by deactivating
    subscription.isActive = false;
    await subscription.save();

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('SUBSCRIPTION_DELETED', errorMessageService.getLocaleFromRequest(req))
    });
  } catch (error) {
    console.error('Delete subscription error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Toggle subscription status
// @route   PUT /api/admin/subscriptions/:id/toggle
// @access  Admin
const toggleSubscriptionStatus = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('SUBSCRIPTION_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    subscription.isActive = !subscription.isActive;
    await subscription.save();

    const locale = errorMessageService.getLocaleFromRequest(req);
    const statusText = subscription.isActive ? (locale === 'mn' ? 'идэвхжүүлсэн' : 'activated') : (locale === 'mn' ? 'идэвхгүй болгосон' : 'deactivated');
    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('SUBSCRIPTION_STATUS_UPDATED_SUCCESS', locale, { status: statusText }),
      data: {
        subscription
      }
    });
  } catch (error) {
    console.error('Toggle subscription status error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

module.exports = {
  getActiveSubscriptions,
  getActiveSubscriptionById,
  getSubscriptions,
  getSubscriptionById,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  toggleSubscriptionStatus
};
