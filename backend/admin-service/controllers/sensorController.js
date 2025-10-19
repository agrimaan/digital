const asyncHandler = require('express-async-handler');
const axios = require('axios');

const IOT_SVC = process.env.IOT_SERVICE_URL || 'http://localhost:3004';
const http = axios.create({ baseURL: IOT_SVC, timeout: 8000 });

function svcGet(path, { req, params = {} } = {}) {
  const headers = {};
  if (req?.headers?.authorization) headers.authorization = req.headers.authorization;
  return http.get(path, { params, headers });
}

function svcPost(path, { req, data = {} } = {}) {
  const headers = {};
  if (req?.headers?.authorization) headers.authorization = req.headers.authorization;
  return http.post(path, data, { headers });
}

function svcPut(path, { req, data = {} } = {}) {
  const headers = {};
  if (req?.headers?.authorization) headers.authorization = req.headers.authorization;
  return http.put(path, data, { headers });
}

function svcDelete(path, { req } = {}) {
  const headers = {};
  if (req?.headers?.authorization) headers.authorization = req.headers.authorization;
  return http.delete(path, { headers });
}

// @desc    Get all sensors (admin view)
// @route   GET /api/admin/sensors
// @access  Private/Admin
exports.getAllSensors = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = req.query.search || '';
    const type = req.query.type || '';
    const fieldId = req.query.fieldId || '';
    const status = req.query.status || '';

    const { data } = await svcGet('/api/devices', {
      req,
      params: { 
        page, 
        limit, 
        ...(search && { search }), 
        ...(type && { type }),
        ...(fieldId && { fieldId }),
        ...(status && { status })
      }
    });

    // Normalize response for admin view
    const sensors = data?.data?.devices || data?.devices || data || [];
    const pagination = data?.data?.pagination || data?.pagination || {
      total: sensors.length,
      page,
      limit,
      pages: Math.ceil(sensors.length / limit)
    };

    res.status(200).json({
      success: true,
      sensors,
      pagination
    });
  } catch (error) {
    console.error('Error fetching sensors:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sensors',
      error: error.message
    });
  }
});

// @desc    Get sensor by ID (admin view)
// @route   GET /api/admin/sensors/:id
// @access  Private/Admin
exports.getSensorById = asyncHandler(async (req, res) => {
  try {
    const { data } = await svcGet(`/api/devices/${req.params.id}`, { req });

    const sensor = data?.data?.device || data?.device || data;
    if (!sensor) {
      return res.status(404).json({
        success: false,
        message: 'Sensor not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { sensor }
    });
  } catch (error) {
    const status = error.response?.status || 500;
    if (status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Sensor not found'
      });
    }
    res.status(status).json({
      success: false,
      message: 'Error fetching sensor',
      error: error.message
    });
  }
});

// @desc    Create sensor (admin operation)
// @route   POST /api/admin/sensors
// @access  Private/Admin
exports.createSensor = asyncHandler(async (req, res) => {
  try {
    const sensorData = req.body;
    
    // Add admin context
    sensorData.createdByAdmin = true;
    sensorData.adminId = req.user.id;

    const { data } = await svcPost('/api/devices', {
      req,
      data: sensorData
    });

    const newSensor = data?.data?.device || data?.device || data;

    res.status(201).json({
      success: true,
      message: 'Sensor created successfully',
      data: { sensor: newSensor }
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || 'Error creating sensor';
    res.status(status).json({
      success: false,
      message,
      error: error.message
    });
  }
});

// @desc    Update sensor (admin operation)
// @route   PUT /api/admin/sensors/:id
// @access  Private/Admin
exports.updateSensor = asyncHandler(async (req, res) => {
  try {
    const updateData = req.body;
    updateData.updatedByAdmin = true;
    updateData.adminId = req.user.id;

    const { data } = await svcPut(`/api/devices/${req.params.id}`, {
      req,
      data: updateData
    });

    const updatedSensor = data?.data?.device || data?.device || data;

    res.status(200).json({
      success: true,
      message: 'Sensor updated successfully',
      data: { sensor: updatedSensor }
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || 'Error updating sensor';
    res.status(status).json({
      success: false,
      message,
      error: error.message
    });
  }
});

// @desc    Delete sensor (admin operation)
// @route   DELETE /api/admin/sensors/:id
// @access  Private/Admin
exports.deleteSensor = asyncHandler(async (req, res) => {
  try {
    await svcDelete(`/api/devices/${req.params.id}`, { req });

    res.status(200).json({
      success: true,
      message: 'Sensor deleted successfully'
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || 'Error deleting sensor';
    res.status(status).json({
      success: false,
      message,
      error: error.message
    });
  }
});

// @desc    Get sensor telemetry
// @route   GET /api/admin/sensors/:id/telemetry
// @access  Private/Admin
exports.getSensorTelemetry = asyncHandler(async (req, res) => {
  try {
    const { data } = await svcGet(`/api/telemetry/device/${req.params.id}`, { req });

    const telemetry = data?.data?.telemetry || data?.telemetry || data || [];
    res.status(200).json({
      success: true,
      telemetry,
      count: telemetry.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching sensor telemetry',
      error: error.message
    });
  }
});

// @desc    Get sensor alerts
// @route   GET /api/admin/sensors/:id/alerts
// @access  Private/Admin
exports.getSensorAlerts = asyncHandler(async (req, res) => {
  try {
    const { data } = await svcGet(`/api/alerts/device/${req.params.id}`, { req });

    const alerts = data?.data?.alerts || data?.alerts || data || [];
    res.status(200).json({
      success: true,
      alerts,
      count: alerts.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching sensor alerts',
      error: error.message
    });
  }
});

// @desc    Get sensor analytics
// @route   GET /api/admin/sensors/analytics/overview
// @access  Private/Admin
exports.getSensorAnalytics = asyncHandler(async (req, res) => {
  try {
    const startDate = req.query.startDate || '';
    const endDate = req.query.endDate || '';

    const { data } = await svcGet('/api/analytics/iot/overview', {
      req,
      params: { ...(startDate && { startDate }), ...(endDate && { endDate }) }
    });

    res.status(200).json({
      success: true,
      data: data?.data || data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching sensor analytics',
      error: error.message
    });
  }
});
