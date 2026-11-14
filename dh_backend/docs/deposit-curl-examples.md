# Deposit API - cURL Examples

## Base URL
```
http://localhost:5000/api/admin/deposits
```

Production:
```
https://your-api-domain.com/api/admin/deposits
```

---

## 1. Get All Deposits

### Basic Request
```bash
curl -X GET "http://localhost:5000/api/admin/deposits?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### With Filters
```bash
curl -X GET "http://localhost:5000/api/admin/deposits?page=1&limit=20&status=wrong&phone=+97699887766" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Filter by Status
```bash
curl -X GET "http://localhost:5000/api/admin/deposits?status=wrong" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Filter by Phone
```bash
curl -X GET "http://localhost:5000/api/admin/deposits?phone=+97699887766" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Filter by Order ID
```bash
curl -X GET "http://localhost:5000/api/admin/deposits?orderId=ABC123" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 2. Get Deposit by ID

```bash
curl -X GET "http://localhost:5000/api/admin/deposits/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 3. Create Deposit

```bash
curl -X POST "http://localhost:5000/api/admin/deposits" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "phone": "+97699887766",
    "amount": 15000,
    "processedBy": "Admin User",
    "notes": "Manual deposit creation",
    "transactionDetail": "a99887766"
  }'
```

---

## 4. Update Deposit (PUT)

### Update Transaction Detail Only
```bash
curl -X PUT "http://localhost:5000/api/admin/deposits/507f1f77bcf86cd799439011" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "transactionDetail": "99887766"
  }'
```

### Update Status Only
```bash
curl -X PUT "http://localhost:5000/api/admin/deposits/507f1f77bcf86cd799439011" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "status": "confirmed"
  }'
```

### Update Transaction Detail and Status Together
```bash
curl -X PUT "http://localhost:5000/api/admin/deposits/507f1f77bcf86cd799439011" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "transactionDetail": "99887766",
    "status": "confirmed"
  }'
```

### Update All Fields
```bash
curl -X PUT "http://localhost:5000/api/admin/deposits/507f1f77bcf86cd799439011" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "phone": "+97699887766",
    "notes": "Transaction detail düzenlendi ve onaylandı",
    "status": "confirmed",
    "transactionDetail": "99887766"
  }'
```

### Update Notes Only
```bash
curl -X PUT "http://localhost:5000/api/admin/deposits/507f1f77bcf86cd799439011" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "notes": "Updated notes about this deposit"
  }'
```

### Update Phone Only
```bash
curl -X PUT "http://localhost:5000/api/admin/deposits/507f1f77bcf86cd799439011" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "phone": "+97699887766"
  }'
```

---

## 5. Update Deposit Status (Alternative - Old Endpoint)

```bash
curl -X PUT "http://localhost:5000/api/admin/deposits/507f1f77bcf86cd799439011/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "status": "confirmed",
    "notes": "Status updated"
  }'
```

---

## 6. Delete Deposit

```bash
curl -X DELETE "http://localhost:5000/api/admin/deposits/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## Common Scenarios

### Scenario 1: Edit Transaction Detail and Approve
```bash
# Step 1: Edit transaction detail
curl -X PUT "http://localhost:5000/api/admin/deposits/507f1f77bcf86cd799439011" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "transactionDetail": "99887766"
  }'

# Step 2: Approve deposit
curl -X PUT "http://localhost:5000/api/admin/deposits/507f1f77bcf86cd799439011" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "status": "confirmed"
  }'
```

### Scenario 2: Edit and Approve in One Request
```bash
curl -X PUT "http://localhost:5000/api/admin/deposits/507f1f77bcf86cd799439011" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "transactionDetail": "99887766",
    "status": "confirmed",
    "notes": "Transaction detail corrected and approved"
  }'
```

### Scenario 3: Reject Deposit
```bash
curl -X PUT "http://localhost:5000/api/admin/deposits/507f1f77bcf86cd799439011" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "status": "rejected",
    "notes": "Invalid transaction detail"
  }'
```

---

## Response Examples

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Deposit updated successfully",
  "data": {
    "deposit": {
      "_id": "507f1f77bcf86cd799439011",
      "phone": "+97699887766",
      "orderId": "ABC123",
      "amount": 15000,
      "date": "2024-01-15T10:30:00.000Z",
      "processedBy": "SMS Parser",
      "status": "confirmed",
      "notes": "Transaction detail corrected",
      "transactionDetail": "99887766",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  }
}
```

### Error Response (404 Not Found)
```json
{
  "success": false,
  "message": "Deposit not found"
}
```

### Error Response (400 Bad Request)
```json
{
  "success": false,
  "message": "Invalid deposit status"
}
```

---

## Status Values

- `wrong` - Default status, waiting for admin review
- `confirmed` - Approved, money added to wallet
- `rejected` - Rejected by admin

---

## Notes

1. Replace `YOUR_ADMIN_TOKEN` with your actual admin JWT token
2. Replace `507f1f77bcf86cd799439011` with actual deposit ID
3. Replace `localhost:5000` with your API URL
4. All fields in PUT request are optional
5. When status is changed to `confirmed`, money is automatically added to user's wallet
6. When status is changed from `confirmed` to another status, money is removed from wallet

