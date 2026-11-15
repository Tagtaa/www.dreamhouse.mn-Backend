const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const AnonymousUser = require('../models/AnonymousUser');
const { saveChatImage, isAllowedImageType } = require('../services/chatStorageService');
const multer = require('multer');
const errorMessageService = require('../services/errorMessageService');

// Dashboard accounts (any role, incl. custom ones) act as support staff in chats
const isAdminReq = (req) => req.accountType === 'admin';

// Multer configuration for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only JPG / PNG / GIF / WEBP (stored on this server)
    if (isAllowedImageType(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, GIF or WEBP images are allowed'), false);
    }
  }
});


// Send text message
const sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user.id;
    const senderType = isAdminReq(req) ? 'admin' : 'user';
    const messageType = 'text';

    // Validate content
    if (!content || content.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: errorMessageService.getMessage('MESSAGE_CONTENT_REQUIRED', errorMessageService.getLocaleFromRequest(req)),
        code: 'CONTENT_REQUIRED'
      });
    }

    let conversation;
    let userId, adminId;

    if (senderType === 'user') {
      userId = senderId;
      // Normal user messages don't need adminId
      
      // Find or create user's conversation
      conversation = await Conversation.findOne({ userId });
      if (!conversation) {
        conversation = new Conversation({ 
          userId,
          // Don't set adminId for normal user conversations
          unreadCount: { user: 0, admin: 0, anonymous: 0 }
        });
        await conversation.save();
      }
    } else {
      // Admin sending message
      if (!receiverId) {
        return res.status(400).json({ 
          success: false, 
          message: errorMessageService.getMessage('RECEIVER_ID_REQUIRED', errorMessageService.getLocaleFromRequest(req)) 
        });
      }
      
      userId = receiverId;
      adminId = 'admin-unified';
      
      // Find or create conversation
      conversation = await Conversation.findOne({ userId });
      if (!conversation) {
        conversation = new Conversation({ userId, adminId });
        await conversation.save();
      }
    }

    // Create text message
    const message = new Message({
      conversationId: conversation._id,
      senderId,
      senderType,
      messageType: 'text',
      content: content.trim()
    });

    await message.save();

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    
    // Increment unread count based on conversation read status
    if (senderType === 'user') {
      // Check if admin has read this conversation
      if (!conversation.lastReadByAdmin || conversation.lastMessageAt > conversation.lastReadByAdmin) {
        conversation.unreadCount.admin += 1;
      }
    } else if (senderType === 'admin') {
      // Check if user has read this conversation
      if (!conversation.lastReadByUser || conversation.lastMessageAt > conversation.lastReadByUser) {
        conversation.unreadCount.user += 1;
      }
    }
    
    await conversation.save();

    // Get populated message
    const populatedMessage = await Message.findById(message._id);

    // 🔌 Socket.IO - Real-time message notification
    if (global.io) {
      console.log(`\n🔌 ========== SENDING WEBSOCKET MESSAGE ==========`);
      console.log(`🔌 Sender type: ${senderType}`);
      console.log(`🔌 Conversation ID: ${conversation._id}`);
      console.log(`🔌 Message content: ${populatedMessage.content?.substring(0, 50)}...`);
      
      if (senderType === 'user') {
        // User sent message → Notify admin and echo back to user (client may rely on socket events)
        const adminPayload = {
          message: populatedMessage,
          userId: senderId,
          conversationId: conversation._id,
          isSelf: false
        };
        
        console.log(`🔌 Emitting to 'admin_room'`);
        console.log(`🔌 Connected sockets:`, global.io.sockets.adapter.rooms);
        
        global.io.to('admin_room').emit('new_user_message', adminPayload);
        console.log(`✅ Emitted to admin_room`);

        // Echo message back to sender via websocket (mark as self to avoid duplicate handling)
        global.io.to(`user_${senderId}`).emit('new_user_message', {
          message: populatedMessage,
          conversationId: conversation._id,
          isSelf: true
        });
        console.log(`✅ Echoed to user_${senderId}`);
        
      } else {
        // Admin sent message → Notify user
        console.log(`🔌 Admin sending to user_${userId}`);
        
        global.io.to(`user_${userId}`).emit('new_user_message', {
          message: populatedMessage,
          conversationId: conversation._id,
          isSelf: false
        });
        console.log(`✅ Emitted to user_${userId}`);
        
        // Notify admin of their own message
        global.io.to('admin_room').emit('new_message', {
          message: populatedMessage,
          conversationId: conversation._id
        });
        console.log(`✅ Emitted to admin_room`);
      }
      
      console.log(`🔌 ===============================================\n`);
    } else {
      console.error('❌ global.io is not defined!');
    }

    res.status(201).json({
      success: true,
      data: populatedMessage
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('MESSAGE_SEND_ERROR', errorMessageService.getLocaleFromRequest(req)),
      code: 'MESSAGE_SEND_ERROR'
    });
  }
};

