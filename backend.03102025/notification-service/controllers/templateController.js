const templateService = require('../services/templateService');
const { handleError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

/**
 * Controller for notification template operations
 */
class TemplateController {
  /**
   * Create a new notification template
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createTemplate(req, res) {
    try {
      const templateData = req.body;
      
      // Validate required fields
      if (!templateData.name || !templateData.displayName || !templateData.type || !templateData.category) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: name, displayName, type, and category are required'
        });
      }
      
      // Set the creator to the authenticated user
      templateData.createdBy = req.user.id;
      
      const template = await templateService.createTemplate(templateData);
      
      res.status(201).json({
        success: true,
        data: template
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * Get template by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getTemplateById(req, res) {
    try {
      const { id } = req.params;
      const template = await templateService.getTemplateById(id);
      
      res.status(200).json({
        success: true,
        data: template
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * Get template by name and version
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getTemplateByName(req, res) {
    try {
      const { name } = req.params;
      const { version } = req.query;
      
      const template = await templateService.getTemplateByName(name, version);
      
      res.status(200).json({
        success: true,
        data: template
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * Get templates with filters and pagination
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getTemplates(req, res) {
    try {
      const filters = {
        name: req.query.name,
        type: req.query.type,
        category: req.query.category,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
        tags: req.query.tags ? req.query.tags.split(',') : undefined
      };
      
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sort: req.query.sort ? JSON.parse(req.query.sort) : { createdAt: -1 }
      };
      
      const result = await templateService.getTemplates(filters, options);
      
      res.status(200).json({
        success: true,
        count: result.data.length,
        pagination: result.pagination,
        data: result.data
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * Update an existing template
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateTemplate(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // Set the updater to the authenticated user
      updateData.updatedBy = req.user.id;
      
      const template = await templateService.updateTemplate(id, updateData);
      
      res.status(200).json({
        success: true,
        data: template
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * Create a new version of an existing template
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createNewVersion(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // Set the creator to the authenticated user
      updateData.createdBy = req.user.id;
      updateData.updatedBy = req.user.id;
      
      const template = await templateService.createNewVersion(id, updateData);
      
      res.status(201).json({
        success: true,
        data: template
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * Delete a template
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteTemplate(req, res) {
    try {
      const { id } = req.params;
      await templateService.deleteTemplate(id);
      
      res.status(200).json({
        success: true,
        message: 'Template deleted successfully'
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * Render a template with variables
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async renderTemplate(req, res) {
    try {
      const { name } = req.params;
      const { variables, channel } = req.body;
      
      if (!variables) {
        return res.status(400).json({
          success: false,
          message: 'Variables are required'
        });
      }
      
      const renderedContent = await templateService.renderTemplate(
        name,
        variables,
        channel || 'in-app'
      );
      
      res.status(200).json({
        success: true,
        data: renderedContent
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * Toggle template active status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async toggleTemplateStatus(req, res) {
    try {
      const { id } = req.params;
      const template = await templateService.toggleTemplateStatus(id);
      
      res.status(200).json({
        success: true,
        data: template
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * Get template variables
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getTemplateVariables(req, res) {
    try {
      const { id } = req.params;
      const variables = await templateService.getTemplateVariables(id);
      
      res.status(200).json({
        success: true,
        data: variables
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * Preview template rendering
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async previewTemplate(req, res) {
    try {
      const { id } = req.params;
      const { variables, channel } = req.body;
      
      const preview = await templateService.previewTemplate(
        id,
        variables || {},
        channel || 'in-app'
      );
      
      res.status(200).json({
        success: true,
        data: preview
      });
    } catch (error) {
      handleError(res, error);
    }
  }
}

module.exports = new TemplateController();