/**
 * Event Publisher
 * 
 * This module provides functionality for publishing events to RabbitMQ.
 * It handles event validation, correlation ID propagation, and publishing to exchanges.
 */

const messageBroker = require('./message-broker');
const { v4: uuidv4 } = require('uuid');

class EventPublisher {
  /**
   * Create a new EventPublisher instance
   * 
   * @param {Object} [options={}] - Configuration options
   * @param {string} [options.exchange='events'] - Default exchange name
   * @param {Object} [options.schemas={}] - Event schemas for validation
   */
  constructor(options = {}) {
    this.exchange = options.exchange || 'events';
    this.schemas = options.schemas || {};
    this.initialized = false;
  }
  
  /**
   * Initialize the event publisher
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
   * Publish an event
   * 
   * @param {string} eventType - Event type
   * @param {Object} eventData - Event data
   * @param {Object} [options={}] - Publish options
   * @returns {Promise<boolean>} A promise that resolves to true if successful
   */
  async publish(eventType, eventData, options = {}) {
    await this.init();
    
    // Validate event data
    this.validateEvent(eventType, eventData);
    
    // Get correlation ID from context or options, or generate a new one
    const correlationId = global.requestContext?.correlationId || options.correlationId || uuidv4();
    
    // Create event object
    const event = {
      id: uuidv4(),
      type: eventType,
      timestamp: new Date().toISOString(),
      data: eventData,
      metadata: {
        correlationId,
        ...options.metadata
      }
    };
    
    // Publish event to exchange
    return messageBroker.publish(this.exchange, eventType, event, {
      correlationId,
      ...options
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
}

module.exports = EventPublisher;