// Get all conversations (admin only)
const getConversations = async (req, res) => {
  try {
    if (!isAdminReq(req)) {
      return res.status(403).json({
        success: false,
        message: errorMessageService.getMessage('ADMIN_ACCESS_REQUIRED', errorMessageService.getLocaleFromRequest(req)),
        code: 'ADMIN_ACCESS_REQUIRED'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get all messages from active conversations
    const conversations = await Conversation.find({ isActive: true });
    const conversationIds = conversations.map(conv => conv._id);

    // Get all messages with pagination - newest first
    const messages = await Message.find({ conversationId: { $in: conversationIds } })
      .sort({ createdAt: -1 }) // Newest first
      .skip(skip)
      .limit(limit);

    const total = await Message.countDocuments({ conversationId: { $in: conversationIds } });

    res.json({
      success: true,
      data: messages, // Keep newest first order
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('CONVERSATIONS_FETCH_ERROR', errorMessageService.getLocaleFromRequest(req)),
      code: 'CONVERSATIONS_FETCH_ERROR'
    });
  }
};

// Get messages from a conversation
const getMessages = async (req, res) => {
  try {
    const userId = isAdminReq(req) ? req.params.userId : req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Find conversation
    const conversation = await Conversation.findOne({ userId });
    if (!conversation) {
      return res.json({
        success: true,
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0
        }
      });
    }

    // Reset unread count when user views their own messages
    if (!isAdminReq(req) && req.user.id === userId) {
      conversation.unreadCount.user = 0;
      await conversation.save();
    }

    const messages = await Message.find({ conversationId: conversation._id })
      .sort({ createdAt: -1 }) // Newest first
      .skip(skip)
      .limit(limit);

    const total = await Message.countDocuments({ conversationId: conversation._id });

    res.json({
      success: true,
      data: messages, // Keep newest first order
      conversation: {
        id: conversation._id,
        unreadCount: conversation.unreadCount
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('MESSAGES_FETCH_ERROR', errorMessageService.getLocaleFromRequest(req)),
      code: 'MESSAGES_FETCH_ERROR'
    });
  }
};

// Mark conversation as read (conversation-level)
const markMessagesAsRead = async (req, res) => {
  try {
    const userId = isAdminReq(req) ? req.params.userId : req.user.id;
    const { conversationId } = req.body;

    // Find conversation
    let conversation;
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
    } else {
      conversation = await Conversation.findOne({ userId });
    }

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('CONVERSATION_NOT_FOUND', errorMessageService.getLocaleFromRequest(req)),
        code: 'CONVERSATION_NOT_FOUND'
      });
    }

    // Update conversation read status
    const now = new Date();
    if (isAdminReq(req)) {
      conversation.lastReadByAdmin = now;
      conversation.unreadCount.admin = 0;
    } else {
      conversation.lastReadByUser = now;
      conversation.unreadCount.user = 0;
    }
    await conversation.save();

    res.json({
      success: true,
      message: errorMessageService.getMessage('CONVERSATION_MARKED_READ', errorMessageService.getLocaleFromRequest(req)),
      data: {
        conversationId: conversation._id,
        lastReadByAdmin: conversation.lastReadByAdmin,
        lastReadByUser: conversation.lastReadByUser,
        unreadCount: conversation.unreadCount
      }
    });

  } catch (error) {
    console.error('Mark conversation as read error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('MARK_READ_ERROR', errorMessageService.getLocaleFromRequest(req)),
      code: 'MARK_READ_ERROR'
    });
  }
};

