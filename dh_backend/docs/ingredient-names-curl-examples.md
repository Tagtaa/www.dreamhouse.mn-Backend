# Ingredient Names API - cURL Examples

## Base URL
```
http://localhost:5000/api/materials/ingredient-names
```

Production:
```
https://your-api-domain.com/api/materials/ingredient-names
```

---

## Overview

Simple CRUD endpoints for managing ingredient names. Each ingredient name only has a `name` field and an optional `isActive` status.

---

## 1. Get All Ingredient Names

### Basic Request
```bash
curl -X GET "http://localhost:5000/api/materials/ingredient-names" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### With Search Query
```bash
curl -X GET "http://localhost:5000/api/materials/ingredient-names?q=cement" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Include Inactive
```bash
curl -X GET "http://localhost:5000/api/materials/ingredient-names?includeInactive=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ingredients": [
      {
        "_id": "ingredient_id_1",
        "name": "Cement",
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      },
      {
        "_id": "ingredient_id_2",
        "name": "Sand",
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "query": null,
    "total": 2
  }
}
```

---

## 2. Get Ingredient Name by ID

```bash
curl -X GET "http://localhost:5000/api/materials/ingredient-names/INGREDIENT_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ingredient": {
      "_id": "ingredient_id",
      "name": "Cement",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

## 3. Create Ingredient Name

### Basic Request
```bash
curl -X POST "http://localhost:5000/api/materials/ingredient-names" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cement"
  }'
```

### With isActive
```bash
curl -X POST "http://localhost:5000/api/materials/ingredient-names" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sand",
    "isActive": true
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Ingredient name created successfully",
  "data": {
    "ingredient": {
      "_id": "ingredient_id",
      "name": "Cement",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

## 4. Update Ingredient Name

### Update Name
```bash
curl -X PUT "http://localhost:5000/api/materials/ingredient-names/INGREDIENT_ID" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Cement"
  }'
```

### Update isActive
```bash
curl -X PUT "http://localhost:5000/api/materials/ingredient-names/INGREDIENT_ID" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isActive": false
  }'
```

### Update Both
```bash
curl -X PUT "http://localhost:5000/api/materials/ingredient-names/INGREDIENT_ID" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Cement",
    "isActive": true
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Ingredient name updated successfully",
  "data": {
    "ingredient": {
      "_id": "ingredient_id",
      "name": "Premium Cement",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

## 5. Delete Ingredient Name

```bash
curl -X DELETE "http://localhost:5000/api/materials/ingredient-names/INGREDIENT_ID" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "Ingredient name deleted successfully",
  "data": {
    "deletedIngredient": "Cement"
  }
}
```

---

## 6. Error Scenarios

### 6.1 Duplicate Name
```bash
curl -X POST "http://localhost:5000/api/materials/ingredient-names" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cement"
  }'
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Ingredient name already exists"
}
```

### 6.2 Missing Name
```bash
curl -X POST "http://localhost:5000/api/materials/ingredient-names" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Name is required"
}
```

### 6.3 Not Found
```bash
curl -X GET "http://localhost:5000/api/materials/ingredient-names/INVALID_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Ingredient name not found"
}
```

---

## 7. Complete Workflow Example

### Step 1: Create Multiple Ingredient Names
```bash
# Create Cement
curl -X POST "http://localhost:5000/api/materials/ingredient-names" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Cement"}'

# Create Sand
curl -X POST "http://localhost:5000/api/materials/ingredient-names" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Sand"}'

# Create Gravel
curl -X POST "http://localhost:5000/api/materials/ingredient-names" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Gravel"}'
```

### Step 2: Get All Ingredient Names
```bash
curl -X GET "http://localhost:5000/api/materials/ingredient-names" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Step 3: Search Ingredient Names
```bash
curl -X GET "http://localhost:5000/api/materials/ingredient-names?q=cement" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Step 4: Update an Ingredient Name
```bash
curl -X PUT "http://localhost:5000/api/materials/ingredient-names/INGREDIENT_ID" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Premium Cement"}'
```

### Step 5: Deactivate an Ingredient Name
```bash
curl -X PUT "http://localhost:5000/api/materials/ingredient-names/INGREDIENT_ID" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isActive": false}'
```

### Step 6: Delete an Ingredient Name
```bash
curl -X DELETE "http://localhost:5000/api/materials/ingredient-names/INGREDIENT_ID" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## Notes

1. **Simple Structure**: Each ingredient name only has a `name` field and optional `isActive` status.

2. **Unique Names**: Ingredient names must be unique. Duplicate names will return an error.

3. **Search Functionality**: You can search ingredient names by using the `q` query parameter.

4. **Active Filtering**: By default, only active ingredients are returned. Use `includeInactive=true` to get all ingredients.

5. **Admin Only**: Create, Update, and Delete operations require admin privileges.

6. **Private Access**: Get operations require authentication (any logged-in user).

7. **Case Insensitive Search**: The search query is case-insensitive.

