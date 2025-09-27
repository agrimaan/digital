/**
 * Shared Metrics Module
 * 
 * This module provides metrics collection for microservices.
 */

const promClient = require('prom-client');
const express = require('express');

// Create a Registry to register the metrics
const register = new promClient.Registry();

// Add default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({ register });

/**
 * Create metrics for a microservice
 * 
 * @param {Object} options - Metrics options
 * @param {string} options.serviceName - Name of the service
 * @returns {Object} Metrics object with counters, gauges, and histograms
 */
function createMetrics(options) {
  const { serviceName } = options;
  
  // Create HTTP request counter
  const httpRequestsTotal = new promClient.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status'],
    registers: [register]
  });
  
  // Create HTTP request duration histogram
  const httpRequestDurationMs = new promClient.Histogram({
    name: 'http_request_duration_ms',
    help: 'HTTP request duration in milliseconds',
    labelNames: ['method', 'route', 'status'],
    buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
    registers: [register]
  });
  
  // Create active connections gauge
  const activeConnections = new promClient.Gauge({
    name: 'active_connections',
    help: 'Number of active connections',
    registers: [register]
  });
  
  // Create service-specific metrics
  const serviceOperationsTotal = new promClient.Counter({
    name: `${serviceName.replace(/-/g, '_')}_operations_total`,
    help: `Total number of ${serviceName} operations`,
    labelNames: ['operation', 'status'],
    registers: [register]
  });
  
  // Create middleware for HTTP metrics
  const httpMetricsMiddleware = (req, res, next) => {
    const start = Date.now();
    
    // Increment active connections
    activeConnections.inc();
    
    // Record end time and metrics on response finish
    res.on('finish', () => {
      // Decrement active connections
      activeConnections.dec();
      
      // Get route path (normalize to avoid high cardinality)
      const route = req.route ? req.route.path : req.path;
      
      // Record metrics
      httpRequestsTotal.inc({
        method: req.method,
        route,
        status: res.statusCode
      });
      
      httpRequestDurationMs.observe(
        {
          method: req.method,
          route,
          status: res.statusCode
        },
        Date.now() - start
      );
    });
    
    next();
  };
  
  // Create metrics endpoint
  const metricsEndpoint = async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  };
  
  // Setup metrics routes
  const setupMetricsRoutes = (app) => {
    app.get('/metrics', metricsEndpoint);
  };
  
  return {
    httpRequestsTotal,
    httpRequestDurationMs,
    activeConnections,
    serviceOperationsTotal,
    httpMetricsMiddleware,
    metricsEndpoint,
    setupMetricsRoutes,
    register
  };
}

module.exports = {
  createMetrics
};
