const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const errorMessageService = require('../services/errorMessageService');
const roleService = require('../services/roleService');

// Admin profile + the permissions of their role (the dashboard shows/hides pages and actions with it)
const withPermissions = async (admin) => ({
  ...admin.toSafeJSON(),
  permissions: await roleService.getPermissions(admin.role)
});
const { logout: sharedLogout } = require('./authController');

const locale = (req) => errorMessageService.getLocaleFromRequest(req);
const msg = (req, key, params) => errorMessageService.getMessage(key, locale(req), params);

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is required');
  return secret;
};

// accountType: 'admin' makes the auth middleware resolve against `admins`
const generateAdminToken = (admin) =>
  jwt.sign({ userId: admin._id, role: admin.role, accountType: 'admin' }, getSecret(), {
    expiresIn: process.env.ADMIN_JWT_EXPIRE || process.env.JWT_EXPIRE || '7d'
  });

const generateAdminRefreshToken = (admin) =>
  jwt.sign({ userId: admin._id, type: 'refresh', accountType: 'admin' }, getSecret(), {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d'
  });

const MIN_PASSWORD_LENGTH = 4;

// @desc    Dashboard login
// @route   POST /api/admin-auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ success: false, message: msg(req, 'INVALID_CREDENTIALS') });
    }

    const admin = await Admin.findOne({ phone: String(phone).trim() });
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ success: false, message: msg(req, 'INVALID_CREDENTIALS') });
    }

    if (!admin.isActive) {
      return res.status(401).json({ success: false, message: msg(req, 'ACCOUNT_DEACTIVATED') });
    }

    admin.lastLogin = new Date();
    await admin.save();

    res.status(200).json({
      success: true,
      message: msg(req, 'LOGIN_SUCCESSFUL'),
      data: {
        user: await withPermissions(admin),
        token: generateAdminToken(admin),
        refreshToken: generateAdminRefreshToken(admin)
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, message: msg(req, 'INTERNAL_SERVER_ERROR') });
  }
};

// @desc    Refresh dashboard token
// @route   POST /api/admin-auth/refresh
// @access  Public (requires admin refresh token)
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      return res.status(401).json({ success: false, message: msg(req, 'REFRESH_TOKEN_REQUIRED') });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, getSecret());
    } catch (e) {
      return res.status(401).json({ success: false, message: msg(req, 'INVALID_REFRESH_TOKEN') });
    }

    if (decoded.type !== 'refresh' || decoded.accountType !== 'admin') {
      return res.status(401).json({ success: false, message: msg(req, 'INVALID_REFRESH_TOKEN') });
    }

    const admin = await Admin.findById(decoded.userId);
    if (!admin || !admin.isActive) {
      return res.status(401).json({ success: false, message: msg(req, 'USER_NOT_FOUND_INACTIVE') });
    }

    res.status(200).json({
      success: true,
      data: {
        token: generateAdminToken(admin),
        refreshToken: generateAdminRefreshToken(admin)
      }
    });
  } catch (error) {
    console.error('Admin refresh token error:', error);
    res.status(500).json({ success: false, message: msg(req, 'INTERNAL_SERVER_ERROR') });
  }
};

// @desc    Current dashboard account
// @route   GET /api/admin-auth/me
// @access  Admin
const getMe = async (req, res) => {
  res.status(200).json({ success: true, data: { user: await withPermissions(req.user) } });
};

// @desc    Update own username / email
// @route   PUT /api/admin-auth/profile
// @access  Admin
const updateProfile = async (req, res) => {
  try {
    const { username, email, language } = req.body;
    if (language !== undefined && !['mn', 'en'].includes(language)) {
      return res.status(400).json({ success: false, message: 'Language must be mn or en' });
    }
    const admin = await Admin.findById(req.user._id);
    if (!admin) {
      return res.status(404).json({ success: false, message: msg(req, 'USER_NOT_FOUND') });
    }

    if (username !== undefined) admin.username = String(username).trim();
    if (email !== undefined) admin.email = email ? String(email).trim() : undefined;
    if (language !== undefined) admin.language = language;
    await admin.save();

    res.status(200).json({
      success: true,
      message: msg(req, 'ADMIN_UPDATED_SUCCESS'),
      data: { user: admin.toSafeJSON() }
    });
  } catch (error) {
    console.error('Admin update profile error:', error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ success: false, message: msg(req, 'FIELD_ALREADY_EXISTS', { field }) });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: msg(req, 'INTERNAL_SERVER_ERROR') });
  }
};

// @desc    Create dashboard account
// @route   POST /api/admin-auth/admins
// @access  Superadmin
const createAdmin = async (req, res) => {
  try {
    const { phone, username, password, email, role = 'admin' } = req.body;

    if (!(await roleService.roleExists(role))) {
      return res.status(400).json({ success: false, message: msg(req, 'INVALID_ROLE_SUPERADMIN') });
    }
    // Only a superadmin can create another superadmin
    if (role === 'superadmin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'You do not have permission for this action', code: 'PERMISSION_DENIED' });
    }

    if (!password || String(password).length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
      });
    }

    if (await Admin.exists({ phone })) {
      return res.status(400).json({ success: false, message: msg(req, 'USER_ALREADY_EXISTS') });
    }

    const admin = new Admin({
      phone,
      username,
      password,
      email: email || undefined,
      role,
      createdBy: req.user._id
    });
    await admin.save();

    res.status(201).json({
      success: true,
      message: msg(req, 'ADMIN_USER_CREATED_SUCCESS'),
      data: { user: admin.toSafeJSON() }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ success: false, message: msg(req, 'FIELD_ALREADY_EXISTS', { field }) });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: msg(req, 'INTERNAL_SERVER_ERROR') });
  }
};

module.exports = {
  login,
  refreshToken,
  logout: sharedLogout,
  getMe,
  updateProfile,
  createAdmin,
  MIN_PASSWORD_LENGTH
};
