const AuditLog = require('../models/AuditLog');

/**
 * Create a new audit log entry
 * @param {Object} logData - Audit log data
 * @returns {Object} Created audit log
 */
exports.createLog = async (logData) => {
  try {
    const log = await AuditLog.createLog(logData);
    return log;
  } catch (error) {
    console.error('Create audit log error:', error);
    throw new Error(`Failed to create audit log: ${error.message}`);
  }
};

/**
 * Get audit logs by admin
 * @param {string} adminId - Admin ID
 * @param {Object} options - Query options
 * @returns {Array} Audit logs
 */
exports.getLogsByAdmin = async (adminId, options = {}) => {
  try {
    const { page = 1, limit = 20, sort = { timestamp: -1 } } = options;
    
    const logs = await AuditLog.find({ adminId })
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);
      
    const total = await AuditLog.countDocuments({ adminId });
    
    return {
      logs,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Get logs by admin error:', error);
    throw new Error(`Failed to get logs by admin: ${error.message}`);
  }
};

/**
 * Get audit logs by resource
 * @param {string} resourceType - Resource type
 * @param {string} resourceId - Resource ID (optional)
 * @param {Object} options - Query options
 * @returns {Array} Audit logs
 */
exports.getLogsByResource = async (resourceType, resourceId = null, options = {}) => {
  try {
    const { page = 1, limit = 20, sort = { timestamp: -1 } } = options;
    
    const query = { resourceType };
    if (resourceId) {
      query.resourceId = resourceId;
    }
    
    const logs = await AuditLog.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);
      
    const total = await AuditLog.countDocuments(query);
    
    return {
      logs,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Get logs by resource error:', error);
    throw new Error(`Failed to get logs by resource: ${error.message}`);
  }
};

/**
 * Get audit logs by action
 * @param {string} action - Action
 * @param {Object} options - Query options
 * @returns {Array} Audit logs
 */
exports.getLogsByAction = async (action, options = {}) => {
  try {
    const { page = 1, limit = 20, sort = { timestamp: -1 } } = options;
    
    const logs = await AuditLog.find({ action })
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);
      
    const total = await AuditLog.countDocuments({ action });
    
    return {
      logs,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Get logs by action error:', error);
    throw new Error(`Failed to get logs by action: ${error.message}`);
  }
};

/**
 * Get audit logs by date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {Object} options - Query options
 * @returns {Array} Audit logs
 */
exports.getLogsByDateRange = async (startDate, endDate, options = {}) => {
  try {
    const { page = 1, limit = 20, sort = { timestamp: -1 } } = options;
    
    const logs = await AuditLog.find({
      timestamp: {
        $gte: startDate,
        $lte: endDate
      }
    })
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);
      
    const total = await AuditLog.countDocuments({
      timestamp: {
        $gte: startDate,
        $lte: endDate
      }
    });
    
    return {
      logs,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Get logs by date range error:', error);
    throw new Error(`Failed to get logs by date range: ${error.message}`);
  }
};

/**
 * Get all audit logs with filtering
 * @param {Object} filter - Filter criteria
 * @param {Object} options - Query options
 * @returns {Array} Audit logs
 */
exports.getAllLogs = async (filter = {}, options = {}) => {
  try {
    const { page = 1, limit = 20, sort = { timestamp: -1 } } = options;
    
    // Process filter parameters
    const query = {};
    
    if (filter.adminId) query.adminId = filter.adminId;
    if (filter.action) query.action = filter.action;
    if (filter.resourceType) query.resourceType = filter.resourceType;
    if (filter.resourceId) query.resourceId = filter.resourceId;
    if (filter.status) query.status = filter.status;
    
    if (filter.startDate && filter.endDate) {
      query.timestamp = {
        $gte: new Date(filter.startDate),
        $lte: new Date(filter.endDate)
      };
    } else if (filter.startDate) {
      query.timestamp = { $gte: new Date(filter.startDate) };
    } else if (filter.endDate) {
      query.timestamp = { $lte: new Date(filter.endDate) };
    }
    
    if (filter.search) {
      query.$or = [
        { description: { $regex: filter.search, $options: 'i' } },
        { adminName: { $regex: filter.search, $options: 'i' } }
      ];
    }
    
    const logs = await AuditLog.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);
      
    const total = await AuditLog.countDocuments(query);
    
    return {
      logs,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Get all logs error:', error);
    throw new Error(`Failed to get logs: ${error.message}`);
  }
};

/**
 * Get audit log statistics
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Object} Audit log statistics
 */
exports.getLogStatistics = async (startDate, endDate) => {
  try {
    const query = {
      timestamp: {
        $gte: startDate,
        $lte: endDate
      }
    };
    
    // Get total count
    const totalCount = await AuditLog.countDocuments(query);
    
    // Get counts by action
    const actionCounts = await AuditLog.aggregate([
      { $match: query },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Get counts by resource type
    const resourceTypeCounts = await AuditLog.aggregate([
      { $match: query },
      { $group: { _id: '$resourceType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Get counts by status
    const statusCounts = await AuditLog.aggregate([
      { $match: query },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Get counts by admin
    const adminCounts = await AuditLog.aggregate([
      { $match: query },
      { $group: { _id: { id: '$adminId', name: '$adminName' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Get counts by day
    const dailyCounts = await AuditLog.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
            day: { $dayOfMonth: '$timestamp' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);
    
    // Format daily counts
    const formattedDailyCounts = dailyCounts.map(item => ({
      date: new Date(item._id.year, item._id.month - 1, item._id.day).toISOString().split('T')[0],
      count: item.count
    }));
    
    return {
      totalCount,
      actionCounts,
      resourceTypeCounts,
      statusCounts,
      adminCounts,
      dailyCounts: formattedDailyCounts
    };
  } catch (error) {
    console.error('Get log statistics error:', error);
    throw new Error(`Failed to get log statistics: ${error.message}`);
  }
};

/**
 * Delete old audit logs
 * @param {Date} olderThan - Date threshold
 * @returns {number} Number of deleted logs
 */
exports.deleteOldLogs = async (olderThan) => {
  try {
    const result = await AuditLog.deleteMany({
      timestamp: { $lt: olderThan }
    });
    
    return result.deletedCount;
  } catch (error) {
    console.error('Delete old logs error:', error);
    throw new Error(`Failed to delete old logs: ${error.message}`);
  }
};