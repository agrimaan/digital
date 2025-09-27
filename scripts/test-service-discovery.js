/**
 * Test Service Discovery
 * 
 * This script tests the service discovery functionality by:
 * 1. Discovering services registered with Consul
 * 2. Testing service URL retrieval
 * 3. Testing service instances retrieval
 */

const ServiceDiscovery = require('../shared/service-discovery');

async function testServiceDiscovery() {
  const discovery = new ServiceDiscovery();
  
  try {
    console.log('Testing service discovery...');
    
    // Test discovering user service
    try {
      console.log('\nTesting user-service discovery:');
      const userServiceUrl = await discovery.getServiceUrl('user-service');
      console.log('✅ User Service URL:', userServiceUrl);
    } catch (error) {
      console.error('❌ User service discovery failed:', error.message);
    }
    
    // Test discovering API gateway
    try {
      console.log('\nTesting api-gateway discovery:');
      const apiGatewayUrl = await discovery.getServiceUrl('api-gateway');
      console.log('✅ API Gateway URL:', apiGatewayUrl);
    } catch (error) {
      console.error('❌ API Gateway discovery failed:', error.message);
    }
    
    // Test getting all instances of a service
    try {
      console.log('\nTesting service instances retrieval:');
      const userServiceInstances = await discovery.getServiceInstances('user-service');
      console.log(`✅ Found ${userServiceInstances.length} instances of user-service:`);
      userServiceInstances.forEach((instance, index) => {
        console.log(`  Instance ${index + 1}:`, instance.url);
      });
    } catch (error) {
      console.error('❌ Service instances retrieval failed:', error.message);
    }
    
    // Test non-existent service
    try {
      console.log('\nTesting non-existent service discovery:');
      const nonExistentUrl = await discovery.getServiceUrl('non-existent-service');
      console.log('❌ Non-existent Service URL (should not reach here):', nonExistentUrl);
    } catch (error) {
      console.log('✅ Expected error for non-existent service:', error.message);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testServiceDiscovery();