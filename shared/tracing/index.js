// tracing.js

const opentelemetry = require('@opentelemetry/sdk-node')
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node')
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-proto')
const { Resource } = require('@opentelemetry/resources')
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions')
const { BatchSpanProcessor } = require('@opentelemetry/sdk-trace-base')

class Tracing {
  /**
   * @param {Object} options
   * @param {string} options.serviceName
   * @param {string} [options.jaegerEndpoint='http://jaeger:4318/v1/traces']
   * @param {boolean} [options.autoShutdown=true] attach SIGTERM handler
   */
  constructor({ serviceName, jaegerEndpoint = 'http://jaeger:4318/v1/traces', autoShutdown = true } = {}) {
    if (!serviceName) throw new Error('serviceName is required')

    this.serviceName = serviceName
    this.jaegerEndpoint = jaegerEndpoint
    this.autoShutdown = autoShutdown
    this.sdk = null
    this._onSigterm = null
  }

  start() {
    if (this.sdk) return this.sdk

    const traceExporter = new OTLPTraceExporter({ url: this.jaegerEndpoint })

    this.sdk = new opentelemetry.NodeSDK({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: this.serviceName,
        [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development'
      }),
      spanProcessor: new BatchSpanProcessor(traceExporter),
      instrumentations: [
        getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-http': { enabled: true },
          '@opentelemetry/instrumentation-express': { enabled: true },
          '@opentelemetry/instrumentation-mongodb': { enabled: true },
          '@opentelemetry/instrumentation-mongoose': { enabled: true }
        })
      ]
    })

    this.sdk.start()

    if (this.autoShutdown) {
      this._onSigterm = async () => {
        try {
          await this.shutdown()
          console.log('Tracing terminated')
        } catch (err) {
          console.log('Error terminating tracing', err)
        } finally {
          process.exit(0)
        }
      }
      process.on('SIGTERM', this._onSigterm)
    }

    return this.sdk
  }

  async shutdown() {
    if (!this.sdk) return
    if (this._onSigterm) {
      process.off('SIGTERM', this._onSigterm)
      this._onSigterm = null
    }
    await this.sdk.shutdown()
    this.sdk = null
  }

  /**
   * Express middleware that adds x-correlation-id to requests and responses
   * @returns {Function}
   */
  correlationIdMiddleware() {
    return (req, res, next) => {
      const incoming = req.headers['x-correlation-id']
      const correlationId = incoming || Tracing.generateCorrelationId()
      req.correlationId = correlationId
      res.setHeader('x-correlation-id', correlationId)
      next()
    }
  }

  /**
   * Access underlying NodeSDK instance
   */
  getSDK() {
    return this.sdk
  }

  static generateCorrelationId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

module.exports = Tracing
