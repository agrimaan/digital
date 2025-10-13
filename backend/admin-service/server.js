const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();

// Import routes
const adminRoutes = require('./routes/adminRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const dashboardStatsRoutes = require('./routes/dashboardStatsRoutes');
const reportRoutes = require('./routes/reportRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
//const dashboardDataRoutes = require('./routes/dashboardDataRoutes');

// Import logger
const logger = require('./utils/logger');
const { getSystemHealth } = require('./controllers/dashboardStatsController');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3012;

// Middleware
app.use(cors());
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
app.use('/api/admin/dashboards', dashboardRoutes);
app.use('/api/admin/dashboard', dashboardStatsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);

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
      '/api/admin/dashboard/stats',
      '/api/admin/settings',
      '/api/admin/system',
      '/api/admin/dashboards',
      '/api/reports',
      '/api/audit-logs',
      '/api/notifications',
      '/api/analytics'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Admin service running on port ${PORT}`);
});

module.exports = app; // For testing purposes