# Comprehensive Testing Plan for Agrimaan Microservices

## Overview
This document outlines a comprehensive testing strategy for the Agrimaan microservices platform. The plan covers various testing levels from unit tests to end-to-end tests, ensuring the reliability and robustness of the entire system.

## 1. Testing Levels

### 1.1 Unit Testing

#### Purpose
Verify that individual components work as expected in isolation.

#### Implementation Strategy

1. **Test Framework Setup**:
   - Use Jest for JavaScript/Node.js services
   - Configure with appropriate test runners and reporters

2. **Test Coverage Requirements**:
   - Minimum 80% code coverage for critical services
   - Focus on business logic, service layers, and utility functions

3. **Example Unit Test for User Service**:
```javascript
// user.service.test.js
const UserService = require('../services/user.service');
const UserModel = require('../models/user.model');

// Mock dependencies
jest.mock('../models/user.model');

describe('UserService', () => {
  let userService;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    userService = new UserService();
  });
  
  describe('getUserById', () => {
    it('should return user when valid ID is provided', async () => {
      // Arrange
      const mockUser = { _id: '123', name: 'Test User', email: 'test@example.com' };
      UserModel.findById.mockResolvedValue(mockUser);
      
      // Act
      const result = await userService.getUserById('123');
      
      // Assert
      expect(result).toEqual(mockUser);
      expect(UserModel.findById).toHaveBeenCalledWith('123');
    });
    
    it('should throw error when user not found', async () => {
      // Arrange
      UserModel.findById.mockResolvedValue(null);
      
      // Act & Assert
      await expect(userService.getUserById('456')).rejects.toThrow('User not found');
      expect(UserModel.findById).toHaveBeenCalledWith('456');
    });
  });
  
  // More tests for other methods...
});
```

4. **Running Unit Tests**:
```bash
# Add to package.json scripts
"scripts": {
  "test": "jest",
  "test:coverage": "jest --coverage"
}
```

### 1.2 Integration Testing

#### Purpose
Verify that different components work together correctly.

#### Implementation Strategy

1. **Test Framework Setup**:
   - Use Jest with Supertest for API testing
   - Configure MongoDB memory server for database tests

2. **Test Scope**:
   - API endpoints
   - Database interactions
   - Service-to-service communication

3. **Example Integration Test for User API**:
```javascript
// user.api.test.js
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const app = require('../app');
const UserModel = require('../models/user.model');
const jwt = require('jsonwebtoken');

describe('User API', () => {
  let mongoServer;
  let token;
  
  beforeAll(async () => {
    // Set up MongoDB memory server
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    
    // Create test user and generate token
    const testUser = await UserModel.create({
      name: 'Test Admin',
      email: 'admin@example.com',
      password: 'hashedPassword',
      role: 'admin'
    });
    
    token = jwt.sign(
      { id: testUser._id, role: testUser.role },
      process.env.JWT_SECRET || 'test-secret',
    { expiresIn: process.env.JWT_EXPIRE || '1h' }
    );
  });
  
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });
  
  describe('GET /api/users', () => {
    it('should return 401 if no token provided', async () => {
      const response = await request(app).get('/api/users');
      expect(response.status).toBe(401);
    });
    
    it('should return users when valid token provided', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
  
  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const newUser = {
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
        role: 'farmer'
      };
      
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send(newUser);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('_id');
      expect(response.body.name).toBe(newUser.name);
      expect(response.body.email).toBe(newUser.email);
      expect(response.body).not.toHaveProperty('password');
    });
    
    it('should return 400 for invalid user data', async () => {
      const invalidUser = {
        name: 'Invalid User',
        // Missing required email
        password: 'password123'
      };
      
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidUser);
      
      expect(response.status).toBe(400);
    });
  });
  
  // More endpoint tests...
});
```

4. **Running Integration Tests**:
```bash
# Add to package.json scripts
"scripts": {
  "test:integration": "jest --config jest.integration.config.js"
}
```

### 1.3 Contract Testing

#### Purpose
Ensure that service interfaces meet the expectations of their consumers.

#### Implementation Strategy

1. **Tool Selection**:
   - Use Pact for consumer-driven contract testing

2. **Test Scope**:
   - Define contracts between frontend services and backend APIs
   - Define contracts between microservices

