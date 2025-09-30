const Shipment = require('../models/Shipment');
const Vehicle = require('../models/Vehicle');

// Create new shipment
exports.createShipment = async (req, res) => {
  try {
    const shipmentData = {
      ...req.body,
      shipmentId: `SHP${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`
    };

    const shipment = new Shipment(shipmentData);
    await shipment.save();

    res.status(201).json({
      success: true,
      data: shipment,
      message: 'Shipment created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Get all shipments
exports.getShipments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      farmerId,
      buyerId,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (farmerId) query.farmerId = farmerId;
    if (buyerId) query.buyerId = buyerId;

    const skip = (page - 1) * limit;
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const shipments = await Shipment.find(query)
      .populate('assignedVehicle')
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Shipment.countDocuments(query);

    res.json({
      success: true,
      data: shipments,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get single shipment
exports.getShipment = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id)
      .populate('assignedVehicle');

    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: 'Shipment not found'
      });
    }

    res.json({
      success: true,
      data: shipment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update shipment
exports.updateShipment = async (req, res) => {
  try {
    const shipment = await Shipment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('assignedVehicle');

    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: 'Shipment not found'
      });
    }

    res.json({
      success: true,
      data: shipment,
      message: 'Shipment updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Delete shipment
exports.deleteShipment = async (req, res) => {
  try {
    const shipment = await Shipment.findByIdAndDelete(req.params.id);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: 'Shipment not found'
      });
    }

    res.json({
      success: true,
      message: 'Shipment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Assign vehicle to shipment
exports.assignVehicle = async (req, res) => {
  try {
    const { vehicleId, driver } = req.body;
    
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found'
      });
    }

    if (vehicle.status !== 'available') {
      return res.status(400).json({
        success: false,
        error: 'Vehicle is not available'
      });
    }

    const shipment = await Shipment.findByIdAndUpdate(
      req.params.id,
      {
        assignedVehicle: vehicleId,
        driver,
        status: 'confirmed'
      },
      { new: true }
    ).populate('assignedVehicle');

    // Update vehicle status
    await Vehicle.findByIdAndUpdate(vehicleId, { status: 'in_use' });

    res.json({
      success: true,
      data: shipment,
      message: 'Vehicle assigned successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Update shipment status
exports.updateStatus = async (req, res) => {
  try {
    const { status, location, notes } = req.body;

    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: 'Shipment not found'
      });
    }

    shipment.status = status;
    shipment.trackingUpdates.push({
      status,
      location,
      notes
    });

    if (status === 'delivered') {
      shipment.actualDelivery = new Date();
      
      // Free up vehicle
      if (shipment.assignedVehicle) {
        await Vehicle.findByIdAndUpdate(shipment.assignedVehicle, { status: 'available' });
      }
    }

    await shipment.save();

    res.json({
      success: true,
      data: shipment,
      message: 'Status updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Get shipments by location
exports.getShipmentsByLocation = async (req, res) => {
  try {
    const { lat, lng, radius = 50 } = req.query;

    const shipments = await Shipment.find({
      'pickupLocation.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseFloat(radius) * 1000 // Convert km to meters
        }
      }
    }).populate('assignedVehicle');

    res.json({
      success: true,
      data: shipments,
      count: shipments.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};