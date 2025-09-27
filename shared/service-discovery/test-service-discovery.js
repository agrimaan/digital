/**
 * Test script for service discovery
 * 
 * This script tests the service discovery functionality.
 */

const ServiceDiscovery = require('./service-discovery');

async function testServiceDiscovery() {
  const discovery = new ServiceDiscovery();
  
  try {
    console.log('Testing service discovery...');
    
    // Test discovering user service
    try {
      const userServiceUrl = await discovery.getServiceUrl('user-service');
      console.log('✅ User Service URL:', userServiceUrl);
    } catch (error) {
      console.log('❌ User Service not found:', error.message);
    }
    
    // Test discovering field service
    try {
      const fieldServiceUrl = await discovery.getServiceUrl('field-service');
      console.log('✅ Field Service URL:', fieldServiceUrl);
    } catch (error) {
      console.log('❌ Field Service not found:', error.message);
    }
    
    // Test non-existent service
    try {
      const nonExistentUrl = await discovery.getServiceUrl('non-existent-service');
      console.log('❌ Non-existent Service URL (should not reach here):', nonExistentUrl);
    } catch (error) {
      console.log('✅ Expected error for non-existent service:', error.message);
    }
    
    console.log('Service discovery test completed');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testServiceDiscovery();