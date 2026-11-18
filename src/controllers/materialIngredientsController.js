const Material = require('../models/Material');
const errorMessageService = require('../services/errorMessageService');
const ingredientService = require('../services/ingredientService');

const locale = (req) => errorMessageService.getLocaleFromRequest(req);

// @desc    Get a material's own ingredients
// @route   GET /api/materials/:materialId/ingredients
// @access  Public (admins may pass ?includeInactive=true)
const getMaterialIngredients = async (req, res) => {
  try {
    const { materialId } = req.params;
    const material = await Material.findById(materialId).select('_id name');
    if (!material) {
      return res.status(404).json({ success: false, message: errorMessageService.getMessage('MATERIAL_NOT_FOUND', locale(req)) });
    }
    const includeInactive = req.query.includeInactive === 'true';
    const ingredients = await ingredientService.getMaterialIngredients(material._id, { includeInactive });
    res.status(200).json({
      success: true,
      data: { materialId: material._id, ingredients, total: ingredients.length }
    });
  } catch (error) {
    console.error('Get material ingredients error:', error);
    res.status(500).json({ success: false, message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', locale(req)) });
  }
};

// @desc    Replace all ingredients of a material
// @route   PUT /api/materials/:materialId/ingredients   body: { ingredients: [...] }
// @access  Admin
const replaceMaterialIngredients = async (req, res) => {
  try {
    const { materialId } = req.params;
    const material = await Material.findById(materialId).select('_id name');
    if (!material) {
      return res.status(404).json({ success: false, message: errorMessageService.getMessage('MATERIAL_NOT_FOUND', locale(req)) });
    }
    const ingredients = await ingredientService.replaceMaterialIngredients(material._id, req.body?.ingredients);
    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('MATERIAL_INGREDIENTS_UPDATED', locale(req)),
      data: { materialId: material._id, ingredients, total: ingredients.length }
    });
  } catch (error) {
    if (error instanceof ingredientService.IngredientValidationError) {
      return res.status(400).json({ success: false, message: errorMessageService.getMessage(error.key, locale(req), error.params) });
    }
    if (error && error.code === 11000) {
      return res.status(400).json({ success: false, message: errorMessageService.getMessage('INGREDIENT_EXISTS', locale(req)) });
    }
    console.error('Replace material ingredients error:', error);
    res.status(500).json({ success: false, message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', locale(req)) });
  }
};

module.exports = { getMaterialIngredients, replaceMaterialIngredients };
