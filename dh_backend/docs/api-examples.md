# Dream House API Usage Examples

This document provides comprehensive examples of how to use the Dream House API.

## Base URL
```
http://localhost:3000/api
```

## Authentication

The API uses JWT-based authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## 1. Authentication Flow

### 1.1 Send Verification Code
```bash
curl -X POST http://localhost:3000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+97612345678"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Verification code sent successfully",
  "expiresIn": 5
}
```

### 1.2 Verify Code
```bash
curl -X POST http://localhost:3000/api/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+97612345678",
    "code": "1234"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Phone number verified successfully"
}
```

### 1.3 Sign Up
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+97612345678",
    "username": "John Builder",
    "password": "1234"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "65f1234567890abcd1234567",
      "phone": "+97612345678",
      "username": "John Builder",
      "membership": {
        "type": "free"
      },
      "wallet": 0,
      "isVerified": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 1.4 Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+97612345678",
    "password": "1234"
  }'
```

## 2. User Management

### 2.1 Get User Profile
```bash
curl -X GET http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer <your-token>"
```

### 2.2 Update Profile
```bash
curl -X PUT http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "John The Builder"
  }'
```

### 2.3 Update Email
```bash
curl -X PUT http://localhost:3000/api/user/email \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Email updated successfully",
  "data": {
    "email": "user@example.com"
  }
}
```

### 2.4 Get Wallet Information
```bash
curl -X GET http://localhost:3000/api/user/wallet \
  -H "Authorization: Bearer <your-token>"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "wallet": {
      "balance": 50000,
      "currency": "MNT"
    }
  }
}
```

### 2.4 Get Membership Info
```bash
curl -X GET http://localhost:3000/api/user/membership \
  -H "Authorization: Bearer <your-token>"
