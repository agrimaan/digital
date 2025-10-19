const axios = require('axios');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const nodemailer = require('nodemailer');

// Service URLs with fallbacks
const USER_SVC = process.env.USER_SERVICE_URL || 'http://localhost:3002';
const FIELD_SVC = process.env.FIELD_SERVICE_URL || 'http://localhost:3003';
const CROP_SVC = process.env.CROP_SERVICE_URL || 'http://localhost:3005';
const MARKETPLACE_SVC = process.env.MARKETPLACE_SERVICE_URL || 'http://localhost:3006';
const IOT_SVC = process.env.IOT_SERVICE_URL || 'http://localhost:3004';
const ANALYTICS_SVC = process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3009';

// Helper function for HTTP requests
const httpRequest = async (serviceUrl, endpoint, method = 'GET', data = null, headers = {}) => {
  try {
    const config = {
      method,
      url: `${serviceUrl}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      timeout: 10000
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`HTTP request failed: ${method} ${serviceUrl}${endpoint}`, error.message);
    // Return fallback data instead of throwing
    return { 
      success: false, 
      error: error.message,
      data: null 
    };
  }
};

/**
 * Generate report data from multiple services
 * @param {Object} reportParams - Report parameters
 * @param {Object} adminData - Admin data
 * @returns {Object} Generated report data
 */
const generateReportData = async (reportParams, adminData) => {
  try {
    const {
      type,
      startDate,
      endDate,
      format = 'json',
      filters = {}
    } = reportParams;

    // Parallel data collection from all services
    const [
      userData,
      fieldData,
      cropData,
      orderData,
      sensorData,
      analyticsData
    ] = await Promise.all([
      collectUserData(startDate, endDate, filters),
      collectFieldData(startDate, endDate, filters),
      collectCropData(startDate, endDate, filters),
      collectOrderData(startDate, endDate, filters),
      collectSensorData(startDate, endDate, filters),
      collectAnalyticsData(startDate, endDate, filters)
    ]);

    // Compile comprehensive report
    const reportData = {
      metadata: {
        type,
        generatedAt: new Date(),
        generatedBy: adminData.name,
        dateRange: { startDate, endDate },
        format
      },
      summary: compileSummary(userData, fieldData, cropData, orderData, sensorData, analyticsData),
      details: {
        users: userData,
        fields: fieldData,
        crops: cropData,
        orders: orderData,
        sensors: sensorData,
        analytics: analyticsData
      },
      insights: generateInsights(userData, fieldData, cropData, orderData, sensorData, analyticsData),
      recommendations: generateRecommendations(userData, fieldData, cropData, orderData, sensorData, analyticsData)
    };

    return reportData;
  } catch (error) {
    console.error('Generate report data error:', error);
    throw new Error(`Failed to generate report data: ${error.message}`);
  }
};

// Data collection functions for each service
async function collectUserData(startDate, endDate, filters) {
  try {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (filters.userType) params.userType = filters.userType;
    if (filters.region) params.region = filters.region;

    const response = await httpRequest(USER_SVC, '/api/analytics/users', 'GET', null, { params });
    return response.data || response;
  } catch (error) {
    console.error('Collect user data error:', error);
    return { error: 'Failed to collect user data', data: null };
  }
}

async function collectFieldData(startDate, endDate, filters) {
  try {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (filters.fieldType) params.fieldType = filters.fieldType;
    if (filters.location) params.location = filters.location;

    const response = await httpRequest(FIELD_SVC, '/api/analytics/fields', 'GET', null, { params });
    return response.data || response;
  } catch (error) {
    console.error('Collect field data error:', error);
    return { error: 'Failed to collect field data', data: null };
  }
}

async function collectCropData(startDate, endDate, filters) {
  try {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (filters.cropType) params.cropType = filters.cropType;
    if (filters.season) params.season = filters.season;

    const response = await httpRequest(CROP_SVC, '/api/analytics/crops', 'GET', null, { params });
    return response.data || response;
  } catch (error) {
    console.error('Collect crop data error:', error);
    return { error: 'Failed to collect crop data', data: null };
  }
}

async function collectOrderData(startDate, endDate, filters) {
  try {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (filters.status) params.status = filters.status;
    if (filters.userId) params.userId = filters.userId;

    const response = await httpRequest(MARKETPLACE_SVC, '/api/analytics/orders', 'GET', null, { params });
    return response.data || response;
  } catch (error) {
    console.error('Collect order data error:', error);
    return { error: 'Failed to collect order data', data: null };
  }
}

async function collectSensorData(startDate, endDate, filters) {
  try {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (filters.sensorType) params.sensorType = filters.sensorType;
    if (filters.fieldId) params.fieldId = filters.fieldId;

    const response = await httpRequest(IOT_SVC, '/api/analytics/devices', 'GET', null, { params });
    return response.data || response;
  } catch (error) {
    console.error('Collect sensor data error:', error);
    return { error: 'Failed to collect sensor data', data: null };
  }
}

async function collectAnalyticsData(startDate, endDate, filters) {
  try {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await httpRequest(ANALYTICS_SVC, '/api/analytics/overview', 'GET', null, { params });
    return response.data || response;
  } catch (error) {
    console.error('Collect analytics data error:', error);
    return { error: 'Failed to collect analytics data', data: null };
  }
}

// Data compilation and analysis functions
function compileSummary(userData, fieldData, cropData, orderData, sensorData, analyticsData) {
  return {
    totalUsers: userData.data?.totalUsers || 0,
    totalFields: fieldData.data?.totalFields || 0,
    totalCrops: cropData.data?.totalCrops || 0,
    totalOrders: orderData.data?.totalOrders || 0,
    totalSensors: sensorData.data?.totalDevices || 0,
    activeUsers: userData.data?.activeUsers || 0,
    activeFields: fieldData.data?.activeFields || 0,
    revenue: orderData.data?.totalRevenue || 0,
    systemHealth: analyticsData.data?.status || 'unknown',
    lastUpdated: new Date()
  };
}

function generateInsights(userData, fieldData, cropData, orderData, sensorData, analyticsData) {
  const insights = [];

  // User insights
  if (userData.data?.newUsers > userData.data?.activeUsers * 0.1) {
    insights.push({
      type: 'user_growth',
      severity: 'info',
      message: 'Significant user growth detected. Consider scaling infrastructure.',
      data: { newUsers: userData.data.newUsers, growthRate: 'high' }
    });
  }

  // Field insights
  if (fieldData.data?.activeFields < fieldData.data?.totalFields * 0.7) {
    insights.push({
      type: 'field_utilization',
      severity: 'warning',
      message: 'Low field utilization. Consider field optimization strategies.',
      data: { utilization: (fieldData.data.activeFields / fieldData.data.totalFields) * 100 }
    });
  }

  // Order insights
  if (orderData.data?.pendingOrders > orderData.data?.totalOrders * 0.3) {
    insights.push({
      type: 'order_backlog',
      severity: 'warning',
      message: 'High order backlog. Consider improving order processing.',
      data: { pendingOrders: orderData.data.pendingOrders, backlogRate: 'high' }
    });
  }

  // Sensor insights
  if (sensorData.data?.alertCount > sensorData.data?.totalDevices * 0.1) {
    insights.push({
      type: 'sensor_alerts',
      severity: 'error',
      message: 'Multiple sensor alerts. Check device maintenance schedules.',
      data: { alertCount: sensorData.data.alertCount, alertRate: 'high' }
    });
  }

  return insights;
}

function generateRecommendations(userData, fieldData, cropData, orderData, sensorData, analyticsData) {
  const recommendations = [];

  // System health recommendations
  if (analyticsData.data?.status === 'degraded') {
    recommendations.push({
      priority: 'high',
      category: 'system_health',
      recommendation: 'Investigate service health issues and restart failed services.',
      actionable: true,
      estimatedImpact: 'high'
    });
  }

  // User engagement recommendations
  if (userData.data?.activeUsers < userData.data?.totalUsers * 0.6) {
    recommendations.push({
      priority: 'medium',
      category: 'user_engagement',
      recommendation: 'Implement user engagement campaigns to increase active usage.',
      actionable: true,
      estimatedImpact: 'medium'
    });
  }

  // Revenue recommendations
  if (orderData.data?.averageOrderValue < 100) {
    recommendations.push({
      priority: 'medium',
      category: 'revenue_optimization',
      recommendation: 'Consider upselling strategies to increase average order value.',
      actionable: true,
      estimatedImpact: 'medium'
    });
  }

  return recommendations;
}

/**
 * Create a new report
 * @param {Object} reportData - Report data
 * @param {Object} adminData - Admin data for audit logging
 * @returns {Object} Created report
 */
exports.createReport = async (reportData, adminData) => {
  try {
    const { name, description, type, parameters = {} } = reportData;

    // Generate report data from services
    const reportContent = await generateReportData(parameters, adminData);

    // Create report object (in-memory, not persisted to database)
    const report = {
      id: `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      type,
      parameters,
      content: reportContent,
      status: 'completed',
      createdAt: new Date(),
      createdBy: adminData.id,
      createdByName: adminData.name
    };

    // Log the action via admin service
    try {
      await httpRequest(
        process.env.USER_SERVICE_URL || 'http://localhost:3002',
        '/api/admin/audit-logs',
        'POST',
        {
          adminId: adminData.id,
          adminName: adminData.name,
          action: 'create',
          resourceType: 'report',
          resourceId: report.id,
          description: `Created new report: ${report.name}`,
          status: 'success',
          ipAddress: adminData.ipAddress,
          userAgent: adminData.userAgent
        },
        { Authorization: `Bearer ${adminData.token}` }
      );
    } catch (auditError) {
      console.error('Audit log creation failed:', auditError);
      // Continue without audit log if service is unavailable
    }

    return report;
  } catch (error) {
    console.error('Create report error:', error);
    throw new Error(`Failed to create report: ${error.message}`);
  }
};

