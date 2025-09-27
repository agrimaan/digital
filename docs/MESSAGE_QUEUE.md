# Message Queue Implementation for Agrimaan Platform

This document describes the message queue implementation for the Agrimaan microservices platform, which enables asynchronous communication between services.

## Overview

The message queue implementation uses RabbitMQ as the message broker and provides several patterns for asynchronous communication:

1. **Event-Driven Architecture**: Services publish events that other services can subscribe to
2. **Task Queues**: Services can offload time-consuming operations to worker processes
3. **Dead Letter Queues**: Handles messages that couldn't be processed successfully
4. **Message Validation**: Ensures messages conform to their expected structure

## Components

### 1. Message Broker

The core message broker client that handles connection management, channel creation, and provides methods for publishing and consuming messages.

- **Location**: `microservices/shared/messaging/message-broker.js`
- **Features**:
  - Automatic reconnection
  - Connection and channel pooling
  - Message acknowledgment
  - Consumer management
  - Content serialization/deserialization
  - Correlation ID propagation

### 2. Event Publisher

Provides functionality for publishing events to the message broker.

- **Location**: `microservices/shared/messaging/event-publisher.js`
- **Features**:
  - Event validation against schemas
  - Automatic exchange creation
  - Correlation ID propagation
  - Transaction support for publishing multiple events

### 3. Event Subscriber

Provides functionality for subscribing to events from the message broker.

- **Location**: `microservices/shared/messaging/event-subscriber.js`
- **Features**:
  - Automatic exchange and queue creation
  - Queue binding with routing keys
  - Event handler registration
  - Multiple subscription support

### 4. Task Queue

Provides functionality for handling background tasks using a message queue.

- **Location**: `microservices/shared/messaging/task-queue.js`
- **Features**:
  - Task prioritization
  - Delayed task execution
  - Task handler registration
  - Correlation ID propagation

### 5. Dead Letter Queue

Provides functionality for handling messages that couldn't be processed.

- **Location**: `microservices/shared/messaging/dead-letter-queue.js`
- **Features**:
  - Dead letter exchange and queue setup
  - Queue configuration with dead letter routing
  - Failed message processing
  - Message retry with count tracking

### 6. Event Validator

Provides functionality for validating event data against schemas.

- **Location**: `microservices/shared/messaging/event-validator.js`
- **Features**:
  - Schema-based validation
  - Required field checking
  - Type validation
  - Custom schema registration

## Implementation Details

### RabbitMQ Configuration

The RabbitMQ configuration includes:

1. **Exchanges**:
   - `agrimaan.events`: Topic exchange for event-driven communication
   - `agrimaan.dlx`: Dead letter exchange for handling failed messages

2. **Queues**:
   - `agrimaan.tasks`: Queue for background tasks
   - `agrimaan.dlq`: Dead letter queue for failed messages
   - Service-specific event queues: `<service-name>.<event-type>`

3. **Bindings**:
   - Event queues are bound to the `agrimaan.events` exchange with routing keys
   - The dead letter queue is bound to the `agrimaan.dlx` exchange with a wildcard routing key

### Event-Driven Communication

The event-driven communication flow works as follows:

1. **Event Publishing**:
   - A service creates an event object with event type, data, and metadata
   - The event is validated against its schema
   - The event is published to the `agrimaan.events` exchange with a routing key
   - The routing key is derived from the event type (e.g., `user.created` → `user-created`)

2. **Event Subscription**:
   - A service creates a queue for each event type it's interested in
   - The queue is bound to the `agrimaan.events` exchange with the appropriate routing key
   - The service registers a handler function for each event type
   - When an event is received, the handler function is called with the event data

3. **Event Processing**:
   - The handler function processes the event data
   - If processing succeeds, the message is acknowledged
   - If processing fails, the message is rejected and sent to the dead letter queue

### Task Queue Processing

The task queue processing flow works as follows:

1. **Task Enqueuing**:
   - A service creates a task object with task type, data, and metadata
   - The task is enqueued in the `agrimaan.tasks` queue with a priority
   - If a delay is specified, the task is scheduled for later execution

2. **Task Processing**:
   - A worker service registers task handlers for different task types
   - The worker consumes tasks from the `agrimaan.tasks` queue
   - When a task is received, the appropriate handler is called with the task data
   - If processing succeeds, the task is acknowledged
   - If processing fails, the task is rejected and sent to the dead letter queue

### Dead Letter Queue Handling

The dead letter queue handling flow works as follows:

1. **Message Rejection**:
   - When a message cannot be processed, it is rejected with `requeue: false`
   - The message is routed to the dead letter exchange with its original routing key
   - The dead letter exchange routes the message to the dead letter queue

2. **Dead Letter Processing**:
   - A service consumes messages from the dead letter queue
   - For each message, it extracts the original routing information and failure reason
   - Based on the failure reason and retry count, it decides whether to retry the message
   - If retried, the message is republished to its original exchange or queue
   - If not retried, the message is logged and potentially stored for later analysis

### Correlation ID Propagation

To enable request tracing across services, correlation IDs are propagated as follows:

1. **Correlation ID Creation**:
   - When a request enters the system, a correlation ID is generated
   - The correlation ID is stored in the request context

2. **Correlation ID Propagation**:
   - When publishing a message, the correlation ID is included in the message headers
   - When consuming a message, the correlation ID is extracted and stored in the request context
   - When making HTTP requests, the correlation ID is included in the request headers

3. **Correlation ID Usage**:
   - The correlation ID is included in all logs
   - The correlation ID can be used to trace a request across services
   - The correlation ID can be used to correlate events and tasks with the original request

## Usage Examples

### Event-Driven Communication

