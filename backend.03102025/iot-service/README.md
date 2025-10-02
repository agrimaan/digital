# IoT Microservice

This microservice handles IoT device management, telemetry data collection, and alert processing for the Agrimaan platform.

## Features

- IoT device registration and management
- Real-time telemetry data collection and storage
- Alert generation and management
- MQTT integration for device communication
- API key authentication for device data submission
- Telemetry data aggregation and analysis

## API Endpoints

### Device Management

- `GET /api/devices` - Get all devices (filtered by user)
- `GET /api/devices/:id` - Get device by ID
- `POST /api/devices` - Create new device
- `PUT /api/devices/:id` - Update device
- `DELETE /api/devices/:id` - Delete device
- `GET /api/devices/field/:fieldId` - Get devices by field
- `GET /api/devices/:id/status` - Get device status
- `POST /api/devices/:id/regenerate-api-key` - Regenerate device API key

### Telemetry Management

- `GET /api/telemetry/device/:deviceId` - Get telemetry data for a device
- `GET /api/telemetry/device/:deviceId/latest` - Get latest telemetry for a device
- `POST /api/telemetry` - Submit telemetry data (API key auth)
- `GET /api/telemetry/device/:deviceId/aggregate` - Get aggregated telemetry data
- `DELETE /api/telemetry/:id` - Delete telemetry data (Admin only)
- `GET /api/telemetry/field/:fieldId` - Get telemetry data for a field

### Alert Management

- `GET /api/alerts` - Get all alerts (filtered by user's devices)
- `GET /api/alerts/:id` - Get alert by ID
- `POST /api/alerts` - Create new alert
- `PUT /api/alerts/:id/resolve` - Resolve alert
- `DELETE /api/alerts/:id` - Delete alert (Admin only)
- `GET /api/alerts/device/:deviceId` - Get alerts by device
- `GET /api/alerts/summary` - Get alerts summary

## MQTT Topics

- `agrimaan/iot/{deviceType}/{deviceId}` - Main device topic
- `agrimaan/iot/{deviceType}/{deviceId}/commands` - Device commands
- `agrimaan/iot/{deviceType}/{deviceId}/ping` - Device ping
- `agrimaan/iot/{deviceType}/{deviceId}/pong` - Device ping response

## Environment Variables

- `PORT` - Server port (default: 3004)
- `MONGODB_URI` - MongoDB connection string
- `USER_SERVICE_URL` - URL of the user service for authentication
- `FIELD_SERVICE_URL` - URL of the field service for field data
- `MQTT_ENABLED` - Enable MQTT integration (true/false)
- `MQTT_BROKER_URL` - MQTT broker URL
- `MQTT_USERNAME` - MQTT broker username
- `MQTT_PASSWORD` - MQTT broker password
- `MQTT_CLIENT_ID` - MQTT client ID
- `MQTT_TOPIC_PREFIX` - MQTT topic prefix
- `NODE_ENV` - Environment (development, production)

## Setup and Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Set up environment variables:
   Create a `.env` file in the root directory with the required environment variables.

3. Start the service:
   ```
   npm start
   ```

   For development with auto-reload:
   ```
   npm run dev
   ```

## Docker

Build the Docker image:
```
docker build -t agrimaan/iot-service .
```

Run the container:
```
docker run -p 3004:3004 -e MONGODB_URI=your_mongodb_uri -e USER_SERVICE_URL=http://user-service:3002 -e MQTT_BROKER_URL=mqtt://mqtt-broker:1883 agrimaan/iot-service
```

## Testing

Run tests:
```
npm test
```

## Dependencies

- Express - Web framework
- Mongoose - MongoDB object modeling
- MQTT - MQTT client for device communication
- JWT - Authentication
- Express Validator - Input validation