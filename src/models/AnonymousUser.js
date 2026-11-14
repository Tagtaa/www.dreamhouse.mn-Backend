const mongoose = require('mongoose');

const AnonymousUserSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    default: ''
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  nickname: {
    type: String,
    default: 'Guest',
    maxlength: 50
  }
}, {
  timestamps: true
});

// Update lastSeen on each interaction
AnonymousUserSchema.methods.updateLastSeen = function() {
  this.lastSeen = new Date();
  return this.save();
};

// Static method to find or create anonymous user
AnonymousUserSchema.statics.findOrCreate = async function(sessionId, ipAddress, userAgent = '') {
  let anonymousUser = await this.findOne({ sessionId });
  
  if (!anonymousUser) {
    anonymousUser = new this({
      sessionId,
      ipAddress,
      userAgent
    });
    await anonymousUser.save();
  } else {
    anonymousUser.lastSeen = new Date();
    anonymousUser.userAgent = userAgent;
    await anonymousUser.save();
  }
  
  return anonymousUser;
};

module.exports = mongoose.model('AnonymousUser', AnonymousUserSchema);
