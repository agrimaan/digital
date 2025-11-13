# Admin BFF API Reference

Complete API reference for all endpoints provided by the Admin BFF service.

## Base URL

```
http://localhost:3013/api/bff
```

## Authentication

All endpoints require JWT authentication with admin role.

### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Authentication Errors
- `401 Unauthorized` - Invalid or missing token
- `403 Forbidden` - User does not have admin role

---

## Dashboard Endpoints

### 1. Get Complete Dashboard Data

Retrieves all dashboard data in a single request.

**Endpoint:** `GET /dashboard`

**Response:**
```json
{
  "success": true,
  "data": {
    "users": 150,
    "fields": 45,
    "crops": 120,
    "sensors": 80,
    "orders": 200,
    "resources": 30,
    "landTokens": 25,
    "bulkUploads": 10,
    "usersByRole": {
      "farmers": 100,
      "buyers": 30,
      "agronomists": 15,
      "investors": 3,
      "admins": 2
    },
    "verificationStats": {
      "pendingUsers": 5,
      "pendingLandTokens": 3,
      "pendingBulkUploads": 2
    }
  }
}
```

---

### 2. Get Dashboard Statistics

Retrieves aggregated statistics from all services.

**Endpoint:** `GET /dashboard/stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "users": 150,
    "fields": 45,
    "crops": 120,
    "sensors": 80,
    "orders": 200,
    "resources": 30,
    "landTokens": 25,
    "bulkUploads": 10,
    "usersByRole": {
      "farmers": 100,
      "buyers": 30,
      "agronomists": 15,
      "investors": 3,
      "admins": 2
    },
    "verificationStats": {
      "pendingUsers": 5,
      "pendingLandTokens": 3,
      "pendingBulkUploads": 2
    }
  }
}
```

---

### 3. Get Recent Users

Retrieves the most recently registered users.

**Endpoint:** `GET /dashboard/users/recent`

**Query Parameters:**
- `limit` (optional, default: 10) - Number of users to return

**Example:** `GET /dashboard/users/recent?limit=5`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "farmer",
      "verificationStatus": "verified",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### 4. Get Recent Orders

Retrieves the most recent orders.

**Endpoint:** `GET /dashboard/orders/recent`

**Query Parameters:**
- `limit` (optional, default: 10) - Number of orders to return

**Example:** `GET /dashboard/orders/recent?limit=5`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "buyer": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Jane Smith"
      },
      "seller": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "Farm Co"
      },
      "totalAmount": 5000,
      "status": "pending",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### 5. Get Pending Verifications

Retrieves counts of pending verifications across the system.

**Endpoint:** `GET /dashboard/verification/pending`

**Response:**
```json
{
  "success": true,
  "data": {
    "pendingUsers": 5,
    "pendingLandTokens": 3,
    "pendingBulkUploads": 2
  }
}
```

---

### 6. Get System Health

Retrieves system health status and configuration.

**Endpoint:** `GET /dashboard/system/health`

**Response:**
```json
{
  "success": true,
  "data": {
    "otpEnabled": true,
    "emailConfigured": true,
    "smsConfigured": false,
    "oauthConfigured": true
  }
}
```

---

### 7. Get All Resources

Retrieves all resources from the resource service.

**Endpoint:** `GET /dashboard/resources`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439015",
      "name": "Tractor",
      "type": "machinery",
      "hourlyRate": 500,
      "location": "Farm A",
      "owner": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### 8. Get All Land Tokens

Retrieves all land tokens from the blockchain service.

**Endpoint:** `GET /dashboard/land-tokens`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439016",
      "landId": "LAND-001",
      "owner": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "landDetails": {
        "location": {
          "city": "Mumbai",
          "state": "Maharashtra"
        },
        "area": {
          "value": 5,
          "unit": "acres"
        }
      },
      "verification": {
        "status": "pending"
      },
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### 9. Get All Bulk Uploads

Retrieves all bulk upload records.

**Endpoint:** `GET /dashboard/bulk-uploads`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439017",
      "filename": "users_import.csv",
      "type": "users",
      "status": "completed",
      "records": 100,
      "success": 95,
      "failed": 5,
      "uploadedBy": "admin@example.com",
      "uploadedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

