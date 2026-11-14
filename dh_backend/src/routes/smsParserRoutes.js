const express = require('express');
const router = express.Router();
const smsParserController = require('../controllers/smsParserController');
const { auth, admin } = require('../middleware/auth');
const { body, query, param } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');
const errorMessageService = require('../services/errorMessageService');

// SMS Parser API Key middleware (for webhook security)
const validateSmsParserApiKey = (req, res, next) => {
  const apiKey = req.header('X-SMS-Parser-API-Key');
  const expectedApiKey = process.env.SMS_PARSER_API_KEY;

  console.log('🔑 API Key validation:', { apiKey, expectedApiKey, hasApiKey: !!apiKey });

  // In production, API key is mandatory
  if (process.env.NODE_ENV === 'production' && !expectedApiKey) {
    console.error('❌ SMS_PARSER_API_KEY not configured in production');
    return res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('SMS_PARSER_API_KEY_NOT_CONFIGURED', errorMessageService.getLocaleFromRequest(req))
    });
  }

  // Allow in development if not configured
  if (!expectedApiKey) {
    console.warn('⚠️  SMS_PARSER_API_KEY not configured - allowing in development mode');
    return next();
  }

  if (!apiKey || apiKey !== expectedApiKey) {
    console.log('❌ API Key validation failed');
    return res.status(401).json({
      success: false,
      message: errorMessageService.getMessage('INVALID_SMS_PARSER_API_KEY', errorMessageService.getLocaleFromRequest(req))
    });
  }

  console.log('✅ API Key validation passed');
  next();
};

// @route   POST /api/sms-parser/verify-otp
// @desc    Handle OTP verification from SMS Parser App
// @access  Public (with API key)
router.post('/verify-otp',
  validateSmsParserApiKey,
  [
    body('phoneNumber')
      .matches(/^\+976[0-9]{8}$/)
      .withMessage('Phone number must be in Mongolia format (+976XXXXXXXX)'),
    body('otpCode')
      .isLength({ min: 5, max: 5 })
      .isNumeric()
      .withMessage('OTP code must be exactly 5 digits'),
    body('smsContent')
      .notEmpty()
      .withMessage('SMS content is required'),
    body('smsTimestamp')
      .optional()
      .isISO8601()
      .withMessage('SMS timestamp must be a valid ISO 8601 date'),
    body('parserAppVersion')
      .optional()
      .isString()
      .withMessage('Parser app version must be a string')
  ],
  handleValidationErrors,
  smsParserController.handleOtpVerification
);

// @route   POST /api/sms-parser/bank-transaction
// @desc    Handle bank SMS parsing for wallet recharge
// @access  Public (with API key)
router.post('/bank-transaction',
  validateSmsParserApiKey,
  [
    body('smsContent')
      .notEmpty()
      .withMessage('SMS content is required'),
    body('phoneNumber')
      .matches(/^\+976[0-9]{8}$/)
      .withMessage('Phone number must be in Mongolia format (+976XXXXXXXX)'),
    body('amount')
      .isFloat({ min: 1 })
      .withMessage('Amount must be a positive number'),
    body('bankName')
      .notEmpty()
      .isLength({ min: 2, max: 50 })
      .withMessage('Bank name is required (2-50 characters)'),
    body('transactionNote')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage('Transaction note must be less than 500 characters'),
    body('smsTimestamp')
      .optional()
      .isISO8601()
      .withMessage('SMS timestamp must be a valid ISO 8601 date'),
    body('parserAppVersion')
      .optional()
      .isString()
      .withMessage('Parser app version must be a string')
  ],
  handleValidationErrors,
  smsParserController.handleBankTransaction
);

// @route   GET /api/sms-parser/transactions
// @desc    Get bank transaction history (Admin only)
// @access  Private (Admin)
router.get('/transactions',
  auth,
  admin,
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('isProcessed')
      .optional()
      .isIn(['true', 'false'])
      .withMessage('isProcessed must be true or false'),
    query('phoneNumber')
      .optional()
      .matches(/^\+976[0-9]{8}$/)
      .withMessage('Phone number must be in Mongolia format'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date')
  ],
  handleValidationErrors,
  smsParserController.getBankTransactions
);

