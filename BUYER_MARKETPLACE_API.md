# Buyer Marketplace API Documentation

## Overview
This API allows buyers to browse, search, and view marketplace listings of crops available for purchase from farmers.

## Base URL
```
http://localhost:3005/api/buyer/marketplace
```

## Authentication
Most buyer marketplace endpoints are public (no authentication required).
Some endpoints like recording inquiries require JWT authentication.

---

## Endpoints

### 1. Get All Listings

Browse all active marketplace listings with filtering and pagination.

**Endpoint:** `GET /listings`

**Query Parameters:**
- `search` (string): Text search across crop name, variety, and description
- `cropName` (string): Filter by crop name
- `isOrganic` (boolean): Filter organic crops (true/false)
- `grade` (string): Filter by quality grade - "A", "B", "C", "Premium", "Standard"
- `minPrice` (number): Minimum price per unit
- `maxPrice` (number): Maximum price per unit
- `minQuantity` (number): Minimum available quantity
- `harvestStatus` (string): Filter by harvest status - "ready", "in_progress", "completed"
- `sortBy` (string): Field to sort by - "createdAt", "pricePerUnit", "quantity.available"
- `sortOrder` (string): Sort order - "asc", "desc"
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)

**Example:**
```
GET /listings?cropName=wheat&isOrganic=true&minPrice=200&maxPrice=300&sortBy=pricePerUnit&sortOrder=asc&page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "listings": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "cropName": "Wheat",
        "variety": "Hard Red Winter",
        "scientificName": "Triticum aestivum",
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
          "certifications": ["Organic India"],
          "healthStatus": "excellent"
        },
        "farmInfo": {
          "location": {
            "type": "Point",
            "coordinates": [77.5946, 12.9716],
            "address": {
              "district": "Bangalore",
              "state": "Karnataka"
            }
          },
          "soilType": "loam",
          "irrigationMethod": "drip"
        },
        "description": "Fresh organic wheat, premium quality",
        "images": [
          {
            "url": "https://example.com/image1.jpg",
            "caption": "Field view",
            "isPrimary": true
          }
        ],
        "statistics": {
          "views": 45,
          "inquiries": 12
        },
        "daysUntilHarvest": 5,
        "totalValue": 25000,
        "createdAt": "2024-11-25T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "pages": 5
    }
  },
  "message": "Listings retrieved successfully"
}
```

---

### 2. Get Single Listing

Get detailed information about a specific listing.

**Endpoint:** `GET /listings/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "cropName": "Wheat",
    "variety": "Hard Red Winter",
    "quantity": {
      "available": 100,
      "unit": "ton"
    },
    "pricing": {
      "pricePerUnit": 250,
      "currency": "INR",
      "negotiable": false,
      "minimumOrderQuantity": 10
    },
    "quality": {
      "grade": "Premium",
      "isOrganic": true,
      "certifications": ["Organic India"]
    },
    "farmInfo": {
      "location": {
        "address": {
          "district": "Bangalore",
          "state": "Karnataka"
        }
      }
    },
    "description": "Fresh organic wheat, premium quality",
    "images": [],
    "statistics": {
      "views": 46,
      "inquiries": 12
    }
  },
  "message": "Listing retrieved successfully"
}
```

**Note:** View count is automatically incremented when this endpoint is called.

---

### 3. Get Nearby Listings

Find listings near a specific location.

**Endpoint:** `GET /listings/nearby`

**Query Parameters:**
- `longitude` (number): Longitude coordinate (required)
- `latitude` (number): Latitude coordinate (required)
- `maxDistance` (number): Maximum distance in meters (default: 50000 = 50km)

**Example:**
```
GET /listings/nearby?longitude=77.5946&latitude=12.9716&maxDistance=100000
```

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 12,
    "listings": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "cropName": "Wheat",
        "quantity": {
          "available": 100,
          "unit": "ton"
        },
        "pricing": {
          "pricePerUnit": 250
        },
        "farmInfo": {
          "location": {
            "coordinates": [77.5946, 12.9716],
            "address": {
              "district": "Bangalore",
              "state": "Karnataka"
            }
          }
        }
      }
    ]
  },
  "message": "Nearby listings retrieved successfully"
}
```

---

### 4. Get Listings by Crop Name

Get all listings for a specific crop.

**Endpoint:** `GET /listings/crop/:cropName`

**Query Parameters:**
- `sortBy` (string): Field to sort by
- `sortOrder` (string): Sort order - "asc", "desc"

**Example:**
```
GET /listings/crop/wheat?sortBy=pricePerUnit&sortOrder=asc
```

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 15,
    "listings": [...]
  },
  "message": "Listings retrieved successfully"
}
```

