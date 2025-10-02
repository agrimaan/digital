const Dashboard = require('../models/Dashboard');
const AuditLog = require('../models/AuditLog');
const axios = require('axios');

/**
 * Get default dashboard for an admin
 * @param {string} adminId - Admin ID
 * @returns {Object} Dashboard
 */
exports.getDefaultDashboard = async (adminId) => {
  try {
    const dashboard = await Dashboard.getDefaultDashboard(adminId);
    return dashboard;
  } catch (error) {
    console.error('Get default dashboard error:', error);
    throw new Error(`Failed to get default dashboard: ${error.message}`);
  }
};

/**
 * Get dashboard by ID
 * @param {string} id - Dashboard ID
 * @param {string} adminId - Admin ID
 * @returns {Object} Dashboard
 */
exports.getDashboardById = async (id, adminId) => {
  try {
    const dashboard = await Dashboard.findOne({ _id: id, adminId });
    
    if (!dashboard) {
      throw new Error('Dashboard not found');
    }
    
    return dashboard;
  } catch (error) {
    console.error('Get dashboard error:', error);
    throw new Error(`Failed to get dashboard: ${error.message}`);
  }
};

/**
 * Get all dashboards for an admin
 * @param {string} adminId - Admin ID
 * @returns {Array} Dashboards
 */
exports.getAllDashboards = async (adminId) => {
  try {
    const dashboards = await Dashboard.find({ adminId });
    return dashboards;
  } catch (error) {
    console.error('Get all dashboards error:', error);
    throw new Error(`Failed to get dashboards: ${error.message}`);
  }
};

/**
 * Create a new dashboard
 * @param {Object} dashboardData - Dashboard data
 * @param {Object} adminData - Admin data for audit logging
 * @returns {Object} Created dashboard
 */
exports.createDashboard = async (dashboardData, adminData) => {
  try {
    // Create dashboard
    const dashboard = await Dashboard.create({
      ...dashboardData,
      adminId: adminData.id
    });
    
    // Log the action
    await AuditLog.createLog({
      adminId: adminData.id,
      adminName: adminData.name,
      action: 'create',
      resourceType: 'dashboard',
      resourceId: dashboard._id.toString(),
      description: `Created new dashboard: ${dashboard.name}`,
      status: 'success',
      ipAddress: adminData.ipAddress,
      userAgent: adminData.userAgent
    });
    
    return dashboard;
  } catch (error) {
    console.error('Create dashboard error:', error);
    throw new Error(`Failed to create dashboard: ${error.message}`);
  }
};

/**
 * Update a dashboard
 * @param {string} id - Dashboard ID
 * @param {Object} updateData - Data to update
 * @param {Object} adminData - Admin data for audit logging
 * @returns {Object} Updated dashboard
 */
exports.updateDashboard = async (id, updateData, adminData) => {
  try {
    // Get dashboard before update for audit log
    const dashboardBefore = await Dashboard.findOne({ _id: id, adminId: adminData.id });
    
    if (!dashboardBefore) {
      throw new Error('Dashboard not found');
    }
    
    // Update dashboard
    const dashboard = await Dashboard.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });
    
    // Log the action
    await AuditLog.createLog({
      adminId: adminData.id,
      adminName: adminData.name,
      action: 'update',
      resourceType: 'dashboard',
      resourceId: dashboard._id.toString(),
      description: `Updated dashboard: ${dashboard.name}`,
      previousState: {
        name: dashboardBefore.name,
        layout: dashboardBefore.layout,
        filters: dashboardBefore.filters
      },
      newState: {
        name: dashboard.name,
        layout: dashboard.layout,
        filters: dashboard.filters
      },
      status: 'success',
      ipAddress: adminData.ipAddress,
      userAgent: adminData.userAgent
    });
    
    return dashboard;
  } catch (error) {
    console.error('Update dashboard error:', error);
    throw new Error(`Failed to update dashboard: ${error.message}`);
  }
};

/**
 * Delete a dashboard
 * @param {string} id - Dashboard ID
 * @param {Object} adminData - Admin data for audit logging
 * @returns {Object} Deleted dashboard
 */
exports.deleteDashboard = async (id, adminData) => {
  try {
    const dashboard = await Dashboard.findOne({ _id: id, adminId: adminData.id });
    
    if (!dashboard) {
      throw new Error('Dashboard not found');
    }
    
    // Don't allow deleting the default dashboard
    if (dashboard.isDefault) {
      throw new Error('Cannot delete the default dashboard');
    }
    
    await dashboard.remove();
    
    // Log the action
    await AuditLog.createLog({
      adminId: adminData.id,
      adminName: adminData.name,
      action: 'delete',
      resourceType: 'dashboard',
      resourceId: id,
      description: `Deleted dashboard: ${dashboard.name}`,
      status: 'success',
      ipAddress: adminData.ipAddress,
      userAgent: adminData.userAgent
    });
    
    return dashboard;
  } catch (error) {
    console.error('Delete dashboard error:', error);
    throw new Error(`Failed to delete dashboard: ${error.message}`);
  }
};

