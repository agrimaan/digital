# API Gateway

This service acts as the API Gateway for the Agrimaan microservices architecture, routing requests to the appropriate microservices.

## Features

- Centralized API routing
- Authentication and authorization
- Rate limiting
- Request logging
- Error handling
- Service health checks

## API Routes

The API Gateway routes requests to the following microservices:

### User Service (3002)
- `/api/auth/*` - Authentication routes
- `/api/users/*` - User management routes

### Field Service (3003)
- `/api/fields/*` - Field management routes
- `/api/soil/*` - Soil information routes
- `/api/boundaries/*` - Field boundary routes

### IoT Service (3004)
- `/api/devices/*` - IoT device management routes
- `/api/telemetry/*` - Telemetry data routes
- `/api/alerts/*` - Alert management routes

### Crop Service (3005)
- `/api/crops/*` - Crop information routes
- `/api/plantings/*` - Planting management routes

### Marketplace Service (3006)
- `/api/products/*` - Product listing routes
- `/api/orders/*` - Order management routes

### Logistics Service (3007)
- `/api/shipments/*` - Shipment tracking routes
- `/api/vehicles/*` - Vehicle management routes

### Weather Service (3008)
- `/api/weather/*` - Current weather routes
- `/api/forecasts/*` - Weather forecast routes

### Analytics Service (3009)
- `/api/analytics/*` - Data analytics routes
- `/api/reports/*` - Report generation routes

### Notification Service (3010)
- `/api/notifications/*` - Notification management routes

### Blockchain Service (3011)
- `/api/blockchain/*` - Blockchain interaction routes
- `/api/tokens/*` - Token management routes

### Admin Service (3012)
- `/api/admin/*` - Administration routes

## Environment Variables

- `PORT` - Server port (default: 3000)
- `JWT_SECRET` - Secret key for JWT verification
- `USER_SERVICE_URL` - URL of the user service
- `FIELD_SERVICE_URL` - URL of the field service
- `IOT_SERVICE_URL` - URL of the IoT service
- `CROP_SERVICE_URL` - URL of the crop service
- `MARKETPLACE_SERVICE_URL` - URL of the marketplace service
- `LOGISTICS_SERVICE_URL` - URL of the logistics service
- `WEATHER_SERVICE_URL` - URL of the weather service
- `ANALYTICS_SERVICE_URL` - URL of the analytics service
- `NOTIFICATION_SERVICE_URL` - URL of the notification service
- `BLOCKCHAIN_SERVICE_URL` - URL of the blockchain service
- `ADMIN_SERVICE_URL` - URL of the admin service
- `NODE_ENV` - Environment (development, production)

## Setup and Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Set up environment variables:
   Create a `.env` file in the root directory with the required environment variables.

3. Start the service:
   ```
   npm start
   ```

   For development with auto-reload:
   ```
   npm run dev
   ```

## Docker

Build the Docker image:
```
docker build -t agrimaan/api-gateway .
```

Run the container:
```
docker run -p 3000:3000 -e JWT_SECRET=your_jwt_secret_key_here agrimaan/api-gateway
```

## Testing

Run tests:
```
npm test
```