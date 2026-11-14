# Dream House Backend Setup Guide

## Quick Start

### 1. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configurations
# At minimum, update:
# - JWT_SECRET (use a strong secret)
# - MONGODB_URI (if using different MongoDB setup)
# - TWILIO credentials (for SMS functionality)
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start MongoDB
```bash
# Local MongoDB
mongod

# Or use MongoDB Atlas
# Update MONGODB_URI in .env with your Atlas connection string
```

### 4. Seed Database (Optional)
```bash
npm run seed
```

### 5. Start Development Server
```bash
npm run dev
```

### 6. Test the API
```bash
# Health check
curl http://localhost:3000/health

# API Documentation
open http://localhost:3000/api-docs
```

## Test Accounts (After Seeding)

| Phone | Password | Type | Wallet |
|-------|----------|------|--------|
| +97612345678 | 1234 | Premium | 50,000 MNT |
| +97687654321 | 5678 | Free | 25,000 MNT |
| +97611111111 | 9999 | Premium | 75,000 MNT |

## API Endpoints

### Base URL
```
http://localhost:3000/api
```

### Quick Test Flow
1. **Health Check**: `GET /health`
2. **Login**: `POST /api/auth/login`
3. **Get Materials**: `GET /api/materials`
4. **Calculate Wall**: `POST /api/calculations/wall` (requires auth)

## Documentation

- **Swagger UI**: http://localhost:3000/api-docs
- **API Examples**: [docs/api-examples.md](docs/api-examples.md)
- **Postman Collection**: [docs/postman-collection.json](docs/postman-collection.json)

## Development Scripts

```bash
npm run dev      # Start development server with nodemon
npm start        # Start production server
npm run seed     # Seed database with sample data
npm test         # Run tests
npm run lint     # Run ESLint
npm run lint:fix # Fix ESLint issues
```

## MongoDB Collections

After seeding, you'll have:
- **users**: 3 test users
- **materials**: 5 sample materials
- **ideas**: 5 sample ideas  
- **calculations**: 2 sample calculations
- **smsverifications**: SMS verification codes (auto-expire)

## Production Deployment

### 1. Environment Variables
```bash
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=very-strong-production-secret
# ... other production configs
```

### 2. MongoDB Indexes
```bash
# The application creates indexes automatically
# But for production, you may want to create them manually:
db.users.createIndex({ phone: 1 })
db.materials.createIndex({ category: 1, subcategory: 1 })
db.ideas.createIndex({ category: 1 })
# etc.
```

### 3. Process Management
```bash
# Using PM2
npm install -g pm2
pm2 start server.js --name dreamhouse-api
pm2 startup
pm2 save
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Check if MongoDB is running
   - Verify MONGODB_URI in .env
   - Check network connectivity

2. **SMS Not Working**
   - Verify Twilio credentials
   - Check account balance
   - Ensure phone number format (+976XXXXXXXX)

3. **JWT Token Issues**
   - Check JWT_SECRET in .env
   - Verify token in Authorization header
   - Check token expiration

4. **Port Already in Use**
   ```bash
   # Kill process on port 3000
   lsof -ti:3000 | xargs kill -9
   ```

### Logs

Development logs are detailed. For production:
```bash
# PM2 logs
pm2 logs dreamhouse-api

# Or direct logs
npm start 2>&1 | tee app.log
```

## Security Checklist for Production

- [ ] Strong JWT_SECRET
- [ ] Updated admin phone numbers
- [ ] CORS origins configured
- [ ] Rate limiting enabled
- [ ] HTTPS/SSL certificate
- [ ] MongoDB authentication
- [ ] Firewall rules
- [ ] Regular backups
- [ ] Monitoring setup

## API Rate Limits

- **Window**: 15 minutes
- **Max Requests**: 100 per IP
- **SMS Codes**: 1 per minute per phone

## Support

For issues or questions:
- Check logs first
- Review API documentation
- Test with Postman collection
- Check MongoDB connection and data