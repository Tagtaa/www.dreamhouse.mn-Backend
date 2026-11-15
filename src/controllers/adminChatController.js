const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const AnonymousUser = require('../models/AnonymousUser');
const errorMessageService = require('../services/errorMessageService');
const { deleteChatImage, deleteConversationFolder } = require('../services/chatStorageService');

const ADMIN_ROLES = ['admin', 'superadmin', 'operator'];

const forbidden = (req, res) => res.status(403).json({
  success: false,
  message: errorMessageService.getMessage('ADMIN_ACCESS_REQUIRED', errorMessageService.getLocaleFromRequest(req)),
  code: 'ADMIN_ACCESS_REQUIRED'
});

const serverError = (req, res, error, label) => {
  console.error(label, error);
  res.status(500).json({
    success: false,
    message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
  });
};

const notFound = (res) => res.status(404).json({ success: false, message: 'Chat not found', code: 'CHAT_NOT_FOUND' });
const findChat = (id) => (require('mongoose').isValidObjectId(id) ? Conversation.findById(id) : null);

const lastMessageSummary = (m) => m ? {
  _id: m._id,
  senderType: m.senderType,
  messageType: m.messageType,
  content: m.messageType === 'text' ? m.content : undefined,
  imageUrl: m.messageType === 'image' ? m.imageUrl : undefined,
  createdAt: m.createdAt,
  isRead: m.isRead
} : null;

// One shape for user and guest chats (what /dashboard/chat renders)
const toChat = (conv) => {
  const user = conv.userId && conv.userId._id ? conv.userId : null;
  return {
    _id: conv._id,
    conversationId: conv._id,
    kind: conv.sessionId ? 'anonymous' : 'user',
    sessionId: conv.sessionId || undefined,
    user: user ? {
      _id: user._id,
      username: user.username,
      phone: user.phone,
      phoneNumber: user.phone,
      email: user.email,
      profileImage: user.profileImage,
      // Dashboard chat shows a gold star for users with an active membership
      membership: user.membership ? { type: user.membership.type, expiresAt: user.membership.expiresAt } : null
    } : null,
    anonymousUserId: conv.anonymousUserId || null,
    lastMessage: lastMessageSummary(conv.lastMessage),
    lastMessageAt: conv.lastMessageAt,
    unreadCount: conv.unreadCount,
    status: conv.status === 'solved' ? 'solved' : 'unsolved',
    solvedAt: conv.solvedAt || null,
    createdAt: conv.createdAt
  };
};

// @desc    All support chats (users + guests) in one list: unsolved first, then newest
// @route   GET /api/messages/admin/chats
// @access  Admin
const getAllChats = async (req, res) => {
  try {
    if (req.accountType !== 'admin') return forbidden(req, res);
    const limit = Math.min(parseInt(req.query.limit) || 200, 500);

    const conversations = await Conversation.find({ isActive: true, lastMessage: { $ne: null } })
      .populate('userId', 'username phone email profileImage membership')
      .populate('anonymousUserId', 'nickname ipAddress lastSeen')
      .populate('lastMessage')
      .sort({ lastMessageAt: -1 })
      .limit(limit)
      .lean();

    const chats = conversations
      .filter((c) => c.sessionId || (c.userId && c.userId._id)) // skip chats of deleted users
      .map(toChat)
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === 'unsolved' ? -1 : 1;
        return new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0);
      });

    res.json({
      success: true,
      data: {
        chats,
        counts: {
          total: chats.length,
          unsolved: chats.filter((c) => c.status === 'unsolved').length,
          solved: chats.filter((c) => c.status === 'solved').length
        }
      }
    });
  } catch (error) {
    serverError(req, res, error, 'Get all chats error:');
  }
};

// @desc    Mark a chat solved / unsolved
// @route   PUT /api/messages/admin/chats/:id/status   { status: 'solved' | 'unsolved' }
// @access  Admin
const setChatStatus = async (req, res) => {
  try {
    if (req.accountType !== 'admin') return forbidden(req, res);
    const { status } = req.body;
    if (!['solved', 'unsolved'].includes(status)) {
      return res.status(400).json({ success: false, message: "status must be 'solved' or 'unsolved'" });
    }

    const conv = await findChat(req.params.id);
    if (!conv) return notFound(res);

    conv.status = status;
    conv.solvedAt = status === 'solved' ? new Date() : null;
    conv.solvedBy = status === 'solved' ? String(req.user._id) : null;
    await conv.save();

    if (global.io) {
      global.io.to('admin_room').emit('chat_status_changed', { conversationId: conv._id, status, solvedAt: conv.solvedAt });
    }

    res.json({ success: true, data: { conversationId: conv._id, status, solvedAt: conv.solvedAt } });
  } catch (error) {
    serverError(req, res, error, 'Set chat status error:');
  }
};

// @desc    Delete a chat: all messages, image files, the conversation and guest record
// @route   DELETE /api/messages/admin/chats/:id
// @access  Admin
const deleteChat = async (req, res) => {
  try {
    if (req.accountType !== 'admin') return forbidden(req, res);

    const conv = await findChat(req.params.id);
    if (!conv) return notFound(res);

    // Image files (server folder + any older Firebase images)
    const images = await Message.find({ conversationId: conv._id, imageUrl: { $ne: null } }, { imageUrl: 1 }).lean();
    let deletedImages = 0;
    for (const m of images) {
      if (m.imageUrl && (await deleteChatImage(m.imageUrl))) deletedImages += 1;
    }
    await deleteConversationFolder(conv._id);

    const { deletedCount: deletedMessages } = await Message.deleteMany({ conversationId: conv._id });
    await Conversation.deleteOne({ _id: conv._id });
    if (conv.anonymousUserId) await AnonymousUser.deleteOne({ _id: conv.anonymousUserId });

    if (global.io) {
      global.io.to('admin_room').emit('chat_deleted', { conversationId: conv._id });
    }

    res.json({ success: true, message: 'Chat deleted', data: { conversationId: conv._id, deletedMessages, deletedImages } });
  } catch (error) {
    serverError(req, res, error, 'Delete chat error:');
  }
};

module.exports = { getAllChats, setChatStatus, deleteChat };
