const express = require('express');
const router = express.Router();
const { requirePermission: can } = require('../middleware/auth');
const roofShapeController = require('../controllers/roofShapeController');
const { auth, admin } = require('../middleware/auth');

// Get all roof shape options
// GET /api/calculations/roof/choose-shapes
router.get('/roof/choose-shapes', auth, roofShapeController.getRoofShapeOptions);

// Get roof shape by ID
// GET /api/calculations/roof/choose-shapes/:id
router.get('/roof/choose-shapes/:id', auth, roofShapeController.getRoofShapeById);

// Create new roof shape option (Admin only)
// POST /api/calculations/roof/choose-shapes
router.post('/roof/choose-shapes', auth, admin, can('calculations.create'), roofShapeController.createRoofShape);

// Update roof shape option (Admin only)
// PUT /api/calculations/roof/choose-shapes/:id
router.put('/roof/choose-shapes/:id', auth, admin, can('calculations.edit'), roofShapeController.updateRoofShape);

// Delete roof shape option (Admin only)
// DELETE /api/calculations/roof/choose-shapes/:id
router.delete('/roof/choose-shapes/:id', auth, admin, can('calculations.delete'), roofShapeController.deleteRoofShape);

module.exports = router;
