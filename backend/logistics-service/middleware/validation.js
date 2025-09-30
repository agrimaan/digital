const { body, param, query } = require('express-validator');

// Shipment validation rules
const shipmentValidation = {
  create: [
    body('orderId').notEmpty().withMessage('Order ID is required'),
    body('farmerId').notEmpty().withMessage('Farmer ID is required'),
    body('buyerId').notEmpty().withMessage('Buyer ID is required'),
    body('pickupLocation.address').notEmpty().withMessage('Pickup address is required'),
    body('pickupLocation.coordinates.latitude').isFloat().withMessage('Valid pickup latitude is required'),
    body('pickupLocation.coordinates.longitude').isFloat().withMessage('Valid pickup longitude is required'),
    body('deliveryLocation.address').notEmpty().withMessage('Delivery address is required'),
    body('deliveryLocation.coordinates.latitude').isFloat().withMessage('Valid delivery latitude is required'),
    body('deliveryLocation.coordinates.longitude').isFloat().withMessage('Valid delivery longitude is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('totalWeight').isFloat({ min: 0 }).withMessage('Total weight must be a positive number'),
    body('totalValue').isFloat({ min: 0 }).withMessage('Total value must be a positive number'),
    body('estimatedDelivery').isISO8601().withMessage('Valid estimated delivery date is required')
  ],
  
  update: [
    param('id').isMongoId().withMessage('Valid shipment ID is required'),
    body('status').optional().isIn(['pending', 'confirmed', 'in_transit', 'delivered', 'cancelled', 'failed']),
    body('pickupLocation.coordinates.latitude').optional().isFloat(),
    body('pickupLocation.coordinates.longitude').optional().isFloat(),
    body('deliveryLocation.coordinates.latitude').optional().isFloat(),
    body('deliveryLocation.coordinates.longitude').optional().isFloat(),
    body('totalWeight').optional().isFloat({ min: 0 }),
    body('totalValue').optional().isFloat({ min: 0 })
  ],
  
  assignVehicle: [
    param('id').isMongoId().withMessage('Valid shipment ID is required'),
    body('vehicleId').isMongoId().withMessage('Valid vehicle ID is required'),
    body('driver.name').notEmpty().withMessage('Driver name is required'),
    body('driver.phone').isMobilePhone().withMessage('Valid driver phone number is required'),
    body('driver.licenseNumber').notEmpty().withMessage('Driver license number is required')
  ],
  
  updateStatus: [
    param('id').isMongoId().withMessage('Valid shipment ID is required'),
    body('status').isIn(['pending', 'confirmed', 'in_transit', 'delivered', 'cancelled', 'failed']).withMessage('Invalid status'),
    body('location').optional().isString(),
    body('notes').optional().isString()
  ]
};

// Vehicle validation rules
const vehicleValidation = {
  create: [
    body('registrationNumber').notEmpty().withMessage('Registration number is required'),
    body('type').isIn(['truck', 'van', 'refrigerated_truck', 'pickup', 'bike', 'other']).withMessage('Invalid vehicle type'),
    body('make').notEmpty().withMessage('Vehicle make is required'),
    body('model').notEmpty().withMessage('Vehicle model is required'),
    body('year').isInt({ min: 1990, max: new Date().getFullYear() }).withMessage('Valid year is required'),
    body('capacity.maxWeight').isFloat({ min: 0 }).withMessage('Max weight must be a positive number'),
    body('capacity.maxVolume').isFloat({ min: 0 }).withMessage('Max volume must be a positive number'),
    body('fuelType').isIn(['diesel', 'petrol', 'electric', 'hybrid', 'cng']).withMessage('Invalid fuel type'),
    body('currentLocation.latitude').isFloat().withMessage('Valid latitude is required'),
    body('currentLocation.longitude').isFloat().withMessage('Valid longitude is required'),
    body('driver.name').notEmpty().withMessage('Driver name is required'),
    body('driver.phone').isMobilePhone().withMessage('Valid driver phone number is required'),
    body('driver.email').isEmail().withMessage('Valid driver email is required'),
    body('driver.licenseNumber').notEmpty().withMessage('Driver license number is required'),
    body('owner.name').notEmpty().withMessage('Owner name is required'),
    body('owner.phone').isMobilePhone().withMessage('Valid owner phone number is required'),
    body('owner.email').isEmail().withMessage('Valid owner email is required')
  ],
  
  update: [
    param('id').isMongoId().withMessage('Valid vehicle ID is required'),
    body('type').optional().isIn(['truck', 'van', 'refrigerated_truck', 'pickup', 'bike', 'other']),
    body('year').optional().isInt({ min: 1990, max: new Date().getFullYear() }),
    body('capacity.maxWeight').optional().isFloat({ min: 0 }),
    body('capacity.maxVolume').optional().isFloat({ min: 0 }),
    body('fuelType').optional().isIn(['diesel', 'petrol', 'electric', 'hybrid', 'cng']),
    body('status').optional().isIn(['available', 'in_use', 'maintenance', 'out_of_service'])
  ],
  
  updateLocation: [
    param('id').isMongoId().withMessage('Valid vehicle ID is required'),
    body('latitude').isFloat().withMessage('Valid latitude is required'),
    body('longitude').isFloat().withMessage('Valid longitude is required'),
    body('address').optional().isString()
  ],
  
  updateStatus: [
    param('id').isMongoId().withMessage('Valid vehicle ID is required'),
    body('status').isIn(['available', 'in_use', 'maintenance', 'out_of_service']).withMessage('Invalid status')
  ]
};

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = require('express-validator').validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

module.exports = {
  shipmentValidation,
  vehicleValidation,
  handleValidationErrors
};