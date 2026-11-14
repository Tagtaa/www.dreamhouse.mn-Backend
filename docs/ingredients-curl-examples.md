# Ingredients API - cURL Examples

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

Ingredients are now category-based instead of calculation-type-based. Each material category has its own ingredients, and the ingredient pricing depends on the parent category's `ingredientType`:
- `percentage`: Ingredients have `requiredPercent` and `priceFor100Percent`
- `m3`: Ingredients have `pricePerM3`
- `m2`: Ingredients have `pricePerM2`

When creating a material, ingredients are automatically loaded from the selected category. For percentage type, total percentage must equal 100 **only when ingredients are provided**. If no ingredients are provided or ingredients array is empty, validation is skipped.

---

## 1. Parent Category Operations

### 1.1 Create Parent Category with ingredientType

```bash
curl -X POST "http://localhost:5000/api/materials/parent-categories" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Concrete",
    "ingredientType": "percentage"
  }'
```

**ingredientType options:**
- `percentage` - For percentage-based ingredients
- `m3` - For cubic meter based ingredients
- `m2` - For square meter based ingredients

**Response:**
```json
{
  "success": true,
  "message": "Parent category created successfully",
  "data": {
    "parentCategory": {
      "_id": 1,
      "name": "Concrete",
      "ingredientType": "percentage",
      "isActive": true
    }
  }
}
```

---

## 2. Material Category Operations

### 2.1 Create Material Category with Ingredients (Percentage Type)

**With URL Images:**
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
        "requiredPercent": 30,
        "unit": "kg",
        "priceFor100Percent": 50000
      },
      {
        "name": "Sand",
        "requiredPercent": 40,
        "unit": "kg",
        "priceFor100Percent": 30000
      },
      {
        "name": "Gravel",
        "requiredPercent": 30,
        "unit": "kg",
        "priceFor100Percent": 20000
      }
    ]
  }'
```

**With Base64 Images:**
```bash
curl -X POST "http://localhost:5000/api/materials/categories" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Standard Concrete",
    "parentCategory": 1,
    "images": [
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAoADwDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigAooooAKKKKAP//Z"
    ],
    "ingredients": [
      {
        "name": "Cement",
        "requiredPercent": 30,
        "unit": "kg",
        "priceFor100Percent": 50000
      },
      {
        "name": "Sand",
        "requiredPercent": 40,
        "unit": "kg",
        "priceFor100Percent": 30000
      },
      {
        "name": "Gravel",
        "requiredPercent": 30,
        "unit": "kg",
        "priceFor100Percent": 20000
      }
    ]
  }'
```

**Note:** 
- **Ingredients are optional**: You can create a category without ingredients. The `ingredients` field can be omitted, `null`, or an empty array `[]`.
- **Percentage validation**: Total percentage must equal 100 (30 + 40 + 30 = 100) **only when ingredients are provided** and ingredientType is `percentage`. For `m3` or `m2` types, percentage validation is not performed.
- **Field requirements**: `requiredPercent` and `priceFor100Percent` are **optional** for percentage type. `pricePerM3` is **optional** for m3 type. `pricePerM2` is **optional** for m2 type.
- Images can be provided as URLs or Base64 strings (starting with `data:image/...`)
- Base64 images are automatically uploaded to Firebase and converted to URLs

**Response:**
```json
{
  "success": true,
  "message": "Material category created successfully",
  "data": {
    "category": {
      "_id": "category_id",
      "name": "Standard Concrete",
      "parentCategory": {
        "_id": 1,
        "name": "Concrete",
        "ingredientType": "percentage"
      }
    }
  }
}
```

### 2.2 Create Material Category WITHOUT Ingredients (Optional)

```bash
curl -X POST "http://localhost:5000/api/materials/categories" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Empty Category",
    "parentCategory": 1,
    "images": ["https://example.com/image.jpg"]
  }'
```

**Note:** 
- Ingredients field can be omitted, `null`, or empty array `[]`
- No percentage validation is performed when ingredients are not provided
- Ingredients can be added later using the ingredient endpoints

### 2.3 Create Material Category with Ingredients (m3 Type)

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
        "unit": "m3",
        "pricePerM3": 150000
      },
      {
        "name": "Foam",
        "unit": "m3",
        "pricePerM3": 200000
      }
    ]
  }'
```

### 2.4 Create Material Category with Ingredients (m2 Type)

```bash
curl -X POST "http://localhost:5000/api/materials/categories" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Flooring Material",
    "parentCategory": 3,
    "images": ["https://example.com/image.jpg"],
    "ingredients": [
      {
        "name": "Tile",
        "unit": "m2",
        "pricePerM2": 50000
      },
      {
        "name": "Adhesive",
        "unit": "m2",
        "pricePerM2": 10000
      }
    ]
  }'
```

