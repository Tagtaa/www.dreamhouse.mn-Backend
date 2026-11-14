const mongoose = require('mongoose');

const heatingTypeSchema = new mongoose.Schema({
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
  description: { 
    type: String, 
    trim: true, 
    maxlength: 500 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, {
  timestamps: true,
  _id: false
});

heatingTypeSchema.index({ name: 1 });
heatingTypeSchema.index({ isActive: 1 });

module.exports = mongoose.model('HeatingType', heatingTypeSchema);
