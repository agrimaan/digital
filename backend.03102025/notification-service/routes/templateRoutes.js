const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const { authenticateJWT, authorizeRole } = require('../middleware/authMiddleware');

/**
 * @route POST /api/templates
 * @desc Create a new notification template
 * @access Private (Admin only)
 */
router.post('/', authenticateJWT, authorizeRole('admin'), templateController.createTemplate);

/**
 * @route GET /api/templates/:id
 * @desc Get template by ID
 * @access Private
 */
router.get('/:id', authenticateJWT, templateController.getTemplateById);

/**
 * @route GET /api/templates/name/:name
 * @desc Get template by name and version
 * @access Private
 */
router.get('/name/:name', authenticateJWT, templateController.getTemplateByName);

/**
 * @route GET /api/templates
 * @desc Get templates with filters and pagination
 * @access Private
 */
router.get('/', authenticateJWT, templateController.getTemplates);

/**
 * @route PUT /api/templates/:id
 * @desc Update an existing template
 * @access Private (Admin only)
 */
router.put('/:id', authenticateJWT, authorizeRole('admin'), templateController.updateTemplate);

/**
 * @route POST /api/templates/:id/versions
 * @desc Create a new version of an existing template
 * @access Private (Admin only)
 */
router.post('/:id/versions', authenticateJWT, authorizeRole('admin'), templateController.createNewVersion);

/**
 * @route DELETE /api/templates/:id
 * @desc Delete a template
 * @access Private (Admin only)
 */
router.delete('/:id', authenticateJWT, authorizeRole('admin'), templateController.deleteTemplate);

/**
 * @route POST /api/templates/name/:name/render
 * @desc Render a template with variables
 * @access Private
 */
router.post('/name/:name/render', authenticateJWT, templateController.renderTemplate);

/**
 * @route PUT /api/templates/:id/toggle-status
 * @desc Toggle template active status
 * @access Private (Admin only)
 */
router.put('/:id/toggle-status', authenticateJWT, authorizeRole('admin'), templateController.toggleTemplateStatus);

/**
 * @route GET /api/templates/:id/variables
 * @desc Get template variables
 * @access Private
 */
router.get('/:id/variables', authenticateJWT, templateController.getTemplateVariables);

/**
 * @route POST /api/templates/:id/preview
 * @desc Preview template rendering
 * @access Private
 */
router.post('/:id/preview', authenticateJWT, templateController.previewTemplate);

module.exports = router;