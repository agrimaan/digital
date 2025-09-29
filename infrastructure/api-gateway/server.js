
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { v4: uuidv4 } = require('uuid');
const routes = require('./routes');
require('dotenv').config();

// Simple proxy configuration without service registry
const serviceUrls = {
  'user-service': 'http://localhost:3002',
  'field-service': 'http://localhost:3003',
  'iot-service': 'http://localhost:3004',
  'crop-service': 'http://localhost:3005',
  'marketplace-service': 'http://localhost:3006',
  'logistics-service': 'http://localhost:3007',
  'weather-service': 'http://localhost:3008',
  'analytics-service': 'http://localhost:3009',
  'notification-service': 'http://localhost:3010',
  'blockchain-service': 'http://localhost:3011',
  'admin-service': 'http://localhost:3012'
};

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Proxy routes for backend services
app.use('/api/users', createProxyMiddleware({
  target: serviceUrls['user-service'],
  changeOrigin: true,
  pathRewrite: {
    '^/api/users': '/api/users'
  }
}));

app.use('/api/auth', createProxyMiddleware({
  target: serviceUrls['user-service'],
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '/api/auth'
  }
}));

// Additional proxy routes can be added here
app.use('/api/fields', createProxyMiddleware({
  target: serviceUrls['field-service'],
  changeOrigin: true,
  pathRewrite: {
    '^/api/fields': '/api/fields'
  }
}));

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server Error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log('Available services:');
  Object.keys(serviceUrls).forEach(service => {
    console.log(`  ${service} -> ${serviceUrls[service]}`);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

module.exports = app;
