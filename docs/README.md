# Agrimaan Platform Microservices Architecture

This repository contains the microservices architecture for the Agrimaan agricultural platform. The platform is designed to connect farmers, buyers, logistics providers, investors, and agronomists in a comprehensive agricultural ecosystem.

## Architecture Overview

The Agrimaan platform consists of 11 backend microservices and 6 frontend microservices, along with integration components for service discovery, resilience patterns, and messaging.

### Backend Microservices

1. **User Service**: Handles user authentication, registration, and profile management
2. **Field Service**: Manages agricultural field data and boundaries
3. **IoT Service**: Manages IoT device connections and sensor data
4. **Crop Service**: Manages crop data and recommendations
5. **Marketplace Service**: Facilitates buying and selling of agricultural products
6. **Logistics Service**: Manages transportation and delivery of products
7. **Weather Service**: Provides weather data and forecasts
8. **Analytics Service**: Processes and analyzes platform data
9. **Notification Service**: Manages system notifications
10. **Blockchain Service**: Manages blockchain-based supply chain tracking
11. **Admin Service**: Provides administrative capabilities

### Frontend Microservices

1. **Farmer Service**: User interface for farmers
2. **Buyer Service**: User interface for agricultural product buyers
3. **Logistics Service**: User interface for logistics providers
4. **Investor Service**: User interface for agricultural investors
5. **Agronomist Service**: User interface for agricultural experts
6. **Admin Service**: User interface for platform administrators

### Integration Components

1. **Service Discovery**: Uses Consul for service registration and discovery
2. **Circuit Breaker**: Implements resilience patterns for service communication
3. **Message Queue**: Uses RabbitMQ for asynchronous communication

## Directory Structure

```
microservices/
├── api-gateway/                # API Gateway for routing requests
├── user-service/               # User authentication and management
├── field-service/              # Field data management
├── iot-service/                # IoT device management
├── crop-service/               # Crop data management
├── marketplace-service/        # Marketplace functionality
├── logistics-service/          # Logistics management
├── weather-service/            # Weather data and forecasts
├── analytics-service/          # Data analytics
├── notification-service/       # Notification management
├── blockchain-service/         # Blockchain integration
├── admin-service/              # Administrative functionality
├── frontend/                   # Frontend microservices
│   ├── farmer-service/         # Farmer UI
│   ├── buyer-service/          # Buyer UI
│   ├── logistics-service/      # Logistics UI
│   ├── investor-service/       # Investor UI
│   ├── agronomist-service/     # Agronomist UI
│   └── admin-service/          # Admin UI
├── shared/                     # Shared components
│   ├── service-discovery/      # Service discovery components
│   ├── resilience/             # Resilience patterns
│   └── messaging/              # Messaging components
├── consul-server/              # Consul server for service discovery
├── docker-compose.yml          # Docker Compose configuration
└── README.md                   # This file
```

## Integration Components

### 1. Service Discovery

The service discovery implementation uses Consul to enable dynamic service registration and discovery. This eliminates the need for hardcoded service endpoints and enables automatic load balancing and failover.

**Key Components:**
- **Consul Server**: Central registry for service registration and discovery
- **Service Registry**: Module for registering services with Consul
- **Service Discovery Client**: Module for discovering services dynamically
- **Health Check Middleware**: Standardized health check endpoints for all services
- **Dynamic Proxy Middleware**: Routing requests to services using service discovery

### 2. Circuit Breaker Pattern

The circuit breaker pattern implementation uses Resilience4js to prevent cascading failures in the system. It provides retry mechanisms, fallback strategies, and bulkhead patterns to enhance system resilience.

**Key Components:**
- **Resilient HTTP Client**: HTTP client with circuit breaker, retry, and bulkhead patterns
- **Retry Utility**: Utility for retrying operations with exponential backoff
- **Service Clients**: Resilient clients for specific services
- **Fallback Strategies**: Graceful degradation when services are unavailable

### 3. Message Queue

The message queue implementation uses RabbitMQ to enable asynchronous communication between services. It provides event-driven architecture, reliable task processing, and dead letter queue handling.

**Key Components:**
- **Message Broker Client**: Client for RabbitMQ with connection management and reconnection
- **Event Publisher**: Module for publishing events to RabbitMQ
- **Event Subscriber**: Module for subscribing to events from RabbitMQ
- **Task Queue**: Module for publishing and processing tasks using RabbitMQ

## API Gateway Enhancements

The API Gateway has been enhanced with several features to improve security, reliability, and maintainability:

