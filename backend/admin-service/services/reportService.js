const Report = require('../models/Report');
const AuditLog = require('../models/AuditLog');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const nodemailer = require('nodemailer');

/**
 * Create a new report
 * @param {Object} reportData - Report data
 * @param {Object} adminData - Admin data for audit logging
 * @returns {Object} Created report
 */
exports.createReport = async (reportData, adminData) => {
  try {
    // Create report
    const report = await Report.create({
      ...reportData,
      createdBy: adminData.id,
      updatedBy: adminData.id
    });
    
    // Log the action
    await AuditLog.createLog({
      adminId: adminData.id,
      adminName: adminData.name,
      action: 'create',
      resourceType: 'report',
      resourceId: report._id.toString(),
      description: `Created new report: ${report.name}`,
      status: 'success',
      ipAddress: adminData.ipAddress,
      userAgent: adminData.userAgent
    });
    
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
    const report = await Report.findById(id);
    
    if (!report) {
      throw new Error('Report not found');
    }
    
    return report;
  } catch (error) {
    console.error('Get report error:', error);
    throw new Error(`Failed to get report: ${error.message}`);
  }
};

/**
 * Get all reports
 * @param {Object} filter - Filter criteria
 * @param {Object} options - Query options
 * @returns {Array} Reports
 */
exports.getAllReports = async (filter = {}, options = {}) => {
  try {
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
    
    const reports = await Report.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);
      
    const total = await Report.countDocuments(filter);
    
    return {
      reports,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Get all reports error:', error);
    throw new Error(`Failed to get reports: ${error.message}`);
  }
};

/**
 * Update a report
 * @param {string} id - Report ID
 * @param {Object} updateData - Data to update
 * @param {Object} adminData - Admin data for audit logging
 * @returns {Object} Updated report
 */
