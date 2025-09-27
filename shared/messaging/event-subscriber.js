/**
 * Event Subscriber
 * 
 * This module provides functionality for subscribing to events from RabbitMQ.
 * It handles event validation, correlation ID propagation, and consuming from queues.
 */

const messageBroker = require('./message-broker');

class EventSubscriber {
  /**
   * Create a new EventSubscriber instance
   * 
   * @param {Object} [options={}] - Configuration options
   * @param {string} [options.exchange='events'] - Default exchange name
   * @param {string} [options.queuePrefix=''] - Prefix for queue names
   * @param {Object} [options.schemas={}] - Event schemas for validation
   */
  constructor(options = {}) {
    this.exchange = options.exchange || 'events';
    this.queuePrefix = options.queuePrefix || '';
    this.schemas = options.schemas || {};
    this.initialized = false;
    this.handlers = new Map();
  }
  
  /**
   * Initialize the event subscriber
   * 
   * @returns {Promise<void>} A promise that resolves when initialization is complete
   */
  async init() {
    if (this.initialized) return;
    
    // Connect to RabbitMQ
    await messageBroker.connect();
    
    // Create the events exchange
    await messageBroker.createExchange(this.exchange, 'topic', {
      durable: true
    });
    
    this.initialized = true;
  }
  
  /**
   * Validate an event against its schema
   * 
   * @param {string} eventType - Event type
   * @param {Object} eventData - Event data
   * @returns {boolean} True if valid, throws error if invalid
   */
  validateEvent(eventType, eventData) {
    // If no schema is defined for this event type, consider it valid
    if (!this.schemas[eventType]) {
      return true;
    }
    
    const schema = this.schemas[eventType];
    
    // If schema is a function, use it for validation
    if (typeof schema === 'function') {
      const result = schema(eventData);
      
      if (result === true) {
        return true;
      }
      
      throw new Error(`Event validation failed: ${result}`);
    }
    
    // If schema is an object with a validate method (like Joi), use it
    if (typeof schema.validate === 'function') {
      const { error } = schema.validate(eventData);
      
      if (!error) {
        return true;
      }
      
      throw new Error(`Event validation failed: ${error.message}`);
    }
    
    return true;
  }
  
  /**
   * Subscribe to an event
   * 
   * @param {string} eventType - Event type
   * @param {Function} handler - Event handler
   * @param {Object} [options={}] - Subscribe options
   * @returns {Promise<Object>} A promise that resolves to the consumer
   */
  async subscribe(eventType, handler, options = {}) {
    await this.init();
    
    // Create a unique queue name for this subscriber
    const serviceName = process.env.SERVICE_NAME || 'unknown-service';
    const queueName = `${this.queuePrefix}${serviceName}.${eventType}`;
    
    // Create queue with dead letter exchange
    await messageBroker.createDeadLetterQueue(queueName, {
      durable: true,
      ...options
    });
    
    // Bind queue to exchange with routing key
    await messageBroker.bindQueue(queueName, this.exchange, eventType);
    
    // Store handler for this event type
    this.handlers.set(eventType, handler);
    
    // Consume messages from queue
    return messageBroker.consume(queueName, async (event, msg, context) => {
      try {
        // Validate event
        if (event.type !== eventType) {
          throw new Error(`Event type mismatch: expected ${eventType}, got ${event.type}`);
        }
        
        this.validateEvent(eventType, event.data);
        
        // Call handler with event data and context
        await handler(event.data, {
          eventId: event.id,
          eventType: event.type,
          timestamp: event.timestamp,
          correlationId: context.correlationId,
          metadata: event.metadata
        });
      } catch (error) {
        console.error(`Error handling event ${eventType}:`, error);
        throw error; // Rethrow to trigger nack
      }
    }, {
      ...options,
      // By default, don't requeue failed messages (they'll go to dead letter queue)
      requeue: options.requeue !== undefined ? options.requeue : false
    });
  }
  
  /**
   * Register a schema for event validation
   * 
   * @param {string} eventType - Event type
   * @param {Object|Function} schema - Validation schema
   */
  registerSchema(eventType, schema) {
    this.schemas[eventType] = schema;
  }
  
  /**
   * Get all registered handlers
   * 
   * @returns {Map<string, Function>} Map of event types to handlers
   */
  getHandlers() {
    return this.handlers;
  }
}

module.exports = EventSubscriber;