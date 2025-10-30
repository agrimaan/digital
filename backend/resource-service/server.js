const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3014;

const SERVICE_NAME = process.env.SERVICE_NAME || 'resource-service';
// Using console.log for development instead of shared logger
const logger = {
  info: (msg, meta = {}) => console.log(`[${SERVICE_NAME}] ${msg}`, meta),
  error: (msg, meta = {}) => console.error(`[${SERVICE_NAME}] ${msg}`, meta),
  warn: (msg, meta = {}) => console.warn(`[${SERVICE_NAME}] ${msg}`, meta)
};

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5007'],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(morgan('combined'));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/resources', require('./routes/resourceRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'UP', 
    service: 'resource-service',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'Resource Service',
    version: '1.0.0',
    endpoints: [
      '/api/resources',
      '/api/bookings',
      '/health'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Resource service running on port ${PORT}`);
});

module.exports = app;
