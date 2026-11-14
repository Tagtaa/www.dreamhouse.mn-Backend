const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: function() {
      return !this.sessionId; // senderId required if no sessionId
    }
  },
  // Anonymous user session ID
  sessionId: {
    type: String,
    required: function() {
      return !this.senderId; // sessionId required if no senderId
    }
  },
  senderType: {
    type: String,
    enum: ['user', 'admin', 'anonymous'],
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image'],
    default: 'text'
  },
  content: {
    type: String,
    required: function() {
      return this.messageType === 'text';
    }
  },
  imageUrl: {
    type: String,
    required: function() {
      return this.messageType === 'image';
    }
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  // Sender metadata for anonymous users
  senderMetadata: {
    ipAddress: String,
    userAgent: String,
    nickname: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, senderType: 1 });
MessageSchema.index({ sessionId: 1, senderType: 1 });

// A new message from the customer (user or guest) reopens a solved chat.
// Works for every send path (app, website, text, image) in one place.
MessageSchema.post('save', async function reopenSolvedChat(doc) {
  if (!['user', 'anonymous'].includes(doc.senderType) || !doc.conversationId) return;
  try {
    await mongoose.model('Conversation').updateOne(
      { _id: doc.conversationId, status: 'solved' },
      { $set: { status: 'unsolved', solvedAt: null, solvedBy: null } }
    );
  } catch (error) {
    console.error('Reopen solved chat error:', error.message);
  }
});

module.exports = mongoose.model('Message', MessageSchema);
