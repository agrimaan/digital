/**
 * Health Check Middleware
 * 
 * This middleware provides a standardized health check endpoint for all services.
 * It can be used to check the health of the service and its dependencies.
 */

/**
 * Create a health check middleware
 * 
 * @param {Object} options - Health check options
 * @param {string} options.serviceName - Name of the service
 * @param {Function[]} [options.checks=[]] - Array of health check functions
 * @returns {Function} Express middleware function
 */
const createHealthCheck = (options) => {
  const { serviceName, checks = [] } = options;
  
  return async (req, res) => {
    try {
      // Run all health checks
      const results = await Promise.all(checks.map(async (check) => {
        try {
          const result = await check();
          return {
            name: result.name,
            status: 'UP',
            details: result.details || {}
          };
        } catch (error) {
          return {
            name: error.name || 'UnknownCheck',
            status: 'DOWN',
            details: {
              error: error.message,
              ...error.details
            }
          };
        }
      }));
      
      // Determine overall status
      const isDown = results.some(result => result.status === 'DOWN');
      
      // Create response
      const response = {
        status: isDown ? 'DOWN' : 'UP',
        service: serviceName,
        timestamp: new Date().toISOString(),
        checks: results
      };
      
      // Send response with appropriate status code
      res.status(isDown ? 503 : 200).json(response);
    } catch (error) {
      console.error('Health check error:', error);
      res.status(500).json({
        status: 'DOWN',
        service: serviceName,
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  };
};

/**
 * Create a database health check function
 * 
 * @param {Object} db - Database connection object (e.g., mongoose)
 * @param {string} dbName - Name of the database
 * @returns {Function} Health check function
 */
const createDatabaseCheck = (db, dbName) => {
  return async () => {
    try {
      // For mongoose
      if (db.connection && typeof db.connection.db.admin === 'function') {
        await db.connection.db.admin().ping();
        return {
          name: `${dbName}Connection`,
          details: {
            database: dbName,
            status: 'Connected'
          }
        };
      }
      
      // For other database connections
      if (typeof db.ping === 'function') {
        await db.ping();
        return {
          name: `${dbName}Connection`,
          details: {
            database: dbName,
            status: 'Connected'
          }
        };
      }
      
      throw new Error('Database connection check not implemented');
    } catch (error) {
      throw {
        name: `${dbName}Connection`,
        message: `Database connection failed: ${error.message}`,
        details: {
          database: dbName,
          error: error.message
        }
      };
    }
  };
};

/**
 * Create a service dependency health check function
 * 
 * @param {string} serviceName - Name of the dependent service
 * @param {string} serviceUrl - URL of the dependent service
 * @param {Object} httpClient - HTTP client (e.g., axios)
 * @returns {Function} Health check function
 */
const createServiceCheck = (serviceName, serviceUrl, httpClient) => {
  return async () => {
    try {
      const response = await httpClient.get(`${serviceUrl}/health`, {
        timeout: 5000
      });
      
      if (response.status !== 200) {
        throw new Error(`Service returned status ${response.status}`);
      }
      
      return {
        name: `${serviceName}Dependency`,
        details: {
          service: serviceName,
          status: 'Available',
          url: serviceUrl
        }
      };
    } catch (error) {
      throw {
        name: `${serviceName}Dependency`,
        message: `Service dependency check failed: ${error.message}`,
        details: {
          service: serviceName,
          url: serviceUrl,
          error: error.message
        }
      };
    }
  };
};

module.exports = {
  createHealthCheck,
  createDatabaseCheck,
  createServiceCheck
};