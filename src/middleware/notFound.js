const errorMessageService = require('../services/errorMessageService');

const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: errorMessageService.getMessage('ROUTE_NOT_FOUND', errorMessageService.getLocaleFromRequest(req), { url: req.originalUrl }),
    availableRoutes: [
      'GET /health',
      'POST /api/auth/send-code',
      'POST /api/auth/verify-code',
      'POST /api/auth/signup',
      'POST /api/auth/login',
      'GET /api/user/profile',
      'GET /api/materials',
      'GET /api/ideas',
      'GET /api/calculations/history'
    ]
  });
};

module.exports = { notFound }; 