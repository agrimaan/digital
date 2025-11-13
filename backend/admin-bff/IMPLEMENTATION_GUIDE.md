# Admin BFF Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing and deploying the Admin Backend-for-Frontend (BFF) service.

## Architecture

The Admin BFF service sits between the frontend admin dashboard and multiple backend microservices, providing:

1. **Data Aggregation**: Combines data from multiple services into unified responses
2. **Error Handling**: Graceful degradation when services are unavailable
3. **Authentication**: Centralized JWT authentication and authorization
4. **Simplified API**: Single endpoints for complex operations

### Service Flow

```
┌─────────────────────┐
│  Admin Dashboard    │
│    (Frontend)       │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│    Admin BFF        │
│   (Port 3013)       │
└──────────┬──────────┘
           │
           ├──────────────────────────────────────────────┐
           │                                              │
           ↓                                              ↓
┌──────────────────┐                          ┌──────────────────┐
│  User Service    │                          │  Field Service   │
│  (Port 3002)     │                          │  (Port 3003)     │
└──────────────────┘                          └──────────────────┘
           │                                              │
           ↓                                              ↓
┌──────────────────┐                          ┌──────────────────┐
│  Crop Service    │                          │  IoT Service     │
│  (Port 3004)     │                          │  (Port 3005)     │
└──────────────────┘                          └──────────────────┘
           │                                              │
           ↓                                              ↓
┌──────────────────┐                          ┌──────────────────┐
│ Marketplace Svc  │                          │ Resource Service │
│  (Port 3006)     │                          │  (Port 3008)     │
└──────────────────┘                          └──────────────────┘
           │                                              │
           ↓                                              ↓
┌──────────────────┐                          ┌──────────────────┐
│ Blockchain Svc   │                          │  Admin Service   │
│  (Port 3007)     │                          │  (Port 3012)     │
└──────────────────┘                          └──────────────────┘
```

## Installation Steps

### 1. Install Dependencies

```bash
cd digital/backend/admin-bff
npm install
```

### 2. Configure Environment

Create or update `.env` file:

```env
# Server Configuration
PORT=3013
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-secret-key-here

# Service URLs (adjust based on your deployment)
USER_SERVICE_URL=http://user-service:3002
FIELD_SERVICE_URL=http://field-service:3003
CROP_SERVICE_URL=http://crop-service:3004
IOT_SERVICE_URL=http://iot-service:3005
MARKETPLACE_SERVICE_URL=http://marketplace-service:3006
BLOCKCHAIN_SERVICE_URL=http://blockchain-service:3007
RESOURCE_SERVICE_URL=http://resource-service:3008
ADMIN_SERVICE_URL=http://admin-service:3012
```

### 3. Create Logs Directory

```bash
mkdir -p logs
```

### 4. Start the Service

**Development Mode:**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

## Frontend Integration

### Update API Configuration

Update `digital/frontend/src/services/adminService.ts` to use BFF endpoints:

```typescript
const API_URL = `${API_BASE_URL}/api/bff`;
```

### Update Dashboard Component

The dashboard should now call BFF endpoints:

```typescript
// Fetch all data from BFF
const [stats, users, orders, health] = await Promise.all([
  adminService.dashboard.getDashboardStats(),
  adminService.dashboard.getRecentUsers(5),
  adminService.dashboard.getRecentOrders(5),
  adminService.dashboard.getSystemHealth()
]);
```

## API Endpoints

### Dashboard Endpoints

#### 1. Get Complete Dashboard Data
```
GET /api/bff/dashboard
Authorization: Bearer <token>
```

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

#### 2. Get Dashboard Statistics
```
GET /api/bff/dashboard/stats
Authorization: Bearer <token>
```

#### 3. Get Recent Users
```
GET /api/bff/dashboard/users/recent?limit=10
Authorization: Bearer <token>
```

#### 4. Get Recent Orders
```
GET /api/bff/dashboard/orders/recent?limit=10
Authorization: Bearer <token>
```

#### 5. Get System Health
```
GET /api/bff/dashboard/system/health
Authorization: Bearer <token>
```

#### 6. Get Resources
```
GET /api/bff/dashboard/resources
Authorization: Bearer <token>
```

#### 7. Get Land Tokens
```
GET /api/bff/dashboard/land-tokens
Authorization: Bearer <token>
```

#### 8. Get Bulk Uploads
```
GET /api/bff/dashboard/bulk-uploads
Authorization: Bearer <token>
```

### Resource Management Endpoints

#### 1. Get All Resources
```
GET /api/bff/resources
Authorization: Bearer <token>
```

