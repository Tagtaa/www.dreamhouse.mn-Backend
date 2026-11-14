const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const materialController = require('../controllers/materialController');
const subscriptionController = require('../controllers/subscriptionController');
const ideaController = require('../controllers/ideaController');
const withdrawController = require('../controllers/withdrawController');
const { auth, admin, roleCheck } = require('../middleware/auth');
const {
  validateObjectId,
  validatePagination,
  handleValidationErrors
} = require('../middleware/validation');

// Apply auth and admin middleware to all routes
router.use(auth, admin);

// @route   POST /api/admin/change-password
// @desc    Change admin password
// @access  Admin
router.post('/change-password', adminController.changeAdminPassword);

// Withdraw Management
router.use('/withdrawals', require('./withdrawRoutes'));

// Purchase Management
router.use('/purchases', require('./purchaseRoutes'));

// Deposit Management
router.use('/deposits', require('./depositRoutes'));

// Dashboard Analytics
// @route   GET /api/admin/dashboard
// @desc    Get dashboard analytics
// @access  Admin
router.get('/dashboard', adminController.getDashboardAnalytics);

// User Management
// @route   GET /api/admin/users
// @desc    Get users list
// @access  Admin
router.get('/users',
  validatePagination(),
  handleValidationErrors,
  adminController.getUsers
);

// @route   GET /api/admin/admins
// @desc    Get admins list (admin, superadmin, operator)
// @access  Admin
router.get('/admins',
  validatePagination(),
  handleValidationErrors,
  adminController.getAdmins
);

// @route   PUT /api/admin/admins/:id
// @desc    Update admin
// @access  Admin
router.put('/admins/:id',
  validateObjectId(),
  handleValidationErrors,
  adminController.updateAdmin
);

// @route   DELETE /api/admin/admins/:id
// @desc    Delete admin (soft delete)
// @access  Admin
router.delete('/admins/:id',
  validateObjectId(),
  handleValidationErrors,
  adminController.deleteAdmin
);

// @route   GET /api/admin/users/:id
// @desc    Get user details
// @access  Admin
router.get('/users/:id',
  validateObjectId(),
  handleValidationErrors,
  adminController.getUserById
);

// @route   PUT /api/admin/users/:id/status
// @desc    Update user status (activate/deactivate)
// @access  Admin
router.put('/users/:id/status',
  validateObjectId(),
  handleValidationErrors,
  adminController.updateUserStatus
);

// @route   PUT /api/admin/users/:id/ban
// @desc    Ban/Unban user
// @access  Operator only
router.put('/users/:id/ban',
  validateObjectId(),
  handleValidationErrors,
  roleCheck(['operator']),
  adminController.banUser
);

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role
// @access  Admin
router.put('/users/:id/role',
  validateObjectId(),
  handleValidationErrors,
  adminController.updateUserRole
);

// @route   DELETE /api/admin/users/:id
// @desc    Delete user (hard delete - permanent)
// @access  Admin, Superadmin only
router.delete('/users/:id',
  validateObjectId(),
  handleValidationErrors,
  roleCheck(['admin', 'superadmin']),
  adminController.deleteUser
);

// @route   PUT /api/admin/users/:id/password
// @desc    Change user password (admin only)
// @access  Admin
router.put('/users/:id/password',
  validateObjectId(),
  handleValidationErrors,
  adminController.changeUserPassword
);

// Subscription Management
// @route   GET /api/admin/subscriptions
// @desc    Get subscriptions list
// @access  Admin
router.get('/subscriptions',
  validatePagination(),
  handleValidationErrors,
  subscriptionController.getSubscriptions
);

// @route   GET /api/admin/subscriptions/:id
// @desc    Get subscription details
// @access  Admin
router.get('/subscriptions/:id',
  validateObjectId(),
  handleValidationErrors,
  subscriptionController.getSubscriptionById
);

// @route   POST /api/admin/subscriptions
// @desc    Create new subscription
// @access  Admin
router.post('/subscriptions', subscriptionController.createSubscription);

