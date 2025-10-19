const asyncHandler = require('express-async-handler');
const axios = require('axios');

const MARKETPLACE_SVC = process.env.MARKETPLACE_SERVICE_URL || 'http://localhost:3006';
const http = axios.create({ baseURL: MARKETPLACE_SVC, timeout: 8000 });

function svcGet(path, { req, params = {} } = {}) {
  const headers = {};
  if (req?.headers?.authorization) headers.authorization = req.headers.authorization;
  return http.get(path, { params, headers });
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

// @desc    Get all orders (admin view)
// @route   GET /api/admin/orders
// @access  Private/Admin
exports.getAllOrders = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const status = req.query.status || '';
    const userId = req.query.userId || '';
    const startDate = req.query.startDate || '';
    const endDate = req.query.endDate || '';

    const { data } = await svcGet('/api/orders', {
      req,
      params: { 
        page, 
        limit, 
        ...(status && { status }), 
        ...(userId && { userId }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      }
    });

    // Normalize response for admin view
    const orders = data?.data?.orders || data?.orders || data || [];
    const pagination = data?.data?.pagination || data?.pagination || {
      total: orders.length,
      page,
      limit,
      pages: Math.ceil(orders.length / limit)
    };

    res.status(200).json({
      success: true,
      orders,
      pagination
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
});

// @desc    Get order by ID (admin view)
// @route   GET /api/admin/orders/:id
// @access  Private/Admin
exports.getOrderById = asyncHandler(async (req, res) => {
  try {
    const { data } = await svcGet(`/api/orders/${req.params.id}`, { req });

    const order = data?.data?.order || data?.order || data;
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { order }
    });
  } catch (error) {
    const status = error.response?.status || 500;
    if (status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    res.status(status).json({
      success: false,
      message: 'Error fetching order',
      error: error.message
    });
  }
});

// @desc    Update order status (admin operation)
// @route   PUT /api/admin/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  try {
    const { status } = req.body;
    
    const updateData = {
      status,
      updatedByAdmin: true,
      adminId: req.user.id
    };

    const { data } = await svcPut(`/api/orders/${req.params.id}/status`, {
      req,
      data: updateData
    });

    const updatedOrder = data?.data?.order || data?.order || data;

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: { order: updatedOrder }
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || 'Error updating order status';
    res.status(status).json({
      success: false,
      message,
      error: error.message
    });
  }
});

// @desc    Update order (admin operation)
// @route   PUT /api/admin/orders/:id
// @access  Private/Admin
exports.updateOrder = asyncHandler(async (req, res) => {
  try {
    const updateData = req.body;
    updateData.updatedByAdmin = true;
    updateData.adminId = req.user.id;

    const { data } = await svcPut(`/api/orders/${req.params.id}`, {
      req,
      data: updateData
    });

    const updatedOrder = data?.data?.order || data?.order || data;

    res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      data: { order: updatedOrder }
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || 'Error updating order';
    res.status(status).json({
      success: false,
      message,
      error: error.message
    });
  }
});

// @desc    Delete order (admin operation)
// @route   DELETE /api/admin/orders/:id
// @access  Private/Admin
exports.deleteOrder = asyncHandler(async (req, res) => {
  try {
    await svcDelete(`/api/orders/${req.params.id}`, { req });

    res.status(200).json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || 'Error deleting order';
    res.status(status).json({
      success: false,
      message,
      error: error.message
    });
  }
});

// @desc    Get order items
// @route   GET /api/admin/orders/:id/items
// @access  Private/Admin
exports.getOrderItems = asyncHandler(async (req, res) => {
  try {
    const { data } = await svcGet(`/api/orders/${req.params.id}/items`, { req });

    const items = data?.data?.items || data?.items || data || [];
    res.status(200).json({
      success: true,
      items,
      count: items.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching order items',
      error: error.message
    });
  }
});

// @desc    Get order analytics
// @route   GET /api/admin/orders/analytics/summary
// @access  Private/Admin
exports.getOrderAnalytics = asyncHandler(async (req, res) => {
  try {
    const startDate = req.query.startDate || '';
    const endDate = req.query.endDate || '';

    const { data } = await svcGet('/api/orders/analytics/summary', {
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
      message: 'Error fetching order analytics',
      error: error.message
    });
  }
});
