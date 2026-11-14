const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');
const { auth, admin } = require('../middleware/auth');
const { 
  validateObjectId,
  validatePagination,
  validatePurchase,
  validateTransactionStatus,
  handleValidationErrors 
} = require('../middleware/validation');

// Apply auth and admin middleware to all routes
router.use(auth, admin);

// @route   GET /api/admin/purchases
// @desc    Get purchases list with filtering
// @access  Admin
router.get('/',
  validatePagination(),
  handleValidationErrors,
  purchaseController.getPurchases
);

// @route   GET /api/admin/purchases/:id
// @desc    Get purchase details
// @access  Admin
router.get('/:id',
  validateObjectId(),
  handleValidationErrors,
  purchaseController.getPurchaseById
);

// @route   POST /api/admin/purchases
// @desc    Create new purchase
// @access  Admin
router.post('/', 
  validatePurchase(),
  handleValidationErrors,
  purchaseController.createPurchase
);

// @route   PUT /api/admin/purchases/:id/status
// @desc    Update purchase status
// @access  Admin
router.put('/:id/status',
  validateObjectId(),
  validateTransactionStatus(),
  handleValidationErrors,
  purchaseController.updatePurchaseStatus
);

// @route   DELETE /api/admin/purchases/:id
// @desc    Delete purchase
// @access  Admin
router.delete('/:id',
  validateObjectId(),
  handleValidationErrors,
  purchaseController.deletePurchase
);

module.exports = router;