---

## 3. Ingredient Operations

### 3.1 Get Ingredients for a Category

```bash
curl -X GET "http://localhost:5000/api/materials/categories/CATEGORY_ID/ingredients" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**With Search Query:**
```bash
curl -X GET "http://localhost:5000/api/materials/categories/CATEGORY_ID/ingredients?q=cement" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (Percentage Type):**
```json
{
  "success": true,
  "data": {
    "ingredients": [
      {
        "id": "ingredient_id_1",
        "materialCategory": "category_id",
        "name": "Cement",
        "requiredPercent": 30,
        "unit": "kg",
        "priceFor100Percent": 50000,
        "isActive": true,
        "sortOrder": 0
      },
      {
        "id": "ingredient_id_2",
        "materialCategory": "category_id",
        "name": "Sand",
        "requiredPercent": 40,
        "unit": "kg",
        "priceFor100Percent": 30000,
        "isActive": true,
        "sortOrder": 1
      }
    ],
    "categoryId": "category_id",
    "ingredientType": "percentage",
    "query": null,
    "total": 2
  }
}
```

**Response (m3 Type):**
```json
{
  "success": true,
  "data": {
    "ingredients": [
      {
        "id": "ingredient_id_1",
        "materialCategory": "category_id",
        "name": "Fiberglass",
        "unit": "m3",
        "pricePerM3": 150000,
        "isActive": true,
        "sortOrder": 0
      }
    ],
    "categoryId": "category_id",
    "ingredientType": "m3",
    "query": null,
    "total": 1
  }
}
```

### 3.2 Add Ingredient to Category (Percentage Type)

```bash
curl -X POST "http://localhost:5000/api/materials/categories/CATEGORY_ID/ingredients" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Water",
    "requiredPercent": 20,
    "unit": "L",
    "priceFor100Percent": 5000,
    "sortOrder": 3
  }'
```

### 3.3 Add Ingredient to Category (m3 Type)

```bash
curl -X POST "http://localhost:5000/api/materials/categories/CATEGORY_ID/ingredients" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rockwool",
    "unit": "m3",
    "pricePerM3": 180000,
    "sortOrder": 2
  }'
```

### 3.4 Add Ingredient to Category (m2 Type)

```bash
curl -X POST "http://localhost:5000/api/materials/categories/CATEGORY_ID/ingredients" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Grout",
    "unit": "m2",
    "pricePerM2": 8000,
    "sortOrder": 2
  }'
```

### 3.5 Update Ingredient by ID

```bash
curl -X PUT "http://localhost:5000/api/materials/categories/CATEGORY_ID/ingredients/INGREDIENT_ID" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Cement",
    "requiredPercent": 35,
    "priceFor100Percent": 60000
  }'
```

### 3.6 Update Ingredient by Name

```bash
curl -X PUT "http://localhost:5000/api/materials/categories/CATEGORY_ID/ingredients" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cement",
    "requiredPercent": 35,
    "priceFor100Percent": 60000
  }'
```

### 3.7 Delete Ingredient by ID

```bash
curl -X DELETE "http://localhost:5000/api/materials/categories/CATEGORY_ID/ingredients/INGREDIENT_ID" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 3.8 Delete Ingredient by Name

```bash
curl -X DELETE "http://localhost:5000/api/materials/categories/CATEGORY_ID/ingredients" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cement"
  }'
```

---

## 4. Material Operations

### 4.1 Create Material (Ingredients Auto-loaded from Category)

**With URL Images:**
```bash
curl -X POST "http://localhost:5000/api/materials" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Concrete Block",
    "category": "CATEGORY_ID",
    "price": 5000,
    "specs": "High quality concrete block",
    "rating": 8.5,
    "width": 200,
    "length": 400,
    "height": 200,
    "unit": "mm",
    "description": "Premium quality concrete block for construction",
    "images": ["https://example.com/material1.jpg"],
    "thicknessOptions": [
      {
        "thickness": {
          "value": 200,
          "unit": "mm"
        },
        "fileUrl": "https://example.com/thickness1.pdf"
      }
    ],
    "isPremium": false,
    "tags": ["concrete", "block", "construction"]
  }'
```

**With Base64 Images:**
```bash
curl -X POST "http://localhost:5000/api/materials" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Concrete Block",
    "category": "CATEGORY_ID",
    "price": 5000,
    "specs": "High quality concrete block",
    "rating": 8.5,
    "width": 200,
    "length": 400,
    "height": 200,
    "unit": "mm",
    "description": "Premium quality concrete block for construction",
    "images": [
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAoADwDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKrobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigAooooAKKKKAP//Z",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    ],
    "thicknessOptions": [
      {
        "thickness": {
          "value": 200,
          "unit": "mm"
        },
        "fileUrl": "https://example.com/thickness1.pdf"
      }
    ],
    "isPremium": false,
    "tags": ["concrete", "block", "construction"]
  }'
