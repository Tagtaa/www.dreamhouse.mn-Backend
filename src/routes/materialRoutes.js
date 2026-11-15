const express = require('express');
const router = express.Router();
const { requirePermission: can } = require('../middleware/auth');
const { hideContactUnlessMember } = require('../services/materialContactService');
const materialController = require('../controllers/materialController');
const ingredientNameController = require('../controllers/ingredientNameController');
const { auth, optionalAuth, premium, admin } = require('../middleware/auth');

// Material contact details (phone, address, map) only for members and dashboard accounts
router.use(hideContactUnlessMember);
const { 
  validateObjectId,
  validatePagination,
  validateSearch,
  handleValidationErrors 
} = require('../middleware/validation');
const { body } = require('express-validator');

// Validation for ingredient name
const validateIngredientName = () => [
  body('name')
    .isLength({ min: 1, max: 200 })
    .withMessage('Name must be between 1 and 200 characters')
    .trim(),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

// Validation for ingredient name update
const validateIngredientNameUpdate = () => [
  body('name')
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage('Name must be between 1 and 200 characters')
    .trim(),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

// @route   GET /api/materials
// @desc    Get materials list
// @access  Public (with optional auth for isLiked field)
router.get('/',
  optionalAuth,
  validatePagination(),
  validateSearch(),
  handleValidationErrors,
  materialController.getMaterials
);

// @route   GET /api/materials/categories
// @desc    Get material categories
// @access  Public
router.get('/categories', materialController.getCategories);

// @route   POST /api/materials/categories
// @desc    Create material category
// @access  Admin
router.post('/categories', auth, admin, can('material_categories.create'), materialController.createCategory);

// @route   PUT /api/materials/categories/:id
// @desc    Update material category
// @access  Admin
router.put('/categories/:id', auth, admin, can('material_categories.edit'), materialController.updateCategory);

// @route   DELETE /api/materials/categories/:id
// @desc    Delete material category (soft delete)
// @access  Admin
router.delete('/categories/:id', auth, admin, can('material_categories.delete'), materialController.deleteCategory);

// Parent categories routes
// @route   GET /api/materials/parent-categories
// @desc    Get parent categories
// @access  Public
router.get('/parent-categories', materialController.getParentCategories);

// @route   POST /api/materials/parent-categories
// @desc    Create parent category
// @access  Admin
router.post('/parent-categories', auth, admin, can('material_categories.create'), materialController.createParentCategory);

// @route   DELETE /api/materials/parent-categories/:id
// @desc    Delete parent category (soft delete)
// @access  Admin
router.delete('/parent-categories/:id', auth, admin, can('material_categories.delete'), materialController.deleteParentCategory);

// Ingredient Names routes
// @route   GET /api/materials/ingredient-names
// @desc    Get all ingredient names
// @access  Private
router.get('/ingredient-names',
  auth,
  validateSearch(),
  handleValidationErrors,
  ingredientNameController.getIngredientNames
);

// @route   GET /api/materials/ingredient-names/:id
// @desc    Get ingredient name by ID
// @access  Private
router.get('/ingredient-names/:id',
  auth,
  validateObjectId(),
  handleValidationErrors,
  ingredientNameController.getIngredientNameById
);

// @route   POST /api/materials/ingredient-names
// @desc    Create ingredient name
// @access  Admin
router.post('/ingredient-names',
  auth,
  admin, can('material_categories.create'),
  validateIngredientName(),
  handleValidationErrors,
  ingredientNameController.createIngredientName
);

// @route   PUT /api/materials/ingredient-names/:id
// @desc    Update ingredient name
// @access  Admin
router.put('/ingredient-names/:id',
  auth,
  admin, can('material_categories.edit'),
  validateObjectId(),
  validateIngredientNameUpdate(),
  handleValidationErrors,
  ingredientNameController.updateIngredientName
);

// @route   DELETE /api/materials/ingredient-names/:id
// @desc    Delete ingredient name
// @access  Admin
router.delete('/ingredient-names/:id',
  auth,
  admin, can('material_categories.delete'),
  validateObjectId(),
  handleValidationErrors,
  ingredientNameController.deleteIngredientName
);

// @route   GET /api/materials/popular
// @desc    Get popular materials
// @access  Private
router.get('/popular', auth, materialController.getPopularMaterials);

// @route   GET /api/materials/search
// @desc    Search materials
// @access  Private
router.get('/search',
  auth,
  validateSearch(),
  validatePagination(),
  handleValidationErrors,
  materialController.searchMaterials
);

// @route   GET /api/materials/:id
// @desc    Get material by ID
// @access  Private
router.get('/:id',
  auth,
  validateObjectId(),
  handleValidationErrors,
  materialController.getMaterialById
);

// @route   POST /api/materials/:id/view
// @desc    Increment material view count
// @access  Private
router.post('/:id/view',
  auth,
  validateObjectId(),
  handleValidationErrors,
  materialController.incrementViewCount
);

// @route   POST /api/materials/:id/like
// @desc    Like a material
// @access  Private
router.post('/:id/like',
  auth,
  validateObjectId(),
  handleValidationErrors,
  materialController.likeMaterial
);

// @route   DELETE /api/materials/:id/like
// @desc    Unlike a material
// @access  Private
router.delete('/:id/like',
  auth,
  validateObjectId(),
  handleValidationErrors,
  materialController.unlikeMaterial
);

// @route   POST /api/materials/:id/toggle-like
// @desc    Toggle like status of a material
// @access  Private
router.post('/:id/toggle-like',
  auth,
  validateObjectId(),
  handleValidationErrors,
  materialController.toggleLikeMaterial
);

// Admin routes
// @route   POST /api/materials
// @desc    Create new material
// @access  Admin
router.post('/',
  auth,
  admin, can('materials.create'),
  materialController.createMaterial
);

// @route   PUT /api/materials/:id
// @desc    Update material
// @access  Admin
router.put('/:id',
  auth,
  admin, can('materials.edit'),
  validateObjectId(),
  handleValidationErrors,
  materialController.updateMaterial
);

// @route   DELETE /api/materials/:id
// @desc    Delete material (soft delete)
// @access  Admin
router.delete('/:id',
  auth,
  admin, can('materials.delete'),
  validateObjectId(),
  handleValidationErrors,
  materialController.deleteMaterial
);

module.exports = router; 