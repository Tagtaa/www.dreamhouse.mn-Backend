const Ingredient = require('../models/Ingredient');
const MaterialCategory = require('../models/MaterialCategory');
const ParentCategory = require('../models/ParentCategory');
const errorMessageService = require('../services/errorMessageService');

const parseNumber = value => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

// @desc    Get ingredients for a specific material category
// @route   GET /api/materials/categories/:categoryId/ingredients
// @access  Private
const getIngredients = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const query = req.query.q; // Search query parameter

    // Check if category exists
    const category = await MaterialCategory.findById(categoryId).populate('parentCategory', 'name');
    if (!category) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('MATERIAL_CATEGORY_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Filter ingredients by material category
    const filter = {
      materialCategory: categoryId,
      isActive: true
    };

    // Add search functionality for ingredient names
    if (query) {
      const regexQuery = new RegExp(query, 'i');
      filter.name = regexQuery;
    }

    const ingredients = await Ingredient.find(filter)
      .sort({ sortOrder: 1, createdAt: -1 });

    // Process ingredients based on unit
    const processedIngredients = ingredients.map(ingredient => {
      const ingredientDoc = ingredient.toObject();

      const processedIngredient = {
        id: ingredientDoc._id,
        materialCategory: ingredientDoc.materialCategory,
        name: ingredientDoc.name,
        unit: ingredientDoc.unit,
        isActive: ingredientDoc.isActive,
        sortOrder: ingredientDoc.sortOrder
      };

      // Determine type based on unit
      const unit = String(ingredientDoc.unit || '').trim().toLowerCase();
      const isM3 = unit === 'm3';
      const isM2 = unit === 'm2';

      // Add fields based on unit
      if (isM3) {
        // m3 type - use percentValue and pricePerM3
        processedIngredient.percentValue = ingredientDoc.requiredPercent ?? null;
        processedIngredient.pricePerM3 = ingredientDoc.pricePerM3 ?? null;
      } else if (isM2) {
        // m2 type - use percentValue and pricePerM2
        processedIngredient.percentValue = ingredientDoc.requiredPercent ?? null;
        processedIngredient.pricePerM2 = ingredientDoc.pricePerM2 ?? null;
      } else {
        // percentage type (default)
        processedIngredient.percentValue = ingredientDoc.requiredPercent ?? null;
        processedIngredient.priceForPer1Percent = ingredientDoc.priceForPer1Percent ?? null;
      }

      return processedIngredient;
    });

    res.status(200).json({
      success: true,
      data: {
        ingredients: processedIngredients,
        categoryId,
        query: query || null,
        total: processedIngredients.length
      }
    });
  } catch (error) {
    console.error('Get ingredients error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Add new ingredient for a material category (Admin only)
// @route   POST /api/materials/categories/:categoryId/ingredients
// @access  Admin
const addIngredient = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, requiredPercent, percentValue, m3Amount, m2Amount, unit, priceForPer1Percent, pricePerM3, pricePerM2, sortOrder } = req.body;

    // Check if category exists
    const category = await MaterialCategory.findById(categoryId).populate('parentCategory', 'name');
    if (!category) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('MATERIAL_CATEGORY_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Determine type based on unit
    const unitStr = String(unit || '').trim().toLowerCase();
    const isM3 = unitStr === 'm3';
    const isM2 = unitStr === 'm2';

    // Convert form-data strings to appropriate types
    // Support both old field names (requiredPercent) and new field names (percentValue, m3Amount, m2Amount)
    let parsedRequiredPercent, parsedPriceForPer1Percent, parsedPricePerM3, parsedPricePerM2;
    
    if (isM3) {
      // For m3 type, support percentValue, m3Amount, or requiredPercent
      parsedRequiredPercent = parseNumber(percentValue ?? m3Amount ?? requiredPercent);
      parsedPricePerM3 = parseNumber(pricePerM3);
      
      // m3Amount and pricePerM3 are nullable
    } else if (isM2) {
      // For m2 type, support percentValue, m2Amount, or requiredPercent
      parsedRequiredPercent = parseNumber(percentValue ?? m2Amount ?? requiredPercent);
      parsedPricePerM2 = parseNumber(pricePerM2);
      
      // m2Amount and pricePerM2 are nullable
    } else {
      // percentage type (default)
      parsedRequiredPercent = parseNumber(percentValue ?? requiredPercent);
      parsedPriceForPer1Percent = parseNumber(priceForPer1Percent);
      
      // Validate: percentValue and priceForPer1Percent must be provided together
      if (name) {
        const hasPercentValue = parsedRequiredPercent !== undefined && parsedRequiredPercent !== null;
        const hasPrice = parsedPriceForPer1Percent !== undefined && parsedPriceForPer1Percent !== null;
        
        if (!hasPercentValue || !hasPrice) {
          return res.status(400).json({
            success: false,
            message: errorMessageService.getMessage('PERCENTAGE_TYPE_FIELDS_REQUIRED', errorMessageService.getLocaleFromRequest(req))
          });
        }
      }
    }
    
    const parsedSortOrder = parseNumber(sortOrder);

    // Check if ingredient already exists for this category
    const existingIngredient = await Ingredient.findOne({ 
      materialCategory: categoryId, 
      name: name 
    });
    
    if (existingIngredient) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('INGREDIENT_EXISTS', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Build ingredient data based on unit
    const ingredientData = {
      materialCategory: categoryId,
      name,
      unit,
      sortOrder: parsedSortOrder || 0
    };

    if (isM3) {
      ingredientData.requiredPercent = parsedRequiredPercent;
      ingredientData.pricePerM3 = parsedPricePerM3;
    } else if (isM2) {
      ingredientData.requiredPercent = parsedRequiredPercent;
      ingredientData.pricePerM2 = parsedPricePerM2;
    } else {
      // percentage type (default)
      ingredientData.requiredPercent = parsedRequiredPercent;
      ingredientData.priceForPer1Percent = parsedPriceForPer1Percent;
    }

    // Create new ingredient
    const newIngredient = await Ingredient.create(ingredientData);

    // If percentage type (not m3 or m2), check if total is 100
    if (!isM3 && !isM2) {
      const allIngredients = await Ingredient.find({ 
        materialCategory: categoryId,
        isActive: true 
      });
      const totalPercent = allIngredients.reduce((sum, ing) => sum + (ing.requiredPercent || 0), 0);
      
      if (Math.abs(totalPercent - 100) > 0.01) {
        // Don't delete, just warn
        console.warn(`Warning: Total percentage is ${totalPercent}, should be 100`);
      }
    }

    res.status(201).json({
      success: true,
      message: errorMessageService.getMessage('INGREDIENT_ADDED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        ingredient: newIngredient
      }
    });
  } catch (error) {
    console.error('Add ingredient error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('INGREDIENT_EXISTS', errorMessageService.getLocaleFromRequest(req))
      });
    }
    
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Update ingredient (Admin only)
// @route   PUT /api/materials/categories/:categoryId/ingredients/:ingredientId
// @access  Admin
const updateIngredient = async (req, res) => {
  try {
    const { categoryId, ingredientId } = req.params;
    const { name, requiredPercent, percentValue, m3Amount, m2Amount, unit, priceForPer1Percent, pricePerM3, pricePerM2, sortOrder, isActive } = req.body;

    // Check if category exists
    const category = await MaterialCategory.findById(categoryId).populate('parentCategory', 'name');
    if (!category) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('MATERIAL_CATEGORY_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Find ingredient by ID and category FIRST
    const ingredient = await Ingredient.findOne({ 
      _id: ingredientId, 
      materialCategory: categoryId 
    });
    
    if (!ingredient) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('INGREDIENT_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Determine type based on unit (use existing ingredient's unit if unit not provided in update)
    const currentUnit = unit !== undefined ? unit : ingredient.unit;
    const unitStr = String(currentUnit || '').trim().toLowerCase();
    const isM3 = unitStr === 'm3';
    const isM2 = unitStr === 'm2';

    // Convert values
    // Support both old field names (requiredPercent) and new field names (percentValue, m3Amount, m2Amount)
    let parsedRequiredPercent, parsedPriceForPer1Percent, parsedPricePerM3, parsedPricePerM2;
    
    if (isM3) {
      // For m3 type, support percentValue, m3Amount, or requiredPercent
      parsedRequiredPercent = parseNumber(percentValue ?? m3Amount ?? requiredPercent);
      parsedPricePerM3 = parseNumber(pricePerM3);
      
      // m3Amount and pricePerM3 are nullable
    } else if (isM2) {
      // For m2 type, support percentValue, m2Amount, or requiredPercent
      parsedRequiredPercent = parseNumber(percentValue ?? m2Amount ?? requiredPercent);
      parsedPricePerM2 = parseNumber(pricePerM2);
      
      // m2Amount and pricePerM2 are nullable
    } else {
      // percentage type (default)
      parsedRequiredPercent = parseNumber(percentValue ?? requiredPercent);
      parsedPriceForPer1Percent = parseNumber(priceForPer1Percent);
      
      // Validate: percentValue and priceForPer1Percent must be provided together (only if both are being updated)
      if (parsedRequiredPercent !== undefined && parsedPriceForPer1Percent === undefined) {
        // If percentValue is provided but price is not, check if we're updating both
        if (percentValue !== undefined || requiredPercent !== undefined) {
          return res.status(400).json({
            success: false,
            message: errorMessageService.getMessage('PERCENTAGE_TYPE_FIELDS_REQUIRED', errorMessageService.getLocaleFromRequest(req))
          });
        }
      }
      if (parsedPriceForPer1Percent !== undefined && parsedRequiredPercent === undefined) {
        return res.status(400).json({
          success: false,
          message: errorMessageService.getMessage('PERCENTAGE_TYPE_FIELDS_REQUIRED', errorMessageService.getLocaleFromRequest(req))
        });
      }
    }
    
    const parsedSortOrder = parseNumber(sortOrder);

    // Check if name is being changed and if it conflicts with existing ingredient
    if (name !== undefined && name !== ingredient.name) {
      const existingIngredient = await Ingredient.findOne({ 
        materialCategory: categoryId, 
        name: name,
        _id: { $ne: ingredientId }
      });
      
      if (existingIngredient) {
        return res.status(400).json({
          success: false,
          message: errorMessageService.getMessage('INGREDIENT_EXISTS', errorMessageService.getLocaleFromRequest(req))
        });
      }
    }

    // Update ingredient properties
    if (name !== undefined) ingredient.name = name;
    if (unit !== undefined) ingredient.unit = unit;
    if (parsedSortOrder !== undefined) ingredient.sortOrder = parsedSortOrder;
    if (isActive !== undefined) ingredient.isActive = isActive;

    // Update price fields based on unit
    if (isM3) {
      if (parsedRequiredPercent !== undefined) ingredient.requiredPercent = parsedRequiredPercent;
      if (parsedPricePerM3 !== undefined) ingredient.pricePerM3 = parsedPricePerM3;
      // Clear other price fields
      ingredient.priceForPer1Percent = undefined;
      ingredient.pricePerM2 = undefined;
    } else if (isM2) {
      if (parsedRequiredPercent !== undefined) ingredient.requiredPercent = parsedRequiredPercent;
      if (parsedPricePerM2 !== undefined) ingredient.pricePerM2 = parsedPricePerM2;
      // Clear other price fields
      ingredient.priceForPer1Percent = undefined;
      ingredient.pricePerM3 = undefined;
    } else {
      // percentage type (default)
      if (parsedRequiredPercent !== undefined) ingredient.requiredPercent = parsedRequiredPercent;
      if (parsedPriceForPer1Percent !== undefined) ingredient.priceForPer1Percent = parsedPriceForPer1Percent;
      // Clear other price fields
      ingredient.pricePerM3 = undefined;
      ingredient.pricePerM2 = undefined;
    }

    await ingredient.save();

    // If percentage type (not m3 or m2), validate total is 100
    if (!isM3 && !isM2 && ingredient.isActive) {
      const allIngredients = await Ingredient.find({ 
        materialCategory: categoryId,
        isActive: true 
      });
      const totalPercent = allIngredients.reduce((sum, ing) => sum + (ing.requiredPercent || 0), 0);
      
      if (Math.abs(totalPercent - 100) > 0.01) {
        console.warn(`Warning: Total percentage is ${totalPercent}, should be 100`);
      }
    }

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('INGREDIENT_UPDATED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        ingredient: ingredient
      }
    });
  } catch (error) {
    console.error('Update ingredient error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('INGREDIENT_EXISTS', errorMessageService.getLocaleFromRequest(req))
      });
    }
    
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Delete ingredient (Admin only)
// @route   DELETE /api/materials/categories/:categoryId/ingredients/:ingredientId
// @access  Admin
const deleteIngredient = async (req, res) => {
  try {
    const { categoryId, ingredientId } = req.params;

    const ingredient = await Ingredient.findOne({ 
      _id: ingredientId, 
      materialCategory: categoryId 
    });
    
    if (!ingredient) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('INGREDIENT_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    const ingredientName = ingredient.name;
    await Ingredient.deleteOne({ _id: ingredientId });

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('INGREDIENT_DELETED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        deletedIngredient: ingredientName
      }
    });
  } catch (error) {
    console.error('Delete ingredient error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Update ingredient by name (Admin only)
// @route   PUT /api/materials/categories/:categoryId/ingredients
// @access  Admin
const updateIngredientByName = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, requiredPercent, percentValue, m3Amount, m2Amount, unit, priceForPer1Percent, pricePerM3, pricePerM2, sortOrder, isActive } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('INGREDIENT_NAME_REQUIRED', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Check if category exists
    const category = await MaterialCategory.findById(categoryId).populate('parentCategory', 'name');
    if (!category) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('MATERIAL_CATEGORY_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Find ingredient by name and category FIRST
    const ingredient = await Ingredient.findOne({ 
      materialCategory: categoryId, 
      name: name 
    });
    
    if (!ingredient) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('INGREDIENT_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Determine type based on unit (use existing ingredient's unit if unit not provided in update)
    const currentUnit = unit !== undefined ? unit : ingredient.unit;
    const unitStr = String(currentUnit || '').trim().toLowerCase();
    const isM3 = unitStr === 'm3';
    const isM2 = unitStr === 'm2';

    // Convert form-data strings to appropriate types
    // Support both old field names (requiredPercent) and new field names (percentValue, m3Amount, m2Amount)
    let parsedRequiredPercent, parsedPriceForPer1Percent, parsedPricePerM3, parsedPricePerM2;
    
    if (isM3) {
      // For m3 type, support percentValue, m3Amount, or requiredPercent
      parsedRequiredPercent = parseNumber(percentValue ?? m3Amount ?? requiredPercent);
      parsedPricePerM3 = parseNumber(pricePerM3);
      
      // m3Amount and pricePerM3 are nullable
    } else if (isM2) {
      // For m2 type, support percentValue, m2Amount, or requiredPercent
      parsedRequiredPercent = parseNumber(percentValue ?? m2Amount ?? requiredPercent);
      parsedPricePerM2 = parseNumber(pricePerM2);
      
      // m2Amount and pricePerM2 are nullable
    } else {
      // percentage type (default)
      parsedRequiredPercent = parseNumber(percentValue ?? requiredPercent);
      parsedPriceForPer1Percent = parseNumber(priceForPer1Percent);
      
      // Validate: percentValue and priceForPer1Percent must be provided together (only if both are being updated)
      if (parsedRequiredPercent !== undefined && parsedPriceForPer1Percent === undefined) {
        // If percentValue is provided but price is not, check if we're updating both
        if (percentValue !== undefined || requiredPercent !== undefined) {
          return res.status(400).json({
            success: false,
            message: errorMessageService.getMessage('PERCENTAGE_TYPE_FIELDS_REQUIRED', errorMessageService.getLocaleFromRequest(req))
          });
        }
      }
      if (parsedPriceForPer1Percent !== undefined && parsedRequiredPercent === undefined) {
        return res.status(400).json({
          success: false,
          message: errorMessageService.getMessage('PERCENTAGE_TYPE_FIELDS_REQUIRED', errorMessageService.getLocaleFromRequest(req))
        });
      }
    }
    
    const parsedSortOrder = parseNumber(sortOrder);

    // Update ingredient properties
    if (unit !== undefined) ingredient.unit = unit;
    if (parsedSortOrder !== undefined) ingredient.sortOrder = parsedSortOrder;
    if (isActive !== undefined) ingredient.isActive = isActive;

    // Update price fields based on unit
    if (isM3) {
      if (parsedRequiredPercent !== undefined) ingredient.requiredPercent = parsedRequiredPercent;
      if (parsedPricePerM3 !== undefined) ingredient.pricePerM3 = parsedPricePerM3;
    } else if (isM2) {
      if (parsedRequiredPercent !== undefined) ingredient.requiredPercent = parsedRequiredPercent;
      if (parsedPricePerM2 !== undefined) ingredient.pricePerM2 = parsedPricePerM2;
    } else {
      // percentage type (default)
      if (parsedRequiredPercent !== undefined) ingredient.requiredPercent = parsedRequiredPercent;
      if (parsedPriceForPer1Percent !== undefined) ingredient.priceForPer1Percent = parsedPriceForPer1Percent;
    }

    await ingredient.save();

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('INGREDIENT_UPDATED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        ingredient: ingredient
      }
    });
  } catch (error) {
    console.error('Update ingredient by name error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Delete ingredient by name (Admin only)
// @route   DELETE /api/materials/categories/:categoryId/ingredients
// @access  Admin
const deleteIngredientByName = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('INGREDIENT_NAME_REQUIRED', errorMessageService.getLocaleFromRequest(req))
      });
    }

    const ingredient = await Ingredient.findOne({ 
      materialCategory: categoryId, 
      name: name 
    });
    
    if (!ingredient) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('INGREDIENT_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    const ingredientName = ingredient.name;
    await Ingredient.deleteOne({ _id: ingredient._id });

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('INGREDIENT_DELETED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        deletedIngredient: ingredientName
      }
    });
  } catch (error) {
    console.error('Delete ingredient by name error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

module.exports = {
  getIngredients,
  addIngredient,
  updateIngredient,
  deleteIngredient,
  updateIngredientByName,
  deleteIngredientByName
};
