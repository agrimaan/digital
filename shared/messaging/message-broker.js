/**
 * Message Broker
 * 
 * This module provides a client for RabbitMQ message broker.
 * It handles connection management, reconnection, and provides methods for
 * publishing and consuming messages.
 */

const amqp = require('amqplib');
const { v4: uuidv4 } = require('uuid');

class MessageBroker {
  /**
   * Create a new MessageBroker instance
   * 
   * @param {Object} [options={}] - Configuration options
   * @param {string} [options.url] - RabbitMQ URL
   * @param {number} [options.reconnectTimeout=5000] - Reconnection timeout in milliseconds
   * @param {number} [options.heartbeatInterval=30] - Heartbeat interval in seconds
   */
  constructor(options = {}) {
    this.connection = null;
    this.channel = null;
    this.url = options.url || process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';
    this.reconnectTimeout = options.reconnectTimeout || 5000;
    this.heartbeatInterval = options.heartbeatInterval || 30;
    this.connectionPromise = null;
    this.channelPromise = null;
    this.isConnecting = false;
    this.consumers = new Map();
  }
  
  /**
   * Connect to RabbitMQ
   * 
   * @returns {Promise<void>} A promise that resolves when connected
   */
  async connect() {
    if (this.connection) return;
    
    if (this.isConnecting) {
      return this.connectionPromise;
    }
    
    this.isConnecting = true;
    
    this.connectionPromise = new Promise(async (resolve, reject) => {
      try {
        console.log(`Connecting to RabbitMQ at ${this.url}`);
        
        this.connection = await amqp.connect(this.url, {
          heartbeat: this.heartbeatInterval
        });
        
        this.channel = await this.connection.createChannel();
        
        // Handle connection close
        this.connection.on('close', () => {
          console.log('RabbitMQ connection closed');
          this.connection = null;
          this.channel = null;
          this.channelPromise = null;
          this.connectionPromise = null;
          
          // Attempt to reconnect after delay
          setTimeout(() => {
            this.isConnecting = false;
            this.connect().then(() => this.reconnectConsumers());
          }, this.reconnectTimeout);
        });
        
        // Handle connection error
        this.connection.on('error', (err) => {
          console.error('RabbitMQ connection error:', err.message);
          // Connection errors will trigger the close event
        });
        
        console.log('Connected to RabbitMQ');
        this.isConnecting = false;
        resolve();
      } catch (error) {
        console.error('Error connecting to RabbitMQ:', error.message);
        this.isConnecting = false;
        
        // Retry connection after delay
        setTimeout(() => {
          this.connect().catch(() => {});
        }, this.reconnectTimeout);
        
        reject(error);
      }
    });
    
    return this.connectionPromise;
  }
  
  /**
   * Get a channel
   * 
   * @returns {Promise<Object>} A promise that resolves to a channel
   */
  async getChannel() {
    if (!this.connection) {
      await this.connect();
    }
    
    if (this.channel) {
      return this.channel;
    }
    
    if (this.channelPromise) {
      return this.channelPromise;
    }
    
    this.channelPromise = this.connection.createChannel();
    this.channel = await this.channelPromise;
    return this.channel;
  }
  
  /**
   * Create a queue
   * 
   * @param {string} queue - Queue name
   * @param {Object} [options={}] - Queue options
   * @returns {Promise<Object>} A promise that resolves to the queue
   */
  async createQueue(queue, options = {}) {
    const channel = await this.getChannel();
    return channel.assertQueue(queue, {
      durable: true,
      ...options
    });
  }
  
  /**
   * Create an exchange
   * 
   * @param {string} exchange - Exchange name
   * @param {string} [type='topic'] - Exchange type
   * @param {Object} [options={}] - Exchange options
   * @returns {Promise<Object>} A promise that resolves to the exchange
   */
  async createExchange(exchange, type = 'topic', options = {}) {
    const channel = await this.getChannel();
    return channel.assertExchange(exchange, type, {
      durable: true,
      ...options
    });
  }
  
  /**
   * Bind a queue to an exchange
   * 
   * @param {string} queue - Queue name
   * @param {string} exchange - Exchange name
   * @param {string} routingKey - Routing key
   * @returns {Promise<Object>} A promise that resolves when binding is complete
   */
  async bindQueue(queue, exchange, routingKey) {
    const channel = await this.getChannel();
    return channel.bindQueue(queue, exchange, routingKey);
  }
  
  /**
   * Publish a message to an exchange
   * 
   * @param {string} exchange - Exchange name
   * @param {string} routingKey - Routing key
   * @param {Object} message - Message to publish
   * @param {Object} [options={}] - Publish options
   * @returns {Promise<boolean>} A promise that resolves to true if successful
   */
  async publish(exchange, routingKey, message, options = {}) {
    const channel = await this.getChannel();
    
    // Create a buffer from the message
    const buffer = Buffer.from(JSON.stringify(message));
    
    // Get correlation ID from context or generate a new one
    const correlationId = global.requestContext?.correlationId || options.correlationId || uuidv4();
    
    return channel.publish(exchange, routingKey, buffer, {
      persistent: true,
      ...options,
      headers: {
        'x-correlation-id': correlationId,
        ...options.headers
      }
    });
  }
  