3. **Example Contract Test Setup**:
```javascript
// consumer-side (frontend service)
// user.pact.spec.js
const { PactV3, MatchersV3 } = require('@pact-foundation/pact');
const { UserApiClient } = require('../api/user-api-client');

const provider = new PactV3({
  consumer: 'admin-frontend',
  provider: 'user-service',
  log: process.cwd() + '/logs/pact.log',
  logLevel: 'warn',
  dir: process.cwd() + '/pacts'
});

describe('User API Contract', () => {
  describe('get user by ID', () => {
    const userId = '123';
    const expectedUser = {
      id: userId,
      name: 'Test User',
      email: 'test@example.com',
      role: 'farmer'
    };
    
    beforeEach(() => {
      provider.given('a user exists')
        .uponReceiving('a request to get a user')
        .withRequest({
          method: 'GET',
          path: `/api/users/${userId}`,
          headers: {
            'Authorization': MatchersV3.regex('Bearer .+', 'Bearer token')
          }
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: MatchersV3.like(expectedUser)
        });
    });
    
    it('returns the user', async () => {
      await provider.executeTest(async (mockServer) => {
        const client = new UserApiClient(mockServer.url);
        const user = await client.getUserById(userId, 'valid-token');
        expect(user).toEqual(expectedUser);
      });
    });
  });
  
  // More interaction tests...
});
```

```javascript
// provider-side (user-service)
// verify.pact.js
const { Verifier } = require('@pact-foundation/pact');
const path = require('path');
const app = require('../app');
const UserModel = require('../models/user.model');

// Start the server
const server = app.listen(3002);

describe('Pact Verification', () => {
  it('validates the expectations of Admin Frontend', async () => {
    // Set up test data
    await UserModel.create({
      _id: '123',
      name: 'Test User',
      email: 'test@example.com',
      role: 'farmer'
    });
    
    const options = {
      provider: 'user-service',
      providerBaseUrl: 'http://localhost:3002',
      pactUrls: [
        path.resolve(__dirname, '../pacts/admin-frontend-user-service.json')
      ],
      stateHandlers: {
        'a user exists': () => {
          // State is already set up in the beforeAll
          return Promise.resolve();
        }
      }
    };
    
    return new Verifier(options).verifyProvider();
  });
  
  afterAll(() => {
    server.close();
  });
});
```

4. **Running Contract Tests**:
```bash
# Add to package.json scripts
"scripts": {
  "test:pact:consumer": "jest --testMatch='**/*.pact.spec.js'",
  "test:pact:provider": "jest --testMatch='**/verify.pact.js'"
}
```

### 1.4 End-to-End Testing

#### Purpose
Verify that the entire system works together as expected from a user's perspective.

#### Implementation Strategy

1. **Tool Selection**:
   - Use Cypress for frontend E2E testing
   - Use Postman/Newman for API workflow testing

2. **Test Scope**:
   - Critical user journeys
   - Cross-service workflows
   - UI interactions

3. **Example Cypress E2E Test**:
```javascript
// cypress/integration/farmer-login.spec.js
describe('Farmer Login', () => {
  beforeEach(() => {
    // Set up test data via API or database
    cy.task('seedDatabase', {
      users: [{
        email: 'farmer@example.com',
        password: 'password123',
        role: 'farmer'
      }]
    });
    
    cy.visit('/login');
  });
  
  it('should allow a farmer to login and see dashboard', () => {
    // Enter login credentials
    cy.get('[data-testid=email-input]').type('farmer@example.com');
    cy.get('[data-testid=password-input]').type('password123');
    cy.get('[data-testid=login-button]').click();
    
    // Verify redirect to dashboard
    cy.url().should('include', '/dashboard');
    
    // Verify dashboard elements
    cy.get('[data-testid=welcome-message]').should('contain', 'Welcome');
    cy.get('[data-testid=field-summary]').should('be.visible');
    cy.get('[data-testid=weather-widget]').should('be.visible');
  });
  
  it('should show error message with invalid credentials', () => {
    cy.get('[data-testid=email-input]').type('farmer@example.com');
    cy.get('[data-testid=password-input]').type('wrongpassword');
    cy.get('[data-testid=login-button]').click();
    
    cy.get('[data-testid=error-message]')
      .should('be.visible')
      .and('contain', 'Invalid email or password');
    
    cy.url().should('include', '/login');
  });
});
```

