#!/usr/bin/env node

const BASE_URL = 'http://34.122.156.88:3001/api/optisigns';

// Test JWT token - fresh token from admin/admin123 authentication
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInRlbmFudElkIjoiMSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1MDU1NTM2NywiZXhwIjoxNzUwNjQxNzY3fQ.ByWaoZZPNwtz4Rn-cvhUbzqO3qlOEotpBrpYCVTNcmE';




.test';

// Test OptiSigns API token
const OPTISIGNS_TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJ4RGRuREpOdXVQMmJEb2pudyIsImNpZCI6Ilk2S0QyeUpjZ1hRZjZOU2JvIiwiYWlkIjoicWh6UjRDUXlrTGRKd0RibjgiLCJpYXQiOjE3NTA0NDcyMTMsImV4cCI6MTc1MDQ1MDgxMywiaXNzIjoicWh6UjRDUXlrTGRKd0RibjgifQ.zWYHOHFFtZ7xaNDlUP88sUAFRFYOgMgv-g11532DmHAjIV0uTJR91i_VAJNsCGLBIRYpfdmAxrL1Mwzh3cj69Mj-1EN1oEuiGQpwVExDCzAgb2tyO49UWV4X7RjaCizwPdOLweKZ-UXWBKX4rImGQDrd6TWl4hIOUuY4NnAk-JlULwnMIo3VKrYKsCzTXaPSjXPWkTsnQMTt8d6QAr024Owgy3numT_vdv3waZ_PPTKxhrR3hNRIGijjJaki0URk8TMWo3Ji-xVZ3rmJxS5d1G-9Mj2RIQuJTH-a41Cz-_X6uZJRe6OSaxf_9BoYxgK2AxalaTKrFXAp7tNDSraA1YvHjb8GqH-jtIDi_Q1mWPLlWSVHKYrdRsbpWPqmLOQQFhUgCgBHxE54ic8vlNFcXwtFHl-5TC29zXQCyZNvAQNm-i-VCeC_4UbhrEDhgtemPHZw7Yc4L-4rKlIbvno-1dZasaDzHwLaK6t4ym97I2UtmQWsSl6qXV_yegapNcbQL_Y4PoG14Qavy3FI3h2iOZSncGM22Ca6wbuPaKKdhAO2wBGQsOs4n4Cg-4_hODNKCHRc18qvCQK5gBqd0aeUYQ98p7c85G57rLE3SK1fDyaXCAHFYZKdgUUUFcVTOCzoaMyYIqh_-p6sHYLR_Y9sOWkjSDl7yBZSNERIxq73uXQ




';

let testResults = [];
let createdResources = {
  devices: [],
  assets: [],
  playlists: [],
  tags: [],
  schedules: []
};

async function makeRequest(endpoint, method = 'GET', body = null, isFormData = false) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${TEST_TOKEN}`,
    },
  };

  if (body && !isFormData) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  } else if (body && isFormData) {
    options.body = body; // FormData sets its own content-type
  }

  try {
    console.log(`\n🔄 Testing ${method} ${endpoint}`);
    const startTime = Date.now();
    const response = await fetch(url, options);
    const responseTime = Date.now() - startTime;
    
    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = { error: 'Invalid JSON response' };
    }
    
    if (response.ok) {
      console.log(`✅ SUCCESS: ${response.status} (${responseTime}ms)`);
      console.log(`📊 Response:`, JSON.stringify(data, null, 2));
      return { success: true, data, status: response.status, responseTime };
    } else {
      console.log(`❌ FAILED: ${response.status} (${responseTime}ms)`);
      console.log(`📊 Error:`, JSON.stringify(data, null, 2));
      return { success: false, data, status: response.status, responseTime };
    }
  } catch (error) {
    console.log(`💥 ERROR: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testConfigurationEndpoints() {
  console.log('\n' + '='.repeat(60));
  console.log('🔧 TESTING CONFIGURATION ENDPOINTS');
  console.log('='.repeat(60));

  // Test 1: Get Configuration
  const getConfigResult = await makeRequest('/config');
  testResults.push({ category: 'Configuration', test: 'GET /config', ...getConfigResult });

  // Test 2: Test API Connection
  const testConnectionResult = await makeRequest('/config/test', 'POST', {
    apiToken: OPTISIGNS_TOKEN
  });
  testResults.push({ category: 'Configuration', test: 'POST /config/test', ...testConnectionResult });

  // Test 3: Update Configuration
  const updateConfigResult = await makeRequest('/config', 'PUT', {
    apiToken: OPTISIGNS_TOKEN,
    settings: {
      autoSync: true,
      syncInterval: 300
    }
  });
  testResults.push({ category: 'Configuration', test: 'PUT /config', ...updateConfigResult });
}

