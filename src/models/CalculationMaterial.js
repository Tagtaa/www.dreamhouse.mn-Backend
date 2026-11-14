const mongoose = require('mongoose');

const calculationMaterialSchema = new mongoose.Schema({
  calculationType: {
    type: String,
    required: true,
    enum: [
      'wall',
      'fundament', 
      'roof',
      'inner_wall',
      'underfloor',
      'floor_tiles',
      'wall_decoration'
    ]
  },
  key: {
    type: String,
    required: true,
    trim: true
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
  ingredients: [{
    name: { type: String, required: true, trim: true },
    requiredPercent: { type: Number, required: true, min: 0, max: 100 },
    unit: { type: String, required: true, trim: true },
    costPerM3: { type: Number, min: 0 },
    costPerPacket: { type: Number, min: 0 },
    packageWeight: { type: Number, min: 0 }
  }],
  price: {
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: '₸',
      enum: ['₸', '₹', '₺', '$', '€']
    },
    unit: {
      type: String,
      required: true,
      enum: ['m2', 'm3', 'piece', 'kg', 'liter']
    }
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  likes: {
    type: Number,
    default: 0,
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

// Compound unique index for calculationType + key
calculationMaterialSchema.index({ calculationType: 1, key: 1 }, { unique: true });

// Ensure virtual fields are serialized
calculationMaterialSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('CalculationMaterial', calculationMaterialSchema);
