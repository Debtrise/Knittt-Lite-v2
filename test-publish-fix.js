const axios = require('axios');

const API_BASE_URL = 'http://34.122.156.88:3001/api';

// Test credentials (replace with actual test credentials)
const TEST_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

async function testPublishFix() {
  try {
    console.log('🧪 Testing Enhanced Publish Fix');
    console.log(`📍 API Base URL: ${API_BASE_URL}`);
    
    // Step 1: Login
    console.log('\n1️⃣ Logging in...');
    const loginResponse = await axios.post(`${API_BASE_URL}/login`, TEST_CREDENTIALS);
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    // Step 2: Get available displays
    console.log('\n2️⃣ Fetching displays...');
    const displaysResponse = await axios.get(`${API_BASE_URL}/optisigns/displays?limit=500`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const displays = displaysResponse.data;
    console.log(`✅ Found ${displays.length} displays`);
    
    if (displays.length === 0) {
      console.log('⚠️ No displays available, creating mock display ID for test');
      displays.push({ id: 'test-display-1', name: 'Test Display' });
    }
    
    // Step 3: Test the status endpoint to confirm 404
    console.log('\n3️⃣ Testing status endpoint...');
    try {
      await axios.get(`${API_BASE_URL}/content/exports/test-id/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('❌ Status endpoint exists (unexpected)');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Status endpoint returns 404 as expected');
      } else {
        console.log('⚠️ Status endpoint error:', error.response?.status || error.message);
      }
    }
    
    // Step 4: Test publish endpoint (if we have content projects)
    console.log('\n4️⃣ Testing publish functionality...');
    try {
      const projectsResponse = await axios.get(`${API_BASE_URL}/content/projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const projects = projectsResponse.data;
      if (projects.length > 0) {
        const testProject = projects[0];
        console.log(`📄 Testing with project: ${testProject.id}`);
        
        const publishOptions = {
          displayIds: [displays[0].id],
          format: 'png',
          quality: 'high',
          takeoverOptions: {
            priority: 'NORMAL',
            duration: 30,
            message: 'Test publish from fix verification'
          }
        };
        
        const publishResponse = await axios.post(
          `${API_BASE_URL}/content/projects/${testProject.id}/publish`,
          publishOptions,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        console.log('✅ Publish request successful');
        console.log('📊 Response:', publishResponse.data);
        
        // The fix should handle this gracefully without trying to poll the non-existent status endpoint
        
      } else {
        console.log('⚠️ No projects available for testing');
      }
    } catch (error) {
      console.log('❌ Publish test failed:', error.response?.data || error.message);
    }
    
    console.log('\n🎉 Test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testPublishFix();