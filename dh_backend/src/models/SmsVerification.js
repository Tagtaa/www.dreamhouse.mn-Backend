const mongoose = require('mongoose');

const smsVerificationSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^\+976[0-9]{8}$/.test(v);
      },
      message: 'Phone number must be in Mongolia format (+976XXXXXXXX)'
    }
  },
  code: {
    type: String,
    required: true,
    length: 5
  },
  expiresAt: {
    type: Date,
    required: true,
    default: function() {
      return new Date(Date.now() + (parseInt(process.env.SMS_EXPIRE_MINUTES) || 5) * 60 * 1000);
    }
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  attempts: {
    type: Number,
    default: 0,
    max: 3
  },
  ipAddress: {
    type: String,
    default: null
  },
  // SMS Parser specific fields
  parserConfirmedAt: {
    type: Date,
    default: null
  },
  parserAppVersion: {
    type: String,
    default: null
  },
  actualSmsContent: {
    type: String,
    default: null
  },
  smsParserPhone: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for better query performance and TTL
smsVerificationSchema.index({ phone: 1 });
smsVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
smsVerificationSchema.index({ code: 1 });
smsVerificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 }); // Remove after 1 hour

// Check if verification code is valid
smsVerificationSchema.methods.isValid = function() {
  return !this.isUsed && 
         this.expiresAt > new Date() && 
         this.attempts < 3;
};

// Mark verification as used
smsVerificationSchema.methods.markAsUsed = function() {
  this.isUsed = true;
  return this.save();
};

// Increment attempt count
smsVerificationSchema.methods.incrementAttempts = function() {
  this.attempts += 1;
  return this.save();
};

// Static method to find valid verification
smsVerificationSchema.statics.findValidVerification = function(phone, code) {
  return this.findOne({
    phone,
    code,
    isUsed: false,
    expiresAt: { $gt: new Date() },
    attempts: { $lt: 3 }
  });
};

// Static method to find valid verification with SMS parser confirmation
smsVerificationSchema.statics.findValidVerificationWithParserConfirmation = function(phone, code) {
  return this.findOne({
    phone,
    code,
    parserConfirmedAt: { $exists: true, $ne: null },
    expiresAt: { $gt: new Date() },
    attempts: { $lt: 3 }
  });
};

// Static method to cleanup expired verifications
smsVerificationSchema.statics.cleanupExpired = function() {
  return this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { isUsed: true },
      { attempts: { $gte: 3 } }
    ]
  });
};

module.exports = mongoose.model('SmsVerification', smsVerificationSchema); 