# Marketplace Integration Guide

## Overview
This guide explains how to integrate the new marketplace publishing feature for crops into the existing Digital Agriculture Platform.

## Backend Changes

### 1. Crop Service Updates

#### New Files Created:
- `backend/crop-service/controllers/marketplaceController.js` - Handles marketplace publishing logic
- `backend/crop-service/routes/marketplaceRoutes.js` - Defines marketplace-related routes

#### Modified Files:
- `backend/crop-service/server.js` - Added marketplace routes
- `backend/crop-service/models/Crop.js` - Added `marketplaceListing` field to track published crops

#### New API Endpoints:

**1. Publish Crop to Marketplace**
```
POST /api/crops/:id/publish
Authorization: Bearer <token>
Body: {
  "pricePerUnit": 250,
  "quantity": 100,
  "description": "Fresh wheat, premium quality",
  "images": ["https://example.com/image1.jpg"],
  "isOrganic": false,
  "certifications": ["Organic India"]
}
```

**Requirements:**
- Crop must be in 'harvested' or 'maturity' stage
- Crop must have actualYield recorded
- Quantity cannot exceed actualYield
- Price per unit must be positive

**Response:**
```json
{
  "success": true,
  "data": {
    "crop": { ... },
    "marketplaceProduct": { ... }
  },
  "message": "Crop published to marketplace successfully"
}
```

**2. Get Marketplace Listings**
```
GET /api/crops/marketplace/listings
Authorization: Bearer <token>
```

Returns all active marketplace listings for the authenticated farmer.

**3. Unlist Crop from Marketplace**
```
DELETE /api/crops/:id/marketplace
Authorization: Bearer <token>
```

Removes the crop from marketplace and marks it as unlisted.

### 2. Crop Model Schema Update

Added new field to Crop model:
```javascript
marketplaceListing: {
  productId: String,        // Product ID from marketplace-service
  listedDate: Date,         // When it was listed
  unlistedDate: Date,       // When it was unlisted
  quantity: Number,         // Quantity listed
  pricePerUnit: Number,     // Price per unit
  status: {
    type: String,
    enum: ['active', 'unlisted', 'sold'],
    default: 'active'
  }
}
```

### 3. Environment Variables Required

Add to `backend/crop-service/.env`:
```
MARKETPLACE_SERVICE_URL=http://localhost:3006
USER_SERVICE_URL=http://localhost:3001
```

## Frontend Changes

### 1. New Service Created

**File:** `frontend/src/services/marketplaceService.ts`

Provides methods to:
- Publish crops to marketplace
- Get marketplace listings
- Unlist crops
- Fetch marketplace products
- Search and filter products

### 2. New Components Created

**File:** `frontend/src/components/PublishCropDialog.tsx`

A dialog component that allows farmers to:
- Set price per unit
- Specify quantity to list
- Add description
- Mark as organic
- Add certifications
- Add product images
- Preview total value

### 3. Updated Components

**File:** `frontend/src/pages/buyer/BuyerMarketplace_Updated.tsx`

Updated buyer marketplace to:
- Fetch real products from API instead of mock data
- Display actual crop information
- Show proper location and quality data
- Handle loading and error states
- Support filtering and searching

## Integration Steps

### Step 1: Update Crop Service

1. Copy the new controller and routes files to crop-service
2. Update server.js to include marketplace routes
3. Update Crop model with marketplaceListing field
4. Install axios if not already installed:
   ```bash
   cd backend/crop-service
   npm install axios
   ```

### Step 2: Update Frontend

1. Copy `marketplaceService.ts` to `frontend/src/services/`
2. Copy `PublishCropDialog.tsx` to `frontend/src/components/`
3. Replace `BuyerMarketplace.tsx` with `BuyerMarketplace_Updated.tsx`

### Step 3: Update CropManagement Component

Add the publish functionality to the CropManagement component:

