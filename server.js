

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const multer = require('multer');
require('dotenv').config();

// Import and initialize Firebase
const { initializeFirebase } = require('./src/config/firebase');
initializeFirebase();

// Import and initialize Redis
const { initRedis, closeRedis, isRedisHealthy } = require('./src/config/redis');

// Import security middleware
const httpsEnforcement = require('./src/middleware/httpsEnforcement');
const { csrfProtection, setCsrfToken, getCsrfToken } = require('./src/middleware/csrfProtection');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const materialRoutes = require('./src/routes/materialRoutes');
const ideaRoutes = require('./src/routes/ideaRoutes');
const adminAuthRoutes = require('./src/routes/adminAuthRoutes');
const calculationRoutes = require('./src/routes/calculationRoutes');
const ingredientsRoutes = require('./src/routes/ingredientsRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const uploadRoutes = require('./src/routes/uploadRoutes');
const smsParserRoutes = require('./src/routes/smsParserRoutes');
const heatingTypeRoutes = require('./src/routes/heatingTypeRoutes');
const withdrawRoutes = require('./src/routes/withdrawRoutes');
const purchaseRoutes = require('./src/routes/purchaseRoutes');
const depositRoutes = require('./src/routes/depositRoutes');
const messageRoutes = require('./src/routes/messageRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const subscriptionRoutes = require('./src/routes/subscriptionRoutes');

// Import middleware
const { errorHandler } = require('./src/middleware/errorHandler');
const { notFound } = require('./src/middleware/notFound');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 8080;

// Socket.IO setup
const socketOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : (process.env.NODE_ENV === 'production' ? [] : ['http://10.0.2.2:3000', 'http://localhost:3000', 'http://localhost:8080']);

const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? (socketOrigins.length > 0 ? socketOrigins : false)
      : '*',
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Socket.IO Authentication Middleware
const socketAuth = (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const isAnonymous = socket.handshake.auth.isAnonymous === true;
    const sessionId = socket.handshake.auth.sessionId;

    // Check if this is an anonymous user
    if (isAnonymous && sessionId) {
      socket.userId = null;
      socket.userRole = 'anonymous';
      socket.sessionId = sessionId;
      console.log(`🔌 Anonymous socket auth - Session ID: ${sessionId}`);
      return next();
    }

    // Regular authenticated user
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('❌ JWT_SECRET not configured!');
      return next(new Error('Server configuration error'));
    }
    const decoded = jwt.verify(token, jwtSecret);

    socket.userId = decoded.userId;
    socket.accountType = decoded.accountType === 'admin' ? 'admin' : 'user';
    // Admin roles are only honoured on dashboard (admins collection) tokens
    socket.userRole = socket.accountType === 'admin'
      ? (decoded.role || 'admin')
      : (['admin', 'superadmin', 'operator'].includes(decoded.role) ? 'user' : (decoded.role || 'user'));

    console.log(`🔌 Socket auth successful - User ID: ${socket.userId}, Role: ${socket.userRole}`);

    next();
  } catch (error) {
    console.error('🔌 Socket auth error:', error);
    next(new Error('Authentication error'));
  }
};

io.use(socketAuth);

