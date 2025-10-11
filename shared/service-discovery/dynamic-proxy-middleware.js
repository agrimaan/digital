/**
 * Dynamic Proxy Middleware (class version)
 * Creates dynamic proxies using service discovery
 */

const { createProxyMiddleware } = require('http-proxy-middleware')
const ServiceDiscovery = require('./service-discovery')

class DynamicProxy {
  constructor(discovery) {
    this.discovery = discovery || new ServiceDiscovery()
    this.handleProxyError = this.handleProxyError.bind(this)
  }

  /**
   * Express error handler for proxy errors
   */
  handleProxyError(err, req, res, next) {
    console.error('Proxy Error:', err)

    if (err && err.code === 'ECONNREFUSED') {
      return res.status(503).json({
        message: 'Service unavailable',
        error: 'The requested service is currently unavailable. Please try again later.'
      })
    }

    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err.message : {}
    })
  }

  /**
   * Build an Express middleware that proxies to a discovered service
   * serviceName: string
   * pathPrefix: string
   * options: http-proxy-middleware options
   */
  create(serviceName, pathPrefix, options = {}) {
    return async (req, res, next) => {
      try {
        const serviceUrl = await this.discovery.getServiceUrl(serviceName)

        const proxy = createProxyMiddleware({
          target: serviceUrl,
          changeOrigin: true,
          pathRewrite: {
            [`^${pathPrefix}`]: ''
          },
          onError: this.handleProxyError,
          ...options
        })

        return proxy(req, res, next)
      } catch (error) {
        console.error(`Service discovery error for ${serviceName}:`, error)
        return res.status(503).json({
          message: 'Service unavailable',
          error: 'The requested service is currently unavailable. Please try again later.'
        })
      }
    }
  }
}


