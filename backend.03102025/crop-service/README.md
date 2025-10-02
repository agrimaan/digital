# Crop Microservice

This microservice handles crop management, planting schedules, and harvest tracking for the Agrimaan platform.

## Features

- Crop information management
- Planting schedule management
- Harvest tracking and reporting
- Crop recommendations based on field conditions
- Growth stage monitoring
- Yield tracking and analysis

## API Endpoints

### Crop Management

- `GET /api/crops` - Get all crops
- `GET /api/crops/:id` - Get crop by ID
- `POST /api/crops` - Create new crop (Admin/Agronomist only)
- `PUT /api/crops/:id` - Update crop (Admin/Agronomist only)
- `DELETE /api/crops/:id` - Delete crop (Admin only)
- `GET /api/crops/category/:category` - Get crops by category
- `GET /api/crops/soil/:soilType` - Get crops by soil type
- `GET /api/crops/season/:month` - Get crops by planting season
- `GET /api/crops/search/:term` - Search crops by name
- `POST /api/crops/recommendations` - Get crop recommendations based on conditions

### Planting Management

- `GET /api/plantings` - Get all plantings
- `GET /api/plantings/:id` - Get planting by ID
- `POST /api/plantings` - Create new planting
- `PUT /api/plantings/:id` - Update planting
- `DELETE /api/plantings/:id` - Delete planting
- `GET /api/plantings/field/:fieldId` - Get plantings by field
- `GET /api/plantings/crop/:cropId` - Get plantings by crop
- `PUT /api/plantings/:id/status` - Update planting status
- `POST /api/plantings/:id/observations` - Add growth observation
- `GET /api/plantings/statistics` - Get planting statistics
- `GET /api/plantings/upcoming` - Get upcoming plantings
- `GET /api/plantings/ready-for-harvest` - Get plantings ready for harvest

### Harvest Management

- `GET /api/harvests` - Get all harvests
- `GET /api/harvests/:id` - Get harvest by ID
- `POST /api/harvests` - Create new harvest
- `PUT /api/harvests/:id` - Update harvest
- `DELETE /api/harvests/:id` - Delete harvest
- `GET /api/harvests/field/:fieldId` - Get harvests by field
- `GET /api/harvests/crop/:cropId` - Get harvests by crop
- `PUT /api/harvests/:id/status` - Update harvest status
- `GET /api/harvests/statistics` - Get harvest statistics
- `GET /api/harvests/upcoming` - Get upcoming harvests

## Environment Variables

- `PORT` - Server port (default: 3005)
- `MONGODB_URI` - MongoDB connection string
- `USER_SERVICE_URL` - URL of the user service for authentication
- `FIELD_SERVICE_URL` - URL of the field service for field data
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
docker build -t agrimaan/crop-service .
```

Run the container:
```
docker run -p 3005:3005 -e MONGODB_URI=your_mongodb_uri -e USER_SERVICE_URL=http://user-service:3002 -e FIELD_SERVICE_URL=http://field-service:3003 agrimaan/crop-service
```

## Testing

Run tests:
```
npm test
```

## Dependencies

- Express - Web framework
- Mongoose - MongoDB object modeling
- JWT - Authentication
- Express Validator - Input validation
- Axios - HTTP client for service communication