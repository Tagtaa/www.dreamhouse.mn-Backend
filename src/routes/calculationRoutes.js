const express = require('express');
const router = express.Router();
const { requirePermission: can } = require('../middleware/auth');
const calculationController = require('../controllers/calculationController');
const calculationTypeRoutes = require('./calculationTypeRoutes');
const calculationMaterialRoutes = require('./calculationMaterialRoutes');
const wallThicknessRoutes = require('./wallThicknessRoutes');
const roofShapeRoutes = require('./roofShapeRoutes');
const wallThicknessController = require('../controllers/wallThicknessController');
const roofShapeController = require('../controllers/roofShapeController');
const { auth } = require('../middleware/auth');
const { 
  validateObjectId,
  validateCalculationInputs,
  validateCalculationUpdate,
  validatePagination,
  handleValidationErrors 
} = require('../middleware/validation');
const multer = require('multer');
const path = require('path');

// Multer configuration for calculation type images
const storage = multer.memoryStorage();
const uploadCalculationTypeImage = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
}).single('image');

// @route   POST /api/calculations
// @desc    Calculate materials for any type
// @access  Private
router.post('/',
  auth,
  validateCalculationInputs(),
  handleValidationErrors,
  calculationController.calculate
);

// @route   GET /api/calculations/types
// @desc    Get calculation types
// @access  Private
router.get('/types', auth, calculationController.getCalculationTypes);

// @route   POST /api/calculations/types
// @desc    Create calculation type (Admin only)
// @access  Admin
router.post('/types', auth, require('../middleware/auth').admin, can('calculations.create'), uploadCalculationTypeImage, calculationController.createCalculationType);

// @route   PUT /api/calculations/types
// @desc    Update calculation type (Admin only)
// @access  Admin
router.put('/types', auth, require('../middleware/auth').admin, can('calculations.edit'), uploadCalculationTypeImage, calculationController.updateCalculationType);

// @route   DELETE /api/calculations/types
// @desc    Delete calculation type (Admin only)
// @access  Admin
router.delete('/types', auth, require('../middleware/auth').admin, can('calculations.delete'), calculationController.deleteCalculationType);

// @route   GET /api/calculations/history
// @desc    Get user's calculation history
// @access  Private
router.get('/history',
  auth,
  validatePagination(),
  handleValidationErrors,
  calculationController.getHistory
);

// @route   GET /api/calculations/:id
// @desc    Get calculation by ID
// @access  Private
router.get('/:id',
  auth,
  validateObjectId(),
  handleValidationErrors,
  calculationController.getCalculationById
);

// @route   PUT /api/calculations/:id
// @desc    Update calculation
// @access  Private
router.put('/:id',
  auth,
  validateObjectId(),
  validateCalculationUpdate(),
  handleValidationErrors,
  calculationController.updateCalculation
);

// @route   DELETE /api/calculations/:id
// @desc    Delete calculation
// @access  Private
router.delete('/:id',
  auth,
  validateObjectId(),
  handleValidationErrors,
  calculationController.deleteCalculation
);

// @route   POST /api/calculations/:id/bookmark
// @desc    Bookmark/unbookmark calculation
// @access  Private
router.post('/:id/bookmark',
  auth,
  validateObjectId(),
  handleValidationErrors,
  calculationController.toggleBookmark
);

// @route   POST /api/calculations/:id/share
// @desc    Share calculation with another user
// @access  Private
router.post('/:id/share',
  auth,
  validateObjectId(),
  handleValidationErrors,
  calculationController.shareCalculation
);

// @route   GET /api/calculations/statistics/summary
// @desc    Get calculation statistics
// @access  Private
router.get('/statistics/summary', auth, calculationController.getStatistics);

// Generic thickness endpoint
// GET /api/calculations/:type/thickness
router.get('/:type/thickness', auth, wallThicknessController.getWallThicknessOptions);

// Generic thickness by key endpoints (Admin only)
// POST /api/calculations/:type/thickness
router.post('/:type/thickness', auth, require('../middleware/auth').admin, can('calculations.create'), uploadCalculationTypeImage, wallThicknessController.createWallThicknessByKey);

// PUT /api/calculations/:type/thickness
router.put('/:type/thickness', auth, require('../middleware/auth').admin, can('calculations.edit'), uploadCalculationTypeImage, wallThicknessController.updateWallThicknessByKey);

// DELETE /api/calculations/:type/thickness
router.delete('/:type/thickness', auth, require('../middleware/auth').admin, can('calculations.delete'), wallThicknessController.deleteWallThicknessByKey);

// Generic shapes endpoint
// GET /api/calculations/:type/choose-shapes
router.get('/:type/choose-shapes', auth, roofShapeController.getRoofShapeOptions);

// Generic shapes by key endpoints (Admin only)
// POST /api/calculations/:type/choose-shapes
router.post('/:type/choose-shapes', auth, require('../middleware/auth').admin, can('calculations.create'), uploadCalculationTypeImage, roofShapeController.createRoofShapeByKey);

// PUT /api/calculations/:type/choose-shapes
router.put('/:type/choose-shapes', auth, require('../middleware/auth').admin, can('calculations.edit'), uploadCalculationTypeImage, roofShapeController.updateRoofShapeByKey);

// DELETE /api/calculations/:type/choose-shapes
router.delete('/:type/choose-shapes', auth, require('../middleware/auth').admin, can('calculations.delete'), roofShapeController.deleteRoofShapeByKey);

// Mount calculation type and material routes
router.use('/', calculationTypeRoutes);
router.use('/', calculationMaterialRoutes);
router.use('/', wallThicknessRoutes);
router.use('/', roofShapeRoutes);

module.exports = router; 