// Socket.IO Connection Handler
io.on('connection', (socket) => {
  // Check if this is an anonymous user
  const isAnonymous = socket.userRole === 'anonymous';
  const sessionId = socket.sessionId;

  if (isAnonymous && sessionId) {
    // Anonymous user connection
    console.log(`🔌 Anonymous user ${sessionId} connected`);
    console.log(`🏠 Anonymous room: anon_${sessionId}`);

    socket.join(`anon_${sessionId}`);
    socket.join('anonymous_rooms');
    console.log(`✅ Anonymous user ${sessionId} joined room: anon_${sessionId}`);
    console.log(`✅ Anonymous user ${sessionId} joined room: anonymous_rooms`);
    console.log(`🔍 Socket rooms:`, Array.from(socket.rooms));

    // Anonymous user specific events (simplified for Flutter)
    socket.on('disconnect', () => {
      console.log(`🔌 Anonymous user ${sessionId} disconnected`);
    });

    socket.on('error', (error) => {
      console.error('Anonymous socket error:', error);
    });

    // Test event to verify connection
    socket.emit('test_connection', {
      message: 'Anonymous WebSocket connected successfully',
      sessionId: sessionId,
      timestamp: new Date().toISOString()
    });
  } else {
    // Authenticated user connection
    console.log(`🔌 User ${socket.userId} (${socket.userRole}) connected`);
    console.log(`🏠 User room: user_${socket.userId}`);

    socket.join(`user_${socket.userId}`);
    console.log(`✅ User ${socket.userId} joined room: user_${socket.userId}`);

    if (socket.accountType === 'admin') {
      socket.join('admin_room');
      console.log(`✅ Admin ${socket.userId} joined admin_room`);

      socket.join('anonymous_rooms');
      console.log(`✅ Admin ${socket.userId} joined anonymous_rooms`);

      // Admin specific events (simplified for Flutter)
      // Admin automatically receives all new_message events for anonymous users
    }

    console.log(`🏠 Socket ${socket.userId} rooms:`, Array.from(socket.rooms));

    socket.on('disconnect', () => {
      console.log(`🔌 User ${socket.userId} disconnected`);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }
});

global.io = io;

// Load Swagger document and CSS
let swaggerDocument;
let customCss = '';

try {
  const yamlFile = fs.readFileSync(path.resolve(__dirname, './docs/swagger.yaml'), 'utf8');
  swaggerDocument = YAML.parse(yamlFile);
  try {
    const swaggerUiCss = fs.readFileSync(
      path.resolve(__dirname, './node_modules/swagger-ui-dist/swagger-ui.css'),
      'utf8'
    );
    customCss = swaggerUiCss;
  } catch (cssError) {
    console.log('Swagger UI CSS yüklenemedi, varsayılan CSS kullanılacak:', cssError.message);
  }

} catch (error) {
  console.log('Swagger YAML yüklenemedi, fallback kullanılıyor:', error.message);
  swaggerDocument = {
    openapi: '3.0.0',
    info: {
      title: 'Dream House API Documentation',
      version: '1.0.0',
      description: 'API endpoints'
    },
    servers: [
      {
        url: '/',
        description: 'Current server'
      }
    ],
    paths: {
      '/api/health': {
        get: {
          summary: 'Health check',
          responses: {
            '200': {
              description: 'API is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string' },
                      timestamp: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  };
}

// Request logging middleware (before CORS)
app.use((req, res, next) => {
  const requestStartTime = Date.now();

  console.log('\n========================================');
  console.log('📥 Incoming Request');
  console.log('========================================');
  console.log('⏰ Time:', new Date().toISOString());
  console.log('🔗 Method:', req.method);
  console.log('🌐 URL:', req.url);
  console.log('📍 Path:', req.path);
  console.log('🔑 Origin:', req.headers.origin || 'No origin header');
  console.log('🔐 Authorization:', req.headers.authorization ? 'Present' : 'Not present');
  console.log('📦 Content-Type:', req.headers['content-type'] || 'Not specified');
  console.log('🖥️  User-Agent:', req.headers['user-agent'] || 'Not specified');
  console.log('🔄 Referer:', req.headers.referer || 'Not specified');

  // Log query parameters
  if (Object.keys(req.query).length > 0) {
    console.log('🔍 Query Params:', JSON.stringify(req.query, null, 2));
  }

  // Log request body (will be populated after body parser)
  const originalJson = res.json;
  const originalSend = res.send;
  let responseBody;

  // Intercept res.json
  res.json = function (data) {
    responseBody = data;
    return originalJson.call(this, data);
  };

  // Intercept res.send
  res.send = function (data) {
    responseBody = data;
    return originalSend.call(this, data);
  };

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - requestStartTime;
    console.log('\n========================================');
    console.log('📤 Response Sent');
    console.log('========================================');
    console.log('⏰ Time:', new Date().toISOString());
    console.log('🔗 Method:', req.method);
    console.log('🌐 URL:', req.url);
    console.log('📊 Status:', res.statusCode);
    console.log('⏱️  Duration:', duration + 'ms');

    // Log response body (limit size for readability)
    if (responseBody) {
      try {
        const bodyStr = typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody);
        const truncatedBody = bodyStr.length > 1000
          ? bodyStr.substring(0, 1000) + '... (truncated)'
          : bodyStr;
        console.log('📦 Response Body:', truncatedBody);
      } catch (e) {
        console.log('📦 Response Body: [Could not stringify]');
      }
    }
    console.log('========================================\n');
  });

  console.log('========================================\n');
  next();
});

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [
    'http://localhost',
    'http://127.0.0.1',
    'http://10.0.2.2',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:8080',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:8080',
    'http://10.0.2.2:3000',
    'http://10.0.2.2:8080'
  ];

app.use(cors({
  origin: function (origin, callback) {
    console.log('🔍 CORS Debug - Incoming origin:', origin);
    console.log('🔍 CORS Debug - Allowed origins:', allowedOrigins);

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.length === 0 || allowedOrigins.indexOf(origin) !== -1) {
      console.log('✅ CORS - Origin allowed');
      callback(null, true);
    } else {
      console.log('❌ CORS - Origin blocked:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production'
    ? (parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100)
    : 5000,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Log request body after parsing
app.use((req, res, next) => {
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('\n🔥🔥🔥 REQUEST BODY 🔥🔥🔥');
    console.log('========================================');
    try {
      const bodyStr = JSON.stringify(req.body, null, 2);
      const truncatedBody = bodyStr.length > 3000
        ? bodyStr.substring(0, 3000) + '\n... (truncated - too long)'
        : bodyStr;
      console.log(truncatedBody);
    } catch (e) {
      console.log('[Could not stringify body]');
    }
    console.log('========================================\n');
  } else {
    console.log('📭 Request Body: Empty or no body\n');
  }
  next();
});

// Cookie parser middleware (required for CSRF)
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// HTTPS Enforcement (production only)
app.use(httpsEnforcement);

// CSRF Token generation middleware
app.use(setCsrfToken);

// Logging middleware
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Custom CSS eklentileri
const additionalCss = `
  .swagger-ui .topbar { display: none }
  
  /* Custom styling */
  .swagger-ui .info .title {
    color: #3b4151;
    font-size: 36px;
  }
  
  .swagger-ui .scheme-container {
    background: #fff;
    box-shadow: 0 1px 2px 0 rgba(0,0,0,.15);
  }
  
  /* Dark/Light mode toggle button */
  .theme-toggle {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    background: #007bff;
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 25px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 2px 10px rgba(0,123,255,0.3);
    transition: all 0.3s ease;
  }
  
  .theme-toggle:hover {
    background: #0056b3;
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0,123,255,0.4);
  }
`;

// Swagger UI setup
const swaggerOptions = {
  customCss: customCss + additionalCss,
  customSiteTitle: 'Dream House API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    docExpansion: 'list',
    deepLinking: true
  }
};

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, swaggerOptions)
);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const redisHealthy = isRedisHealthy();
  const overallStatus = redisHealthy ? 'OK' : 'DEGRADED';

  res.status(200).json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: 'OK',
      redis: redisHealthy ? 'OK' : 'UNAVAILABLE'
    }
  });
});

