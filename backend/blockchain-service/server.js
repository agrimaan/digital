const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();
// Import service discovery components
// Service Discovery Implementation
const ServiceRegistry = {
  register: async (serviceName, serviceUrl, consulHost, consulPort) => {
    console.log(`Registering service: ${serviceName} at ${serviceUrl}`);
    return Promise.resolve();
  },
  deregister: async (serviceName, consulHost, consulPort) => {
    console.log(`Deregistering service: ${serviceName}`);
    return Promise.resolve();
  }
};

const healthCheck = {
  start: (app, port, serviceName) => {
    console.log(`Health check started for ${serviceName} on port ${port}`);
  }
};

// Import routes
// const exampleRoutes = require('./routes/exampleRoutes');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3011;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
// Add health check middleware
app.use(healthCheck);


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
  res.status(200).json({ status: 'UP', service: 'blockchain-service' });
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
const server = app.listen(PORT, () => {
  console.log(`blockchain service running on port ${PORT}`);

  // Register service with Consul
  const serviceRegistry = new ServiceRegistry({
    serviceName: '""$SERVICE_NAME""',
    servicePort: PORT,
    tags: ['api'],
    healthCheckUrl: '/health',
    healthCheckInterval: '15s'
  });
  
  serviceRegistry.register()
    .then(() => {
      console.log('Service registered with Consul');
      // Setup graceful shutdown to deregister service
      serviceRegistry.setupGracefulShutdown(server);
    })
    .catch(err => {
      console.error('Failed to register service with Consul:', err);
    });
});

module.exports = app; // For testing purposes
