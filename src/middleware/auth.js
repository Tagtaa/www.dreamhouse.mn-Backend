const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');
const errorMessageService = require('../services/errorMessageService');
const { isTokenBlacklisted, updateSessionActivity } = require('../config/redis');

const ADMIN_ROLES = Admin.ADMIN_ROLES;

// Tokens issued by /api/admin-auth carry accountType: 'admin' and resolve
// against the `admins` collection; every other token resolves against `users`.
const loadAccount = (decoded) => {
  if (decoded.accountType === 'admin') {
    return Admin.findById(decoded.userId).select('-password');
  }
  return User.findById(decoded.userId).select('-password');
};

const isAdminAccount = (req) => req.accountType === 'admin';

// App users can never act with admin privileges, even if an old record in
// `users` still carries an admin role. In-memory only; not persisted here.
const stripLegacyAdminRole = (user) => {
  if (!user) return user;
  if (ADMIN_ROLES.includes(user.role)) user.role = 'user';
  user.isAdmin = false;
  return user;
};

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      const locale = errorMessageService.getLocaleFromRequest(req);
      return res.status(401).json({
        success: false,
        message: errorMessageService.getMessage('UNAUTHORIZED', locale)
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      const locale = errorMessageService.getLocaleFromRequest(req);
      return res.status(401).json({
        success: false,
        message: errorMessageService.getMessage('UNAUTHORIZED', locale)
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      const locale = errorMessageService.getLocaleFromRequest(req);
      return res.status(500).json({
        success: false,
        message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', locale)
      });
    }

    // Check if token is blacklisted (logout/revoked)
    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
      const locale = errorMessageService.getLocaleFromRequest(req);
      return res.status(401).json({
        success: false,
        message: errorMessageService.getMessage('TOKEN_EXPIRED', locale),
        code: 'TOKEN_REVOKED'
      });
    }

    const decoded = jwt.verify(token, jwtSecret);

    const user = await loadAccount(decoded);

    if (!user) {
      const locale = errorMessageService.getLocaleFromRequest(req);
      return res.status(401).json({
        success: false,
        message: errorMessageService.getMessage('USER_NOT_FOUND', locale)
      });
    }

    if (!user.isActive) {
      const locale = errorMessageService.getLocaleFromRequest(req);
      return res.status(401).json({
        success: false,
        message: errorMessageService.getMessage('ACCOUNT_DEACTIVATED', locale)
      });
    }

    if (user.isBanned) {
      const locale = errorMessageService.getLocaleFromRequest(req);
      return res.status(403).json({
        success: false,
        message: errorMessageService.getMessage('USER_BANNED', locale),
        code: 'ACCOUNT_BANNED'
      });
    }

    req.accountType = decoded.accountType === 'admin' ? 'admin' : 'user';
    req.user = req.accountType === 'admin' ? user : stripLegacyAdminRole(user);
    req.token = token; // Store token for potential blacklisting
    
    // Update session activity (if Redis is available)
    if (decoded.sessionId) {
      await updateSessionActivity(decoded.sessionId, 86400); // 24 hours
    }
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      const locale = errorMessageService.getLocaleFromRequest(req);
      return res.status(401).json({
        success: false,
        message: errorMessageService.getMessage('INVALID_TOKEN', locale)
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      const locale = errorMessageService.getLocaleFromRequest(req);
      return res.status(401).json({
        success: false,
        message: errorMessageService.getMessage('TOKEN_EXPIRED', locale)
      });
    }

    const locale = errorMessageService.getLocaleFromRequest(req);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', locale)
    });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      req.user = null;
      return next();
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      req.user = null;
      return next();
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      req.user = null;
      return next();
    }
    const decoded = jwt.verify(token, jwtSecret);
    const user = await loadAccount(decoded);

    req.accountType = user && decoded.accountType === 'admin' ? 'admin' : 'user';
    req.user = user && user.isActive !== false
      ? (req.accountType === 'admin' ? user : stripLegacyAdminRole(user))
      : null;
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

const premium = async (req, res, next) => {
  try {
    if (!req.user) {
      const locale = errorMessageService.getLocaleFromRequest(req);
      return res.status(401).json({
        success: false,
        message: errorMessageService.getMessage('UNAUTHORIZED', locale)
      });
    }

    if (!req.user.isPremiumMember()) {
      const locale = errorMessageService.getLocaleFromRequest(req);
      return res.status(403).json({
        success: false,
        message: errorMessageService.getMessage('PREMIUM_REQUIRED', locale),
        code: 'PREMIUM_REQUIRED'
      });
    }

    next();
  } catch (error) {
    const locale = errorMessageService.getLocaleFromRequest(req);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', locale)
    });
  }
};

const admin = async (req, res, next) => {
  try {
    // First check if authentication middleware has run
    if (!req.user) {
      const locale = errorMessageService.getLocaleFromRequest(req);
      return res.status(401).json({
        success: false,
        message: errorMessageService.getMessage('UNAUTHORIZED', locale),
        code: 'AUTH_REQUIRED'
      });
    }

    // Must be a dashboard account (admins collection) with an admin role
    if (!isAdminAccount(req) || !ADMIN_ROLES.includes(req.user.role)) {
      const locale = errorMessageService.getLocaleFromRequest(req);
      return res.status(403).json({
        success: false,
        message: errorMessageService.getMessage('ADMIN_REQUIRED', locale),
        code: 'ADMIN_REQUIRED'
      });
    }

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    const locale = errorMessageService.getLocaleFromRequest(req);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', locale)
    });
  }
};

const moderator = async (req, res, next) => {
  try {
    // First check if authentication middleware has run
    if (!req.user) {
      const locale = errorMessageService.getLocaleFromRequest(req);
      return res.status(401).json({
        success: false,
        message: errorMessageService.getMessage('UNAUTHORIZED', locale),
        code: 'AUTH_REQUIRED'
      });
    }

    // Check if user has moderator or admin privileges
    if (!['moderator', 'admin'].includes(req.user.role)) {
      const locale = errorMessageService.getLocaleFromRequest(req);
      return res.status(403).json({
        success: false,
        message: errorMessageService.getMessage('ADMIN_REQUIRED', locale),
        code: 'MODERATOR_REQUIRED'
      });
    }

    next();
  } catch (error) {
    console.error('Moderator middleware error:', error);
    const locale = errorMessageService.getLocaleFromRequest(req);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', locale)
    });
  }
};

const roleCheck = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      // First check if authentication middleware has run
      if (!req.user) {
        const locale = errorMessageService.getLocaleFromRequest(req);
        return res.status(401).json({
          success: false,
          message: errorMessageService.getMessage('UNAUTHORIZED', locale),
          code: 'AUTH_REQUIRED'
        });
      }

      // Admin roles are only honoured on dashboard accounts (admins collection)
      const needsAdminAccount = allowedRoles.some(role => ADMIN_ROLES.includes(role));
      if (!allowedRoles.includes(req.user.role) || (needsAdminAccount && !isAdminAccount(req))) {
        const locale = errorMessageService.getLocaleFromRequest(req);
        return res.status(403).json({
          success: false,
          message: errorMessageService.getMessage('ADMIN_REQUIRED', locale),
          code: 'ROLE_REQUIRED'
        });
      }

      next();
    } catch (error) {
      console.error('Role check middleware error:', error);
      const locale = errorMessageService.getLocaleFromRequest(req);
      res.status(500).json({
        success: false,
        message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', locale)
      });
    }
  };
};

module.exports = {
  auth,
  optionalAuth,
  premium,
  admin,
  moderator,
  roleCheck,
  isAdminAccount
}; 