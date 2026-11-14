const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
  materialCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MaterialCategory',
    required: true
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

// Compound unique index for materialCategory + name
ingredientSchema.index({ materialCategory: 1, name: 1 }, { unique: true });

// Ensure virtual fields are serialized
ingredientSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Ingredient', ingredientSchema);
