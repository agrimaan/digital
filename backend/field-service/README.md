# Field Microservice

This microservice handles agricultural field management, soil information, and field boundaries for the Agrimaan platform.

## Features

- Field management (creation, updates, deletion)
- Soil type information and classification
- Field boundary geospatial data
- Location-based field queries
- Soil-crop compatibility information

## API Endpoints

### Field Management

- `GET /api/fields` - Get all fields (filtered by user)
- `GET /api/fields/:id` - Get field by ID
- `POST /api/fields` - Create new field
- `PUT /api/fields/:id` - Update field
- `DELETE /api/fields/:id` - Delete field
- `GET /api/fields/nearby` - Get nearby fields based on coordinates

### Soil Management

- `GET /api/soil` - Get all soil types
- `GET /api/soil/:id` - Get soil type by ID
- `POST /api/soil` - Create new soil type (Admin/Agronomist only)
- `PUT /api/soil/:id` - Update soil type (Admin/Agronomist only)
- `DELETE /api/soil/:id` - Delete soil type (Admin/Agronomist only)
- `GET /api/soil/crop/:cropId` - Get soil types suitable for a specific crop

### Boundary Management

- `GET /api/boundaries` - Get all boundaries (Admin only)
- `GET /api/boundaries/:id` - Get boundary by ID
- `POST /api/boundaries` - Create new boundary
- `PUT /api/boundaries/:id` - Update boundary
- `DELETE /api/boundaries/:id` - Delete boundary
- `GET /api/boundaries/field/:fieldId` - Get boundaries by field

## Environment Variables

- `PORT` - Server port (default: 3003)
- `MONGODB_URI` - MongoDB connection string
- `USER_SERVICE_URL` - URL of the user service for authentication
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
docker build -t agrimaan/field-service .
```

Run the container:
```
docker run -p 3003:3003 -e MONGODB_URI=your_mongodb_uri -e USER_SERVICE_URL=http://user-service:3002 agrimaan/field-service
```

## Testing

Run tests:
```
npm test
```

## Dependencies

- Express - Web framework
- Mongoose - MongoDB object modeling
- GeoJSON - Geospatial data format
- JWT - Authentication
- Express Validator - Input validation