exports.updateReport = async (id, updateData, adminData) => {
  try {
    // Get report before update for audit log
    const reportBefore = await Report.findById(id);
    
    if (!reportBefore) {
      throw new Error('Report not found');
    }
    
    // Update report
    const report = await Report.findByIdAndUpdate(
      id,
      {
        ...updateData,
        updatedBy: adminData.id,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );
    
    // Log the action
    await AuditLog.createLog({
      adminId: adminData.id,
      adminName: adminData.name,
      action: 'update',
      resourceType: 'report',
      resourceId: report._id.toString(),
      description: `Updated report: ${report.name}`,
      previousState: {
        name: reportBefore.name,
        description: reportBefore.description,
        type: reportBefore.type,
        format: reportBefore.format,
        schedule: reportBefore.schedule,
        filters: reportBefore.filters
      },
      newState: {
        name: report.name,
        description: report.description,
        type: report.type,
        format: report.format,
        schedule: report.schedule,
        filters: report.filters
      },
      status: 'success',
      ipAddress: adminData.ipAddress,
      userAgent: adminData.userAgent
    });
    
    return report;
  } catch (error) {
    console.error('Update report error:', error);
    throw new Error(`Failed to update report: ${error.message}`);
  }
};

/**
 * Delete a report
 * @param {string} id - Report ID
 * @param {Object} adminData - Admin data for audit logging
 * @returns {Object} Deleted report
 */
exports.deleteReport = async (id, adminData) => {
  try {
    const report = await Report.findById(id);
    
    if (!report) {
      throw new Error('Report not found');
    }
    
    await report.remove();
    
    // Log the action
    await AuditLog.createLog({
      adminId: adminData.id,
      adminName: adminData.name,
      action: 'delete',
      resourceType: 'report',
      resourceId: id,
      description: `Deleted report: ${report.name}`,
      status: 'success',
      ipAddress: adminData.ipAddress,
      userAgent: adminData.userAgent
    });
    
    return report;
  } catch (error) {
    console.error('Delete report error:', error);
    throw new Error(`Failed to delete report: ${error.message}`);
  }
};

/**
 * Generate a report
 * @param {string} id - Report ID
 * @param {Object} adminData - Admin data for audit logging
 * @returns {Object} Generated report
 */
exports.generateReport = async (id, adminData) => {
  try {
    const report = await Report.findById(id);
    
    if (!report) {
      throw new Error('Report not found');
    }
    
    // Get report data from appropriate service
    const reportData = await getReportData(report);
    
    // Generate the report file
    const { fileUrl, size } = await generateReportFile(report, reportData);
    
    // Add generated report to the report's history
    await report.addGeneratedReport(fileUrl, size);
    
    // Send report to recipients if any
    if (report.recipients && (report.recipients.emails.length > 0 || report.recipients.adminIds.length > 0)) {
      await sendReportToRecipients(report, fileUrl);
    }
    
    // Log the action
    await AuditLog.createLog({
      adminId: adminData.id,
      adminName: adminData.name,
      action: 'create',
      resourceType: 'report',
      resourceId: report._id.toString(),
      description: `Generated report: ${report.name}`,
      status: 'success',
      ipAddress: adminData.ipAddress,
      userAgent: adminData.userAgent
    });
    
    return {
      report,
      fileUrl,
      size
    };
  } catch (error) {
    console.error('Generate report error:', error);
    
    // Log the error
    if (adminData) {
      await AuditLog.createLog({
        adminId: adminData.id,
        adminName: adminData.name,
        action: 'create',
        resourceType: 'report',
        resourceId: id,
        description: `Failed to generate report: ${error.message}`,
        status: 'failure',
        ipAddress: adminData.ipAddress,
        userAgent: adminData.userAgent
      });
    }
    
    throw new Error(`Failed to generate report: ${error.message}`);
  }
};

/**
 * Get report templates
 * @returns {Array} Report templates
 */
exports.getReportTemplates = async () => {
  try {
    const templates = await Report.find({ isTemplate: true });
    return templates;
  } catch (error) {
    console.error('Get report templates error:', error);
    throw new Error(`Failed to get report templates: ${error.message}`);
  }
};

/**
 * Create report from template
 * @param {string} templateId - Template ID
 * @param {Object} reportData - Report data
 * @param {Object} adminData - Admin data for audit logging
 * @returns {Object} Created report
 */
exports.createReportFromTemplate = async (templateId, reportData, adminData) => {
  try {
    const template = await Report.findOne({ _id: templateId, isTemplate: true });
    
    if (!template) {
      throw new Error('Report template not found');
    }
    
    // Create new report from template
    const newReport = new Report({
      name: reportData.name || template.name,
      description: reportData.description || template.description,
      type: template.type,
      format: reportData.format || template.format,
      schedule: reportData.schedule || template.schedule,
      filters: reportData.filters || template.filters,
      columns: template.columns,
      sortBy: template.sortBy,
      groupBy: template.groupBy,
      chartOptions: template.chartOptions,
      recipients: reportData.recipients || template.recipients,
      isTemplate: false,
      createdBy: adminData.id,
      updatedBy: adminData.id
    });
    
    await newReport.save();
    
    // Log the action
    await AuditLog.createLog({
      adminId: adminData.id,
      adminName: adminData.name,
      action: 'create',
      resourceType: 'report',
      resourceId: newReport._id.toString(),
      description: `Created report from template: ${template.name}`,
      status: 'success',
      ipAddress: adminData.ipAddress,
      userAgent: adminData.userAgent
    });
    
    return newReport;
  } catch (error) {
    console.error('Create report from template error:', error);
    throw new Error(`Failed to create report from template: ${error.message}`);
  }
};

/**
 * Process scheduled reports
 * @returns {number} Number of reports processed
 */
exports.processScheduledReports = async () => {
  try {
    const dueReports = await Report.getScheduledReportsDue();
    let processedCount = 0;
    
    for (const report of dueReports) {
      try {
        // Get report data
        const reportData = await getReportData(report);
        
        // Generate the report file
        const { fileUrl, size } = await generateReportFile(report, reportData);
        
        // Add generated report to the report's history
        await report.addGeneratedReport(fileUrl, size);
        
        // Send report to recipients
        if (report.recipients && (report.recipients.emails.length > 0 || report.recipients.adminIds.length > 0)) {
          await sendReportToRecipients(report, fileUrl);
        }
        
        // Update next run date
        report.calculateNextRunDate();
        await report.save();
        
        processedCount++;
      } catch (error) {
        console.error(`Error processing scheduled report ${report._id}:`, error);
        
        // Add error to report history
        await report.addGeneratedReport(null, 0, 'failed', error.message);
        
        // Update next run date despite the error
        report.calculateNextRunDate();
        await report.save();
      }
    }
    
    return processedCount;
  } catch (error) {
    console.error('Process scheduled reports error:', error);
    throw new Error(`Failed to process scheduled reports: ${error.message}`);
  }
};

/**
 * Get report data from appropriate service
 * @param {Object} report - Report configuration
 * @returns {Object} Report data
 */
async function getReportData(report) {
  try {
    // Determine which service to call based on report type
    let serviceUrl;
    let endpoint;
    
    switch (report.type) {
      case 'user':
        serviceUrl = process.env.USER_SERVICE_URL;
        endpoint = '/api/reports/users';
        break;
        
      case 'farmer':
        serviceUrl = process.env.USER_SERVICE_URL;
        endpoint = '/api/reports/farmers';
        break;
        
      case 'buyer':
        serviceUrl = process.env.USER_SERVICE_URL;
        endpoint = '/api/reports/buyers';
        break;
        
      case 'crop':
        serviceUrl = process.env.CROP_SERVICE_URL;
        endpoint = '/api/reports/crops';
        break;
        
      case 'field':
        serviceUrl = process.env.FIELD_SERVICE_URL;
        endpoint = '/api/reports/fields';
        break;
        
      case 'iot':
        serviceUrl = process.env.IOT_SERVICE_URL;
        endpoint = '/api/reports/devices';
        break;
        
      case 'marketplace':
        serviceUrl = process.env.MARKETPLACE_SERVICE_URL;
        endpoint = '/api/reports/marketplace';
        break;
        
      case 'order':
        serviceUrl = process.env.MARKETPLACE_SERVICE_URL;
        endpoint = '/api/reports/orders';
        break;
        
      case 'transaction':
        serviceUrl = process.env.MARKETPLACE_SERVICE_URL;
        endpoint = '/api/reports/transactions';
        break;
        
      case 'logistics':
        serviceUrl = process.env.LOGISTICS_SERVICE_URL;
        endpoint = '/api/reports/logistics';
        break;
        
      case 'weather':
        serviceUrl = process.env.WEATHER_SERVICE_URL;
        endpoint = '/api/reports/weather';
        break;
        
      case 'analytics':
        serviceUrl = process.env.ANALYTICS_SERVICE_URL;
        endpoint = '/api/reports/analytics';
        break;
        
      case 'financial':
        serviceUrl = process.env.ANALYTICS_SERVICE_URL;
        endpoint = '/api/reports/financial';
        break;
        
      case 'performance':
        serviceUrl = process.env.ANALYTICS_SERVICE_URL;
        endpoint = '/api/reports/performance';
        break;
        
      case 'custom':
        serviceUrl = process.env.ANALYTICS_SERVICE_URL;
        endpoint = '/api/reports/custom';
        break;
        
      default:
        throw new Error(`Unsupported report type: ${report.type}`);
    }
    
    // Call the appropriate service
    const response = await axios.post(`${serviceUrl}${endpoint}`, {
      filters: report.filters,
      columns: report.columns,
      sortBy: report.sortBy,
      groupBy: report.groupBy,
      chartOptions: report.chartOptions
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching data for report ${report._id}:`, error);
    throw new Error(`Failed to fetch report data: ${error.message}`);
  }
}

/**
 * Generate report file
 * @param {Object} report - Report configuration
 * @param {Object} data - Report data
 * @returns {Object} File URL and size
 */
async function generateReportFile(report, data) {
  try {
    // Create reports directory if it doesn't exist
    const reportsDir = path.join(__dirname, '../reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const timestamp = Date.now();
    const fileName = `${report.name.replace(/\s+/g, '_')}_${timestamp}`;
    let filePath;
    let fileUrl;
    
    switch (report.format) {
      case 'pdf':
        filePath = path.join(reportsDir, `${fileName}.pdf`);
        await generatePdfReport(filePath, report, data);
        fileUrl = `/reports/${fileName}.pdf`;
        break;
        
      case 'csv':
        filePath = path.join(reportsDir, `${fileName}.csv`);
        await generateCsvReport(filePath, data);
        fileUrl = `/reports/${fileName}.csv`;
        break;
        
      case 'excel':
        filePath = path.join(reportsDir, `${fileName}.xlsx`);
        await generateExcelReport(filePath, report, data);
        fileUrl = `/reports/${fileName}.xlsx`;
        break;
        
      case 'json':
        filePath = path.join(reportsDir, `${fileName}.json`);
        await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
        fileUrl = `/reports/${fileName}.json`;
        break;
        
      case 'html':
        filePath = path.join(reportsDir, `${fileName}.html`);
        await generateHtmlReport(filePath, report, data);
        fileUrl = `/reports/${fileName}.html`;
        break;
        
      default:
        throw new Error(`Unsupported report format: ${report.format}`);
    }
    
    // Get file size
    const stats = await fs.promises.stat(filePath);
    const size = stats.size;
    
    return { fileUrl, size };
  } catch (error) {
    console.error(`Error generating report file:`, error);
    throw new Error(`Failed to generate report file: ${error.message}`);
  }
}

/**
 * Generate PDF report
 * @param {string} filePath - File path
 * @param {Object} report - Report configuration
 * @param {Object} data - Report data
 */
async function generatePdfReport(filePath, report, data) {
  // In a real implementation, this would use a PDF generation library
  // For this example, we'll just create a simple text file
  const content = `
    Report: ${report.name}
    Generated: ${new Date().toISOString()}
    
    Data:
    ${JSON.stringify(data, null, 2)}
  `;
  
  await fs.promises.writeFile(filePath, content);
}

/**
 * Generate CSV report
 * @param {string} filePath - File path
 * @param {Object} data - Report data
 */
async function generateCsvReport(filePath, data) {
  // In a real implementation, this would use a CSV generation library
  // For this example, we'll just create a simple CSV file
  if (!Array.isArray(data.rows)) {
    throw new Error('Data must contain rows array');
  }
  
  const headers = Object.keys(data.rows[0]).join(',');
  const rows = data.rows.map(row => Object.values(row).join(',')).join('\n');
  const content = `${headers}\n${rows}`;
  
  await fs.promises.writeFile(filePath, content);
}

/**
 * Generate Excel report
 * @param {string} filePath - File path
 * @param {Object} report - Report configuration
 * @param {Object} data - Report data
 */
async function generateExcelReport(filePath, report, data) {
  // In a real implementation, this would use the xlsx library
  // For this example, we'll just create a simple text file
  const content = `
    Report: ${report.name}
    Generated: ${new Date().toISOString()}
    
    Data:
    ${JSON.stringify(data, null, 2)}
  `;
  
  await fs.promises.writeFile(filePath, content);
}

/**
 * Generate HTML report
 * @param {string} filePath - File path
 * @param {Object} report - Report configuration
 * @param {Object} data - Report data
 */
async function generateHtmlReport(filePath, report, data) {
  // In a real implementation, this would use a template engine
  // For this example, we'll just create a simple HTML file
  const content = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${report.name}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
      </style>
    </head>
    <body>
      <h1>${report.name}</h1>
      <p>Generated: ${new Date().toISOString()}</p>
      
      <pre>${JSON.stringify(data, null, 2)}</pre>
    </body>
    </html>
  `;
  
  await fs.promises.writeFile(filePath, content);
}

/**
 * Send report to recipients
 * @param {Object} report - Report
 * @param {string} fileUrl - File URL
 */
async function sendReportToRecipients(report, fileUrl) {
  try {
    // In a real implementation, this would use nodemailer to send emails
    console.log(`Sending report ${report.name} to recipients: ${report.recipients.emails.join(', ')}`);
    console.log(`File URL: ${fileUrl}`);
    
    // This is a placeholder for the actual email sending logic
  } catch (error) {
    console.error(`Error sending report to recipients:`, error);
    throw new Error(`Failed to send report to recipients: ${error.message}`);
  }
}