const mqtt = require('mqtt');
const Device = require('../models/Device');
const telemetryService = require('./telemetryService');
const alertService = require('./alertService');

// MQTT client instance
let client = null;

/**
 * Connect to MQTT broker
 * @returns {Promise<Object>} MQTT client
 */
exports.connect = async () => {
  if (client && client.connected) {
    return client;
  }
  
  return new Promise((resolve, reject) => {
    // Connect to MQTT broker
    client = mqtt.connect(process.env.MQTT_BROKER_URL, {
      clientId: process.env.MQTT_CLIENT_ID || `agrimaan-iot-service-${Math.random().toString(16).substr(2, 8)}`,
      username: process.env.MQTT_USERNAME,
      password: process.env.MQTT_PASSWORD,
      clean: true,
      reconnectPeriod: 5000
    });
    
    // Handle connection events
    client.on('connect', () => {
      console.log('Connected to MQTT broker');
      
      // Subscribe to all device topics
      const topicPrefix = process.env.MQTT_TOPIC_PREFIX || 'agrimaan/iot';
      client.subscribe(`${topicPrefix}/#`, (err) => {
        if (err) {
          console.error('Error subscribing to topics:', err);
          return reject(err);
        }
        
        console.log(`Subscribed to ${topicPrefix}/#`);
        resolve(client);
      });
      
      // Setup message handler
      client.on('message', handleMqttMessage);
    });
    
    client.on('error', (err) => {
      console.error('MQTT client error:', err);
      reject(err);
    });
    
    client.on('close', () => {
      console.log('MQTT connection closed');
    });
    
    client.on('offline', () => {
      console.log('MQTT client offline');
    });
    
    client.on('reconnect', () => {
      console.log('MQTT client reconnecting');
    });
  });
};

/**
 * Disconnect from MQTT broker
 */
exports.disconnect = () => {
  if (client && client.connected) {
    client.end();
    client = null;
    console.log('Disconnected from MQTT broker');
  }
};

/**
 * Publish message to MQTT topic
 * @param {string} topic - MQTT topic
 * @param {Object|string} message - Message to publish
 * @param {Object} options - MQTT publish options
 * @returns {Promise<boolean>} Success status
 */
exports.publish = async (topic, message, options = {}) => {
  if (!client || !client.connected) {
    await this.connect();
  }
  
  return new Promise((resolve, reject) => {
    // Convert object to JSON string if needed
    const payload = typeof message === 'object' ? JSON.stringify(message) : message;
    
    client.publish(topic, payload, options, (err) => {
      if (err) {
        console.error(`Error publishing to ${topic}:`, err);
        return reject(err);
      }
      
      console.log(`Published to ${topic}`);
      resolve(true);
    });
  });
};

/**
 * Handle incoming MQTT messages
 * @param {string} topic - MQTT topic
 * @param {Buffer} message - Message payload
 */
async function handleMqttMessage(topic, message) {
  try {
    console.log(`Received message on ${topic}`);
    
    // Parse topic to extract device information
    const topicParts = topic.split('/');
    const topicPrefix = process.env.MQTT_TOPIC_PREFIX || 'agrimaan/iot';
    
    // Check if topic matches our expected format
    if (topicParts[0] !== topicPrefix.split('/')[0]) {
      return;
    }
    
    // Extract device type and ID from topic
    const deviceType = topicParts[2];
    const deviceId = topicParts[3];
    
    // Find device by MQTT topic
    const device = await Device.findOne({
      mqttTopic: topic
    });
    
    if (!device) {
      console.warn(`Received message for unknown device topic: ${topic}`);
      return;
    }
    
    // Parse message payload
    let payload;
    try {
      payload = JSON.parse(message.toString());
    } catch (err) {
      console.error(`Error parsing message payload for topic ${topic}:`, err);
      return;
    }
    
    // Process telemetry data
    if (payload.type === 'telemetry') {
      await processTelemetryMessage(device, payload);
    } 
    // Process command response
    else if (payload.type === 'command_response') {
      await processCommandResponse(device, payload);
    }
    // Process status update
    else if (payload.type === 'status') {
      await processStatusUpdate(device, payload);
    }
    // Process alert
    else if (payload.type === 'alert') {
      await processAlertMessage(device, payload);
    }
    // Unknown message type
    else {
      console.warn(`Unknown message type for topic ${topic}:`, payload.type);
    }
  } catch (err) {
    console.error('Error handling MQTT message:', err);
  }
}

/**
 * Process telemetry message
 * @param {Object} device - Device object
 * @param {Object} payload - Message payload
 */
async function processTelemetryMessage(device, payload) {
  try {
    // Create telemetry record
    const telemetryData = {
      device: device._id,
      readings: payload.data,
      timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
      battery: payload.battery,
      signalStrength: payload.signalStrength,
      metadata: payload.metadata
    };
    
    // Add location if provided
    if (payload.location) {
      telemetryData.location = {
        type: 'Point',
        coordinates: [payload.location.longitude, payload.location.latitude]
      };
    }
    
    // Save telemetry
    const telemetry = await telemetryService.createTelemetry(telemetryData);
    
    // Process for alerts
    await alertService.processTelemetryForAlerts(telemetry);
    
    // Auto-resolve alerts if conditions are met
    await alertService.autoResolveAlerts(telemetry);
    
    // Update device status
    await Device.findByIdAndUpdate(device._id, {
      lastCommunication: new Date(),
      status: 'active',
      ...(payload.battery ? { 'battery.level': payload.battery.level, 'battery.charging': payload.battery.charging } : {})
    });
    
    console.log(`Processed telemetry for device ${device._id}`);
  } catch (err) {
    console.error(`Error processing telemetry for device ${device._id}:`, err);
  }
}

