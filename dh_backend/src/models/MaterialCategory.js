const mongoose = require('mongoose');

const materialCategorySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true, 
    maxlength: 200 
  },
  parentCategory: { 
    type: Number, 
    required: true,
    ref: 'ParentCategory'
  },
  images: [{ 
    type: String, 
    required: true 
  }],
  percentValue: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, {
  timestamps: true
});

// Indexes for better query performance
materialCategorySchema.index({ name: 1 });
materialCategorySchema.index({ parentCategory: 1 });
materialCategorySchema.index({ isActive: 1 });

module.exports = mongoose.model('MaterialCategory', materialCategorySchema);
