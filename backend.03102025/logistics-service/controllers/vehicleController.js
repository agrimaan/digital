const Vehicle = require('../models/Vehicle');

// Create new vehicle
exports.createVehicle = async (req, res) => {
  try {
    const vehicleData = {
      ...req.body,
      vehicleId: `VEH${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`
    };

    const vehicle = new Vehicle(vehicleData);
    await vehicle.save();

    res.status(201).json({
      success: true,
      data: vehicle,
      message: 'Vehicle created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Get all vehicles
exports.getVehicles = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      type,
      availability,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (availability !== undefined) query['availability.isAvailable'] = availability === 'true';

    const skip = (page - 1) * limit;
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const vehicles = await Vehicle.find(query)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Vehicle.countDocuments(query);

    res.json({
      success: true,
      data: vehicles,
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

// Get single vehicle
exports.getVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found'
      });
    }

    res.json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update vehicle
exports.updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found'
      });
    }

    res.json({
      success: true,
      data: vehicle,
      message: 'Vehicle updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Delete vehicle
exports.deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found'
      });
    }

    res.json({
      success: true,
      message: 'Vehicle deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update vehicle location
exports.updateLocation = async (req, res) => {
  try {
    const { latitude, longitude, address } = req.body;

    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      {
        'currentLocation.latitude': latitude,
        'currentLocation.longitude': longitude,
        'currentLocation.address': address,
        'currentLocation.lastUpdated': new Date()
      },
      { new: true }
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found'
      });
    }

    res.json({
      success: true,
      data: vehicle,
      message: 'Location updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Update vehicle status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle not found'
      });
    }

    res.json({
      success: true,
      data: vehicle,
      message: 'Status updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Get vehicles by location
exports.getVehiclesByLocation = async (req, res) => {
  try {
    const { lat, lng, radius = 50 } = req.query;

    const vehicles = await Vehicle.find({
      'currentLocation': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseFloat(radius) * 1000
        }
      },
      status: 'available',
      'availability.isAvailable': true
    });

    res.json({
      success: true,
      data: vehicles,
      count: vehicles.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get available vehicles
exports.getAvailableVehicles = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      capacity,
      location
    } = req.query;

    const query = {
      status: 'available',
      'availability.isAvailable': true
    };

    if (type) query.type = type;
    if (capacity) {
      query['capacity.maxWeight'] = { $gte: parseFloat(capacity) };
    }

    let vehicles;
    if (location) {
      const [lat, lng] = location.split(',').map(Number);
      vehicles = await Vehicle.find({
        ...query,
        'currentLocation': {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            $maxDistance: 50000 // 50km radius
          }
        }
      });
    } else {
      vehicles = await Vehicle.find(query);
    }

    const total = await Vehicle.countDocuments(query);

    res.json({
      success: true,
      data: vehicles,
      count: vehicles.length,
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

// Get vehicle statistics
exports.getVehicleStats = async (req, res) => {
  try {
    const stats = await Vehicle.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const typeStats = await Vehicle.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    const availableVehicles = await Vehicle.countDocuments({
      status: 'available',
      'availability.isAvailable': true
    });

    res.json({
      success: true,
      data: {
        statusStats: stats,
        typeStats: typeStats,
        availableVehicles,
        totalVehicles: await Vehicle.countDocuments()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};