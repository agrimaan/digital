/**
 * Resource Management Controller for Admin Service
 * 
 * Handles resource management functionality for the admin panel
 */

const asyncHandler = require('express-async-handler');
const axios = require('axios');
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3002/api';

// @desc    Get all resources (admin only)
// @route   GET /api/admin/resources
// @access  Private/Admin
exports.getAllResources = asyncHandler(async (req, res) => {
  try {
    // For now, return mock data since we don't have a dedicated resource service
    // In a real implementation, this would call a resource microservice
    const mockResources = [
      {
        _id: 'resource1',
        name: 'Tractor (Model X)',
        type: 'Machinery',
        hourlyRate: 1500,
        location: 'Field A',
        owner: { name: 'John Farmer', email: 'john@example.com' },
        createdAt: new Date(Date.now() - 7200000).toISOString()
      },
      {
        _id: 'resource2',
        name: 'Harvester (Model Y)',
        type: 'Machinery',
        hourlyRate: 2500,
        location: 'Field B',
        owner: { name: 'Jane Buyer', email: 'jane@example.com' },
        createdAt: new Date(Date.now() - 3600000).toISOString()
      }
    ];

    res.status(200).json({
      success: true,
      data: { resources: mockResources }
    });
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching resources',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Get resource by ID (admin only)
// @route   GET /api/admin/resources/:id
// @access  Private/Admin
exports.getResourceById = asyncHandler(async (req, res) => {
  try {
    // For now, return mock data
    const mockResource = {
      _id: req.params.id,
      name: 'Tractor (Model X)',
      type: 'Machinery',
      hourlyRate: 1500,
      location: 'Field A',
      owner: { name: 'John Farmer', email: 'john@example.com' },
      createdAt: new Date(Date.now() - 7200000).toISOString()
    };

    res.status(200).json({
      success: true,
      data: { resource: mockResource }
    });
  } catch (error) {
    console.error('Error fetching resource by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching resource',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Create resource (admin only)
// @route   POST /api/admin/resources
// @access  Private/Admin
exports.createResource = asyncHandler(async (req, res) => {
  try {
    // For now, return success with mock data
    const mockResource = {
      _id: 'resource' + Date.now(),
      name: req.body.name || 'New Resource',
      type: req.body.type || 'Machinery',
      hourlyRate: req.body.hourlyRate || 1000,
      location: req.body.location || 'Field A',
      owner: { name: 'Admin User', email: 'admin@example.com' },
      createdAt: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      data: { resource: mockResource },
      message: 'Resource created successfully'
    });
  } catch (error) {
    console.error('Error creating resource:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating resource',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Update resource (admin only)
// @route   PUT /api/admin/resources/:id
// @access  Private/Admin
exports.updateResource = asyncHandler(async (req, res) => {
  try {
    // For now, return success with mock data
    const mockResource = {
      _id: req.params.id,
      name: req.body.name || 'Updated Resource',
      type: req.body.type || 'Machinery',
      hourlyRate: req.body.hourlyRate || 1000,
      location: req.body.location || 'Field A',
      owner: { name: 'Admin User', email: 'admin@example.com' },
      createdAt: new Date(Date.now() - 7200000).toISOString()
    };

    res.status(200).json({
      success: true,
      data: { resource: mockResource },
      message: 'Resource updated successfully'
    });
  } catch (error) {
    console.error('Error updating resource:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating resource',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Delete resource (admin only)
// @route   DELETE /api/admin/resources/:id
// @access  Private/Admin
exports.deleteResource = asyncHandler(async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Resource deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting resource:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting resource',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = exports;