const mongoose = require('mongoose');

const parentCategorySchema = new mongoose.Schema({
  _id: { 
    type: Number, 
    required: true 
  },
  name: { 
    type: String, 
    required: true, 
    trim: true, 
    maxlength: 100 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, {
  timestamps: true,
    _id: false // Prevent Mongoose from auto-generating _id
});

// Index for better query performance
parentCategorySchema.index({ name: 1 });
parentCategorySchema.index({ isActive: 1 });

module.exports = mongoose.model('ParentCategory', parentCategorySchema);
