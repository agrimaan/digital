const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');

// Authentication middleware
const authenticate = (req, res, next) => {
  // Skip authentication for login and register routes
  if (
    req.path === '/api/auth/login' || 
    req.path === '/api/auth/register' ||
    req.path === '/health' ||
    req.path.startsWith('/api/public')
  ) {
    return next();
  }

  const token = req.headers.authorization?.split(' ')[1];
  
  console.log('Authenticating request to:', req.path);
  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ message: 'Authentication required' });
  }
  console.log('Token provided:', token);

  try {
    // Verify token (in a real implementation, you'd use a shared secret)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallbacksecret');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Error handling for proxies
const handleProxyError = (err, req, res, next) => {
  console.error('Proxy Error:', err);
  
  if (err.code === 'ECONNREFUSED') {
    return res.status(503).json({ 
      message: 'Service unavailable',
      error: 'The requested service is currently unavailable. Please try again later.'
    });
  }
  
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
};

module.exports = (app) => {
  // Apply authentication middleware
  app.use(authenticate);
  
  // User Service Routes
  app.use('/api/auth', createProxyMiddleware({
    target: process.env.USER_SERVICE_URL || 'http://localhost:3002',
    changeOrigin: true,
    pathRewrite: {
      '^/api/auth': '/api/auth'
    },
    onError: handleProxyError
  }));
  
  app.use('/api/users', createProxyMiddleware({
    target: process.env.USER_SERVICE_URL || 'http://localhost:3002',
    changeOrigin: true,
    pathRewrite: {
      '^/api/users': '/api/users'
    },
    onError: handleProxyError
  }));
  
  // Field Service Routes
  app.use('/api/fields', createProxyMiddleware({
    target: process.env.FIELD_SERVICE_URL || 'http://localhost:3003',
    changeOrigin: true,
    pathRewrite: {
      '^/api/fields': '/api/fields'
    },
    onError: handleProxyError
  }));
  
  app.use('/api/soil', createProxyMiddleware({
    target: process.env.FIELD_SERVICE_URL || 'http://localhost:3003',
    changeOrigin: true,
    pathRewrite: {
      '^/api/soil': '/api/soil'
    },
    onError: handleProxyError
  }));
  
  app.use('/api/boundaries', createProxyMiddleware({
    target: process.env.FIELD_SERVICE_URL || 'http://localhost:3003',
    changeOrigin: true,
    pathRewrite: {
      '^/api/boundaries': '/api/boundaries'
    },
    onError: handleProxyError
  }));
  
  // IoT Service Routes
  app.use('/api/devices', createProxyMiddleware({
    target: process.env.IOT_SERVICE_URL || 'http://localhost:3004',
    changeOrigin: true,
    pathRewrite: {
      '^/api/devices': '/api/devices'
    },
    onError: handleProxyError
  }));
  
  app.use('/api/telemetry', createProxyMiddleware({
    target: process.env.IOT_SERVICE_URL || 'http://localhost:3004',
    changeOrigin: true,
    pathRewrite: {
      '^/api/telemetry': '/api/telemetry'
    },
    onError: handleProxyError
  }));
  
  app.use('/api/alerts', createProxyMiddleware({
    target: process.env.IOT_SERVICE_URL || 'http://localhost:3004',
    changeOrigin: true,
    pathRewrite: {
      '^/api/alerts': '/api/alerts'
    },
    onError: handleProxyError
  }));
  
  // Crop Service Routes
  app.use('/api/crops', createProxyMiddleware({
    target: process.env.CROP_SERVICE_URL || 'http://localhost:3005',
    changeOrigin: true,
    pathRewrite: {
      '^/api/crops': '/api/crops'
    },
    onError: handleProxyError
  }));
  
  app.use('/api/plantings', createProxyMiddleware({
    target: process.env.CROP_SERVICE_URL || 'http://localhost:3005',
    changeOrigin: true,
    pathRewrite: {
      '^/api/plantings': '/api/plantings'
    },
    onError: handleProxyError
  }));
  
  // Marketplace Service Routes
  app.use('/api/products', createProxyMiddleware({
    target: process.env.MARKETPLACE_SERVICE_URL || 'http://localhost:3006',
    changeOrigin: true,
    pathRewrite: {
      '^/api/products': '/api/products'
    },
    onError: handleProxyError
  }));
  
  app.use('/api/orders', createProxyMiddleware({
    target: process.env.MARKETPLACE_SERVICE_URL || 'http://localhost:3006',
    changeOrigin: true,
    pathRewrite: {
      '^/api/orders': '/api/orders'
    },
    onError: handleProxyError
  }));
  
  // Logistics Service Routes
  app.use('/api/shipments', createProxyMiddleware({
    target: process.env.LOGISTICS_SERVICE_URL || 'http://localhost:3007',
    changeOrigin: true,
    pathRewrite: {
      '^/api/shipments': '/api/shipments'
    },
    onError: handleProxyError
  }));
  
  app.use('/api/vehicles', createProxyMiddleware({
    target: process.env.LOGISTICS_SERVICE_URL || 'http://localhost:3007',
    changeOrigin: true,
    pathRewrite: {
      '^/api/vehicles': '/api/vehicles'
    },
    onError: handleProxyError
  }));
  
  // Weather Service Routes
  app.use('/api/weather', createProxyMiddleware({
    target: process.env.WEATHER_SERVICE_URL || 'http://localhost:3008',
    changeOrigin: true,
    pathRewrite: {
      '^/api/weather': '/api/weather'
    },
    onError: handleProxyError
  }));
  
  app.use('/api/forecasts', createProxyMiddleware({
    target: process.env.WEATHER_SERVICE_URL || 'http://localhost:3008',
    changeOrigin: true,
    pathRewrite: {
      '^/api/forecasts': '/api/forecasts'
    },
    onError: handleProxyError
  }));
  
  // Analytics Service Routes
  app.use('/api/analytics', createProxyMiddleware({
    target: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3009',
    changeOrigin: true,
    pathRewrite: {
      '^/api/analytics': '/api/analytics'
    },
    onError: handleProxyError
  }));
  
  app.use('/api/reports', createProxyMiddleware({
    target: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3009',
    changeOrigin: true,
    pathRewrite: {
      '^/api/reports': '/api/reports'
    },
    onError: handleProxyError
  }));
  
  // Notification Service Routes
  app.use('/api/notifications', createProxyMiddleware({
    target: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3010',
    changeOrigin: true,
    pathRewrite: {
      '^/api/notifications': '/api/notifications'
    },
    onError: handleProxyError
  }));
  
  // Blockchain Service Routes
  app.use('/api/blockchain', createProxyMiddleware({
    target: process.env.BLOCKCHAIN_SERVICE_URL || 'http://localhost:3011',
    changeOrigin: true,
    pathRewrite: {
      '^/api/blockchain': '/api/blockchain'
    },
    onError: handleProxyError
  }));
  
  app.use('/api/tokens', createProxyMiddleware({
    target: process.env.BLOCKCHAIN_SERVICE_URL || 'http://localhost:3011',
    changeOrigin: true,
    pathRewrite: {
      '^/api/tokens': '/api/tokens'
    },
    onError: handleProxyError
  }));
  
  // Admin Service Routes
  app.use('/api/admin', createProxyMiddleware({
    target: process.env.ADMIN_SERVICE_URL || 'http://localhost:3012',
    changeOrigin: true,
    pathRewrite: {
      '^/api/admin': '/api/admin'
    },
    onError: handleProxyError
  }));
};