const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Service URLs from environment
const serviceUrls = {
  'user-service': process.env.USER_SERVICE_URL || 'http://user-service:3002',
  'field-service': process.env.FIELD_SERVICE_URL || 'http://field-service:3003',
  'iot-service': process.env.IOT_SERVICE_URL || 'http://iot-service:3004',
  'crop-service': process.env.CROP_SERVICE_URL || 'http://crop-service:3005',
  'marketplace-service': process.env.MARKETPLACE_SERVICE_URL || 'http://marketplace-service:3006',
  'logistics-service': process.env.LOGISTICS_SERVICE_URL || 'http://logistics-service:3007',
  'weather-service': process.env.WEATHER_SERVICE_URL || 'http://weather-service:3008',
  'analytics-service': process.env.ANALYTICS_SERVICE_URL || 'http://analytics-service:3009',
  'notification-service': process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3010',
  'blockchain-service': process.env.BLOCKCHAIN_SERVICE_URL || 'http://blockchain-service:3011',
  'admin-service': process.env.ADMIN_SERVICE_URL || 'http://admin-service:3012'
};

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting - exclude auth routes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skip: (req) => req.path.startsWith('/api/auth/'),
  message: { error: 'Too many requests' }
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    services: Object.keys(serviceUrls)
  });
});

// Enhanced proxy configuration
const createServiceProxy = (serviceName, path) => createProxyMiddleware({
  target: serviceUrls[serviceName],
  changeOrigin: true,
  pathRewrite: { [`^${path}`]: path },
  onProxyReq: (proxyReq, req, res) => {
    // Forward all headers
    Object.keys(req.headers).forEach(key => {
      proxyReq.setHeader(key, req.headers[key]);
    });
    
    // Handle request body
    if (req.body && Object.keys(req.body).length > 0) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onError: (err, req, res) => {
    console.error(`Service ${serviceName} error:`, err);
    res.status(503).json({ error: `${serviceName} unavailable` });
  },
  timeout: 30000
});

// Routes
app.use('/api/admin', createServiceProxy('admin-service', '/api/admin'));
app.use('/api/auth', createServiceProxy('user-service', '/api/auth'));
app.use('/api/users', createServiceProxy('user-service', '/api/users'));
app.use('/api/fields', createServiceProxy('field-service', '/api/fields'));
app.use('/api/crops', createServiceProxy('crop-service', '/api/crops'));
app.use('/api/marketplace', createServiceProxy('marketplace-service', '/api/marketplace'));
app.use('/api/logistics', createServiceProxy('logistics-service', '/api/logistics'));
app.use('/api/iot', createServiceProxy('iot-service', '/api/iot'));
app.use('/api/weather', createServiceProxy('weather-service', '/api/weather'));
app.use('/api/analytics', createServiceProxy('analytics-service', '/api/analytics'));
app.use('/api/notifications', createServiceProxy('notification-service', '/api/notifications'));
app.use('/api/blockchain', createServiceProxy('blockchain-service', '/api/blockchain'));

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
});