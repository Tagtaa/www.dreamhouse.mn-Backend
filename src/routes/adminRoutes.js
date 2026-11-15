const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const materialController = require('../controllers/materialController');
const subscriptionController = require('../controllers/subscriptionController');
const ideaController = require('../controllers/ideaController');
const roleController = require('../controllers/roleController');
const { auth, admin, requirePermission: can } = require('../middleware/auth');
const roleService = require('../services/roleService');
const {
  validateObjectId,
  validatePagination,
  handleValidationErrors
} = require('../middleware/validation');

// Every route needs a dashboard account; each route then needs a permission from
// Roles & Permission (config/permissions.js), e.g. can('users.ban').
router.use(auth, admin);

// Own admin record is always readable (Profile page); other admins need admins.view
const selfOr = (permission) => async (req, res, next) => {
  if (String(req.params.id) === String(req.user._id)) return next();
  return can(permission)(req, res, next);
};

// PUT /manual-users/:id edits info, status or membership: check what is being changed
const userUpdatePermission = async (req, res, next) => {
  const body = req.body || {};
  const needed = [];
  if (['username', 'phone', 'email', 'role'].some((k) => body[k] !== undefined)) needed.push('users.edit');
  if (body.password !== undefined && body.password !== '') needed.push('users.password');
  if (body.isActive !== undefined) needed.push('users.status');
  if (body.premiumDays !== undefined) needed.push('users.membership');
  if (!needed.length) needed.push('users.edit');
  for (const permission of needed) {
    if (!(await roleService.hasPermission(req, permission))) {
      return res.status(403).json({ success: false, message: 'You do not have permission for this action', code: 'PERMISSION_DENIED', permission });
    }
  }
  next();
};

// @route   POST /api/admin/change-password
// @desc    Change own password
// @access  Admin (any)
router.post('/change-password', adminController.changeAdminPassword);

// Roles & Permission
// @route   GET    /api/admin/roles        — any admin (catalog + roles; also used by role pickers)
// @route   POST   /api/admin/roles        — roles.manage
// @route   PUT    /api/admin/roles/:key   — roles.manage
// @route   DELETE /api/admin/roles/:key   — roles.manage
router.get('/roles', roleController.listRoles);
router.post('/roles', can('roles.manage'), roleController.createRole);
router.put('/roles/:key', can('roles.manage'), roleController.updateRole);
router.delete('/roles/:key', can('roles.manage'), roleController.deleteRole);

// Withdraw / Purchase / Deposit Management (permissions inside each router)
router.use('/withdrawals', require('./withdrawRoutes'));
router.use('/purchases', require('./purchaseRoutes'));
router.use('/deposits', require('./depositRoutes'));

// Dashboard Analytics
// @route   GET /api/admin/dashboard
router.get('/dashboard', can('dashboard.view'), adminController.getDashboardAnalytics);

// App Settings (Settings → Preferences)
const settingsController = require('../controllers/settingsController');
router.get('/settings', can('settings.view'), settingsController.getSettings);
router.put('/settings', can('settings.edit'), settingsController.updateSettings);

// User Management
// @route   GET /api/admin/users  (also used to look users up when creating transactions)
router.get('/users',
  can('users.view', 'deposits.create', 'withdrawals.create', 'purchases.create'),
  validatePagination(),
  handleValidationErrors,
  adminController.getUsers
);

// @route   GET /api/admin/admins
router.get('/admins',
  can('admins.view'),
  validatePagination(),
  handleValidationErrors,
  adminController.getAdmins
);

// @route   GET /api/admin/admins/:id   (own record always)
router.get('/admins/:id',
  validateObjectId(),
  handleValidationErrors,
  selfOr('admins.view'),
  adminController.getAdminById
);

// @route   PUT /api/admin/admins/:id   (field-level permissions checked in the controller)
router.put('/admins/:id',
  validateObjectId(),
  handleValidationErrors,
  adminController.updateAdmin
);

// @route   DELETE /api/admin/admins/:id   (soft delete = deactivate)
router.delete('/admins/:id',
  validateObjectId(),
  handleValidationErrors,
  can('admins.deactivate'),
  adminController.deleteAdmin
);

// @route   GET /api/admin/users/:id
router.get('/users/:id',
  validateObjectId(),
  handleValidationErrors,
  can('users.view'),
  adminController.getUserById
);

