const axios = require('axios');

// Try to connect to port 3000
const SMS_API = 'http://34.122.156.88:3000';

async function testConnection() {
  console.log('Testing connection to:', SMS_API);
  
  try {
    const response = await axios.get(`${SMS_API}/`);
    console.log('✅ Connection successful! Status:', response.status);
    console.log('Response data:', response.data);
    return true;
  } catch (error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // even a 404 means the server is responsive
      console.log('✅ Server responded with status:', error.response.status);
      console.log('Response data:', error.response.data);
      return true;
    } else if (error.request) {
      // The request was made but no response was received
      console.log('❌ No response received. Connection refused or timeout.');
      return false;
    } else {
      // Something happened in setting up the request
      console.log('❌ Error:', error.message);
      return false;
    }
  }
}

// Test campaigns endpoint
async function testCampaignsEndpoint() {
  console.log('\nTesting /campaigns endpoint');
  
  try {
    const response = await axios.get(`${SMS_API}/campaigns`);
    console.log('✅ Endpoint works! Status:', response.status);
    console.log('Campaigns data:', response.data);
    return true;
  } catch (error) {
    if (error.response) {
      console.log('⚠️ Server responded with status:', error.response.status);
      console.log('Response data:', error.response.data);
      return false;
    } else {
      console.log('❌ Error:', error.message);
      return false;
    }
  }
}

// Test multiple potential paths
async function testPotentialPaths() {
  const paths = [
    '/campaigns',
    '/api/campaigns',
    '/sms/campaigns',
    '/v1/campaigns'
  ];
  
  console.log('\nTesting potential API paths:');
  for (const path of paths) {
    console.log(`\nTrying path: ${path}`);
    try {
      const response = await axios.get(`${SMS_API}${path}`);
      console.log('✅ Path works! Status:', response.status);
      if (response.data) {
        console.log('Response data available');
      }
      return path;
    } catch (error) {
      if (error.response) {
        console.log('⚠️ Server responded with status:', error.response.status);
      } else {
        console.log('❌ Error:', error.message);
      }
    }
  }
  
  return null;
}

async function runTests() {
  console.log('=== TESTING SMS API ON PORT 3000 ===\n');
  
  const isConnected = await testConnection();
  
  if (isConnected) {
    await testCampaignsEndpoint();
    const workingPath = await testPotentialPaths();
    
    if (workingPath) {
      console.log(`\n✅ Found working path: ${workingPath}`);
      console.log('Update your API code to use this path');
    } else {
      console.log('\n❌ No working API paths found');
    }
  }
  
  console.log('\n=== TEST COMPLETE ===');
}

runTests().catch(console.error); 