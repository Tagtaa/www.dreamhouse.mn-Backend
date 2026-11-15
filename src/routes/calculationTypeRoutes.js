const express = require('express');
const router = express.Router();
const { requirePermission: can } = require('../middleware/auth');
const calculationTypeController = require('../controllers/calculationTypeController');
const { auth, admin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Multer configuration for calculation type images
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

// Get calculation types for a specific calculation
// GET /api/calculations/:type/choose-types
router.get('/:type/choose-types', auth, calculationTypeController.getCalculationTypes);

// Create new calculation type for a specific calculation (Admin only)
// POST /api/calculations/:type/choose-types
router.post('/:type/choose-types', auth, admin, can('calculations.create'), uploadImage, calculationTypeController.createCalculationType);

// Update calculation type by key (Admin only)
// PUT /api/calculations/:type/choose-types
router.put('/:type/choose-types', auth, admin, can('calculations.edit'), uploadImage, calculationTypeController.updateCalculationTypeByKey);

// Delete calculation type by key (Admin only)
// DELETE /api/calculations/:type/choose-types
router.delete('/:type/choose-types', auth, admin, can('calculations.delete'), calculationTypeController.deleteCalculationTypeByKey);

// Get calculation type by ID
// GET /api/calculations/types/:id
router.get('/types/:id', auth, calculationTypeController.getCalculationTypeById);



// Update calculation type (Admin only)
// PUT /api/calculations/types/:id
router.put('/types/:id', auth, admin, can('calculations.edit'), calculationTypeController.updateCalculationType);

// Delete calculation type (Admin only)
// DELETE /api/calculations/types/:id
router.delete('/types/:id', auth, admin, can('calculations.delete'), calculationTypeController.deleteCalculationType);

module.exports = router;
