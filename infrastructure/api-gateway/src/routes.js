const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');

// Authentication middleware
const authenticate = (req, res, next) => {
  console.log('Incoming request within routes.js123:', req.method, req.path);
  // Skip authentication for login, register, health, and public routes
  if (
    req.path === '/api/auth/login' ||
    req.path === '/api/auth/register' ||
    req.path === '/api/auth/me' ||  // Add this if it should be public
    req.path === '/health' ||
    req.path === '/favicon.ico' ||  // Add this
    req.path === '/logo192.png' ||  // Add this
    req.path.startsWith('/api/public') ||
    req.path.startsWith('/static/')  // Add this for static files
  ) {
    return next();
  }

  const token = req.headers.authorization?.split(' ')[1];
  console.log ('token is:', token);


  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
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
  app.use(authenticate);

  // ---------------------------
  // USER SERVICE
  // ---------------------------

  app.use('/api/auth', createProxyMiddleware({
    target: process.env.USER_SERVICE_URL || 'http://localhost:3002',
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: { '^/api/auth': '/api/auth' },
    onError: handleProxyError,

    // Forward JSON body to the backend
    onProxyReq: (proxyReq, req, res) => {
      if (req.body && Object.keys(req.body).length) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
      console.log(`➡️ Proxying request: ${req.method} ${req.originalUrl}`);
    }
  }));


  app.use('/api/users', createProxyMiddleware({
    target: process.env.USER_SERVICE_URL || 'http://localhost:3002',
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: { '^/api/users': '/users' },
    onError: handleProxyError
  }));

  // ---------------------------
  // FIELD SERVICE
  // ---------------------------
  app.use('/api/fields', createProxyMiddleware({
    target: process.env.FIELD_SERVICE_URL || 'http://localhost:3003',
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: { '^/api/fields': '/api/fields' },
    onError: handleProxyError,
    onProxyReq: (proxyReq, req, res) => {
      if (req.body && Object.keys(req.body).length) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
      console.log(`➡️ Proxying request: ${req.method} ${req.originalUrl}`);
    }
  }));

  // ---------------------------
  // CROP SERVICE
  // ---------------------------
  app.use('/api/crops', createProxyMiddleware({
    target: process.env.CROP_SERVICE_URL || 'http://localhost:3005',
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: { '^/api/crops': '/api/crops' },
    onError: handleProxyError,
    onProxyReq: (proxyReq, req, res) => {
      if (req.body && Object.keys(req.body).length) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
      console.log(`➡️ Proxying request: ${req.method} ${req.originalUrl}`);
    }
    
  }));

  app.use('/api/soil', createProxyMiddleware({
    target: process.env.FIELD_SERVICE_URL || 'http://localhost:3003',
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: { '^/api/soil': '/soil' },
    onError: handleProxyError
  }));

  app.use('/api/boundaries', createProxyMiddleware({
    target: process.env.FIELD_SERVICE_URL || 'http://localhost:3003',
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: { '^/api/boundaries': '/boundaries' },
    onError: handleProxyError
  }));

  // ---------------------------
  // IOT SERVICE
  // ---------------------------
  app.use('/api/devices', createProxyMiddleware({
    target: process.env.IOT_SERVICE_URL || 'http://localhost:3004',
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: { '^/api/devices': '/devices' },
    onError: handleProxyError
  }));

  app.use('/api/telemetry', createProxyMiddleware({
    target: process.env.IOT_SERVICE_URL || 'http://localhost:3004',
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: { '^/api/telemetry': '/telemetry' },
    onError: handleProxyError
  }));

  app.use('/api/alerts', createProxyMiddleware({
    target: process.env.IOT_SERVICE_URL || 'http://localhost:3004',
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: { '^/api/alerts': '/alerts' },
    onError: handleProxyError
  }));

  app.use('/api/plantings', createProxyMiddleware({
    target: process.env.CROP_SERVICE_URL || 'http://localhost:3005',
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: { '^/api/plantings': '/plantings' },
    onError: handleProxyError
  }));

  // ---------------------------
  // MARKETPLACE SERVICE
  // ---------------------------
  app.use('/api/products', createProxyMiddleware({
    target: process.env.MARKETPLACE_SERVICE_URL || 'http://localhost:3006',
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: { '^/api/products': '/products' },
    onError: handleProxyError
  }));

  app.use('/api/orders', createProxyMiddleware({
    target: process.env.MARKETPLACE_SERVICE_URL || 'http://localhost:3006',
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: { '^/api/orders': '/orders' },
    onError: handleProxyError
  }));

  // ---------------------------
  // LOGISTICS SERVICE
  // ---------------------------
  app.use('/api/shipments', createProxyMiddleware({
    target: process.env.LOGISTICS_SERVICE_URL || 'http://localhost:3007',
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: { '^/api/shipments': '/shipments' },
    onError: handleProxyError
  }));

  app.use('/api/vehicles', createProxyMiddleware({
    target: process.env.LOGISTICS_SERVICE_URL || 'http://localhost:3007',
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: { '^/api/vehicles': '/vehicles' },
    onError: handleProxyError
  }));

  // ---------------------------
  // WEATHER SERVICE
  // ---------------------------
  app.use('/api/weather', createProxyMiddleware({
    target: process.env.WEATHER_SERVICE_URL || 'http://localhost:3008',
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: { '^/api/weather': '/weather' },
    onError: handleProxyError
  }));

  app.use('/api/forecasts', createProxyMiddleware({
    target: process.env.WEATHER_SERVICE_URL || 'http://localhost:3008',
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: { '^/api/forecasts': '/forecasts' },
    onError: handleProxyError
  }));

  // ---------------------------
  // ANALYTICS SERVICE
  // ---------------------------
  app.use('/api/analytics', createProxyMiddleware({
    target: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3009',
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: { '^/api/analytics': '/analytics' },
    onError: handleProxyError
  }));

  app.use('/api/reports', createProxyMiddleware({
    target: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3009',
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: { '^/api/reports': '/reports' },
    onError: handleProxyError
  }));

  // ---------------------------
  // NOTIFICATION SERVICE
  // ---------------------------
  app.use('/api/notifications', createProxyMiddleware({
    target: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3010',
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: { '^/api/notifications': '/notifications' },
    onError: handleProxyError
  }));

  // ---------------------------
  // BLOCKCHAIN SERVICE
  // ---------------------------
  app.use('/api/blockchain', createProxyMiddleware({
    target: process.env.BLOCKCHAIN_SERVICE_URL || 'http://localhost:3011',
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: { '^/api/blockchain': '/blockchain' },
    onError: handleProxyError
  }));

  app.use('/api/tokens', createProxyMiddleware({
    target: process.env.BLOCKCHAIN_SERVICE_URL || 'http://localhost:3011',
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: { '^/api/tokens': '/tokens' },
    onError: handleProxyError
  }));

  // ---------------------------
     // REFERENCE DATA SERVICE
     // ---------------------------
     app.use('/api/reference', createProxyMiddleware({
       target: process.env.REFERENCE_DATA_SERVICE_URL || 'http://localhost:3013',
       changeOrigin: true,
       logLevel: 'debug',
       pathRewrite: { '^/api/reference': '/api/reference' },
       onError: handleProxyError,
   
       // Forward JSON body to the backend
       onProxyReq: (proxyReq, req, res) => {
         if (req.body && Object.keys(req.body).length) {
           const bodyData = JSON.stringify(req.body);
           proxyReq.setHeader('Content-Type', 'application/json');
           proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
           proxyReq.write(bodyData);
         }
   
         console.log(`➡️ Proxying request: ${req.method} ${req.originalUrl}`);
       }
     }));

  // ---------------------------
  // ADMIN SERVICE
  // ---------------------------

  app.use('/api/admin', createProxyMiddleware({
    target: process.env.ADMIN_SERVICE_URL || 'http://localhost:3012',
    changeOrigin: true,
    logLevel: 'debug', 
    pathRewrite: { '^/api/admin': '/api/admin' },
    onError: handleProxyError,

    // Forward JSON body to the backend
    onProxyReq: (proxyReq, req, res) => {
      if (req.body && Object.keys(req.body).length) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }

      console.log(`➡️ Proxying request: ${req.method} ${req.originalUrl}`);
    }
  }));
}
