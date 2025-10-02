const express = require('express');
const router = express.Router();
const {
  createShipment,
  getShipments,
  getShipment,
  updateShipment,
  deleteShipment,
  assignVehicle,
  updateStatus,
  getShipmentsByLocation
} = require('../controllers/shipmentController');
const { shipmentValidation, handleValidationErrors } = require('../middleware/validation');

// Public routes
router.get('/', getShipments);
router.get('/location', getShipmentsByLocation);
router.get('/:id', getShipment);

// Protected routes with validation
router.post('/', 
  shipmentValidation.create, 
  handleValidationErrors, 
  createShipment
);
router.put('/:id', 
  shipmentValidation.update, 
  handleValidationErrors, 
  updateShipment
);
router.delete('/:id', deleteShipment);
router.patch('/:id/assign-vehicle', 
  shipmentValidation.assignVehicle, 
  handleValidationErrors, 
  assignVehicle
);
router.patch('/:id/status', 
  shipmentValidation.updateStatus, 
  handleValidationErrors, 
  updateStatus
);

module.exports = router;