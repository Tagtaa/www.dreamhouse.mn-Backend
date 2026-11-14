# Material Category CRUD - cURL Examples

## Base URL
```
http://localhost:5000/api/materials
```

Production:
```
https://your-api-domain.com/api/materials
```

---

## Overview

Material Category CRUD operations. Categories can be created with or without ingredients. Ingredients are optional and can be added later.

**Important Notes:**
- `ingredients` field is **optional** - can be omitted, `null`, or empty array `[]`
- **When ingredients are provided, field pairs are required together:**
  - **Percentage type**: `percentValue` AND `priceFor100Percent` are **required together** (both must be provided)
  - **m3 type**: `m3Amount` AND `pricePerM3` are **required together** (both must be provided)
  - **m2 type**: `m2Amount` AND `pricePerM2` are **required together** (both must be provided)
- Percentage validation only runs when `ingredients` are provided, `ingredientType` is `percentage`, and no ingredient has `unit` `m3` or `m2`
- Images can be URLs or Base64 strings (starting with `data:image/...`)

---

## 1. CREATE - Create Material Category

### 1.1 Create Category WITHOUT Ingredients (Simplest)

```bash
curl -X POST "http://localhost:5000/api/materials/categories" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Brick Category",
    "parentCategory": 1,
    "images": ["https://example.com/image.jpg"]
  }'
```

**Request Body:**
```json
{
  "name": "Brick Category",
  "parentCategory": 1,
  "images": ["https://example.com/image.jpg"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Material category created successfully",
  "data": {
    "category": {
      "_id": "category_id",
      "name": "Brick Category",
      "parentCategory": {
        "_id": 1,
        "name": "Wall",
        "ingredientType": "percentage"
      },
      "images": ["https://example.com/image.jpg"],
      "isActive": true,
      "createdAt": "2025-12-06T18:00:00.000Z",
      "updatedAt": "2025-12-06T18:00:00.000Z"
    }
  }
}
```

### 1.2 Create Category with Base64 Image

```bash
curl -X POST "http://localhost:5000/api/materials/categories" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Brick Category",
    "parentCategory": 1,
    "images": ["data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAoADwDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigAooooAKKKKAP//Z"]
  }'
```

**Request Body:**
```json
{
  "name": "Brick Category",
  "parentCategory": 1,
  "images": ["data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAoADwDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigAooooAKKKKAP//Z"]
}
```

### 1.3 Create Category with Ingredients (Percentage Type)

```bash
curl -X POST "http://localhost:5000/api/materials/categories" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Standard Concrete",
    "parentCategory": 1,
    "images": ["https://example.com/image.jpg"],
    "ingredients": [
      {
        "name": "Cement",
        "percentValue": 30,
        "unit": "kg",
        "priceFor100Percent": 50000
      },
      {
        "name": "Sand",
        "percentValue": 40,
        "unit": "kg",
        "priceFor100Percent": 30000
      },
      {
        "name": "Gravel",
        "percentValue": 30,
        "unit": "kg",
        "priceFor100Percent": 20000
      }
    ]
  }'
```

**Request Body:**
```json
{
  "name": "Standard Concrete",
  "parentCategory": 1,
  "images": ["https://example.com/image.jpg"],
  "ingredients": [
    {
      "name": "Cement",
      "percentValue": 30,
      "unit": "kg",
      "priceFor100Percent": 50000
    },
    {
      "name": "Sand",
      "percentValue": 40,
      "unit": "kg",
      "priceFor100Percent": 30000
    },
    {
      "name": "Gravel",
      "percentValue": 30,
      "unit": "kg",
      "priceFor100Percent": 20000
    }
  ]
}
```

**Note:** 
- For percentage type, total `percentValue` must equal 100 (30 + 40 + 30 = 100) **only when ingredients are provided** and no ingredient has `unit` `m3` or `m2`.
- **Field pairs are required together**: `percentValue` AND `priceFor100Percent` must both be provided for percentage type ingredients.

### 1.4 Create Category with Ingredients (m3 Type)

