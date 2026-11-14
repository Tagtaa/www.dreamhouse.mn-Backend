const mongoose = require('mongoose');

const depositSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    trim: true,
    match: /^\+976[0-9]{8}$/,
    description: 'User phone number in Mongolia format'
  },
  orderId: {
    type: String,
    required: false, // Will be auto-generated
    unique: true,
    trim: true,
    minlength: 6,
    maxlength: 10,
    description: 'Unique order identifier'
  },
  amount: {
    type: Number,
    required: true,
    min: 1000,
    max: 1000000,
    description: 'Deposit amount in MNT'
  },
  date: {
    type: Date,
    default: Date.now,
    description: 'Deposit date and time'
  },
  processedBy: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
    description: 'Operator or system that processed the deposit'
  },
  status: {
    type: String,
    enum: ['wrong', 'confirmed'],
    default: 'wrong',
    description: 'Deposit status'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500,
    description: 'Additional notes about the deposit'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
depositSchema.index({ phone: 1 });
depositSchema.index({ orderId: 1 });
depositSchema.index({ date: -1 });
depositSchema.index({ status: 1 });
depositSchema.index({ processedBy: 1 });

// Generate unique order ID
depositSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderId) {
    this.orderId = this.generateOrderId();
  }
  next();
});

// Generate random order ID
depositSchema.methods.generateOrderId = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

module.exports = mongoose.model('Deposit', depositSchema);