```

**Note:** 
- Ingredients are automatically loaded from the category. The `ingredients` field is optional - if provided, it will override the default category ingredients.
- Images can be provided as URLs or Base64 strings (starting with `data:image/...`)
- Base64 images are automatically uploaded to Firebase and converted to URLs
- Supported formats: `data:image/jpeg;base64,...`, `data:image/png;base64,...`, `data:image/webp;base64,...`, etc.

**Response:**
```json
{
  "success": true,
  "message": "Material created successfully",
  "data": {
    "material": {
      "_id": "material_id",
      "name": "Premium Concrete Block",
      "category": "category_id",
      "ingredients": [
        {
          "_id": "ingredient_id_1",
          "name": "Cement",
          "requiredPercent": 30,
          "priceFor100Percent": 50000
        },
        {
          "_id": "ingredient_id_2",
          "name": "Sand",
          "requiredPercent": 40,
          "priceFor100Percent": 30000
        },
        {
          "_id": "ingredient_id_3",
          "name": "Gravel",
          "requiredPercent": 30,
          "priceFor100Percent": 20000
        }
      ]
    }
  }
}
```

### 4.2 Create Material with Custom Ingredients (Override)

```bash
curl -X POST "http://localhost:5000/api/materials" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Custom Concrete Block",
    "category": "CATEGORY_ID",
    "price": 5000,
    "specs": "Custom mix concrete block",
    "rating": 8.5,
    "width": 200,
    "length": 400,
    "height": 200,
    "unit": "mm",
    "description": "Custom mix concrete block",
    "images": ["https://example.com/material1.jpg"],
    "ingredients": ["INGREDIENT_ID_1", "INGREDIENT_ID_2"],
    "thicknessOptions": [
      {
        "thickness": {
          "value": 200,
          "unit": "mm"
        },
        "fileUrl": "https://example.com/thickness1.pdf"
      }
    ],
    "isPremium": false,
    "tags": ["concrete", "block", "construction"]
  }'
```

**Note:** When providing custom ingredients, the total percentage must equal 100 **only if** the category's ingredientType is `percentage` and ingredients are provided. For `m3` or `m2` types, percentage validation is not performed.

### 4.3 Get Material by ID (with Ingredients)

```bash
curl -X GET "http://localhost:5000/api/materials/MATERIAL_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "material": {
      "_id": "material_id",
      "name": "Premium Concrete Block",
      "category": {
        "_id": "category_id",
        "name": "Standard Concrete",
        "parentCategory": {
          "_id": 1,
          "name": "Concrete",
          "ingredientType": "percentage"
        }
      },
      "ingredients": [
        {
          "_id": "ingredient_id_1",
          "name": "Cement",
          "requiredPercent": 30,
          "unit": "kg",
          "priceFor100Percent": 50000
        },
        {
          "_id": "ingredient_id_2",
          "name": "Sand",
          "requiredPercent": 40,
          "unit": "kg",
          "priceFor100Percent": 30000
        }
      ]
    }
  }
}
```

### 4.4 Update Material (Category Change - Ingredients Auto-updated)

```bash
curl -X PUT "http://localhost:5000/api/materials/MATERIAL_ID" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "NEW_CATEGORY_ID"
  }'
```

**Note:** When category is changed, ingredients are automatically updated from the new category. If the new category is percentage type **and ingredients are provided**, total percentage validation is performed. For `m3` or `m2` types, percentage validation is not performed.

### 4.5 Update Material with Custom Ingredients

```bash
curl -X PUT "http://localhost:5000/api/materials/MATERIAL_ID" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ingredients": ["INGREDIENT_ID_1", "INGREDIENT_ID_2", "INGREDIENT_ID_3"]
  }'
```

**Note:** For percentage type categories, the total percentage of selected ingredients must equal 100 **only when ingredients are provided**. If ingredients array is empty or not provided, validation is skipped.

---

## 5. Error Scenarios

### 5.1 Percentage Total Not 100

```bash
curl -X POST "http://localhost:5000/api/materials/categories" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Invalid Category",
    "parentCategory": 1,
    "images": ["https://example.com/image.jpg"],
    "ingredients": [
      {
        "name": "Cement",
        "requiredPercent": 30,
        "unit": "kg",
        "priceFor100Percent": 50000
      },
      {
        "name": "Sand",
        "requiredPercent": 40,
        "unit": "kg",
        "priceFor100Percent": 30000
      }
    ]
  }'
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Total percentage must be 100. Current total: 70"
}
```

### 5.2 Create Category Without Ingredients (Valid)

```bash
curl -X POST "http://localhost:5000/api/materials/categories" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Category Without Ingredients",
    "parentCategory": 1,
    "images": ["https://example.com/image.jpg"]
  }'
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Material category created successfully",
  "data": {
    "category": {
      "_id": "category_id",
      "name": "Category Without Ingredients",
      "parentCategory": {
        "_id": 1,
        "name": "Concrete",
        "ingredientType": "percentage"
      }
    }
  }
}
```

**Note:** Ingredients are optional. No validation is performed when ingredients are not provided, even for percentage type categories.

### 5.3 Create Category with Empty Ingredients Array (Valid)

```bash
curl -X POST "http://localhost:5000/api/materials/categories" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Category With Empty Ingredients",
    "parentCategory": 1,
    "images": ["https://example.com/image.jpg"],
    "ingredients": []
  }'
