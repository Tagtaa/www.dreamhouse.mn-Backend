const express = require('express');
const { auth, admin, requirePermission } = require('../middleware/auth');
const adminAuthController = require('../controllers/adminAuthController');

const router = express.Router();

// Dashboard (admin panel) authentication — accounts live in the `admins` collection.

// @route   POST /api/admin-auth/login
router.post('/login', adminAuthController.login);

// @route   POST /api/admin-auth/refresh
router.post('/refresh', adminAuthController.refreshToken);

// @route   POST /api/admin-auth/logout
router.post('/logout', auth, admin, adminAuthController.logout);

// @route   GET /api/admin-auth/me
router.get('/me', auth, admin, adminAuthController.getMe);

// @route   PUT /api/admin-auth/profile
router.put('/profile', auth, admin, adminAuthController.updateProfile);

// @route   POST /api/admin-auth/admins
// @access  Superadmin only
router.post('/admins', auth, admin, requirePermission('admins.create'), adminAuthController.createAdmin);

module.exports = router;