  /**
   * Send a message to a queue
   * 
   * @param {string} queue - Queue name
   * @param {Object} message - Message to send
   * @param {Object} [options={}] - Send options
   * @returns {Promise<boolean>} A promise that resolves to true if successful
   */
  async sendToQueue(queue, message, options = {}) {
    const channel = await this.getChannel();
    
    // Create a buffer from the message
    const buffer = Buffer.from(JSON.stringify(message));
    
    // Get correlation ID from context or generate a new one
    const correlationId = global.requestContext?.correlationId || options.correlationId || uuidv4();
    
    return channel.sendToQueue(queue, buffer, {
      persistent: true,
      ...options,
      headers: {
        'x-correlation-id': correlationId,
        ...options.headers
      }
    });
  }
  
  /**
   * Consume messages from a queue
   * 
   * @param {string} queue - Queue name
   * @param {Function} callback - Callback function
   * @param {Object} [options={}] - Consume options
   * @returns {Promise<Object>} A promise that resolves to the consumer
   */
  async consume(queue, callback, options = {}) {
    const channel = await this.getChannel();
    
    // Store consumer details for reconnection
    const consumerDetails = {
      queue,
      callback,
      options
    };
    
    const consumer = await channel.consume(queue, (msg) => {
      if (!msg) return;
      
      try {
        // Parse message content
        const content = JSON.parse(msg.content.toString());
        
        // Get correlation ID from message headers
        const correlationId = msg.properties.headers?.['x-correlation-id'] || uuidv4();
        
        // Create a context with the correlation ID
        const context = { correlationId };
        
        // Execute callback with context
        Promise.resolve().then(() => {
          global.requestContext = context;
          return callback(content, msg, context);
        })
        .then(() => {
          channel.ack(msg);
        })
        .catch((err) => {
          console.error(`Error processing message: ${err.message}`);
          
          // Reject the message and requeue if specified
          const requeue = options.requeue !== false;
          channel.nack(msg, false, requeue);
        });
      } catch (error) {
        console.error(`Error parsing message: ${error.message}`);
        channel.nack(msg, false, false);
      }
    }, options);
    
    // Store consumer tag for reconnection
    consumerDetails.consumerTag = consumer.consumerTag;
    this.consumers.set(consumer.consumerTag, consumerDetails);
    
    return consumer;
  }
  
  /**
   * Reconnect consumers after connection is reestablished
   * 
   * @returns {Promise<void>} A promise that resolves when consumers are reconnected
   */
  async reconnectConsumers() {
    if (this.consumers.size === 0) return;
    
    console.log(`Reconnecting ${this.consumers.size} consumers`);
    
    for (const [consumerTag, details] of this.consumers.entries()) {
      try {
        const { queue, callback, options } = details;
        
        // Remove old consumer
        this.consumers.delete(consumerTag);
        
        // Create new consumer
        await this.consume(queue, callback, options);
        
        console.log(`Reconnected consumer for queue ${queue}`);
      } catch (error) {
        console.error(`Failed to reconnect consumer: ${error.message}`);
      }
    }
  }
  
  /**
   * Create a dead letter queue
   * 
   * @param {string} queue - Original queue name
   * @param {Object} [options={}] - Queue options
   * @returns {Promise<Object>} A promise that resolves to the dead letter queue
   */
  async createDeadLetterQueue(queue, options = {}) {
    const deadLetterQueue = `${queue}.dead-letter`;
    const deadLetterExchange = `${queue}.dead-letter-exchange`;
    
    const channel = await this.getChannel();
    
    // Create dead letter exchange
    await channel.assertExchange(deadLetterExchange, 'direct', {
      durable: true
    });
    
    // Create dead letter queue
    await channel.assertQueue(deadLetterQueue, {
      durable: true,
      ...options
    });
    
    // Bind dead letter queue to exchange
    await channel.bindQueue(deadLetterQueue, deadLetterExchange, deadLetterQueue);
    
    // Create original queue with dead letter configuration
    await channel.assertQueue(queue, {
      durable: true,
      ...options,
      arguments: {
        'x-dead-letter-exchange': deadLetterExchange,
        'x-dead-letter-routing-key': deadLetterQueue,
        ...options.arguments
      }
    });
    
    return {
      queue,
      deadLetterQueue,
      deadLetterExchange
    };
  }
  
  /**
   * Close the connection
   * 
   * @returns {Promise<void>} A promise that resolves when connection is closed
   */
  async close() {
    if (this.channel) {
      await this.channel.close();
      this.channel = null;
      this.channelPromise = null;
    }
    
    if (this.connection) {
      await this.connection.close();
      this.connection = null;
      this.connectionPromise = null;
    }
    
    this.consumers.clear();
  }
}

// Export a singleton instance
module.exports = new MessageBroker();