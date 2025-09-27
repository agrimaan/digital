#!/bin/bash

# Script to integrate message queue with all backend microservices
# This script creates event publishers and subscribers for each service

# Define the backend services directory
BACKEND_DIR="./backend"

# Create a directory for events in each service
for SERVICE_DIR in $BACKEND_DIR/*-service; do
  SERVICE_NAME=$(basename $SERVICE_DIR)
  echo "Integrating message queue with $SERVICE_NAME..."
  
  # Create events directory if it doesn't exist
  EVENTS_DIR="$SERVICE_DIR/events"
  if [ ! -d "$EVENTS_DIR" ]; then
    mkdir -p "$EVENTS_DIR"
    mkdir -p "$EVENTS_DIR/publishers"
    mkdir -p "$EVENTS_DIR/subscribers"
    echo "Created events directory structure in $SERVICE_NAME"
  fi
  
  # Update package.json to include required dependencies
  echo "Updating package.json..."
  # Check if @agrimaan/shared is already in dependencies
  if ! grep -q "@agrimaan/shared" $SERVICE_DIR/package.json; then
    # Use sed to add the dependency before the first dependency
    sed -i '/"dependencies": {/a \    "@agrimaan/shared": "^1.0.0",' $SERVICE_DIR/package.json
  fi
  
  # Check if amqplib is already in dependencies
  if ! grep -q "amqplib" $SERVICE_DIR/package.json; then
    # Use sed to add the dependency before the first dependency
    sed -i '/"dependencies": {/a \    "amqplib": "^0.10.3",' $SERVICE_DIR/package.json
  fi
  
  # Update .env file to include RabbitMQ configuration
  if ! grep -q "RABBITMQ_URL" $SERVICE_DIR/.env; then
    echo "Updating .env file with RabbitMQ configuration..."
    echo "RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672" >> $SERVICE_DIR/.env
  fi
  
  # Create service-specific event publishers and subscribers based on service type
  case $SERVICE_NAME in
    "user-service")
      # Create user event publisher
      echo "Creating user event publishers..."
      cat > "$EVENTS_DIR/publishers/user-events.js" << 'EOL'
/**
 * User Events Publisher
 * 
 * This module publishes user-related events to the message queue.
 */

const { EventPublisher } = require('@agrimaan/shared/messaging');

class UserEventsPublisher {
  constructor() {
    this.publisher = new EventPublisher('user-events');
  }

