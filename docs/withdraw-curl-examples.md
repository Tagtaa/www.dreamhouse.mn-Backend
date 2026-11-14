# Withdraw API - cURL Examples

## Base URL
```
http://localhost:5000/api/admin/withdrawals
```

Production:
```
https://your-api-domain.com/api/admin/withdrawals
```

---

## 1. Get All Withdrawals

### Basic Request
```bash
curl -X GET "http://localhost:5000/api/admin/withdrawals?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### With Filters
```bash
curl -X GET "http://localhost:5000/api/admin/withdrawals?page=1&limit=20&status=pending&phone=+97699887766" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Filter by Status
```bash
curl -X GET "http://localhost:5000/api/admin/withdrawals?status=pending" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Filter by Phone
```bash
curl -X GET "http://localhost:5000/api/admin/withdrawals?phone=+97699887766" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Filter by Order ID
```bash
curl -X GET "http://localhost:5000/api/admin/withdrawals?orderId=ABC123" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 2. Get Withdrawal by ID

```bash
curl -X GET "http://localhost:5000/api/admin/withdrawals/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 3. Create Withdrawal

### Create with Phone Number
```bash
curl -X POST "http://localhost:5000/api/admin/withdrawals" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "phone": "+97699887766",
    "amount": 50000,
    "processedBy": "Admin User",
    "notes": "Manual withdrawal creation"
  }'
```

### Create with User ID
```bash
curl -X POST "http://localhost:5000/api/admin/withdrawals" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "userId": "507f1f77bcf86cd799439011",
    "amount": 50000,
    "processedBy": "Admin User",
    "notes": "Manual withdrawal creation"
  }'
```

**Note:** Either `phone` or `userId` must be provided. The amount will be deducted from the user's wallet immediately upon creation.

---

## 4. Update Withdrawal (PUT)

### Update Status Only
```bash
curl -X PUT "http://localhost:5000/api/admin/withdrawals/507f1f77bcf86cd799439011" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "status": "completed"
  }'
```

### Update Amount Only
```bash
curl -X PUT "http://localhost:5000/api/admin/withdrawals/507f1f77bcf86cd799439011" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "amount": 75000
  }'
```

### Update Notes Only
```bash
curl -X PUT "http://localhost:5000/api/admin/withdrawals/507f1f77bcf86cd799439011" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "notes": "Updated notes about this withdrawal"
  }'
```

### Update Phone Only
```bash
curl -X PUT "http://localhost:5000/api/admin/withdrawals/507f1f77bcf86cd799439011" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "phone": "+97699887766"
  }'
```

### Update ProcessedBy Only
```bash
curl -X PUT "http://localhost:5000/api/admin/withdrawals/507f1f77bcf86cd799439011" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "processedBy": "New Operator"
  }'
```

### Update Multiple Fields
```bash
curl -X PUT "http://localhost:5000/api/admin/withdrawals/507f1f77bcf86cd799439011" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "amount": 75000,
    "status": "completed",
    "notes": "Amount updated and approved",
    "processedBy": "Admin User"
  }'
```

---

## 5. Update Withdrawal Status (Alternative - Old Endpoint)

```bash
curl -X PUT "http://localhost:5000/api/admin/withdrawals/507f1f77bcf86cd799439011/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "status": "completed",
    "notes": "Status updated"
  }'
```

---

## 6. Delete Withdrawal

```bash
curl -X DELETE "http://localhost:5000/api/admin/withdrawals/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Note:** Only pending withdrawals can be deleted. When deleted, the amount will be refunded to the user's wallet.

---

## Common Scenarios

### Scenario 1: Create Withdrawal and Approve
```bash
# Step 1: Create withdrawal (amount deducted immediately)
curl -X POST "http://localhost:5000/api/admin/withdrawals" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "userId": "507f1f77bcf86cd799439011",
    "amount": 50000,
    "processedBy": "Admin User",
    "notes": "User withdrawal request"
  }'

# Step 2: Mark as completed
curl -X PUT "http://localhost:5000/api/admin/withdrawals/507f1f77bcf86cd799439011" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "status": "completed"
  }'
```

### Scenario 2: Cancel Pending Withdrawal
```bash
curl -X PUT "http://localhost:5000/api/admin/withdrawals/507f1f77bcf86cd799439011" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "status": "cancelled",
    "notes": "User requested cancellation"
  }'
