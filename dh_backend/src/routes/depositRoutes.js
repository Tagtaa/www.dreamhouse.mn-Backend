const express = require('express');
const router = express.Router();
const depositController = require('../controllers/depositController');
const { auth, admin } = require('../middleware/auth');
const { 
  validateObjectId,
  validatePagination,
  validateDeposit,
  validateDepositStatus,
  handleValidationErrors 
} = require('../middleware/validation');

// Apply auth and admin middleware to all routes
router.use(auth, admin);

// @route   GET /api/admin/deposits
// @desc    Get deposits list with filtering
// @access  Admin
router.get('/',
  validatePagination(),
  handleValidationErrors,
  depositController.getDeposits
);

// @route   GET /api/admin/deposits/:id
// @desc    Get deposit details
// @access  Admin
router.get('/:id',
  validateObjectId(),
  handleValidationErrors,
  depositController.getDepositById
);

// @route   POST /api/admin/deposits
// @desc    Create new deposit (status: wrong, needs admin approval)
// @access  Admin
router.post('/', 
  validateDeposit(),
  handleValidationErrors,
  depositController.createDeposit
);

// @route   PUT /api/admin/deposits/:id
// @desc    Update wrong deposit (only for wrong transactions)
// @access  Admin
router.put('/:id',
  validateObjectId(),
  handleValidationErrors,
  depositController.updateDeposit
);

// @route   PUT /api/admin/deposits/:id/status
// @desc    Update deposit notes (status automatically determined by phone)
// @access  Admin
router.put('/:id/status',
  validateObjectId(),
  handleValidationErrors,
  depositController.updateDepositStatus
);

// @route   DELETE /api/admin/deposits/:id
// @desc    Delete deposit
// @access  Admin
router.delete('/:id',
  validateObjectId(),
  handleValidationErrors,
  depositController.deleteDeposit
);

module.exports = router;
