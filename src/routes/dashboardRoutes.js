const express = require('express');
const router = express.Router();
const { auth, admin } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

// 📊 Dashboard Routes

router.get('/summary', auth, admin, dashboardController.getDashboardSummary);

router.get('/calculations/analytics', auth, admin, dashboardController.getCalculationAnalytics);

router.get('/users/analytics', auth, admin, dashboardController.getUserAnalytics);

router.get('/financial/analytics', auth, admin, dashboardController.getFinancialAnalytics);

router.get('/materials/analytics', auth, admin, dashboardController.getMaterialAnalytics);

router.get('/ideas/analytics', auth, admin, dashboardController.getIdeaAnalytics);

router.get('/ideas/dashboard', auth, admin, dashboardController.getIdeaAnalytics);

router.get('/realtime', auth, admin, dashboardController.getRealtimeDashboard);

router.get('/mobile', auth, dashboardController.getMobileDashboard);

module.exports = router;