4. **Example Postman/Newman API Workflow Test**:
```json
{
  "info": {
    "name": "Agrimaan Field Management Workflow",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Login",
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "pm.test('Status code is 200', function() {",
              "  pm.response.to.have.status(200);",
              "});",
              "",
              "pm.test('Response has token', function() {",
              "  var jsonData = pm.response.json();",
              "  pm.expect(jsonData.token).to.be.a('string');",
              "  pm.environment.set('token', jsonData.token);",
              "});"
            ],
            "type": "text/javascript"
          }
        }
      ],
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  &quot;email&quot;: &quot;farmer@example.com&quot;,\n  &quot;password&quot;: &quot;password123&quot;\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/auth/login",
          "host": ["{{baseUrl}}"],
          "path": ["api", "auth", "login"]
        }
      }
    },
    {
      "name": "Create Field",
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "pm.test('Status code is 201', function() {",
              "  pm.response.to.have.status(201);",
              "});",
              "",
              "pm.test('Field created successfully', function() {",
              "  var jsonData = pm.response.json();",
              "  pm.expect(jsonData._id).to.be.a('string');",
              "  pm.environment.set('fieldId', jsonData._id);",
              "});"
            ],
            "type": "text/javascript"
          }
        }
      ],
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  &quot;name&quot;: &quot;Test Field&quot;,\n  &quot;location&quot;: {\n    &quot;type&quot;: &quot;Point&quot;,\n    &quot;coordinates&quot;: [73.123, 19.456]\n  },\n  &quot;area&quot;: 5.5,\n  &quot;soilType&quot;: &quot;Clay&quot;\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/fields",
          "host": ["{{baseUrl}}"],
          "path": ["api", "fields"]
        }
      }
    },
    {
      "name": "Get Field Details",
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "pm.test('Status code is 200', function() {",
              "  pm.response.to.have.status(200);",
              "});",
              "",
              "pm.test('Field details are correct', function() {",
              "  var jsonData = pm.response.json();",
              "  pm.expect(jsonData._id).to.eql(pm.environment.get('fieldId'));",
              "  pm.expect(jsonData.name).to.eql('Test Field');",
              "  pm.expect(jsonData.soilType).to.eql('Clay');",
              "});"
            ],
            "type": "text/javascript"
          }
        }
      ],
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/fields/{{fieldId}}",
          "host": ["{{baseUrl}}"],
          "path": ["api", "fields", "{{fieldId}}"]
        }
      }
    }
  ]
}
```

5. **Running E2E Tests**:
```bash
# Add to package.json scripts
"scripts": {
  "test:e2e": "cypress run",
  "test:api-workflow": "newman run postman_collection.json -e environment.json"
}
```

### 1.5 Performance Testing

#### Purpose
Ensure the system can handle expected load and identify performance bottlenecks.

#### Implementation Strategy

1. **Tool Selection**:
   - Use k6 for load testing
   - Use Artillery for stress testing

2. **Test Scope**:
   - API endpoints under various load conditions
   - Service response times
   - Resource utilization

3. **Example k6 Load Test**:
```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Ramp up to 20 users
    { duration: '1m', target: 20 },  // Stay at 20 users for 1 minute
    { duration: '30s', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    'http_req_duration{staticAsset:yes}': ['p(95)<100'], // 95% of static asset requests must complete below 100ms
    'http_req_duration{staticAsset:no}': ['p(95)<400'], // 95% of API requests must complete below 400ms
  },
};

// Simulate user behavior
export default function() {
  // Login
  const loginRes = http.post(`${__ENV.API_URL}/api/auth/login`, JSON.stringify({
    email: 'test@example.com',
    password: 'password123'
  }), {
    headers: { 'Content-Type': 'application/json' },
    tags: { staticAsset: 'no' }
  });
  
  check(loginRes, {
    'login successful': (r) => r.status === 200,
    'has token': (r) => JSON.parse(r.body).token !== undefined,
  });
  
  const token = JSON.parse(loginRes.body).token;
  
  sleep(1);
  
  // Get fields
  const fieldsRes = http.get(`${__ENV.API_URL}/api/fields`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    tags: { staticAsset: 'no' }
  });
  
  check(fieldsRes, {
    'fields retrieved': (r) => r.status === 200,
    'fields is array': (r) => Array.isArray(JSON.parse(r.body)),
  });
  
  sleep(2);
  
  // Get weather data
  const weatherRes = http.get(`${__ENV.API_URL}/api/weather?lat=19.456&lon=73.123`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    tags: { staticAsset: 'no' }
  });
  
  check(weatherRes, {
    'weather retrieved': (r) => r.status === 200,
  });
  
  sleep(3);
}
```