async function testDeviceManagementEndpoints() {
  console.log('\n' + '='.repeat(60));
  console.log('📺 TESTING DEVICE MANAGEMENT ENDPOINTS');
  console.log('='.repeat(60));

  // Test 1: Sync Displays
  const syncDisplaysResult = await makeRequest('/displays/sync', 'POST');
  testResults.push({ category: 'Devices', test: 'POST /displays/sync', ...syncDisplaysResult });
  
  if (syncDisplaysResult.success && syncDisplaysResult.data.displays) {
    createdResources.devices = syncDisplaysResult.data.displays;
  }

  // Test 2: Get Displays with pagination
  const getDisplaysResult = await makeRequest('/displays?page=1&limit=10');
  testResults.push({ category: 'Devices', test: 'GET /displays', ...getDisplaysResult });

  // Test 3: Get Displays with filters
  const getDisplaysFilteredResult = await makeRequest('/displays?status=ONLINE&isOnline=true');
  testResults.push({ category: 'Devices', test: 'GET /displays (filtered)', ...getDisplaysFilteredResult });

  // Test 4: Pair New Device (mock pairing code)
  const pairDeviceResult = await makeRequest('/devices/pair', 'POST', {
    pairingCode: '3JRKC8'
  });
  testResults.push({ category: 'Devices', test: 'POST /devices/pair', ...pairDeviceResult });

  // Test 5: Update Device (if we have devices)
  if (createdResources.devices.length > 0) {
    const deviceId = createdResources.devices[0].id;
    const updateDeviceResult = await makeRequest(`/devices/${deviceId}`, 'PUT', {
      deviceName: 'Updated Test Display',
      currentType: 'PLAYLIST'
    });
    testResults.push({ category: 'Devices', test: 'PUT /devices/{id}', ...updateDeviceResult });
  }
}

async function testAssetManagementEndpoints() {
  console.log('\n' + '='.repeat(60));
  console.log('🎨 TESTING ASSET MANAGEMENT ENDPOINTS');
  console.log('='.repeat(60));

  // Test 1: Sync Assets
  const syncAssetsResult = await makeRequest('/assets/sync', 'POST');
  testResults.push({ category: 'Assets', test: 'POST /assets/sync', ...syncAssetsResult });

  // Test 2: Get Assets with pagination
  const getAssetsResult = await makeRequest('/assets?page=1&limit=20');
  testResults.push({ category: 'Assets', test: 'GET /assets', ...getAssetsResult });

  // Test 3: Get Assets with filters
  const getAssetsFilteredResult = await makeRequest('/assets?type=video&search=test');
  testResults.push({ category: 'Assets', test: 'GET /assets (filtered)', ...getAssetsFilteredResult });

  // Test 4: Upload Asset (mock file upload)
  const mockFile = new Blob(['mock file content'], { type: 'text/plain' });
  const formData = new FormData();
  formData.append('file', mockFile, 'test-file.txt');
  formData.append('name', 'Test Asset Upload');
  formData.append('type', 'document');

  const uploadAssetResult = await makeRequest('/assets/upload', 'POST', formData, true);
  testResults.push({ category: 'Assets', test: 'POST /assets/upload', ...uploadAssetResult });
  
  if (uploadAssetResult.success && uploadAssetResult.data.asset) {
    createdResources.assets.push(uploadAssetResult.data.asset);
  }
}

async function testPlaylistManagementEndpoints() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 TESTING PLAYLIST MANAGEMENT ENDPOINTS');
  console.log('='.repeat(60));

  // Test 1: Create Playlist
  const createPlaylistResult = await makeRequest('/playlists', 'POST', {
    name: 'Test Playlist',
    description: 'Automated test playlist creation'
  });
  testResults.push({ category: 'Playlists', test: 'POST /playlists', ...createPlaylistResult });
  
  if (createPlaylistResult.success && createPlaylistResult.data.playlist) {
    createdResources.playlists.push(createPlaylistResult.data.playlist);
  }

  // Test 2: Get Playlists
  const getPlaylistsResult = await makeRequest('/playlists?page=1&limit=10');
  testResults.push({ category: 'Playlists', test: 'GET /playlists', ...getPlaylistsResult });

  // Test 3: Add Assets to Playlist (if we have both)
  if (createdResources.playlists.length > 0 && createdResources.assets.length > 0) {
    const playlistId = createdResources.playlists[0].id;
    const assetIds = createdResources.assets.slice(0, 2).map(asset => asset.id);
    
    const addAssetsResult = await makeRequest(`/playlists/${playlistId}/assets`, 'POST', {
      assetIds: assetIds
    });
    testResults.push({ category: 'Playlists', test: 'POST /playlists/{id}/assets', ...addAssetsResult });
  }
}