```bash
curl -X POST "http://localhost:5000/api/materials/categories" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Insulation Material",
    "parentCategory": 2,
    "images": ["https://example.com/image.jpg"],
    "ingredients": [
      {
        "name": "Fiberglass",
        "m3Amount": 1.5,
        "unit": "m3",
        "pricePerM3": 150000
      },
      {
        "name": "Foam",
        "m3Amount": 2.0,
        "unit": "m3",
        "pricePerM3": 200000
      }
    ]
  }'
```

**Request Body:**
```json
{
  "name": "Insulation Material",
  "parentCategory": 2,
  "images": ["https://example.com/image.jpg"],
  "ingredients": [
    {
      "name": "Fiberglass",
      "m3Amount": 1.5,
      "unit": "m3",
      "pricePerM3": 150000
    },
    {
      "name": "Foam",
      "m3Amount": 2.0,
      "unit": "m3",
      "pricePerM3": 200000
    }
  ]
}
```

**Note:** 
- **Field pairs are required together**: `m3Amount` AND `pricePerM3` must both be provided for m3 type ingredients.
- No percentage validation is performed for m3 type.

### 1.5 Create Category with Ingredients (m2 Type)

```bash
curl -X POST "http://localhost:5000/api/materials/categories" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Roofing Material",
    "parentCategory": 3,
    "images": ["https://example.com/image.jpg"],
    "ingredients": [
      {
        "name": "Tiles",
        "m2Amount": 10,
        "unit": "m2",
        "pricePerM2": 50000
      },
      {
        "name": "Underlayment",
        "m2Amount": 5,
        "unit": "m2",
        "pricePerM2": 30000
      }
    ]
  }'
```

**Request Body:**
```json
{
  "name": "Roofing Material",
  "parentCategory": 3,
  "images": ["https://example.com/image.jpg"],
  "ingredients": [
    {
      "name": "Tiles",
      "m2Amount": 10,
      "unit": "m2",
      "pricePerM2": 50000
    },
    {
      "name": "Underlayment",
      "m2Amount": 5,
      "unit": "m2",
      "pricePerM2": 30000
    }
  ]
}
```

**Note:** 
- **Field pairs are required together**: `m2Amount` AND `pricePerM2` must both be provided for m2 type ingredients.
- No percentage validation is performed for m2 type.

### 1.6 Create Category with Empty Ingredients Array

```bash
curl -X POST "http://localhost:5000/api/materials/categories" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Empty Category",
    "parentCategory": 1,
    "images": ["https://example.com/image.jpg"],
    "ingredients": []
  }'
```

**Request Body:**
```json
{
  "name": "Empty Category",
  "parentCategory": 1,
  "images": ["https://example.com/image.jpg"],
  "ingredients": []
}
```

---

## 2. READ - Get Material Categories

### 2.1 Get All Categories

```bash
curl -X GET "http://localhost:5000/api/materials/categories" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "_id": "category_id_1",
        "name": "Brick Category",
        "parentCategory": {
          "_id": 1,
          "name": "Wall",
          "ingredientType": "percentage"
        },
        "images": ["https://example.com/image.jpg"],
        "isActive": true,
        "createdAt": "2025-12-06T18:00:00.000Z",
        "updatedAt": "2025-12-06T18:00:00.000Z"
      },
      {
        "_id": "category_id_2",
        "name": "Standard Concrete",
        "parentCategory": {
          "_id": 1,
          "name": "Wall",
          "ingredientType": "percentage"
        },
        "images": ["https://example.com/image2.jpg"],
        "isActive": true,
        "createdAt": "2025-12-06T18:01:00.000Z",
        "updatedAt": "2025-12-06T18:01:00.000Z"
      }
    ],
    "total": 2
  }
}
```

### 2.2 Get Category by ID

```bash
curl -X GET "http://localhost:5000/api/materials/categories/CATEGORY_ID" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "category": {
      "_id": "category_id",
      "name": "Brick Category",
      "parentCategory": {
        "_id": 1,
        "name": "Wall",
        "ingredientType": "percentage"
      },
      "images": ["https://example.com/image.jpg"],
      "isActive": true,
      "createdAt": "2025-12-06T18:00:00.000Z",
      "updatedAt": "2025-12-06T18:00:00.000Z"
    }
  }
}
```

### 2.3 Get Categories with Search

```bash
curl -X GET "http://localhost:5000/api/materials/categories?search=brick" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

### 2.4 Get Categories with Pagination

```bash
curl -X GET "http://localhost:5000/api/materials/categories?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

