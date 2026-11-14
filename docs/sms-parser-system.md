# SMS Parser System Documentation

This document describes the new SMS Parser system that replaces Twilio for both OTP verification and wallet recharge functionality.

## 🔄 System Overview

### Traditional SMS (Old System)
```
User → API → Twilio → SMS → User Phone
```

### SMS Parser System (New System)
```
User → API → Display Code → User sends SMS → Parser App → API Webhook
```

## 📱 OTP Verification Flow

### 1. Registration/Password Reset
```bash
# User requests OTP
POST /api/auth/send-code
{
  "phone": "+97612345678"
}

# Response shows code to send
{
  "success": true,
  "message": "Verification code generated successfully",
  "data": {
    "otpCode": "84739",
    "sendToNumber": "+97612345678",
    "instructions": "Send this code via SMS to the number: +97612345678",
    "expiresIn": 5,
    "phone": "+97612345678"
  }
}
```

### 2. User Action
- User sees code `84739` on screen
- User opens SMS app
- User sends SMS: `84739` to `+97612345678`

### 3. SMS Parser App
- Installed on the customer's phone (+97612345678)
- Receives SMS: `84739`
- Validates code exists in system
- Sends webhook to API

### 4. Parser Webhook
```bash
POST /api/sms-parser/verify-otp
{
  "phoneNumber": "+97612345678",
  "otpCode": "847392",
  "smsContent": "847392",
  "smsTimestamp": "2024-01-20T10:30:00Z",
  "parserAppVersion": "1.0.0"
}
```

### 5. User Verification
```bash
# User verifies with same code
POST /api/auth/verify-code
{
  "phone": "+97612345678",
  "code": "847392"
}

# Success - code was confirmed by parser
{
  "success": true,
  "message": "Phone number verified successfully"
}
```

## 💰 Wallet Recharge Flow

### 1. Bank Transfer
- User transfers money to customer's bank account
- User includes their phone number in transaction note
- Example: "Transfer note: +97612345678"

### 2. Bank SMS
- Bank sends SMS to customer's phone
- Example: "500₮ received from Khan Bank. Note: +97612345678"

### 3. SMS Parser App
- Receives bank SMS
- Extracts:
  - Amount: `500`
  - Phone: `+97612345678`
  - Bank: `Khan Bank`
- Sends webhook to API

### 4. Parser Webhook
```bash
POST /api/sms-parser/bank-transaction
{
  "smsContent": "500₮ received from Khan Bank. Note: +97612345678",
  "phoneNumber": "+97612345678",
  "amount": 500,
  "bankName": "Khan Bank",
  "transactionNote": "+97612345678",
  "smsTimestamp": "2024-01-20T10:30:00Z",
  "parserAppVersion": "1.0.0"
}
```

### 5. Automatic Wallet Update
- API finds user by phone number
- Adds amount to user's wallet
- Creates transaction record

## 🔧 Environment Setup

Add these to your `.env` file:

```env
# SMS Parser Configuration
SMS_PARSER_PHONE_NUMBER=+97612345678
SMS_PARSER_API_KEY=your-secure-api-key-here
```

## 🛠️ API Endpoints

### OTP System
- `POST /api/auth/send-code` - Generate and display OTP
- `POST /api/auth/forgot-password` - Generate password reset OTP
- `POST /api/auth/verify-code` - Verify OTP (same as before)

### SMS Parser Webhooks
- `POST /api/sms-parser/verify-otp` - Confirm OTP via SMS Parser
- `POST /api/sms-parser/bank-transaction` - Process bank SMS for wallet recharge

### Admin Endpoints
- `GET /api/sms-parser/transactions` - View bank transaction history
- `POST /api/sms-parser/transactions/:id/retry` - Retry failed transactions

## 🔐 Security

### API Key Authentication
All SMS Parser webhooks require API key in header:
```
X-SMS-Parser-API-Key: your-api-key-here
```

### Validation
- Phone number format validation: `+976XXXXXXXX`
- Amount validation: Must be positive
- Timestamp validation: ISO 8601 format
- Rate limiting on endpoints

## 📊 Database Models

### SmsVerification (Updated)
```javascript
{
  phone: "+97612345678",
  code: "847392",
  isUsed: false,
  expiresAt: Date,
  // New SMS Parser fields
  parserConfirmedAt: Date,
  parserAppVersion: "1.0.0",
  actualSmsContent: "847392",
  smsParserPhone: "+97612345678"
}
```

### BankTransaction (New)
```javascript
{
  smsContent: "500₮ received from Khan Bank. Note: +97612345678",
  phoneNumber: "+97612345678",
  amount: 500,
  bankName: "Khan Bank",
  isProcessed: true,
  processedAt: Date,
  userId: ObjectId,
  walletBalanceBefore: 1000,
  walletBalanceAfter: 1500
}
```

## 🧪 Testing

### 1. Test OTP Flow
```bash
# 1. Generate OTP
curl -X POST http://localhost:3000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"phone": "+97612345678"}'

# 2. Simulate SMS Parser webhook
curl -X POST http://localhost:3000/api/sms-parser/verify-otp \
  -H "Content-Type: application/json" \
  -H "X-SMS-Parser-API-Key: your-api-key" \
  -d '{
    "phoneNumber": "+97612345678",
    "otpCode": "84739",
    "smsContent": "847392",
    "smsTimestamp": "2024-01-20T10:30:00Z",
    "parserAppVersion": "1.0.0"
  }'

# 3. Verify OTP
curl -X POST http://localhost:3000/api/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+97612345678",
    "code": "847392"
  }'
```

### 2. Test Wallet Recharge
```bash
# Simulate bank SMS parser webhook
curl -X POST http://localhost:3000/api/sms-parser/bank-transaction \
  -H "Content-Type: application/json" \
  -H "X-SMS-Parser-API-Key: your-api-key" \
  -d '{
    "smsContent": "500₮ received from Khan Bank. Note: +97612345678",
    "phoneNumber": "+97612345678",
    "amount": 500,
    "bankName": "Khan Bank",
    "transactionNote": "+97612345678",
    "smsTimestamp": "2024-01-20T10:30:00Z",
    "parserAppVersion": "1.0.0"
  }'
```

## 🚨 Error Handling

### Failed Transactions
- All transactions are logged even if they fail
- Admin can retry failed transactions
- Error messages are stored for debugging

### OTP Failures
- Invalid codes are tracked with attempt counts
- Expired codes are automatically cleaned up
- Parser confirmation is optional but recommended

## 📱 SMS Parser App Requirements

The SMS Parser App should:

1. **Monitor SMS messages** on the customer's phone
2. **Parse OTP codes** and send to `/api/sms-parser/verify-otp`
3. **Parse bank SMS** for amount and phone number
4. **Send bank transactions** to `/api/sms-parser/bank-transaction`
5. **Include API key** in all webhook requests
6. **Handle network failures** with retry logic

## 🔄 Migration from Twilio

1. Update environment variables
2. Deploy new SMS Parser system
3. Install SMS Parser App on customer phone
4. Test both OTP and wallet recharge flows
5. Monitor transaction logs for any issues

The system is backward compatible - if SMS Parser is not configured, it will log warnings but continue working in development mode.