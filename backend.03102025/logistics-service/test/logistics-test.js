const axios = require('axios');

const BASE_URL = 'http://localhost:3007/api';

// Test data
const testVehicle = {
  registrationNumber: 'TEST1234',
  type: 'truck',
  make: 'TestMake',
  model: 'TestModel',
  year: 2022,
  capacity: {
    maxWeight: 5000,
    maxVolume: 15,
    dimensions: { length: 12, width: 6, height: 5 }
  },
  fuelType: 'diesel',
  currentLocation: {
    latitude: 28.6139,
    longitude: 77.2090,
    address: 'Test Location'
  },
  driver: {
    name: 'Test Driver',
    phone: '+1234567890',
    email: 'driver@test.com',
    licenseNumber: 'TEST123'
  },
  owner: {
    name: 'Test Owner',
    phone: '+9876543210',
    email: 'owner@test.com',
    company: 'Test Transport'
  }
};

const testShipment = {
  orderId: 'ORD123456',
  farmerId: 'user123',
  buyerId: 'user456',
  pickupLocation: {
    address: '123 Farm Road, Village',
    coordinates: { latitude: 28.6139, longitude: 77.2090 }
  },
  deliveryLocation: {
    address: '456 Market Street, City',
    coordinates: { latitude: 28.7041, longitude: 77.1025 }
  },
  items: [
    {
      cropId: 'tomato123',
      cropName: 'Organic Tomatoes',
      quantity: 100,
      unit: 'kg',
      price: 2.5
    }
  ],
  totalWeight: 100,
  totalValue: 250,
  estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
};

// Test functions
async function testLogisticsService() {
  console.log('🚀 Testing Logistics Service...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const health = await axios.get(`${BASE_URL.replace('/api', '')}/health`);
    console.log('✅ Health check:', health.data);

    // Test vehicle creation
    console.log('\n2. Testing vehicle creation...');
    const vehicleRes = await axios.post(`${BASE_URL}/vehicles`, testVehicle);
    const vehicle = vehicleRes.data.data;
    console.log('✅ Vehicle created:', vehicle.vehicleId);

    // Test shipment creation
    console.log('\n3. Testing shipment creation...');
    const shipmentRes = await axios.post(`${BASE_URL}/shipments`, testShipment);
    const shipment = shipmentRes.data.data;
    console.log('✅ Shipment created:', shipment.shipmentId);

    // Test vehicle assignment
    console.log('\n4. Testing vehicle assignment...');
    const assignRes = await axios.patch(
      `${BASE_URL}/shipments/${shipment._id}/assign-vehicle`,
      {
        vehicleId: vehicle._id,
        driver: {
          name: 'Assigned Driver',
          phone: '+1112223333',
          licenseNumber: 'ASSIGNED123'
        }
      }
    );
    console.log('✅ Vehicle assigned:', assignRes.data.message);

    // Test status update
    console.log('\n5. Testing status update...');
    const statusRes = await axios.patch(
      `${BASE_URL}/shipments/${shipment._id}/status`,
      {
        status: 'confirmed',
        location: 'Pickup location',
        notes: 'Shipment confirmed and ready for pickup'
      }
    );
    console.log('✅ Status updated:', statusRes.data.message);

    // Test getting all shipments
    console.log('\n6. Testing get all shipments...');
    const shipments = await axios.get(`${BASE_URL}/shipments`);
    console.log('✅ Total shipments:', shipments.data.pagination.total);

    // Test getting all vehicles
    console.log('\n7. Testing get all vehicles...');
    const vehicles = await axios.get(`${BASE_URL}/vehicles`);
    console.log('✅ Total vehicles:', vehicles.data.pagination.total);

    // Test getting available vehicles
    console.log('\n8. Testing get available vehicles...');
    const availableVehicles = await axios.get(`${BASE_URL}/vehicles/available`);
    console.log('✅ Available vehicles:', availableVehicles.data.count);

    // Test location-based queries
    console.log('\n9. Testing location-based vehicles...');
    const locationVehicles = await axios.get(
      `${BASE_URL}/vehicles/location?lat=28.6139&lng=77.2090&radius=10`
    );
    console.log('✅ Vehicles near location:', locationVehicles.data.count);

    console.log('\n🎉 All tests passed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Vehicle ID: ${vehicle.vehicleId}`);
    console.log(`- Shipment ID: ${shipment.shipmentId}`);
    console.log(`- API endpoints: ${BASE_URL}/shipments and ${BASE_URL}/vehicles`);

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testLogisticsService();
}

module.exports = { testLogisticsService };