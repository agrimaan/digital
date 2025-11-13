# Quick Start Guide - Marketplace Integration

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js installed
- MongoDB running
- Backend services running (crop-service, marketplace-service)

### Step 1: Install Dependencies (1 minute)

```bash
# Backend
cd backend/crop-service
npm install axios

# Frontend (if needed)
cd frontend
npm install
```

### Step 2: Start Services (1 minute)

```bash
# Terminal 1 - Crop Service
cd backend/crop-service
npm start
# Should run on http://localhost:3005

# Terminal 2 - Marketplace Service
cd backend/marketplace-service
npm start
# Should run on http://localhost:3006

# Terminal 3 - Frontend
cd frontend
npm start
# Should run on http://localhost:3000
```

### Step 3: Test the Integration (3 minutes)

#### A. Create and Publish a Crop

1. **Login as Farmer**
   - Navigate to http://localhost:3000
   - Login with farmer credentials

2. **Create a Crop**
   - Go to Crop Management
   - Click "Add Crop"
   - Fill in details:
     - Name: Wheat
     - Variety: Hard Red Winter
     - Field: Select a field
     - Planted Area: 10 hectares
     - Planting Date: (any past date)
     - Expected Harvest Date: (any future date)
     - Expected Yield: 100
     - Soil Type: Loam
     - Irrigation: Drip
     - Seed Source: Market
   - Click "Add Crop"

3. **Update Crop to Harvested**
   - Find your crop in the list
   - Click "Edit" button
   - Change Growth Stage to "Harvested"
   - Add Actual Yield: 95
   - Click "Save Changes"

4. **Publish to Marketplace**
   - Click the "Publish" button (cloud upload icon)
   - Fill in the dialog:
     - Price Per Unit: 250
     - Quantity: 90
     - Description: Fresh wheat, premium quality
     - Check "Organic" if applicable
   - Click "Publish to Marketplace"
   - You should see success message

#### B. View in Buyer Marketplace

1. **Switch to Buyer View**
   - Logout or open incognito window
   - Login as buyer (or just navigate to marketplace)

2. **Browse Marketplace**
   - Go to Buyer Marketplace
   - You should see your published crop
   - Try searching for "wheat"
   - Try filtering by category

3. **Test Purchase Flow**
   - Click "Buy Now" on your crop
   - Review details in dialog
   - Click "Confirm Purchase"

### Step 4: Verify Everything Works ✅

Check these items:
- [ ] Crop service is running
- [ ] Marketplace service is running
- [ ] Frontend is running
- [ ] Can create a crop
- [ ] Can update crop to harvested
- [ ] Can publish crop to marketplace
- [ ] Crop appears in buyer marketplace
- [ ] Can search and filter products
- [ ] Can add to cart
- [ ] Can purchase product

## 🔧 Troubleshooting

### Issue: Services won't start
**Solution:** Check if ports are already in use
```bash
# Check port usage
lsof -i :3005  # Crop service
lsof -i :3006  # Marketplace service
lsof -i :3000  # Frontend

# Kill process if needed
kill -9 <PID>
```

### Issue: "Crop must be in harvested stage"
**Solution:** Edit the crop and set Growth Stage to "Harvested"

### Issue: "Please record actual yield"
**Solution:** Edit the crop and add a value for Actual Yield

### Issue: Products not showing in marketplace
**Solution:** 
1. Check browser console for errors
2. Verify API endpoint in marketplaceService.ts
3. Check backend logs
4. Verify MongoDB is running

### Issue: Authentication errors
**Solution:**
1. Clear browser localStorage
2. Login again
3. Check JWT token is being sent in requests

## 📚 Next Steps

1. **Integrate into CropManagement UI**
   - Follow `CROP_MANAGEMENT_INTEGRATION.md`
   - Add publish button to crop list
   - Add PublishCropDialog component

2. **Customize for Your Needs**
   - Update default images
   - Adjust validation rules
   - Add custom fields
   - Modify UI styling

3. **Deploy to Production**
   - Set environment variables
   - Configure database connections
   - Set up SSL certificates
   - Configure CORS settings

## 🎯 Key Files

### Backend
- `backend/crop-service/controllers/marketplaceController.js`
- `backend/crop-service/routes/marketplaceRoutes.js`
- `backend/crop-service/models/Crop.js`

### Frontend
- `frontend/src/services/marketplaceService.ts`
- `frontend/src/components/PublishCropDialog.tsx`
- `frontend/src/pages/buyer/BuyerMarketplace_Updated.tsx`

### Documentation
- `MARKETPLACE_INTEGRATION_GUIDE.md` - Complete guide
- `MARKETPLACE_IMPLEMENTATION_SUMMARY.md` - Technical details
- `CROP_MANAGEMENT_INTEGRATION.md` - UI integration
- `IMPLEMENTATION_COMPLETE.md` - Project status

## 💡 Tips

1. **Use Real Data:** Always test with realistic crop data
2. **Check Logs:** Backend logs show detailed error messages
3. **Browser DevTools:** Use Network tab to debug API calls
4. **Database:** Use MongoDB Compass to view data directly
5. **Postman:** Test API endpoints independently

## 🆘 Need Help?

1. Check the documentation files
2. Review error messages in console
3. Check backend logs
4. Verify all services are running
5. Ensure MongoDB is accessible

## ✅ Success!

If you can:
- Create a crop
- Publish it to marketplace
- See it in buyer marketplace
- Search and filter products

**Congratulations! The integration is working! 🎉**

---

**Total Time:** ~5 minutes  
**Difficulty:** Easy  
**Status:** Ready to use