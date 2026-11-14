const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { auth } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

// @route   POST /api/payments/charge-wallet
// @desc    Charge user wallet
// @access  Private
router.post('/charge-wallet',
  auth,
  [
    body('amount')
      .isFloat({ min: 1000 })
      .withMessage('Minimum charge amount is 1000 MNT'),
    body('paymentMethod')
      .isIn(['bank_transfer', 'qpay', 'most_money'])
      .withMessage('Invalid payment method')
  ],
  handleValidationErrors,
  paymentController.chargeWallet
);

// @route   POST /api/payments/purchase-membership
// @desc    Purchase premium membership
// @access  Private
router.post('/purchase-membership',
  auth,
  [
    body('subscriptionId')
      .isMongoId()
      .withMessage('Invalid subscription ID'),
    body('paymentMethod')
      .isIn(['wallet', 'bank_transfer', 'qpay', 'most_money'])
      .withMessage('Invalid payment method')
  ],
  handleValidationErrors,
  paymentController.purchaseMembership
);

// @route   GET /api/payments/transactions
// @desc    Get payment transactions
// @access  Private
router.get('/transactions', auth, paymentController.getTransactions);

// @route   GET /api/payments/membership-plans
// @desc    Get available membership plans
// @access  Public
router.get('/membership-plans', paymentController.getMembershipPlans);

// @route   POST /api/payments/webhook
// @desc    Handle payment webhook
// @access  Public
router.post('/webhook', paymentController.handleWebhook);

// @route   GET /api/payments/transaction/:id
// @desc    Get transaction details
// @access  Private
router.get('/transaction/:id', auth, paymentController.getTransactionById);

module.exports = router; 