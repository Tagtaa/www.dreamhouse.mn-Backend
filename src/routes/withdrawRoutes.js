const express = require('express');
const router = express.Router();
const withdrawController = require('../controllers/withdrawController');
const { auth, admin } = require('../middleware/auth');
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
  validatePagination(),
  handleValidationErrors,
  withdrawController.getWithdrawals
);

// @route   GET /api/admin/withdrawals/:id
// @desc    Get withdrawal details
// @access  Admin
router.get('/:id',
  validateObjectId(),
  handleValidationErrors,
  withdrawController.getWithdrawalById
);

// @route   POST /api/admin/withdrawals
// @desc    Create new withdrawal
// @access  Admin
router.post('/', 
  validateWithdrawal(),
  handleValidationErrors,
  withdrawController.createWithdrawal
);

// @route   PUT /api/admin/withdrawals/:id
// @desc    Update withdrawal (full update)
// @access  Admin
router.put('/:id',
  validateObjectId(),
  handleValidationErrors,
  withdrawController.updateWithdrawal
);

// @route   PUT /api/admin/withdrawals/:id/status
// @desc    Update withdrawal status
// @access  Admin
router.put('/:id/status',
  validateObjectId(),
  validateTransactionStatus(),
  handleValidationErrors,
  withdrawController.updateWithdrawalStatus
);

// @route   DELETE /api/admin/withdrawals/:id
// @desc    Delete withdrawal
// @access  Admin
router.delete('/:id',
  validateObjectId(),
  handleValidationErrors,
  withdrawController.deleteWithdrawal
);

module.exports = router;
