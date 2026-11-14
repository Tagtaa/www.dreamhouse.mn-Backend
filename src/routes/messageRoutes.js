const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { detectImageType } = require('../services/chatStorageService');
const {
  sendMessage,
  sendImageMessage,
  getConversations,
  getMessages,
  markMessagesAsRead,
  getUserConversation,
  getUserConversations,
  getAdminUnreadCount,
  upload,
  // Anonymous chat functions
  sendAnonymousMessage,
  sendAnonymousImageMessage,
  getAnonymousConversation,
  getAnonymousMessages,
  getAnonymousSessions,
  getAnonymousConversations,
  getAnonymousConversationMessages,
  sendAdminReplyToAnonymous,
  sendAdminImageReplyToAnonymous
} = require('../controllers/messageController');

// Image upload with a clear 400 for wrong type / too large (instead of a 500)
// and a check of the real file type (bytes), whatever the client declared
const uploadImage = (req, res, next) => upload.single('image')(req, res, (err) => {
  if (err) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'Image must be 10MB or smaller' : err.message;
    return res.status(400).json({ success: false, message, code: 'INVALID_IMAGE' });
  }
  if (req.file && !detectImageType(req.file.buffer)) {
    return res.status(400).json({ success: false, message: 'Only JPG, PNG, GIF or WEBP images are allowed', code: 'INVALID_IMAGE' });
  }
  return next();
});

// Unread chats count for the dashboard sidebar badge (admin)
router.get('/admin/unread-count', auth, getAdminUnreadCount);

// /dashboard/chat: one list of all chats, solved/unsolved status, delete (admin)
const adminChat = require('../controllers/adminChatController');
router.get('/admin/chats', auth, adminChat.getAllChats);
router.put('/admin/chats/:id/status', auth, adminChat.setChatStatus);
router.delete('/admin/chats/:id', auth, adminChat.deleteChat);

// Send message - for both user and admin
router.post('/send', auth, sendMessage);

// Send image message (upload + message in single endpoint) - for both user and admin
router.post('/send-image', auth, uploadImage, sendImageMessage);

// Get user's own conversation
router.get('/conversation', auth, getUserConversation);

// Get user's own messages
router.get('/user-messages', auth, getMessages);

// Get all conversations for admin
router.get('/conversations', auth, getConversations);

// @route   GET /api/messages/user-conversations
// @desc    Get all user conversations with last message (admin only)
// @access  Admin
router.get('/user-conversations', auth, getUserConversations);

// Get specific user's messages (for admin)
router.get('/user-messages/:userId', auth, getMessages);

// Mark messages as read
router.put('/read', auth, markMessagesAsRead);

// Mark specific user's messages as read (for admin)
router.put('/read/:userId', auth, markMessagesAsRead);

// ==================== ANONYMOUS CHAT ROUTES ====================

// Anonymous user routes (no authentication required)
// @route   POST /api/messages/anonymous/send
// @desc    Send anonymous text message
// @access  Public
router.post('/anonymous/send', sendAnonymousMessage);

// @route   POST /api/messages/anonymous/send-image
// @desc    Send anonymous image message
// @access  Public
router.post('/anonymous/send-image', uploadImage, sendAnonymousImageMessage);

// @route   POST /api/messages/anonymous/conversation
// @desc    Get anonymous conversation
// @access  Public
router.post('/anonymous/conversation', getAnonymousConversation);

// @route   POST /api/messages/anonymous/messages
// @desc    Get anonymous messages
// @access  Public
router.post('/anonymous/messages', getAnonymousMessages);

// Admin routes for anonymous chat (authentication required)
// @route   GET /api/messages/anonymous/sessions
// @desc    Get all anonymous sessions
// @access  Admin
router.get('/anonymous/sessions', auth, getAnonymousSessions);

// @route   GET /api/messages/anonymous/conversations
// @desc    Get conversations for specific session
// @access  Admin
router.get('/anonymous/conversations', auth, getAnonymousConversations);

// @route   POST /api/messages/anonymous/conversations/messages
// @desc    Get messages for specific anonymous conversation
// @access  Admin
router.post('/anonymous/conversations/messages', auth, getAnonymousConversationMessages);

// @route   POST /api/messages/anonymous/conversations/reply
// @desc    Send admin reply to anonymous conversation
// @access  Admin
router.post('/anonymous/conversations/reply', auth, sendAdminReplyToAnonymous);

// @route   POST /api/messages/anonymous/conversations/reply-image
// @desc    Send admin image reply to anonymous conversation
// @access  Admin
router.post('/anonymous/conversations/reply-image', auth, uploadImage, sendAdminImageReplyToAnonymous);

module.exports = router;
