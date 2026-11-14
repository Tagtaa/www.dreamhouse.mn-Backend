const express = require('express');
const router = express.Router();
const ingredientNameController = require('../controllers/ingredientNameController');
const { auth, admin } = require('../middleware/auth');
const { 
  validateObjectId,
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

// @route   GET /api/ingredients
// @desc    Get all ingredient names
// @access  Private
router.get('/',
  auth,
  validateSearch(),
  handleValidationErrors,
  ingredientNameController.getIngredientNames
);

// @route   GET /api/ingredients/:id
// @desc    Get ingredient name by ID
// @access  Private
router.get('/:id',
  auth,
  validateObjectId(),
  handleValidationErrors,
  ingredientNameController.getIngredientNameById
);

// @route   POST /api/ingredients
// @desc    Create ingredient name
// @access  Admin
router.post('/',
  auth,
  admin,
  validateIngredientName(),
  handleValidationErrors,
  ingredientNameController.createIngredientName
);

// @route   PUT /api/ingredients/:id
// @desc    Update ingredient name
// @access  Admin
router.put('/:id',
  auth,
  admin,
  validateObjectId(),
  validateIngredientNameUpdate(),
  handleValidationErrors,
  ingredientNameController.updateIngredientName
);

// @route   DELETE /api/ingredients/:id
// @desc    Delete ingredient name
// @access  Admin
router.delete('/:id',
  auth,
  admin,
  validateObjectId(),
  handleValidationErrors,
  ingredientNameController.deleteIngredientName
);

module.exports = router;

