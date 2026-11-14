const IngredientName = require('../models/IngredientName');
const errorMessageService = require('../services/errorMessageService');

// @desc    Get all ingredient names
// @route   GET /api/ingredients
// @access  Private
const getIngredientNames = async (req, res) => {
  try {
    const query = req.query.q; // Search query parameter
    const includeInactive = req.query.includeInactive === 'true';
    
    const filter = {};
    
    if (!includeInactive) {
      filter.isActive = true;
    }
    
    // Add search functionality
    if (query) {
      const regexQuery = new RegExp(query, 'i');
      filter.name = regexQuery;
    }
    
    const ingredientNames = await IngredientName.find(filter)
      .sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      data: {
        ingredients: ingredientNames,
        query: query || null,
        total: ingredientNames.length
      }
    });
  } catch (error) {
    console.error('Get ingredient names error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Get ingredient name by ID
// @route   GET /api/ingredients/:id
// @access  Private
const getIngredientNameById = async (req, res) => {
  try {
    const ingredientName = await IngredientName.findById(req.params.id);
    
    if (!ingredientName) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('INGREDIENT_NAME_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        ingredient: ingredientName
      }
    });
  } catch (error) {
    console.error('Get ingredient name by ID error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Create ingredient name
// @route   POST /api/ingredients
// @access  Admin
const createIngredientName = async (req, res) => {
  try {
    const { name, isActive } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('INGREDIENT_NAME_REQUIRED', errorMessageService.getLocaleFromRequest(req))
      });
    }
    
    // Check if ingredient name already exists
    const existingIngredient = await IngredientName.findOne({ 
      name: name.trim() 
    });
    
    if (existingIngredient) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('INGREDIENT_NAME_EXISTS', errorMessageService.getLocaleFromRequest(req))
      });
    }
    
    const ingredientName = await IngredientName.create({
      name: name.trim(),
      isActive: isActive !== undefined ? isActive : true
    });
    
    res.status(201).json({
      success: true,
      message: errorMessageService.getMessage('INGREDIENT_NAME_CREATED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        ingredient: ingredientName
      }
    });
  } catch (error) {
    console.error('Create ingredient name error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('INGREDIENT_NAME_EXISTS', errorMessageService.getLocaleFromRequest(req))
      });
    }
    
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Update ingredient name
// @route   PUT /api/ingredients/:id
// @access  Admin
const updateIngredientName = async (req, res) => {
  try {
    const { name, isActive } = req.body;
    
    const ingredientName = await IngredientName.findById(req.params.id);
    
    if (!ingredientName) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('INGREDIENT_NAME_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }
    
    // Check if name is being changed and if it conflicts with existing ingredient
    if (name !== undefined && name.trim() !== ingredientName.name) {
      const existingIngredient = await IngredientName.findOne({ 
        name: name.trim(),
        _id: { $ne: req.params.id }
      });
      
      if (existingIngredient) {
        return res.status(400).json({
          success: false,
          message: errorMessageService.getMessage('INGREDIENT_NAME_EXISTS', errorMessageService.getLocaleFromRequest(req))
        });
      }
      
      ingredientName.name = name.trim();
    }
    
    if (isActive !== undefined) {
      ingredientName.isActive = isActive;
    }
    
    await ingredientName.save();
    
    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('INGREDIENT_NAME_UPDATED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        ingredient: ingredientName
      }
    });
  } catch (error) {
    console.error('Update ingredient name error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('INGREDIENT_NAME_EXISTS', errorMessageService.getLocaleFromRequest(req))
      });
    }
    
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// @desc    Delete ingredient name
// @route   DELETE /api/ingredients/:id
// @access  Admin
const deleteIngredientName = async (req, res) => {
  try {
    const ingredientName = await IngredientName.findById(req.params.id);
    
    if (!ingredientName) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('INGREDIENT_NAME_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }
    
    await IngredientName.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('INGREDIENT_NAME_DELETED', errorMessageService.getLocaleFromRequest(req)),
      data: {
        deletedIngredient: ingredientName.name
      }
    });
  } catch (error) {
    console.error('Delete ingredient name error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

module.exports = {
  getIngredientNames,
  getIngredientNameById,
  createIngredientName,
  updateIngredientName,
  deleteIngredientName
};

