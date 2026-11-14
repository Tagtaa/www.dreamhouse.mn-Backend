const User = require('../models/User');
const errorMessageService = require('../services/errorMessageService');

// @desc    Charge user wallet
// @route   POST /api/payments/charge-wallet
// @access  Private
const chargeWallet = async (req, res) => {
  try {
    const { amount, paymentMethod } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: errorMessageService.getMessage('USER_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // In a real implementation, you would:
    // 1. Process payment with payment gateway
    // 2. Verify payment status
    // 3. Create transaction record

    // For now, simulate successful payment
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Add amount to wallet using atomic operation to prevent race conditions
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { wallet: amount } },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('USER_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('WALLET_CHARGED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        transactionId,
        amount,
        paymentMethod,
        newBalance: updatedUser.wallet,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Charge wallet error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Purchase premium membership
// @route   POST /api/payments/purchase-membership
// @access  Private
const purchaseMembership = async (req, res) => {
  try {
    const { subscriptionId, paymentMethod } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: errorMessageService.getMessage('USER_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Get subscription by ID
    const Subscription = require('../models/Subscription');
    const subscription = await Subscription.findOne({ _id: subscriptionId, isActive: true });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('SUBSCRIPTION_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    const selectedPlan = {
      price: subscription.price,
      duration: subscription.day
    };

    // Check payment method
    if (paymentMethod === 'wallet') {
      if (user.wallet < selectedPlan.price) {
        return res.status(400).json({
          success: false,
          message: errorMessageService.getMessage('INSUFFICIENT_WALLET_BALANCE', errorMessageService.getLocaleFromRequest(req)),
          required: selectedPlan.price,
          current: user.wallet
        });
      }
    }

    // Calculate expiration date
    const currentExpiry = user.membership?.expiresAt || new Date();
    const startDate = currentExpiry > new Date() ? currentExpiry : new Date();
    const expirationDate = new Date(startDate.getTime() + selectedPlan.duration * 24 * 60 * 60 * 1000);

    // Build update object
    const updateObj = {
      'membership.type': 'premium',
      'membership.expiresAt': expirationDate,
      'membership.purchasedAt': new Date()
    };

    // Add wallet deduction if paying with wallet
    if (paymentMethod === 'wallet') {
      updateObj.$inc = { wallet: -selectedPlan.price };
    }

    // Update user atomically
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      paymentMethod === 'wallet'
        ? {
          $set: {
            'membership.type': 'premium',
            'membership.expiresAt': expirationDate,
            'membership.purchasedAt': new Date()
          },
          $inc: { wallet: -selectedPlan.price }
        }
        : {
          $set: {
            'membership.type': 'premium',
            'membership.expiresAt': expirationDate,
            'membership.purchasedAt': new Date()
          }
        },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('USER_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    const transactionId = `membership_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('MEMBERSHIP_PURCHASED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        transactionId,
        subscriptionId,
        subscriptionName: subscription.name,
        price: selectedPlan.price,
        duration: selectedPlan.duration,
        expiresAt: expirationDate,
        remainingBalance: updatedUser.wallet,
        paymentMethod,
        membership: {
          type: updatedUser.membership.type,
          expiresAt: updatedUser.membership.expiresAt,
          purchasedAt: updatedUser.membership.purchasedAt
        }
      }
    });
  } catch (error) {
    console.error('Purchase membership error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Get payment transactions
// @route   GET /api/payments/transactions
// @access  Private
const getTransactions = async (req, res) => {
  try {
    // In a real implementation, you would fetch from a transactions collection
    // For now, return empty array
    res.status(200).json({
      success: true,
      data: {
        transactions: [],
        message: errorMessageService.getMessage('TRANSACTION_HISTORY_NOT_IMPLEMENTED', errorMessageService.getLocaleFromRequest(req))
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Get membership plans
// @route   GET /api/payments/membership-plans
// @access  Public
const getMembershipPlans = async (req, res) => {
  try {
    const Subscription = require('../models/Subscription');
    const language = req.query.lang || 'en';

    const subscriptions = await Subscription.find({ isActive: true })
      .select('name plan day price isActive')
      .sort({ day: 1 });

    const plans = subscriptions.map(subscription => ({
      id: subscription.plan,
      name: subscription.name,
      duration: subscription.day,
      price: subscription.price,
      currency: 'MNT',
      title: subscription.generateTitle(language),
      features: [
        'Access to all premium materials',
        'Unlimited calculations',
        'Premium idea content',
        'Priority support'
      ]
    }));

    res.status(200).json({
      success: true,
      data: {
        plans
      }
    });
  } catch (error) {
    console.error('Get membership plans error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Handle payment webhook
// @route   POST /api/payments/webhook
// @access  Public
const handleWebhook = async (req, res) => {
  try {
    // In a real implementation, you would:
    // 1. Verify webhook signature
    // 2. Process payment status updates
    // 3. Update user accounts accordingly

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('WEBHOOK_RECEIVED', errorMessageService.getLocaleFromRequest(req))
    });
  } catch (error) {
    console.error('Handle webhook error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Get transaction by ID
// @route   GET /api/payments/transaction/:id
// @access  Private
const getTransactionById = async (req, res) => {
  try {
    // In a real implementation, you would fetch specific transaction
    res.status(200).json({
      success: true,
      data: {
        transaction: null,
        message: errorMessageService.getMessage('TRANSACTION_DETAILS_NOT_IMPLEMENTED', errorMessageService.getLocaleFromRequest(req))
      }
    });
  } catch (error) {
    console.error('Get transaction by ID error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

module.exports = {
  chargeWallet,
  purchaseMembership,
  getTransactions,
  getMembershipPlans,
  handleWebhook,
  getTransactionById
};