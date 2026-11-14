const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth } = require('../middleware/auth');
const { 
  validateUsername,
  validateObjectId,
  handleValidationErrors 
} = require('../middleware/validation');

// @route   GET /api/user/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, userController.getProfile);

// @route   PUT /api/user/profile
// @desc    Update user profile
// @access  Private
router.put('/profile',
  auth,
  validateUsername(),
  handleValidationErrors,
  userController.updateProfile
);

// @route   PUT /api/user/account-info
// @desc    Update user email and username
// @access  Private
router.put('/account-info', 
  auth,
  validateUsername(),
  handleValidationErrors,
  userController.updateAccountInfo
);

// @route   GET /api/user/calculations
// @desc    Get user's calculation history
// @access  Private
router.get('/calculations', auth, userController.getCalculations);

// @route   GET /api/user/purchased-ideas
// @desc    Get user's purchased ideas
// @access  Private
router.get('/purchased-ideas', auth, userController.getPurchasedIdeas);

// @route   GET /api/user/wallet
// @desc    Get wallet information
// @access  Private
router.get('/wallet', auth, userController.getWallet);

// @route   GET /api/user/membership
// @desc    Get membership information
// @access  Private
router.get('/membership', auth, userController.getMembership);

// @route   DELETE /api/user/account
// @desc    Delete user account
// @access  Private
router.delete('/account', auth, userController.deleteAccount);

// @route   POST /api/user/upload-avatar
// @desc    Upload profile avatar
// @access  Private
router.post('/upload-avatar', auth, userController.upload.single('avatar'), userController.uploadUserAvatar);

// @route   GET /api/user/avatar
// @desc    Get profile avatar
// @access  Private
router.get('/avatar', auth, userController.getUserAvatar);

// @route   DELETE /api/user/avatar
// @desc    Delete profile avatar
// @access  Private
router.delete('/avatar', auth, userController.deleteUserAvatar);

module.exports = router; 