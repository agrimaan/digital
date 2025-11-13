# Admin BFF Quick Start Guide

## What is Admin BFF?

The Admin Backend-for-Frontend (BFF) is a service that aggregates data from multiple microservices to provide a unified API for the admin dashboard. It simplifies frontend development by handling complex data aggregation and service orchestration.

## Quick Setup (5 Minutes)

### 1. Install Dependencies
```bash
cd digital/backend/admin-bff
npm install
```

### 2. Configure Environment
```bash
# Copy the example .env file
cp .env .env.local

# Edit .env.local with your service URLs
nano .env.local
```

Minimum required configuration:
```env
PORT=3013
JWT_SECRET=your-secret-key
USER_SERVICE_URL=http://localhost:3002
FIELD_SERVICE_URL=http://localhost:3003
CROP_SERVICE_URL=http://localhost:3004
IOT_SERVICE_URL=http://localhost:3005
MARKETPLACE_SERVICE_URL=http://localhost:3006
BLOCKCHAIN_SERVICE_URL=http://localhost:3007
RESOURCE_SERVICE_URL=http://localhost:3008
ADMIN_SERVICE_URL=http://localhost:3012
```

### 3. Start the Service
```bash
npm run dev
```

The service will start on http://localhost:3013

### 4. Verify It's Running
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

## Frontend Integration

### Update Frontend Service
In `digital/frontend/src/services/adminService.ts`, change the base URL:

```typescript
const API_URL = `${API_BASE_URL}/api/bff`;
```

### Use in Components
```typescript
import adminService from '../../services/adminService';

// Fetch dashboard data
const stats = await adminService.dashboard.getDashboardStats();
const users = await adminService.dashboard.getRecentUsers(5);
const orders = await adminService.dashboard.getRecentOrders(5);
```

## Key Features

### 1. Unified Dashboard Data
Single endpoint returns all dashboard statistics:
```
GET /api/bff/dashboard/stats
```

### 2. Graceful Degradation
If a service is down, BFF returns default values instead of failing completely.

### 3. Centralized Authentication
All requests require JWT token with admin role:
```
Authorization: Bearer <your-token>
```

### 4. Resource Management
CRUD operations for resources through BFF:
```
GET    /api/bff/resources
POST   /api/bff/resources
PUT    /api/bff/resources/:id
DELETE /api/bff/resources/:id
```

## Common Use Cases

### Get Dashboard Statistics
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3013/api/bff/dashboard/stats
```

### Get Recent Users
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3013/api/bff/dashboard/users/recent?limit=5
```

### Create a Resource
```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name":"Tractor","type":"machinery","hourlyRate":500,"location":"Farm A"}' \
     http://localhost:3013/api/bff/resources
```

## Troubleshooting

### Service Won't Start
- Check if port 3013 is available
- Verify all dependencies are installed
- Check logs in `logs/` directory

### Can't Connect to Backend Services
- Verify service URLs in `.env`
- Ensure backend services are running
- Check network connectivity

### Authentication Errors
- Verify JWT_SECRET matches other services
- Check token format: `Bearer <token>`
- Ensure user has admin role

## Next Steps

1. **Read Full Documentation**: See `README.md` for complete API reference
2. **Implementation Guide**: See `IMPLEMENTATION_GUIDE.md` for deployment details
3. **Test Endpoints**: Use Postman or curl to test all endpoints
4. **Monitor Logs**: Check `logs/` directory for any issues

## Support

- Check logs: `tail -f logs/combined.log`
- Health check: `curl http://localhost:3013/health`
- Review documentation in this directory

## Production Deployment

For production deployment:
1. Set `NODE_ENV=production`
2. Use strong JWT_SECRET
3. Configure HTTPS
4. Set up log rotation
5. Enable monitoring

See `IMPLEMENTATION_GUIDE.md` for detailed production setup.