/**
 * CSRF Protection Middleware
 * 
 * Protects against Cross-Site Request Forgery attacks
 * Uses double submit cookie pattern for stateless CSRF protection
 */

const crypto = require('crypto');
const errorMessageService = require('../services/errorMessageService');

// Generate CSRF token
const generateCsrfToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Verify CSRF token
const verifyCsrfToken = (token, cookieToken) => {
  if (!token || !cookieToken) {
    return false;
  }
  
  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(cookieToken)
    );
  } catch (error) {
    return false;
  }
};

// CSRF Protection Middleware
const csrfProtection = (req, res, next) => {
  // Skip CSRF check for:
  // 1. GET, HEAD, OPTIONS requests (safe methods)
  // 2. Webhook endpoints (they use API keys)
  // 3. Mobile/API clients (check User-Agent or custom header)
  // 4. Multipart/form-data requests (handled by multer, token checked after parsing)
  // 5. Development mode (optional)
  
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  const isWebhook = req.path.includes('/webhook') || req.path.includes('/sms-parser');
  const isMobileApp = req.headers['user-agent']?.includes('Dart') || 
                      req.headers['user-agent']?.includes('okhttp') ||
                      req.headers['x-client-type'] === 'mobile';
  const isMultipart = req.headers['content-type']?.includes('multipart/form-data');
  
  if (safeMethods.includes(req.method) || isWebhook || isMobileApp || isMultipart) {
    return next();
  }

  if (process.env.CSRF_ENABLED === 'false') {
    return next();
  }

  // Get CSRF token from header or body
  const csrfToken = req.headers['x-csrf-token'] || req.body._csrf;
  const csrfCookie = req.cookies['csrf-token'];

  // Verify token
  if (!verifyCsrfToken(csrfToken, csrfCookie)) {
    console.warn('⚠️  CSRF token validation failed:', {
      method: req.method,
      path: req.path,
      hasToken: !!csrfToken,
      hasCookie: !!csrfCookie
    });

    return res.status(403).json({
      success: false,
      message: errorMessageService.getMessage('INVALID_CSRF_TOKEN', errorMessageService.getLocaleFromRequest(req)),
      code: 'CSRF_TOKEN_INVALID'
    });
  }

  next();
};

// Middleware to generate and set CSRF token
const setCsrfToken = (req, res, next) => {
  // Generate new CSRF token if not exists
  if (!req.cookies['csrf-token']) {
    const token = generateCsrfToken();
    
    // Set cookie with secure options
    res.cookie('csrf-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    // Also send in response header for client to read
    res.setHeader('X-CSRF-Token', token);
  }

  next();
};

// Endpoint to get CSRF token
const getCsrfToken = (req, res) => {
  const token = req.cookies['csrf-token'] || generateCsrfToken();
  
  if (!req.cookies['csrf-token']) {
    res.cookie('csrf-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });
  }

  res.json({
    success: true,
    data: {
      csrfToken: token
    }
  });
};

module.exports = {
  csrfProtection,
  setCsrfToken,
  getCsrfToken,
  generateCsrfToken,
  verifyCsrfToken
};

