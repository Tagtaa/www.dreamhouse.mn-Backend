const mongoose = require('mongoose');

const bankTransactionSchema = new mongoose.Schema({
  smsContent: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^\+976[0-9]{8}$/.test(v);
      },
      message: 'Phone number must be in Mongolia format (+976XXXXXXXX)'
    }
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'MNT'
  },
  bankName: {
    type: String,
    required: true,
    trim: true
  },
  transactionType: {
    type: String,
    enum: ['credit', 'debit'],
    default: 'credit'
  },
  transactionNote: {
    type: String,
    trim: true
  },
  isProcessed: {
    type: Boolean,
    default: false
  },
  processedAt: {
    type: Date,
    default: null
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  walletBalanceBefore: {
    type: Number,
    default: null
  },
  walletBalanceAfter: {
    type: Number,
    default: null
  },
  parserAppVersion: {
    type: String,
    trim: true
  },
  smsTimestamp: {
    type: Date,
    required: true
  },
  processingError: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['valid', 'wrong'],
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
bankTransactionSchema.index({ phoneNumber: 1, createdAt: -1 });
bankTransactionSchema.index({ isProcessed: 1 });
bankTransactionSchema.index({ smsTimestamp: -1 });
bankTransactionSchema.index({ userId: 1 });

// Static method to find unprocessed transactions
bankTransactionSchema.statics.findUnprocessed = function() {
  return this.find({ isProcessed: false }).sort({ createdAt: 1 });
};

// Instance method to mark as processed
bankTransactionSchema.methods.markAsProcessed = function(userId, balanceBefore, balanceAfter) {
  this.isProcessed = true;
  this.processedAt = new Date();
  this.userId = userId;
  this.walletBalanceBefore = balanceBefore;
  this.walletBalanceAfter = balanceAfter;
  return this.save();
};

// Instance method to mark processing error
bankTransactionSchema.methods.markProcessingError = function(error) {
  this.processingError = error;
  this.isProcessed = false; // Keep as unprocessed for retry
  return this.save();
};

module.exports = mongoose.model('BankTransaction', bankTransactionSchema);