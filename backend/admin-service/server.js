const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();

// Import routes
const adminRoutes = require('./routes/adminRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const fieldRoutes = require('./routes/fieldRoutes');
const cropRoutes = require('./routes/cropRoutes');
const orderRoutes = require('./routes/orderRoutes');
const sensorRoutes = require('./routes/sensorRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const statsRoutes = require('./routes/statsRoutes');
const reportRoutes = require('./routes/reportRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const bulkUploadRoutes = require('./routes/bulkUploadRoutes');
const adminUserRoutes = require('./routes/adminUserRoutes');
const resourcesRoutes = require('./routes/resourceRoutes');


// Import logger
const logger = require('./utils/logger');
//const { getSystemHealth } = require('./controllers/statsController');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3012;

// Middleware
//app.use(cors());
app.use(cors({
  origin: ['http://localhost:5173','http://localhost:3000'], // your FE origin(s)
  credentials: true,
  methods: ['GET','POST','PATCH','DELETE','PUT','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));
app.use(express.json());
app.use(morgan('combined', { stream: logger.stream }));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => logger.info('MongoDB connected'))
.catch(err => logger.error('MongoDB connection error:', err));

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/admin/reports', reportRoutes);
app.use('/api/admin/audit-logs', auditLogRoutes);
app.use('/api/admin/notifications', notificationRoutes);
app.use('/api/admin/analytics', analyticsRoutes);
app.use('/api/admin/bulk-uploads', bulkUploadRoutes);
app.use('/api/admin/settings', settingsRoutes);
app.use('/api/admin/stats', statsRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/resources', resourcesRoutes);
app.use('/api/admin/fields', fieldRoutes);
app.use('/api/admin/crops', cropRoutes);
app.use('/api/admin/orders', orderRoutes);
app.use('/api/admin/sensors', sensorRoutes);



// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'admin-service' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'Admin Service',
    version: '1.0.0',
    endpoints: [
      '/api/admins',
      '/api/admin/dashboard',
      '/api/admin/dashboard/stats',
      '/api/admin/dashboard/users/stats',
      '/api/admin/dashboard/fields/stats',
      '/api/admin/dashboard/crops/stats',
      '/api/admin/dashboard/sensors/stats',
      '/api/admin/reports',
      '/api/admin/audit-logs',
      '/api/admin/notifications',
      '/api/admin/analytics',
      '/api/admin/settings',
      '/api/admin/stats',
      '/api/admin/users',
      '/api/admin/resources',
      '/api/admin/bulk-uploads',
      '/api/admin/verification/pending',
      '/api/admin/users/recent',
      '/api/admin/orders/recent',
      '/api/admin/system/health',
      '/api/admin/bulk-uploads/stats',

      
      '/health',
      '/'
    ]
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

module.exports = app; // For testing purposes