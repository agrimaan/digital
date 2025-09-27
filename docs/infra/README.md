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
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.