# Marketplace Microservice

This microservice handles the marketplace functionality for the Agrimaan platform, including product listings and order management.

## Features

- Product listing and management
- Order processing and tracking
- Product search and filtering
- Product reviews and ratings
- Order status management
- Payment status tracking
- Shipment tracking

## API Endpoints

### Product Management

- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/products/seller/:sellerId` - Get products by seller
- `GET /api/products/category/:category` - Get products by category
- `GET /api/products/search/:query` - Search products
- `GET /api/products/nearby` - Get nearby products
- `POST /api/products/:id/reviews` - Add product review

### Order Management

- `GET /api/orders` - Get all orders (Admin only)
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id/status` - Update order status
- `PUT /api/orders/:id/payment` - Update payment status
- `PUT /api/orders/:id/shipment` - Update shipment details
- `GET /api/orders/buyer` - Get orders by buyer
- `GET /api/orders/seller` - Get orders by seller
- `GET /api/orders/statistics` - Get order statistics

## Environment Variables

- `PORT` - Server port (default: 3006)
- `MONGODB_URI` - MongoDB connection string
- `USER_SERVICE_URL` - URL of the user service for authentication
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
docker build -t agrimaan/marketplace-service .
```

Run the container:
```
docker run -p 3006:3006 -e MONGODB_URI=your_mongodb_uri -e USER_SERVICE_URL=http://user-service:3002 agrimaan/marketplace-service
```

## Testing

Run tests:
```
npm test
```

## Models

### Product

- name: String (required)
- description: String (required)
- category: String (enum: crop, seed, fertilizer, pesticide, equipment, other)
- price: Object (value, currency, unit)
- quantity: Object (available, unit, minimum)
- images: Array of Strings
- seller: String (User ID)
- location: Object (coordinates, address)
- specifications: Mixed
- ratings: Object (average, count)
- reviews: Array of Objects (user, rating, comment, date)
- isOrganic: Boolean
- certifications: Array of Strings
- harvestDate: Date
- expiryDate: Date
- isActive: Boolean
- createdAt: Date
- updatedAt: Date

### Order

- orderNumber: String (unique)
- buyer: String (User ID)
- seller: String (User ID)
- items: Array of Objects (product, name, quantity, unit, price, totalPrice)
- totalAmount: Number
- currency: String
- status: String (enum: pending, confirmed, processing, shipped, delivered, cancelled, refunded)
- paymentStatus: String (enum: pending, paid, failed, refunded)
- paymentMethod: String
- paymentDetails: Object (transactionId, paymentDate, receiptUrl)
- shippingAddress: Object
- billingAddress: Object
- shipment: Object (carrier, trackingNumber, estimatedDelivery, actualDelivery)
- notes: String
- statusHistory: Array of Objects (status, timestamp, comment, updatedBy)
- createdAt: Date
- updatedAt: Date