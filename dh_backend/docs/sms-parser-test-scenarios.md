# SMS Parser Response Endpoint Test Senaryoları

Bu dokümantasyon, SMS Parser response endpoint'lerinin test senaryolarını içerir. Tüm endpoint'ler sadece `X-SMS-Parser-API-Key` header'ı ile erişilebilir.

## Test Ortamı

```bash
# Base URL
BASE_URL=http://localhost:3000/api

# SMS Parser API Key
SMS_PARSER_API_KEY=your_sms_parser_api_key_here
```

## 1. Response İstatistikleri Endpoint'i

### ✅ Success Senaryoları

#### 1.1 Tüm İstatistikleri Getirme
```bash
curl -H "X-SMS-Parser-API-Key: $SMS_PARSER_API_KEY" \
  "$BASE_URL/sms-parser/responses/stats"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "stats": [
      {
        "_id": "verify-otp",
        "statusCodes": [
          {
            "statusCode": 200,
            "isSuccess": true,
            "count": 150,
            "avgResponseTime": 45.2,
            "minResponseTime": 12,
            "maxResponseTime": 234
          },
          {
            "statusCode": 400,
            "isSuccess": false,
            "count": 25,
            "avgResponseTime": 23.1,
            "minResponseTime": 8,
            "maxResponseTime": 89
          }
        ],
        "totalRequests": 175
      },
      {
        "_id": "bank-transaction",
        "statusCodes": [
          {
            "statusCode": 200,
            "isSuccess": true,
            "count": 89,
            "avgResponseTime": 67.8,
            "minResponseTime": 34,
            "maxResponseTime": 156
          }
        ],
        "totalRequests": 89
      }
    ],
    "filters": {}
  }
}
```

#### 1.2 Endpoint Bazında Filtreleme
```bash
curl -H "X-SMS-Parser-API-Key: $SMS_PARSER_API_KEY" \
  "$BASE_URL/sms-parser/responses/stats?endpoint=verify-otp"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "stats": [
      {
        "_id": "verify-otp",
        "statusCodes": [
          {
            "statusCode": 200,
            "isSuccess": true,
            "count": 150,
            "avgResponseTime": 45.2,
            "minResponseTime": 12,
            "maxResponseTime": 234
          }
        ],
        "totalRequests": 150
      }
    ],
    "filters": {
      "endpoint": "verify-otp"
    }
  }
}
```

#### 1.3 Tarih Aralığı ile Filtreleme
```bash
curl -H "X-SMS-Parser-API-Key: $SMS_PARSER_API_KEY" \
  "$BASE_URL/sms-parser/responses/stats?startDate=2024-01-20&endDate=2024-01-21"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "stats": [
      {
        "_id": "verify-otp",
        "statusCodes": [
          {
            "statusCode": 200,
            "isSuccess": true,
            "count": 45,
            "avgResponseTime": 42.1,
            "minResponseTime": 15,
            "maxResponseTime": 198
          }
        ],
        "totalRequests": 45
      }
    ],
    "filters": {
      "startDate": "2024-01-20",
      "endDate": "2024-01-21"
    }
  }
}
```

#### 1.4 Başarı Durumu ile Filtreleme
```bash
curl -H "X-SMS-Parser-API-Key: $SMS_PARSER_API_KEY" \
  "$BASE_URL/sms-parser/responses/stats?isSuccess=true"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "stats": [
      {
        "_id": "verify-otp",
        "statusCodes": [
          {
            "statusCode": 200,
            "isSuccess": true,
            "count": 150,
            "avgResponseTime": 45.2,
            "minResponseTime": 12,
            "maxResponseTime": 234
          }
        ],
        "totalRequests": 150
      }
    ],
    "filters": {
      "isSuccess": true
    }
  }
}
```

### ❌ Fail Senaryoları

#### 1.5 API Key Eksik
```bash
curl "$BASE_URL/sms-parser/responses/stats"
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Invalid or missing SMS Parser API key"
}
```

**Status Code:** 401

#### 1.6 Geçersiz API Key
```bash
curl -H "X-SMS-Parser-API-Key: invalid_key" \
  "$BASE_URL/sms-parser/responses/stats"
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Invalid or missing SMS Parser API key"
}
```

**Status Code:** 401