4. **Running Performance Tests**:
```bash
# Add to package.json scripts
"scripts": {
  "test:load": "k6 run load-test.js",
  "test:stress": "artillery run stress-test.yml"
}
```

## 2. Testing Infrastructure

### 2.1 Continuous Integration Setup

1. **GitHub Actions Workflow**:
```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        service: [user-service, field-service, crop-service, marketplace-service, logistics-service, weather-service, analytics-service, notification-service, blockchain-service, admin-service]
    
    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '16.x'
          cache: 'npm'
          cache-dependency-path: microservices/${{ matrix.service }}/package-lock.json
      
      - name: Install dependencies
        run: cd microservices/${{ matrix.service }} && npm i
      
      - name: Run unit tests
        run: cd microservices/${{ matrix.service }} && npm test
      
      - name: Upload coverage
        uses: actions/upload-artifact@v3
        with:
          name: coverage-${{ matrix.service }}
          path: microservices/${{ matrix.service }}/coverage
  
  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    
    services:
      mongodb:
        image: mongo:5.0
        ports:
          - 27018:27017
    
    strategy:
      matrix:
        service: [user-service, field-service, crop-service]
    
    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '16.x'
          cache: 'npm'
          cache-dependency-path: microservices/${{ matrix.service }}/package-lock.json
      
      - name: Install dependencies
        run: cd microservices/${{ matrix.service }} && npm i
      
      - name: Run integration tests
        run: cd microservices/${{ matrix.service }} && npm run test:integration
        env:
          MONGODB_URI: mongodb://localhost:27017/test
  
  contract-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    
    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '16.x'
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          cd microservices/user-service && npm i
          cd ../../microservices/frontend/admin-service && npm i
      
      - name: Run consumer contract tests
        run: cd microservices/frontend/admin-service && npm run test:pact:consumer
      
      - name: Run provider contract tests
        run: cd microservices/user-service && npm run test:pact:provider
      
      - name: Publish pacts
        if: github.event_name == 'push' && github.ref == 'refs/heads/main'
        run: cd microservices/frontend/admin-service && npm run pact:publish
        env:
          PACT_BROKER_URL: ${{ secrets.PACT_BROKER_URL }}
          PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}
  
  e2e-tests:
    runs-on: ubuntu-latest
    needs: [integration-tests, contract-tests]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      - name: Set up Docker Compose
        uses: docker/setup-buildx-action@v2
      
      - name: Start services
        run: docker-compose up -d
      
      - name: Wait for services to be ready
        run: ./scripts/wait-for-services.sh
      
      - name: Run API workflow tests
        run: npm run test:api-workflow
      
      - name: Run Cypress tests
        uses: cypress-io/github-action@v5
        with:
          working-directory: e2e-tests
          browser: chrome
          record: true
        env:
          CYPRESS_BASE_URL: http://localhost:3000
          CYPRESS_RECORD_KEY: ${{ secrets.CYPRESS_RECORD_KEY }}
      
      - name: Stop services
        run: docker-compose down
```

### 2.2 Test Environment Setup

1. **Docker Compose for Test Environment**:
```yaml
# docker-compose.test.yml
version: '3.8'

services:
  mongodb:
    image: mongo:5.0
    ports:
      - "27018:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=test
      - MONGO_INITDB_ROOT_PASSWORD=test123
  
  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"
  
  user-service:
    build: ./user-service
    ports:
      - "3002:3002"
    environment:
      - PORT=3002
      - MONGODB_URI=mongodb://test:test123@mongodb:27017/test-user-service?authSource=admin
      - JWT_SECRET=test_secret_key
      - NODE_ENV=test
    depends_on:
      - mongodb
  
  field-service:
    build: ./field-service
    ports:
      - "3003:3003"
    environment:
      - PORT=3003
      - MONGODB_URI=mongodb://test:test123@mongodb:27017/test-field-service?authSource=admin
      - USER_SERVICE_URL=http://user-service:3002
      - NODE_ENV=test
    depends_on:
      - mongodb
      - user-service
  
  # Add more services as needed for testing
```

