const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return !this.sessionId; // userId required if no sessionId
    }
  },
  // Anonymous user session ID
  sessionId: {
    type: String,
    required: function() {
      return !this.userId; // sessionId required if no userId
    },
    unique: true,
    sparse: true
  },
  // Anonymous user reference
  anonymousUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AnonymousUser'
  },
  // Admin ID - unified admin ID for all admins
  adminId: {
    type: String,
    default: null // Only set for admin conversations
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  unreadCount: {
    user: {
      type: Number,
      default: 0
    },
    admin: {
      type: Number,
      default: 0
    },
    anonymous: {
      type: Number,
      default: 0
    }
  },
  // Conversation-level read tracking
  lastReadByAdmin: {
    type: Date,
    default: null
  },
  lastReadByUser: {
    type: Date,
    default: null
  },
  lastReadByAnonymous: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Unique index for one conversation per user
ConversationSchema.index({ userId: 1 }, { unique: true, sparse: true });
ConversationSchema.index({ sessionId: 1 }, { unique: true, sparse: true });
// Unique index for anonymous conversations with adminId (only when both exist)
ConversationSchema.index({ sessionId: 1, adminId: 1 }, { unique: true, partialFilterExpression: { sessionId: { $exists: true }, adminId: { $exists: true } } });
ConversationSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model('Conversation', ConversationSchema);
