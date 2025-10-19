const asyncHandler = require('express-async-handler');
const axios = require('axios');

const CROP_SVC = process.env.CROP_SERVICE_URL || 'http://localhost:3005';
const http = axios.create({ baseURL: CROP_SVC, timeout: 8000 });

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

// @desc    Get all crops (admin view)
// @route   GET /api/admin/crops
// @access  Private/Admin
exports.getAllCrops = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = req.query.search || '';
    const type = req.query.type || '';
    const status = req.query.status || '';

    const { data } = await svcGet('/api/crops', {
      req,
      params: { page, limit, ...(search && { search }), ...(type && { type }), ...(status && { status }) }
    });

    // Normalize response for admin view
    const crops = data?.data?.crops || data?.crops || data || [];
    const pagination = data?.data?.pagination || data?.pagination || {
      total: crops.length,
      page,
      limit,
      pages: Math.ceil(crops.length / limit)
    };

    res.status(200).json({
      success: true,
      crops,
      pagination
    });
  } catch (error) {
    console.error('Error fetching crops:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching crops',
      error: error.message
    });
  }
});

// @desc    Get crop by ID (admin view)
// @route   GET /api/admin/crops/:id
// @access  Private/Admin
exports.getCropById = asyncHandler(async (req, res) => {
  try {
    const { data } = await svcGet(`/api/crops/${req.params.id}`, { req });

    const crop = data?.data?.crop || data?.crop || data;
    if (!crop) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { crop }
    });
  } catch (error) {
    const status = error.response?.status || 500;
    if (status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found'
      });
    }
    res.status(status).json({
      success: false,
      message: 'Error fetching crop',
      error: error.message
    });
  }
});

// @desc    Create crop (admin operation)
// @route   POST /api/admin/crops
// @access  Private/Admin
exports.createCrop = asyncHandler(async (req, res) => {
  try {
    const cropData = req.body;
    
    // Add admin context
    cropData.createdByAdmin = true;
    cropData.adminId = req.user.id;

    const { data } = await svcPost('/api/crops', {
      req,
      data: cropData
    });

    const newCrop = data?.data?.crop || data?.crop || data;

    res.status(201).json({
      success: true,
      message: 'Crop created successfully',
      data: { crop: newCrop }
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || 'Error creating crop';
    res.status(status).json({
      success: false,
      message,
      error: error.message
    });
  }
});

// @desc    Update crop (admin operation)
// @route   PUT /api/admin/crops/:id
// @access  Private/Admin
exports.updateCrop = asyncHandler(async (req, res) => {
  try {
    const updateData = req.body;
    updateData.updatedByAdmin = true;
    updateData.adminId = req.user.id;

    const { data } = await svcPut(`/api/crops/${req.params.id}`, {
      req,
      data: updateData
    });

    const updatedCrop = data?.data?.crop || data?.crop || data;

    res.status(200).json({
      success: true,
      message: 'Crop updated successfully',
      data: { crop: updatedCrop }
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || 'Error updating crop';
    res.status(status).json({
      success: false,
      message,
      error: error.message
    });
  }
});

// @desc    Delete crop (admin operation)
// @route   DELETE /api/admin/crops/:id
// @access  Private/Admin
exports.deleteCrop = asyncHandler(async (req, res) => {
  try {
    await svcDelete(`/api/crops/${req.params.id}`, { req });

    res.status(200).json({
      success: true,
      message: 'Crop deleted successfully'
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || 'Error deleting crop';
    res.status(status).json({
      success: false,
      message,
      error: error.message
    });
  }
});

// @desc    Get crop analytics
// @route   GET /api/admin/crops/:id/analytics
// @access  Private/Admin
exports.getCropAnalytics = asyncHandler(async (req, res) => {
  try {
    const { data } = await svcGet(`/api/crops/${req.params.id}/analytics`, { req });

    res.status(200).json({
      success: true,
      data: data?.data || data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching crop analytics',
      error: error.message
    });
  }
});

// @desc    Get crop harvests
// @route   GET /api/admin/crops/:id/harvests
// @access  Private/Admin
exports.getCropHarvests = asyncHandler(async (req, res) => {
  try {
    const { data } = await svcGet(`/api/crops/${req.params.id}/harvests`, { req });

    const harvests = data?.data?.harvests || data?.harvests || data || [];
    res.status(200).json({
      success: true,
      harvests,
      count: harvests.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching crop harvests',
      error: error.message
    });
  }
});
