const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Support-chat images are stored on this server under uploads/chat/<conversationId>/
// and served at /uploads/chat/... so deleting a chat removes its files from the server.
const CHAT_DIR = path.resolve(__dirname, '../../uploads/chat');
const PUBLIC_PREFIX = '/uploads/chat/';

// Only raster images; the extension comes from the type, never from the uploaded name
const ALLOWED_TYPES = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp'
};

// Declared type is only a first filter: the mobile app may send application/octet-stream,
// so the real type is always taken from the file's bytes (detectImageType).
const isAllowedImageType = (mimetype) => Boolean(ALLOWED_TYPES[mimetype]) || mimetype === 'application/octet-stream';

// Identify JPG / PNG / GIF / WEBP from file signature; null for anything else
const detectImageType = (buffer) => {
  if (!buffer || buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buffer.slice(0, 4).toString('ascii') === 'GIF8') return 'image/gif';
  if (buffer.slice(0, 4).toString('ascii') === 'RIFF' && buffer.slice(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  return null;
};

const safeId = (value) => String(value).replace(/[^a-zA-Z0-9_-]/g, '');

// Absolute base URL clients (mobile app, website, dashboard) can load images from
const publicBaseUrl = (req) => {
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL.replace(/\/$/, '');
  const proto = (req.get('X-Forwarded-Proto') || req.protocol || 'http').split(',')[0].trim();
  return `${proto}://${req.get('host')}`;
};

async function saveChatImage(req, file, conversationId) {
  const ext = ALLOWED_TYPES[detectImageType(file.buffer)];
  if (!ext) {
    const err = new Error('Only JPG, PNG, GIF or WEBP images are allowed');
    err.status = 400;
    throw err;
  }
  const folder = safeId(conversationId);
  const dir = path.join(CHAT_DIR, folder);
  await fs.promises.mkdir(dir, { recursive: true });
  const name = `${Date.now()}-${uuidv4()}${ext}`;
  await fs.promises.writeFile(path.join(dir, name), file.buffer);
  return `${publicBaseUrl(req)}${PUBLIC_PREFIX}${folder}/${name}`;
}

// Map an image URL back to its file inside uploads/chat (null if it isn't one of ours)
const localPathFromUrl = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== 'string') return null;
  const at = imageUrl.indexOf(PUBLIC_PREFIX);
  if (at === -1) return null;
  const relative = decodeURIComponent(imageUrl.slice(at + PUBLIC_PREFIX.length).split(/[?#]/)[0]);
  const full = path.resolve(CHAT_DIR, relative);
  return full.startsWith(CHAT_DIR + path.sep) ? full : null;
};

// Older chat images were uploaded to Firebase Storage
const deleteFirebaseImage = async (imageUrl) => {
  const match = /^https:\/\/storage\.googleapis\.com\/([^/]+)\/(.+)$/.exec(imageUrl || '');
  if (!match) return false;
  try {
    const admin = require('firebase-admin');
    if (!admin.apps.length) return false;
    await admin.storage().bucket(match[1]).file(decodeURIComponent(match[2])).delete({ ignoreNotFound: true });
    return true;
  } catch (error) {
    console.error('Delete Firebase chat image error:', error.message);
    return false;
  }
};

async function deleteChatImage(imageUrl) {
  const local = localPathFromUrl(imageUrl);
  if (local) {
    try {
      await fs.promises.unlink(local);
      return true;
    } catch (error) {
      if (error.code !== 'ENOENT') console.error('Delete chat image error:', error.message);
      return false;
    }
  }
  return deleteFirebaseImage(imageUrl);
}

async function deleteConversationFolder(conversationId) {
  try {
    await fs.promises.rm(path.join(CHAT_DIR, safeId(conversationId)), { recursive: true, force: true });
  } catch (error) {
    console.error('Delete chat folder error:', error.message);
  }
}

module.exports = {
  CHAT_DIR,
  isAllowedImageType,
  detectImageType,
  saveChatImage,
  deleteChatImage,
  deleteConversationFolder
};
