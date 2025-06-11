#!/usr/bin/env node

/**
 * Quick API Connectivity Test
 * Tests basic connectivity to the API server without requiring authentication
 */

const axios = require('axios');

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://34.122.156.88:3001/api';

async function quickConnectivityTest() {
  console.log('🚀 Quick API Connectivity Test');
  console.log(`📍 Testing API at: ${API_BASE_URL}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}\n`);

  const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  const tests = [
    // Test basic connectivity
    {
      name: 'Basic Server Connectivity',
      method: 'GET',
      endpoint: '/',
      expectsAuth: false
    },
    // Test if server responds to health check or similar
    {
      name: 'Health Check',
      method: 'GET', 
      endpoint: '/health',
      expectsAuth: false
    },
    // Test endpoints that might work without auth
    {
      name: 'Lead Sources (No Auth)',
      method: 'GET',
      endpoint: '/lead-sources',
      expectsAuth: true
    },
    {
      name: 'System Status',
      method: 'GET',
      endpoint: '/system/status',
      expectsAuth: false
    }
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const test of tests) {
    const startTime = Date.now();
    try {
      console.log(`\n🧪 Testing: ${test.name}`);
      console.log(`   ${test.method} ${test.endpoint}`);
      
      let response;
      
      if (test.method === 'GET') {
        response = await api.get(test.endpoint);
      } else if (test.method === 'POST') {
        response = await api.post(test.endpoint, {});
      }
      
      const duration = Date.now() - startTime;
      
      console.log(`   ✅ SUCCESS (${duration}ms)`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Headers: ${Object.keys(response.headers).slice(0, 5).join(', ')}...`);
      
      if (response.data) {
        if (typeof response.data === 'object') {
          console.log(`   Data keys: ${Object.keys(response.data).join(', ')}`);
        } else {
          console.log(`   Data type: ${typeof response.data}`);
        }
      }
      
      successCount++;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (error.response) {
        console.log(`   ⚠️  Expected Auth Error (${duration}ms)` + (test.expectsAuth ? ' - Expected!' : ''));
        console.log(`   Status: ${error.response.status} (${error.response.statusText})`);
        
        if (error.response.status === 401 && test.expectsAuth) {
          console.log(`   ✅ Auth required as expected`);
          successCount++;
        } else {
          console.log(`   ❌ Unexpected response`);
          console.log(`   Error: ${error.response.data?.error || error.response.data?.message || 'Unknown error'}`);
          errorCount++;
        }
      } else if (error.code === 'ECONNREFUSED') {
        console.log(`   ❌ CONNECTION REFUSED`);
        console.log(`   Server might be down or unreachable`);
        errorCount++;
      } else if (error.code === 'ENOTFOUND') {
        console.log(`   ❌ DNS/HOST NOT FOUND`);
        console.log(`   Check if the server address is correct`);
        errorCount++;
      } else if (error.code === 'ECONNABORTED') {
        console.log(`   ❌ TIMEOUT`);
        console.log(`   Server took too long to respond`);
        errorCount++;
      } else {
        console.log(`   ❌ UNKNOWN ERROR`);
        console.log(`   ${error.message}`);
        errorCount++;
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 CONNECTIVITY TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successful/Expected: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log(`📡 Server Status: ${errorCount === 0 ? 'REACHABLE' : 'ISSUES DETECTED'}`);
  
  if (successCount > 0) {
    console.log('\n✨ API server is reachable!');
    console.log('   Next step: Run full tests with authentication token');
    console.log('   Usage: TEST_TOKEN=your_jwt_token node test-reporting-apis.js');
  } else {
    console.log('\n❌ API server connectivity issues detected');
    console.log('   Please check:');
    console.log('   1. Server is running');
    console.log('   2. Network connectivity');
    console.log('   3. Server address is correct');
  }
  
  console.log(`\n⏰ Test completed at: ${new Date().toISOString()}`);
}

if (require.main === module) {
  quickConnectivityTest().catch(error => {
    console.error('\n💥 Test failed:', error.message);
    process.exit(1);
  });
}

module.exports = { quickConnectivityTest }; 