const asyncHandler = require('express-async-handler');
const { resourceService } = require('../services/serviceClients');
const logger = require('../utils/logger');

/**
 * @desc    Get all resources
 * @route   GET /api/bff/resources
 * @access  Private/Admin
 */
const getResources = asyncHandler(async (req, res) => {
  logger.info('Getting all resources');

  const resources = await resourceService.getResources(req.query);

  res.json({
    success: true,
    data: resources.data || resources
  });
});

/**
 * @desc    Get resource by ID
 * @route   GET /api/bff/resources/:id
 * @access  Private/Admin
 */
const getResourceById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  logger.info(`Getting resource by ID: ${id}`);

  const resource = await resourceService.getResourceById(id);

  res.json({
    success: true,
    data: resource.data || resource
  });
});

/**
 * @desc    Create new resource
 * @route   POST /api/bff/resources
 * @access  Private/Admin
 */
const createResource = asyncHandler(async (req, res) => {
  logger.info('Creating new resource');

  const resource = await resourceService.createResource(req.body);

  res.status(201).json({
    success: true,
    message: 'Resource created successfully',
    data: resource.data || resource
  });
});

/**
 * @desc    Update resource
 * @route   PUT /api/bff/resources/:id
 * @access  Private/Admin
 */
const updateResource = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  logger.info(`Updating resource: ${id}`);

  const resource = await resourceService.updateResource(id, req.body);

  res.json({
    success: true,
    message: 'Resource updated successfully',
    data: resource.data || resource
  });
});

/**
 * @desc    Delete resource
 * @route   DELETE /api/bff/resources/:id
 * @access  Private/Admin
 */
const deleteResource = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  logger.info(`Deleting resource: ${id}`);

  await resourceService.deleteResource(id);

  res.json({
    success: true,
    message: 'Resource deleted successfully'
  });
});

module.exports = {
  getResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource
};