### 2.5 Get Categories by Parent Category

```bash
curl -X GET "http://localhost:5000/api/materials/categories?parentCategory=1" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

---

## 3. UPDATE - Update Material Category

### 3.1 Update Category Name and Images

```bash
curl -X PUT "http://localhost:5000/api/materials/categories/CATEGORY_ID" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Brick Category",
    "images": ["https://example.com/new-image.jpg"]
  }'
```

**Request Body:**
```json
{
  "name": "Updated Brick Category",
  "images": ["https://example.com/new-image.jpg"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Material category updated successfully",
  "data": {
    "category": {
      "_id": "category_id",
      "name": "Updated Brick Category",
      "parentCategory": {
        "_id": 1,
        "name": "Wall",
        "ingredientType": "percentage"
      },
      "images": ["https://example.com/new-image.jpg"],
      "isActive": true,
      "createdAt": "2025-12-06T18:00:00.000Z",
      "updatedAt": "2025-12-06T18:05:00.000Z"
    }
  }
}
```

### 3.2 Update Category with Base64 Image

```bash
curl -X PUT "http://localhost:5000/api/materials/categories/CATEGORY_ID" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Brick Category",
    "images": ["data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAoADwDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigAooooAKKKKAP//Z"]
  }'
```

**Request Body:**
```json
{
  "name": "Updated Brick Category",
  "images": ["data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAoADwDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigAooooAKKKKAP//Z"]
}
```

### 3.3 Update Category Parent Category

```bash
curl -X PUT "http://localhost:5000/api/materials/categories/CATEGORY_ID" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "parentCategory": 2
  }'
```

**Request Body:**
```json
{
  "parentCategory": 2
}
```

**Note:** When parent category changes, ingredients are automatically updated from the new category if the category has ingredients.

### 3.4 Update Category isActive Status

```bash
curl -X PUT "http://localhost:5000/api/materials/categories/CATEGORY_ID" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isActive": false
  }'
```

**Request Body:**
```json
{
  "isActive": false
}
```

---

## 4. DELETE - Delete Material Category

### 4.1 Delete Category

```bash
curl -X DELETE "http://localhost:5000/api/materials/categories/CATEGORY_ID" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "message": "Material category deleted successfully"
}
```

**Note:** Deleting a category will also delete all associated ingredients.

---

## 5. Error Responses

### 5.1 Category Name Already Exists

**Request:**
```json
{
  "name": "Existing Category",
  "parentCategory": 1,
  "images": ["https://example.com/image.jpg"]
}
```

**Response (400):**
```json
{
  "success": false,
  "message": "Category name already exists"
}
```

### 5.2 Parent Category Not Found

**Request:**
```json
{
  "name": "New Category",
  "parentCategory": 999,
  "images": ["https://example.com/image.jpg"]
}
```

**Response (404):**
```json
{
  "success": false,
  "message": "Parent category not found"
}
```

### 5.3 Invalid Percentage Total (Only when ingredients provided)

**Request:**
```json
{
  "name": "Invalid Category",
  "parentCategory": 1,
  "images": ["https://example.com/image.jpg"],
  "ingredients": [
    {
      "name": "Cement",
      "percentValue": 30,
      "unit": "kg",
      "priceFor100Percent": 50000
    },
    {
      "name": "Sand",
      "percentValue": 40,
      "unit": "kg",
      "priceFor100Percent": 30000
    }
  ]
}
```

**Response (400):**
```json
{
  "success": false,
  "message": "Total percentage must be 100. Current total: 70"
}
```

**Note:** This error only occurs when:
- `ingredients` are provided (not empty)
- `ingredientType` is `percentage`
- **No ingredient has `unit` `m3` or `m2`** (if any ingredient has m3/m2 unit, validation is skipped)
- Total `percentValue` does not equal 100

### 5.4 Category Not Found

**Request:**
```bash
curl -X GET "http://localhost:5000/api/materials/categories/INVALID_ID" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Response (404):**
```json
{
  "success": false,
  "message": "Material category not found"
}
```

---

## 6. Field Reference

### Required Fields
- `name` (string) - Category name (must be unique)
- `parentCategory` (number/ObjectId) - Parent category ID

