/**
 * Shared Logging Module
 * 
 * This module provides a configured logger instance for microservices.
 */

const winston = require('winston');
const { format } = winston;

/**
 * Create a logger instance for a microservice
 * 
 * @param {Object} options - Logger options
 * @param {string} options.serviceName - Name of the service
 * @param {string} options.level - Log level (default: 'info')
 * @returns {winston.Logger} Logger instance
 */
function createLogger(options) {
  const { serviceName, level = 'info' } = options;
  
  return winston.createLogger({
    level,
    format: format.combine(
      format.timestamp(),
      format.errors({ stack: true }),
      format.metadata(),
      format.json()
    ),
    defaultMeta: { service: serviceName },
    transports: [
      new winston.transports.Console({
        format: format.combine(
          format.colorize(),
          format.printf(({ timestamp, level, message, service, metadata }) => {
            return `${timestamp} [${service}] ${level}: ${message} ${JSON.stringify(metadata)}`;
          })
        )
      })
    ]
  });
}

module.exports = {
  createLogger
};
