# Dream House Backend API

Dream House - Construction Material Calculator Backend API built with Node.js, Express, and MongoDB.

## 🚀 Features

- **Authentication**: Phone-based authentication with SMS verification using Twilio
- **User Management**: User profiles, premium memberships, wallet system
- **Material Catalog**: Construction materials database with search and filtering
- **Ideas & Content**: Premium content system with purchase functionality
- **Calculations**: Construction material calculation engine for various building components
- **Payment Processing**: Wallet charging and premium membership purchasing
- **Admin Dashboard**: Complete admin interface for content and user management
- **File Upload**: Firebase Storage integration for images and media

## 🛠️ Tech Stack

- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens
- **SMS Service**: Twilio
- **File Storage**: Firebase Storage
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Express Validator
- **Development**: Nodemon, ESLint

## 📋 Prerequisites

- Node.js 16 or higher
- MongoDB 4.4 or higher
- Twilio account
- Firebase project (for storage)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo>
   cd dh_backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   # Server
   # DreamHouse Backend Environment Configuration

   # Server Configuration
   NODE_ENV=development
   PORT=3000
   #PORT=8080
   
   # MongoDB Configuration
   MONGODB_URI=mongodb+srv://dreamhouseadmin:WNcgbCfv95R19NLb@dreamhouse.fhnoxer.mongodb.net/dreamhouse?retryWrites=true&w=majority&appName=dreamhouse
   
   WEBSOCKET_URL="wss://dreamhousebe.onrender.com" \
   
   
   # JWT Configuration
   JWT_SECRET=dreamhouse-super-secret-jwt-key-2024
   JWT_EXPIRE=7d
   JWT_REFRESH_EXPIRE=30d
   
   # SMS Parser Configuration
   SMS_PARSER_PHONE_NUMBER=88367853
   SMS_PARSER_API_KEY=55e8fe01d10e48415bffc6d83dc715f776ec8fe677e37c53ff6a6171773b5f10
   
   # SMS Configuration
   SMS_EXPIRE_MINUTES=5
   
   # Firebase Configuration (if using Firebase)
   FIREBASE_PROJECT_ID=dreamhouse-77707
   FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCYKe18HCunGysG\nv3kHKUSW6Q9gYzm0lHEO4fwFKu6JvYUvTXmH0GRTubidAxMcbC4Gzlpd4B9Innva\nQjvZ0aklbnliiYPaKQaXyEKgomCflWw+tQvAGCzG+qYDU05gnjnNBCJrFjllXYwZ\nSDi4k5eQZYNa5XlPow+3NLNSQS7/TofbpRNNcezT3GKEVmudlpLnlMiclZBclDID\navyH4LWAyDdHi2Zqf1QNpA0nybZVfEvZ6zv1GDX4CwTk2iCqG9O+MUPK81tEsIZ7\nBN62b+xfGKcXxGsRTElNqzfp8jLJGy36Fhw/vtAInx76V6IY3pyNBgPNLxfMCxBm\nAM2/IDA/AgMBAAECggEACim5In7z+ddHFzSwR4AqhDUD9LLr5ozuxPwaMj/Dat1T\normQxZ3V9ZmdipWEyaZk2v0eIAL/uk2Lhb2PjcucRoaLnCWfJT6nbnlodp4hyGBy\n65ITOzziHYm3XAvmW9Tb+3HfpdNeks/RGacvOQ5Y7/YEjfLU5WX4sldv9EbfD4Iu\n1HJ/dbEpOa7ZPiTSTojP+i9eCf4pRqsOl/0eiAwQ20yai8khr/tViDRCLq/YkM5a\nqCzgzCeZDXMzOTxeunGBxxwbezCo1bOdM6JqL6rSLJCkzZlrynplmbpDmJLikqcy\nLPn1/Fx1o2ZiA4ms5XkfiipeX1ZC6z72swUarGKfoQKBgQDRykT7ctaoY37aKf2n\nGV4l6exameF11Flkny30OTkRUMZGJSQR3gnIikQZZ7zcxPvHLlnWQ/sbvGIw+KS4\n/t+oOffmS/mLRbjB8zInsj7sUTMdQ+ZlPhnJRl8GYtPuYrwozdrWPDdDYzuR3105\nU1ey5MVpcPRsuresp1udGREupwKBgQC5rjNwh3+P4cBjWxdy4siSnsN7wcANzdqg\nTAreaSARPY+T9PfRmCqkgGSDxzsAyAhCCWGp2SQYyqDnmEt9rosQmczOXbmMP9Yf\nA/lNUVUhN02JvkL03sookxuY1VHIpkYIpf0zKa6wAKW+WrK0bj43HALPvTTx9O6u\njzy7B8T8qQKBgErpeVx4k2IptSBeIi9LBa1wLG/lxvZ2Tz15AcXVsSUXvNVLaeff\na4rqpIqV2oDS7j0ftgCm4cHzsPRftSJCEMdXe8gGlSNAUEshdmVqZsGn9SKcHmdE\nl5yhvkjffWIAa8P+Tgh2FB3CD4F1SyqvMf+1ZTDTntQ8kF3cnQAp9VK9AoGAL1lE\ntMVYuhAPR0bLS/iYvQrPPpfBqcN8pLO/ccfM7ZiNLGWjbEcpWJmFCDWdzi00LeLG\njNFaaxgAwA4N8ha4T5toppcv4ZvFtlMFF7pNwxKfKyjhWiAV3RLmTqrXGBuOcFYj\noxBWA3umyEvIlkomg1cZQHA3OBwFYW4VRnxMt0ECgYAJLhYYY2qYuWoiKQAL/kSN\npkam3Mqw3qMz2XBfGfRRYUgWV1+Qbq71BWsj6fA5J2EmNyybQvJiNBGsQb6ZYex8\nyqV2mjUOymPjtU2MqHq8YeEJC/usmAFkUF2tWq4wxAFTWjpZ2uHhxjFcWn9UCgaT\nyD4YKPmtbWYmiF/DEcmLHQ==\n-----END PRIVATE KEY-----\n
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@dreamhouse-77707.iam.gserviceaccount.com
   FIREBASE_STORAGE_BUCKET=dreamhouse-77707.firebasestorage.app
   
   # Security & Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   
   # Bcrypt Configuration
   BCRYPT_ROUNDS=12
   
   
   # Redis Configuration (for Token Blacklist & Session Management)
   # Local development: redis://localhost:6379
   # Production: Add Redis URL from Render.com
   REDIS_URL=redis://red-d47glondiees739bu4qg:zSfgASJuEnUcR1aPXR8FUv84sM6ApGGd@red-d47glondiees739bu4qg.oregon-redis.render.com:6379
   REDIS_ENABLED=false
   
   # CSRF Protection
   # Set to false to disable in development (not recommended)
   CSRF_ENABLED=false
   
   # CORS - Allowed Origins (comma-separated)
   # Production: Use your actual domains
   ALLOWED_ORIGINS=
   https://dreamhousebe.onrender.com,
   https://dream-house-be.vercel.app,
   http://localhost:3000,
   http://localhost:3001,
   http://localhost:8080,
   http://127.0.0.1:3000,
   http://127.0.0.1:8080,
   http://10.0.2.2:3000,
   http://10.0.2.2:8080,
   http://10.0.2.2,
   https://dreamhouse.mn,
   http://51.83.5.165:3000,
   ```

4. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   
   # Or use MongoDB Atlas (update MONGODB_URI in .env)
   ```

