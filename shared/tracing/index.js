/**
 * Shared Tracing Module
 * 
 * This module provides distributed tracing functionality for microservices.
 */

const opentelemetry = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-proto');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { BatchSpanProcessor } = require('@opentelemetry/sdk-trace-base');

/**
 * Initialize OpenTelemetry tracing for a microservice
 * 
 * @param {Object} options - Tracing options
 * @param {string} options.serviceName - Name of the service
 * @param {string} options.jaegerEndpoint - Jaeger collector endpoint (default: 'http://jaeger:4318/v1/traces')
 * @returns {opentelemetry.NodeSDK} OpenTelemetry SDK instance
 */
function initTracing(options) {
  const { serviceName, jaegerEndpoint = 'http://jaeger:4318/v1/traces' } = options;
  
  const traceExporter = new OTLPTraceExporter({
    url: jaegerEndpoint,
  });
  
  const sdk = new opentelemetry.NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
    }),
    spanProcessor: new BatchSpanProcessor(traceExporter),
    instrumentations: [getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-express': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-mongodb': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-mongoose': {
        enabled: true,
      },
    })],
  });
  
  // Initialize the SDK
  sdk.start();
  
  // Gracefully shut down the SDK on process exit
  process.on('SIGTERM', () => {
    sdk.shutdown()
      .then(() => console.log('Tracing terminated'))
      .catch((error) => console.log('Error terminating tracing', error))
      .finally(() => process.exit(0));
  });
  
  return sdk;
}

/**
 * Create a middleware for adding correlation IDs to requests
 * 
 * @returns {Function} Express middleware function
 */
function correlationIdMiddleware() {
  return (req, res, next) => {
    const correlationId = req.headers['x-correlation-id'] || generateCorrelationId();
    req.correlationId = correlationId;
    res.setHeader('x-correlation-id', correlationId);
    next();
  };
}

/**
 * Generate a unique correlation ID
 * 
 * @returns {string} Correlation ID
 */
function generateCorrelationId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

module.exports = {
  initTracing,
  correlationIdMiddleware,
};
