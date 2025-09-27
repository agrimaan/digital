# User Microservice

This microservice handles user management, authentication, and authorization for the Agrimaan platform.

## Features

- User registration and authentication
- Role-based access control
- User profile management
- Password reset functionality
- JWT token authentication

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/forgotpassword` - Request password reset
- `PUT /api/auth/resetpassword/:resettoken` - Reset password

### User Management

- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user (Admin only)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin only)

## Environment Variables

- `PORT` - Server port (default: 3002)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT token generation
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
docker build -t agrimaan/user-service .
```

Run the container:
```
docker run -p 3002:3002 -e MONGODB_URI=your_mongodb_uri -e JWT_SECRET=your_jwt_secret agrimaan/user-service
```

## Testing

Run tests:
```
npm test
```