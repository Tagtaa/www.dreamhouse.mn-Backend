const express = require('express');
const router = express.Router();
const withdrawController = require('../controllers/withdrawController');
const { auth, admin, requirePermission: can } = require('../middleware/auth');
const { 
  validateObjectId,
  validatePagination,
  validateWithdrawal,
  validateTransactionStatus,
  handleValidationErrors 
} = require('../middleware/validation');

// Apply auth and admin middleware to all routes
router.use(auth, admin);

// @route   GET /api/admin/withdrawals
// @desc    Get withdrawals list with filtering
// @access  Admin
router.get('/',
  can('withdrawals.view'),
  validatePagination(),
  handleValidationErrors,
  withdrawController.getWithdrawals
);

// @route   GET /api/admin/withdrawals/:id
// @desc    Get withdrawal details
// @access  Admin
router.get('/:id',
  can('withdrawals.view'),
  validateObjectId(),
  handleValidationErrors,
  withdrawController.getWithdrawalById
);

// @route   POST /api/admin/withdrawals
// @desc    Create new withdrawal
// @access  Admin
router.post('/',
  can('withdrawals.create'),
  validateWithdrawal(),
  handleValidationErrors,
  withdrawController.createWithdrawal
);

// @route   PUT /api/admin/withdrawals/:id
// @desc    Update withdrawal (full update)
// @access  Admin
router.put('/:id',
  can('withdrawals.edit'),
  validateObjectId(),
  handleValidationErrors,
  withdrawController.updateWithdrawal
);

// @route   PUT /api/admin/withdrawals/:id/status
// @desc    Update withdrawal status
// @access  Admin
router.put('/:id/status',
  can('withdrawals.status'),
  validateObjectId(),
  validateTransactionStatus(),
  handleValidationErrors,
  withdrawController.updateWithdrawalStatus
);

// @route   DELETE /api/admin/withdrawals/:id
// @desc    Delete withdrawal
// @access  Admin
router.delete('/:id',
  can('withdrawals.delete'),
  validateObjectId(),
  handleValidationErrors,
  withdrawController.deleteWithdrawal
);

module.exports = router;
