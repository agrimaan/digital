# Farmer Marketplace API Documentation

## Overview
This API allows farmers to list their ready-to-harvest crops on the marketplace for buyers to view and purchase.

## Base URL
```
http://localhost:3005/api/farmer/marketplace
```

## Authentication
All farmer marketplace endpoints require JWT authentication.
Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Endpoints

### 1. Create Marketplace Listing

Create a new marketplace listing for a ready-to-harvest crop.

**Endpoint:** `POST /listings`

**Request Body:**
```json
{
  "cropId": "507f1f77bcf86cd799439011",
  "quantity": 100,
  "pricePerUnit": 250,
  "negotiable": false,
  "minimumOrderQuantity": 10,
  "grade": "Premium",
  "isOrganic": true,
  "certifications": ["Organic India", "USDA Organic"],
  "description": "Fresh organic wheat, premium quality",
  "images": [
    {
      "url": "https://example.com/image1.jpg",
      "caption": "Field view",
      "isPrimary": true
    }
  ],
  "visibility": "public",
  "expiresInDays": 30
}
```

**Required Fields:**
- `cropId` (string): MongoDB ObjectId of the crop
- `quantity` (number): Available quantity
- `pricePerUnit` (number): Price per unit

**Optional Fields:**
- `negotiable` (boolean): Whether price is negotiable (default: false)
- `minimumOrderQuantity` (number): Minimum order quantity (default: 1)
- `grade` (string): Quality grade - "A", "B", "C", "Premium", "Standard"
- `isOrganic` (boolean): Whether crop is organic (default: false)
- `certifications` (array): List of certifications
- `description` (string): Product description (max 1000 chars)
- `images` (array): Product images
- `visibility` (string): "public", "private", "verified_buyers_only"
- `expiresInDays` (number): Days until listing expires (1-90, default: 30)

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "crop": "507f1f77bcf86cd799439011",
    "farmer": "507f1f77bcf86cd799439010",
    "cropName": "Wheat",
    "variety": "Hard Red Winter",
    "quantity": {
      "available": 100,
      "unit": "ton",
      "reserved": 0
    },
    "pricing": {
      "pricePerUnit": 250,
      "currency": "INR",
      "negotiable": false,
      "minimumOrderQuantity": 10
    },
    "harvestInfo": {
      "expectedHarvestDate": "2024-12-01T00:00:00.000Z",
      "harvestStatus": "ready"
    },
    "quality": {
      "grade": "Premium",
      "isOrganic": true,
      "certifications": ["Organic India", "USDA Organic"],
      "healthStatus": "excellent"
    },
    "status": "active",
    "expiresAt": "2024-12-31T00:00:00.000Z",
    "createdAt": "2024-12-01T00:00:00.000Z"
  },
  "message": "Marketplace listing created successfully"
}
```

**Validation Rules:**
- Crop must be in 'maturity' or 'harvested' stage
- Quantity cannot exceed crop's actual yield
- Only one active listing per crop allowed
- Price must be positive

---

### 2. Get My Listings

Retrieve all marketplace listings created by the authenticated farmer.

**Endpoint:** `GET /listings`

**Query Parameters:**
- `status` (string): Filter by status - "active", "inactive", "sold_out", "expired"
- `sortBy` (string): Field to sort by - "createdAt", "pricePerUnit", "quantity.available"
- `sortOrder` (string): Sort order - "asc", "desc"

**Example:**
```
GET /listings?status=active&sortBy=createdAt&sortOrder=desc
```

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 5,
    "listings": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "cropName": "Wheat",
        "variety": "Hard Red Winter",
        "quantity": {
          "available": 100,
          "unit": "ton"
        },
        "pricing": {
          "pricePerUnit": 250
        },
        "status": "active",
        "statistics": {
          "views": 45,
          "inquiries": 12,
          "orders": 3
        }
      }
    ]
  },
  "message": "Listings retrieved successfully"
}
```

---

### 3. Get Single Listing

Get detailed information about a specific listing.

**Endpoint:** `GET /listings/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "crop": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Wheat",
      "variety": "Hard Red Winter",
      "growthStage": "harvested",
      "actualYield": 100
    },
    "cropName": "Wheat",
    "quantity": {
      "available": 100,
      "unit": "ton",
      "reserved": 0
    },
    "pricing": {
      "pricePerUnit": 250,
      "currency": "INR",
      "negotiable": false
    },
    "quality": {
      "grade": "Premium",
      "isOrganic": true
    },
    "statistics": {
      "views": 45,
      "inquiries": 12,
      "orders": 3
    },
    "status": "active"
  },
  "message": "Listing retrieved successfully"
}
```

---