2. **Test Data Seeding Script**:
```javascript
// scripts/seed-test-data.js
const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');

async function seedDatabase() {
  const client = new MongoClient('mongodb://test:test123@localhost:27017/admin');
  await client.connect();
  
  // Clear existing data
  await client.db('test-user-service').collection('users').deleteMany({});
  await client.db('test-field-service').collection('fields').deleteMany({});
  
  // Seed users
  const users = [
    {
      _id: new mongoose.Types.ObjectId('60d21b4667d0d8992e610c85'),
      name: 'Test Farmer',
      email: 'farmer@example.com',
      password: '$2b$10$X/8.yjaxS.XF1W5zrWiYZ.3fxhZkYqV9.g9Qb.Z3L9NUHjB6qv.Iu', // password123
      role: 'farmer',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: new mongoose.Types.ObjectId('60d21b4667d0d8992e610c86'),
      name: 'Test Admin',
      email: 'admin@example.com',
      password: '$2b$10$X/8.yjaxS.XF1W5zrWiYZ.3fxhZkYqV9.g9Qb.Z3L9NUHjB6qv.Iu', // password123
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  
  await client.db('test-user-service').collection('users').insertMany(users);
  
  // Seed fields
  const fields = [
    {
      _id: new mongoose.Types.ObjectId('60d21b4667d0d8992e610c87'),
      name: 'Test Field 1',
      userId: '60d21b4667d0d8992e610c85',
      location: {
        type: 'Point',
        coordinates: [73.123, 19.456]
      },
      area: 5.5,
      soilType: 'Clay',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  
  await client.db('test-field-service').collection('fields').insertMany(fields);
  
  console.log('Test data seeded successfully');
  await client.close();
}

seedDatabase().catch(console.error);
```

### 2.3 Test Reporting

1. **Jest Test Reporter Configuration**:
```javascript
// jest.config.js
module.exports = {
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'reports',
      outputName: 'jest-junit.xml',
    }],
    ['jest-html-reporter', {
      pageTitle: 'Test Report',
      outputPath: 'reports/test-report.html',
    }]
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!**/node_modules/**',
  ],
  coverageReporters: ['text', 'lcov', 'clover'],
  coverageDirectory: 'coverage'
};
```

2. **Test Dashboard Setup**:
   - Use GitHub Actions summary pages for CI test results
   - Set up SonarQube for code quality and test coverage visualization
   - Configure Cypress Dashboard for E2E test monitoring

## 3. Testing Workflow

### 3.1 Developer Workflow

1. **Local Testing Process**:
   - Run unit tests during development
   - Run integration tests before committing
   - Use pre-commit hooks to enforce test passing

2. **Example Pre-commit Hook**:
```bash
#!/bin/sh
# .git/hooks/pre-commit

# Get the current branch name
BRANCH_NAME=$(git symbolic-ref --short HEAD)

# Run tests based on changed files
CHANGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.js$')

if [ -n "$CHANGED_FILES" ]; then
  echo "Running tests for changed files..."
  
  # Extract service directories from changed files
  SERVICES=$(echo "$CHANGED_FILES" | grep -o "microservices/[^/]*" | sort -u)
  
  for SERVICE in $SERVICES; do
    if [ -d "$SERVICE" ]; then
      echo "Testing $SERVICE..."
      cd $SERVICE && npm test
      TEST_RESULT=$?
      cd - > /dev/null
      
      if [ $TEST_RESULT -ne 0 ]; then
        echo "Tests failed for $SERVICE. Please fix the tests before committing."
        exit 1
      fi
    fi
  done
fi

exit 0
```

### 3.2 CI/CD Pipeline

1. **Testing Stages**:
   - Unit tests run on every push and pull request
   - Integration tests run on every push and pull request
   - Contract tests run on every push and pull request
   - E2E tests run on merges to main branch
   - Performance tests run on scheduled basis or before releases

2. **Deployment Gating**:
   - Require all tests to pass before deployment
   - Enforce code coverage thresholds
   - Require security scanning to pass

## 4. Specialized Testing

### 4.1 Chaos Testing

1. **Tool Selection**:
   - Use Chaos Monkey for Kubernetes

2. **Test Scenarios**:
   - Random pod termination
   - Network latency injection
   - Resource constraints (CPU, memory)

3. **Example Chaos Test Configuration**:
```yaml
# chaos-test.yaml
apiVersion: chaos-mesh.org/v1alpha1
kind: PodChaos
metadata:
  name: pod-kill-chaos
spec:
  action: pod-kill
  mode: one
  selector:
    namespaces:
      - agrimaan
    labelSelectors:
      "app.kubernetes.io/component": "microservice"
  scheduler:
    cron: "@every 10m"
```

### 4.2 Security Testing

1. **Tool Selection**:
   - Use OWASP ZAP for API security testing
   - Use npm audit for dependency vulnerabilities
   - Use SonarQube for code security analysis

