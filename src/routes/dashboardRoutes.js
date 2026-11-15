const express = require('express');
const router = express.Router();
const { requirePermission: can } = require('../middleware/auth');
const { auth, admin } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

// 📊 Dashboard Routes

router.get('/summary', auth, admin, can('dashboard.view'), dashboardController.getDashboardSummary);

router.get('/calculations/analytics', auth, admin, can('dashboard.view'), dashboardController.getCalculationAnalytics);

router.get('/users/analytics', auth, admin, can('dashboard.view'), dashboardController.getUserAnalytics);

router.get('/financial/analytics', auth, admin, can('dashboard.view'), dashboardController.getFinancialAnalytics);

router.get('/materials/analytics', auth, admin, can('dashboard.view'), dashboardController.getMaterialAnalytics);

router.get('/ideas/analytics', auth, admin, can('dashboard.view'), dashboardController.getIdeaAnalytics);

router.get('/ideas/dashboard', auth, admin, can('dashboard.view'), dashboardController.getIdeaAnalytics);

router.get('/realtime', auth, admin, can('dashboard.view'), dashboardController.getRealtimeDashboard);

router.get('/mobile', auth, dashboardController.getMobileDashboard);

module.exports = router;
