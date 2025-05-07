const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

// Create dummy CSV file for testing
fs.writeFileSync('test-contacts.csv', 'phone,name\n+12345678901,Test User');

// Base URL that we're trying to connect to
const BASE_URL = 'http://34.122.156.88:3100';

// Set a longer timeout and add debug information
axios.defaults.timeout = 30000; // 30 seconds
axios.interceptors.request.use(request => {
  console.log('Starting Request:', request.method, request.url);
  return request;
});

// 1. Basic connectivity test
async function testConnectivity() {
  try {
    console.log('\n--- Testing basic connectivity to API server ---');
    const startTime = Date.now();
    const response = await axios.get(`${BASE_URL}/`);
    const endTime = Date.now();
    console.log(`✅ API Server reachable (${endTime - startTime}ms)`);
    console.log('Response status:', response.status);
    return true;
  } catch (error) {
    console.log('❌ API Server connectivity test failed:');
    if (error.code) console.log('Error code:', error.code);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
    return false;
  }
}

// 2. Test campaign creation
async function testCreateCampaign() {
  try {
    console.log('\n--- Testing campaign creation ---');
    const response = await axios.post(`${BASE_URL}/campaigns`, {
      name: `Test Campaign ${Date.now()}`,
      messageTemplate: 'Test message {{name}}',
      rateLimit: 60
    });
    console.log('✅ Campaign created successfully');
    console.log('Campaign ID:', response.data.id);
    return response.data.id;
  } catch (error) {
    console.log('❌ Campaign creation failed:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
    return null;
  }
}

// 3. Test contacts upload
async function testContactUpload(campaignId) {
  if (!campaignId) {
    console.log('❌ Skipping contact upload (no campaign ID)');
    return false;
  }
  
  try {
    console.log(`\n--- Testing contact upload to campaign ${campaignId} ---`);
    
    // Try different field names
    const fieldNames = ['contacts', 'file', 'csv', 'csvFile'];
    let success = false;
    
    for (const fieldName of fieldNames) {
      console.log(`Trying field name: "${fieldName}"`);
      const formData = new FormData();
      formData.append(fieldName, fs.createReadStream('test-contacts.csv'));
      
      try {
        const response = await axios.post(
          `${BASE_URL}/campaigns/${campaignId}/upload`,
          formData,
          { headers: formData.getHeaders() }
        );
        console.log(`✅ Upload successful with field name "${fieldName}"`);
        console.log('Response status:', response.status);
        console.log('Response data:', response.data);
        success = true;
        break;
      } catch (error) {
        console.log(`❌ Upload failed with field name "${fieldName}":`, 
          error.response?.status, 
          error.response?.data || error.message);
      }
    }
    
    return success;
  } catch (error) {
    console.log('❌ Contact upload process failed:');
    console.log('Error:', error.message);
    return false;
  }
}

// 4. Test different ports
async function testPorts() {
  const ports = [3100, 3000, 3001];
  
  console.log('\n--- Testing different ports ---');
  for (const port of ports) {
    try {
      const url = `http://34.122.156.88:${port}`;
      console.log(`Testing connection to ${url}`);
      const startTime = Date.now();
      const response = await axios.get(url, { timeout: 5000 });
      const endTime = Date.now();
      console.log(`✅ Port ${port} is reachable (${endTime - startTime}ms)`);
      console.log('Status:', response.status);
      if (response.data) console.log('Has response data');
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        console.log(`❌ Port ${port} timed out`);
      } else if (error.response) {
        console.log(`✅ Port ${port} responded with status ${error.response.status}`);
      } else {
        console.log(`❌ Port ${port} error:`, error.message);
      }
    }
  }
}

// Main test function
async function runTests() {
  console.log('=== SMS API CONNECTIVITY TESTS ===');
  
  // Cleanup any previous test files
  if (fs.existsSync('test-contacts.csv')) {
    fs.unlinkSync('test-contacts.csv');
  }
  
  // Create new test file
  fs.writeFileSync('test-contacts.csv', 'phone,name\n+12345678901,Test User');
  
  // Run tests
  const isConnected = await testConnectivity();
  await testPorts();
  
  if (isConnected) {
    const campaignId = await testCreateCampaign();
    await testContactUpload(campaignId);
  }
  
  // Cleanup
  if (fs.existsSync('test-contacts.csv')) {
    fs.unlinkSync('test-contacts.csv');
  }
  
  console.log('\n=== TEST COMPLETE ===');
}

// Run tests
runTests().catch(error => {
  console.error('Test script error:', error);
}); 