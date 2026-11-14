# HTTP Status Codes Usage Guide

This documentation explains the correct usage of HTTP status codes in the DreamHouse Backend API.

## General Rules

- **404 (Not Found)**: Should only be used when endpoint is not found
- **400 (Bad Request)**: When data sent by client is invalid
- **401 (Unauthorized)**: When authentication is required
- **403 (Forbidden)**: When there is no permission
- **409 (Conflict)**: When there is a data conflict
- **422 (Unprocessable Entity)**: When there is a validation error

## Usage by Controller

### smsParserController.js ✅
- **400**: Invalid/expired OTP code, user not found
- **404**: Transaction not found (correct usage)

### authController.js ✅
- **400**: User not found during password reset request
- **404**: User not found during password reset (correct usage)

### userController.js ✅
- **401**: Authenticated user not found (authentication error)

### paymentController.js ✅
- **401**: Authenticated user not found (authentication error)

### materialController.js ✅
- **404**: Material not found (correct usage)

### adminController.js ✅
- **404**: User not found by admin (correct usage)

### calculationController.js ✅
- **404**: Calculation not found (correct usage)

### ideaController.js ✅
- **404**: Idea not found (correct usage)

## Example Usage

### ❌ Incorrect Usage
```javascript
// Using 404 when user is not found
if (!user) {
  return res.status(404).json({
    success: false,
    message: 'User not found'
  });
}
```

### ✅ Correct Usage
```javascript
// Using 401 when authenticated user is not found
if (!user) {
  return res.status(401).json({
    success: false,
    message: 'User not found'
  });
}

// Using 404 when resource is not found
if (!material) {
  return res.status(404).json({
    success: false,
    message: 'Material not found'
  });
}

// Using 400 when there is a validation error
if (!phoneNumber || !otpCode) {
  return res.status(400).json({
    success: false,
    message: 'Missing required fields'
  });
}
```

## Summary

All HTTP status codes in controllers have been fixed:
- **Business logic errors**: 400 (Bad Request)
- **Authentication errors**: 401 (Unauthorized)
- **Resource not found**: 404 (Not Found)
- **No permission**: 403 (Forbidden)
- **Rate limiting**: 429 (Too Many Requests)
- **Server errors**: 500 (Internal Server Error)
