const jwt = require('jsonwebtoken');
const User = require('../models/User');
const SmsVerification = require('../models/SmsVerification');
const errorMessageService = require('../services/errorMessageService');

// Generate JWT token
const generateToken = (userId, role) => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return jwt.sign({ userId, role }, jwtSecret, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return jwt.sign({ userId, type: 'refresh' }, jwtSecret, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d'
  });
};

// @desc    Generate and display SMS verification code (SMS Parser System)
// @route   POST /api/auth/send-code
// @access  Public
const sendVerificationCodeController = async (req, res) => {
  try {
    const { phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      const locale = errorMessageService.getLocaleFromRequest(req);
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('USER_ALREADY_EXISTS', locale)
      });
    }

    // Clean up expired verifications
    await SmsVerification.cleanupExpired();

    // Check recent verifications to prevent spam
    const recentVerification = await SmsVerification.findOne({
      phone,
      createdAt: { $gt: new Date(Date.now() - 60000) } // Last 1 minute
    });

    if (recentVerification) {
      return res.status(429).json({
        success: false,
        message: errorMessageService.getMessage('WAIT_BEFORE_CODE', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Generate verification code (5 digits)
    const generateVerificationCode = () => {
      return Math.floor(10000 + Math.random() * 90000).toString(); // 5 digit code
    };

    const verificationCode = generateVerificationCode();

    // Save verification to database
    const verification = new SmsVerification({
      phone,
      code: verificationCode,
      twilioSid: null, // Not using Twilio
      ipAddress: req.ip
    });

    await verification.save();

    // Get SMS Parser phone number from environment
    const smsParserPhone = process.env.SMS_PARSER_PHONE_NUMBER || '88367853';

    console.log(`📱 Generated OTP ${verificationCode} for ${phone}`);
    console.log(`📞 User should send this code to: ${smsParserPhone}`);

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('VERIFICATION_CODE_GENERATED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        otpCode: verificationCode,
        sendToNumber: smsParserPhone,
        instructions: `Send this OTP code via SMS to ${smsParserPhone} to confirm it. Phone verification will only be allowed after SMS confirmation.`,
        expiresIn: 5, // minutes
        phone: phone,
        requiresSmsConfirmation: true
      }
    });

  } catch (error) {
    console.error('Send verification error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Verify SMS code
// @route   POST /api/auth/verify-code
// @access  Public
const verifyCode = async (req, res) => {
  try {
    const { phone, code } = req.body;

    // Find valid verification with SMS parser confirmation
    const verification = await SmsVerification.findValidVerificationWithParserConfirmation(phone, code);

    if (!verification) {
      // Check if verification exists but not confirmed by SMS parser
      const unconfirmedVerification = await SmsVerification.findValidVerification(phone, code);

      if (unconfirmedVerification && !unconfirmedVerification.parserConfirmedAt) {
        return res.status(400).json({
          success: false,
          message: errorMessageService.getMessage('OTP_NOT_CONFIRMED', errorMessageService.getLocaleFromRequest(req)),
          code: 'OTP_NOT_CONFIRMED',
          data: {
            sendToNumber: process.env.SMS_PARSER_PHONE_NUMBER || '88367853',
            instructions: 'Send this OTP code via SMS to confirm it'
          }
        });
      }

      // Increment attempts for any existing verification
      const existingVerification = await SmsVerification.findOne({
        phone,
        isUsed: false,
        expiresAt: { $gt: new Date() }
      });

      if (existingVerification) {
        await existingVerification.incrementAttempts();
      }

      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('INVALID_EXPIRED_CODE', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Mark verification as used
    await verification.markAsUsed();

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('PHONE_VERIFIED', errorMessageService.getLocaleFromRequest(req))
    });

  } catch (error) {
    console.error('Verify code error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Register new user
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
  try {
    const { phone, username, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('USER_ALREADY_EXISTS', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Verify that phone was verified with SMS parser confirmation
    const verification = await SmsVerification.findOne({
      phone,
      isUsed: true,
      parserConfirmedAt: { $exists: true, $ne: null }, // SMS parser confirmation required
      createdAt: { $gt: new Date(Date.now() - 10 * 60 * 1000) } // Last 10 minutes
    });

    if (!verification) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('SMS_VERIFICATION_REQUIRED', errorMessageService.getLocaleFromRequest(req)),
        code: 'SMS_PARSER_VERIFICATION_REQUIRED'
      });
    }

    // Create new user
    const user = new User({
      phone,
      username,
      password,
      isVerified: true
    });

    await user.save();

    // Generate tokens
    const token = generateToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Calculate membership info properly
    const isPremium = user.isPremiumMember();
    const daysLeft = isPremium && user.membership.expiresAt
      ? Math.ceil((user.membership.expiresAt - new Date()) / (1000 * 60 * 60 * 24))
      : 0;

    res.status(201).json({
      success: true,
      message: errorMessageService.getMessage('USER_REGISTERED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        user: {
          id: user._id,
          phone: user.phone,
          username: user.username,
          membership: {
            type: user.membership.type,
            isPremium,
            expiresAt: user.membership.expiresAt,
            purchasedAt: user.membership.purchasedAt,
            daysLeft: Math.max(0, daysLeft)
          },
          wallet: user.wallet,
          isVerified: user.isVerified
        },
        token,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Find user
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: errorMessageService.getMessage('INVALID_CREDENTIALS', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: errorMessageService.getMessage('ACCOUNT_DEACTIVATED', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: errorMessageService.getMessage('INVALID_CREDENTIALS', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Generate tokens
    const token = generateToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Calculate membership info properly
    const isPremium = user.isPremiumMember();
    const daysLeft = isPremium && user.membership.expiresAt
      ? Math.ceil((user.membership.expiresAt - new Date()) / (1000 * 60 * 60 * 24))
      : 0;

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('LOGIN_SUCCESSFUL', errorMessageService.getLocaleFromRequest(req)),
      data: {
        user: {
          id: user._id,
          phone: user.phone,
          username: user.username,
          membership: {
            type: user.membership.type,
            isPremium,
            expiresAt: user.membership.expiresAt,
            purchasedAt: user.membership.purchasedAt,
            daysLeft: Math.max(0, daysLeft)
          },
          wallet: user.wallet,
          isVerified: user.isVerified,
          profileImage: user.profileImage
        },
        token,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: errorMessageService.getMessage('REFRESH_TOKEN_REQUIRED', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Verify refresh token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({
        success: false,
        message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
      });
    }
    const decoded = jwt.verify(refreshToken, jwtSecret);

    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: errorMessageService.getMessage('INVALID_REFRESH_TOKEN', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: errorMessageService.getMessage('USER_NOT_FOUND_INACTIVE', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Generate new tokens
    const newToken = generateToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id);

    res.status(200).json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: errorMessageService.getMessage('INVALID_EXPIRED_REFRESH_TOKEN', errorMessageService.getLocaleFromRequest(req))
      });
    }

    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    const token = req.token; // Token from auth middleware

    if (token) {
      // Decode token to get expiry time
      const decoded = jwt.decode(token);

      if (decoded && decoded.exp) {
        const now = Math.floor(Date.now() / 1000);
        const expirySeconds = decoded.exp - now;

        if (expirySeconds > 0) {
          // Blacklist the token
          const { blacklistToken, deleteSession, removeUserSession } = require('../config/redis');
          await blacklistToken(token, expirySeconds);

          // Delete session if exists
          if (decoded.sessionId) {
            await deleteSession(decoded.sessionId);
            await removeUserSession(decoded.userId, decoded.sessionId);
          }

          console.log('✅ User logged out successfully:', req.user.phone);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('LOGGED_OUT', errorMessageService.getLocaleFromRequest(req))
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Generate password reset code (SMS Parser System)
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { phone } = req.body;

    // Check if user exists
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('USER_NOT_FOUND_PHONE', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Clean up expired verifications
    await SmsVerification.cleanupExpired();

    // Check recent verifications to prevent spam
    const recentVerification = await SmsVerification.findOne({
      phone,
      createdAt: { $gt: new Date(Date.now() - 60000) } // Last 1 minute
    });

    if (recentVerification) {
      return res.status(429).json({
        success: false,
        message: errorMessageService.getMessage('WAIT_BEFORE_CODE', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Generate verification code (5 digits)
    const generateVerificationCode = () => {
      return Math.floor(10000 + Math.random() * 90000).toString(); // 5 digit code
    };

    const verificationCode = generateVerificationCode();

    // Save verification to database
    const verification = new SmsVerification({
      phone,
      code: verificationCode,
      twilioSid: null, // Not using Twilio
      ipAddress: req.ip
    });

    await verification.save();

    // Get SMS Parser phone number from environment
    const smsParserPhone = process.env.SMS_PARSER_PHONE_NUMBER || '88367853';

    console.log(`🔐 Generated password reset OTP ${verificationCode} for ${phone}`);
    console.log(`📞 User should send this code to: ${smsParserPhone}`);

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('PASSWORD_RESET_CODE_GENERATED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        otpCode: verificationCode,
        sendToNumber: smsParserPhone,
        instructions: `Send this OTP code via SMS to ${smsParserPhone} to confirm it. Password reset will only be allowed after SMS confirmation.`,
        expiresIn: 5, // minutes
        phone: phone,
        requiresSmsConfirmation: true
      }
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { phone, code, password } = req.body;

    // Find valid verification with SMS parser confirmation
    const verification = await SmsVerification.findOne({
      phone,
      code,
      parserConfirmedAt: { $exists: true, $ne: null }, // SMS parser confirmation required
      expiresAt: { $gt: new Date() },
      attempts: { $lt: 3 }
    });

    if (!verification) {
      // Check if verification exists but not confirmed by SMS parser
      const unconfirmedVerification = await SmsVerification.findOne({
        phone,
        code,
        expiresAt: { $gt: new Date() },
        attempts: { $lt: 3 }
      });

      if (unconfirmedVerification && !unconfirmedVerification.parserConfirmedAt) {
        return res.status(400).json({
          success: false,
          message: errorMessageService.getMessage('OTP_NOT_CONFIRMED', errorMessageService.getLocaleFromRequest(req)),
          code: 'OTP_NOT_CONFIRMED',
          data: {
            sendToNumber: process.env.SMS_PARSER_PHONE_NUMBER || '88367853',
            instructions: 'Send this OTP code via SMS to confirm it'
          }
        });
      }

      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('INVALID_EXPIRED_CODE', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Find user
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('USER_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Update password
    user.password = password;
    await user.save();

    // Mark verification as used
    await verification.markAsUsed();

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('PASSWORD_RESET_SUCCESSFUL', errorMessageService.getLocaleFromRequest(req))
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    res.status(200).json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Create admin user (no SMS verification)
// @route   POST /api/auth/create-admin
// @access  Private (SuperAdmin only)
const createAdmin = async (req, res) => {
  try {
    // Check if user is authenticated and is superadmin
    if (!req.user) {
      const locale = errorMessageService.getLocaleFromRequest(req);
      return res.status(401).json({
        success: false,
        message: errorMessageService.getMessage('UNAUTHORIZED', locale)
      });
    }

    if (req.user.role !== 'superadmin') {
      const locale = errorMessageService.getLocaleFromRequest(req);
      return res.status(403).json({
        success: false,
        message: errorMessageService.getMessage('ADMIN_REQUIRED', locale),
        code: 'SUPERADMIN_REQUIRED'
      });
    }

    const { phone, username, password, role = 'admin' } = req.body;

    // Validate role
    const adminRoles = ['superadmin', 'admin', 'operator'];
    if (!adminRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('INVALID_ROLE_SUPERADMIN', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('USER_ALREADY_EXISTS', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Create new admin user
    const user = new User({
      phone,
      username,
      password,
      role,
      isVerified: true,
      isAdmin: ['superadmin', 'admin'].includes(role)
    });

    await user.save();

    // Generate tokens
    const token = generateToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.status(201).json({
      success: true,
      message: errorMessageService.getMessage('ADMIN_USER_CREATED_SUCCESS', errorMessageService.getLocaleFromRequest(req)),
      data: {
        user: {
          id: user._id,
          phone: user.phone,
          username: user.username,
          role: user.role,
          isAdmin: user.isAdmin,
          isVerified: user.isVerified
        },
        token,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

module.exports = {
  sendVerificationCode: sendVerificationCodeController,
  verifyCode,
  signup,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  createAdmin
};