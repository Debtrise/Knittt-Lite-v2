#!/usr/bin/env node

const BASE_URL = 'http://34.122.156.88:3001';

// Only need service credentials now - OptiSigns API key is in backend
const SERVICE_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

let serviceJwtToken = null;

// Utility functions
const log = {
  info: (msg) => console.log(`\n🔍 ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  section: (msg) => console.log(`\n${'='.repeat(60)}\n🔧 ${msg}\n${'='.repeat(60)}`)
};

// Authenticate with service
async function authenticateService() {
  try {
    log.info('Step 1: Authenticating with service (admin/admin123)...');
    
    const response = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(SERVICE_CREDENTIALS)
    });

    if (response.ok) {
      const data = await response.json();
      serviceJwtToken = data.token;
      log.success('Service authentication successful!');
      console.log(`🔑 Service JWT: ${serviceJwtToken.substring(0, 50)}...`);
      return true;
    } else {
      const errorText = await response.text();
      log.error(`Service login failed with status: ${response.status}`);
      console.log('Response:', errorText);
      return false;
    }
  } catch (error) {
    log.error(`Service authentication error: ${error.message}`);
    return false;
  }
}

// Make API request with detailed logging
async function makeRequest(method, endpoint, data = null) {
  try {
    const url = `${BASE_URL}${endpoint}`;
    console.log(`\n📤 ${method} ${url}`);
    console.log(`🔑 Auth: Bearer ${serviceJwtToken.substring(0, 30)}...`);
    
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${serviceJwtToken}`,
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
      console.log(`📄 Body:`, JSON.stringify(data, null, 2));
    }

    const response = await fetch(url, options);
    
    // Handle both JSON and text responses
    let responseData;
    const contentType = response.headers.get('content-type');
    
    try {
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }
    } catch (parseError) {
      responseData = `Failed to parse response: ${parseError.message}`;
    }
    
    console.log(`\n📥 Response:`);
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Content-Type: ${contentType || 'unknown'}`);
    console.log(`   Body:`, typeof responseData === 'string' && responseData.length > 300 
      ? responseData.substring(0, 300) + '...' 
      : responseData);
    
    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      data: responseData,
      contentType
    };
  } catch (error) {
    console.log(`\n💥 Request Error: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// Test OptiSigns integration with backend API key
async function testBackendOptiSigns() {
  log.section('Backend OptiSigns Integration Test');
  console.log('🎯 Testing OptiSigns with API key stored in backend');
  console.log('🔑 Only using service authentication (admin/admin123)');
  console.log(`📍 Base URL: ${BASE_URL}`);

  const results = [];

  // Step 1: Test GET config
  log.info('Step 1: Testing GET /api/optisigns/config...');
  const getConfigResult = await makeRequest('GET', '/api/optisigns/config');
  results.push({ step: 'GET Config', ...getConfigResult });

  // Step 2: Test OptiSigns connection (no API token needed in request)
  log.info('Step 2: Testing POST /api/optisigns/config/test...');
  const testResult = await makeRequest('POST', '/api/optisigns/config/test', {});
  results.push({ step: 'Test Connection', ...testResult });

  // Step 3: Test display sync
  log.info('Step 3: Testing POST /api/optisigns/displays/sync...');
  const syncResult = await makeRequest('POST', '/api/optisigns/displays/sync');
  results.push({ step: 'Display Sync', ...syncResult });

  // Step 4: Test display list
  log.info('Step 4: Testing GET /api/optisigns/displays...');
  const displaysResult = await makeRequest('GET', '/api/optisigns/displays');
  results.push({ step: 'Display List', ...displaysResult });

  // Step 5: Test assets sync
  log.info('Step 5: Testing POST /api/optisigns/assets/sync...');
  const assetsSyncResult = await makeRequest('POST', '/api/optisigns/assets/sync');
  results.push({ step: 'Assets Sync', ...assetsSyncResult });

  // Step 6: Test assets list
  log.info('Step 6: Testing GET /api/optisigns/assets...');
  const assetsResult = await makeRequest('GET', '/api/optisigns/assets');
  results.push({ step: 'Assets List', ...assetsResult });

  // Step 7: Test analytics
  log.info('Step 7: Testing GET /api/optisigns/analytics...');
  const analyticsResult = await makeRequest('GET', '/api/optisigns/analytics');
  results.push({ step: 'Analytics', ...analyticsResult });

  // Step 8: Test playlists
  log.info('Step 8: Testing GET /api/optisigns/playlists...');
  const playlistsResult = await makeRequest('GET', '/api/optisigns/playlists');
  results.push({ step: 'Playlists', ...playlistsResult });

  // Step 9: Test tags
  log.info('Step 9: Testing GET /api/optisigns/tags...');
  const tagsResult = await makeRequest('GET', '/api/optisigns/tags');
  results.push({ step: 'Tags', ...tagsResult });

  // Step 10: Test schedules
  log.info('Step 10: Testing GET /api/optisigns/schedules...');
  const schedulesResult = await makeRequest('GET', '/api/optisigns/schedules');
  results.push({ step: 'Schedules', ...schedulesResult });

  // Summary
  log.section('BACKEND INTEGRATION TEST RESULTS');
  
  let successCount = 0;
  results.forEach((result, index) => {
    const icon = result.success ? '✅' : '❌';
    const status = result.success ? 'SUCCESS' : 'FAILED';
    console.log(`${icon} ${index + 1}. ${result.step}: ${status} (${result.status || 'N/A'})`);
    if (result.success) successCount++;
  });

  const successRate = Math.round((successCount / results.length) * 100);
  
  console.log(`\n📊 Overall Success Rate: ${successCount}/${results.length} (${successRate}%)`);
  
  if (successRate >= 90) {
    log.success('🎉 Backend OptiSigns integration EXCELLENT!');
    console.log('\n🚀 Your OptiSigns integration is working perfectly!');
  } else if (successRate >= 70) {
    log.success('✅ Backend OptiSigns integration GOOD!');
    console.log('\n🔧 Most features working, minor issues to address');
  } else if (successRate >= 50) {
    console.log('⚠️  Backend OptiSigns integration PARTIAL');
    console.log('\n🔧 Core features working, some endpoints need attention');
  } else {
    log.error('❌ Backend OptiSigns integration FAILED');
    console.log('\n🔍 Check backend configuration and OptiSigns API key setup');
  }

  // Detailed analysis
  console.log('\n🔍 Detailed Analysis:');
  const workingEndpoints = results.filter(r => r.success);
  const failingEndpoints = results.filter(r => !r.success);
  
  if (workingEndpoints.length > 0) {
    console.log(`\n✅ Working Endpoints (${workingEndpoints.length}):`);
    workingEndpoints.forEach(endpoint => {
      console.log(`   • ${endpoint.step}`);
    });
  }
  
  if (failingEndpoints.length > 0) {
    console.log(`\n❌ Failing Endpoints (${failingEndpoints.length}):`);
    failingEndpoints.forEach(endpoint => {
      console.log(`   • ${endpoint.step}: ${endpoint.status || 'Error'}`);
    });
  }

  return results;
}

// Main test function
async function runBackendTest() {
  // Step 1: Authenticate with service
  const authSuccess = await authenticateService();
  if (!authSuccess) {
    log.error('Cannot proceed without service authentication');
    return;
  }

  // Step 2: Test OptiSigns integration
  await testBackendOptiSigns();
}

// Run the test
if (require.main === module) {
  runBackendTest().catch(console.error);
}

module.exports = { runBackendTest }; 