/**
 * Process command response
 * @param {Object} device - Device object
 * @param {Object} payload - Message payload
 */
async function processCommandResponse(device, payload) {
  try {
    console.log(`Received command response from device ${device._id}:`, payload);
    
    // Update device status based on command response
    if (payload.command === 'firmware_update' && payload.status === 'success') {
      await Device.findByIdAndUpdate(device._id, {
        'firmware.version': payload.data.version,
        'firmware.lastUpdated': new Date(),
        lastCommunication: new Date()
      });
    }
  } catch (err) {
    console.error(`Error processing command response for device ${device._id}:`, err);
  }
}

/**
 * Process status update
 * @param {Object} device - Device object
 * @param {Object} payload - Message payload
 */
async function processStatusUpdate(device, payload) {
  try {
    console.log(`Received status update from device ${device._id}:`, payload);
    
    // Update device status
    await Device.findByIdAndUpdate(device._id, {
      status: payload.status,
      lastCommunication: new Date(),
      ...(payload.battery ? { 'battery.level': payload.battery.level, 'battery.charging': payload.battery.charging } : {})
    });
    
    // Create alert for offline status
    if (payload.status === 'offline' || payload.status === 'error') {
      await alertService.createAlert({
        device: device._id,
        type: payload.status === 'offline' ? 'offline' : 'system_error',
        severity: 'warning',
        message: `Device ${device.name} reported status: ${payload.status}`,
        telemetryData: payload.data
      });
    }
  } catch (err) {
    console.error(`Error processing status update for device ${device._id}:`, err);
  }
}

/**
 * Process alert message
 * @param {Object} device - Device object
 * @param {Object} payload - Message payload
 */
async function processAlertMessage(device, payload) {
  try {
    console.log(`Received alert from device ${device._id}:`, payload);
    
    // Create alert
    await alertService.createAlert({
      device: device._id,
      type: payload.alertType || 'other',
      severity: payload.severity || 'warning',
      message: payload.message || `Alert from device ${device.name}`,
      telemetryData: payload.data,
      timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date()
    });
    
    // Update device status if needed
    if (payload.status) {
      await Device.findByIdAndUpdate(device._id, {
        status: payload.status,
        lastCommunication: new Date()
      });
    }
  } catch (err) {
    console.error(`Error processing alert for device ${device._id}:`, err);
  }
}

/**
 * Send command to device
 * @param {string} deviceId - Device ID
 * @param {string} command - Command name
 * @param {Object} data - Command data
 * @returns {Promise<boolean>} Success status
 */
exports.sendCommand = async (deviceId, command, data = {}) => {
  try {
    const device = await Device.findById(deviceId);
    
    if (!device) {
      throw new Error(`Device not found: ${deviceId}`);
    }
    
    const payload = {
      type: 'command',
      command,
      data,
      timestamp: new Date().toISOString(),
      messageId: `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    
    // Publish command to device's command topic
    const commandTopic = `${device.mqttTopic}/commands`;
    await this.publish(commandTopic, payload, { qos: 1, retain: false });
    
    return true;
  } catch (err) {
    console.error(`Error sending command to device ${deviceId}:`, err);
    return false;
  }
};

/**
 * Check device connectivity
 * @param {string} deviceId - Device ID
 * @returns {Promise<boolean>} True if device is online
 */
exports.checkDeviceConnectivity = async (deviceId) => {
  try {
    const device = await Device.findById(deviceId);
    
    if (!device) {
      throw new Error(`Device not found: ${deviceId}`);
    }
    
    // Send ping command
    const pingTopic = `${device.mqttTopic}/ping`;
    const pingPayload = {
      type: 'ping',
      timestamp: new Date().toISOString(),
      messageId: `ping-${Date.now()}`
    };
    
    // Set up response listener with timeout
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        // Remove listener and resolve as offline
        if (client) {
          client.removeListener('message', pingListener);
        }
        resolve(false);
      }, 5000); // 5 second timeout
      
      // Listen for ping response
      const pingListener = (topic, message) => {
        if (topic === `${device.mqttTopic}/pong`) {
          clearTimeout(timeout);
          client.removeListener('message', pingListener);
          resolve(true);
        }
      };
      
      if (client) {
        client.on('message', pingListener);
        // Subscribe to pong topic
        client.subscribe(`${device.mqttTopic}/pong`);
        // Send ping
        this.publish(pingTopic, pingPayload);
      } else {
        resolve(false);
      }
    });
  } catch (err) {
    console.error(`Error checking connectivity for device ${deviceId}:`, err);
    return false;
  }
};

// Export the client for testing
exports.getClient = () => client;