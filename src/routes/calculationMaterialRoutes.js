const express = require('express');
const router = express.Router();
const { requirePermission: can } = require('../middleware/auth');
const calculationMaterialController = require('../controllers/calculationMaterialController');
const { auth, admin } = require('../middleware/auth');
const { 
  validatePagination,
  validateSearch,
  handleValidationErrors 
} = require('../middleware/validation');
const multer = require('multer');
const path = require('path');

// Multer configuration for calculation material images
const storage = multer.memoryStorage();
const uploadImage = multer({
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

// Get calculation materials for a specific calculation
// GET /api/calculations/:type/choose-materials
router.get('/:type/choose-materials', 
  auth, 
  validatePagination(),
  validateSearch(),
  handleValidationErrors,
  calculationMaterialController.getCalculationMaterials
);

// Create new calculation material for a specific calculation (Admin only)
// POST /api/calculations/:type/choose-materials
router.post('/:type/choose-materials', auth, admin, can('calculations.create'), uploadImage, calculationMaterialController.createCalculationMaterial);

// Update calculation material for a specific calculation (Admin only)
// PUT /api/calculations/:type/choose-materials
router.put('/:type/choose-materials', auth, admin, can('calculations.edit'), uploadImage, calculationMaterialController.updateCalculationMaterialByKey);

// Delete calculation material for a specific calculation (Admin only)
// DELETE /api/calculations/:type/choose-materials
router.delete('/:type/choose-materials', auth, admin, can('calculations.delete'), calculationMaterialController.deleteCalculationMaterialByKey);

// Get calculation material by ID
// GET /api/calculations/choose-materials/:id
router.get('/choose-materials/:id', auth, calculationMaterialController.getCalculationMaterialById);

// Create new calculation material (Admin only)
// POST /api/calculations/choose-materials
router.post('/choose-materials', auth, admin, can('calculations.create'), calculationMaterialController.createCalculationMaterial);

// Update calculation material (Admin only)
// PUT /api/calculations/choose-materials/:id
router.put('/choose-materials/:id', auth, admin, can('calculations.edit'), calculationMaterialController.updateCalculationMaterial);

// Delete calculation material (Admin only)
// DELETE /api/calculations/choose-materials/:id
router.delete('/choose-materials/:id', auth, admin, can('calculations.delete'), calculationMaterialController.deleteCalculationMaterial);

module.exports = router;
