const express = require('express');
const { protect, authorize } = require('../../user-service/middleware/auth');
const bulkUploadController = require('../controllers/bulkUploadController');

const router = express.Router();

// All routes require admin authentication
router.use(protect, authorize('admin'));

/**
 * @route   GET /api/admin/bulk-uploads
 * @desc    Get all bulk uploads
 * @access  Private/Admin
 */
router.get('/', bulkUploadController.getBulkUploads);

/**
 * @route   GET /api/admin/bulk-uploads/:id
 * @desc    Get bulk upload by ID
 * @access  Private/Admin
 */
router.get('/:id', bulkUploadController.getBulkUploadById);

/**
 * @route   POST /api/admin/bulk-uploads
 * @desc    Create new bulk upload
 * @access  Private/Admin
 */
router.post('/', bulkUploadController.upload, bulkUploadController.createBulkUpload);

/**
 * @route   GET /api/admin/bulk-upload-stats
 * @desc    Get bulk upload statistics
 * @access  Private/Admin
 */
router.get('/stats', bulkUploadController.getBulkUploadStats);

module.exports = router;
