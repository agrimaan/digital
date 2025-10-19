/**
 * Admin User Management Controller (HTTP → user-service)
 *
 * Replaces IndependentUserServiceClient with direct HTTP calls to user-service.
 * - Forwards Authorization header for auth/role checks downstream.
 * - Passes page, limit, search, role as query params where supported.
 * - Normalizes responses to match existing frontend expectations.
 */

const asyncHandler = require('express-async-handler');
const axios = require('axios');

const USER_SVC = process.env.USER_SERVICE_URL || 'http://localhost:3002';
// Reusable axios client
const http = axios.create({
  baseURL: USER_SVC,
  timeout: 8000,
});

// Helper: forward auth header & query
function svcGet(path, { req, params = {} } = {}) {
  const headers = {};
  if (req?.headers?.authorization) headers.authorization = req.headers.authorization;
  return http.get(path, { params, headers });
}
function svcDelete(path, { req } = {}) {
  const headers = {};
  if (req?.headers?.authorization) headers.authorization = req.headers.authorization;
  return http.delete(path, { headers });
}
function svcPost(path, { req, data = {} } = {}) {
  const headers = {};
  if (req?.headers?.authorization) headers.authorization = req.headers.authorization;
  return http.post(path, data, { headers });
}

// Helper: normalize various user-service shapes into { users, pagination }
function normalizeUserListPayload(data, { page, limit } = {}) {
  // Common possibilities from user-service:
  // 1) { items, total, pages, page, limit }
  // 2) { users, pagination: { total, page, limit, pages } }
  // 3) { data: { items/users, pagination } }
  const root = data?.data?.items ? data.data
            : data?.data?.users ? data.data
            : data;

  let users = root.items || root.users || root.data?.items || root.data?.users || root;
  let total, pages;

  // pagination object
  const pagination =
    root.pagination ||
    data?.pagination ||
    data?.data?.pagination || {};

  if (Array.isArray(users)) {
    total = pagination.total ?? users.length;
    pages = pagination.pages ?? (limit ? Math.ceil(total / limit) : 1);
  } else {
    // Fallback: if user-service returned {items, total, pages, page, limit}
    users = root.items || [];
    total = root.total ?? users.length;
    pages = root.pages ?? (limit ? Math.ceil(total / (limit || 1)) : 1);
    page = root.page ?? page ?? 1;
    limit = root.limit ?? limit ?? users.length;
  }

  return {
    users: Array.isArray(users) ? users : [],
    pagination: {
      total: Number(total ?? 0),
      page: Number(pagination.page ?? page ?? 1),
      limit: Number(pagination.limit ?? limit ?? (Array.isArray(users) ? users.length : 10)),
      pages: Number(pagination.pages ?? pages ?? 1),
    },
  };
}

// @desc    Get all users with pagination (admin only)
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const search = (req.query.search || '').trim();
    const role = (req.query.role || '').trim();

    console.log('Fetching users for admin...', { page, limit, search, role });
    // Prefer server-side filtering/pagination on user-service
    // Expected endpoint (adjust if yours differs):
    //   GET /internal/users?page=&limit=&search=&role=
    const { data } = await svcGet('/api/internal/users', {
      req,
      params: { page, limit, ...(search ? { search } : {}), ...(role ? { role } : {}) },
    });

    console.log('Received data from user-service:', JSON.stringify(data).substring(0, 200));
    const normalized = normalizeUserListPayload(data, { page, limit });

    // Return in format expected by frontend: { users, pagination }
    return res.status(200).json({
      users: normalized.users,
      pagination: normalized.pagination,
    });
  } catch (error) {
    console.error('Error fetching users for admin:', error?.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: process.env.NODE_ENV === 'development'
        ? (error?.response?.data?.message || error.message)
        : 'Internal server error',
    });
  }
});

// @desc    Get user by ID (admin only)
// @route   GET /api/admin/users/:id
// @access  Private/Admin
exports.getUserById = asyncHandler(async (req, res) => {
  try {
    // Expected endpoint:
    //   GET /internal/users/:id
    const { data } = await svcGet(`/api/internal/users/${req.params.id}`, { req });

    // Normalize to { user }
    const user = data?.data?.user || data?.user || data;
    if (!user || (Array.isArray(user) && user.length === 0)) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: { user: Array.isArray(user) ? user[0] : user },
    });
  } catch (error) {
    const status = error?.response?.status || 500;
    if (status === 404) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    console.error('Error fetching user by ID:', error?.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: process.env.NODE_ENV === 'development'
        ? (error?.response?.data?.message || error.message)
        : 'Internal server error',
    });
  }
});