1. **Request Validation**: Comprehensive request validation using Joi and JSON Schema
2. **API Versioning**: Support for API versioning to ensure backward compatibility
3. **Caching**: Response caching using Redis to improve performance
4. **API Documentation**: Comprehensive API documentation using Swagger/OpenAPI

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 16+
- MongoDB
- RabbitMQ
- Redis
- Consul

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   cd microservices
   npm install
   ```
3. Start the services:
   ```bash
   docker-compose up -d
   ```
4. Access the API Gateway at http://localhost:3000
5. Access the Swagger documentation at http://localhost:3000/api-docs

## Development

### Adding a New Microservice

1. Create a new directory for the microservice
2. Initialize a new Node.js project
3. Implement the microservice functionality
4. Add the microservice to docker-compose.yml
5. Update the API Gateway routes

### Testing

Each microservice includes unit tests and integration tests. To run the tests:

```bash
cd microservices/<service-name>
npm test
```

## Deployment

The microservices can be deployed to a Kubernetes cluster using the provided Kubernetes manifests.

```bash
kubectl apply -f kubernetes/
```
# Agrimaan Microservices Architecture

This repository contains the microservices architecture for the Agrimaan agricultural platform, designed to provide a scalable and modular system for agricultural management.

## Architecture Overview

The Agrimaan platform is built using a microservices architecture, with each service responsible for a specific domain of functionality. The services communicate with each other through RESTful APIs and message queues.

### Services

1. **API Gateway (Port 3000)**
   - Central entry point for all client requests
   - Routes requests to appropriate microservices
   - Handles authentication and authorization
   - Implements rate limiting and request logging

2. **User Service (Port 3002)**
   - User management and authentication
   - Role-based access control
   - User profiles and preferences

3. **Field Service (Port 3003)**
   - Agricultural field management
   - Soil information and classification
   - Field boundary geospatial data

4. **IoT Service (Port 3004)**
   - IoT device management
   - Telemetry data collection and storage
   - Alert generation and management
   - MQTT integration for device communication

5. **Crop Service (Port 3005)**
   - Crop information and management
   - Planting and harvesting schedules
   - Crop health monitoring

6. **Marketplace Service (Port 3006)**
   - Product listings and inventory management
   - Order processing and fulfillment
   - Pricing and discounts

7. **Logistics Service (Port 3007)**
   - Shipment tracking and management
   - Vehicle and fleet management
   - Route optimization

8. **Weather Service (Port 3008)**
   - Weather data collection and forecasting
   - Field-specific weather information
   - Weather alerts and notifications

9. **Analytics Service (Port 3009)**
   - Data aggregation and analysis
   - Reporting and visualization
   - Predictive analytics

10. **Notification Service (Port 3010)**
    - Email, SMS, and push notifications
    - Notification preferences and subscriptions
    - Scheduled and event-driven notifications

11. **Blockchain Service (Port 3011)**
    - Blockchain integration for supply chain transparency
    - Smart contract management
    - Token-based transactions

12. **Admin Service (Port 3012)**
    - System administration and monitoring
    - Service health checks
    - Configuration management

### Frontend Services

1. **Farmer Frontend (Port 5001)**
   - Dashboard for farmers
   - Field and crop management
   - IoT device monitoring

2. **Buyer Frontend (Port 5002)**
   - Marketplace for agricultural products
   - Order management
   - Supplier information

3. **Logistics Frontend (Port 5003)**
   - Shipment tracking and management
   - Route planning and optimization
   - Delivery scheduling

4. **Investor Frontend (Port 5004)**
   - Investment opportunities
   - Portfolio management
   - Performance analytics

5. **Agronomist Frontend (Port 5005)**
   - Crop health monitoring
   - Soil analysis
   - Treatment recommendations

6. **Admin Frontend (Port 5006)**
   - System administration
   - User management
   - Service monitoring

## Technology Stack

- **Backend**: Node.js with Express
- **Database**: MongoDB
- **Communication**: RESTful APIs, MQTT
- **Authentication**: JWT
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Frontend**: React.js

## Service Architecture

Each microservice follows a similar architecture:

- **Models**: Data models and schemas
- **Controllers**: Request handlers and business logic
- **Routes**: API endpoint definitions
- **Services**: Core business logic and data processing
- **Middleware**: Authentication, validation, and error handling
- **Utils**: Utility functions and helpers
- **Config**: Service configuration

## Setup and Installation

### Prerequisites

- Node.js (v16+)
- MongoDB
- Docker and Docker Compose

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/agrimaan-microservices.git
   cd agrimaan-microservices
   ```

2. Set up environment variables:
   Create `.env` files in each service directory with the required environment variables.

3. Start all services using Docker Compose:
   ```
   ./start-services.sh
   ```

4. Access the API Gateway at http://localhost:3000

### Development

To run individual services for development:

1. Navigate to the service directory:
   ```
   cd microservices/service-name
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the service in development mode:
   ```
   npm run dev
   ```

## Creating a New Microservice

Use the provided script to create a new microservice with the proper structure:

```
./create-microservice.sh <service-name> <port-number>
```

For example:
```
./create-microservice.sh marketplace 3006
```

This will create a new microservice with the following structure:
- models/
- controllers/
- routes/
- services/
- config/
- middleware/
- utils/
- tests/
- server.js
- .env
- .gitignore
- Dockerfile
- package.json
- README.md

## Testing

Each service includes its own test suite. To run tests for a specific service:

```
cd microservices/service-name
npm test
```

To run all tests:

```
./run-all-tests.sh
```

## Deployment

The services can be deployed to any container orchestration platform that supports Docker, such as Kubernetes, AWS ECS, or Azure Container Service.

### Docker Compose Deployment

To deploy all services using Docker Compose:

```
docker-compose up -d
```

To stop all services:

```
docker-compose down
```

Or use the provided scripts:

```
./start-services.sh
./stop-services.sh
```

## Implementation Status

For the current implementation status, see [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md).

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request


## License

This project is licensed under the MIT License - see the LICENSE file for details.