---

### 5. Get Organic Listings

Get all organic crop listings.

**Endpoint:** `GET /listings/organic`

**Query Parameters:**
- `sortBy` (string): Field to sort by
- `sortOrder` (string): Sort order

**Example:**
```
GET /listings/organic?sortBy=createdAt&sortOrder=desc
```

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 8,
    "listings": [...]
  },
  "message": "Organic listings retrieved successfully"
}
```

---

### 6. Get Featured Listings

Get featured listings (premium quality, high ratings).

**Endpoint:** `GET /listings/featured`

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 10,
    "listings": [...]
  },
  "message": "Featured listings retrieved successfully"
}
```

**Criteria for Featured:**
- Quality grade is "Premium" or "A"
- OR crop is organic
- Sorted by views and recency

---

### 7. Get Available Crops

Get list of all available crop types with statistics.

**Endpoint:** `GET /crops`

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 12,
    "crops": [
      {
        "cropName": "Wheat",
        "listingsCount": 15,
        "averagePrice": 245.50,
        "totalAvailable": 1500
      },
      {
        "cropName": "Rice",
        "listingsCount": 12,
        "averagePrice": 320.00,
        "totalAvailable": 1200
      }
    ]
  },
  "message": "Available crops retrieved successfully"
}
```

---

### 8. Get Available Varieties

Get list of all available crop varieties.

**Endpoint:** `GET /varieties`

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 25,
    "varieties": [
      "Hard Red Winter",
      "Soft White",
      "Basmati",
      "Jasmine"
    ]
  },
  "message": "Varieties retrieved successfully"
}
```

---

### 9. Get Marketplace Statistics

Get overall marketplace statistics.

**Endpoint:** `GET /statistics`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalListings": 45,
    "totalCrops": 12,
    "organicListings": 18,
    "totalQuantityAvailable": 5000,
    "averagePrice": 275.50,
    "priceRange": {
      "min": 150,
      "max": 500
    }
  },
  "message": "Statistics retrieved successfully"
}
```

---

### 10. Record Inquiry

Record an inquiry for a listing (requires authentication).

**Endpoint:** `POST /listings/:id/inquiry`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {},
  "message": "Inquiry recorded successfully"
}
```

**Note:** This increments the inquiry count for the listing.

---

## Search Examples

### Example 1: Search for Organic Wheat

```bash
curl "http://localhost:3005/api/buyer/marketplace/listings?cropName=wheat&isOrganic=true"
```

### Example 2: Find Cheap Rice

```bash
curl "http://localhost:3005/api/buyer/marketplace/listings?cropName=rice&maxPrice=300&sortBy=pricePerUnit&sortOrder=asc"
```

### Example 3: Premium Quality Crops

```bash
curl "http://localhost:3005/api/buyer/marketplace/listings?grade=Premium"
```

### Example 4: Nearby Listings

```bash
curl "http://localhost:3005/api/buyer/marketplace/listings/nearby?longitude=77.5946&latitude=12.9716&maxDistance=50000"
```

### Example 5: Text Search

```bash
curl "http://localhost:3005/api/buyer/marketplace/listings?search=organic+premium+wheat"
```

---

## Filter Combinations

### Find Organic Premium Wheat Under ₹300

```
GET /listings?cropName=wheat&isOrganic=true&grade=Premium&maxPrice=300
```

### Find Large Quantities of Rice

```
GET /listings?cropName=rice&minQuantity=50&sortBy=quantity.available&sortOrder=desc
```

### Find Ready-to-Harvest Crops Nearby

```
GET /listings/nearby?longitude=77.5946&latitude=12.9716&harvestStatus=ready
```

---

## Response Fields Explained

