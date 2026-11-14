const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const AnonymousUser = require('../models/AnonymousUser');
const { CHAT_RETENTION_OPTIONS, getChatRetentionSetting } = require('./appSettingsService');
const { deleteChatImage, deleteConversationFolder } = require('./chatStorageService');

// Deletes support-chat messages older than the "Chat deletion" setting
// (Settings → Preferences), including their image files. Conversations left
// with no messages are removed with their image folder and guest record.
const RUN_EVERY_MS = 60 * 60 * 1000; // hourly
let running = false;
let timer = null;

async function runChatCleanup({ reason = 'scheduled' } = {}) {
  if (running) return { skipped: true };
  running = true;
  try {
    const { value } = await getChatRetentionSetting();
    const keepMs = CHAT_RETENTION_OPTIONS[value];
    if (!keepMs) return { retention: value, deletedMessages: 0, deletedConversations: 0, deletedImages: 0 };

    const cutoff = new Date(Date.now() - keepMs);
    const old = await Message.find({ createdAt: { $lt: cutoff } }, { _id: 1, conversationId: 1, imageUrl: 1 }).lean();
    if (!old.length) return { retention: value, deletedMessages: 0, deletedConversations: 0, deletedImages: 0 };

    // 1. Image files of old messages
    let deletedImages = 0;
    for (const m of old) {
      if (m.imageUrl && (await deleteChatImage(m.imageUrl))) deletedImages += 1;
    }

    // 2. Old messages (text + image records)
    const { deletedCount: deletedMessages } = await Message.deleteMany({ _id: { $in: old.map((m) => m._id) } });

    // 3. Affected conversations: remove empty ones, fix the rest
    const convIds = [...new Set(old.map((m) => String(m.conversationId)))];
    let deletedConversations = 0;
    for (const id of convIds) {
      const conv = await Conversation.findById(id);
      if (!conv) continue;
      const latest = await Message.findOne({ conversationId: conv._id }).sort({ createdAt: -1 });
      if (!latest) {
        await Conversation.deleteOne({ _id: conv._id });
        await deleteConversationFolder(conv._id);
        if (conv.anonymousUserId) await AnonymousUser.deleteOne({ _id: conv.anonymousUserId });
        deletedConversations += 1;
        continue;
      }
      // Keep "last message" and unread counts consistent with what's left
      conv.lastMessage = latest._id;
      conv.lastMessageAt = latest.createdAt;
      const remainingFrom = async (types, since) => Message.countDocuments({
        conversationId: conv._id,
        senderType: { $in: types },
        ...(since ? { createdAt: { $gt: since } } : {})
      });
      conv.unreadCount.admin = Math.min(conv.unreadCount.admin || 0, await remainingFrom(['user', 'anonymous'], conv.lastReadByAdmin));
      conv.unreadCount.user = Math.min(conv.unreadCount.user || 0, await remainingFrom(['admin'], conv.lastReadByUser));
      if (conv.unreadCount.anonymous !== undefined) {
        conv.unreadCount.anonymous = Math.min(conv.unreadCount.anonymous || 0, await remainingFrom(['admin'], conv.lastReadByAnonymous));
      }
      await conv.save();
    }

    const result = { retention: value, cutoff, deletedMessages, deletedConversations, deletedImages };
    console.log(`🧹 Chat cleanup (${reason}):`, JSON.stringify(result));
    return result;
  } catch (error) {
    console.error('Chat cleanup error:', error);
    return { error: error.message };
  } finally {
    running = false;
  }
}

function startChatCleanupSchedule() {
  if (timer) return;
  setTimeout(() => runChatCleanup({ reason: 'startup' }), 10 * 1000);
  timer = setInterval(() => runChatCleanup(), RUN_EVERY_MS);
  if (timer.unref) timer.unref();
}

module.exports = { runChatCleanup, startChatCleanupSchedule };