  /**
   * Publish user created event
   * 
   * @param {Object} userData - User data
   * @returns {Promise<void>}
   */
  async publishUserCreated(userData) {
    await this.publisher.publish('user.created', {
      id: userData._id,
      email: userData.email,
      role: userData.role,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Publish user updated event
   * 
   * @param {Object} userData - User data
   * @returns {Promise<void>}
   */
  async publishUserUpdated(userData) {
    await this.publisher.publish('user.updated', {
      id: userData._id,
      email: userData.email,
      role: userData.role,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Publish user deleted event
   * 
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async publishUserDeleted(userId) {
    await this.publisher.publish('user.deleted', {
      id: userId,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = new UserEventsPublisher();
EOL
      ;;
      
    "field-service")
      # Create field event publisher
      echo "Creating field event publishers..."
      cat > "$EVENTS_DIR/publishers/field-events.js" << 'EOL'
/**
 * Field Events Publisher
 * 
 * This module publishes field-related events to the message queue.
 */

const { EventPublisher } = require('@agrimaan/shared/messaging');

class FieldEventsPublisher {
  constructor() {
    this.publisher = new EventPublisher('field-events');
  }

  /**
   * Publish field created event
   * 
   * @param {Object} fieldData - Field data
   * @returns {Promise<void>}
   */
  async publishFieldCreated(fieldData) {
    await this.publisher.publish('field.created', {
      id: fieldData._id,
      ownerId: fieldData.ownerId,
      location: fieldData.location,
      size: fieldData.size,
      cropType: fieldData.cropType,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Publish field updated event
   * 
   * @param {Object} fieldData - Field data
   * @returns {Promise<void>}
   */
  async publishFieldUpdated(fieldData) {
    await this.publisher.publish('field.updated', {
      id: fieldData._id,
      ownerId: fieldData.ownerId,
      location: fieldData.location,
      size: fieldData.size,
      cropType: fieldData.cropType,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Publish field deleted event
   * 
   * @param {string} fieldId - Field ID
   * @returns {Promise<void>}
   */
  async publishFieldDeleted(fieldId) {
    await this.publisher.publish('field.deleted', {
      id: fieldId,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = new FieldEventsPublisher();
EOL
      
      # Create user events subscriber
      echo "Creating user events subscriber..."
      cat > "$EVENTS_DIR/subscribers/user-events-subscriber.js" << 'EOL'
/**
 * User Events Subscriber
 * 
 * This module subscribes to user-related events from the message queue.
 */

const { EventSubscriber } = require('@agrimaan/shared/messaging');

class UserEventsSubscriber {
  constructor() {
    this.subscriber = new EventSubscriber('user-events', 'field-service');
    
    // Register event handlers
    this.subscriber.on('user.deleted', this.handleUserDeleted.bind(this));
  }

  /**
   * Start listening for events
   * 
   * @returns {Promise<void>}
   */
  async start() {
    await this.subscriber.subscribe(['user.deleted']);
    console.log('User events subscriber started');
  }

  /**
   * Handle user deleted event
   * 
   * @param {Object} data - Event data
   * @param {Object} message - Original message
   */
  async handleUserDeleted(data, message) {
    try {
      console.log(`User deleted event received: ${data.id}`);
      
      // TODO: Implement logic to handle user deletion
      // For example, update or remove fields associated with the deleted user
      
      // Acknowledge the message
      message.ack();
    } catch (error) {
      console.error('Error handling user deleted event:', error);
      // Negative acknowledge to requeue the message
      message.nack();
    }
  }
}

module.exports = new UserEventsSubscriber();
EOL
      ;;
      
    "notification-service")
      # Create notification event subscribers
      echo "Creating notification event subscribers..."
      
      # Create user events subscriber
      cat > "$EVENTS_DIR/subscribers/user-events-subscriber.js" << 'EOL'
/**
 * User Events Subscriber
 * 
 * This module subscribes to user-related events from the message queue.
 */

const { EventSubscriber } = require('@agrimaan/shared/messaging');

class UserEventsSubscriber {
  constructor() {
    this.subscriber = new EventSubscriber('user-events', 'notification-service');
    
    // Register event handlers
    this.subscriber.on('user.created', this.handleUserCreated.bind(this));
    this.subscriber.on('user.updated', this.handleUserUpdated.bind(this));
  }

  /**
   * Start listening for events
   * 
   * @returns {Promise<void>}
   */
  async start() {
    await this.subscriber.subscribe(['user.created', 'user.updated']);
    console.log('User events subscriber started');
  }

  /**
   * Handle user created event
   * 
   * @param {Object} data - Event data
   * @param {Object} message - Original message
   */
  async handleUserCreated(data, message) {
    try {
      console.log(`User created event received: ${data.id}`);
      
      // TODO: Send welcome notification to the new user
      
      // Acknowledge the message
      message.ack();
    } catch (error) {
      console.error('Error handling user created event:', error);
      // Negative acknowledge to requeue the message
      message.nack();
    }
  }

  /**
   * Handle user updated event
   * 
   * @param {Object} data - Event data
   * @param {Object} message - Original message
   */
  async handleUserUpdated(data, message) {
    try {
      console.log(`User updated event received: ${data.id}`);
      
      // TODO: Send profile update notification if necessary
      
      // Acknowledge the message
      message.ack();
    } catch (error) {
      console.error('Error handling user updated event:', error);
      // Negative acknowledge to requeue the message
      message.nack();
    }
  }
}

module.exports = new UserEventsSubscriber();
EOL

      # Create field events subscriber
      cat > "$EVENTS_DIR/subscribers/field-events-subscriber.js" << 'EOL'
/**
 * Field Events Subscriber
 * 
 * This module subscribes to field-related events from the message queue.
 */

const { EventSubscriber } = require('@agrimaan/shared/messaging');

class FieldEventsSubscriber {
  constructor() {
    this.subscriber = new EventSubscriber('field-events', 'notification-service');
    
    // Register event handlers
    this.subscriber.on('field.created', this.handleFieldCreated.bind(this));
    this.subscriber.on('field.updated', this.handleFieldUpdated.bind(this));
  }

  /**
   * Start listening for events
   * 
   * @returns {Promise<void>}
   */
  async start() {
    await this.subscriber.subscribe(['field.created', 'field.updated']);
    console.log('Field events subscriber started');
  }

  /**
   * Handle field created event
   * 
   * @param {Object} data - Event data
   * @param {Object} message - Original message
   */
  async handleFieldCreated(data, message) {
    try {
      console.log(`Field created event received: ${data.id}`);
      
      // TODO: Send notification to field owner
      
      // Acknowledge the message
      message.ack();
    } catch (error) {
      console.error('Error handling field created event:', error);
      // Negative acknowledge to requeue the message
      message.nack();
    }
  }

  /**
   * Handle field updated event
   * 
   * @param {Object} data - Event data
   * @param {Object} message - Original message
   */
  async handleFieldUpdated(data, message) {
    try {
      console.log(`Field updated event received: ${data.id}`);
      
      // TODO: Send field update notification if necessary
      
      // Acknowledge the message
      message.ack();
    } catch (error) {
      console.error('Error handling field updated event:', error);
      // Negative acknowledge to requeue the message
      message.nack();
    }
  }
}

module.exports = new FieldEventsSubscriber();
EOL

      # Create notification event publisher
      cat > "$EVENTS_DIR/publishers/notification-events.js" << 'EOL'
/**
 * Notification Events Publisher
 * 
 * This module publishes notification-related events to the message queue.
 */

const { EventPublisher } = require('@agrimaan/shared/messaging');

class NotificationEventsPublisher {
  constructor() {
    this.publisher = new EventPublisher('notification-events');
  }

  /**
   * Publish notification sent event
   * 
   * @param {Object} notificationData - Notification data
   * @returns {Promise<void>}
   */
  async publishNotificationSent(notificationData) {
    await this.publisher.publish('notification.sent', {
      id: notificationData._id,
      userId: notificationData.userId,
      type: notificationData.type,
      message: notificationData.message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Publish notification read event
   * 
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async publishNotificationRead(notificationId, userId) {
    await this.publisher.publish('notification.read', {
      id: notificationId,
      userId: userId,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = new NotificationEventsPublisher();
EOL
      ;;
      
    *)
      # For other services, create generic event subscribers
      echo "Creating generic event subscribers..."
      
      # Create an index.js file in the events directory
      cat > "$EVENTS_DIR/index.js" << 'EOL'
/**
 * Events Module
 * 
 * This module initializes all event subscribers.
 */

// Import subscribers here when created
// const userEventsSubscriber = require('./subscribers/user-events-subscriber');
// const fieldEventsSubscriber = require('./subscribers/field-events-subscriber');

/**
 * Initialize all event subscribers
 * 
 * @returns {Promise<void>}
 */
async function initializeEventSubscribers() {
  try {
    console.log('Initializing event subscribers...');
    
    // Start subscribers here when created
    // await userEventsSubscriber.start();
    // await fieldEventsSubscriber.start();
    
    console.log('All event subscribers initialized');
  } catch (error) {
    console.error('Failed to initialize event subscribers:', error);
  }
}

module.exports = {
  initializeEventSubscribers
};
EOL
      ;;
  esac
  
  # Update server.js to initialize event subscribers
  if [ -d "$EVENTS_DIR/subscribers" ] && [ "$(ls -A $EVENTS_DIR/subscribers)" ]; then
    echo "Updating server.js to initialize event subscribers..."
    
    # Create a backup of the original server.js
    cp $SERVICE_DIR/server.js $SERVICE_DIR/server.js.bak2
    
    # Add event subscribers initialization
    if ! grep -q "initializeEventSubscribers" $SERVICE_DIR/server.js; then
      # Add import for events module
      sed -i '/const express = require/i const { initializeEventSubscribers } = require(\'./events\');' $SERVICE_DIR/server.js
      
      # Find the line with app.listen or server.listen
      LISTEN_LINE=$(grep -n "listen(" $SERVICE_DIR/server.js | cut -d':' -f1)
      
      if [ -n "$LISTEN_LINE" ]; then
        # Add event subscribers initialization after the console.log line
        CONSOLE_LOG_LINE=$((LISTEN_LINE + 1))
        sed -i "${CONSOLE_LOG_LINE}a \\\n  // Initialize event subscribers\n  initializeEventSubscribers()\n    .then(() => console.log('Event subscribers initialized'))\n    .catch(err => console.error('Failed to initialize event subscribers:', err));" $SERVICE_DIR/server.js
      else
        echo "Could not find listen line in server.js for $SERVICE_NAME"
      fi
    fi
  fi
  
  echo "Message queue integration completed for $SERVICE_NAME"
  echo "---------------------------------------------------"
done

echo "Message queue integration completed for all services!"