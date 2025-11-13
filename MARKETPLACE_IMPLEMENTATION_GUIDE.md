# Farmer Marketplace Implementation Guide

## Overview

This guide provides complete instructions for implementing the farmer marketplace system where farmers can list their ready-to-harvest crops and buyers can browse and purchase them through the crop-service API.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Backend Setup](#backend-setup)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Frontend Integration](#frontend-integration)
6. [Testing](#testing)
7. [Deployment](#deployment)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     FARMER WORKFLOW                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
                    ┌──────────────────┐
                    │  Grow Crop       │
                    │  (Crop Service)  │
                    └────────┬─────────┘
                             │
                             ↓
                    ┌──────────────────┐
                    │  Crop Reaches    │
                    │  Maturity/       │
                    │  Harvested       │
                    └────────┬─────────┘
                             │
                             ↓
                    ┌──────────────────┐
                    │  Create          │
                    │  Marketplace     │
                    │  Listing         │
                    └────────┬─────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────┐
│                  MARKETPLACE LISTING                         │
│                  (MarketplaceListing Model)                  │
└─────────────────────────────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────┐
│                     BUYER WORKFLOW                           │
└─────────────────────────────────────────────────────────────┘
                             │
                             ↓
                    ┌──────────────────┐
                    │  Browse          │
                    │  Marketplace     │
                    └────────┬─────────┘
                             │
                             ↓
                    ┌──────────────────┐
                    │  Search &        │
                    │  Filter          │
                    └────────┬─────────┘
                             │
                             ↓
                    ┌──────────────────┐
                    │  View Details    │
                    │  & Inquire       │
                    └────────┬─────────┘
                             │
                             ↓
                    ┌──────────────────┐
                    │  Purchase        │
                    │  (Future)        │
                    └──────────────────┘
```

---

## Backend Setup

### 1. Install Dependencies

The required dependencies are already in `package.json`:

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "express-validator": "^7.2.1",
    "mongoose": "^7.5.0",
    "jsonwebtoken": "^9.0.2",
    "axios": "^1.12.2"
  }
}
```

Install them:

```bash
cd backend/crop-service
npm install
```

### 2. File Structure

The implementation includes these new files:

```
backend/crop-service/
├── models/
│   └── MarketplaceListing.js          # New marketplace listing model
├── controllers/
│   ├── farmerMarketplaceController.js # Farmer marketplace operations
│   └── buyerMarketplaceController.js  # Buyer marketplace operations
├── routes/
│   ├── farmerMarketplaceRoutes.js     # Farmer API routes
│   └── buyerMarketplaceRoutes.js      # Buyer API routes
└── server.js                           # Updated with new routes
```

### 3. Update Server Configuration

The `server.js` has been updated to include:

```javascript
// Import routes
const farmerMarketplaceRoutes = require('./routes/farmerMarketplaceRoutes');
const buyerMarketplaceRoutes = require('./routes/buyerMarketplaceRoutes');

// Register routes
app.use('/api/farmer/marketplace', farmerMarketplaceRoutes);
app.use('/api/buyer/marketplace', buyerMarketplaceRoutes);
```

### 4. Environment Variables

Ensure your `.env` file includes:

```env
PORT=3005
MONGODB_URI=mongodb://localhost:27017/crop-service
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

---

## Database Schema

### MarketplaceListing Model

The `MarketplaceListing` model includes:

**Core Fields:**
- `crop` - Reference to Crop model
- `farmer` - Farmer ID
- `cropName`, `variety`, `scientificName` - Crop details

**Quantity:**
- `available` - Available quantity
- `unit` - Unit of measurement (kg, ton, quintal)
- `reserved` - Reserved quantity

**Pricing:**
- `pricePerUnit` - Price per unit
- `currency` - Currency (default: INR)
- `negotiable` - Whether price is negotiable
- `minimumOrderQuantity` - Minimum order quantity

**Harvest Info:**
- `expectedHarvestDate` - Expected harvest date
- `actualHarvestDate` - Actual harvest date
- `harvestStatus` - ready, in_progress, completed

**Quality:**
- `grade` - A, B, C, Premium, Standard
- `isOrganic` - Boolean
- `certifications` - Array of certifications
- `healthStatus` - excellent, good, fair

**Farm Info:**
- `fieldId` - Reference to field
- `location` - GeoJSON Point with coordinates
- `soilType` - Soil type
- `irrigationMethod` - Irrigation method

**Additional:**
- `description` - Product description
- `images` - Array of image objects
- `status` - active, inactive, sold_out, expired
- `visibility` - public, private, verified_buyers_only
- `statistics` - views, inquiries, orders
- `expiresAt` - Expiration date

**Indexes:**
- Farmer + status
- Text search on cropName, variety, description
- Geospatial index on location
- Status + expiresAt
- Expected harvest date
- Organic flag

---

## API Endpoints

### Farmer Endpoints

Base URL: `/api/farmer/marketplace`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/listings` | Create listing | Required |
| GET | `/listings` | Get my listings | Required |
| GET | `/listings/:id` | Get single listing | Required |
| PUT | `/listings/:id` | Update listing | Required |
| DELETE | `/listings/:id` | Deactivate listing | Required |
| POST | `/listings/:id/reactivate` | Reactivate listing | Required |
| GET | `/ready-crops` | Get ready crops | Required |
| GET | `/statistics` | Get statistics | Required |

### Buyer Endpoints

Base URL: `/api/buyer/marketplace`

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/listings` | Get all listings | Public |
| GET | `/listings/:id` | Get single listing | Public |
| GET | `/listings/nearby` | Get nearby listings | Public |
| GET | `/listings/crop/:cropName` | Get by crop name | Public |
| GET | `/listings/organic` | Get organic listings | Public |
| GET | `/listings/featured` | Get featured listings | Public |
| GET | `/crops` | Get available crops | Public |
| GET | `/varieties` | Get varieties | Public |
| GET | `/statistics` | Get statistics | Public |
| POST | `/listings/:id/inquiry` | Record inquiry | Required |

---

## Frontend Integration

### 1. Create Marketplace Service

Create `frontend/src/services/farmerMarketplaceService.ts`:

```typescript
import api from './api';

export interface CreateListingData {
  cropId: string;
  quantity: number;
  pricePerUnit: number;
  negotiable?: boolean;
  minimumOrderQuantity?: number;
  grade?: string;
  isOrganic?: boolean;
  certifications?: string[];
  description?: string;
  images?: Array<{
    url: string;
    caption?: string;
    isPrimary?: boolean;
  }>;
  visibility?: string;
  expiresInDays?: number;
}

class FarmerMarketplaceService {
  async createListing(data: CreateListingData) {
    const response = await api.post('/farmer/marketplace/listings', data);
    return response.data;
  }

  async getMyListings(params?: {
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const queryString = new URLSearchParams(params as any).toString();
    const response = await api.get(`/farmer/marketplace/listings?${queryString}`);
    return response.data;
  }

  async getListing(id: string) {
    const response = await api.get(`/farmer/marketplace/listings/${id}`);
    return response.data;
  }

  async updateListing(id: string, data: Partial<CreateListingData>) {
    const response = await api.put(`/farmer/marketplace/listings/${id}`, data);
    return response.data;
  }

  async deactivateListing(id: string) {
    const response = await api.delete(`/farmer/marketplace/listings/${id}`);
    return response.data;
  }

  async reactivateListing(id: string) {
    const response = await api.post(`/farmer/marketplace/listings/${id}/reactivate`);
    return response.data;
  }

  async getReadyCrops() {
    const response = await api.get('/farmer/marketplace/ready-crops');
    return response.data;
  }

  async getStatistics() {
    const response = await api.get('/farmer/marketplace/statistics');
    return response.data;
  }
}

export default new FarmerMarketplaceService();
```

Create `frontend/src/services/buyerMarketplaceService.ts`:

```typescript
import api from './api';

class BuyerMarketplaceService {
  async getAllListings(params?: {
    search?: string;
    cropName?: string;
    isOrganic?: boolean;
    grade?: string;
    minPrice?: number;
    maxPrice?: number;
    minQuantity?: number;
    harvestStatus?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: number;
    limit?: number;
  }) {
    const queryString = new URLSearchParams(params as any).toString();
    const response = await api.get(`/buyer/marketplace/listings?${queryString}`);
    return response.data;
  }

  async getListing(id: string) {
    const response = await api.get(`/buyer/marketplace/listings/${id}`);
    return response.data;
  }

  async getNearbyListings(longitude: number, latitude: number, maxDistance?: number) {
    const params = new URLSearchParams({
      longitude: longitude.toString(),
      latitude: latitude.toString(),
      ...(maxDistance && { maxDistance: maxDistance.toString() })
    });
    const response = await api.get(`/buyer/marketplace/listings/nearby?${params}`);
    return response.data;
  }

  async getListingsByCrop(cropName: string, sortBy?: string, sortOrder?: string) {
    const params = new URLSearchParams({
      ...(sortBy && { sortBy }),
      ...(sortOrder && { sortOrder })
    });
    const response = await api.get(`/buyer/marketplace/listings/crop/${cropName}?${params}`);
    return response.data;
  }

  async getOrganicListings() {
    const response = await api.get('/buyer/marketplace/listings/organic');
    return response.data;
  }

  async getFeaturedListings() {
    const response = await api.get('/buyer/marketplace/listings/featured');
    return response.data;
  }

  async getAvailableCrops() {
    const response = await api.get('/buyer/marketplace/crops');
    return response.data;
  }

  async getStatistics() {
    const response = await api.get('/buyer/marketplace/statistics');
    return response.data;
  }

  async recordInquiry(id: string) {
    const response = await api.post(`/buyer/marketplace/listings/${id}/inquiry`);
    return response.data;
  }
}

export default new BuyerMarketplaceService();
```

### 2. Create Farmer Marketplace Component

Create `frontend/src/pages/farmer/FarmerMarketplace.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Typography,
  Chip,
  IconButton,
  Dialog
} from '@mui/material';
import { Add, Edit, Visibility, Delete } from '@mui/icons-material';
import farmerMarketplaceService from '../../services/farmerMarketplaceService';

const FarmerMarketplace: React.FC = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    try {
      setLoading(true);
      const response = await farmerMarketplaceService.getMyListings();
      setListings(response.data.listings);
    } catch (error) {
      console.error('Error loading listings:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">My Marketplace Listings</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Listing
        </Button>
      </Box>

      <Grid container spacing={3}>
        {listings.map((listing: any) => (
          <Grid item xs={12} md={6} lg={4} key={listing._id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{listing.cropName}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {listing.variety}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Chip
                    label={listing.status}
                    color={listing.status === 'active' ? 'success' : 'default'}
                    size="small"
                  />
                  {listing.quality.isOrganic && (
                    <Chip label="Organic" color="success" size="small" sx={{ ml: 1 }} />
                  )}
                </Box>
                <Typography variant="h6" sx={{ mt: 2 }}>
                  ₹{listing.pricing.pricePerUnit}/{listing.quantity.unit}
                </Typography>
                <Typography variant="body2">
                  Available: {listing.quantity.available} {listing.quantity.unit}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption">
                    Views: {listing.statistics.views} | 
                    Inquiries: {listing.statistics.inquiries}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default FarmerMarketplace;
```

### 3. Create Buyer Marketplace Component

Create `frontend/src/pages/buyer/BuyerMarketplace.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  Typography,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import buyerMarketplaceService from '../../services/buyerMarketplaceService';

const BuyerMarketplace: React.FC = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOrganic, setFilterOrganic] = useState('');

  useEffect(() => {
    loadListings();
  }, [searchTerm, filterOrganic]);

  const loadListings = async () => {
    try {
      setLoading(true);
      const response = await buyerMarketplaceService.getAllListings({
        search: searchTerm,
        isOrganic: filterOrganic ? filterOrganic === 'true' : undefined
      });
      setListings(response.data.listings);
    } catch (error) {
      console.error('Error loading listings:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Marketplace
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search crops..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Organic</InputLabel>
              <Select
                value={filterOrganic}
                onChange={(e) => setFilterOrganic(e.target.value)}
                label="Organic"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="true">Organic Only</MenuItem>
                <MenuItem value="false">Non-Organic</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={3}>
        {listings.map((listing: any) => (
          <Grid item xs={12} md={6} lg={4} key={listing._id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{listing.cropName}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {listing.variety}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Chip label={listing.quality.grade} size="small" />
                  {listing.quality.isOrganic && (
                    <Chip label="Organic" color="success" size="small" sx={{ ml: 1 }} />
                  )}
                </Box>
                <Typography variant="h6" sx={{ mt: 2 }}>
                  ₹{listing.pricing.pricePerUnit}/{listing.quantity.unit}
                </Typography>
                <Typography variant="body2">
                  Available: {listing.quantity.available} {listing.quantity.unit}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {listing.farmInfo.location.address.district}, {listing.farmInfo.location.address.state}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default BuyerMarketplace;
```

---

## Testing

### 1. Start the Service

```bash
cd backend/crop-service
npm run dev
```

### 2. Test Farmer Endpoints

**Create a Listing:**

```bash
curl -X POST http://localhost:3005/api/farmer/marketplace/listings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cropId": "507f1f77bcf86cd799439011",
    "quantity": 100,
    "pricePerUnit": 250,
    "grade": "Premium",
    "isOrganic": true
  }'
```

**Get My Listings:**

```bash
curl -X GET http://localhost:3005/api/farmer/marketplace/listings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Test Buyer Endpoints

**Get All Listings:**

```bash
curl -X GET "http://localhost:3005/api/buyer/marketplace/listings"
```

**Search Organic Wheat:**

```bash
curl -X GET "http://localhost:3005/api/buyer/marketplace/listings?cropName=wheat&isOrganic=true"
```

**Get Nearby Listings:**

```bash
curl -X GET "http://localhost:3005/api/buyer/marketplace/listings/nearby?longitude=77.5946&latitude=12.9716"
```

---

## Deployment

### 1. Environment Setup

Production `.env`:

```env
PORT=3005
MONGODB_URI=mongodb://production-host:27017/crop-service
JWT_SECRET=your_production_secret
NODE_ENV=production
```

### 2. Database Indexes

Ensure indexes are created:

```javascript
// Run this in MongoDB shell or through migration
db.marketplacelistings.createIndex({ farmer: 1, status: 1 });
db.marketplacelistings.createIndex({ cropName: "text", variety: "text", description: "text" });
db.marketplacelistings.createIndex({ "farmInfo.location": "2dsphere" });
db.marketplacelistings.createIndex({ status: 1, expiresAt: 1 });
```

### 3. Start Production Server

```bash
npm start
```

---

## Summary

✅ **Backend Implementation Complete**
- MarketplaceListing model with comprehensive fields
- Farmer marketplace controller with CRUD operations
- Buyer marketplace controller with search and filters
- Routes with validation
- Server configuration updated

✅ **API Endpoints Ready**
- 8 farmer endpoints for listing management
- 10 buyer endpoints for browsing and searching
- Authentication and authorization implemented
- Validation and error handling included

✅ **Documentation Complete**
- Farmer API documentation
- Buyer API documentation
- Implementation guide
- Testing instructions

✅ **Ready for Frontend Integration**
- Service layer examples provided
- Component examples included
- TypeScript interfaces defined

---

## Next Steps

1. Test all endpoints
2. Implement frontend components
3. Add payment integration (future)
4. Implement order management (future)
5. Add notifications (future)
6. Deploy to production