// @route   POST /api/sms-parser/transactions/:id/retry
// @desc    Retry failed bank transaction (Admin only)
// @access  Private (Admin)
router.post('/transactions/:id/retry',
  auth,
  admin,
  smsParserController.retryBankTransaction
);

// @route   GET /api/sms-parser/responses/stats
// @desc    Get SMS Parser response statistics
// @access  Public (with SMS Parser API key)
router.get('/responses/stats',
  validateSmsParserApiKey,
  [
    query('endpoint')
      .optional()
      .isIn(['verify-otp', 'bank-transaction', 'parse-sms', 'validate-phone'])
      .withMessage('Invalid endpoint'),
    query('isSuccess')
      .optional()
      .isIn(['true', 'false'])
      .withMessage('isSuccess must be true or false'),
    query('statusCode')
      .optional()
      .isInt({ min: 100, max: 599 })
      .withMessage('Status code must be between 100 and 599'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date')
  ],
  handleValidationErrors,
  smsParserController.getResponseStats
);

// @route   GET /api/sms-parser/responses/errors
// @desc    Get SMS Parser error summary
// @access  Public (with SMS Parser API key)
router.get('/responses/errors',
  validateSmsParserApiKey,
  [
    query('days')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('Days must be between 1 and 365')
  ],
  handleValidationErrors,
  smsParserController.getErrorSummary
);

// @route   GET /api/sms-parser/responses
// @desc    Get SMS Parser responses with pagination
// @access  Public (with SMS Parser API key)
router.get('/responses',
  validateSmsParserApiKey,
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('endpoint')
      .optional()
      .isIn(['verify-otp', 'bank-transaction', 'parse-sms', 'validate-phone'])
      .withMessage('Invalid endpoint'),
    query('isSuccess')
      .optional()
      .isIn(['true', 'false'])
      .withMessage('isSuccess must be true or false'),
    query('statusCode')
      .optional()
      .isInt({ min: 100, max: 599 })
      .withMessage('Status code must be between 100 and 599'),
    query('phoneNumber')
      .optional()
      .matches(/^\+976[0-9]{8}$/)
      .withMessage('Phone number must be in Mongolia format'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date')
  ],
  handleValidationErrors,
  smsParserController.getResponses
);

// @route   POST /api/sms-parser/responses/cleanup
// @desc    Cleanup old SMS Parser responses
// @access  Public (with SMS Parser API key)
router.post('/responses/cleanup',
  validateSmsParserApiKey,
  [
    body('days')
      .optional()
      .isInt({ min: 0, max: 365 })
      .withMessage('Days must be between 0 and 365')
  ],
  handleValidationErrors,
  smsParserController.cleanupOldResponses
);

// @route   DELETE /api/sms-parser/responses/:id
// @desc    Delete single SMS Parser response
// @access  Public (with SMS Parser API key)
router.delete('/responses/:id',
  validateSmsParserApiKey,
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid response ID format')
  ],
  handleValidationErrors,
  smsParserController.deleteResponse
);

// @route   DELETE /api/sms-parser/responses
// @desc    Delete multiple SMS Parser responses
// @access  Public (with SMS Parser API key)
router.delete('/responses',
  validateSmsParserApiKey,
  [
    body('ids')
      .optional()
      .isArray()
      .withMessage('IDs must be an array'),
    body('ids.*')
      .optional()
      .isMongoId()
      .withMessage('Each ID must be a valid MongoDB ObjectId'),
    body('endpoint')
      .optional()
      .isIn(['verify-otp', 'bank-transaction', 'parse-sms', 'validate-phone'])
      .withMessage('Invalid endpoint'),
    body('isSuccess')
      .optional()
      .isBoolean()
      .withMessage('isSuccess must be a boolean'),
    body('statusCode')
      .optional()
      .isInt({ min: 100, max: 599 })
      .withMessage('Status code must be between 100 and 599'),
    body('phoneNumber')
      .optional()
      .matches(/^\+976[0-9]{8}$/)
      .withMessage('Phone number must be in Mongolia format'),
    body('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    body('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date'),
    body('days')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('Days must be between 1 and 365')
  ],
  handleValidationErrors,
  smsParserController.deleteMultipleResponses
);

module.exports = router;