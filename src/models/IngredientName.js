const mongoose = require('mongoose');

const ingredientNameSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    maxlength: 200
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better query performance
ingredientNameSchema.index({ name: 1 });
ingredientNameSchema.index({ isActive: 1 });

module.exports = mongoose.model('IngredientName', ingredientNameSchema);

