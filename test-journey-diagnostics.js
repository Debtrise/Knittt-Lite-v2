#!/usr/bin/env node

/**
 * Journey API Diagnostics Script
 * Provides detailed diagnostics for journey API issues
 */

const axios = require('axios');

const API_BASE_URL = 'http://34.122.156.88:3001';
const TEST_CREDS = { username: 'admin', password: 'admin123' };

async function checkBackendHealth() {
  console.log('🔍 Journey API Diagnostics');
  console.log('==========================');
  console.log(`🌐 Backend URL: ${API_BASE_URL}`);
  
  // 1. Check if backend is accessible
  try {
    console.log('\n1. 🏥 Checking backend health...');
    const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
    console.log('✅ Backend is accessible');
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
  } catch (error) {
    console.log('❌ Backend health check failed');
    if (error.code === 'ECONNREFUSED') {
      console.log('   🚨 Backend server is not running or not accessible');
      console.log('   💡 Please ensure the backend server is running at 34.122.156.88:3001');
      return false;
    }
    console.log(`   Error: ${error.message}`);
  }
  
  // 2. Check authentication endpoint
  try {
    console.log('\n2. 🔐 Testing authentication...');
    const response = await axios.post(`${API_BASE_URL}/api/login`, TEST_CREDS, { timeout: 5000 });
    console.log('✅ Authentication endpoint works');
    console.log(`   Token received: ${response.data.token?.substring(0, 50)}...`);
    
    // 3. Check if journeys endpoint exists
    console.log('\n3. 🛤️  Testing journeys endpoint...');
    const journeyResponse = await axios.get(`${API_BASE_URL}/api/journeys`, {
      headers: { Authorization: `Bearer ${response.data.token}` },
      timeout: 5000
    });
    console.log('✅ Journeys endpoint works');
    console.log(`   Found ${journeyResponse.data.journeys?.length || 0} journeys`);
    
    return true;
    
  } catch (error) {
    console.log('❌ Authentication or journey endpoint failed');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Error: ${error.message}`);
    
    if (error.response?.status === 404) {
      console.log('\n🚨 Journey endpoints not found!');
      console.log('   This suggests the journey APIs are not implemented in the backend');
      console.log('   OR the API routes are different than expected');
      
      // Try to discover available endpoints
      await discoverEndpoints();
    }
    
    return false;
  }
}

async function discoverEndpoints() {
  console.log('\n4. 🔍 Discovering available endpoints...');
  
  const commonEndpoints = [
    '/api',
    '/api/health',
    '/api/status',
    '/api/leads',
    '/api/calls',
    '/api/dids',
    '/api/webhooks',
    '/api/reports',
    '/api/system',
    '/api/users',
    '/api/tenants'
  ];
  
  for (const endpoint of commonEndpoints) {
    try {
      const response = await axios.get(`${API_BASE_URL}${endpoint}`, { 
        timeout: 3000,
        validateStatus: () => true // Accept all status codes
      });
      
      if (response.status < 500) {
        console.log(`✅ ${endpoint} - Status: ${response.status}`);
      }
    } catch (error) {
      // Ignore connection errors for discovery
    }
  }
}

async function suggestSolutions() {
  console.log('\n💡 Suggested Solutions:');
  console.log('======================');
  
  console.log('1. 🔧 Backend Issues:');
  console.log('   - Ensure backend server is running at 34.122.156.88:3001');
  console.log('   - Check backend logs for errors');
  console.log('   - Verify database connectivity');
  console.log('   - Restart backend services');
  
  console.log('\n2. 🛤️  Journey API Issues:');
  console.log('   - Journey endpoints may not be implemented yet');
  console.log('   - Check if journey routes are properly registered');
  console.log('   - Verify journey controller exists in backend');
  console.log('   - Check API documentation for correct endpoints');
  
  console.log('\n3. 🔐 Authentication Issues:');
  console.log('   - Verify admin credentials are correct');
  console.log('   - Check if user exists in database');
  console.log('   - Verify JWT token generation is working');
  
  console.log('\n4. 🌐 Network Issues:');
  console.log('   - Check firewall settings');
  console.log('   - Verify port 3001 is open');
  console.log('   - Test connectivity: ping 34.122.156.88');
  
  console.log('\n5. 📋 Next Steps:');
  console.log('   - Check backend implementation status');
  console.log('   - Review API documentation');
  console.log('   - Test with other working endpoints first');
  console.log('   - Contact backend developer for journey API status');
}

async function runDiagnostics() {
  const isHealthy = await checkBackendHealth();
  
  if (!isHealthy) {
    await suggestSolutions();
    console.log('\n🚨 Journey APIs are not ready for testing');
    console.log('   Please resolve backend issues before running journey tests');
  } else {
    console.log('\n✅ Journey APIs are ready for testing!');
    console.log('   You can now run: node test-journey-quick.js');
  }
}

// Run diagnostics
runDiagnostics().catch(console.error); 