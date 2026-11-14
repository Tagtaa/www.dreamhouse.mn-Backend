const express = require('express');
const router = express.Router();
const wallThicknessController = require('../controllers/wallThicknessController');
const { auth, admin } = require('../middleware/auth');

// Get all wall thickness options
// GET /api/calculations/wall/thickness
router.get('/wall/thickness', auth, wallThicknessController.getWallThicknessOptions);

// Get wall thickness by ID
// GET /api/calculations/wall/thickness/:id
router.get('/wall/thickness/:id', auth, wallThicknessController.getWallThicknessById);

// Create new wall thickness option (Admin only)
// POST /api/calculations/wall/thickness
router.post('/wall/thickness', auth, admin, wallThicknessController.createWallThickness);

// Update wall thickness option (Admin only)
// PUT /api/calculations/wall/thickness/:id
router.put('/wall/thickness/:id', auth, admin, wallThicknessController.updateWallThickness);

// Delete wall thickness option (Admin only)
// DELETE /api/calculations/wall/thickness/:id
router.delete('/wall/thickness/:id', auth, admin, wallThicknessController.deleteWallThickness);

module.exports = router;
