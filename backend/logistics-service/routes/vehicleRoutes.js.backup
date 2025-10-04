const express = require('express');
const router = express.Router();
const {
  createVehicle,
  getVehicles,
  getVehicle,
  updateVehicle,
  deleteVehicle,
  updateLocation,
  updateStatus,
  getVehiclesByLocation,
  getAvailableVehicles,
  getVehicleStats
} = require('../controllers/vehicleController');
const { vehicleValidation, handleValidationErrors } = require('../middleware/validation');

// Public routes
router.get('/', getVehicles);
router.get('/location', getVehiclesByLocation);
router.get('/available', getAvailableVehicles);
router.get('/stats', getVehicleStats);
router.get('/:id', getVehicle);

// Protected routes with validation
router.post('/', 
  vehicleValidation.create, 
  handleValidationErrors, 
  createVehicle
);
router.put('/:id', 
  vehicleValidation.update, 
  handleValidationErrors, 
  updateVehicle
);
router.delete('/:id', deleteVehicle);
router.patch('/:id/location', 
  vehicleValidation.updateLocation, 
  handleValidationErrors, 
  updateLocation
);
router.patch('/:id/status', 
  vehicleValidation.updateStatus, 
  handleValidationErrors, 
  updateStatus
);

module.exports = router;