#### 1.7 Geçersiz Endpoint Filtresi
```bash
curl -H "X-SMS-Parser-API-Key: $SMS_PARSER_API_KEY" \
  "$BASE_URL/sms-parser/responses/stats?endpoint=invalid-endpoint"
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "type": "field",
      "value": "invalid-endpoint",
      "msg": "Invalid endpoint",
      "path": "endpoint",
      "location": "query"
    }
  ]
}
```

**Status Code:** 400

#### 1.8 Geçersiz Tarih Formatı
```bash
curl -H "X-SMS-Parser-API-Key: $SMS_PARSER_API_KEY" \
  "$BASE_URL/sms-parser/responses/stats?startDate=invalid-date"
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "type": "field",
      "value": "invalid-date",
      "msg": "Start date must be a valid ISO 8601 date",
      "path": "startDate",
      "location": "query"
    }
  ]
}
```

**Status Code:** 400

## 2. Hata Özeti Endpoint'i

### ✅ Success Senaryoları

#### 2.1 Son 7 Günün Hataları
```bash
curl -H "X-SMS-Parser-API-Key: $SMS_PARSER_API_KEY" \
  "$BASE_URL/sms-parser/responses/errors?days=7"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "errorSummary": [
      {
        "_id": {
          "endpoint": "verify-otp",
          "statusCode": 400
        },
        "count": 25,
        "errors": [
          {
            "message": "Invalid OTP code",
            "code": "OTP_INVALID",
            "timestamp": "2024-01-20T10:30:00.000Z"
          },
          {
            "message": "Phone number mismatch",
            "code": "PHONE_MISMATCH",
            "timestamp": "2024-01-20T11:15:00.000Z"
          }
        ]
      },
      {
        "_id": {
          "endpoint": "bank-transaction",
          "statusCode": 400
        },
        "count": 12,
        "errors": [
          {
            "message": "User not found",
            "code": "USER_NOT_FOUND",
            "timestamp": "2024-01-20T12:00:00.000Z"
          }
        ]
      }
    ],
    "period": "7 days"
  }
}
```

#### 2.2 Son 30 Günün Hataları
```bash
curl -H "X-SMS-Parser-API-Key: $SMS_PARSER_API_KEY" \
  "$BASE_URL/sms-parser/responses/errors?days=30"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "errorSummary": [
      {
        "_id": {
          "endpoint": "verify-otp",
          "statusCode": 400
        },
        "count": 89,
        "errors": [
          {
            "message": "Invalid OTP code",
            "code": "OTP_INVALID",
            "timestamp": "2024-01-15T09:30:00.000Z"
          }
        ]
      }
    ],
    "period": "30 days"
  }
}
```

### ❌ Fail Senaryoları

#### 2.3 API Key Eksik
```bash
curl "$BASE_URL/sms-parser/responses/errors?days=7"
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Invalid or missing SMS Parser API key"
}
```

**Status Code:** 401

#### 2.4 Geçersiz Gün Sayısı
```bash
curl -H "X-SMS-Parser-API-Key: $SMS_PARSER_API_KEY" \
  "$BASE_URL/sms-parser/responses/errors?days=400"
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "type": "field",
      "value": "400",
      "msg": "Days must be between 1 and 365",
      "path": "days",
      "location": "query"
    }
  ]
}
```

**Status Code:** 400

## 3. Response Listesi Endpoint'i

### ✅ Success Senaryoları

#### 3.1 İlk Sayfa (20 Response)
```bash
curl -H "X-SMS-Parser-API-Key: $SMS_PARSER_API_KEY" \
  "$BASE_URL/sms-parser/responses?page=1&limit=20"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "responses": [
      {
        "_id": "65f1234567890abcd1234567",
        "endpoint": "verify-otp",
        "requestData": {
          "phoneNumber": "+97612345678",
          "otpCode": "84739",
          "smsContent": "84739",
          "parserAppVersion": "1.0.0"
        },
        "responseData": {
          "success": true,
          "message": "OTP verification confirmed"
        },
        "statusCode": 200,
        "responseTime": 45.2,
        "isSuccess": true,
        "metadata": {
          "phoneNumber": "+97612345678",
          "smsContent": "84739"
        },
        "createdAt": "2024-01-20T10:30:00.000Z"
      }
    ],
    "pagination": {
      "current": 1,
      "total": 8,
      "count": 20,
      "totalItems": 150
    }
  }
}
```