/**
 * Get a report by ID
 * @param {string} id - Report ID
 * @returns {Object} Report
 */
exports.getReportById = async (id) => {
  try {
    // For now, regenerate report data since we're not persisting reports
    // In future, this would retrieve from database or cache
    
    // Extract parameters from report ID or return error
    // For now, return error since we don't persist reports
    throw new Error('Report not found. Reports are generated dynamically and not persisted.');
    
    // In future implementation with persistence:
    // const report = await getReportFromDatabase(id);
    // return report;
  } catch (error) {
    console.error('Get report error:', error);
    throw new Error(`Failed to get report: ${error.message}`);
  }
};

/**
 * Get all reports
 * @param {Object} filters - Filter criteria
 * @param {Object} adminData - Admin data
 * @returns {Array} Reports
 */
exports.getAllReports = async (filters, adminData) => {
  try {
    const { type, status, startDate, endDate } = filters;

    // For now, return empty array since we're not persisting reports
    // In future, this would query database with filters
    
    return [];

    // In future implementation with persistence:
    // const reports = await getReportsFromDatabase(filters);
    // return reports;
  } catch (error) {
    console.error('Get all reports error:', error);
    throw new Error(`Failed to get reports: ${error.message}`);
  }
};

/**
 * Generate and export report
 * @param {string} reportId - Report ID
 * @param {string} format - Export format (pdf, csv, xlsx)
 * @param {Object} adminData - Admin data
 * @returns {Object} Export result
 */
