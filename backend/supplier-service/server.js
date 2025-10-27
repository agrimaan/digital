const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();

const SERVICE_NAME = process.env.SERVICE_NAME || 'supplier-service';

// Using console.log for development instead of shared logger
const logger = {
  info: (msg, meta = {}) => console.log(`[${SERVICE_NAME}] ${msg}`, meta),
  error: (msg, meta = {}) => console.error(`[${SERVICE_NAME}] ${msg}`, meta),
  warn: (msg, meta = {}) => console.warn(`[${SERVICE_NAME}] ${msg}`, meta)
};

const app = express();
const PORT = process.env.PORT || 3006;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => logger.info('MongoDB connected'))
  .catch(err => logger.error('MongoDB connection error:', { error: err.message }));

// Health check route
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: SERVICE_NAME,
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/suppliers', require('./routes/supplierRoutes'));
app.use('/api/products', require('./routes/productRoutes'));

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', { error: err.stack });
  res.status(500).json({ 
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`${SERVICE_NAME} running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    mongoose.connection.close(false, () => {
      logger.info('MongoDB connection closed');
      process.exit(0);
    });
  });
});

module.exports = app;