```

**Response (Success):** Same as above. Empty ingredients array is allowed.

### 5.4 Create m3/m2 Type Category Without Percentage Validation

```bash
curl -X POST "http://localhost:5000/api/materials/categories" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "m3 Category",
    "parentCategory": 2,
    "images": ["https://example.com/image.jpg"],
    "ingredients": [
      {
        "name": "Fiberglass",
        "unit": "m3",
        "pricePerM3": 150000
      }
    ]
  }'
```

**Note:** For `m3` or `m2` type categories, percentage validation is **never performed**, even if ingredients are provided.

---

## 6. Complete Workflow Example

### Step 1: Create Parent Category
```bash
curl -X POST "http://localhost:5000/api/materials/parent-categories" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Concrete",
    "ingredientType": "percentage"
  }'
```

### Step 2: Create Material Category with Ingredients
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
        "requiredPercent": 30,
        "unit": "kg",
        "priceFor100Percent": 50000
      },
      {
        "name": "Sand",
        "requiredPercent": 40,
        "unit": "kg",
        "priceFor100Percent": 30000
      },
      {
        "name": "Gravel",
        "requiredPercent": 30,
        "unit": "kg",
        "priceFor100Percent": 20000
      }
    ]
  }'
```

### Step 3: Get Category Ingredients (Verify)
```bash
curl -X GET "http://localhost:5000/api/materials/categories/CATEGORY_ID/ingredients" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Step 4: Create Material (Ingredients Auto-loaded)
```bash
curl -X POST "http://localhost:5000/api/materials" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Concrete Block",
    "category": "CATEGORY_ID",
    "price": 5000,
    "specs": "High quality",
    "rating": 8.5,
    "width": 200,
    "length": 400,
    "height": 200,
    "unit": "mm",
    "description": "Premium quality concrete block",
    "images": ["https://example.com/material1.jpg"],
    "thicknessOptions": [
      {
        "thickness": {
          "value": 200,
          "unit": "mm"
        },
        "fileUrl": "https://example.com/thickness1.pdf"
      }
    ]
  }'
```

### Step 5: Get Material (Verify Ingredients)
```bash
curl -X GET "http://localhost:5000/api/materials/MATERIAL_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Notes

1. **Ingredient Type Determination**: The ingredient type (percentage/m3/m2) is determined by the parent category's `ingredientType` field.

2. **Percentage Validation**: For percentage type categories, the total percentage of all active ingredients must equal 100 **only when ingredients are provided**:
   - Creating a material category with ingredients (if ingredients array is provided and not empty)
   - Creating a material with custom ingredients (if ingredients array is provided and not empty)
   - Updating a material's ingredients (if ingredients array is provided and not empty)
   - **Important**: If ingredients are not provided, `null`, or empty array `[]`, validation is **skipped**
   - **Important**: For `m3` or `m2` type categories, percentage validation is **never performed**, regardless of whether ingredients are provided

3. **Automatic Ingredient Loading**: When creating a material without specifying ingredients, all active ingredients from the selected category are automatically assigned.

4. **Category Change**: When updating a material's category, ingredients are automatically updated from the new category.

5. **Price Fields**: Only the relevant price field is used based on ingredientType. All price fields are **optional**:
   - `percentage`: `priceFor100Percent` (optional)
   - `m3`: `pricePerM3` (optional)
   - `m2`: `pricePerM2` (optional)
   - `requiredPercent` is also **optional** for percentage type

6. **Image Upload**: 
   - Images can be provided as URLs (starting with `http://` or `https://`) or Base64 strings (starting with `data:image/...`)
   - Base64 images are automatically uploaded to Firebase Storage and converted to permanent URLs
   - Supported Base64 formats: `data:image/jpeg;base64,...`, `data:image/png;base64,...`, `data:image/webp;base64,...`, etc.
   - If an image string doesn't start with `http` or `data:image`, it's treated as Base64 and uploaded to Firebase

