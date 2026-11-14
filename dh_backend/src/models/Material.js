const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  // ALL FIELDS REQUIRED
  name: { type: String, required: true, trim: true, maxlength: 200 },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'MaterialCategory', required: true },
  price: { type: Number, required: true, min: 0 }, // Price / 1 piece
  specs: { type: String, required: true, trim: true, maxlength: 500 },
  rating: { type: Number, required: true, min: 0, max: 10 },
  
  // Size - ALL REQUIRED
  width: { type: Number, required: true, min: 0 },
  length: { type: Number, required: true, min: 0 },
  height: { type: Number, required: true, min: 0 },
  unit: { type: String, required: true, enum: ['mm', 'cm', 'm'], default: 'mm' },
  
  description: { type: String, required: true, trim: true, maxlength: 1000 },
  
  // Images - Only URLs
  images: [{ type: String, required: true }],
  
  // Ingredients - Reference to Ingredient model
  ingredients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ingredient'
  }],
  
  // Thickness Options - ALL REQUIRED
  thicknessOptions: [{
    thickness: { 
      value: { type: Number, required: true, min: 0 },
      unit: { type: String, required: true, enum: ['mm', 'cm', 'm'], default: 'mm' }
    },
    fileUrl: { type: String, required: true }
  }],
  
  // Ek alanlar
  likeCount: { type: Number, default: 0 },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isPremium: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  tags: [{ type: String, trim: true }],
  popularity: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 },
  supplier: {
    name: String,
    contact: String,
    location: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
materialSchema.index({ category: 1 });
materialSchema.index({ name: 'text', description: 'text' });
materialSchema.index({ isPremium: 1 });
materialSchema.index({ isActive: 1 });
materialSchema.index({ popularity: -1 });
materialSchema.index({ price: 1 });

// Virtual for formatted price
materialSchema.virtual('formattedPrice').get(function() {
  return `${this.price.toLocaleString()} MNT/piece`;
});

// Method to increment view count
materialSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

// Ensure virtual fields are serialized
materialSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Material', materialSchema); 