```javascript
// Publishing an event
const { eventPublisher } = require('../shared/messaging');

// When a user is created
app.post('/api/users', async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    
    // Publish event
    await eventPublisher.publishEvent('user.created', {
      userId: user._id,
      email: user.email,
      role: user.role,
      name: user.name
    });
    
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Subscribing to an event
const { eventSubscriber } = require('../shared/messaging');

// In notification service
async function setupEventSubscriptions() {
  // Subscribe to user created event
  await eventSubscriber.subscribe('user.created', async (data) => {
    await notificationService.sendWelcomeEmail({
      userId: data.userId,
      email: data.email,
      name: data.name
    });
  });
  
  // Subscribe to field created event
  await eventSubscriber.subscribe('field.created', async (data) => {
    await notificationService.notifyAgronomists({
      fieldId: data.fieldId,
      userId: data.userId,
      name: data.name
    });
  });
}
```

### Task Queue Processing

```javascript
// Enqueuing a task
const { taskQueue } = require('../shared/messaging');

// When an image is uploaded
app.post('/api/images', async (req, res) => {
  try {
    const image = await imageService.saveImage(req.file);
    
    // Enqueue image processing task
    await taskQueue.enqueue('process-image', {
      imageId: image._id,
      userId: req.user.id,
      path: image.path
    });
    
    res.status(201).json(image);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Processing tasks
const { taskQueue } = require('../shared/messaging');

// In worker service
async function setupTaskHandlers() {
  // Register image processing task handler
  await taskQueue.registerTaskHandler('process-image', async (data) => {
    await imageService.processImage(data.imageId, data.path);
  });
  
  // Register report generation task handler
  await taskQueue.registerTaskHandler('generate-report', async (data) => {
    await reportService.generateReport(data.reportId, data.parameters);
  });
  
  // Start processing tasks
  await taskQueue.startProcessing();
}
```

### Dead Letter Queue Handling

```javascript
// Setting up dead letter queue
const { deadLetterQueue } = require('../shared/messaging');

// In error handling service
async function setupDeadLetterHandling() {
  // Setup queues with dead letter exchange
  await deadLetterQueue.setupQueue('agrimaan.tasks');
  await deadLetterQueue.setupQueue('user-service.user-created');
  
  // Process dead letter queue
  await deadLetterQueue.processDLQ(async (message, context) => {
    console.log(`Processing dead letter message from ${context.originalQueue}`);
    console.log(`Reason: ${context.reason}, Count: ${context.count}`);
    
    // Log to monitoring system
    await monitoringService.logDeadLetter({
      queue: context.originalQueue,
      reason: context.reason,
      count: context.count,
      message
    });
    
    // Retry if count is less than 3
    if (context.count < 3) {
      await context.retry();
    } else {
      // Store for manual processing
      await deadLetterService.storeForManualProcessing({
        queue: context.originalQueue,
        message
      });
    }
  });
}
```

## Integration with Service Discovery

The message queue implementation is integrated with the service discovery mechanism to dynamically discover the RabbitMQ server:

```javascript
const { ServiceDiscovery } = require('../shared/service-discovery');
const { messageBroker } = require('../shared/messaging');

// Get RabbitMQ URL from service discovery
async function setupMessaging() {
  const discovery = new ServiceDiscovery();
  const rabbitmqUrl = await discovery.getServiceUrl('rabbitmq');
  
  // Connect to RabbitMQ
  await messageBroker.connect(rabbitmqUrl);
  console.log('Connected to RabbitMQ at', rabbitmqUrl);
}
```

## Integration with Resilience Patterns

The message queue implementation is integrated with resilience patterns for robust communication:

```javascript
const { retry } = require('../shared/resilience');
const { eventPublisher } = require('../shared/messaging');

// Publish event with retry
async function publishEventWithRetry(eventType, data) {
  return retry(
    async () => {
      return eventPublisher.publishEvent(eventType, data);
    },
    {
      retries: 3,
      delay: 1000,
      backoffFactor: 2
    }
  );
}
```

## Benefits

The message queue implementation provides several benefits:

1. **Decoupling**: Services are decoupled and can evolve independently
2. **Scalability**: Services can scale independently based on their workload
3. **Resilience**: Services can continue to function even if other services are down
4. **Asynchronous Processing**: Time-consuming operations can be offloaded to worker processes
5. **Load Leveling**: Spikes in workload can be absorbed by the message queue
6. **Reliability**: Messages are persisted and can be processed even if services restart
7. **Observability**: Message flows can be monitored and traced across services

## Best Practices

1. **Event Design**: Design events as facts that have happened, not commands
2. **Event Schemas**: Define clear schemas for all events
3. **Idempotent Handlers**: Make event handlers idempotent to handle duplicate events
4. **Correlation IDs**: Use correlation IDs to trace requests across services
5. **Dead Letter Queues**: Always configure queues with dead letter exchanges
6. **Monitoring**: Monitor queue depths and processing rates
7. **Graceful Shutdown**: Properly close connections when shutting down services
8. **Error Handling**: Implement proper error handling in consumers
9. **Testing**: Test event producers and consumers thoroughly
10. **Documentation**: Document all events and their schemas

## Future Enhancements

1. **Event Versioning**: Add support for event versioning and schema evolution
2. **Event Sourcing**: Implement event sourcing for critical business processes
3. **Message Scheduling**: Add support for scheduled messages and recurring tasks
4. **Message Routing**: Implement more sophisticated message routing strategies
5. **Message Filtering**: Add support for message filtering based on content
6. **Message Transformation**: Implement message transformation pipelines
7. **Message Replay**: Add support for replaying messages from a specific point in time
8. **Message Monitoring**: Implement comprehensive message monitoring and alerting
9. **Message Archiving**: Add support for archiving messages for compliance and auditing
10. **Message Encryption**: Implement message encryption for sensitive data