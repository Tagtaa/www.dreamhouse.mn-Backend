const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { 
  validatePhone, 
  validateSmsCode, 
  validatePassword, 
  validateUsername,
  handleValidationErrors 
} = require('../middleware/validation');
const { auth, roleCheck } = require('../middleware/auth');
const adminAuthController = require('../controllers/adminAuthController');

// @route   POST /api/auth/send-code
// @desc    Send SMS verification code
// @access  Public
router.post('/send-code', 
  validatePhone(),
  handleValidationErrors,
  authController.sendVerificationCode
);

// @route   POST /api/auth/verify-code
// @desc    Verify SMS code
// @access  Public
router.post('/verify-code',
  validatePhone(),
  validateSmsCode(),
  handleValidationErrors,
  authController.verifyCode
);

// @route   POST /api/auth/signup
// @desc    Register new user
// @access  Public
router.post('/signup',
  validatePhone(),
  validateUsername(),
  validatePassword(),
  handleValidationErrors,
  authController.signup
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login',
  validatePhone(),
  validatePassword(),
  handleValidationErrors,
  authController.login
);

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post('/refresh', authController.refreshToken);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', auth, authController.logout);

// @route   POST /api/auth/forgot-password
// @desc    Send password reset code
// @access  Public
router.post('/forgot-password',
  validatePhone(),
  handleValidationErrors,
  authController.forgotPassword
);

// @route   POST /api/auth/reset-password
// @desc    Reset password with code
// @access  Public
router.post('/reset-password',
  validatePhone(),
  validateSmsCode(),
  validatePassword(),
  handleValidationErrors,
  authController.resetPassword
);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, authController.getCurrentUser);

// @route   POST /api/auth/create-admin
// @desc    Legacy alias — creates a dashboard account in the admins collection.
//          Prefer POST /api/admin-auth/admins.
// @access  Private (SuperAdmin only)
router.post('/create-admin',
  auth,
  roleCheck(['superadmin']),
  adminAuthController.createAdmin
);

module.exports = router; 