// @route   PUT /api/admin/users/:id/status
router.put('/users/:id/status',
  validateObjectId(),
  handleValidationErrors,
  can('users.status'),
  adminController.updateUserStatus
);

// @route   PUT /api/admin/users/:id/ban
router.put('/users/:id/ban',
  validateObjectId(),
  handleValidationErrors,
  can('users.ban'),
  adminController.banUser
);

// @route   PUT /api/admin/users/:id/role
router.put('/users/:id/role',
  validateObjectId(),
  handleValidationErrors,
  can('users.edit'),
  adminController.updateUserRole
);

// @route   DELETE /api/admin/users/:id   (hard delete - permanent)
router.delete('/users/:id',
  validateObjectId(),
  handleValidationErrors,
  can('users.delete'),
  adminController.deleteUser
);

// @route   PUT /api/admin/users/:id/password
router.put('/users/:id/password',
  validateObjectId(),
  handleValidationErrors,
  can('users.password'),
  adminController.changeUserPassword
);

// Subscription Management
router.get('/subscriptions',
  can('subscriptions.view', 'users.membership'),
  validatePagination(),
  handleValidationErrors,
  subscriptionController.getSubscriptions
);
router.get('/subscriptions/:id',
  validateObjectId(),
  handleValidationErrors,
  can('subscriptions.view'),
  subscriptionController.getSubscriptionById
);
router.post('/subscriptions', can('subscriptions.create'), subscriptionController.createSubscription);
router.put('/subscriptions/:id',
  validateObjectId(),
  handleValidationErrors,
  can('subscriptions.edit'),
  subscriptionController.updateSubscription
);
router.delete('/subscriptions/:id',
  validateObjectId(),
  handleValidationErrors,
  can('subscriptions.delete'),
  subscriptionController.deleteSubscription
);
router.put('/subscriptions/:id/toggle',
  validateObjectId(),
  handleValidationErrors,
  can('subscriptions.toggle'),
  subscriptionController.toggleSubscriptionStatus
);

// Material Management
router.get('/materials',
  can('materials.view', 'material_categories.view', 'calculations.view'),
  validatePagination(),
  handleValidationErrors,
  materialController.getAllMaterialsAdmin
);
router.get('/materials/:id/ingredients',
  can('materials.view', 'material_categories.view'),
  adminController.getMaterialIngredients
);
router.put('/materials/:id/ingredients',
  can('materials.edit', 'material_categories.edit'),
  adminController.updateMaterialIngredients
);
router.post('/materials/:id/ingredients/preview',
  can('materials.view', 'material_categories.view'),
  adminController.previewIngredientsCalculation
);

// Idea (article) Management
router.get('/ideas',
  can('articles.view', 'purchases.create'),
  validatePagination(),
  handleValidationErrors,
  ideaController.getAllIdeasAdmin
);
router.get('/purchased-ideas',
  can('purchased_ideas.view'),
  validatePagination(),
  handleValidationErrors,
  ideaController.getAllPurchasedIdeasAdmin
);

// Analytics & Reports
router.get('/analytics/users', can('dashboard.view', 'reports.view'), adminController.getUserAnalytics);
router.get('/analytics/calculations', can('dashboard.view', 'reports.view'), adminController.getCalculationAnalytics);
router.get('/analytics/revenue', can('dashboard.view', 'reports.view'), adminController.getRevenueAnalytics);

// System Management
router.get('/system/stats', can('dashboard.view'), adminController.getSystemStats);
router.post('/system/cleanup', can('settings.edit'), adminController.cleanupSystem);

// Manual User Management CRUD (No OTP Required)
router.post('/manual-users', can('users.create'), adminController.createManualUser);
router.get('/manual-users',
  can('users.view'),
  validatePagination(),
  handleValidationErrors,
  adminController.getManualUsers
);
router.get('/manual-users/:id',
  validateObjectId(),
  handleValidationErrors,
  can('users.view'),
  adminController.getManualUserById
);
router.put('/manual-users/:id',
  validateObjectId(),
  handleValidationErrors,
  userUpdatePermission,
  adminController.updateManualUser
);
router.delete('/manual-users/:id',
  validateObjectId(),
  handleValidationErrors,
  can('users.delete'),
  adminController.deleteManualUser
);

module.exports = router;