```

**Note:** When status is changed to `cancelled` or `failed`, the amount will be refunded to the user's wallet.

### Scenario 3: Update Amount and Status in One Request
```bash
curl -X PUT "http://localhost:5000/api/admin/withdrawals/507f1f77bcf86cd799439011" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "amount": 75000,
    "status": "completed",
    "notes": "Amount corrected and approved"
  }'
```

### Scenario 4: Reject Withdrawal
```bash
curl -X PUT "http://localhost:5000/api/admin/withdrawals/507f1f77bcf86cd799439011" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "status": "failed",
    "notes": "Insufficient funds or invalid request"
  }'
```

---

## Response Examples

### Success Response - Create Withdrawal (201 Created)
```json
{
  "success": true,
  "message": "Withdrawal created successfully",
  "data": {
    "withdrawal": {
      "_id": "507f1f77bcf86cd799439011",
      "phone": "+97699887766",
      "orderId": "ABC123",
      "amount": 50000,
      "date": "2024-01-15T10:30:00.000Z",
      "processedBy": "Admin User",
      "status": "pending",
      "notes": "Manual withdrawal creation",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    "user": {
      "_id": "507f1f77bcf86cd799439012",
      "username": "john_doe",
      "phone": "+97699887766",
      "wallet": 45000
    }
  }
}
```

### Success Response - Get Withdrawal (200 OK)
```json
{
  "success": true,
  "data": {
    "withdrawal": {
      "_id": "507f1f77bcf86cd799439011",
      "phone": "+97699887766",
      "orderId": "ABC123",
      "amount": 50000,
      "date": "2024-01-15T10:30:00.000Z",
      "processedBy": "Admin User",
      "status": "completed",
      "notes": "Approved withdrawal",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    },
    "user": {
      "_id": "507f1f77bcf86cd799439012",
      "username": "john_doe",
      "phone": "+97699887766",
      "wallet": 45000
    }
  }
}
```

### Success Response - Update Withdrawal (200 OK)
```json
{
  "success": true,
  "message": "Withdrawal updated successfully",
  "data": {
    "withdrawal": {
      "_id": "507f1f77bcf86cd799439011",
      "phone": "+97699887766",
      "orderId": "ABC123",
      "amount": 75000,
      "date": "2024-01-15T10:30:00.000Z",
      "processedBy": "Admin User",
      "status": "completed",
      "notes": "Amount updated and approved",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    },
    "user": {
      "_id": "507f1f77bcf86cd799439012",
      "username": "john_doe",
      "phone": "+97699887766",
      "wallet": 25000
    }
  }
}
```

### Error Response (404 Not Found)
```json
{
  "success": false,
  "message": "Withdrawal not found"
}
```

### Error Response (400 Bad Request - Insufficient Balance)
```json
{
  "success": false,
  "message": "Insufficient wallet balance"
}
```

### Error Response (400 Bad Request - Invalid Status)
```json
{
  "success": false,
  "message": "Invalid status"
}
```

---

## Status Values

- `pending` - Default status, withdrawal created but not processed
- `processing` - Withdrawal is being processed
- `completed` - Withdrawal completed successfully
- `failed` - Withdrawal failed (amount refunded to wallet)
- `cancelled` - Withdrawal cancelled (amount refunded to wallet)

---

## Wallet Behavior

1. **On Create:** Amount is immediately deducted from user's wallet
2. **On Status Change to `failed` or `cancelled`:** Amount is refunded to user's wallet
3. **On Status Change from `failed`/`cancelled` to `completed`:** Amount is deducted again from user's wallet
4. **On Amount Update (if status is `completed`):** Wallet is adjusted based on the difference
5. **On Delete (only pending):** Amount is refunded to user's wallet

---

## Notes

1. Replace `YOUR_ADMIN_TOKEN` with your actual admin JWT token
2. Replace `507f1f77bcf86cd799439011` with actual withdrawal or user ID
3. Replace `localhost:5000` with your API URL
4. All fields in PUT request are optional
5. When creating a withdrawal, the amount is deducted from the user's wallet immediately
6. When status is changed to `failed` or `cancelled`, the amount is automatically refunded
7. Only pending withdrawals can be deleted
8. You can use either `phone` or `userId` when creating a withdrawal

