const redis = require('redis');

let redisClient = null;
let isRedisAvailable = false;

// Redis configuration
const REDIS_CONFIG = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    connectTimeout: 5000,
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('❌ Redis: Max reconnection attempts reached');
        return false;
      }
      return Math.min(retries * 100, 3000);
    }
  }
};

// Initialize Redis client
const initRedis = async () => {
  try {
    if (process.env.REDIS_ENABLED === 'false') {
      console.log('⚠️  Redis is disabled via environment variable');
      return null;
    }

    redisClient = redis.createClient(REDIS_CONFIG);

    // Error handling
    redisClient.on('error', (err) => {
      console.error('❌ Redis Client Error:', err.message);
      isRedisAvailable = false;
    });

    redisClient.on('connect', () => {
      console.log('🔗 Redis connecting...');
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis connected successfully');
      isRedisAvailable = true;
    });

    redisClient.on('reconnecting', () => {
      console.log('🔄 Redis reconnecting...');
    });

    redisClient.on('end', () => {
      console.log('🔌 Redis connection closed');
      isRedisAvailable = false;
    });

    // Connect to Redis
    await redisClient.connect();
    
    return redisClient;
  } catch (error) {
    console.error('❌ Failed to initialize Redis:', error.message);
    console.log('⚠️  Running without Redis - Token blacklist disabled');
    isRedisAvailable = false;
    return null;
  }
};

// Token Blacklist Functions
const blacklistToken = async (token, expirySeconds) => {
  if (!isRedisAvailable || !redisClient) {
    console.warn('⚠️  Redis not available - Token blacklist skipped');
    return false;
  }

  try {
    await redisClient.setEx(`blacklist:${token}`, expirySeconds, 'revoked');
    console.log('🚫 Token blacklisted:', token.substring(0, 20) + '...');
    return true;
  } catch (error) {
    console.error('❌ Error blacklisting token:', error.message);
    return false;
  }
};

const isTokenBlacklisted = async (token) => {
  if (!isRedisAvailable || !redisClient) {
    // If Redis is not available, allow the request to proceed
    return false;
  }

  try {
    const result = await redisClient.get(`blacklist:${token}`);
    return result === 'revoked';
  } catch (error) {
    console.error('❌ Error checking token blacklist:', error.message);
    // On error, allow the request to proceed (fail-open approach)
    return false;
  }
};

// Session Management Functions
const setSession = async (sessionId, userId, expirySeconds = 86400) => {
  if (!isRedisAvailable || !redisClient) {
    return false;
  }

  try {
    const sessionData = JSON.stringify({
      userId,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    });
    
    await redisClient.setEx(`session:${sessionId}`, expirySeconds, sessionData);
    return true;
  } catch (error) {
    console.error('❌ Error setting session:', error.message);
    return false;
  }
};

const getSession = async (sessionId) => {
  if (!isRedisAvailable || !redisClient) {
    return null;
  }

  try {
    const sessionData = await redisClient.get(`session:${sessionId}`);
    return sessionData ? JSON.parse(sessionData) : null;
  } catch (error) {
    console.error('❌ Error getting session:', error.message);
    return null;
  }
};

const updateSessionActivity = async (sessionId, expirySeconds = 86400) => {
  if (!isRedisAvailable || !redisClient) {
    return false;
  }

  try {
    const sessionData = await getSession(sessionId);
    if (!sessionData) return false;

    sessionData.lastActivity = new Date().toISOString();
    await redisClient.setEx(`session:${sessionId}`, expirySeconds, JSON.stringify(sessionData));
    return true;
  } catch (error) {
    console.error('❌ Error updating session activity:', error.message);
    return false;
  }
};

const deleteSession = async (sessionId) => {
  if (!isRedisAvailable || !redisClient) {
    return false;
  }

  try {
    await redisClient.del(`session:${sessionId}`);
    return true;
  } catch (error) {
    console.error('❌ Error deleting session:', error.message);
    return false;
  }
};

// User active sessions management
const addUserSession = async (userId, sessionId, expirySeconds = 86400) => {
  if (!isRedisAvailable || !redisClient) {
    return false;
  }

  try {
    await redisClient.sAdd(`user_sessions:${userId}`, sessionId);
    await redisClient.expire(`user_sessions:${userId}`, expirySeconds);
    return true;
  } catch (error) {
    console.error('❌ Error adding user session:', error.message);
    return false;
  }
};

const getUserSessions = async (userId) => {
  if (!isRedisAvailable || !redisClient) {
    return [];
  }

  try {
    return await redisClient.sMembers(`user_sessions:${userId}`);
  } catch (error) {
    console.error('❌ Error getting user sessions:', error.message);
    return [];
  }
};

const removeUserSession = async (userId, sessionId) => {
  if (!isRedisAvailable || !redisClient) {
    return false;
  }

  try {
    await redisClient.sRem(`user_sessions:${userId}`, sessionId);
    return true;
  } catch (error) {
    console.error('❌ Error removing user session:', error.message);
    return false;
  }
};

const deleteAllUserSessions = async (userId) => {
  if (!isRedisAvailable || !redisClient) {
    return false;
  }

  try {
    const sessions = await getUserSessions(userId);
    for (const sessionId of sessions) {
      await deleteSession(sessionId);
    }
    await redisClient.del(`user_sessions:${userId}`);
    return true;
  } catch (error) {
    console.error('❌ Error deleting all user sessions:', error.message);
    return false;
  }
};

// Graceful shutdown
const closeRedis = async () => {
  if (redisClient && isRedisAvailable) {
    try {
      await redisClient.quit();
      console.log('✅ Redis connection closed gracefully');
    } catch (error) {
      console.error('❌ Error closing Redis connection:', error.message);
    }
  }
};

// Health check
const isRedisHealthy = () => {
  return isRedisAvailable && redisClient && redisClient.isOpen;
};

module.exports = {
  initRedis,
  getRedisClient: () => redisClient,
  isRedisHealthy,
  closeRedis,
  // Token blacklist
  blacklistToken,
  isTokenBlacklisted,
  // Session management
  setSession,
  getSession,
  updateSessionActivity,
  deleteSession,
  addUserSession,
  getUserSessions,
  removeUserSession,
  deleteAllUserSessions
};

