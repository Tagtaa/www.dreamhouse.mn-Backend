const mongoose = require('mongoose');

const wallThicknessSchema = new mongoose.Schema({
  calculationType: {
    type: String,
    default: 'wall',
    enum: ['wall']
  },
  key: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  thickness: {
    type: Number,
    required: true,
    min: 1,
    max: 100
  },
  unit: {
    type: String,
    default: 'cm',
    enum: ['cm', 'mm', 'inch']
  },
  imageUrl: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
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

// Compound unique index for calculationType + key
wallThicknessSchema.index({ calculationType: 1, key: 1 }, { unique: true });

// Ensure virtual fields are serialized
wallThicknessSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('WallThickness', wallThicknessSchema);