2. **Test Scenarios**:
   - Authentication bypass attempts
   - Injection attacks
   - Rate limiting effectiveness
   - Dependency vulnerability scanning

3. **Example ZAP API Scan**:
```bash
#!/bin/bash
# security/api-scan.sh

# Start ZAP
docker run -d --name zap -u zap -p 8080:8080 -i owasp/zap2docker-stable zap.sh -daemon -host 0.0.0.0 -port 8080 -config api.disablekey=true

# Wait for ZAP to start
sleep 10

# Run API scan
docker exec zap zap-api-scan.py -t http://api-gateway:3000/api/v1/openapi.json -f openapi -r api-scan-report.html

# Copy report
docker cp zap:/zap/api-scan-report.html ./reports/

# Stop ZAP
docker stop zap
docker rm zap
```

### 4.3 Accessibility Testing

1. **Tool Selection**:
   - Use axe-core for accessibility testing

2. **Example Accessibility Test**:
```javascript
// cypress/integration/accessibility.spec.js
describe('Accessibility Tests', () => {
  const pages = [
    '/',
    '/login',
    '/dashboard',
    '/fields',
    '/marketplace'
  ];
  
  pages.forEach(page => {
    it(`should have no accessibility violations on ${page}`, () => {
      cy.visit(page);
      cy.injectAxe();
      cy.checkA11y();
    });
  });
  
  it('should have no accessibility violations on authenticated pages', () => {
    // Login first
    cy.visit('/login');
    cy.get('[data-testid=email-input]').type('farmer@example.com');
    cy.get('[data-testid=password-input]').type('password123');
    cy.get('[data-testid=login-button]').click();
    
    // Check dashboard
    cy.url().should('include', '/dashboard');
    cy.injectAxe();
    cy.checkA11y();
    
    // Check field details
    cy.visit('/fields/1');
    cy.injectAxe();
    cy.checkA11y();
  });
});
```

## 5. Documentation and Training

### 5.1 Testing Documentation

1. **Test Plan Template**:
```markdown
# Test Plan for [Service Name]

## Overview
Brief description of the service and its functionality.

## Test Scope
What is being tested and what is not.

## Test Types
- Unit Tests
- Integration Tests
- Contract Tests
- E2E Tests
- Performance Tests

## Test Environment
Description of the test environment setup.

## Test Data
Description of test data requirements.

## Test Cases
List of high-level test cases.

## Test Schedule
Timeline for testing activities.

## Responsibilities
Who is responsible for what testing activities.

## Risks and Mitigations
Potential risks and how they will be mitigated.
```

2. **Test Case Template**:
```markdown
# Test Case: [ID] - [Name]

## Description
Brief description of what this test case verifies.

## Preconditions
- List of conditions that must be met before the test can be executed.

## Test Steps
1. Step 1
2. Step 2
3. Step 3

## Expected Results
- What should happen after each step.

## Actual Results
- What actually happened (to be filled during test execution).

## Status
- [ ] Passed
- [ ] Failed
- [ ] Blocked

## Notes
Any additional information or observations.
```

### 5.2 Developer Training

1. **Testing Workshop Outline**:
   - Introduction to testing principles
   - Unit testing with Jest
   - Integration testing with Supertest
   - Contract testing with Pact
   - E2E testing with Cypress
   - Performance testing with k6
   - Test-driven development practice

2. **Testing Checklist for Code Reviews**:
   - [ ] Unit tests cover all new functionality
   - [ ] Tests follow the AAA pattern (Arrange, Act, Assert)
   - [ ] Edge cases are tested
   - [ ] Error handling is tested
   - [ ] Tests are independent and don't rely on external state
   - [ ] Test names clearly describe what is being tested
   - [ ] No test data is hardcoded
   - [ ] Tests run quickly
   - [ ] Code coverage meets or exceeds thresholds

## 6. Maintenance and Evolution

### 6.1 Test Maintenance Strategy

1. **Regular Test Review**:
   - Review and update tests quarterly
   - Remove obsolete tests
   - Update tests for changed functionality

2. **Test Debt Management**:
   - Track flaky tests in issue tracker
   - Allocate time in each sprint for test maintenance
   - Refactor tests when refactoring code

### 6.2 Test Evolution

1. **Continuous Improvement**:
   - Regularly evaluate testing tools and frameworks
   - Incorporate new testing techniques
   - Adjust test coverage based on defect analysis

2. **Metrics and Monitoring**:
   - Track test coverage over time
   - Monitor test execution time
   - Analyze test effectiveness by correlating with production issues