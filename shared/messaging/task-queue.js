/**
 * Task Queue
 * 
 * This module provides functionality for publishing and processing tasks using RabbitMQ.
 * It handles task validation, correlation ID propagation, and task processing.
 */

const messageBroker = require('./message-broker');
const { v4: uuidv4 } = require('uuid');

class TaskQueue {
  /**
   * Create a new TaskQueue instance
   * 
   * @param {Object} [options={}] - Configuration options
   * @param {string} [options.queueName='tasks'] - Queue name
   * @param {Object} [options.schemas={}] - Task schemas for validation
   */
  constructor(options = {}) {
    this.queueName = options.queueName || 'tasks';
    this.schemas = options.schemas || {};
    this.initialized = false;
    this.processors = new Map();
  }
  
  /**
   * Initialize the task queue
   * 
   * @returns {Promise<void>} A promise that resolves when initialization is complete
   */
  async init() {
    if (this.initialized) return;
    
    // Connect to RabbitMQ
    await messageBroker.connect();
    
    // Create queue with dead letter exchange
    await messageBroker.createDeadLetterQueue(this.queueName, {
      durable: true
    });
    
    this.initialized = true;
  }
  
  /**
   * Validate a task against its schema
   * 
   * @param {string} taskType - Task type
   * @param {Object} taskData - Task data
   * @returns {boolean} True if valid, throws error if invalid
   */
  validateTask(taskType, taskData) {
    // If no schema is defined for this task type, consider it valid
    if (!this.schemas[taskType]) {
      return true;
    }
    
    const schema = this.schemas[taskType];
    
    // If schema is a function, use it for validation
    if (typeof schema === 'function') {
      const result = schema(taskData);
      
      if (result === true) {
        return true;
      }
      
      throw new Error(`Task validation failed: ${result}`);
    }
    
    // If schema is an object with a validate method (like Joi), use it
    if (typeof schema.validate === 'function') {
      const { error } = schema.validate(taskData);
      
      if (!error) {
        return true;
      }
      
      throw new Error(`Task validation failed: ${error.message}`);
    }
    
    return true;
  }
  
  /**
   * Publish a task
   * 
   * @param {string} taskType - Task type
   * @param {Object} taskData - Task data
   * @param {Object} [options={}] - Publish options
   * @returns {Promise<string>} A promise that resolves to the task ID
   */
  async publish(taskType, taskData, options = {}) {
    await this.init();
    
    // Validate task data
    this.validateTask(taskType, taskData);
    
    // Get correlation ID from context or options, or generate a new one
    const correlationId = global.requestContext?.correlationId || options.correlationId || uuidv4();
    
    // Create task object
    const taskId = options.taskId || uuidv4();
    const task = {
      id: taskId,
      type: taskType,
      timestamp: new Date().toISOString(),
      data: taskData,
      metadata: {
        correlationId,
        priority: options.priority || 0,
        ...options.metadata
      }
    };
    
    // Publish task to queue
    await messageBroker.sendToQueue(this.queueName, task, {
      correlationId,
      priority: options.priority,
      ...options
    });
    
    return taskId;
  }
  
  /**
   * Register a task processor
   * 
   * @param {string} taskType - Task type
   * @param {Function} processor - Task processor function
   */
  registerProcessor(taskType, processor) {
    this.processors.set(taskType, processor);
  }
  
  /**
   * Start processing tasks
   * 
   * @param {Object} [options={}] - Processing options
   * @returns {Promise<Object>} A promise that resolves to the consumer
   */
  async startProcessing(options = {}) {
    await this.init();
    
    // Consume messages from queue
    return messageBroker.consume(this.queueName, async (task, msg, context) => {
      try {
        const { type: taskType, data: taskData } = task;
        
        // Find processor for this task type
        const processor = this.processors.get(taskType);
        
        if (!processor) {
          throw new Error(`No processor registered for task type: ${taskType}`);
        }
        
        // Validate task
        this.validateTask(taskType, taskData);
        
        // Call processor with task data and context
        await processor(taskData, {
          taskId: task.id,
          taskType,
          timestamp: task.timestamp,
          correlationId: context.correlationId,
          metadata: task.metadata
        });
      } catch (error) {
        console.error(`Error processing task:`, error);
        throw error; // Rethrow to trigger nack
      }
    }, {
      ...options,
      // By default, don't requeue failed tasks (they'll go to dead letter queue)
      requeue: options.requeue !== undefined ? options.requeue : false
    });
  }
  
  /**
   * Register a schema for task validation
   * 
   * @param {string} taskType - Task type
   * @param {Object|Function} schema - Validation schema
   */
  registerSchema(taskType, schema) {
    this.schemas[taskType] = schema;
  }
  
  /**
   * Get all registered processors
   * 
   * @returns {Map<string, Function>} Map of task types to processors
   */
  getProcessors() {
    return this.processors;
  }
}

module.exports = TaskQueue;