5. **Run the application**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

6. **Run user migration (if upgrading from older version)**
   ```bash
   npm run migrate:users
   ```

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/send-code` | Send SMS verification code |
| POST | `/api/auth/verify-code` | Verify SMS code |
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/refresh` | Refresh JWT token |
| POST | `/api/auth/logout` | User logout |
| GET | `/api/auth/me` | Get current user |

### User Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/profile` | Get user profile |
| PUT | `/api/user/profile` | Update user profile |
| GET | `/api/user/calculations` | Get calculation history |
| GET | `/api/user/purchased-ideas` | Get purchased ideas |
| GET | `/api/user/wallet` | Get wallet info |
| DELETE | `/api/user/account` | Delete account |

### Materials

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/materials` | Get materials list |
| GET | `/api/materials/search` | Search materials |
| GET | `/api/materials/:id` | Get material details |
| GET | `/api/materials/categories` | Get categories |

### Ideas

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ideas` | Get ideas list |
| GET | `/api/ideas/search` | Search ideas |
| GET | `/api/ideas/:id` | Get idea details |
| POST | `/api/ideas/:id/purchase` | Purchase premium idea |

### Calculations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/calculations/wall` | Calculate wall materials |
| POST | `/api/calculations/roof` | Calculate roof materials |
| POST | `/api/calculations/fundament` | Calculate foundation |
| GET | `/api/calculations/history` | Get calculation history |