## Resource Management Endpoints

### 1. Get All Resources

Retrieves all resources with optional filtering.

**Endpoint:** `GET /resources`

**Query Parameters:**
- `type` (optional) - Filter by resource type
- `location` (optional) - Filter by location

**Example:** `GET /resources?type=machinery`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439015",
      "name": "Tractor",
      "type": "machinery",
      "hourlyRate": 500,
      "location": "Farm A",
      "owner": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### 2. Get Resource by ID

Retrieves a specific resource by its ID.

**Endpoint:** `GET /resources/:id`

**Parameters:**
- `id` (required) - Resource ID

**Example:** `GET /resources/507f1f77bcf86cd799439015`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "name": "Tractor",
    "type": "machinery",
    "hourlyRate": 500,
    "location": "Farm A",
    "owner": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Resource not found"
}
```

---

### 3. Create Resource

Creates a new resource.

**Endpoint:** `POST /resources`

**Request Body:**
```json
{
  "name": "Tractor",
  "type": "machinery",
  "hourlyRate": 500,
  "location": "Farm A",
  "description": "Heavy-duty tractor for farming",
  "availability": true
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Resource created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "name": "Tractor",
    "type": "machinery",
    "hourlyRate": 500,
    "location": "Farm A",
    "description": "Heavy-duty tractor for farming",
    "availability": true,
    "owner": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "name": "Name is required",
    "hourlyRate": "Hourly rate must be a positive number"
  }
}
```

---

### 4. Update Resource

Updates an existing resource.

**Endpoint:** `PUT /resources/:id`

**Parameters:**
- `id` (required) - Resource ID

**Request Body:**
```json
{
  "name": "Updated Tractor",
  "hourlyRate": 550,
  "availability": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Resource updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "name": "Updated Tractor",
    "type": "machinery",
    "hourlyRate": 550,
    "location": "Farm A",
    "availability": false,
    "owner": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

---

### 5. Delete Resource

Deletes a resource.

**Endpoint:** `DELETE /resources/:id`

**Parameters:**
- `id` (required) - Resource ID

**Example:** `DELETE /resources/507f1f77bcf86cd799439015`

**Response:**
```json
{
  "success": true,
  "message": "Resource deleted successfully"
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Resource not found"
}
```

---

## Error Responses

### Standard Error Format
```json
{
  "success": false,
  "message": "Error message here",
  "error": "ERROR_CODE"
}
```

### Common Error Codes

#### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid request data"
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "No token provided"
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. Admin role required."
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Something went wrong!"
}
```

#### 503 Service Unavailable
```json
{
  "success": false,
  "message": "user-service is unavailable",
  "service": "user-service"
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. Consider adding rate limiting in production:

- 100 requests per minute per IP
- 1000 requests per hour per user

---

## Pagination

Currently not implemented. For large datasets, consider adding pagination:

```
GET /resources?page=1&limit=20
```

---

## Versioning

Current version: v1

Future versions can be added:
```
/api/bff/v2/dashboard
```

---

## Testing Examples

### Using cURL

**Get Dashboard Stats:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3013/api/bff/dashboard/stats
```

**Create Resource:**
```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name":"Tractor","type":"machinery","hourlyRate":500,"location":"Farm A"}' \
     http://localhost:3013/api/bff/resources
```

**Update Resource:**
```bash
curl -X PUT \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"hourlyRate":550}' \
     http://localhost:3013/api/bff/resources/507f1f77bcf86cd799439015
```

**Delete Resource:**
```bash
curl -X DELETE \
     -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3013/api/bff/resources/507f1f77bcf86cd799439015
```

### Using JavaScript/Axios

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3013/api/bff',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// Get dashboard stats
const stats = await api.get('/dashboard/stats');

// Create resource
const resource = await api.post('/resources', {
  name: 'Tractor',
  type: 'machinery',
  hourlyRate: 500,
  location: 'Farm A'
});
```

---

## Support

For issues or questions about the API:
1. Check the logs: `logs/combined.log`
2. Verify service health: `GET /health`
3. Review this documentation
4. Contact the development team