
const http = require('./http-client');

class ResourceServiceClient {
  constructor() {
    this.baseUrl = process.env.RESOURCE_SERVICE_URL || 'http://localhost:3014';
  }

  /**
   * Get all resources
   * @returns {Promise<Array>} List of resources
   */
  async getAllResources() {
    try {
      const response = await http.get(`${this.baseUrl}/api/resources`);
      return response.data?.resources || response.resources || [];
    } catch (error) {
      console.error('Error fetching resources from service:', error.message);
      throw error;
    }
  }

  /**
   * Get resource by ID
   * @param {string} id - Resource ID
   * @returns {Promise<Object>} Resource object
   */
  async getResourceById(id) {
    try {
      const response = await http.get(`${this.baseUrl}/api/resources/${id}`);
      return response.data?.resource || response.resource || response.data || null;
    } catch (error) {
      console.error(`Error fetching resource ${id} from service:`, error.message);
      throw error;
    }
  }

  /**
   * Create a new resource
   * @param {Object} resourceData - Resource data
   * @returns {Promise<Object>} Created resource
   */
  async createResource(resourceData) {
    try {
      const response = await http.post(`${this.baseUrl}/api/resources`, resourceData);
      return response.data?.resource || response.resource || response.data || null;
    } catch (error) {
      console.error('Error creating resource in service:', error.message);
      throw error;
    }
  }

  /**
   * Update a resource
   * @param {string} id - Resource ID
   * @param {Object} resourceData - Resource data to update
   * @returns {Promise<Object>} Updated resource
   */
  async updateResource(id, resourceData) {
    try {
      const response = await http.put(`${this.baseUrl}/api/resources/${id}`, resourceData);
      return response.data?.resource || response.resource || response.data || null;
    } catch (error) {
      console.error(`Error updating resource ${id} in service:`, error.message);
      throw error;
    }
  }

  /**
   * Delete a resource
   * @param {string} id - Resource ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteResource(id) {
    try {
      const response = await http.delete(`${this.baseUrl}/api/resources/${id}`);
      return response.data || { success: true };
    } catch (error) {
      console.error(`Error deleting resource ${id} in service:`, error.message);
      throw error;
    }
  }
}

module.exports = ResourceServiceClient;
