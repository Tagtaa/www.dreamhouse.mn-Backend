const express = require('express');
const router = express.Router();
const ingredientsController = require('../controllers/ingredientsController');
const { auth, admin } = require('../middleware/auth');
const { 
  validateSearch,
  validateObjectId,
  handleValidationErrors 
} = require('../middleware/validation');
const { body } = require('express-validator');

// Validation for ingredient data (dynamic based on ingredientType)
const validateIngredientData = () => [
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Ingredient name must be between 1 and 100 characters'),
  body('unit')
    .isLength({ min: 1, max: 20 })
    .withMessage('Unit must be between 1 and 20 characters'),
  body('requiredPercent')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Required percent must be between 0 and 100'),
  body('priceForPer1Percent')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price for 100% must be a positive number'),
  body('pricePerM3')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price per m3 must be a positive number'),
  body('pricePerM2')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price per m2 must be a positive number'),
  body('sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a non-negative integer')
];

// Validation for ingredient update
const validateIngredientUpdate = () => [
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Ingredient name must be between 1 and 100 characters'),
  body('unit')
    .optional()
    .isLength({ min: 1, max: 20 })
    .withMessage('Unit must be between 1 and 20 characters'),
  body('requiredPercent')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Required percent must be between 0 and 100'),
  body('priceForPer1Percent')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price for 100% must be a positive number'),
  body('pricePerM3')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price per m3 must be a positive number'),
  body('pricePerM2')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price per m2 must be a positive number'),
  body('sortOrder')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order must be a non-negative integer'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

// Validation for ingredient deletion by name
const validateIngredientDeleteByName = () => [
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Ingredient name is required')
];

// Get ingredients for a specific material category
// GET /api/materials/categories/:categoryId/ingredients
router.get('/categories/:categoryId/ingredients', 
  auth, 
  validateObjectId('categoryId'),
  validateSearch(),
  handleValidationErrors,
  ingredientsController.getIngredients
);

// Add new ingredient to a material category (Admin only)
// POST /api/materials/categories/:categoryId/ingredients
router.post('/categories/:categoryId/ingredients',
  auth,
  admin,
  validateObjectId('categoryId'),
  validateIngredientData(),
  handleValidationErrors,
  ingredientsController.addIngredient
);

// Update ingredient in a material category by name (Admin only)
// PUT /api/materials/categories/:categoryId/ingredients
router.put('/categories/:categoryId/ingredients',
  auth,
  admin,
  validateObjectId('categoryId'),
  validateIngredientUpdate(),
  handleValidationErrors,
  ingredientsController.updateIngredientByName
);

// Delete ingredient by name (Admin only)
// DELETE /api/materials/categories/:categoryId/ingredients
router.delete('/categories/:categoryId/ingredients',
  auth,
  admin,
  validateObjectId('categoryId'),
  validateIngredientDeleteByName(),
  handleValidationErrors,
  ingredientsController.deleteIngredientByName
);

// Update ingredient by ID (Admin only)
// PUT /api/materials/categories/:categoryId/ingredients/:ingredientId
router.put('/categories/:categoryId/ingredients/:ingredientId',
  auth,
  admin,
  validateObjectId('categoryId'),
  validateObjectId('ingredientId'),
  validateIngredientUpdate(),
  handleValidationErrors,
  ingredientsController.updateIngredient
);

// Delete ingredient by ID (Admin only)
// DELETE /api/materials/categories/:categoryId/ingredients/:ingredientId
router.delete('/categories/:categoryId/ingredients/:ingredientId',
  auth,
  admin,
  validateObjectId('categoryId'),
  validateObjectId('ingredientId'),
  handleValidationErrors,
  ingredientsController.deleteIngredient
);

module.exports = router;
