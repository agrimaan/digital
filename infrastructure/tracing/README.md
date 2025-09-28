# Distributed Tracing with Jaeger and OpenTelemetry

This directory contains configuration for distributed tracing in the Agrimaan microservices architecture.

## Overview

Distributed tracing is implemented using:
- **Jaeger**: For trace collection, storage, and visualization
- **OpenTelemetry**: For instrumentation and trace generation

## Usage

### Starting Jaeger

```bash
docker-compose -f docker-compose.yml -f docker-compose.tracing.yml up -d
```

### Accessing Jaeger UI

The Jaeger UI is available at http://localhost:16686

### Key Transactions to Trace

1. **User Authentication Flow**
   - Login request
   - Token validation
   - User profile retrieval

2. **Field Management Flow**
   - Field creation
   - Field data retrieval
   - Field updates

3. **Marketplace Transactions**
   - Product listing
   - Purchase flow
   - Payment processing

4. **IoT Data Flow**
   - Sensor data ingestion
   - Data processing
   - Alert generation

5. **Weather Data Integration**
   - Weather data retrieval
   - Field-specific weather forecasting
   - Weather alert generation

### Custom Views in Jaeger UI

For each key transaction, you can create custom views in Jaeger UI:

1. **User Authentication View**
   - Filter by service: user-service
   - Filter by operation: login, validateToken, getUserProfile

2. **Field Management View**
   - Filter by service: field-service
   - Filter by operation: createField, getField, updateField

3. **Marketplace View**
   - Filter by service: marketplace-service
   - Filter by operation: listProduct, purchaseProduct, processPayment

4. **IoT Data View**
   - Filter by service: iot-service
   - Filter by operation: ingestData, processData, generateAlert

5. **Weather Data View**
   - Filter by service: weather-service
   - Filter by operation: getWeatherData, getForecast, generateAlert

## Correlation IDs

All services are configured to use correlation IDs for request tracking. The correlation ID is:
- Generated for each incoming request if not present
- Propagated in the `x-correlation-id` header
- Available in the request object as `req.correlationId`
- Included in all spans for the request

## Troubleshooting

If traces are not appearing in Jaeger UI:

1. Check that the Jaeger service is running:
   ```bash
   docker ps | grep jaeger
   ```

2. Verify that the service is correctly configured with the Jaeger endpoint:
   ```bash
   grep JAEGER_ENDPOINT backend/*/service/.env
   ```

3. Check service logs for tracing errors:
   ```bash
   docker logs <service-container-name> | grep -i trace
   ```

4. Ensure that the OpenTelemetry SDK is initialized before any other code in the service.
