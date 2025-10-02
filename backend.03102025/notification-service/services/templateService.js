const NotificationTemplate = require('../models/NotificationTemplate');
const { createError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

/**
 * Service for handling notification templates
 */
class TemplateService {
  /**
   * Create a new notification template
   * @param {Object} templateData - Template data
   * @returns {Promise<Object>} - Created template
   */
  async createTemplate(templateData) {
    try {
      // Check if template with same name already exists
      const existingTemplate = await NotificationTemplate.findOne({ name: templateData.name });
      
      if (existingTemplate) {
        throw createError(409, `Template with name '${templateData.name}' already exists`);
      }
      
      // Create and save new template
      const template = new NotificationTemplate(templateData);
      await template.save();
      
      logger.info(`Created notification template: ${template._id} with name: ${templateData.name}`);
      return template;
    } catch (error) {
      logger.error(`Error creating notification template: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get template by ID
   * @param {String} id - Template ID
   * @returns {Promise<Object>} - Template object
   */
  async getTemplateById(id) {
    try {
      const template = await NotificationTemplate.findById(id);
      
      if (!template) {
        throw createError(404, `Template with ID ${id} not found`);
      }
      
      return template;
    } catch (error) {
      logger.error(`Error retrieving template by ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get template by name and version
   * @param {String} name - Template name
   * @param {Number} version - Template version (optional, defaults to latest)
   * @returns {Promise<Object>} - Template object
   */
  async getTemplateByName(name, version) {
    try {
      const template = await NotificationTemplate.findByNameAndVersion(name, version);
      
      if (!template) {
        throw createError(404, `Template with name '${name}'${version ? ` and version ${version}` : ''} not found`);
      }
      
      return template;
    } catch (error) {
      logger.error(`Error retrieving template by name: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get templates with filters and pagination
   * @param {Object} filters - Query filters
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Paginated templates
   */
  async getTemplates(filters = {}, options = {}) {
    try {
      const query = {};
      
      // Apply filters
      if (filters.name) query.name = { $regex: filters.name, $options: 'i' };
      if (filters.type) query.type = filters.type;
      if (filters.category) query.category = filters.category;
      if (filters.isActive !== undefined) query.isActive = filters.isActive;
      if (filters.tags && filters.tags.length > 0) query.tags = { $in: filters.tags };
      
      // Set up pagination
      const page = parseInt(options.page) || 1;
      const limit = parseInt(options.limit) || 10;
      const skip = (page - 1) * limit;
      
      // Set up sorting
      const sort = options.sort || { createdAt: -1 };
      
      // Execute query with pagination
      const templates = await NotificationTemplate.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit);
      
      // Get total count for pagination
      const total = await NotificationTemplate.countDocuments(query);
      
      return {
        data: templates,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error(`Error retrieving templates: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update an existing template
   * @param {String} id - Template ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated template
   */
  async updateTemplate(id, updateData) {
    try {
      // Check if trying to update name to an existing name
      if (updateData.name) {
        const existingTemplate = await NotificationTemplate.findOne({ 
          name: updateData.name,
          _id: { $ne: id }
        });
        
        if (existingTemplate) {
          throw createError(409, `Another template with name '${updateData.name}' already exists`);
        }
      }
      
      const template = await NotificationTemplate.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );
      
      if (!template) {
        throw createError(404, `Template with ID ${id} not found`);
      }
      
      logger.info(`Updated template: ${id}`);
      return template;
    } catch (error) {
      logger.error(`Error updating template: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a new version of an existing template
   * @param {String} id - Template ID
   * @param {Object} updateData - Data to update in the new version
   * @returns {Promise<Object>} - New template version
   */
  async createNewVersion(id, updateData) {
    try {
      const template = await NotificationTemplate.findById(id);
      
      if (!template) {
        throw createError(404, `Template with ID ${id} not found`);
      }
      
      const newTemplate = await template.createNewVersion(updateData);
      
      logger.info(`Created new version of template ${id}: ${newTemplate._id} (v${newTemplate.version})`);
      return newTemplate;
    } catch (error) {
      logger.error(`Error creating new template version: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a template
   * @param {String} id - Template ID
   * @returns {Promise<Boolean>} - Whether deletion was successful
   */
  async deleteTemplate(id) {
    try {
      const result = await NotificationTemplate.findByIdAndDelete(id);
      
      if (!result) {
        throw createError(404, `Template with ID ${id} not found`);
      }
      
      logger.info(`Deleted template: ${id}`);
      return true;
    } catch (error) {
      logger.error(`Error deleting template: ${error.message}`);
      throw error;
    }
  }

  /**
   * Render a template with variables
   * @param {String} templateName - Template name
   * @param {Object} variables - Variables to use for rendering
   * @param {String} channel - Channel to render for
   * @returns {Promise<Object>} - Rendered template content
   */
  async renderTemplate(templateName, variables = {}, channel = 'in-app') {
    try {
      // Get the template
      const template = await this.getTemplateByName(templateName);
      
      // Validate variables
      const validation = template.validateVariables(variables);
      if (!validation.isValid) {
        throw createError(400, `Template variable validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Check if the template supports the requested channel
      const supportedChannel = template.supportedChannels.find(c => c.type === channel && c.enabled);
      if (!supportedChannel) {
        throw createError(400, `Template does not support channel: ${channel}`);
      }
      
      // Render the template
      const renderedContent = template.render(variables, channel);
      
      logger.debug(`Rendered template ${templateName} for channel ${channel}`);
      return renderedContent;
    } catch (error) {
      logger.error(`Error rendering template: ${error.message}`);
      throw error;
    }
  }

  /**
   * Toggle template active status
   * @param {String} id - Template ID
   * @returns {Promise<Object>} - Updated template
   */
  async toggleTemplateStatus(id) {
    try {
      const template = await NotificationTemplate.findById(id);
      
      if (!template) {
        throw createError(404, `Template with ID ${id} not found`);
      }
      
      template.isActive = !template.isActive;
      await template.save();
      
      logger.info(`Toggled template ${id} status to ${template.isActive ? 'active' : 'inactive'}`);
      return template;
    } catch (error) {
      logger.error(`Error toggling template status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get template variables
   * @param {String} id - Template ID
   * @returns {Promise<Array>} - Template variables
   */
  async getTemplateVariables(id) {
    try {
      const template = await NotificationTemplate.findById(id);
      
      if (!template) {
        throw createError(404, `Template with ID ${id} not found`);
      }
      
      return template.variables;
    } catch (error) {
      logger.error(`Error getting template variables: ${error.message}`);
      throw error;
    }
  }

  /**
   * Preview template rendering
   * @param {String} id - Template ID
   * @param {Object} variables - Variables to use for preview
   * @param {String} channel - Channel to preview for
   * @returns {Promise<Object>} - Preview result
   */
  async previewTemplate(id, variables = {}, channel = 'in-app') {
    try {
      const template = await NotificationTemplate.findById(id);
      
      if (!template) {
        throw createError(404, `Template with ID ${id} not found`);
      }
      
      // For preview, we'll use example values for missing required variables
      const previewVariables = { ...variables };
      
      template.variables.forEach(variable => {
        if (variable.required && previewVariables[variable.name] === undefined) {
          previewVariables[variable.name] = variable.exampleValue || `[Example ${variable.name}]`;
        }
      });
      
      // Render the template
      const renderedContent = template.render(previewVariables, channel);
      
      return {
        preview: renderedContent,
        variables: previewVariables
      };
    } catch (error) {
      logger.error(`Error previewing template: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new TemplateService();