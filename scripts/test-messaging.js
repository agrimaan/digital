/**
 * Test Messaging
 * 
 * This script tests the messaging capabilities of the Agrimaan platform.
 * It demonstrates event publishing, event subscription, task queuing, and dead letter queue handling.
 */

const {
  messageBroker,
  eventPublisher,
  eventSubscriber,
  taskQueue,
  deadLetterQueue
} = require('../shared/messaging');

// Mock user data for testing
const mockUser = {
  userId: '123456',
  email: 'test@example.com',
  role: 'farmer',
  name: 'Test User'
};

// Mock field data for testing
const mockField = {
  fieldId: '789012',
  userId: '123456',
  name: 'Test Field',
  location: {
    type: 'Point',
    coordinates: [73.123, 19.456]
  },
  area: 5.5,
  soilType: 'Clay'
};

/**
 * Test event publishing and subscription
 */
async function testEventPubSub() {
  console.log('\n=== Testing Event Publishing and Subscription ===');
  
  try {
    // Initialize event publisher and subscriber
    await eventPublisher.init();
    await eventSubscriber.init();
    
    // Subscribe to user.created event
    await eventSubscriber.subscribe('user.created', async (data, event) => {
      console.log('Received user.created event:');
      console.log('- User ID:', data.userId);
      console.log('- Email:', data.email);
      console.log('- Role:', data.role);
      console.log('- Name:', data.name);
      console.log('- Event source:', event.source);
      console.log('- Event timestamp:', event.timestamp);
    });
    
    // Subscribe to field.created event
    await eventSubscriber.subscribe('field.created', async (data, event) => {
      console.log('Received field.created event:');
      console.log('- Field ID:', data.fieldId);
      console.log('- User ID:', data.userId);
      console.log('- Name:', data.name);
      console.log('- Area:', data.area);
      console.log('- Soil Type:', data.soilType);
      console.log('- Event source:', event.source);
      console.log('- Event timestamp:', event.timestamp);
    });
    
    console.log('Subscribed to events. Publishing test events...');
    
    // Publish user.created event
    await eventPublisher.publishEvent('user.created', mockUser, {
      source: 'test-script'
    });
    
    // Wait a bit before publishing next event
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Publish field.created event
    await eventPublisher.publishEvent('field.created', mockField, {
      source: 'test-script'
    });
    
    console.log('Events published successfully.');
    
    // Wait for events to be processed
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Unsubscribe from events
    await eventSubscriber.unsubscribeAll();
    console.log('Unsubscribed from all events.');
  } catch (error) {
    console.error('Error in event pub/sub test:', error.message);
  }
}

/**
 * Test task queue
 */
async function testTaskQueue() {
  console.log('\n=== Testing Task Queue ===');
  
  try {
    // Initialize task queue
    await taskQueue.init();
    
    // Register task handlers
    await taskQueue.registerTaskHandler('process-user', async (data, task) => {
      console.log('Processing user task:');
      console.log('- Task ID:', task.id);
      console.log('- User ID:', data.userId);
      console.log('- Email:', data.email);
      console.log('- Action:', data.action);
      
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('User task processed successfully.');
    });
    
    await taskQueue.registerTaskHandler('process-field', async (data, task) => {
      console.log('Processing field task:');
      console.log('- Task ID:', task.id);
      console.log('- Field ID:', data.fieldId);
      console.log('- User ID:', data.userId);
      console.log('- Action:', data.action);
      
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('Field task processed successfully.');
    });
    
    // Start processing tasks
    const { consumerTag } = await taskQueue.startProcessing();
    console.log('Started processing tasks with consumer tag:', consumerTag);
    
    // Enqueue tasks
    const userTaskId = await taskQueue.enqueue('process-user', {
      userId: mockUser.userId,
      email: mockUser.email,
      action: 'verify'
    }, {
      priority: 5
    });
    
    console.log('Enqueued user task with ID:', userTaskId);
    
    // Enqueue field task with delay
    const fieldTaskId = await taskQueue.enqueue('process-field', {
      fieldId: mockField.fieldId,
      userId: mockField.userId,
      action: 'analyze'
    }, {
      priority: 3,
      delay: 2000 // 2 second delay
    });
    
    console.log('Enqueued field task with ID:', fieldTaskId, '(2 second delay)');
    
    // Wait for tasks to be processed
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Stop processing tasks
    await taskQueue.stopProcessing(consumerTag);
    console.log('Stopped processing tasks.');
  } catch (error) {
    console.error('Error in task queue test:', error.message);
  }
}

/**
 * Test dead letter queue
 */
async function testDeadLetterQueue() {
  console.log('\n=== Testing Dead Letter Queue ===');
  
  try {
    // Initialize dead letter queue
    await deadLetterQueue.init();
    
    // Setup a test queue with dead letter exchange
    const testQueue = 'test-dlq-queue';
    await deadLetterQueue.setupQueue(testQueue, {
      durable: true,
      autoDelete: false
    });
    
    console.log(`Setup test queue ${testQueue} with dead letter exchange.`);
    
    // Process dead letter queue
    const { consumerTag } = await deadLetterQueue.processDLQ(async (message, context) => {
      console.log('Processing dead letter message:');
      console.log('- Original Queue:', context.originalQueue);
      console.log('- Reason:', context.reason);
      console.log('- Count:', context.count);
      console.log('- Message:', message);
      
      // Retry the message if count is less than 2
      if (context.count < 2) {
        console.log('Retrying message...');
        await context.retry();
      } else {
        console.log('Maximum retry count reached, not retrying.');
      }
    });
    
    console.log('Started processing dead letter queue with consumer tag:', consumerTag);
    
    // Publish a message to the test queue that will be rejected
    await messageBroker.createQueue(testQueue);
    
    // Consume from test queue and reject messages to send to DLQ
    await messageBroker.consume(testQueue, async (message) => {
      console.log('Received message in test queue:', message);
      console.log('Rejecting message to send to dead letter queue...');
      
      // Simulate an error
      throw new Error('Simulated error');
    }, {
      noAck: false
    });
    
    // Send a test message
    await messageBroker.sendToQueue(testQueue, {
      test: 'This is a test message that will be rejected',
      timestamp: new Date().toISOString()
    });
    
    console.log('Sent test message to queue:', testQueue);
    
    // Wait for message to be processed and sent to DLQ
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Cancel DLQ consumer
    await messageBroker.cancelConsumer(consumerTag);
    console.log('Stopped processing dead letter queue.');
  } catch (error) {
    console.error('Error in dead letter queue test:', error.message);
  }
}

/**
 * Run all tests
 */
async function runTests() {
  try {
    // Connect to message broker
    await messageBroker.connect();
    console.log('Connected to message broker.');
    
    // Run tests
    await testEventPubSub();
    await testTaskQueue();
    await testDeadLetterQueue();
    
    // Close connections
    await messageBroker.close();
    console.log('\nAll tests completed. Connections closed.');
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Run the tests
runTests();