// @desc    Unread chats for the dashboard sidebar badge
// @route   GET /api/messages/admin/unread-count
// @access  Admin
const getAdminUnreadCount = async (req, res) => {
  try {
    if (!isAdminReq(req)) {
      return res.status(403).json({
        success: false,
        message: errorMessageService.getMessage('ADMIN_ACCESS_REQUIRED', errorMessageService.getLocaleFromRequest(req)),
        code: 'ADMIN_ACCESS_REQUIRED'
      });
    }

    const [stats] = await Conversation.aggregate([
      { $match: { isActive: true, 'unreadCount.admin': { $gt: 0 } } },
      { $group: { _id: null, conversations: { $sum: 1 }, messages: { $sum: '$unreadCount.admin' } } }
    ]);

    res.json({
      success: true,
      data: {
        unreadConversations: stats?.conversations || 0,
        unreadMessages: stats?.messages || 0
      }
    });
  } catch (error) {
    console.error('Get admin unread count error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('INTERNAL_SERVER_ERROR', errorMessageService.getLocaleFromRequest(req))
    });
  }
};

// Get user's own conversation
const getUserConversation = async (req, res) => {
  try {
    const userId = req.user.id;

    let conversation = await Conversation.findOne({ userId })
      .populate('lastMessage');

    if (!conversation) {
      // Create conversation if not exists
      conversation = new Conversation({ userId, adminId: 'admin-unified' });
      await conversation.save();
    }

    res.json({
      success: true,
      data: conversation
    });

  } catch (error) {
    console.error('Get user conversation error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('CONVERSATION_FETCH_ERROR', errorMessageService.getLocaleFromRequest(req)),
      code: 'CONVERSATION_FETCH_ERROR'
    });
  }
};

// Send image message (upload + message in single endpoint)
const sendImageMessage = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user.id;
    const senderType = isAdminReq(req) ? 'admin' : 'user';

    // Validate image file
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: errorMessageService.getMessage('IMAGE_FILE_REQUIRED', errorMessageService.getLocaleFromRequest(req)),
        code: 'IMAGE_FILE_REQUIRED'
      });
    }

    let conversation;
    let userId, adminId;

    if (senderType === 'user') {
      userId = senderId;
      // Normal user messages don't need adminId
      
      // Find or create user's conversation
      conversation = await Conversation.findOne({ userId });
      if (!conversation) {
        conversation = new Conversation({ 
          userId,
          // Don't set adminId for normal user conversations
          unreadCount: { user: 0, admin: 0, anonymous: 0 }
        });
        await conversation.save();
      }
    } else {
      // Admin sending message
      if (!receiverId) {
        return res.status(400).json({ 
          success: false, 
          message: errorMessageService.getMessage('RECEIVER_ID_REQUIRED', errorMessageService.getLocaleFromRequest(req)) 
        });
      }
      
      userId = receiverId;
      adminId = 'admin-unified';
      
      // Find or create conversation
      conversation = await Conversation.findOne({ userId });
      if (!conversation) {
        conversation = new Conversation({ userId, adminId });
        await conversation.save();
      }
    }

    // Store image on this server (uploads/chat/<conversationId>/)
    const imageUrl = await saveChatImage(req, req.file, conversation._id);

    // Create message
    const message = new Message({
      conversationId: conversation._id,
      senderId,
      senderType,
      messageType: 'image',
      imageUrl
    });

    await message.save();

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    
    // Increment unread count based on conversation read status
    if (senderType === 'user') {
      // Check if admin has read this conversation
      if (!conversation.lastReadByAdmin || conversation.lastMessageAt > conversation.lastReadByAdmin) {
        conversation.unreadCount.admin += 1;
      }
    } else if (senderType === 'admin') {
      // Check if user has read this conversation
      if (!conversation.lastReadByUser || conversation.lastMessageAt > conversation.lastReadByUser) {
        conversation.unreadCount.user += 1;
      }
    }
    
    await conversation.save();

    // 🔌 Socket.IO - Real-time image message notification
    if (global.io) {
      if (senderType === 'user') {
        // User sent image → Notify admin and echo back to user
        global.io.to('admin_room').emit('new_user_message', {
          message: message,
          userId: senderId,
          conversationId: conversation._id,
          isSelf: false
        });
        console.log(`🔌 New user image message notification sent to admin`);

        global.io.to(`user_${senderId}`).emit('new_user_message', {
          message: message,
          conversationId: conversation._id,
          isSelf: true
        });
        console.log(`🔌 Image message echo sent to user ${senderId}`);
        
      } else {
        // Admin sent image → Notify user
        global.io.to(`user_${userId}`).emit('new_user_message', {
          message: message,
          conversationId: conversation._id,
          isSelf: false
        });
        console.log(`🔌 New admin image message notification sent to user ${userId}`);
        
        // Notify admin themselves (so they can see their own image message)
        global.io.to('admin_room').emit('new_message', {
          message: message,
          conversationId: conversation._id
        });
        console.log(`🔌 Own image message notification sent to admin`);
      }
    }

    res.status(201).json({
      success: true,
      data: message
    });

  } catch (error) {
    console.error('Send image message error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('IMAGE_MESSAGE_SEND_ERROR', errorMessageService.getLocaleFromRequest(req)),
      code: 'IMAGE_MESSAGE_SEND_ERROR'
    });
  }
};

