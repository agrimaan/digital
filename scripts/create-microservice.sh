#!/bin/bash

# Script to create a new microservice with the proper structure

# Check if service name is provided
if [ -z "$1" ]; then
  echo "Usage: ./create-microservice.sh <service-name> <port-number>"
  exit 1
fi

# Check if port number is provided
if [ -z "$2" ]; then
  echo "Usage: ./create-microservice.sh <service-name> <port-number>"
  exit 1
fi

SERVICE_NAME=$1
PORT_NUMBER=$2
SERVICE_DIR="$SERVICE_NAME-service"

# Create service directory if it doesn't exist
if [ -d "$SERVICE_DIR" ]; then
  echo "Service directory $SERVICE_DIR already exists."
  exit 1
fi

echo "Creating microservice: $SERVICE_NAME on port $PORT_NUMBER..."

# Create directory structure
mkdir -p $SERVICE_DIR/{models,controllers,routes,services,config,middleware,utils,tests}

# Create basic files
touch $SERVICE_DIR/server.js
touch $SERVICE_DIR/.env
touch $SERVICE_DIR/.gitignore
touch $SERVICE_DIR/Dockerfile
touch $SERVICE_DIR/package.json
touch $SERVICE_DIR/README.md

# Create package.json
cat > $SERVICE_DIR/package.json << EOF
{
  "name": "$SERVICE_NAME-service",
  "version": "1.0.0",
  "description": "$SERVICE_NAME management microservice for Agrimaan platform",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-validator": "^7.0.1",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^7.5.0",
    "morgan": "^1.10.0",
    "axios": "^1.5.0"
  },
  "devDependencies": {
    "jest": "^29.6.4",
    "nodemon": "^3.0.1",
    "supertest": "^6.3.3"
  }
}
EOF

# Create .env file
cat > $SERVICE_DIR/.env << EOF
PORT=$PORT_NUMBER
MONGODB_URI=mongodb://localhost:27017/agrimaan-$SERVICE_NAME-service
USER_SERVICE_URL=http://localhost:3002
NODE_ENV=development
EOF

# Create .gitignore
cat > $SERVICE_DIR/.gitignore << EOF
# Dependencies
node_modules/
npm-debug.log
yarn-error.log
yarn-debug.log
package-lock.json

# Environment variables
#.env
#.env.local
#.env.development
#.env.test
#.env.production

# Build files
dist/
build/

# Logs
logs/
*.log

# Testing
coverage/

# IDE
.idea/
.vscode/
*.sublime-project
*.sublime-workspace

# OS files
.DS_Store
Thumbs.db
EOF

# Create Dockerfile
cat > $SERVICE_DIR/Dockerfile << EOF
FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy app source code
COPY . .

# Expose the service port
EXPOSE $PORT_NUMBER

# Start the service
CMD ["npm", "start"]
EOF

# Create server.js
cat > $SERVICE_DIR/server.js << EOF
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();

// Import routes
// const exampleRoutes = require('./routes/exampleRoutes');

