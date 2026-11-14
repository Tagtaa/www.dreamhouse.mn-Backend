const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
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
  item: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
    description: 'Name of the purchased item or service'
  },
  amount: {
    type: Number,
    required: true,
    min: 1000,
    max: 1000000,
    description: 'Purchase amount in MNT'
  },
  date: {
    type: Date,
    default: Date.now,
    description: 'Purchase date and time'
  },
  processedBy: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
    description: 'Operator or system that processed the purchase'
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending',
    description: 'Purchase status'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500,
    description: 'Additional notes about the purchase'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
purchaseSchema.index({ phone: 1 });
purchaseSchema.index({ orderId: 1 });
purchaseSchema.index({ date: -1 });
purchaseSchema.index({ status: 1 });
purchaseSchema.index({ processedBy: 1 });
purchaseSchema.index({ item: 1 });

// Generate unique order ID
purchaseSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderId) {
    this.orderId = this.generateOrderId();
  }
  next();
});

// Generate random order ID
purchaseSchema.methods.generateOrderId = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

module.exports = mongoose.model('Purchase', purchaseSchema);