async function testTagManagementEndpoints() {
  console.log('\n' + '='.repeat(60));
  console.log('🏷️ TESTING TAG MANAGEMENT ENDPOINTS');
  console.log('='.repeat(60));

  // Test 1: Create Tag
  const createTagResult = await makeRequest('/tags', 'POST', {
    name: 'Test Tag',
    color: '#FF5733'
  });
  testResults.push({ category: 'Tags', test: 'POST /tags', ...createTagResult });
  
  if (createTagResult.success && createTagResult.data.tag) {
    createdResources.tags.push(createTagResult.data.tag);
  }

  // Test 2: Get Tags
  const getTagsResult = await makeRequest('/tags');
  testResults.push({ category: 'Tags', test: 'GET /tags', ...getTagsResult });

  // Test 3: Apply Tag to Resource (if we have both)
  if (createdResources.tags.length > 0 && createdResources.devices.length > 0) {
    const tagId = createdResources.tags[0].id;
    const displayId = createdResources.devices[0].id;
    
    const applyTagResult = await makeRequest(`/tags/${tagId}/apply`, 'POST', {
      resourceType: 'DISPLAY',
      resourceId: displayId
    });
    testResults.push({ category: 'Tags', test: 'POST /tags/{id}/apply', ...applyTagResult });
  }
}

async function testSchedulingEndpoints() {
  console.log('\n' + '='.repeat(60));
  console.log('📅 TESTING SCHEDULING ENDPOINTS');
  console.log('='.repeat(60));

  // Test 1: Get Schedules
  const getSchedulesResult = await makeRequest('/schedules?page=1&limit=10');
  testResults.push({ category: 'Schedules', test: 'GET /schedules', ...getSchedulesResult });

  // Test 2: Schedule Content (if we have devices and playlists)
  if (createdResources.devices.length > 0 && createdResources.playlists.length > 0) {
    const deviceId = createdResources.devices[0].id;
    const playlistId = createdResources.playlists[0].id;
    
    const scheduleContentResult = await makeRequest('/schedules', 'POST', {
      deviceId: deviceId,
      playlistId: playlistId,
      contentType: 'PLAYLIST',
      startTime: new Date(Date.now() + 60000).toISOString(), // 1 minute from now
      endTime: new Date(Date.now() + 3660000).toISOString(), // 1 hour from now
      isRecurring: true,
      recurrencePattern: {
        type: 'daily',
        weekdays: [1, 2, 3, 4, 5] // Monday to Friday
      }
    });
    testResults.push({ category: 'Schedules', test: 'POST /schedules', ...scheduleContentResult });
    
    if (scheduleContentResult.success && scheduleContentResult.data.schedule) {
      createdResources.schedules.push(scheduleContentResult.data.schedule);
    }
  }

  // Test 3: Get Schedules with filters
  const getSchedulesFilteredResult = await makeRequest('/schedules?status=SCHEDULED&startDate=2024-01-01');
  testResults.push({ category: 'Schedules', test: 'GET /schedules (filtered)', ...getSchedulesFilteredResult });
}

async function testAnalyticsEndpoints() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 TESTING ANALYTICS ENDPOINTS');
  console.log('='.repeat(60));

  // Test 1: Get Analytics (general)
  const getAnalyticsResult = await makeRequest('/analytics');
  testResults.push({ category: 'Analytics', test: 'GET /analytics', ...getAnalyticsResult });

  // Test 2: Get Analytics with date range
  const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = new Date().toISOString().split('T')[0];
  const getAnalyticsDateResult = await makeRequest(`/analytics?startDate=${startDate}&endDate=${endDate}`);
  testResults.push({ category: 'Analytics', test: 'GET /analytics (with dates)', ...getAnalyticsDateResult });
}

async function testLegacyEndpoints() {
  console.log('\n' + '='.repeat(60));
  console.log('⚠️ TESTING LEGACY ENDPOINTS (DEPRECATED)');
  console.log('='.repeat(60));

  // Test 1: Legacy Content Endpoint
  const legacyContentResult = await makeRequest('/content');
  testResults.push({ category: 'Legacy', test: 'GET /content (deprecated)', ...legacyContentResult });

  // Test 2: Legacy Display Reboot (should return 501)
  if (createdResources.devices.length > 0) {
    const deviceId = createdResources.devices[0].id;
    const legacyRebootResult = await makeRequest(`/displays/${deviceId}/reboot`, 'POST');
    testResults.push({ category: 'Legacy', test: 'POST /displays/{id}/reboot (deprecated)', ...legacyRebootResult });
  }
}

