/**
 * Test script for messaging components
 * 
 * This script tests the messaging functionality.
 */

const messageBroker = require('./message-broker');
const EventPublisher = require('./event-publisher');
const EventSubscriber = require('./event-subscriber');
const TaskQueue = require('./task-queue');

// Test message broker
async function testMessageBroker() {
  console.log('Testing Message Broker...');
  
  try {
    // Connect to RabbitMQ
    await messageBroker.connect();
    console.log('✅ Connected to RabbitMQ');
    
    // Create a test queue
    const queueName = 'test-queue';
    await messageBroker.createQueue(queueName);
    console.log(`✅ Created queue: ${queueName}`);
    
    // Create a test exchange
    const exchangeName = 'test-exchange';
    await messageBroker.createExchange(exchangeName, 'direct');
    console.log(`✅ Created exchange: ${exchangeName}`);
    
    // Bind queue to exchange
    await messageBroker.bindQueue(queueName, exchangeName, 'test-routing-key');
    console.log(`✅ Bound queue ${queueName} to exchange ${exchangeName}`);
    
    // Send a message to the queue
    const message = { text: 'Hello, RabbitMQ!', timestamp: new Date().toISOString() };
    await messageBroker.sendToQueue(queueName, message);
    console.log(`✅ Sent message to queue: ${queueName}`);
    
    // Consume message from the queue
    const messagePromise = new Promise((resolve) => {
      messageBroker.consume(queueName, (msg) => {
        console.log(`✅ Received message from queue: ${queueName}`);
        console.log('Message:', msg);
        resolve(msg);
      }, { noAck: true });
    });
    
    const receivedMessage = await messagePromise;
    console.log('Message broker test completed successfully');
    
    return receivedMessage;
  } catch (error) {
    console.error('❌ Message broker test failed:', error);
    throw error;
  }
}

// Test event publisher and subscriber
async function testEventSystem() {
  console.log('\nTesting Event System...');
  
  try {
    // Create event publisher
    const publisher = new EventPublisher({
      exchange: 'test-events'
    });
    
    // Create event subscriber
    const subscriber = new EventSubscriber({
      exchange: 'test-events',
      queuePrefix: 'test-service.'
    });
    
    // Register a simple schema
    const userCreatedSchema = (data) => {
      if (!data.userId) return 'userId is required';
      if (!data.email) return 'email is required';
      return true;
    };
    
    publisher.registerSchema('user.created', userCreatedSchema);
    subscriber.registerSchema('user.created', userCreatedSchema);
    
    // Subscribe to event
    const eventPromise = new Promise((resolve) => {
      subscriber.subscribe('user.created', (data, context) => {
        console.log(`✅ Received event: user.created`);
        console.log('Event data:', data);
        console.log('Event context:', context);
        resolve({ data, context });
      });
    });
    
    // Wait for subscriber to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Publish event
    const eventData = {
      userId: '123',
      email: 'test@example.com',
      name: 'Test User'
    };
    
    await publisher.publish('user.created', eventData, {
      correlationId: 'test-correlation-id'
    });
    
    console.log(`✅ Published event: user.created`);
    
    // Wait for event to be processed
    const receivedEvent = await eventPromise;
    console.log('Event system test completed successfully');
    
    return receivedEvent;
  } catch (error) {
    console.error('❌ Event system test failed:', error);
    throw error;
  }
}

// Test task queue
async function testTaskQueue() {
  console.log('\nTesting Task Queue...');
  
  try {
    // Create task queue
    const taskQueue = new TaskQueue({
      queueName: 'test-tasks'
    });
    
    // Register a simple schema
    const sendEmailSchema = (data) => {
      if (!data.to) return 'to is required';
      if (!data.subject) return 'subject is required';
      return true;
    };
    
    taskQueue.registerSchema('send-email', sendEmailSchema);
    
    // Register task processor
    const taskPromise = new Promise((resolve) => {
      taskQueue.registerProcessor('send-email', (data, context) => {
        console.log(`✅ Processing task: send-email`);
        console.log('Task data:', data);
        console.log('Task context:', context);
        resolve({ data, context });
      });
    });
    
    // Start processing tasks
    await taskQueue.startProcessing();
    console.log('✅ Started task processing');
    
    // Publish task
    const taskData = {
      to: 'test@example.com',
      subject: 'Test Email',
      body: 'This is a test email'
    };
    
    const taskId = await taskQueue.publish('send-email', taskData, {
      priority: 1,
      correlationId: 'test-correlation-id'
    });
    
    console.log(`✅ Published task: send-email (ID: ${taskId})`);
    
    // Wait for task to be processed
    const processedTask = await taskPromise;
    console.log('Task queue test completed successfully');
    
    return processedTask;
  } catch (error) {
    console.error('❌ Task queue test failed:', error);
    throw error;
  }
}

// Run all tests
async function runTests() {
  try {
    await testMessageBroker();
    await testEventSystem();
    await testTaskQueue();
    
    console.log('\nAll tests completed successfully');
    
    // Close connection
    await messageBroker.close();
  } catch (error) {
    console.error('\nTest suite failed:', error);
    
    // Close connection
    await messageBroker.close();
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  testMessageBroker,
  testEventSystem,
  testTaskQueue,
  runTests
};