// @route   PUT /api/admin/subscriptions/:id
// @desc    Update subscription
// @access  Admin
router.put('/subscriptions/:id',
  validateObjectId(),
  handleValidationErrors,
  subscriptionController.updateSubscription
);

// @route   DELETE /api/admin/subscriptions/:id
// @desc    Delete subscription
// @access  Admin
router.delete('/subscriptions/:id',
  validateObjectId(),
  handleValidationErrors,
  subscriptionController.deleteSubscription
);

// @route   PUT /api/admin/subscriptions/:id/toggle
// @desc    Toggle subscription status
// @access  Admin
router.put('/subscriptions/:id/toggle',
  validateObjectId(),
  handleValidationErrors,
  subscriptionController.toggleSubscriptionStatus
);

// Material Management
// @route   GET /api/admin/materials
// @desc    Get materials list for admin
// @access  Admin
router.get('/materials',
  validatePagination(),
  handleValidationErrors,
  materialController.getAllMaterialsAdmin
);

// @route   GET /api/admin/materials/:id/ingredients
// @desc    Get material ingredients for admin editing
// @access  Admin
router.get('/materials/:id/ingredients',
  adminController.getMaterialIngredients
);

// @route   PUT /api/admin/materials/:id/ingredients
// @desc    Update material ingredients
// @access  Admin
router.put('/materials/:id/ingredients',
  adminController.updateMaterialIngredients
);

// @route   POST /api/admin/materials/:id/ingredients/preview
// @desc    Preview ingredients calculation
// @access  Admin
router.post('/materials/:id/ingredients/preview',
  adminController.previewIngredientsCalculation
);

// Idea Management
// @route   GET /api/admin/ideas
// @desc    Get ideas list for admin
// @access  Admin
router.get('/ideas',
  validatePagination(),
  handleValidationErrors,
  ideaController.getAllIdeasAdmin
);

// @route   GET /api/admin/purchased-ideas
// @desc    Get all purchased ideas by all users
// @access  Admin
router.get('/purchased-ideas',
  validatePagination(),
  handleValidationErrors,
  ideaController.getAllPurchasedIdeasAdmin
);

// Analytics & Reports
// @route   GET /api/admin/analytics/users
// @desc    Get user analytics
// @access  Admin
router.get('/analytics/users', adminController.getUserAnalytics);

// @route   GET /api/admin/analytics/calculations
// @desc    Get calculation analytics
// @access  Admin
router.get('/analytics/calculations', adminController.getCalculationAnalytics);

// @route   GET /api/admin/analytics/revenue
// @desc    Get revenue analytics
// @access  Admin
router.get('/analytics/revenue', adminController.getRevenueAnalytics);

// System Management
// @route   GET /api/admin/system/stats
// @desc    Get system statistics
// @access  Admin
router.get('/system/stats', adminController.getSystemStats);

// @route   POST /api/admin/system/cleanup
// @desc    Cleanup expired data
// @access  Admin
router.post('/system/cleanup', adminController.cleanupSystem);

// ====================
// Manual User Management CRUD (No OTP Required)
// ====================

// @route   POST /api/admin/manual-users
// @desc    Create user manually (no OTP verification)
// @access  Admin
router.post('/manual-users', adminController.createManualUser);

// @route   GET /api/admin/manual-users
// @desc    Get all users with filters
// @access  Admin
router.get('/manual-users',
  validatePagination(),
  handleValidationErrors,
  adminController.getManualUsers
);

// @route   GET /api/admin/manual-users/:id
// @desc    Get single user by ID
// @access  Admin
router.get('/manual-users/:id',
  validateObjectId(),
  handleValidationErrors,
  adminController.getManualUserById
);

// @route   PUT /api/admin/manual-users/:id
// @desc    Update user manually
// @access  Admin
router.put('/manual-users/:id',
  validateObjectId(),
  handleValidationErrors,
  adminController.updateManualUser
);

// @route   DELETE /api/admin/manual-users/:id
// @desc    Delete user manually (hard delete)
// @access  Admin
router.delete('/manual-users/:id',
  validateObjectId(),
  handleValidationErrors,
  adminController.deleteManualUser
);

module.exports = router; 