async function cleanupResources() {
  console.log('\n' + '='.repeat(60));
  console.log('🧹 CLEANING UP TEST RESOURCES');
  console.log('='.repeat(60));

  // Delete created assets
  for (const asset of createdResources.assets) {
    const deleteResult = await makeRequest(`/assets/${asset.id}`, 'DELETE');
    console.log(`${deleteResult.success ? '✅' : '❌'} Delete asset: ${asset.name}`);
  }

  // Delete created devices (if any were created via pairing)
  for (const device of createdResources.devices.filter(d => d.status === 'PAIRED')) {
    const deleteResult = await makeRequest(`/devices/${device.id}`, 'DELETE');
    console.log(`${deleteResult.success ? '✅' : '❌'} Delete device: ${device.name}`);
  }

  console.log('🧹 Cleanup completed');
}

function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📋 COMPREHENSIVE TEST REPORT');
  console.log('='.repeat(80));

  const categories = [...new Set(testResults.map(r => r.category))];
  const successful = testResults.filter(r => r.success).length;
  const total = testResults.length;
  const successRate = Math.round((successful / total) * 100);

  console.log(`\n📊 Overall Results: ${successful}/${total} tests passed (${successRate}%)`);
  
  // Results by category
  categories.forEach(category => {
    const categoryTests = testResults.filter(r => r.category === category);
    const categorySuccess = categoryTests.filter(r => r.success).length;
    const categoryTotal = categoryTests.length;
    const categoryRate = Math.round((categorySuccess / categoryTotal) * 100);
    
    console.log(`\n📁 ${category}: ${categorySuccess}/${categoryTotal} (${categoryRate}%)`);
    categoryTests.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      const statusCode = result.status ? ` (${result.status})` : '';
      const timing = result.responseTime ? ` - ${result.responseTime}ms` : '';
      console.log(`   ${status} ${result.test}${statusCode}${timing}`);
    });
  });

  // Performance summary
  const responseTimes = testResults.filter(r => r.responseTime).map(r => r.responseTime);
  if (responseTimes.length > 0) {
    const avgResponseTime = Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);
    const maxResponseTime = Math.max(...responseTimes);
    const minResponseTime = Math.min(...responseTimes);
    
    console.log(`\n⚡ Performance Summary:`);
    console.log(`   • Average response time: ${avgResponseTime}ms`);
    console.log(`   • Fastest response: ${minResponseTime}ms`);
    console.log(`   • Slowest response: ${maxResponseTime}ms`);
  }

  // API Health Assessment
  console.log(`\n🏥 API Health Assessment:`);
  if (successRate >= 90) {
    console.log('   🎉 Excellent - API is fully functional');
  } else if (successRate >= 75) {
    console.log('   ✨ Good - Most endpoints working correctly');
  } else if (successRate >= 50) {
    console.log('   ⚠️  Fair - Several endpoints need attention');
  } else {
    console.log('   🚨 Poor - Major issues detected');
  }

  // Resource Summary
  console.log(`\n📦 Resources Created During Testing:`);
  console.log(`   • Devices: ${createdResources.devices.length}`);
  console.log(`   • Assets: ${createdResources.assets.length}`);
  console.log(`   • Playlists: ${createdResources.playlists.length}`);
  console.log(`   • Tags: ${createdResources.tags.length}`);
  console.log(`   • Schedules: ${createdResources.schedules.length}`);

  return { successful, total, successRate, categories, testResults };
}

async function runCompleteTest() {
  console.log('🚀 Starting Comprehensive OptiSigns API Tests...\n');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`🔑 Using test token: ${TEST_TOKEN.substring(0, 20)}...`);
  console.log(`🎯 OptiSigns token: ${OPTISIGNS_TOKEN.substring(0, 20)}...`);

  try {
    // Run all test suites
    await testConfigurationEndpoints();
    await testDeviceManagementEndpoints();
    await testAssetManagementEndpoints();
    await testPlaylistManagementEndpoints();
    await testTagManagementEndpoints();
    await testSchedulingEndpoints();
    await testAnalyticsEndpoints();
    await testLegacyEndpoints();

    // Generate comprehensive report
    const report = generateReport();

    // Cleanup test resources
    await cleanupResources();

    console.log('\n🎯 Test suite completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   • Review failed endpoints and implement missing functionality');
    console.log('   • Update frontend components to use working endpoints');
    console.log('   • Configure proper OptiSigns API token for full functionality');
    console.log('   • Implement error handling for known limitations');

    return report;
  } catch (error) {
    console.error('\n💥 Test suite failed:', error);
    return null;
  }
}

// Run the tests
if (require.main === module) {
  runCompleteTest().catch(console.error);
}

module.exports = { runCompleteTest, makeRequest }; 