### Listing Object

| Field | Type | Description |
|-------|------|-------------|
| `_id` | string | Unique listing ID |
| `cropName` | string | Name of the crop |
| `variety` | string | Crop variety |
| `scientificName` | string | Scientific name |
| `quantity.available` | number | Available quantity |
| `quantity.unit` | string | Unit of measurement |
| `quantity.reserved` | number | Reserved quantity |
| `pricing.pricePerUnit` | number | Price per unit |
| `pricing.currency` | string | Currency (INR) |
| `pricing.negotiable` | boolean | Is price negotiable |
| `pricing.minimumOrderQuantity` | number | Minimum order |
| `harvestInfo.expectedHarvestDate` | date | Expected harvest date |
| `harvestInfo.harvestStatus` | string | Harvest status |
| `quality.grade` | string | Quality grade |
| `quality.isOrganic` | boolean | Is organic |
| `quality.certifications` | array | Certifications |
| `farmInfo.location` | object | Farm location |
| `farmInfo.soilType` | string | Soil type |
| `description` | string | Product description |
| `images` | array | Product images |
| `statistics.views` | number | View count |
| `statistics.inquiries` | number | Inquiry count |
| `daysUntilHarvest` | number | Days until harvest |
| `totalValue` | number | Total value |

---

## Sorting Options

Available sort fields:
- `createdAt` - Listing creation date
- `pricePerUnit` - Price per unit
- `quantity.available` - Available quantity
- `statistics.views` - View count
- `harvestInfo.expectedHarvestDate` - Harvest date

Sort orders:
- `asc` - Ascending (low to high)
- `desc` - Descending (high to low)

---

## Best Practices for Buyers

1. **Search Efficiently:**
   - Use specific crop names
   - Combine multiple filters
   - Use location-based search
   - Sort by relevant fields

2. **Quality Assessment:**
   - Check quality grade
   - Look for certifications
   - Review organic status
   - Check health status

3. **Pricing:**
   - Compare prices across listings
   - Consider quality grade
   - Check if negotiable
   - Factor in location/distance

4. **Quantity:**
   - Check available quantity
   - Note minimum order quantity
   - Consider reserved quantity
   - Plan for harvest timing

5. **Due Diligence:**
   - View listing details
   - Check harvest dates
   - Review farm information
   - Record inquiries

---

## Use Cases

### Use Case 1: Find Organic Wheat Nearby

```javascript
// Step 1: Get nearby organic wheat
const response = await fetch(
  'http://localhost:3005/api/buyer/marketplace/listings/nearby?' +
  'longitude=77.5946&latitude=12.9716&maxDistance=50000'
);
const nearbyListings = await response.json();

// Step 2: Filter for wheat and organic
const organicWheat = nearbyListings.data.listings.filter(
  listing => listing.cropName.toLowerCase() === 'wheat' && 
             listing.quality.isOrganic
);
```

### Use Case 2: Compare Prices for Rice

```javascript
// Get all rice listings sorted by price
const response = await fetch(
  'http://localhost:3005/api/buyer/marketplace/listings/crop/rice?' +
  'sortBy=pricePerUnit&sortOrder=asc'
);
const riceListings = await response.json();

// Find best deal
const bestDeal = riceListings.data.listings[0];
```

### Use Case 3: Find Premium Quality Crops

```javascript
// Get featured listings
const response = await fetch(
  'http://localhost:3005/api/buyer/marketplace/listings/featured'
);
const featured = await response.json();

// Or filter by grade
const premiumResponse = await fetch(
  'http://localhost:3005/api/buyer/marketplace/listings?grade=Premium'
);
const premium = await premiumResponse.json();
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Longitude and latitude are required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Listing not found or no longer available"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Error retrieving listings",
  "error": "Detailed error message"
}
```

---

## Notes

- All listings are automatically filtered to show only active and non-expired items
- Farmer information is not exposed to buyers for privacy
- View counts are incremented automatically
- Location-based searches use geospatial indexes for performance
- Text search uses MongoDB text indexes
- Pagination helps manage large result sets
- All dates are in ISO 8601 format
- Prices are in INR (Indian Rupees)
- Quantities use metric units (kg, ton, quintal)