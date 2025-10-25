const asyncHandler = require('express-async-handler');
const axios = require('axios');

const FIELD_SVC = process.env.FIELD_SERVICE_URL || 'http://localhost:3003';

// Helper function for HTTP requests
const http = axios.create({
  baseURL: FIELD_SVC,
  timeout: 8000,
});

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

// @desc    Get all fields (admin view)
// @route   GET /api/admin/fields
// @access  Private/Admin
exports.getAllFields = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = req.query.search || '';
    const owner = req.query.owner || '';

    const { data } = await svcGet('/api/fields', {
      req,
      params: { page, limit, ...(search && { search }), ...(owner && { owner }) }
    });

    // Normalize response for admin view
    const fields = data?.data?.fields || data?.fields || data || [];
    const pagination = data?.data?.pagination || data?.pagination || {
      total: fields.length,
      page,
      limit,
      pages: Math.ceil(fields.length / limit)
    };

    res.status(200).json({
      success: true,
      fields,
      pagination
    });
  } catch (error) {
    console.error('Error fetching fields:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching fields',
      error: error.message
    });
  }
});

// @desc    Get field by ID (admin view)
// @route   GET /api/admin/fields/:id
// @access  Private/Admin
exports.getFieldById = asyncHandler(async (req, res) => {
  try {
    const { data } = await svcGet(`/api/fields/${req.params.id}`, { req });

    const field = data?.data?.field || data?.field || data;
    console.log('Field within getFiledById of admin-service:', field)
    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Field not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { field }
    });
  } catch (error) {
    const status = error.response?.status || 500;
    if (status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Field not found'
      });
    }
    res.status(status).json({
      success: false,
      message: 'Error fetching field',
      error: error.message
    });
  }
});

// @desc    Create field (admin operation)
// @route   POST /api/admin/fields
// @access  Private/Admin
exports.createField = asyncHandler(async (req, res) => {
  try {
    const fieldData = req.body;
    
    // Add admin context
    fieldData.createdByAdmin = true;
    fieldData.adminId = req.user.id;

    const { data } = await svcPost('/api/fields', {
      req,
      data: fieldData
    });

    const newField = data?.data?.field || data?.field || data;

    res.status(201).json({
      success: true,
      message: 'Field created successfully',
      data: { field: newField }
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || 'Error creating field';
    res.status(status).json({
      success: false,
      message,
      error: error.message
    });
  }
});

// @desc    Update field (admin operation)
// @route   PUT /api/admin/fields/:id
// @access  Private/Admin
exports.updateField = asyncHandler(async (req, res) => {
  try {
    const updateData = req.body;
    updateData.updatedByAdmin = true;
    updateData.adminId = req.user.id;

    const { data } = await svcPut(`/api/fields/${req.params.id}`, {
      req,
      data: updateData
    });

    const updatedField = data?.data?.field || data?.field || data;

    res.status(200).json({
      success: true,
      message: 'Field updated successfully',
      data: { field: updatedField }
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || 'Error updating field';
    res.status(status).json({
      success: false,
      message,
      error: error.message
    });
  }
});

// @desc    Delete field (admin operation)
// @route   DELETE /api/admin/fields/:id
// @access  Private/Admin
exports.deleteField = asyncHandler(async (req, res) => {
  try {
    await svcDelete(`/api/fields/${req.params.id}`, { req });

    res.status(200).json({
      success: true,
      message: 'Field deleted successfully'
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || 'Error deleting field';
    res.status(status).json({
      success: false,
      message,
      error: error.message
    });
  }
});

// @desc    Get field analytics
// @route   GET /api/admin/fields/:id/analytics
// @access  Private/Admin
exports.getFieldAnalytics = asyncHandler(async (req, res) => {
  try {
    const { data } = await svcGet(`/api/fields/${req.params.id}/analytics`, { req });

    res.status(200).json({
      success: true,
      data: data?.data || data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching field analytics',
      error: error.message
    });
  }
});

// @desc    Get field crops
// @route   GET /api/admin/fields/:id/crops
// @access  Private/Admin
exports.getFieldCrops = asyncHandler(async (req, res) => {
  try {
    const { data } = await svcGet(`/api/fields/${req.params.id}/crops`, { req });

    const crops = data?.data?.crops || data?.crops || data || [];
    res.status(200).json({
      success: true,
      crops,
      count: crops.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching field crops',
      error: error.message
    });
  }
});

// @desc    Get field sensors
// @route   GET /api/admin/fields/:id/sensors
// @access  Private/Admin
exports.getFieldSensors = asyncHandler(async (req, res) => {
  try {
    const { data } = await svcGet(`/api/fields/${req.params.id}/sensors`, { req });

    const sensors = data?.data?.sensors || data?.sensors || data || [];
    res.status(200).json({
      success: true,
      sensors,
      count: sensors.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching field sensors',
      error: error.message
    });
  }
});
