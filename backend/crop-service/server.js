const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();
// Import service discovery components
// Service Discovery Implementation
// const { ServiceRegistry, healthCheck } = require('@agrimaan/shared/service-discovery');
// 
// 
// 
/Import routes
// const cropRoutes = require('./routes/cropRoutes');
// const plantingRoutes = require('./routes/plantingRoutes');
// const harvestRoutes = require('./routes/harvestRoutes');
// 
/Initialize express app
// const app = express();
// const PORT = process.env.PORT || 3005;
// 
/Middleware
// app.use(cors());
// app.use(express.json());
// app.use(morgan('dev'));
/Add health check middleware
// //app.use(healthCheck);
// 
// 
/Connect to MongoDB
// mongoose.connect(process.env.MONGODB_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// })
// .then(() => console.log('MongoDB connected'))
// .catch(err => console.error('MongoDB connection error:', err));
// 
/Routes
// app.use('/api/crops', cropRoutes);
// app.use('/api/plantings', plantingRoutes);
// app.use('/api/harvests', harvestRoutes);
// 
/Health check endpoint
// app.get('/health', (req, res) => {
//   res.status(200).json({ status: 'UP', service: 'crop-service' });
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
  console.log(`Crop service running on port ${PORT}`);

  // Register service with Consul
//   const serviceRegistry = new ServiceRegistry({
//     serviceName: process.env.SERVICE_NAME || 'crop-service',
//     servicePort: PORT,
//     tags: ['api'],
//     healthCheckUrl: '/health',
//     healthCheckInterval: '15s'
//   });
  
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

