#!/usr/bin/env node

/**
 * Authentication Token Helper
 * Attempts to get a valid JWT token for testing
 */

const axios = require('axios');

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://34.122.156.88:3001/api';

async function getAuthToken() {
  console.log('🔐 Attempting to get authentication token...');
  console.log(`📍 API Base URL: ${API_BASE_URL}`);

  const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Test credentials (you'll need to provide actual ones)
  const testCredentials = [
    { username: 'admin', password: 'admin' },
    { username: 'test', password: 'test' },
    { username: 'demo', password: 'demo' },
    { username: 'user', password: 'password' }
  ];

  console.log('\n⚠️  This script will try common test credentials:');
  testCredentials.forEach((cred, i) => {
    console.log(`   ${i + 1}. username: ${cred.username}, password: ${cred.password}`);
  });
  console.log('\n   If none work, you\'ll need to provide actual credentials.');

  for (const credentials of testCredentials) {
    try {
      console.log(`\n🧪 Trying: ${credentials.username}/${credentials.password}`);
      
      const response = await api.post('/login', credentials);
      
      if (response.data && response.data.token) {
        console.log(`\n✅ SUCCESS! Got authentication token:`);
        console.log(`   Token: ${response.data.token}`);
        console.log(`   User: ${JSON.stringify(response.data.user, null, 2)}`);
        
        console.log(`\n🚀 Now you can test with:`);
        console.log(`   TEST_TOKEN="${response.data.token}" node test-real-endpoints.js`);
        
        if (response.data.user?.tenantId) {
          console.log(`   TEST_TOKEN="${response.data.token}" TEST_TENANT_ID="${response.data.user.tenantId}" node test-real-endpoints.js`);
        }
        
        return response.data;
      }
      
    } catch (error) {
      if (error.response) {
        console.log(`   ❌ ${error.response.status}: ${error.response.data?.error || error.response.data?.message || 'Login failed'}`);
      } else {
        console.log(`   ❌ Network error: ${error.message}`);
      }
    }
  }

  console.log('\n❌ Could not authenticate with test credentials.');
  console.log('\nTo test the API endpoints, you need to:');
  console.log('1. Get valid credentials from your system administrator');
  console.log('2. Create a user account if needed');
  console.log('3. Use the login endpoint manually:');
  console.log(`   curl -X POST ${API_BASE_URL}/login -H "Content-Type: application/json" -d '{"username":"your_user","password":"your_pass"}'`);
  console.log('\n4. Then use the token with the test script:');
  console.log('   TEST_TOKEN="your_jwt_token" node test-real-endpoints.js');
}

// Also provide a manual token input option
async function testWithManualToken() {
  const manualToken = process.env.MANUAL_TOKEN;
  
  if (!manualToken) {
    console.log('\n💡 You can also test with a manual token:');
    console.log('   MANUAL_TOKEN="your_jwt_token" node get-auth-token.js');
    return;
  }

  console.log('\n🔍 Testing manual token...');
  
  const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
      'Authorization': `Bearer ${manualToken}`,
      'Content-Type': 'application/json'
    }
  });

  try {
    // Test the token with a simple endpoint
    const response = await api.get('/lead-sources');
    
    console.log(`✅ Manual token works!`);
    console.log(`   Response status: ${response.status}`);
    console.log(`   Data: ${Array.isArray(response.data) ? `Array[${response.data.length}]` : typeof response.data}`);
    
    console.log(`\n🚀 Token is valid, run the tests:`);
    console.log(`   TEST_TOKEN="${manualToken}" node test-real-endpoints.js`);
    
  } catch (error) {
    if (error.response?.status === 401) {
      console.log(`❌ Manual token is invalid or expired`);
    } else if (error.response?.status === 404) {
      console.log(`✅ Token works (got 404 which means authenticated but endpoint not found)`);
      console.log(`   This is actually good - authentication is working!`);
      console.log(`\n🚀 Token is valid, run the tests:`);
      console.log(`   TEST_TOKEN="${manualToken}" node test-real-endpoints.js`);
    } else {
      console.log(`⚠️  Token test unclear: ${error.response?.status || error.message}`);
      console.log(`   Try running the tests anyway:`);
      console.log(`   TEST_TOKEN="${manualToken}" node test-real-endpoints.js`);
    }
  }
}

if (require.main === module) {
  (async () => {
    await getAuthToken();
    await testWithManualToken();
  })().catch(error => {
    console.error('\n💥 Script failed:', error.message);
    process.exit(1);
  });
}

module.exports = { getAuthToken, testWithManualToken }; 