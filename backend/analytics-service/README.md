# analytics Microservice

This microservice handles analytics management for the Agrimaan platform.

## Features

- Feature 1
- Feature 2
- Feature 3

## API Endpoints

- `GET /api/endpoint1` - Description
- `POST /api/endpoint2` - Description
- `PUT /api/endpoint3` - Description

## Environment Variables

- `PORT` - Server port (default: 3009)
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
docker build -t agrimaan/analytics-service .
```

Run the container:
```
docker run -p 3009:3009 -e MONGODB_URI=your_mongodb_uri -e USER_SERVICE_URL=http://user-service:3002 agrimaan/analytics-service
```

## Testing

Run tests:
```
npm test
```