```tsx
import PublishCropDialog from '../../components/PublishCropDialog';

// Add state
const [publishDialogOpen, setPublishDialogOpen] = useState(false);
const [cropToPublish, setCropToPublish] = useState<Crop | null>(null);

// Add handler
const handlePublishClick = (crop: Crop) => {
  if (!['harvested', 'maturity'].includes(crop.growthStage || '')) {
    alert('Crop must be in harvested or maturity stage to publish');
    return;
  }
  if (!crop.actualYield || crop.actualYield <= 0) {
    alert('Please record actual yield before publishing');
    return;
  }
  setCropToPublish(crop);
  setPublishDialogOpen(true);
};

// Add button in table actions
<Tooltip title="Publish to Marketplace">
  <IconButton 
    onClick={() => handlePublishClick(c)}
    disabled={!['harvested', 'maturity'].includes(c.growthStage || '')}
  >
    <CloudUploadIcon />
  </IconButton>
</Tooltip>

// Add dialog
<PublishCropDialog
  open={publishDialogOpen}
  onClose={() => setPublishDialogOpen(false)}
  crop={cropToPublish}
  onSuccess={() => {
    dispatch(getCrops());
    setPublishDialogOpen(false);
  }}
/>
```

### Step 4: Update API Configuration

Ensure the frontend API service routes to the correct backend:

In `frontend/src/services/api.ts`, the base URL should point to your API gateway or crop service:
```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3005';
```

For marketplace endpoints, you may need to add a separate configuration:
```typescript
const MARKETPLACE_API_URL = process.env.REACT_APP_MARKETPLACE_URL || 'http://localhost:3006';
```

## Testing

### 1. Test Crop Publishing

1. Create a crop in the system
2. Update its growth stage to 'harvested'
3. Record actual yield
4. Click "Publish to Marketplace"
5. Fill in price, quantity, and other details
6. Submit

Expected: Crop should appear in marketplace with all details

### 2. Test Buyer Marketplace

1. Navigate to buyer marketplace
2. Verify products are loaded from API
3. Test search functionality
4. Test category and quality filters
5. Test add to cart and purchase

### 3. Test Unlisting

1. Go to farmer's marketplace listings
2. Click unlist on a product
3. Verify it no longer appears in buyer marketplace

## API Flow Diagram

```
Farmer Dashboard
    ↓
[Publish Crop Button]
    ↓
PublishCropDialog
    ↓
marketplaceService.publishCrop()
    ↓
POST /api/crops/:id/publish (Crop Service)
    ↓
Validates crop status & yield
    ↓
POST /api/marketplace/products (Marketplace Service)
    ↓
Creates product in marketplace
    ↓
Updates crop with marketplaceListing info
    ↓
Returns success response
    ↓
Buyer Marketplace displays product
```

## Error Handling

The system handles various error scenarios:

1. **Crop not in correct stage**: Returns 400 with message
2. **No actual yield recorded**: Returns 400 with message
3. **Quantity exceeds yield**: Returns 400 with message
4. **Invalid price**: Returns 400 with message
5. **Marketplace service unavailable**: Returns 500 with error details
6. **Authentication failure**: Returns 401

## Security Considerations

1. All endpoints require authentication
2. Farmers can only publish their own crops
3. Quantity validation prevents overselling
4. Price validation prevents negative or zero prices
5. Crop ownership is verified before publishing

## Future Enhancements

1. **Image Upload**: Add file upload functionality for product images
2. **Bulk Publishing**: Allow publishing multiple crops at once
3. **Price Suggestions**: AI-based price recommendations
4. **Inventory Sync**: Automatic quantity updates when orders are placed
5. **Analytics**: Track views, clicks, and sales for published crops
6. **Notifications**: Alert farmers when their crops are purchased
7. **Reviews**: Allow buyers to review purchased crops
8. **Bidding System**: Enable auction-style selling

## Troubleshooting

### Issue: "Crop must be in harvested stage"
**Solution**: Update the crop's growth stage to 'harvested' or 'maturity' before publishing

### Issue: "Marketplace service unavailable"
**Solution**: Ensure marketplace-service is running on the configured port

### Issue: "Products not showing in buyer marketplace"
**Solution**: Check that products have `isActive: true` and verify API endpoint is correct

### Issue: "Cannot publish crop"
**Solution**: Verify actualYield is recorded and greater than 0

## Support

For issues or questions:
1. Check the error messages in browser console
2. Review backend logs for detailed error information
3. Verify all services are running
4. Check environment variables are correctly set