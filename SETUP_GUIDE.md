# Agrimaan Digital - Setup Guide

This guide will help you set up and run the Agrimaan Digital platform with all admin functionalities working correctly.

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5.0 or higher)
- Docker and Docker Compose (optional, for containerized setup)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/agrimaan/digital.git
cd digital
```

### 2. Install Dependencies

```bash
# Install backend dependencies
cd backend/admin-service && npm install && cd ../..
cd backend/user-service && npm install && cd ../..
cd backend/field-service && npm install && cd ../..
cd backend/crop-service && npm install && cd ../..
cd backend/iot-service && npm install && cd ../..
cd backend/marketplace-service && npm install && cd ../..
cd backend/reference-data-service && npm install && cd ../..

# Install frontend dependencies
cd frontend && npm install && cd ..

# Install API Gateway dependencies
cd infrastructure/api-gateway && npm install && cd ../..
```

### 3. Configure Environment Variables

#### Backend Services

Each backend service needs a `.env` file. Copy the example and update as needed:

```bash
# Admin Service
cd backend/admin-service
cp .env.example .env  # If .env.example exists, otherwise create .env
```

**Required Environment Variables for Admin Service:**

```env
SERVICE_NAME=admin-service
PORT=3012
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27018/agrimaan-admin-service
JWT_SECRET=your_jwt_secret_here

# Service URLs (for local development)
USER_SERVICE_URL=http://localhost:3002
FIELD_SERVICE_URL=http://localhost:3003
IOT_SERVICE_URL=http://localhost:3004
CROP_SERVICE_URL=http://localhost:3005
MARKETPLACE_SERVICE_URL=http://localhost:3006
REFERENCE_SERVICE_URL=http://localhost:3013

# Consul (optional - will fallback to direct URLs if unavailable)
CONSUL_HOST=localhost
CONSUL_PORT=8500
```

#### Frontend

```bash
cd frontend
```

Create/update `.env`:

```env
REACT_APP_API_URL=http://localhost:3000
PORT=5173
```

#### API Gateway

```bash
cd infrastructure/api-gateway
```

Create/update `.env`:

```env
PORT=3000
NODE_ENV=development

# Service URLs
USER_SERVICE_URL=http://localhost:3002
FIELD_SERVICE_URL=http://localhost:3003
IOT_SERVICE_URL=http://localhost:3004
CROP_SERVICE_URL=http://localhost:3005
MARKETPLACE_SERVICE_URL=http://localhost:3006
LOGISTICS_SERVICE_URL=http://localhost:3007
WEATHER_SERVICE_URL=http://localhost:3008
ANALYTICS_SERVICE_URL=http://localhost:3009
NOTIFICATION_SERVICE_URL=http://localhost:3010
BLOCKCHAIN_SERVICE_URL=http://localhost:3011
ADMIN_SERVICE_URL=http://localhost:3012
REFERENCE_DATA_SERVICE_URL=http://localhost:3013
```

### 4. Start MongoDB

#### Option A: Using Docker

```bash
docker run -d \
  --name agrimaan-mongodb \
  -p 27018:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=admin123 \
  mongo:7.0
```

#### Option B: Local MongoDB

Ensure MongoDB is running on `localhost:27017` (or update connection strings accordingly)

### 5. Seed Initial Data

This will create:
- System settings
- Initial admin user (admin@agrimaan.com / Admin@123)
- Reference data (crop types, sensor types, etc.)

```bash
# From project root
npm run seed
```

Or seed individually:

```bash
# Seed reference data
npm run seed:reference

