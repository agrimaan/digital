const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const logger = require('./utils/logger');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3013;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { 
  stream: { 
    write: (message) => logger.info(message.trim()) 
  } 
}));

// Import routes
const dashboardRoutes = require('./routes/dashboardRoutes');
const resourceRoutes = require('./routes/resourceRoutes');

// Routes
app.use('/api/admin/bff/dashboard', dashboardRoutes);
app.use('/api/admin/bff/resources', resourceRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'UP', 
    service: 'admin-bff',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'Admin BFF (Backend for Frontend)',
    version: '1.0.0',
    description: 'Aggregates data from multiple backend services for the admin dashboard',
    endpoints: [
      '/api/admin/bff/dashboard - Complete dashboard data',
      '/api/admin/bff/dashboard/stats - Dashboard statistics',
      '/api/admin/bff/dashboard/users/recent - Recent users',
      '/api/admin/bff/dashboard/orders/recent - Recent orders',
      '/api/admin/bff/dashboard/verification/pending - Pending verifications',
      '/api/admin/bff/dashboard/system/health - System health',
      '/api/admin/bff/dashboard/resources - All resources',
      '/api/admin/bff/dashboard/land-tokens - All land tokens',
      '/api/admin/bff/dashboard/bulk-uploads - All bulk uploads',
      '/api/admin/bff/resources - Resource management'
    ]
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });

  // Handle service unavailable errors
  if (err.error === 'SERVICE_UNAVAILABLE') {
    return res.status(503).json({
      success: false,
      message: err.message,
      service: err.service
    });
  }

  // Handle other errors
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Admin BFF service running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

module.exports = app;