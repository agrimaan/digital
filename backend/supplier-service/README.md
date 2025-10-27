# Supplier Management Service

A comprehensive supplier management system for agricultural product wholesalers with dynamic pricing based on farmer ratings, promotions, and sustainable farming practices.

## Features

### 1. Supplier Management
- Supplier registration and profile management
- Document verification and approval workflow
- Business details and certifications
- Performance metrics and ratings
- Delivery area management

### 2. Product Catalog
- Multi-category product listings (seeds, fertilizers, pesticides, equipment)
- Product specifications and certifications
- Inventory management
- Volume-based pricing tiers
- Organic and sustainable product tagging

### 3. Dynamic Pricing System
- Base pricing with volume discounts
- Farmer rating-based discounts (up to 25% for Platinum tier)
- Promotional pricing
- Seasonal adjustments
- Real-time price calculations

### 4. Farmer Rating System
Four-component rating system (0-100 scale):
- **Organic Certification Rating (35% weight)**
  - Organic certification status
  - Years of organic farming
  - Certification validity

- **IoT Sensor Rating (25% weight)**
  - Number of active sensors
  - Sensor types and coverage
  - Data quality and freshness

- **Sustainable Practices Rating (25% weight)**
  - Water conservation
  - Soil conservation
  - Renewable energy usage
  - Waste management
  - Biodiversity conservation
  - Carbon footprint reduction

- **Purchase History Rating (15% weight)**
  - Total purchases
  - Purchase frequency
  - Average order value
  - Customer loyalty years

### 5. Rating Tiers & Benefits

| Tier | Rating Range | Max Discount | Benefits |
|------|-------------|--------------|----------|
| **Platinum** | 90-100 | 25% | Priority support, Free shipping, Extended payment terms, Exclusive products |
| **Gold** | 75-89 | 20% | Priority support, Free shipping, Extended payment terms |
| **Silver** | 60-74 | 15% | Priority support |
| **Bronze** | 0-59 | 10% | Standard benefits |

### 6. Promotions & Coupons
- Percentage discounts
- Fixed amount discounts
- Bundle deals
- Buy X Get Y offers
- Free shipping promotions
- Farmer segment-specific promotions
- Coupon code generation and validation

## API Endpoints

### Suppliers

```
GET    /api/suppliers              - Get all suppliers
GET    /api/suppliers/:id          - Get supplier by ID
POST   /api/suppliers              - Create new supplier
PUT    /api/suppliers/:id          - Update supplier
DELETE /api/suppliers/:id          - Delete supplier (Admin)
PUT    /api/suppliers/:id/approve  - Approve supplier (Admin)
PUT    /api/suppliers/:id/reject   - Reject supplier (Admin)
GET    /api/suppliers/:id/stats    - Get supplier statistics
```

### Products

```
GET    /api/products                    - Get all products
GET    /api/products/:id                - Get product by ID
POST   /api/products                    - Create new product
PUT    /api/products/:id                - Update product
DELETE /api/products/:id                - Delete product
POST   /api/products/:id/calculate-price - Calculate price with discounts
PUT    /api/products/:id/approve        - Approve product (Admin)
PUT    /api/products/:id/stock          - Update stock
```

## Data Models

### Supplier Schema
```javascript
{
  businessName: String,
  ownerName: String,
  email: String,
  phone: String,
  address: {
    street, city, state, zipCode, country
  },
  businessType: String, // wholesaler, manufacturer, distributor
  gstNumber: String,
  panNumber: String,
  certifications: Array,
  bankDetails: Object,
  status: String, // pending, approved, rejected, suspended
  rating: Number,
  totalSales: Number,
  totalOrders: Number
}
```

### Product Schema
```javascript
{
  supplierId: ObjectId,
  name: String,
  sku: String,
  category: String, // seeds, fertilizers, pesticides, equipment
  subcategory: String,
  description: String,
  basePrice: Number,
  unit: String,
  stockQuantity: Number,
  volumePricing: Array,
  certifications: Array,
  isOrganic: Boolean,
  isSustainable: Boolean,
  status: String, // active, inactive, out_of_stock
  isApproved: Boolean
}
```

### Farmer Rating Schema
```javascript
{
  farmerId: ObjectId,
  organicCertificationRating: Number, // 0-100
  iotSensorRating: Number, // 0-100
  sustainablePracticesRating: Number, // 0-100
  purchaseHistoryRating: Number, // 0-100
  compositeRating: Number, // 0-100
  tier: String, // bronze, silver, gold, platinum
  benefits: {
    maxDiscountPercentage: Number,
    prioritySupport: Boolean,
    freeShipping: Boolean,
    extendedPaymentTerms: Boolean,
    exclusiveProducts: Boolean
  }
}
```

### Promotion Schema
```javascript
{
  supplierId: ObjectId,
  name: String,
  type: String, // percentage, fixed_amount, bundle, buy_x_get_y
  discountValue: Number,
  applicableProducts: Array,
  farmerSegments: Array,
  startDate: Date,
  endDate: Date,
  usageLimit: Number,
  coupons: Array,
  status: String // draft, active, paused, expired
}
```

## Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start the service
npm start

# Development mode with auto-reload
npm run dev
```

## Environment Variables

```env
NODE_ENV=development
PORT=3006
SERVICE_NAME=supplier-service

# MongoDB
MONGODB_URI=mongodb://localhost:27018/agrimaan-supplier-service

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=30d

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
```

## Usage Examples

### 1. Register a Supplier

```javascript
POST /api/suppliers
{
  "businessName": "Green Agro Supplies",
  "ownerName": "John Doe",
  "email": "john@greenagro.com",
  "phone": "9876543210",
  "address": {
    "street": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "zipCode": "400001"
  },
  "businessType": "wholesaler",
  "gstNumber": "27AABCU9603R1ZM",
  "panNumber": "AABCU9603R"
}
```

### 2. Add a Product

```javascript
POST /api/products
{
  "supplierId": "supplier_id_here",
  "name": "Organic Wheat Seeds",
  "category": "seeds",
  "subcategory": "wheat",
  "description": "Premium quality organic wheat seeds",
  "basePrice": 500,
  "unit": "kg",
  "unitSize": 1,
  "stockQuantity": 1000,
  "isOrganic": true,
  "volumePricing": [
    { "minQuantity": 10, "maxQuantity": 50, "discountPercentage": 5 },
    { "minQuantity": 51, "maxQuantity": 100, "discountPercentage": 10 },
    { "minQuantity": 101, "discountPercentage": 15 }
  ]
}
```

### 3. Calculate Price with Farmer Rating

```javascript
POST /api/products/:productId/calculate-price
{
  "quantity": 50,
  "farmerId": "farmer_id_here"
}

Response:
{
  "success": true,
  "data": {
    "productId": "...",
    "productName": "Organic Wheat Seeds",
    "quantity": 50,
    "basePrice": 500,
    "pricePerUnit": 380,
    "totalPrice": 19000,
    "discounts": [
      {
        "type": "volume",
        "percentage": 5,
        "amount": 1250
      },
      {
        "type": "farmer_rating",
        "tier": "gold",
        "percentage": 20,
        "amount": 3750
      }
    ],
    "totalDiscount": 5000
  }
}
```

### 4. Create a Promotion

```javascript
POST /api/promotions
{
  "supplierId": "supplier_id_here",
  "name": "Organic Farming Discount",
  "description": "Special discount for organic certified farmers",
  "type": "percentage",
  "discountValue": 15,
  "farmerSegments": ["organic", "gold", "platinum"],
  "applicableCategories": ["seeds", "fertilizers"],
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "minPurchaseAmount": 5000
}
```

## Rating Calculation Example

```javascript
// Farmer with following metrics:
{
  organicCertified: true,
  organicFarmingYears: 5,
  totalSensors: 10,
  activeSensors: 9,
  dataQuality: 85,
  waterConservation: true,
  soilConservation: true,
  renewableEnergy: true,
  totalPurchases: 50,
  purchaseFrequency: 4, // per month
  loyaltyYears: 3
}

// Calculated Ratings:
organicCertificationRating: 95 (50 + 25 + 20)
iotSensorRating: 85 (40 + 27 + 25.5)
sustainablePracticesRating: 51 (17 + 17 + 17)
purchaseHistoryRating: 85 (30 + 30 + 12 + 15)

// Composite Rating:
compositeRating = (95 * 0.35) + (85 * 0.25) + (51 * 0.25) + (85 * 0.15)
               = 33.25 + 21.25 + 12.75 + 12.75
               = 80

// Tier: Gold (75-89)
// Max Discount: 20%
```

## Integration with Other Services

### User Service Integration
```javascript
// Fetch farmer details
const farmerResponse = await axios.get(
  `${USER_SERVICE_URL}/api/internal/users/${farmerId}`
);
```

### IoT Service Integration
```javascript
// Fetch sensor data for rating calculation
const sensorResponse = await axios.get(
  `${IOT_SERVICE_URL}/api/sensors/farmer/${farmerId}`
);
```

## Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## Security

- JWT-based authentication
- Role-based access control (Admin, Supplier, Farmer)
- Input validation using express-validator
- Secure password hashing
- Rate limiting on API endpoints
- CORS configuration

## Performance Optimization

- Database indexing on frequently queried fields
- Caching of product listings
- Pagination for large datasets
- Lazy loading of images
- Query optimization

## Future Enhancements

1. Real-time inventory updates via WebSocket
2. AI-based product recommendations
3. Blockchain integration for supply chain transparency
4. Multi-language support
5. Mobile app integration
6. Advanced analytics dashboard
7. Integration with payment gateways
8. Automated reorder notifications
9. Supplier performance scoring
10. Carbon footprint tracking

## Support

For issues and questions, please contact:
- Email: support@agrimaan.com
- Documentation: https://docs.agrimaan.com/supplier-service

## License

MIT License - see LICENSE file for details