#### 2. Get Resource by ID
```
GET /api/bff/resources/:id
Authorization: Bearer <token>
```

#### 3. Create Resource
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

#### 4. Update Resource
```
PUT /api/bff/resources/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "hourlyRate": 550
}
```

#### 5. Delete Resource
```
DELETE /api/bff/resources/:id
Authorization: Bearer <token>
```

## Error Handling

The BFF implements graceful degradation:

### Service Unavailable
When a backend service is unavailable:
- Returns default values (0 for counts, empty arrays for lists)
- Logs the error
- Continues processing other services
- Frontend receives partial data

### Authentication Errors
- 401: Invalid or expired token
- 403: Insufficient permissions (non-admin user)

### Example Error Response
```json
{
  "success": false,
  "message": "user-service is unavailable",
  "service": "user-service"
}
```

## Testing

### Health Check
```bash
curl http://localhost:3013/health
```

Expected response:
```json
{
  "status": "UP",
  "service": "admin-bff",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Test Dashboard Endpoint
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3013/api/bff/dashboard/stats
```

## Docker Deployment

### Build Image
```bash
docker build -t admin-bff:latest .
```

### Run Container
```bash
docker run -d \
  --name admin-bff \
  -p 3013:3013 \
  --env-file .env \
  admin-bff:latest
```

### Docker Compose
Add to your `docker-compose.yml`:

```yaml
admin-bff:
  build: ./digital/backend/admin-bff
  ports:
    - "3013:3013"
  environment:
    - PORT=3013
    - NODE_ENV=production
    - JWT_SECRET=${JWT_SECRET}
    - USER_SERVICE_URL=http://user-service:3002
    - FIELD_SERVICE_URL=http://field-service:3003
    - CROP_SERVICE_URL=http://crop-service:3004
    - IOT_SERVICE_URL=http://iot-service:3005
    - MARKETPLACE_SERVICE_URL=http://marketplace-service:3006
    - BLOCKCHAIN_SERVICE_URL=http://blockchain-service:3007
    - RESOURCE_SERVICE_URL=http://resource-service:3008
    - ADMIN_SERVICE_URL=http://admin-service:3012
  depends_on:
    - user-service
    - field-service
    - crop-service
    - iot-service
    - marketplace-service
    - blockchain-service
    - resource-service
    - admin-service
  networks:
    - agrimaan-network
```

## Monitoring

### Logs
Logs are written to:
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- Console (development mode)

### View Logs
```bash
# View combined logs
tail -f logs/combined.log

# View error logs
tail -f logs/error.log
```

## Troubleshooting

### Service Connection Issues

**Problem:** BFF cannot connect to backend services

**Solution:**
1. Check service URLs in `.env`
2. Verify services are running
3. Check network connectivity
4. Review logs for specific errors

### Authentication Issues

**Problem:** 401 Unauthorized errors

**Solution:**
1. Verify JWT_SECRET matches across services
2. Check token expiration
3. Ensure token is properly formatted in Authorization header

### Data Not Loading

**Problem:** Dashboard shows zeros or empty data

**Solution:**
1. Check individual service health endpoints
2. Review BFF logs for service errors
3. Verify data exists in backend services
4. Check service client configurations

## Performance Optimization

### Caching
Consider implementing caching for:
- Dashboard statistics (cache for 5 minutes)
- System health status (cache for 1 minute)
- User counts by role (cache for 10 minutes)

### Parallel Requests
The BFF already uses `Promise.all()` for parallel requests. Ensure:
- All service calls are non-blocking
- Timeouts are properly configured
- Error handling doesn't block other requests

## Security Considerations

1. **JWT Secret**: Use a strong, unique secret in production
2. **HTTPS**: Always use HTTPS in production
3. **Rate Limiting**: Implement rate limiting for API endpoints
4. **Input Validation**: Validate all input data
5. **CORS**: Configure CORS properly for your frontend domain

## Maintenance

### Regular Tasks
1. Monitor logs for errors
2. Check service health endpoints
3. Review performance metrics
4. Update dependencies regularly
5. Rotate logs to prevent disk space issues

### Log Rotation
Configure log rotation in production:

```bash
# Install logrotate
sudo apt-get install logrotate

# Create logrotate config
sudo nano /etc/logrotate.d/admin-bff
```

Add configuration:
```
/path/to/admin-bff/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 node node
    sharedscripts
}
```

## Support

For issues or questions:
1. Check logs first
2. Review this documentation
3. Check service health endpoints
4. Contact the development team

## License

MIT