// Initialize express app
const app = express();
const PORT = process.env.PORT || $PORT_NUMBER;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
// app.use('/api/examples', exampleRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: '$SERVICE_NAME-service' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Start server
app.listen(PORT, () => {
  console.log(\`$SERVICE_NAME service running on port \${PORT}\`);
});

module.exports = app; // For testing purposes
EOF

# Create database.js
cat > $SERVICE_DIR/config/database.js << EOF
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log(\`MongoDB Connected: \${conn.connection.host}\`);
  } catch (error) {
    console.error(\`Error connecting to MongoDB: \${error.message}\`);
    process.exit(1);
  }
};

module.exports = connectDB;
EOF

# Create auth middleware
cat > $SERVICE_DIR/middleware/auth.js << EOF
const jwt = require('jsonwebtoken');
const axios = require('axios');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  // Check if auth header exists and has the correct format
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallbacksecret');

    // Get user from the token
    // Since this is a microservice, we need to fetch user data from the user service
    try {
      const response = await axios.get(\`\${process.env.USER_SERVICE_URL}/api/auth/me\`, {
        headers: {
          Authorization: \`Bearer \${token}\`
        }
      });

      req.user = response.data.data;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'User not found or user service unavailable'
      });
    }
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: \`User role \${req.user.role} is not authorized to access this route\`
      });
    }
    next();
  };
};
EOF

# Create response handler utility
cat > $SERVICE_DIR/utils/responseHandler.js << EOF
/**
 * Standard success response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {Object|Array} data - Response data
 * @param {string} message - Success message
 * @returns {Object} Response object
 */
exports.success = (res, statusCode = 200, data = {}, message = 'Success') => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Standard error response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {Object} error - Error details
 * @returns {Object} Response object
 */
exports.error = (res, statusCode = 500, message = 'Server Error', error = {}) => {
  // Log error for server-side debugging
  console.error(\`Error: \${message}\`, error);
  
  return res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? error : {}
  });
};

/**
 * Not found response
 * @param {Object} res - Express response object
 * @param {string} message - Not found message
 * @returns {Object} Response object
 */
exports.notFound = (res, message = 'Resource not found') => {
  return exports.error(res, 404, message);
};

/**
 * Unauthorized response
 * @param {Object} res - Express response object
 * @param {string} message - Unauthorized message
 * @returns {Object} Response object
 */
exports.unauthorized = (res, message = 'Not authorized to access this resource') => {
  return exports.error(res, 401, message);
};

/**
 * Forbidden response
 * @param {Object} res - Express response object
 * @param {string} message - Forbidden message
 * @returns {Object} Response object
 */
exports.forbidden = (res, message = 'Forbidden access') => {
  return exports.error(res, 403, message);
};

/**
 * Bad request response
 * @param {Object} res - Express response object
 * @param {string} message - Bad request message
 * @param {Object} errors - Validation errors
 * @returns {Object} Response object
 */
exports.badRequest = (res, message = 'Bad request', errors = {}) => {
  return exports.error(res, 400, message, errors);
};
EOF

# Create README.md
cat > $SERVICE_DIR/README.md << EOF
# $SERVICE_NAME Microservice

This microservice handles $SERVICE_NAME management for the Agrimaan platform.

## Features

- Feature 1
- Feature 2
- Feature 3

## API Endpoints

- \`GET /api/endpoint1\` - Description
- \`POST /api/endpoint2\` - Description
- \`PUT /api/endpoint3\` - Description

## Environment Variables

- \`PORT\` - Server port (default: $PORT_NUMBER)
- \`MONGODB_URI\` - MongoDB connection string
- \`USER_SERVICE_URL\` - URL of the user service for authentication
- \`NODE_ENV\` - Environment (development, production)

## Setup and Installation

1. Install dependencies:
   \`\`\`
   npm install
   \`\`\`

2. Set up environment variables:
   Create a \`.env\` file in the root directory with the required environment variables.

3. Start the service:
   \`\`\`
   npm start
   \`\`\`

   For development with auto-reload:
   \`\`\`
   npm run dev
   \`\`\`

## Docker

Build the Docker image:
\`\`\`
docker build -t agrimaan/$SERVICE_NAME-service .
\`\`\`

Run the container:
\`\`\`
docker run -p $PORT_NUMBER:$PORT_NUMBER -e MONGODB_URI=your_mongodb_uri -e USER_SERVICE_URL=http://user-service:3002 agrimaan/$SERVICE_NAME-service
\`\`\`

## Testing

Run tests:
\`\`\`
npm test
\`\`\`
EOF

echo "Microservice $SERVICE_NAME created successfully!"
echo "Directory structure:"
find $SERVICE_DIR -type f | sort

echo ""
echo "Next steps:"
echo "1. cd $SERVICE_DIR"
echo "2. npm install"
echo "3. Create your models, controllers, services, and routes"
echo "4. Update server.js to include your routes"
echo "5. npm run dev to start development"