/**
 * Set a dashboard as default
 * @param {string} id - Dashboard ID
 * @param {Object} adminData - Admin data for audit logging
 * @returns {Object} Updated dashboard
 */
exports.setDefaultDashboard = async (id, adminData) => {
  try {
    const dashboard = await Dashboard.findOne({ _id: id, adminId: adminData.id });
    
    if (!dashboard) {
      throw new Error('Dashboard not found');
    }
    
    await dashboard.setAsDefault();
    
    // Log the action
    await AuditLog.createLog({
      adminId: adminData.id,
      adminName: adminData.name,
      action: 'update',
      resourceType: 'dashboard',
      resourceId: dashboard._id.toString(),
      description: `Set dashboard as default: ${dashboard.name}`,
      status: 'success',
      ipAddress: adminData.ipAddress,
      userAgent: adminData.userAgent
    });
    
    return dashboard;
  } catch (error) {
    console.error('Set default dashboard error:', error);
    throw new Error(`Failed to set default dashboard: ${error.message}`);
  }
};

/**
 * Get dashboard data
 * @param {string} id - Dashboard ID
 * @param {string} adminId - Admin ID
 * @returns {Object} Dashboard with data
 */
exports.getDashboardData = async (id, adminId) => {
  try {
    const dashboard = await Dashboard.findOne({ _id: id, adminId });
    
    if (!dashboard) {
      throw new Error('Dashboard not found');
    }
    
    // Get data for each widget
    const widgetData = await Promise.all(
      dashboard.layout.map(async (widget) => {
        const data = await getWidgetData(widget, dashboard.filters);
        return {
          ...widget.toObject(),
          data
        };
      })
    );
    
    return {
      ...dashboard.toObject(),
      layout: widgetData
    };
  } catch (error) {
    console.error('Get dashboard data error:', error);
    throw new Error(`Failed to get dashboard data: ${error.message}`);
  }
};

/**
 * Get data for a specific widget
 * @param {Object} widget - Widget configuration
 * @param {Object} filters - Dashboard filters
 * @returns {Object} Widget data
 */
async function getWidgetData(widget, filters) {
  try {
    // Determine which service to call based on widget type
    let serviceUrl;
    let endpoint;
    
    switch (widget.widgetType) {
      case 'userStats':
        serviceUrl = process.env.USER_SERVICE_URL;
        endpoint = '/api/analytics/user-stats';
        break;
        
      case 'farmerStats':
        serviceUrl = process.env.USER_SERVICE_URL;
        endpoint = '/api/analytics/farmer-stats';
        break;
        
      case 'buyerStats':
        serviceUrl = process.env.USER_SERVICE_URL;
        endpoint = '/api/analytics/buyer-stats';
        break;
        
      case 'cropStats':
        serviceUrl = process.env.CROP_SERVICE_URL;
        endpoint = '/api/analytics/crop-stats';
        break;
        
      case 'revenueChart':
        serviceUrl = process.env.MARKETPLACE_SERVICE_URL;
        endpoint = '/api/analytics/revenue';
        break;
        
      case 'orderStats':
        serviceUrl = process.env.MARKETPLACE_SERVICE_URL;
        endpoint = '/api/analytics/order-stats';
        break;
        
      case 'weatherWidget':
        serviceUrl = process.env.WEATHER_SERVICE_URL;
        endpoint = '/api/weather/current';
        break;
        
      case 'marketPrices':
        serviceUrl = process.env.MARKETPLACE_SERVICE_URL;
        endpoint = '/api/analytics/market-prices';
        break;
        
      case 'recentTransactions':
        serviceUrl = process.env.MARKETPLACE_SERVICE_URL;
        endpoint = '/api/analytics/recent-transactions';
        break;
        
      case 'activeDevices':
        serviceUrl = process.env.IOT_SERVICE_URL;
        endpoint = '/api/analytics/active-devices';
        break;
        
      case 'fieldMap':
        serviceUrl = process.env.FIELD_SERVICE_URL;
        endpoint = '/api/analytics/field-map';
        break;
        
      case 'alertsWidget':
        serviceUrl = process.env.NOTIFICATION_SERVICE_URL;
        endpoint = '/api/notifications/recent-alerts';
        break;
        
      case 'customMetric':
      case 'customChart':
        serviceUrl = process.env.ANALYTICS_SERVICE_URL;
        endpoint = '/api/analytics/custom';
        break;
        
      default:
        return { error: 'Unsupported widget type' };
    }
    
    // Call the appropriate service
    const response = await axios.get(`${serviceUrl}${endpoint}`, {
      params: {
        ...filters,
        ...widget.config
      }
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching data for widget ${widget.widgetType}:`, error);
    return { error: error.message };
  }
}