### 4. Update Listing

Update an existing marketplace listing.

**Endpoint:** `PUT /listings/:id`

**Request Body:**
```json
{
  "quantity.available": 90,
  "pricing.pricePerUnit": 240,
  "pricing.negotiable": true,
  "quality.grade": "A",
  "description": "Updated description",
  "status": "active"
}
```

**Updatable Fields:**
- `quantity.available`
- `pricing.pricePerUnit`
- `pricing.negotiable`
- `pricing.minimumOrderQuantity`
- `quality.grade`
- `quality.isOrganic`
- `quality.certifications`
- `description`
- `images`
- `visibility`
- `status`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "quantity": {
      "available": 90
    },
    "pricing": {
      "pricePerUnit": 240,
      "negotiable": true
    }
  },
  "message": "Listing updated successfully"
}
```

---

### 5. Deactivate Listing

Deactivate a marketplace listing (removes from buyer view).

**Endpoint:** `DELETE /listings/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "status": "inactive"
  },
  "message": "Listing deactivated successfully"
}
```

---

### 6. Reactivate Listing

Reactivate a previously deactivated listing.

**Endpoint:** `POST /listings/:id/reactivate`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "status": "active"
  },
  "message": "Listing reactivated successfully"
}
```

**Restrictions:**
- Cannot reactivate sold out listings
- Cannot reactivate expired listings

---

### 7. Get Ready Crops

Get list of crops that are ready for marketplace listing.

**Endpoint:** `GET /ready-crops`

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 3,
    "crops": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Wheat",
        "variety": "Hard Red Winter",
        "growthStage": "maturity",
        "expectedHarvestDate": "2024-12-01T00:00:00.000Z",
        "actualYield": 100,
        "unit": "ton"
      }
    ]
  },
  "message": "Ready crops retrieved successfully"
}
```

**Criteria for Ready Crops:**
- Growth stage is 'maturity' or 'harvested'
- Crop is active
- No active marketplace listing exists

---

### 8. Get Statistics

Get marketplace statistics for the farmer.

**Endpoint:** `GET /statistics`

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 10,
    "active": 5,
    "inactive": 2,
    "soldOut": 2,
    "expired": 1,
    "totalViews": 450,
    "totalInquiries": 120,
    "totalOrders": 35,
    "totalValue": 125000
  },
  "message": "Statistics retrieved successfully"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Crop must be in 'maturity' or 'harvested' stage. Current stage: vegetative"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "No token provided"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Listing not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Error creating marketplace listing",
  "error": "Detailed error message"
}
```

---

## Usage Examples

### Example 1: Create Listing for Harvested Crop

```bash
curl -X POST http://localhost:3005/api/farmer/marketplace/listings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cropId": "507f1f77bcf86cd799439011",
    "quantity": 100,
    "pricePerUnit": 250,
    "grade": "Premium",
    "isOrganic": true,
    "description": "Fresh organic wheat"
  }'
```

### Example 2: Get All Active Listings

```bash
curl -X GET "http://localhost:3005/api/farmer/marketplace/listings?status=active" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Example 3: Update Listing Price

```bash
curl -X PUT http://localhost:3005/api/farmer/marketplace/listings/507f1f77bcf86cd799439012 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pricing.pricePerUnit": 240,
    "pricing.negotiable": true
  }'
```

---

## Best Practices

1. **Before Creating Listing:**
   - Ensure crop is in 'maturity' or 'harvested' stage
   - Record actual yield
   - Set realistic pricing
   - Add quality images

2. **Pricing:**
   - Research market prices
   - Consider quality grade
   - Set competitive prices
   - Use negotiable option wisely

3. **Descriptions:**
   - Be clear and detailed
   - Mention quality attributes
   - Include harvest date
   - Highlight certifications

4. **Images:**
   - Use high-quality images
   - Show crop condition
   - Include field views
   - Mark primary image

5. **Maintenance:**
   - Update quantity regularly
   - Respond to inquiries promptly
   - Deactivate when sold
   - Monitor statistics

---

## Workflow

```
1. Farmer grows crop
   ↓
2. Crop reaches maturity/harvested stage
   ↓
3. Farmer records actual yield
   ↓
4. Farmer creates marketplace listing
   ↓
5. Listing appears in buyer marketplace
   ↓
6. Buyers view and inquire
   ↓
7. Farmer updates quantity as sales occur
   ↓
8. Listing marked sold_out when quantity = 0
```

---

## Notes

- Listings automatically expire after specified days
- Expired listings cannot be reactivated
- Sold out listings cannot be reactivated
- Only one active listing per crop allowed
- Statistics are updated in real-time
- Location data is used for nearby searches