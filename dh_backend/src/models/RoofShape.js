const mongoose = require('mongoose');

const roofShapeSchema = new mongoose.Schema({
  calculationType: {
    type: String,
    default: 'roof',
    enum: ['roof']
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
roofShapeSchema.index({ calculationType: 1, key: 1 }, { unique: true });

// Ensure virtual fields are serialized
roofShapeSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('RoofShape', roofShapeSchema);
