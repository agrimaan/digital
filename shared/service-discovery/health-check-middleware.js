/**
 * Health Check (class version)
 */

class HealthChecker {
  /**
   * @param {Object} options
   * @param {string} options.serviceName
   * @param {Function[]} [options.checks=[]] async functions returning { name, details? }
   * @param {Object} [options.httpClient] optional default HTTP client (e.g., axios)
   */
  constructor({ serviceName, checks = [], httpClient } = {}) {
    if (!serviceName) throw new Error('serviceName is required')
    this.serviceName = serviceName
    this.checks = Array.isArray(checks) ? checks : []
    this.httpClient = httpClient
    this.middleware = this.middleware.bind(this)
  }

  /**
   * Add a custom check
   * @param {Function} check async function
   */
  addCheck(check) {
    this.checks.push(check)
    return this
  }

  /**
   * Express middleware handler
   */
  async middleware(req, res) {
    try {
      const results = await Promise.all(
        this.checks.map(async (check) => {
          try {
            const result = await check()
            return {
              name: result.name,
              status: 'UP',
              details: result.details || {}
            }
          } catch (error) {
            return {
              name: error.name || 'UnknownCheck',
              status: 'DOWN',
              details: {
                error: error.message,
                ...(error.details || {})
              }
            }
          }
        })
      )

      const isDown = results.some(r => r.status === 'DOWN')

      const response = {
        status: isDown ? 'DOWN' : 'UP',
        service: this.serviceName,
        timestamp: new Date().toISOString(),
        checks: results
      }

      res.status(isDown ? 503 : 200).json(response)
    } catch (error) {
      console.error('Health check error:', error)
      res.status(500).json({
        status: 'DOWN',
        service: this.serviceName,
        timestamp: new Date().toISOString(),
        error: error.message
      })
    }
  }

  /**
   * Static helper to create a DB check
   * @param {Object} db database client, e.g., mongoose
   * @param {string} dbName
   */
  static createDatabaseCheck(db, dbName) {
    return async () => {
      try {
        // Mongoose style
        if (db && db.connection && typeof db.connection.db?.admin === 'function') {
          await db.connection.db.admin().ping()
          return {
            name: `${dbName}Connection`,
            details: {
              database: dbName,
              status: 'Connected'
            }
          }
        }

        // Generic client with ping()
        if (db && typeof db.ping === 'function') {
          await db.ping()
          return {
            name: `${dbName}Connection`,
            details: {
              database: dbName,
              status: 'Connected'
            }
          }
        }

        throw new Error('Database connection check not implemented')
      } catch (error) {
        const err = new Error(`Database connection failed: ${error.message}`)
        err.name = `${dbName}Connection`
        err.details = { database: dbName, error: error.message }
        throw err
      }
    }
  }

  /**
   * Static helper to create a service dependency check
   * @param {string} serviceName dependency name
   * @param {string} serviceUrl dependency base URL
   * @param {Object} httpClient HTTP client with get()
   */
  static createServiceCheck(serviceName, serviceUrl, httpClient) {
    if (!httpClient || typeof httpClient.get !== 'function') {
      throw new Error('httpClient with get() is required for service checks')
    }

    return async () => {
      try {
        const response = await httpClient.get(`${serviceUrl}/health`, { timeout: 5000 })
        if (response.status !== 200) {
          throw new Error(`Service returned status ${response.status}`)
        }
        return {
          name: `${serviceName}Dependency`,
          details: {
            service: serviceName,
            status: 'Available',
            url: serviceUrl
          }
        }
      } catch (error) {
        const err = new Error(`Service dependency check failed: ${error.message}`)
        err.name = `${serviceName}Dependency`
        err.details = { service: serviceName, url: serviceUrl, error: error.message }
        throw err
      }
    }
  }
}

module.exports = HealthChecker