#### 3.2 Endpoint Bazında Filtreleme
```bash
curl -H "X-SMS-Parser-API-Key: $SMS_PARSER_API_KEY" \
  "$BASE_URL/sms-parser/responses?endpoint=bank-transaction&page=1&limit=10"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "responses": [
      {
        "_id": "65f1234567890abcd1234568",
        "endpoint": "bank-transaction",
        "requestData": {
          "smsContent": "500₮ received from Khan Bank",
          "phoneNumber": "+97612345678",
          "amount": 500,
          "bankName": "Khan Bank"
        },
        "responseData": {
          "success": true,
          "message": "Wallet recharged successfully"
        },
        "statusCode": 200,
        "responseTime": 67.8,
        "isSuccess": true,
        "metadata": {
          "phoneNumber": "+97612345678",
          "amount": 500,
          "bankName": "Khan Bank",
          "transactionType": "wallet_recharge"
        },
        "createdAt": "2024-01-20T11:00:00.000Z"
      }
    ],
    "pagination": {
      "current": 1,
      "total": 3,
      "count": 10,
      "totalItems": 25
    }
  }
}
```

#### 3.3 Telefon Numarası ile Filtreleme
```bash
curl -H "X-SMS-Parser-API-Key: $SMS_PARSER_API_KEY" \
  "$BASE_URL/sms-parser/responses?phoneNumber=%2B97612345678&limit=50"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "responses": [
      {
        "_id": "65f1234567890abcd1234567",
        "endpoint": "verify-otp",
        "metadata": {
          "phoneNumber": "+97612345678"
        },
        "createdAt": "2024-01-20T10:30:00.000Z"
      }
    ],
    "pagination": {
      "current": 1,
      "total": 1,
      "count": 50,
      "totalItems": 1
    }
  }
}
```

### ❌ Fail Senaryoları

#### 3.4 API Key Eksik
```bash
curl "$BASE_URL/sms-parser/responses?page=1&limit=20"
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Invalid or missing SMS Parser API key"
}
```

**Status Code:** 401

#### 3.5 Geçersiz Sayfa Numarası
```bash
curl -H "X-SMS-Parser-API-Key: $SMS_PARSER_API_KEY" \
  "$BASE_URL/sms-parser/responses?page=0&limit=20"
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "type": "field",
      "value": "0",
      "msg": "Page must be a positive integer",
      "path": "page",
      "location": "query"
    }
  ]
}
```

**Status Code:** 400

#### 3.6 Geçersiz Limit
```bash
curl -H "X-SMS-Parser-API-Key: $SMS_PARSER_API_KEY" \
  "$BASE_URL/sms-parser/responses?page=1&limit=150"
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "type": "field",
      "value": "150",
      "msg": "Limit must be between 1 and 100",
      "path": "limit",
      "location": "query"
    }
  ]
}
```

**Status Code:** 400

## 4. Cleanup Endpoint'i

### ✅ Success Senaryoları

#### 4.1 30 Günlük Veri Temizleme
```bash
curl -X POST -H "X-SMS-Parser-API-Key: $SMS_PARSER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"days": 30}' \
  "$BASE_URL/sms-parser/responses/cleanup"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Cleaned up responses older than 30 days",
  "data": {
    "deletedCount": 1250
  }
}
```

#### 4.2 Tüm Verileri Temizleme
```bash
curl -X POST -H "X-SMS-Parser-API-Key: $SMS_PARSER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"days": 0}' \
  "$BASE_URL/sms-parser/responses/cleanup"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "All responses cleared successfully",
  "data": {
    "deletedCount": 1250
  }
}
```

#### 4.2 7 Günlük Veri Temizleme
```bash
curl -X POST -H "X-SMS-Parser-API-Key: $SMS_PARSER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"days": 7}' \
  "$BASE_URL/sms-parser/responses/cleanup"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Cleaned up responses older than 7 days",
  "data": {
    "deletedCount": 89
  }
}
```

#### 4.3 Varsayılan 30 Gün (Body Boş)
```bash
curl -X POST -H "X-SMS-Parser-API-Key: $SMS_PARSER_API_KEY" \
  -H "Content-Type: application/json" \
  "$BASE_URL/sms-parser/responses/cleanup"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Cleaned up responses older than 30 days",
  "data": {
    "deletedCount": 1250
  }
}
```

### ❌ Fail Senaryoları

