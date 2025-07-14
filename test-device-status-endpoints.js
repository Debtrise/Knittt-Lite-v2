const axios = require('axios');

const API_BASE_URL = 'http://34.122.156.88:3001/api';

// Test credentials
const TEST_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

async function testDeviceStatusEndpoints() {
  try {
    console.log('🧪 Testing Device Status Endpoints');
    console.log(`📍 API Base URL: ${API_BASE_URL}`);
    
    // Step 1: Login
    console.log('\n1️⃣ Logging in...');
    const loginResponse = await axios.post(`${API_BASE_URL}/login`, TEST_CREDENTIALS);
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Step 2: Test refresh device statuses endpoint
    console.log('\n2️⃣ Testing refresh device statuses...');
    console.log('🔄 POST /optisigns/devices/refresh-status');
    
    try {
      const refreshResponse = await axios.post(
        `${API_BASE_URL}/optisigns/devices/refresh-status`,
        {},
        { headers }
      );
      
      console.log('✅ Refresh device statuses successful');
      console.log('📊 Response:', JSON.stringify(refreshResponse.data, null, 2));
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ Refresh failed: ${error.response.status} - ${error.response.statusText}`);
        console.log('📊 Error data:', error.response.data);
      } else {
        console.log('❌ Refresh failed:', error.message);
      }
    }
    
    // Step 3: Test live device status endpoint
    console.log('\n3️⃣ Testing live device status...');
    console.log('📡 GET /optisigns/devices/live-status');
    
    try {
      const liveStatusResponse = await axios.get(
        `${API_BASE_URL}/optisigns/devices/live-status`,
        { headers }
      );
      
      console.log('✅ Live device status successful');
      console.log('📊 Response:', JSON.stringify(liveStatusResponse.data, null, 2));
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ Live status failed: ${error.response.status} - ${error.response.statusText}`);
        console.log('📊 Error data:', error.response.data);
      } else {
        console.log('❌ Live status failed:', error.message);
      }
    }
    
    // Step 4: Test existing displays endpoint for comparison
    console.log('\n4️⃣ Testing existing displays endpoint for comparison...');
    console.log('📋 GET /optisigns/displays');
    
    try {
      const displaysResponse = await axios.get(
        `${API_BASE_URL}/optisigns/displays`,
        { headers }
      );
      
      console.log('✅ Displays endpoint successful');
      console.log(`📊 Found ${displaysResponse.data?.length || 0} displays`);
      
      if (displaysResponse.data && displaysResponse.data.length > 0) {
        console.log('📋 Sample display:', JSON.stringify(displaysResponse.data[0], null, 2));
      }
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ Displays failed: ${error.response.status} - ${error.response.statusText}`);
        console.log('📊 Error data:', error.response.data);
      } else {
        console.log('❌ Displays failed:', error.message);
      }
    }
    
    console.log('\n🎉 Device status endpoints test completed');
    console.log('\n📋 Summary:');
    console.log('   ✅ Login authentication works');
    console.log('   📡 POST /optisigns/devices/refresh-status - tested');
    console.log('   📊 GET /optisigns/devices/live-status - tested');
    console.log('   📋 GET /optisigns/displays - tested for comparison');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testDeviceStatusEndpoints(); 