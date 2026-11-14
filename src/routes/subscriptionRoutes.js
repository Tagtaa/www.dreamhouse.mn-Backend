const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { auth } = require('../middleware/auth');
const { 
  validateObjectId,
  handleValidationErrors 
} = require('../middleware/validation');

// @route   GET /api/subscriptions
// @desc    Get all active subscriptions
// @access  Private (User)
router.get('/', auth, subscriptionController.getActiveSubscriptions);

// @route   GET /api/subscriptions/public
// @desc    Active plans for the website /pricing page (name, length, price only)
// @access  Public
router.get('/public', subscriptionController.getActiveSubscriptions);

// @route   GET /api/subscriptions/:id
// @desc    Get active subscription by ID
// @access  Private (User)
router.get('/:id',
  auth,
  validateObjectId(),
  handleValidationErrors,
  subscriptionController.getActiveSubscriptionById
);

module.exports = router;
