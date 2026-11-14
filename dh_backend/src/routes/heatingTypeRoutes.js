const express = require('express');
const router = express.Router();
const heatingTypeController = require('../controllers/heatingTypeController');
const { auth, admin } = require('../middleware/auth');

// @route   GET /api/heating-types
// @desc    Get all heating types
// @access  Public
router.get('/', heatingTypeController.getHeatingTypes);

// @route   POST /api/heating-types
// @desc    Create heating type
// @access  Admin
router.post('/', auth, admin, heatingTypeController.createHeatingType);

// @route   PUT /api/heating-types/:id
// @desc    Update heating type
// @access  Admin
router.put('/:id', auth, admin, heatingTypeController.updateHeatingType);

// @route   DELETE /api/heating-types/:id
// @desc    Delete heating type
// @access  Admin
router.delete('/:id', auth, admin, heatingTypeController.deleteHeatingType);

module.exports = router;
