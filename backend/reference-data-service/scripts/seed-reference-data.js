/**
 * Seed Script for Reference Data Service
 * 
 * This script seeds reference data including:
 * - Crop types
 * - Sensor types
 * - Order statuses
 * - User roles
 * - Field types
 * - Measurement units
 */

const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27018/agrimaan-reference-data';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connected for seeding reference data');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Define reference data schema
const referenceDataSchema = new mongoose.Schema({
  category: { type: String, required: true, index: true },
  code: { type: String, required: true },
  name: { type: String, required: true },
  description: String,
  metadata: mongoose.Schema.Types.Mixed,
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 }
}, { timestamps: true });

referenceDataSchema.index({ category: 1, code: 1 }, { unique: true });

const ReferenceData = mongoose.model('ReferenceData', referenceDataSchema);

// Reference data to seed
const referenceDataSets = {
  cropTypes: [
    { code: 'WHEAT', name: 'Wheat', description: 'Cereal grain crop', metadata: { season: 'winter', growthPeriod: 120 } },
    { code: 'RICE', name: 'Rice', description: 'Staple food crop', metadata: { season: 'summer', growthPeriod: 150 } },
    { code: 'CORN', name: 'Corn/Maize', description: 'Versatile grain crop', metadata: { season: 'summer', growthPeriod: 90 } },
    { code: 'SOYBEAN', name: 'Soybean', description: 'Legume crop', metadata: { season: 'summer', growthPeriod: 100 } },
    { code: 'COTTON', name: 'Cotton', description: 'Fiber crop', metadata: { season: 'summer', growthPeriod: 180 } },
    { code: 'SUGARCANE', name: 'Sugarcane', description: 'Sugar crop', metadata: { season: 'year-round', growthPeriod: 365 } },
    { code: 'POTATO', name: 'Potato', description: 'Tuber crop', metadata: { season: 'winter', growthPeriod: 90 } },
    { code: 'TOMATO', name: 'Tomato', description: 'Vegetable crop', metadata: { season: 'summer', growthPeriod: 75 } },
    { code: 'ONION', name: 'Onion', description: 'Bulb vegetable', metadata: { season: 'winter', growthPeriod: 120 } },
    { code: 'CABBAGE', name: 'Cabbage', description: 'Leafy vegetable', metadata: { season: 'winter', growthPeriod: 90 } }
  ],
  
  sensorTypes: [
    { code: 'SOIL_MOISTURE', name: 'Soil Moisture Sensor', description: 'Measures soil water content', metadata: { unit: 'percentage', range: '0-100' } },
    { code: 'SOIL_TEMP', name: 'Soil Temperature Sensor', description: 'Measures soil temperature', metadata: { unit: 'celsius', range: '-20-60' } },
    { code: 'AIR_TEMP', name: 'Air Temperature Sensor', description: 'Measures ambient temperature', metadata: { unit: 'celsius', range: '-40-80' } },
    { code: 'HUMIDITY', name: 'Humidity Sensor', description: 'Measures air humidity', metadata: { unit: 'percentage', range: '0-100' } },
    { code: 'PH', name: 'pH Sensor', description: 'Measures soil pH level', metadata: { unit: 'pH', range: '0-14' } },
    { code: 'NPK', name: 'NPK Sensor', description: 'Measures nitrogen, phosphorus, potassium', metadata: { unit: 'ppm', range: '0-2000' } },
    { code: 'LIGHT', name: 'Light Sensor', description: 'Measures light intensity', metadata: { unit: 'lux', range: '0-100000' } },
    { code: 'RAIN', name: 'Rain Gauge', description: 'Measures rainfall', metadata: { unit: 'mm', range: '0-500' } }
  ],
  
  orderStatuses: [
    { code: 'PENDING', name: 'Pending', description: 'Order placed, awaiting confirmation', sortOrder: 1 },
    { code: 'CONFIRMED', name: 'Confirmed', description: 'Order confirmed by seller', sortOrder: 2 },
    { code: 'PROCESSING', name: 'Processing', description: 'Order being prepared', sortOrder: 3 },
    { code: 'SHIPPED', name: 'Shipped', description: 'Order dispatched for delivery', sortOrder: 4 },
    { code: 'DELIVERED', name: 'Delivered', description: 'Order delivered to buyer', sortOrder: 5 },
    { code: 'COMPLETED', name: 'Completed', description: 'Order completed successfully', sortOrder: 6 },
    { code: 'CANCELLED', name: 'Cancelled', description: 'Order cancelled', sortOrder: 7 },
    { code: 'REFUNDED', name: 'Refunded', description: 'Order refunded', sortOrder: 8 }
  ],
  
  userRoles: [
    { code: 'FARMER', name: 'Farmer', description: 'Agricultural producer', metadata: { permissions: ['fields', 'crops', 'sensors', 'marketplace'] } },
    { code: 'BUYER', name: 'Buyer', description: 'Agricultural product buyer', metadata: { permissions: ['marketplace', 'orders'] } },
    { code: 'AGRONOMIST', name: 'Agronomist', description: 'Agricultural expert/consultant', metadata: { permissions: ['fields', 'crops', 'analytics', 'consultations'] } },
    { code: 'INVESTOR', name: 'Investor', description: 'Agricultural investor', metadata: { permissions: ['investments', 'analytics', 'blockchain'] } },
    { code: 'ADMIN', name: 'Administrator', description: 'System administrator', metadata: { permissions: ['all'] } },
    { code: 'SUPER_ADMIN', name: 'Super Administrator', description: 'Super administrator with full access', metadata: { permissions: ['all'] } }
  ],
  
  fieldTypes: [
    { code: 'IRRIGATED', name: 'Irrigated Land', description: 'Land with irrigation facilities' },
    { code: 'RAINFED', name: 'Rainfed Land', description: 'Land dependent on rainfall' },
    { code: 'GREENHOUSE', name: 'Greenhouse', description: 'Controlled environment agriculture' },
    { code: 'ORGANIC', name: 'Organic Farm', description: 'Certified organic farming land' },
    { code: 'MIXED', name: 'Mixed Farming', description: 'Multiple crop types' }
  ],
  
  measurementUnits: [
    { code: 'HECTARE', name: 'Hectare', description: 'Area measurement', metadata: { type: 'area', symbol: 'ha' } },
    { code: 'ACRE', name: 'Acre', description: 'Area measurement', metadata: { type: 'area', symbol: 'ac' } },
    { code: 'SQ_METER', name: 'Square Meter', description: 'Area measurement', metadata: { type: 'area', symbol: 'm²' } },
    { code: 'KILOGRAM', name: 'Kilogram', description: 'Weight measurement', metadata: { type: 'weight', symbol: 'kg' } },
    { code: 'QUINTAL', name: 'Quintal', description: 'Weight measurement', metadata: { type: 'weight', symbol: 'q' } },
    { code: 'TON', name: 'Metric Ton', description: 'Weight measurement', metadata: { type: 'weight', symbol: 't' } },
    { code: 'CELSIUS', name: 'Celsius', description: 'Temperature measurement', metadata: { type: 'temperature', symbol: '°C' } },
    { code: 'FAHRENHEIT', name: 'Fahrenheit', description: 'Temperature measurement', metadata: { type: 'temperature', symbol: '°F' } }
  ],
  
  cropStatuses: [
    { code: 'PLANNED', name: 'Planned', description: 'Crop planning stage', sortOrder: 1 },
    { code: 'PLANTED', name: 'Planted', description: 'Seeds/seedlings planted', sortOrder: 2 },
    { code: 'GROWING', name: 'Growing', description: 'Active growth phase', sortOrder: 3 },
    { code: 'FLOWERING', name: 'Flowering', description: 'Flowering stage', sortOrder: 4 },
    { code: 'MATURING', name: 'Maturing', description: 'Maturation phase', sortOrder: 5 },
    { code: 'READY', name: 'Ready for Harvest', description: 'Ready to harvest', sortOrder: 6 },
    { code: 'HARVESTING', name: 'Harvesting', description: 'Harvest in progress', sortOrder: 7 },
    { code: 'HARVESTED', name: 'Harvested', description: 'Harvest completed', sortOrder: 8 },
    { code: 'FAILED', name: 'Failed', description: 'Crop failed', sortOrder: 9 }
  ],
  
  paymentMethods: [
    { code: 'CASH', name: 'Cash', description: 'Cash payment' },
    { code: 'CARD', name: 'Credit/Debit Card', description: 'Card payment' },
    { code: 'UPI', name: 'UPI', description: 'Unified Payments Interface' },
    { code: 'BANK_TRANSFER', name: 'Bank Transfer', description: 'Direct bank transfer' },
    { code: 'WALLET', name: 'Digital Wallet', description: 'Digital wallet payment' },
    { code: 'CRYPTO', name: 'Cryptocurrency', description: 'Blockchain payment' }
  ]
};

// Seed function
const seedReferenceData = async () => {
  try {
    console.log('🚀 Starting reference data seeding...\n');
    
    await connectDB();
    
    for (const [category, items] of Object.entries(referenceDataSets)) {
      console.log(`🌱 Seeding ${category}...`);
      
      for (const item of items) {
        try {
          await ReferenceData.findOneAndUpdate(
            { category, code: item.code },
            { 
              category,
              ...item,
              isActive: true
            },
            { upsert: true, new: true }
          );
        } catch (error) {
          console.error(`  ❌ Error seeding ${item.code}:`, error.message);
        }
      }
      
      console.log(`  ✅ ${items.length} items seeded for ${category}`);
    }
    
    console.log('\n✅ Reference data seeding completed successfully!');
    
    // Print summary
    const totalCount = await ReferenceData.countDocuments();
    console.log(`\n📊 Total reference data items: ${totalCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during seeding:', error);
    process.exit(1);
  }
};

// Run seeding
seedReferenceData();