exports.exportReport = async (reportId, format, adminData) => {
  try {
    // Get report data (regenerate since we don't persist)
    const report = await exports.getReportById(reportId);
    
    // Generate export based on format
    let exportResult;
    
    switch (format.toLowerCase()) {
      case 'csv':
        exportResult = await exportToCSV(report);
        break;
      case 'xlsx':
        exportResult = await exportToExcel(report);
        break;
      case 'pdf':
        exportResult = await exportToPDF(report);
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    // Log the export action
    try {
      await httpRequest(
        process.env.USER_SERVICE_URL || 'http://localhost:3002',
        '/api/admin/audit-logs',
        'POST',
        {
          adminId: adminData.id,
          adminName: adminData.name,
          action: 'export',
          resourceType: 'report',
          resourceId: reportId,
          description: `Exported report ${reportId} as ${format}`,
          status: 'success',
          ipAddress: adminData.ipAddress,
          userAgent: adminData.userAgent
        },
        { Authorization: `Bearer ${adminData.token}` }
      );
    } catch (auditError) {
      console.error('Audit log creation failed:', auditError);
    }

    return exportResult;
  } catch (error) {
    console.error('Export report error:', error);
    throw new Error(`Failed to export report: ${error.message}`);
  }
};

// Export helper functions
async function exportToCSV(report) {
  try {
    const csvData = convertToCSV(report.content.details);
    const filename = `report-${report.id}.csv`;
    const filepath = path.join('/tmp', filename);
    
    fs.writeFileSync(filepath, csvData);
    
    return {
      success: true,
      filename,
      filepath,
      format: 'csv',
      size: fs.statSync(filepath).size
    };
  } catch (error) {
    console.error('Export to CSV error:', error);
    throw new Error(`Failed to export to CSV: ${error.message}`);
  }
}

async function exportToExcel(report) {
  try {
    const workbook = xlsx.utils.book_new();
    
    // Add multiple sheets for different data types
    const userSheet = xlsx.utils.json_to_sheet(report.content.details.users.data || []);
    const fieldSheet = xlsx.utils.json_to_sheet(report.content.details.fields.data || []);
    const orderSheet = xlsx.utils.json_to_sheet(report.content.details.orders.data || []);
    
    xlsx.utils.book_append_sheet(workbook, userSheet, 'Users');
    xlsx.utils.book_append_sheet(workbook, fieldSheet, 'Fields');
    xlsx.utils.book_append_sheet(workbook, orderSheet, 'Orders');
    
    const filename = `report-${report.id}.xlsx`;
    const filepath = path.join('/tmp', filename);
    
    xlsx.writeFile(workbook, filepath);
    
    return {
      success: true,
      filename,
      filepath,
      format: 'xlsx',
      size: fs.statSync(filepath).size
    };
  } catch (error) {
    console.error('Export to Excel error:', error);
    throw new Error(`Failed to export to Excel: ${error.message}`);
  }
}

async function exportToPDF(report) {
  try {
    // For PDF generation, we would typically use a library like puppeteer or pdfkit
    // For now, return a placeholder indicating PDF generation would be implemented
    return {
      success: true,
      message: 'PDF generation would be implemented here using puppeteer or similar library',
      format: 'pdf',
      note: 'PDF export requires additional dependencies and implementation'
    };
  } catch (error) {
    console.error('Export to PDF error:', error);
    throw new Error(`Failed to export to PDF: ${error.message}`);
  }
}

function convertToCSV(data) {
  // Simple CSV conversion - would be enhanced for complex data structures
  if (!data || typeof data !== 'object') return '';
  
  if (Array.isArray(data)) {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    return [headers, ...rows].join('\n');
  }
  
  return Object.entries(data).map(([key, value]) => `${key},${value}`).join('\n');
}

/**
 * Get report statistics
 * @param {Object} filters - Filter criteria
 * @param {Object} adminData - Admin data
 * @returns {Object} Statistics
 */
exports.getReportStatistics = async (filters, adminData) => {
  try {
    // For now, return basic statistics since we don't persist reports
    // In future, this would query database for actual statistics
    
    return {
      totalReports: 0,
      reportsByType: {},
      reportsByStatus: {},
      averageGenerationTime: 0,
      lastGenerated: null
    };

    // In future implementation with persistence:
    // const stats = await getReportStatisticsFromDatabase(filters);
    // return stats;
  } catch (error) {
    console.error('Get report statistics error:', error);
    throw new Error(`Failed to get report statistics: ${error.message}`);
  }
};