# Seed admin data
npm run seed:admin
```

### 6. Start Services

#### Option A: Start All Services with Docker Compose

```bash
docker-compose up -d
```

#### Option B: Start Services Individually (Development)

Open multiple terminal windows:

**Terminal 1 - API Gateway:**
```bash
cd infrastructure/api-gateway
npm start
```

**Terminal 2 - Admin Service:**
```bash
cd backend/admin-service
npm run dev
```

**Terminal 3 - User Service:**
```bash
cd backend/user-service
npm run dev
```

**Terminal 4 - Field Service:**
```bash
cd backend/field-service
npm run dev
```

**Terminal 5 - Crop Service:**
```bash
cd backend/crop-service
npm run dev
```

**Terminal 6 - IoT Service:**
```bash
cd backend/iot-service
npm run dev
```

**Terminal 7 - Marketplace Service:**
```bash
cd backend/marketplace-service
npm run dev
```

**Terminal 8 - Reference Data Service:**
```bash
cd backend/reference-data-service
npm run dev
```

**Terminal 9 - Frontend:**
```bash
cd frontend
npm start
```

### 7. Access the Application

- **Frontend:** http://localhost:5173
- **API Gateway:** http://localhost:3000
- **Admin Service:** http://localhost:3012

### 8. Login to Admin Panel

Use the seeded admin credentials:
- **Email:** admin@agrimaan.com
- **Password:** Admin@123

⚠️ **Important:** Change the default password after first login!

## Service Architecture

### Backend Services

| Service | Port | Purpose |
|---------|------|---------|
| API Gateway | 3000 | Central entry point for all API requests |
| User Service | 3002 | User management and authentication |
| Field Service | 3003 | Field/land management |
| IoT Service | 3004 | Sensor and IoT device management |
| Crop Service | 3005 | Crop lifecycle management |
| Marketplace Service | 3006 | Order and marketplace operations |
| Logistics Service | 3007 | Delivery and logistics |
| Weather Service | 3008 | Weather data integration |
| Analytics Service | 3009 | Analytics and reporting |
| Notification Service | 3010 | Email/SMS notifications |
| Blockchain Service | 3011 | Blockchain and tokenization |
| Admin Service | 3012 | Admin operations and dashboard |
| Reference Data Service | 3013 | Reference data management |

### Admin Pages

The following admin pages are available:

1. **Dashboard** - Overview and statistics
2. **Users** - User management (CRUD)
3. **Fields** - Field management
4. **Crops** - Crop management
5. **Sensors** - IoT sensor management
6. **Orders** - Order management
7. **Tokens** - Blockchain token management
8. **Bulk Uploads** - Bulk data upload
9. **Resources** - Resource management
10. **Reports** - Report generation
11. **Settings** - System settings
12. **Verification** - User verification

## Troubleshooting

### Service Discovery Issues

If you see "Service not found" errors:

1. The system will automatically fallback to direct URLs from environment variables
2. Ensure all service URLs are correctly configured in `.env` files
3. Verify services are running on their configured ports

### Database Connection Issues

1. Check MongoDB is running: `docker ps` or `mongosh`
2. Verify connection string in `.env` files
3. Ensure MongoDB port (27018 or 27017) is not blocked

### CORS Issues

If you see CORS errors:

1. Ensure API Gateway is running
2. Check CORS configuration in `infrastructure/api-gateway/server.js`
3. Verify frontend is accessing API through the gateway (port 3000)

### Port Conflicts

If ports are already in use:

1. Update port numbers in `.env` files
2. Update service URLs accordingly
3. Restart affected services

## Development Workflow

### Making Changes

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Test locally
4. Commit: `git commit -m "Description of changes"`
5. Push: `git push origin feature/your-feature`
6. Create a Pull Request

### Testing Admin Pages

1. Login to admin panel
2. Navigate to each admin page
3. Test CRUD operations
4. Verify data persistence
5. Check error handling

## Production Deployment

For production deployment:

1. Update all environment variables for production
2. Use production MongoDB instance
3. Enable HTTPS
4. Configure proper authentication
5. Set up monitoring and logging
6. Use Docker Compose or Kubernetes for orchestration

## Support

For issues or questions:
- Create an issue on GitHub
- Contact: support@agrimaan.com

## License

[Your License Here]