### Admin Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Dashboard analytics |
| GET | `/api/admin/users` | Get users list with filtering |
| GET | `/api/admin/users/:id` | Get user details |
| PUT | `/api/admin/users/:id/status` | Update user status (active/inactive) |
| PUT | `/api/admin/users/:id/ban` | Ban/unban user |
| PUT | `/api/admin/users/:id/role` | Update user role |
| GET | `/api/admin/analytics/users` | User analytics |
| GET | `/api/admin/analytics/calculations` | Calculation analytics |
| GET | `/api/admin/analytics/revenue` | Revenue analytics |
| GET | `/api/admin/system/stats` | System statistics |
| POST | `/api/admin/system/cleanup` | System cleanup |

## 🔐 Authentication

The API uses JWT-based authentication with phone number verification:

1. **Send Code**: POST to `/api/auth/send-code` with phone number
2. **Verify Code**: POST to `/api/auth/verify-code` with phone and 4-digit code
3. **Sign Up**: POST to `/api/auth/signup` with phone, username, and 4-digit password
4. **Login**: POST to `/api/auth/login` with phone and password
5. **Use Token**: Include `Authorization: Bearer <token>` in requests

## 📱 Phone Number Format

All phone numbers must be in Mongolia format: `+976XXXXXXXX`

## 🔐 Role-Based Access Control

The system implements a comprehensive role-based access control system:

### User Roles

- **User** (`user`): Default role for regular users
- **Moderator** (`moderator`): Can moderate content and manage basic user operations
- **Admin** (`admin`): Full system access and user management capabilities

### Role Permissions

| Role | Permissions |
|------|-------------|
| User | View materials, make calculations, purchase ideas, manage own profile |
| Moderator | User permissions + moderate content, view user reports |
| Admin | All permissions + user management, system configuration, analytics |

### Ban System

Users can be banned by administrators with the following features:
- **Ban Status**: `isBanned` boolean flag
- **Ban Date**: `bannedAt` timestamp
- **Ban Reason**: `banReason` text field
- **Automatic Blocking**: Banned users cannot access the API

### Admin User Management

Administrators can:
- View all users with advanced filtering
- Update user roles and permissions
- Ban/unban users with reason tracking
- Monitor user activity and analytics
- Manage system-wide settings

## 🔧 Development

```bash
# Run with nodemon (auto-restart)
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Fix lint issues
npm run lint:fix
```

## 🏗️ Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Route handlers
├── middleware/     # Custom middleware
├── models/         # Mongoose models
├── routes/         # Express routes
├── services/       # Business logic
└── utils/          # Utility functions
```

## 🚀 Deployment

1. **Environment Variables**
   - Set production values in `.env`
   - Use process manager like PM2

2. **Database**
   - Use MongoDB Atlas for production
   - Set up proper indexes

3. **Security**
   - Enable HTTPS
   - Use strong JWT secrets
   - Configure CORS properly

4. **Monitoring**
   - Use MongoDB monitoring
   - Set up error tracking
   - Configure logging

## 📊 Performance

- **Caching**: Redis can be added for caching
- **Database**: Proper indexing on frequent queries
- **Rate Limiting**: Configured for API protection
- **File Uploads**: Firebase Storage for scalability

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   ```bash
   # Check if MongoDB is running
   mongod --version
   
   # Check connection string in .env
   ```

2. **SMS Not Sending**
   ```bash
   # Verify Twilio credentials
   # Check phone number format
   # Ensure Twilio account has funds
   ```

3. **JWT Token Issues**
   ```bash
   # Check JWT_SECRET in .env
   # Verify token expiration settings
   ```

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📞 Support

For support, contact the development team or create an issue in the repository. 
