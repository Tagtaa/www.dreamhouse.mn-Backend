const errorMessageService = require('../services/errorMessageService');

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Locale'i request'ten al
  const locale = errorMessageService.getLocaleFromRequest(req);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(error => ({
      field: error.path,
      message: errorMessageService.localizeValidationError(error, locale)
    }));
    
    return res.status(400).json({
      success: false,
      message: errorMessageService.getMessage('VALIDATION_ERROR', locale),
      errors
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    
    // Hassas bilgileri gizle
    const safeFieldNames = {
      'phone': 'Phone number',
      'email': 'Email address',
      'username': 'Username'
    };
    
    const fieldName = safeFieldNames[field] || 'This field';
    
    return res.status(400).json({
      success: false,
      message: errorMessageService.getMessage('DUPLICATE_ENTRY', locale),
      code: 'DUPLICATE_ENTRY'
    });
  }

  // Mongoose cast error
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: errorMessageService.getMessage('INVALID_ID_FORMAT', locale)
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: errorMessageService.getMessage('INVALID_TOKEN', locale)
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: errorMessageService.getMessage('TOKEN_EXPIRED', locale)
    });
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: errorMessageService.getMessage('FILE_TOO_LARGE', locale),
      code: 'FILE_TOO_LARGE'
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: errorMessageService.getMessage('INVALID_FILE_FIELD', locale),
      code: 'INVALID_FILE_FIELD'
    });
  }

  // Multer custom errors (image validation)
  if (err.message === 'Only image files are allowed') {
    return res.status(400).json({
      success: false,
      message: errorMessageService.getMessage('INVALID_FILE_TYPE', locale),
      code: 'INVALID_FILE_TYPE'
    });
  }

  // Default error - Hide sensitive information
  const statusCode = err.statusCode || 500;
  
  // Hide sensitive information in production
  let safeMessage = errorMessageService.getMessage('INTERNAL_SERVER_ERROR', locale);
  
  if (process.env.NODE_ENV === 'development') {
    // Provide more detailed information in development but still secure
    safeMessage = err.message || errorMessageService.getMessage('INTERNAL_SERVER_ERROR', locale);
    
    // Hide sensitive paths and system information
    safeMessage = safeMessage.replace(/\/Users\/.*?\//, '/path/to/project/');
    safeMessage = safeMessage.replace(/\/home\/.*?\//, '/path/to/project/');
    safeMessage = safeMessage.replace(/mongodb:\/\/.*?@/, 'mongodb://***:***@');
    safeMessage = safeMessage.replace(/password.*?['"]/gi, 'password: "***"');
  }

  const errorResponse = {
    success: false,
    message: safeMessage,
    code: 'INTERNAL_ERROR'
  };

  // Add stack trace in development but make it secure
  if (process.env.NODE_ENV === 'development' && err.stack) {
    let safeStack = err.stack;
    safeStack = safeStack.replace(/\/Users\/.*?\//, '/path/to/project/');
    safeStack = safeStack.replace(/\/home\/.*?\//, '/path/to/project/');
    errorResponse.stack = safeStack;
  }

  res.status(statusCode).json(errorResponse);
};

module.exports = { errorHandler }; 