# Admin BFF (Backend for Frontend)

A dedicated Backend for Frontend service that aggregates data from multiple microservices to provide a unified API for the Admin Dashboard.

## Overview

The Admin BFF service acts as an aggregation layer between the frontend admin dashboard and various backend microservices. It simplifies the frontend by providing consolidated endpoints that fetch and combine data from multiple services.

## Features

- **Dashboard Statistics Aggregation**: Combines data from user, field, crop, sensor, order, resource, blockchain, and admin services
- **Unified API**: Single endpoint for complete dashboard data
- **Error Handling**: Graceful degradation when services are unavailable
- **Authentication & Authorization**: JWT-based auth with admin role verification
- **Service Health Monitoring**: Tracks availability of backend services
- **Resource Management**: CRUD operations for resources through BFF layer

## Architecture

```
Frontend (Admin Dashboard)
         ↓
    Admin BFF Service
         ↓
    ┌────┴────┬────────┬─────────┬──────────┬──────────┬────────────┐
    ↓         ↓        ↓         ↓          ↓          ↓            ↓
User      Field    Crop      IoT      Marketplace  Resource   Blockchain
Service   Service  Service   Service   Service     Service     Service
```

## API Endpoints

### Dashboard Endpoints

#### Get Complete Dashboard Data
```
GET /api/bff/dashboard
Authorization: Bearer <token>
```

Returns all dashboard data including statistics, recent users, recent orders, and system health.

#### Get Dashboard Statistics
```
GET /api/bff/dashboard/stats
Authorization: Bearer <token>
```

Returns aggregated counts from all services:
- Total users (by role)
- Total fields
- Total crops
- Total sensors
- Total orders
- Total resources
- Total land tokens
- Total bulk uploads
- Verification statistics

#### Get Recent Users
```
GET /api/bff/dashboard/users/recent?limit=10
Authorization: Bearer <token>
```

#### Get Recent Orders
```
GET /api/bff/dashboard/orders/recent?limit=10
Authorization: Bearer <token>
```

#### Get Pending Verifications
```
GET /api/bff/dashboard/verification/pending
Authorization: Bearer <token>
```

#### Get System Health
```
GET /api/bff/dashboard/system/health
Authorization: Bearer <token>
```

#### Get Resources
```
GET /api/bff/dashboard/resources
Authorization: Bearer <token>
```

#### Get Land Tokens
```
GET /api/bff/dashboard/land-tokens
Authorization: Bearer <token>
```

#### Get Bulk Uploads
```
GET /api/bff/dashboard/bulk-uploads
Authorization: Bearer <token>
```

### Resource Management Endpoints

#### Get All Resources
```
GET /api/bff/resources
Authorization: Bearer <token>
```

#### Get Resource by ID
```
GET /api/bff/resources/:id
Authorization: Bearer <token>
```

#### Create Resource
```
POST /api/bff/resources
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Tractor",
  "type": "machinery",
  "hourlyRate": 500,
  "location": "Farm A"
}
```

#### Update Resource
```
PUT /api/bff/resources/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Tractor",
  "hourlyRate": 550
}
```

#### Delete Resource
```
DELETE /api/bff/resources/:id
Authorization: Bearer <token>
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start the service:
```bash
# Development
npm run dev

# Production
npm start
```

## Environment Variables

```env
# Server Configuration
PORT=3013
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-secret-key-here

# Service URLs
USER_SERVICE_URL=http://user-service:3002
FIELD_SERVICE_URL=http://field-service:3003
CROP_SERVICE_URL=http://crop-service:3004
IOT_SERVICE_URL=http://iot-service:3005
MARKETPLACE_SERVICE_URL=http://marketplace-service:3006
BLOCKCHAIN_SERVICE_URL=http://blockchain-service:3007
RESOURCE_SERVICE_URL=http://resource-service:3008
ADMIN_SERVICE_URL=http://admin-service:3012
```

## Service Clients

The BFF includes service clients for:
- User Service
- Field Service
- Crop Service
- IoT Service
- Marketplace Service
- Resource Service
- Blockchain Service
- Admin Service

Each client includes:
- Automatic retry logic
- Error handling
- Request/response logging
- Timeout management

## Error Handling

The BFF implements graceful degradation:
- If a service is unavailable, it returns default values (0 counts, empty arrays)
- Errors are logged but don't break the entire dashboard
- Frontend receives partial data when some services fail

## Authentication

All endpoints require:
1. Valid JWT token in Authorization header
2. User must have 'admin' role

Example:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Logging

Logs are written to:
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- Console (development mode)

## Development

```bash
# Install dependencies
npm install

# Run in development mode with auto-reload
npm run dev

# Run tests
npm test
```

## Production Deployment

1. Set NODE_ENV to 'production'
2. Configure all service URLs
3. Set secure JWT_SECRET
4. Enable HTTPS
5. Configure log rotation
6. Set up monitoring

## Health Check

```
GET /health
```

Returns:
```json
{
  "status": "UP",
  "service": "admin-bff",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Dependencies

- express: Web framework
- axios: HTTP client for service communication
- jsonwebtoken: JWT authentication
- winston: Logging
- express-async-handler: Async error handling
- cors: CORS middleware
- dotenv: Environment configuration
- morgan: HTTP request logging

## License

MIT