// CSRF Token endpoint
app.get('/api/csrf-token', getCsrfToken);

// Debug endpoint for swagger document (Admin only in production)
app.get('/debug/swagger', (req, res, next) => {
  // Only allow in development or if authenticated as admin
  if (process.env.NODE_ENV === 'production') {
    const { auth, admin } = require('./src/middleware/auth');
    return auth(req, res, () => {
      admin(req, res, next);
    });
  }
  next();
}, (req, res) => {
  res.status(200).json({
    swaggerLoaded: !!swaggerDocument,
    swaggerInfo: swaggerDocument?.info || null,
    swaggerPaths: swaggerDocument?.paths ? Object.keys(swaggerDocument.paths).length : 0,
    customCssLoaded: !!customCss,
    customCssLength: customCss.length,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    filesChecked: {
      swaggerYaml: fs.existsSync(path.resolve(__dirname, './docs/swagger.yaml')),
      swaggerUiCss: fs.existsSync(path.resolve(__dirname, './node_modules/swagger-ui-dist/swagger-ui.css')),
      swaggerUiDist: fs.existsSync(path.resolve(__dirname, './node_modules/swagger-ui-dist'))
    }
  });
});

// Welcome endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to Dream House API',
    version: '1.0.0',
    docs: '/api-docs',
    health: '/api/health',
    endpoints: {
      auth: '/api/auth',
      users: '/api/user',
      materials: '/api/materials',
      ideas: '/api/ideas',
      calculations: '/api/calculations',
      payments: '/api/payments',
      admin: '/api/admin',
      upload: '/api/upload',
      smsParser: '/api/sms-parser',
      heatingTypes: '/api/heating-types',
      swaggerProxy: '/api/swagger-proxy',
      messages: '/api/messages',
      subscriptions: '/api/subscriptions',
      anonymousChat: '/api/messages/anonymous'
    }
  });
});