#### 4.4 API Key Eksik
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"days": 30}' \
  "$BASE_URL/sms-parser/responses/cleanup"
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Invalid or missing SMS Parser API key"
}
```

**Status Code:** 401

#### 4.5 Geçersiz Gün Sayısı
```bash
curl -X POST -H "X-SMS-Parser-API-Key: $SMS_PARSER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"days": 400}' \
  "$BASE_URL/sms-parser/responses/cleanup"
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "type": "field",
      "value": "400",
      "msg": "Days must be between 0 and 365",
      "path": "days",
      "location": "body"
    }
  ]
}
```

**Status Code:** 400

#### 4.6 Negatif Gün Sayısı
```bash
curl -X POST -H "X-SMS-Parser-API-Key: $SMS_PARSER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"days": -5}' \
  "$BASE_URL/sms-parser/responses/cleanup"
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "type": "field",
      "value": -5,
      "msg": "Days must be between 0 and 365",
      "path": "days",
      "location": "body"
    }
  ]
}
```

**Status Code:** 400

## 5. Genel Test Senaryoları

### 5.1 Rate Limiting Test
```bash
# Hızlı ardışık istekler gönder
for i in {1..100}; do
  curl -H "X-SMS-Parser-API-Key: $SMS_PARSER_API_KEY" \
    "$BASE_URL/sms-parser/responses/stats" &
done
wait
```

### 5.2 Concurrent Request Test
```bash
# Paralel istekler gönder
curl -H "X-SMS-Parser-API-Key: $SMS_PARSER_API_KEY" \
  "$BASE_URL/sms-parser/responses/stats" &
curl -H "X-SMS-Parser-API-Key: $SMS_PARSER_API_KEY" \
  "$BASE_URL/sms-parser/responses/errors?days=7" &
curl -H "X-SMS-Parser-API-Key: $SMS_PARSER_API_KEY" \
  "$BASE_URL/sms-parser/responses?page=1&limit=10" &
wait
```

### 5.3 Edge Case Test
```bash
# Çok büyük sayılar
curl -H "X-SMS-Parser-API-Key: $SMS_PARSER_API_KEY" \
  "$BASE_URL/sms-parser/responses?page=999999&limit=999999"

# Çok uzun string'ler
curl -H "X-SMS-Parser-API-Key: $SMS_PARSER_API_KEY" \
  "$BASE_URL/sms-parser/responses?phoneNumber=%2B97612345678&startDate=2024-01-20T00:00:00.000Z&endDate=2024-12-31T23:59:59.999Z"
```

## 6. Performance Test Senaryoları

### 6.1 Response Time Test
```bash
# Response time'ı ölç
time curl -H "X-SMS-Parser-API-Key: $SMS_PARSER_API_KEY" \
  "$BASE_URL/sms-parser/responses/stats"
```

### 6.2 Memory Usage Test
```bash
# Büyük veri seti ile test
curl -H "X-SMS-Parser-API-Key: $SMS_PARSER_API_KEY" \
  "$BASE_URL/sms-parser/responses?limit=100&startDate=2020-01-01&endDate=2024-12-31"
```

## 7. Security Test Senaryoları

### 7.1 SQL Injection Test
```bash
# SQL injection denemeleri
curl -H "X-SMS-Parser-API-Key: $SMS_PARSER_API_KEY" \
  "$BASE_URL/sms-parser/responses?phoneNumber='; DROP TABLE responses; --"
```

### 7.2 XSS Test
```bash
# XSS denemeleri
curl -H "X-SMS-Parser-API-Key: $SMS_PARSER_API_KEY" \
  "$BASE_URL/sms-parser/responses?phoneNumber=<script>alert('xss')</script>"
```

### 7.3 NoSQL Injection Test
```bash
# NoSQL injection denemeleri
curl -H "X-SMS-Parser-API-Key: $SMS_PARSER_API_KEY" \
  "$BASE_URL/sms-parser/responses?phoneNumber[$ne]=null"
```

## 8. Test Sonuçları

### 8.1 Başarılı Testler
- ✅ API Key authentication çalışıyor
- ✅ Validation kuralları doğru çalışıyor
- ✅ Pagination doğru çalışıyor
- ✅ Filtreleme doğru çalışıyor
- ✅ Error handling doğru çalışıyor

### 8.2 Dikkat Edilmesi Gerekenler
- 🔒 API Key güvenliği
- 📊 Büyük veri setlerinde performans
- 🗑️ Cleanup işlemlerinde veri kaybı riski
- 📱 Rate limiting kuralları

### 8.3 Monitoring Gereksinimleri
- Response time izleme
- Error rate izleme
- API usage izleme
- Database performance izleme