// ==================== ANONYMOUS CHAT FUNCTIONS ====================

// Generate session ID for new anonymous users
const generateSessionId = (req) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';
  const timestamp = Date.now();
  return `anon_${ip.replace(/[^a-zA-Z0-9]/g, '')}_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
};


// Get session ID (required for anonymous users)
const getSessionId = (req) => {
  const sessionId = req.header('X-Session-ID');
  
  if (!sessionId) {
    throw new Error('Session ID is required for anonymous users');
  }
  
  return sessionId;
};

// @desc    Send anonymous message
// @route   POST /api/messages/anonymous/send
// @access  Public
const sendAnonymousMessage = async (req, res) => {
  try {
    const { content, nickname, sessionId: bodySessionId } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || '';

    // Validate content
    if (!content || content.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: errorMessageService.getMessage('ANONYMOUS_CHAT.CONTENT_REQUIRED', errorMessageService.getLocaleFromRequest(req)),
        code: 'CONTENT_REQUIRED'
      });
    }

    // Get or create session ID (from body, header, or generate new)
    // Validate sessionId: must be a non-empty string
    let sessionId = bodySessionId || req.header('X-Session-ID');
    
    // Check if sessionId is valid (not null, undefined, empty string, or whitespace)
    if (!sessionId || typeof sessionId !== 'string' || sessionId.trim() === '') {
      // Create session ID for first message
      sessionId = generateSessionId(req);
      console.log(`🆕 New sessionId generated: ${sessionId}`);
    } else {
      sessionId = sessionId.trim(); // Clean whitespace
      console.log(`✅ Using existing sessionId: ${sessionId}`);
    }

    // Find or create anonymous user
    const anonymousUser = await AnonymousUser.findOrCreate(sessionId, ipAddress, userAgent);
    
    // Update nickname if provided
    if (nickname && nickname.trim() !== '') {
      anonymousUser.nickname = nickname.trim().substring(0, 50);
      await anonymousUser.save();
    }

    // Find or create conversation
    let conversation = await Conversation.findOne({ sessionId });
    if (!conversation) {
      conversation = new Conversation({
        sessionId,
        anonymousUserId: anonymousUser._id,
        adminId: 'admin-unified'
      });
      await conversation.save();
    }

    // Create message
    const message = new Message({
      conversationId: conversation._id,
      sessionId,
      senderType: 'anonymous',
      messageType: 'text',
      content: content.trim(),
      senderMetadata: {
        ipAddress,
        userAgent,
        nickname: anonymousUser.nickname
      }
    });

    await message.save();

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    conversation.unreadCount.admin += 1;
    await conversation.save();

    // 🔌 Socket.IO - Notify admin (same event as normal messages)
    if (global.io) {
      const adminPayload = {
        message: message,
        conversation: {
          _id: conversation._id,
          sessionId: conversation.sessionId,
          unreadCount: conversation.unreadCount,
          lastMessageAt: conversation.lastMessageAt
        },
        timestamp: new Date().toISOString()
      };
      
      // Notify admin room
      global.io.to('admin_room').emit('new_message', adminPayload);
      console.log(`🔌 New anonymous message notification sent to admin_room`);
      
      // Notify anonymous user that their message was sent (same format as normal messages)
      const userPayload = {
        message: message,
        conversationId: conversation._id
      };
      
      global.io.to(`anon_${sessionId}`).emit('new_message', userPayload);
      console.log(`🔌 Message sent confirmation sent to anonymous user ${sessionId}`);
      console.log(`🔌 Room: anon_${sessionId}, Payload:`, JSON.stringify(userPayload, null, 2));
    }

    res.status(201).json({
      success: true,
      message: errorMessageService.getMessage('ANONYMOUS_CHAT.MESSAGE_SENT_SUCCESS', errorMessageService.getLocaleFromRequest(req)),
      data: {
        message,
        sessionId,
        nickname: anonymousUser.nickname
      }
    });

  } catch (error) {
    console.error('Send anonymous message error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('ANONYMOUS_CHAT.MESSAGE_SEND_ERROR', errorMessageService.getLocaleFromRequest(req)),
      code: 'MESSAGE_SEND_ERROR'
    });
  }
};

// @desc    Send anonymous image message
// @route   POST /api/messages/anonymous/send-image
// @access  Public
const sendAnonymousImageMessage = async (req, res) => {
  try {
    const { nickname, sessionId: bodySessionId } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || '';

    // Validate image file
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: errorMessageService.getMessage('ANONYMOUS_CHAT.IMAGE_FILE_REQUIRED', errorMessageService.getLocaleFromRequest(req)),
        code: 'IMAGE_FILE_REQUIRED'
      });
    }

    // Get or create session ID (from body, header, or generate new)
    // Validate sessionId: must be a non-empty string
    let sessionId = bodySessionId || req.header('X-Session-ID');
    
    // Check if sessionId is valid (not null, undefined, empty string, or whitespace)
    if (!sessionId || typeof sessionId !== 'string' || sessionId.trim() === '') {
      // Create session ID for first message
      sessionId = generateSessionId(req);
      console.log(`🆕 New sessionId generated: ${sessionId}`);
    } else {
      sessionId = sessionId.trim(); // Clean whitespace
      console.log(`✅ Using existing sessionId: ${sessionId}`);
    }

    // Find or create anonymous user
    const anonymousUser = await AnonymousUser.findOrCreate(sessionId, ipAddress, userAgent);
    
    // Update nickname if provided
    if (nickname && nickname.trim() !== '') {
      anonymousUser.nickname = nickname.trim().substring(0, 50);
      await anonymousUser.save();
    }

    // Find or create conversation
    let conversation = await Conversation.findOne({ sessionId });
    if (!conversation) {
      conversation = new Conversation({
        sessionId,
        anonymousUserId: anonymousUser._id,
        adminId: 'admin-unified'
      });
      await conversation.save();
    }

    // Store image on this server (uploads/chat/<conversationId>/)
    const imageUrl = await saveChatImage(req, req.file, conversation._id);

    // Create message
    const message = new Message({
      conversationId: conversation._id,
      sessionId,
      senderType: 'anonymous',
      messageType: 'image',
      imageUrl,
      senderMetadata: {
        ipAddress,
        userAgent,
        nickname: anonymousUser.nickname
      }
    });

    await message.save();

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    conversation.unreadCount.admin += 1;
    await conversation.save();

    // 🔌 Socket.IO - Notify admin (same event as normal messages)
    if (global.io) {
      const adminPayload = {
        message: message,
        conversation: {
          _id: conversation._id,
          sessionId: conversation.sessionId,
          unreadCount: conversation.unreadCount,
          lastMessageAt: conversation.lastMessageAt
        },
        timestamp: new Date().toISOString()
      };
      
      // Notify admin room
      global.io.to('admin_room').emit('new_message', adminPayload);
      console.log(`🔌 New anonymous image message notification sent to admin_room`);
      
      // Notify anonymous user that their image message was sent (same format as normal messages)
      global.io.to(`anon_${sessionId}`).emit('new_message', {
        message: message,
        conversationId: conversation._id
      });
      console.log(`🔌 Image message sent confirmation sent to anonymous user ${sessionId}`);
    }

    res.status(201).json({
      success: true,
      message: errorMessageService.getMessage('ANONYMOUS_CHAT.IMAGE_SENT_SUCCESS', errorMessageService.getLocaleFromRequest(req)),
      data: {
        message,
        sessionId,
        nickname: anonymousUser.nickname
      }
    });

  } catch (error) {
    console.error('Send anonymous image message error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('ANONYMOUS_CHAT.IMAGE_SEND_ERROR', errorMessageService.getLocaleFromRequest(req)),
      code: 'IMAGE_MESSAGE_SEND_ERROR'
    });
  }
};

// @desc    Get anonymous conversation
// @route   GET /api/messages/anonymous/conversation
// @access  Public
const getAnonymousConversation = async (req, res) => {
  try {
    // Get session ID (from body or header)
    const sessionId = req.body.sessionId || req.header('X-Session-ID');
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('ANONYMOUS_CHAT.SESSION_ID_REQUIRED', errorMessageService.getLocaleFromRequest(req)),
        code: 'SESSION_ID_REQUIRED'
      });
    }
    
    const conversation = await Conversation.findOne({ sessionId })
      .populate('anonymousUserId', 'nickname lastSeen')
      .populate('lastMessage');

    if (!conversation) {
      return res.status(200).json({
        success: true,
        data: {
          conversation: null,
          sessionId
        }
      });
    }

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('ANONYMOUS_CHAT.CONVERSATION_FETCH_SUCCESS', errorMessageService.getLocaleFromRequest(req)),
      data: {
        conversation,
        sessionId
      }
    });

  } catch (error) {
    console.error('Get anonymous conversation error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('ANONYMOUS_CHAT.CONVERSATION_FETCH_ERROR', errorMessageService.getLocaleFromRequest(req)),
      code: 'CONVERSATION_GET_ERROR'
    });
  }
};

// @desc    Get anonymous messages
// @route   GET /api/messages/anonymous/messages
// @access  Public
const getAnonymousMessages = async (req, res) => {
  try {
    // Get session ID (from body or header)
    const sessionId = req.body.sessionId || req.header('X-Session-ID');
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('ANONYMOUS_CHAT.SESSION_ID_REQUIRED', errorMessageService.getLocaleFromRequest(req)),
        code: 'SESSION_ID_REQUIRED'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const conversation = await Conversation.findOne({ sessionId });
    if (!conversation) {
      return res.status(200).json({
        success: true,
        data: {
          messages: [],
          pagination: {
            page,
            limit,
            total: 0,
            pages: 0
          }
        }
      });
    }

    const messages = await Message.find({ conversationId: conversation._id })
      .sort({ createdAt: -1 }) // Newest first (same as normal messages)
      .limit(limit)
      .skip(skip);

    const total = await Message.countDocuments({ conversationId: conversation._id });

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('ANONYMOUS_CHAT.MESSAGES_FETCH_SUCCESS', errorMessageService.getLocaleFromRequest(req)),
      data: {
        messages, // Keep newest first order (same as normal messages)
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get anonymous messages error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('ANONYMOUS_CHAT.MESSAGES_FETCH_ERROR', errorMessageService.getLocaleFromRequest(req)),
      code: 'MESSAGES_GET_ERROR'
    });
  }
};

// @desc    Get all anonymous sessions (Admin only)
// @route   GET /api/messages/anonymous/sessions
// @access  Admin
const getAnonymousSessions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get all active sessions
    const sessions = await AnonymousUser.find({ isActive: true })
      .sort({ lastSeen: -1 })
      .limit(limit)
      .skip(skip);

    const total = await AnonymousUser.countDocuments({ isActive: true });

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('ANONYMOUS_CHAT.SESSIONS_FETCH_SUCCESS', errorMessageService.getLocaleFromRequest(req)),
      data: {
        sessions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get anonymous sessions error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('ANONYMOUS_CHAT.SESSIONS_FETCH_ERROR', errorMessageService.getLocaleFromRequest(req)),
      code: 'SESSIONS_GET_ERROR'
    });
  }
};

// @desc    Get conversations for specific session (Admin only)
// @route   GET /api/messages/anonymous/conversations
// @access  Admin
const getAnonymousConversations = async (req, res) => {
  try {
    const { sessionId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Session ID required
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: errorMessageService.getMessage('ANONYMOUS_CHAT.SESSION_ID_REQUIRED', errorMessageService.getLocaleFromRequest(req)),
        code: 'SESSION_ID_REQUIRED'
      });
    }

    // Get conversations for specific session ID
    const conversations = await Conversation.find({ 
      sessionId: sessionId,
      isActive: true 
    })
      .populate('anonymousUserId', 'nickname lastSeen ipAddress')
      .populate('lastMessage')
      .sort({ lastMessageAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Conversation.countDocuments({ 
      sessionId: sessionId,
      isActive: true 
    });

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('ANONYMOUS_CHAT.CONVERSATIONS_FETCH_SUCCESS', errorMessageService.getLocaleFromRequest(req)),
      data: {
        conversations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get anonymous conversations error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('ANONYMOUS_CHAT.CONVERSATIONS_FETCH_ERROR', errorMessageService.getLocaleFromRequest(req)),
      code: 'CONVERSATIONS_GET_ERROR'
    });
  }
};

// @desc    Get messages for specific anonymous conversation (Admin only)
// @route   GET /api/messages/anonymous/conversations/:sessionId/messages
// @access  Admin
const getAnonymousConversationMessages = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const conversation = await Conversation.findOne({ sessionId })
      .populate('anonymousUserId', 'nickname lastSeen ipAddress');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('CONVERSATION_NOT_FOUND_ERROR', errorMessageService.getLocaleFromRequest(req))
      });
    }

    const messages = await Message.find({ conversationId: conversation._id })
      .sort({ createdAt: -1 }) // Newest first (same as normal messages)
      .limit(limit)
      .skip(skip);

    const total = await Message.countDocuments({ conversationId: conversation._id });

    res.status(200).json({
      success: true,
      data: {
        conversation,
        messages, // Keep newest first order (same as normal messages)
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get anonymous conversation messages error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('FAILED_TO_GET_CONVERSATION_MESSAGES', errorMessageService.getLocaleFromRequest(req)),
      code: 'CONVERSATION_MESSAGES_GET_ERROR'
    });
  }
};

// @desc    Send admin image reply to anonymous conversation
// @route   POST /api/messages/anonymous/conversations/:sessionId/reply-image
// @access  Admin
const sendAdminImageReplyToAnonymous = async (req, res) => {
  try {
    const { sessionId } = req.body;

    // Validate image file
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: errorMessageService.getMessage('ANONYMOUS_CHAT.IMAGE_FILE_REQUIRED', errorMessageService.getLocaleFromRequest(req))
      });
    }

    const conversation = await Conversation.findOne({ sessionId });
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('ANONYMOUS_CHAT.CONVERSATION_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Store image on this server (uploads/chat/<conversationId>/)
    const imageUrl = await saveChatImage(req, req.file, conversation._id);

    // Create admin image message
    const message = new Message({
      conversationId: conversation._id,
      senderId: req.user._id,
      senderType: 'admin',
      messageType: 'image',
      content: imageUrl,
      imageUrl: imageUrl
    });

    await message.save();

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    conversation.unreadCount.anonymous += 1;
    await conversation.save();

    // 🔌 Socket.IO - Notify anonymous user (same format as normal messages)
    if (global.io) {
      global.io.to(`anon_${sessionId}`).emit('new_message', {
        message: message,
        conversationId: conversation._id
      });
      console.log(`🔌 Admin image reply notification sent to anonymous user ${sessionId}`);
      
      // Notify admin that their image reply was sent (same event as normal messages)
      const adminPayload = {
        message: message,
        conversation: {
          _id: conversation._id,
          sessionId: conversation.sessionId,
          unreadCount: conversation.unreadCount,
          lastMessageAt: conversation.lastMessageAt
        },
        timestamp: new Date().toISOString()
      };
      
      global.io.to('admin_room').emit('new_message', adminPayload);
      console.log(`🔌 Admin image reply sent confirmation sent to admin_room`);
    }

    res.status(201).json({
      success: true,
      message: errorMessageService.getMessage('ANONYMOUS_CHAT.ADMIN_IMAGE_REPLY_SENT_SUCCESS', errorMessageService.getLocaleFromRequest(req)),
      data: message
    });

  } catch (error) {
    console.error('Send admin image reply error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('ANONYMOUS_CHAT.ADMIN_REPLY_SEND_ERROR', errorMessageService.getLocaleFromRequest(req)),
      code: 'ADMIN_IMAGE_REPLY_SEND_ERROR'
    });
  }
};

// @desc    Send admin reply to anonymous conversation
// @route   POST /api/messages/anonymous/conversations/:sessionId/reply
// @access  Admin
const sendAdminReplyToAnonymous = async (req, res) => {
  try {
    const { sessionId, content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: errorMessageService.getMessage('ANONYMOUS_CHAT.CONTENT_REQUIRED', errorMessageService.getLocaleFromRequest(req))
      });
    }

    const conversation = await Conversation.findOne({ sessionId });
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: errorMessageService.getMessage('ANONYMOUS_CHAT.CONVERSATION_NOT_FOUND', errorMessageService.getLocaleFromRequest(req))
      });
    }

    // Create admin message
    const message = new Message({
      conversationId: conversation._id,
      senderId: req.user._id,
      senderType: 'admin',
      messageType: 'text',
      content: content.trim()
    });

    await message.save();

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    conversation.unreadCount.anonymous += 1;
    await conversation.save();

    // 🔌 Socket.IO - Notify anonymous user (same format as normal messages)
    if (global.io) {
      const userPayload = {
        message: message,
        conversationId: conversation._id
      };
      
      console.log(`🔍 Attempting to emit to room: anon_${sessionId}`);
      console.log(`🔍 Connected sockets in namespace:`, global.io.sockets.adapter.rooms);
      
      global.io.to(`anon_${sessionId}`).emit('new_message', userPayload);
      console.log(`🔌 Admin reply notification sent to anonymous user ${sessionId}`);
      console.log(`🔌 Room: anon_${sessionId}, Payload:`, JSON.stringify(userPayload, null, 2));
      
      // Notify admin that their reply was sent (same event as normal messages)
      const adminPayload = {
        message: message,
        conversation: {
          _id: conversation._id,
          sessionId: conversation.sessionId,
          unreadCount: conversation.unreadCount,
          lastMessageAt: conversation.lastMessageAt
        },
        timestamp: new Date().toISOString()
      };
      
      global.io.to('admin_room').emit('new_message', adminPayload);
      console.log(`🔌 Admin reply sent confirmation sent to admin_room`);
    }

    res.status(201).json({
      success: true,
      message: errorMessageService.getMessage('ANONYMOUS_CHAT.ADMIN_REPLY_SENT_SUCCESS', errorMessageService.getLocaleFromRequest(req)),
      data: message
    });

  } catch (error) {
    console.error('Send admin reply error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('ANONYMOUS_CHAT.ADMIN_REPLY_SEND_ERROR', errorMessageService.getLocaleFromRequest(req)),
      code: 'ADMIN_REPLY_SEND_ERROR'
    });
  }
};

// @desc    Get all user conversations with last message (Admin only)
// @route   GET /api/messages/user-conversations
// @access  Admin
const getUserConversations = async (req, res) => {
  try {
    if (!isAdminReq(req)) {
      return res.status(403).json({
        success: false,
        message: errorMessageService.getMessage('ADMIN_ACCESS_REQUIRED', errorMessageService.getLocaleFromRequest(req)),
        code: 'ADMIN_ACCESS_REQUIRED'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get all active conversations with user info and last message
    const conversations = await Conversation.find({ isActive: true })
      // App users have username + phone (no firstName/lastName/phoneNumber fields)
      .populate('userId', 'username phone email profileImage createdAt lastLogin membership')
      .populate('lastMessage')
      .sort({ lastMessageAt: -1 }) // Most recent first
      .skip(skip)
      .limit(limit);

    const total = await Conversation.countDocuments({ isActive: true });

    // Format the response
    const userConversations = conversations.map(conv => {
      const user = conv.userId;
      const lastMsg = conv.lastMessage;

      let lastMessage = null;
      if (lastMsg) {
        lastMessage = {
          _id: lastMsg._id,
          senderType: lastMsg.senderType,
          messageType: lastMsg.messageType,
          createdAt: lastMsg.createdAt,
          isRead: lastMsg.isRead
        };

        // Add content based on message type
        if (lastMsg.messageType === 'text') {
          lastMessage.content = lastMsg.content;
        } else if (lastMsg.messageType === 'image') {
          lastMessage.imageUrl = lastMsg.imageUrl;
        }
      }

      return {
        conversationId: conv._id,
        user: user ? {
          _id: user._id,
          username: user.username,
          phone: user.phone,
          email: user.email,
          phoneNumber: user.phone, // kept for existing dashboard code
          profileImage: user.profileImage,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        } : null,
        lastMessage: lastMessage,
        lastMessageAt: conv.lastMessageAt,
        unreadCount: conv.unreadCount,
        isActive: conv.isActive,
        createdAt: conv.createdAt
      };
    });

    res.status(200).json({
      success: true,
      message: errorMessageService.getMessage('USER_CONVERSATIONS_FETCH_SUCCESS', errorMessageService.getLocaleFromRequest(req)) || 'Kullanıcı konuşmaları başarıyla getirildi',
      data: {
        conversations: userConversations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get user conversations error:', error);
    res.status(500).json({
      success: false,
      message: errorMessageService.getMessage('USER_CONVERSATIONS_FETCH_ERROR', errorMessageService.getLocaleFromRequest(req)) || 'Kullanıcı konuşmaları getirilirken hata oluştu',
      code: 'USER_CONVERSATIONS_FETCH_ERROR'
    });
  }
};

module.exports = {
  sendMessage,
  sendImageMessage,
  getConversations,
  getMessages,
  markMessagesAsRead,
  getUserConversation,
  getUserConversations, // New endpoint
  getAdminUnreadCount,
  upload, // Multer middleware'ini export et
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
};