### Optional Fields
- `images` (array of strings) - Image URLs or Base64 strings
- `ingredients` (array) - Array of ingredient objects (can be omitted, `null`, or `[]`)
- `isActive` (boolean) - Active status (default: `true`)

### Ingredient Fields (when ingredients provided)

**For percentage type (`ingredientType: "percentage"`):**
- `name` (string, required) - Ingredient name
- `unit` (string, optional) - Unit of measurement (should NOT be "m3" or "m2")
- `percentValue` (number, required) - Percentage value (0-100) - **Must be provided together with `priceFor100Percent`**
- `priceFor100Percent` (number, required) - Price for 100% - **Must be provided together with `percentValue`**

**For m3 type (`ingredientType: "m3"`):**
- `name` (string, required) - Ingredient name
- `unit` (string, optional) - Unit of measurement (typically "m3")
- `m3Amount` (number, required) - Amount in cubic meters - **Must be provided together with `pricePerM3`**
- `pricePerM3` (number, required) - Price per cubic meter - **Must be provided together with `m3Amount`**

**For m2 type (`ingredientType: "m2"`):**
- `name` (string, required) - Ingredient name
- `unit` (string, optional) - Unit of measurement (typically "m2")
- `m2Amount` (number, required) - Amount in square meters - **Must be provided together with `pricePerM2`**
- `pricePerM2` (number, required) - Price per square meter - **Must be provided together with `m2Amount`**

---

## 7. Quick Reference

### Create Category (Simplest - No Ingredients)
```json
{
  "name": "Category Name",
  "parentCategory": 1,
  "images": ["https://example.com/image.jpg"]
}
```

### Create Category with Percentage Type Ingredients
```json
{
  "name": "Category Name",
  "parentCategory": 1,
  "images": ["https://example.com/image.jpg"],
  "ingredients": [
    {
      "name": "Cement",
      "percentValue": 100,
      "unit": "kg",
      "priceFor100Percent": 50000
    }
  ]
}
```

**Note:** `percentValue` and `priceFor100Percent` must be provided **together**.

### Create Category with m3 Type Ingredients
```json
{
  "name": "Category Name",
  "parentCategory": 2,
  "images": ["https://example.com/image.jpg"],
  "ingredients": [
    {
      "name": "Fiberglass",
      "m3Amount": 1.5,
      "unit": "m3",
      "pricePerM3": 150000
    }
  ]
}
```

**Note:** `m3Amount` and `pricePerM3` must be provided **together**.

### Create Category with m2 Type Ingredients
```json
{
  "name": "Category Name",
  "parentCategory": 3,
  "images": ["https://example.com/image.jpg"],
  "ingredients": [
    {
      "name": "Tiles",
      "m2Amount": 10,
      "unit": "m2",
      "pricePerM2": 50000
    }
  ]
}
```

**Note:** `m2Amount` and `pricePerM2` must be provided **together**.

### Update Category
```json
{
  "name": "Updated Name",
  "images": ["https://example.com/new-image.jpg"]
}
```

### Delete Category
```bash
DELETE /api/materials/categories/CATEGORY_ID
```

---

## 8. Notes

1. **Ingredients are optional**: You can create a category without ingredients and add them later using the ingredient endpoints.

2. **Field pairs are required together**: When ingredients are provided, field pairs must be provided together:
   - **Percentage type**: `percentValue` AND `priceFor100Percent` must both be provided
   - **m3 type**: `m3Amount` AND `pricePerM3` must both be provided
   - **m2 type**: `m2Amount` AND `pricePerM2` must both be provided

3. **Percentage validation**: Only runs when:
   - `ingredients` are provided (not empty array)
   - `ingredientType` is `percentage`
   - **No ingredient has `unit` `m3` or `m2`** (if any ingredient has m3/m2 unit, validation is skipped)
   - If these conditions are not met, validation is skipped

4. **Images**: Can be provided as:
   - URLs: `["https://example.com/image.jpg"]`
   - Base64: `["data:image/jpeg;base64,..."]`
   - Base64 images are automatically uploaded to Firebase and converted to URLs

5. **Parent Category**: Must exist before creating a category. Use the parent category endpoints to create parent categories first.

