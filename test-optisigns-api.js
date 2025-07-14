#!/usr/bin/env node

const BASE_URL = 'http://34.122.156.88:3001/api/optisigns';

// Fresh JWT token from admin/admin123 authentication
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInRlbmFudElkIjoiMSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1MDU1NTM2NywiZXhwIjoxNzUwNjQxNzY3fQ.ByWaoZZPNwtz4Rn-cvhUbzqO3qlOEotpBrpYCVTNcmE';

async function makeRequest(endpoint, method = 'GET', body = null) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${TEST_TOKEN}`,
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    console.log(`\n🔄 Testing ${method} ${endpoint}`);
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ SUCCESS: ${response.status}`);
      console.log(`📊 Response:`, JSON.stringify(data, null, 2));
      return { success: true, data, status: response.status };
    } else {
      console.log(`❌ FAILED: ${response.status}`);
      console.log(`📊 Error:`, JSON.stringify(data, null, 2));
      return { success: false, data, status: response.status };
    }
  } catch (error) {
    console.log(`💥 ERROR: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Starting OptiSigns API Tests...\n');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`🔑 Using test token: ${TEST_TOKEN.substring(0, 20)}...`);

  const results = [];

  // Test 1: Get Configuration
  const configResult = await makeRequest('/config');
  results.push({ test: 'GET /config', ...configResult });

  // Test 2: Update Configuration
  const updateConfigResult = await makeRequest('/config', 'PUT', {
    apiToken: 'test-optisigns-token-12345',
    settings: {
      autoSync: true,
      syncInterval: 300,
      defaultContentDuration: 30
    }
  });
  results.push({ test: 'PUT /config', ...updateConfigResult });

  // Test 3: Test API Connection
  const testConnectionResult = await makeRequest('/config/test', 'POST', {
    apiToken: 'test-optisigns-token-12345'
  });
  results.push({ test: 'POST /config/test', ...testConnectionResult });

  // Test 4: Get Displays
  const displaysResult = await makeRequest('/displays');
  results.push({ test: 'GET /displays', ...displaysResult });

  // Test 5: Sync Displays
  const syncResult = await makeRequest('/displays/sync', 'POST');
  results.push({ test: 'POST /displays/sync', ...syncResult });

  // Test 6: Get Content
  const contentResult = await makeRequest('/content');
  results.push({ test: 'GET /content', ...contentResult });

  // Test 7: Create Content
  const createContentResult = await makeRequest('/content', 'POST', {
    name: 'Test Content',
    type: 'text',
    content: 'This is a test message for OptiSigns display testing.',
    duration: 45,
    options: {
      fontSize: 'large',
      backgroundColor: '#e3f2fd',
      textColor: '#1565c0',
      alignment: 'center'
    }
  });
  results.push({ test: 'POST /content', ...createContentResult });

  // Test 8: Get Analytics
  const analyticsResult = await makeRequest('/analytics');
  results.push({ test: 'GET /analytics', ...analyticsResult });

  // Test 9: Get Analytics with Date Range
  const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = new Date().toISOString().split('T')[0];
  const analyticsDateResult = await makeRequest(`/analytics?startDate=${startDate}&endDate=${endDate}`);
  results.push({ test: 'GET /analytics with dates', ...analyticsDateResult });

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 TEST SUMMARY');
  console.log('='.repeat(60));

  const successful = results.filter(r => r.success).length;
  const total = results.length;
  const successRate = Math.round((successful / total) * 100);

  console.log(`\n📊 Results: ${successful}/${total} tests passed (${successRate}%)`);

  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    const statusCode = result.status ? ` (${result.status})` : '';
    console.log(`${status} ${index + 1}. ${result.test}${statusCode}`);
  });

  if (successRate === 100) {
    console.log('\n🎉 All tests passed! OptiSigns API is working correctly.');
  } else if (successRate >= 80) {
    console.log('\n✨ Most tests passed! OptiSigns API is mostly functional.');
  } else {
    console.log('\n⚠️  Several tests failed. Please check the API implementation.');
  }

  console.log('\n🔍 Key Features Tested:');
  console.log('   • Configuration management');
  console.log('   • API connection testing');
  console.log('   • Display synchronization');
  console.log('   • Content creation and listing');
  console.log('   • Analytics data retrieval');

  return { successful, total, successRate, results };
}

// Run the tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, makeRequest }; 