// @desc    Delete user (admin only)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res) => {
  try {
    // Prevent self-delete
    if (req.params.id === req.user?.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account',
      });
    }

    // Expected endpoint:
    //   DELETE /internal/users/:id
    await svcDelete(`/api/internal/users/${req.params.id}`, { req });

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    const status = error?.response?.status || 500;
    if (status === 404) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    console.error('Error deleting user:', error?.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: process.env.NODE_ENV === 'development'
        ? (error?.response?.data?.message || error.message)
        : 'Internal server error',
    });
  }
});

// @desc    Get recent users (admin only)
// @route   GET /api/admin/users/recent
// @access  Private/Admin
exports.getRecentUsers = asyncHandler(async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 5;

    // Prefer server-side sort/limit:
    //   GET /internal/users?page=1&limit=<n>&sort=-createdAt
    // If your user-service doesn't support sort, it should at least return newest first.
    const { data } = await svcGet('/api/internal/users', {
      req,
      params: { page: 1, limit, sort: '-createdAt' },
    });

    const normalized = normalizeUserListPayload(data, { page: 1, limit });

    return res.status(200).json({
      success: true,
      data: { users: normalized.users.slice(0, limit) },
    });
  } catch (error) {
    console.error('Error fetching recent users:', error?.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: 'Error fetching recent users',
      error: process.env.NODE_ENV === 'development'
        ? (error?.response?.data?.message || error.message)
        : 'Internal server error',
    });
  }
});

// @desc    Search users (admin only)
// @route   GET /api/admin/users/search
// @access  Private/Admin
exports.searchUsers = asyncHandler(async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    // Preferred endpoint (if present):
    //   GET /internal/users/search?q=<query>
    // Otherwise, you can proxy to /internal/users?search=<q>
    let data;
    try {
      const r = await svcGet('/api/internal/users/search', { req, params: { q } });
      data = r.data;
    } catch (e) {
      // Fallback to generic list with search param
      const r2 = await svcGet('/api/internal/users', { req, params: { page: 1, limit: 50, search: q } });
      data = r2.data;
    }

    // Normalize and return as { users }
    const normalized = normalizeUserListPayload(data, { page: 1, limit: 50 });
    return res.status(200).json({
      success: true,
      data: { users: normalized.users },
    });
  } catch (error) {
    console.error('Error searching users:', error?.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: 'Error searching users',
      error: process.env.NODE_ENV === 'development'
        ? (error?.response?.data?.message || error.message)
        : 'Internal server error',
    });
  }
});

// @desc    Create new user (admin only)
// @route   POST /api/admin/users
// @access  Private/Admin
exports.createUser = asyncHandler(async (req, res) => {
  try {
    const userData = req.body;
    
    // Validate required fields
    if (!userData.email || !userData.role) {
      return res.status(400).json({
        success: false,
        message: 'Email and role are required'
      });
    }

    // Forward to user service to create user
    const { data } = await svcPost('/api/users', {
      req,
      data: userData
    });

    // Return success response
    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: data.data || data
    });
  } catch (error) {
    console.error('Error creating user:', error?.response?.data || error.message);
    const status = error?.response?.status || 500;
    const message = error?.response?.data?.message || 'Error creating user';
    
    return res.status(status).json({
      success: false,
      message: message,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});
// @desc    Update user (admin only)
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req, res) => {
  try {
    const userData = req.body;
    
    // Validate required fields
    if (!userData.email || !userData.role) {
      return res.status(400).json({
        success: false,
        message: 'Email and role are required'
      });
    }

    // Forward to user service to update user
    const { data } = await http.put(`/api/internal/users/${req.params.id}`, userData, {
      headers: {
        authorization: req.headers.authorization
      }
    });

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: data.data || data
    });
  } catch (error) {
    console.error('Error updating user:', error?.response?.data || error.message);
    const status = error?.response?.status || 500;
    const message = error?.response?.data?.message || 'Error updating user';
    
    return res.status(status).json({
      success: false,
      message: message,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});


module.exports = exports;