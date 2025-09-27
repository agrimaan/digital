# Messaging for Agrimaan Platform

This directory contains the messaging implementation for the Agrimaan platform. It provides components for asynchronous communication between services using RabbitMQ.

## Components

### 1. Message Broker

The `message-broker.js` module provides a client for RabbitMQ. It handles connection management, reconnection, and provides methods for publishing and consuming messages.

```javascript
const messageBroker = require('./message-broker');

// Connect to RabbitMQ
await messageBroker.connect();

// Create a queue
await messageBroker.createQueue('my-queue', { durable: true });

// Create an exchange
await messageBroker.createExchange('my-exchange', 'topic', { durable: true });

// Bind a queue to an exchange
await messageBroker.bindQueue('my-queue', 'my-exchange', 'routing.key');

// Send a message to a queue
await messageBroker.sendToQueue('my-queue', { message: 'Hello, World!' });

// Publish a message to an exchange
await messageBroker.publish('my-exchange', 'routing.key', { message: 'Hello, World!' });

// Consume messages from a queue
await messageBroker.consume('my-queue', (message) => {
  console.log('Received message:', message);
});
```

### 2. Event Publisher

The `event-publisher.js` module provides functionality for publishing events to RabbitMQ. It handles event validation, correlation ID propagation, and publishing to exchanges.

```javascript
const EventPublisher = require('./event-publisher');

// Create an event publisher
const publisher = new EventPublisher({
  exchange: 'events'
});

// Register a schema for event validation
publisher.registerSchema('user.created', (data) => {
  if (!data.userId) return 'userId is required';
  if (!data.email) return 'email is required';
  return true;
});

// Publish an event
await publisher.publish('user.created', {
  userId: '123',
  email: 'user@example.com',
  name: 'John Doe'
});
```

### 3. Event Subscriber

The `event-subscriber.js` module provides functionality for subscribing to events from RabbitMQ. It handles event validation, correlation ID propagation, and consuming from queues.

```javascript
const EventSubscriber = require('./event-subscriber');

// Create an event subscriber
const subscriber = new EventSubscriber({
  exchange: 'events',
  queuePrefix: 'user-service.'
});

// Register a schema for event validation
subscriber.registerSchema('user.created', (data) => {
  if (!data.userId) return 'userId is required';
  if (!data.email) return 'email is required';
  return true;
});

// Subscribe to an event
await subscriber.subscribe('user.created', (data, context) => {
  console.log('User created:', data);
  console.log('Event context:', context);
});
```

### 4. Task Queue

The `task-queue.js` module provides functionality for publishing and processing tasks using RabbitMQ. It handles task validation, correlation ID propagation, and task processing.

```javascript
const TaskQueue = require('./task-queue');

// Create a task queue
const taskQueue = new TaskQueue({
  queueName: 'email-tasks'
});

// Register a schema for task validation
taskQueue.registerSchema('send-email', (data) => {
  if (!data.to) return 'to is required';
  if (!data.subject) return 'subject is required';
  return true;
});

// Register a task processor
taskQueue.registerProcessor('send-email', async (data, context) => {
  console.log('Sending email:', data);
  console.log('Task context:', context);
  
  // Send email logic here
  await sendEmail(data.to, data.subject, data.body);
});

// Start processing tasks
await taskQueue.startProcessing();

// Publish a task
const taskId = await taskQueue.publish('send-email', {
  to: 'user@example.com',
  subject: 'Welcome to Agrimaan',
  body: 'Thank you for joining Agrimaan!'
}, {
  priority: 1
});
```

## Event-Driven Architecture

The messaging components enable an event-driven architecture for the Agrimaan platform. Services can publish events when something happens, and other services can subscribe to those events to react accordingly.

### Event Types

Events should follow a naming convention of `resource.action`, for example:

- `user.created`: A new user has been created
- `user.updated`: A user has been updated
- `field.created`: A new field has been created
- `crop.planted`: A crop has been planted
- `order.placed`: A new order has been placed
- `payment.received`: A payment has been received

### Event Format

Events should follow a standard format:

```javascript
{
  id: 'unique-event-id',
  type: 'resource.action',
  timestamp: '2023-09-25T12:34:56.789Z',
  data: {
    // Event-specific data
  },
  metadata: {
    correlationId: 'correlation-id',
    // Additional metadata
  }
}
```

### Task Types

Tasks should be named according to their purpose, for example:

- `send-email`: Send an email
- `generate-report`: Generate a report
- `process-payment`: Process a payment
- `update-inventory`: Update inventory

### Task Format

Tasks should follow a standard format:

```javascript
{
  id: 'unique-task-id',
  type: 'task-type',
  timestamp: '2023-09-25T12:34:56.789Z',
  data: {
    // Task-specific data
  },
  metadata: {
    correlationId: 'correlation-id',
    priority: 1,
    // Additional metadata
  }
}
```

## Configuration

The messaging components can be configured using environment variables:

- `RABBITMQ_URL`: RabbitMQ connection URL (default: `amqp://guest:guest@rabbitmq:5672`)
- `SERVICE_NAME`: Name of the service (used for queue naming)

## Usage

### 1. Publishing Events

```javascript
const { EventPublisher } = require('../../shared/messaging');

// Create an event publisher
const publisher = new EventPublisher({
  exchange: 'events'
});

// Publish an event
await publisher.publish('user.created', {
  userId: '123',
  email: 'user@example.com',
  name: 'John Doe'
});
```

### 2. Subscribing to Events

```javascript
const { EventSubscriber } = require('../../shared/messaging');

// Create an event subscriber
const subscriber = new EventSubscriber({
  exchange: 'events',
  queuePrefix: 'user-service.'
});

// Subscribe to an event
await subscriber.subscribe('user.created', async (data, context) => {
  console.log('User created:', data);
  
  // Process the event
  await processNewUser(data);
});
```

### 3. Publishing Tasks

```javascript
const { TaskQueue } = require('../../shared/messaging');

// Create a task queue
const taskQueue = new TaskQueue({
  queueName: 'email-tasks'
});

// Publish a task
const taskId = await taskQueue.publish('send-email', {
  to: 'user@example.com',
  subject: 'Welcome to Agrimaan',
  body: 'Thank you for joining Agrimaan!'
});
```

### 4. Processing Tasks

```javascript
const { TaskQueue } = require('../../shared/messaging');

// Create a task queue
const taskQueue = new TaskQueue({
  queueName: 'email-tasks'
});

// Register a task processor
taskQueue.registerProcessor('send-email', async (data, context) => {
  console.log('Sending email:', data);
  
  // Send email logic here
  await sendEmail(data.to, data.subject, data.body);
});

// Start processing tasks
await taskQueue.startProcessing();
```

## Testing

You can test the messaging components using the provided test script:

```bash
node test-messaging.js
```

## Troubleshooting

### Connection Issues

- Check that RabbitMQ is running
- Verify the RabbitMQ connection URL
- Check network connectivity between services and RabbitMQ

### Message Publishing Issues

- Check that the exchange exists
- Verify that the routing key is correct
- Check that the message format is valid

### Message Consumption Issues

- Check that the queue exists
- Verify that the queue is bound to the exchange with the correct routing key
- Check that the consumer is running