// Support-chat images stored on this server (deleted with the chat by the retention job).
// Cross-origin so the website and dashboard (other origins) can show them.
app.use('/uploads/chat', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads', 'chat'), { index: false, dotfiles: 'deny', maxAge: '7d' }));

// Category / material / idea images saved on this server when Firebase is not configured
// (see saveImageLocally in src/config/firebase.js).
app.use('/uploads/images', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads', 'images'), { index: false, dotfiles: 'deny', maxAge: '7d' }));

// API routes
// Public website settings (app download links) — no login
app.get('/api/public-settings', require('./src/controllers/settingsController').getPublicSettings);
app.use('/api/auth', authRoutes);
app.use('/api/admin-auth', adminAuthRoutes); // Dashboard accounts (admins collection)
app.use('/api/user', csrfProtection, userRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/materials', csrfProtection, ingredientsRoutes);
app.use('/api/ideas', ideaRoutes);
app.use('/api/calculations', csrfProtection, calculationRoutes);
app.use('/api/payments', csrfProtection, paymentRoutes);
app.use('/api/admin', csrfProtection, adminRoutes);
app.use('/api/upload', csrfProtection, uploadRoutes);
app.use('/api/sms-parser', smsParserRoutes); // No CSRF (webhook)
app.use('/api/heating-types', heatingTypeRoutes);
app.use('/api/messages', csrfProtection, messageRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/dashboard', dashboardRoutes);
// Withdraw, Purchase, and Deposit routes are handled through admin routes at /api/admin/withdrawals, /api/admin/purchases, and /api/admin/deposits

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Database and Redis connection
const startServer = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('📦 Connected to MongoDB');

    await initRedis();

    // Delete support-chat messages/images older than the "Chat deletion" setting (hourly)
    require('./src/services/chatRetentionService').startChatCleanupSchedule();
    // Built-in dashboard roles (superadmin, admin, operator) for Roles & Permission
    await require('./src/services/roleService').ensureSystemRoles();
    // Ingredients belong to materials: fix indexes and copy old category ingredients once
    await require('./src/services/ingredientMigrationService').migrateIngredientsToMaterials()
      .catch(err => console.error('Ingredient migration error:', err));

    // Start server with Socket.IO
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🔌 Socket.IO ready`);
      console.log(`📍 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`🏠 API Base URL: http://localhost:${PORT}/api`);
      console.log(`🔐 HTTPS Enforcement: ${process.env.NODE_ENV === 'production' ? 'ENABLED' : 'DISABLED'}`);
      console.log(`🛡️  CSRF Protection: ${process.env.CSRF_ENABLED !== 'false' ? 'ENABLED' : 'DISABLED'}`);
      console.log(`🔒 Token Blacklist: ${isRedisHealthy() ? 'ENABLED' : 'DISABLED (Redis unavailable)'}`);
    });
  } catch (error) {
    console.error('❌ Server startup error:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');

  // Close Redis connection
  await closeRedis();

  // Close MongoDB connection
  mongoose.connection.close();
  console.log('Database connection closed.');

  // Close server
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');

  // Close Redis connection
  await closeRedis();

  // Close MongoDB connection
  mongoose.connection.close();
  console.log('Database connection closed.');

  // Close server
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

module.exports = app;