```

## 3. Materials

### 3.1 Get Materials List
```bash
curl -X GET "http://localhost:3000/api/materials?page=1&limit=10&category=wall"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "materials": [
      {
        "_id": "65f1234567890abcd1234567",
        "name": "Standard Red Brick",
        "description": "High-quality red clay bricks for wall construction",
        "category": "wall",
        "subcategory": "brick",
        "imageUrl": "https://via.placeholder.com/300x200",
        "price": {
          "amount": 450,
          "unit": "piece",
          "currency": "MNT"
        },
        "isPremium": false,
        "viewCount": 245,
        "popularity": 150
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

### 3.2 Search Materials
```bash
curl -X GET "http://localhost:3000/api/materials/search?q=brick&category=wall&minPrice=400&maxPrice=500"
```

### 3.3 Get Material by ID
```bash
curl -X GET http://localhost:3000/api/materials/65f1234567890abcd1234567
```

### 3.4 Get Material Categories
```bash
curl -X GET http://localhost:3000/api/materials/categories
```

## 4. Ideas

### 4.1 Get Ideas List
```bash
curl -X GET "http://localhost:3000/api/ideas?page=1&limit=10&category=small_house"
```

### 4.2 Get Featured Ideas
```bash
curl -X GET http://localhost:3000/api/ideas/featured
```

### 4.3 Search Ideas
```bash
curl -X GET "http://localhost:3000/api/ideas/search?q=modern&difficulty=intermediate"
```

### 4.4 Get Idea by ID
```bash
curl -X GET http://localhost:3000/api/ideas/65f1234567890abcd1234567
```

### 4.5 Purchase Premium Idea
```bash
curl -X POST http://localhost:3000/api/ideas/65f1234567890abcd1234567/purchase \
  -H "Authorization: Bearer <your-token>"
```

**Response:**
```json
{
  "success": true,
  "message": "Idea purchased successfully",
  "data": {
    "idea": {
      "_id": "65f1234567890abcd1234567",
      "title": "Traditional Mongolian House Construction",
      "isPremium": true,
      "purchasePrice": 15000
    },
    "remainingBalance": 35000
  }
}
```

## 5. Calculations

### 5.1 Calculate Wall Materials
```bash
curl -X POST http://localhost:3000/api/calculations/wall \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "wall",
    "inputs": {
      "length": 10,
      "width": 8,
      "height": 3,
      "thickness": 0.25,
      "materialType": "brick",
      "windows": [
        {
          "width": 1.5,
          "height": 1.2,
          "count": 3
        }
      ],
      "doors": [
        {
          "width": 0.8,
          "height": 2,
          "count": 2
        }
      ],
      "wastePercentage": 10
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Wall calculation completed",
  "data": {
    "calculation": {
      "_id": "65f1234567890abcd1234567",
      "type": "wall",
      "inputs": {
        "length": 10,
        "width": 8,
        "height": 3,
        "materialType": "brick"
      },
      "results": {
        "area": 98.5,
        "volume": 24.6,
        "perimeter": 36,
        "materials": [
          {
            "materialId": "65f1234567890abcd1234567",
            "quantity": 5418,
            "unit": "piece",
            "unitPrice": 450,
            "totalPrice": 2438100
          }
        ],
        "totalMaterialCost": 2438100,
        "estimatedLaborCost": 731430,
        "totalCost": 3169530,
        "openings": {
          "windows": { "area": 5.4, "count": 3 },
          "doors": { "area": 3.2, "count": 2 }
        }
      },
      "createdAt": "2024-03-15T10:30:00.000Z"
    }
  }
}
```

### 5.2 Calculate Roof Materials
```bash
curl -X POST http://localhost:3000/api/calculations/roof \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "roof",
    "inputs": {
      "length": 12,
      "width": 8,
      "shape": "triangle",
      "materialType": "metal_sheet",
      "wastePercentage": 15
    }
  }'
```

### 5.3 Get Calculation History
```bash
curl -X GET "http://localhost:3000/api/calculations/history?page=1&limit=10&type=wall" \
  -H "Authorization: Bearer <your-token>"
```

### 5.4 Get Calculation by ID
```bash
curl -X GET http://localhost:3000/api/calculations/65f1234567890abcd1234567 \
  -H "Authorization: Bearer <your-token>"
```

### 5.5 Update Calculation
```bash
curl -X PUT http://localhost:3000/api/calculations/65f1234567890abcd1234567 \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Main House Wall - Updated",
    "notes": "Added extra windows",
    "projectName": "Dream House Project",
    "tags": ["main-house", "walls", "phase-1"]
  }'
```

### 5.6 Bookmark Calculation
```bash
curl -X POST http://localhost:3000/api/calculations/65f1234567890abcd1234567/bookmark \
  -H "Authorization: Bearer <your-token>"
```

### 5.7 Share Calculation
```bash
curl -X POST http://localhost:3000/api/calculations/65f1234567890abcd1234567/share \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userPhone": "+97687654321",
    "permission": "view"
  }'
```

## 6. Payments

### 6.1 Get Membership Plans
```bash
curl -X GET http://localhost:3000/api/payments/membership-plans
```

**Response:**
```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "id": "1_month",
        "name": "1 Month Premium",
        "duration": 30,
        "price": 15000,
        "currency": "MNT",
        "features": [
          "Access to all premium materials",
          "Unlimited calculations",
          "Premium idea content",
          "Priority support"
        ],
        "popular": false
      },
      {
        "id": "3_months",
        "name": "3 Months Premium",
        "duration": 90,
        "price": 40000,
        "currency": "MNT",
        "originalPrice": 45000,
        "discount": "11% OFF",
        "popular": true
      }
    ]
  }
}
```

### 6.2 Charge Wallet
```bash
curl -X POST http://localhost:3000/api/payments/charge-wallet \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50000,
    "paymentMethod": "bank_transfer"
  }'
```

### 6.3 Purchase Membership
```bash
curl -X POST http://localhost:3000/api/payments/purchase-membership \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "3_months",
    "paymentMethod": "wallet"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Membership purchased successfully",
  "data": {
    "transactionId": "membership_1710504600_abc123def",
    "plan": "3_months",
    "price": 40000,
    "expiresAt": "2024-06-15T10:30:00.000Z",
    "remainingBalance": 10000,
    "paymentMethod": "wallet"
  }
}
```

## 7. Admin Endpoints

### 7.1 Get Dashboard Analytics
```bash
curl -X GET http://localhost:3000/api/admin/dashboard \
  -H "Authorization: Bearer <admin-token>"
```

### 7.2 Get Users List
```bash
curl -X GET "http://localhost:3000/api/admin/users?page=1&limit=20&search=john" \
  -H "Authorization: Bearer <admin-token>"
```

### 7.3 Create Material
```bash
curl -X POST http://localhost:3000/api/admin/materials \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Concrete Block",
    "description": "High-strength concrete blocks for heavy construction",
    "category": "wall",
    "subcategory": "concrete_block",
    "price": {
      "amount": 1200,
      "unit": "piece",
      "currency": "MNT"
    },
    "specifications": {
      "dimensions": {
        "length": 40,
        "width": 20,
        "height": 20,
        "unit": "cm"
      },
      "weight": {
        "value": 18,
        "unit": "kg"
      },
      "material": "Concrete",
      "color": "Grey"
    },
    "isPremium": false,
    "tags": ["concrete", "block", "heavy-duty"]
  }'
```

### 7.4 Update User Status
```bash
curl -X PUT http://localhost:3000/api/admin/users/65f1234567890abcd1234567/status \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "isActive": false
  }'
```

## 8. Error Handling

### Common Error Responses

**Validation Error:**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "type": "field",
      "value": "+976123",
      "msg": "Phone number must be in Mongolia format (+976XXXXXXXX)",
      "path": "phone",
      "location": "body"
    }
  ]
}
```

**Authentication Error:**
```json
{
  "success": false,
  "message": "Invalid token"
}
```

**Premium Required:**
```json
{
  "success": false,
  "message": "Premium membership required to access this material",
  "code": "PREMIUM_REQUIRED"
}
```

**Not Found:**
```json
{
  "success": false,
  "message": "Material not found"
}
```

**Server Error:**
```json
{
  "success": false,
  "message": "Internal server error"
}
```

## 9. Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## 10. Rate Limiting

The API implements rate limiting:
- **Window**: 15 minutes
- **Max Requests**: 100 requests per IP per window
- **Headers**: 
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset time

## 11. Pagination

Most list endpoints support pagination:

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

**Response Format:**
```json
{
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

## 12. Search and Filtering

**Materials:**
- `category` - Filter by category
- `subcategory` - Filter by subcategory
- `isPremium` - Filter by premium status
- `minPrice`, `maxPrice` - Price range
- `q` - Search query

**Ideas:**
- `category` - Filter by category
- `difficulty` - Filter by difficulty
- `isPremium` - Filter by premium status
- `minCost`, `maxCost` - Cost range
- `q` - Search query

**Example:**
```bash
curl -X GET "http://localhost:3000/api/materials?category=wall&isPremium=false&minPrice=400&maxPrice=1000&q=brick"
```