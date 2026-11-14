const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  sendMessage,
  sendImageMessage,
  getConversations,
  getMessages,
  markMessagesAsRead,
  getUserConversation,
  getUserConversations,
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

// Send message - for both user and admin
router.post('/send', auth, sendMessage);

// Send image message (upload + message in single endpoint) - for both user and admin
router.post('/send-image', auth, upload.single('image'), sendImageMessage);

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
router.post('/anonymous/send-image', upload.single('image'), sendAnonymousImageMessage);

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
router.post('/anonymous/conversations/reply-image', auth, upload.single('image'), sendAdminImageReplyToAnonymous);

module.exports = router;
