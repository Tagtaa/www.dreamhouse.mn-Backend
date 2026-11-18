const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
  // Owner: each material has its own ingredients (see services/ingredientService.js)
  material: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material',
    index: true
  },
  // Legacy owner: ingredients used to belong to a material category.
  // Kept only so old rows stay readable; new ingredients set `material` instead.
  materialCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MaterialCategory'
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  requiredPercent: {
    type: Number,
    min: 0,
    max: 100
  },
  unit: {
    type: String,
    required: true,
    trim: true
  },
  // Price fields based on parent category ingredientType
  priceForPer1Percent: {
    type: Number,
    min: 0
  },
  pricePerM3: {
    type: Number,
    min: 0
  },
  pricePerM2: {
    type: Number,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Ingredient names are unique per owner. Partial indexes so material-owned rows
// (no materialCategory) never collide with each other on a null category.
ingredientSchema.index(
  { material: 1, name: 1 },
  { unique: true, name: 'material_1_name_1_partial', partialFilterExpression: { material: { $type: 'objectId' } } }
);
ingredientSchema.index(
  { materialCategory: 1, name: 1 },
  { unique: true, name: 'materialCategory_1_name_1_partial', partialFilterExpression: { materialCategory: { $type: 'objectId' } } }
);

// Ensure virtual fields are serialized
ingredientSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Ingredient', ingredientSchema);
