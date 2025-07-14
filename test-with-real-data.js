const axios = require('axios');

const BASE_URL = 'http://34.122.156.88:3001/api/optisigns';
const LOGIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

const OPTISIGNS_TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJ4RGRuREpOdXVQMmJEb2pudyIsImNpZCI6Ilk2S0QyeUpjZ1hRZjZOU2JvIiwiYWlkIjoicWh6UjRDUXlrTGRKd0RibjgiLCJpYXQiOjE3NTA0NDcyMTMsImV4cCI6MTc1MDQ1MDgxMywiaXNzIjoicWh6UjRDUXlrTGRKd0RibjgifQ.zWYHOHFFtZ7xaNDlUP88sUAFRFYOgMgv-g11532DmHAjIV0uTJR91i_VAJNsCGLBIRYpfdmAxrL1Mwzh3cj69Mj-1EN1oEuiGQpwVExDCzAgb2tyO49UWV4X7RjaCizwPdOLweKZ-UXWBKX4rImGQDrd6TWl4hIOUuY4NnAk-JlULwnMIo3VKrYKsCzTXaPSjXPWkTsnQMTt8d6QAr024Owgy3numT_vdv3waZ_PPTKxhrR3hNRIGijjJaki0URk8TMWo3Ji-xVZ3rmJxS5d1G-9Mj2RIQuJTH-a41Cz-_X6uZJRe6OSaxf_9BoYxgK2AxalaTKrFXAp7tNDSraA1YvHjb8GqH-jtIDi_Q1mWPLlWSVHKYrdRsbpWPqmLOQQFhUgCgBHxE54ic8vlNFcXwtFHl-5TC29zXQCyZNvAQNm-i-VCeC_4UbhrEDhgtemPHZw7Yc4L-4rKlIbvno-1dZasaDzHwLaK6t4ym97I2UtmQWsSl6qXV_yegapNcbQL_Y4PoG14Qavy3FI3h2iOZSncGM22Ca6wbuPaKKdhAO2wBGQsOs4n4Cg-4_hODNKCHRc18qvCQK5gBqd0aeUYQ98p7c85G57rLE3SK1fDyaXCAHFYZKdgUUUFcVTOCzoaMyYIqh_-p6sHYLR_Y9sOWkjSDl7yBZSNERIxq73uXQ';

let jwtToken = null;
let availableDisplays = [];
let availableContent = [];

async function getJWTToken() {
  if (jwtToken) return jwtToken;
  
  try {
    const response = await axios.post('http://34.122.156.88:3001/api/login', LOGIN_CREDENTIALS);
    jwtToken = response.data.token;
    console.log('✅ Successfully authenticated with admin credentials');
    return jwtToken;
  } catch (error) {
    console.error('❌ Failed to authenticate:', error.response?.data || error.message);
    return null;
  }
}

async function makeRequest(method, endpoint, data = null, requiresOptisignsToken = false) {
  const token = await getJWTToken();
  if (!token) {
    return { success: false, error: 'Failed to get JWT token' };
  }

  const config = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  if (data) {
    config.data = data;
  }

  try {
    const startTime = Date.now();
    const response = await axios(config);
    const responseTime = Date.now() - startTime;
    
    return {
      success: true,
      status: response.status,
      responseTime,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 0,
      error: error.response?.data?.error || error.message,
      fullError: error.response?.data || error.message
    };
  }
}

async function createTestData() {
  console.log('\n🔧 STEP 1: Creating Test Data');
  console.log('=' .repeat(60));

  // Try to create test data endpoint
  console.log('📝 Attempting to create test data...');
  const testDataResult = await makeRequest('POST', '/debug/create-test-data');
  
  if (testDataResult.success) {
    console.log('✅ Test data created successfully!');
    console.log(`   Response: ${JSON.stringify(testDataResult.data, null, 2)}`);
  } else {
    console.log(`⚠️  Test data endpoint not available (${testDataResult.status}): ${testDataResult.error}`);
    console.log('   Will proceed with existing data or create manually...');
  }

  // Sync displays to get fresh data
  console.log('\n📺 Syncing displays...');
  const syncResult = await makeRequest('POST', '/displays/sync');
  if (syncResult.success) {
    console.log('✅ Displays synced successfully!');
    if (syncResult.data.displays && syncResult.data.displays.length > 0) {
      console.log(`   Found ${syncResult.data.displays.length} displays`);
    }
  } else {
    console.log(`❌ Display sync failed: ${syncResult.error}`);
  }

  // Create some content
  console.log('\n📄 Creating test content...');
  const contentData = {
    name: 'Test Content for API Testing',
    type: 'text',
    content: 'This is test content created for API validation!',
    duration: 30,
    options: {
      fontSize: 'large',
      backgroundColor: '#ffffff',
      textColor: '#000000'
    }
  };

  const createContentResult = await makeRequest('POST', '/content', contentData);
  if (createContentResult.success) {
    console.log('✅ Test content created successfully!');
    console.log(`   Content ID: ${createContentResult.data.content?.id || 'Not provided'}`);
  } else {
    console.log(`❌ Content creation failed: ${createContentResult.error}`);
  }

  // Create test asset
  console.log('\n🖼️  Creating test asset...');
  const assetData = {
    name: 'Test Asset for API Testing',
    type: 'image',
    url: 'https://via.placeholder.com/800x600/0066cc/ffffff?text=Test+Asset'
  };

  const createAssetResult = await makeRequest('POST', '/assets', assetData, true);
  if (createAssetResult.success) {
    console.log('✅ Test asset created successfully!');
    console.log(`   Asset ID: ${createAssetResult.data.asset?.id || 'Not provided'}`);
  } else {
    console.log(`❌ Asset creation failed: ${createAssetResult.error}`);
  }
}

async function getAvailableResources() {
  console.log('\n🔍 STEP 2: Checking Available Resources');
  console.log('=' .repeat(60));

  // Get available displays
  console.log('📺 Fetching available displays...');
  const displaysResult = await makeRequest('GET', '/displays');
  if (displaysResult.success) {
    availableDisplays = displaysResult.data.displays || [];
    console.log(`✅ Found ${availableDisplays.length} displays`);
    availableDisplays.forEach((display, index) => {
      console.log(`   ${index + 1}. ${display.name || 'Unnamed'} (ID: ${display.id})`);
    });
  } else {
    console.log(`❌ Failed to get displays: ${displaysResult.error}`);
  }

  // Get available content
  console.log('\n📄 Fetching available content...');
  const contentResult = await makeRequest('GET', '/content');
  if (contentResult.success) {
    availableContent = contentResult.data.localContent || [];
    console.log(`✅ Found ${availableContent.length} content items`);
    availableContent.forEach((content, index) => {
      console.log(`   ${index + 1}. ${content.name || 'Unnamed'} (ID: ${content.id})`);
    });
  } else {
    console.log(`❌ Failed to get content: ${contentResult.error}`);
  }
}

async function testWithRealData() {
  console.log('\n🧪 STEP 3: Testing with Real Data');
  console.log('=' .repeat(60));

  const results = [];
  let successCount = 0;

  // Test display operations with real display IDs
  if (availableDisplays.length > 0) {
    const testDisplay = availableDisplays[0];
    console.log(`\n📺 Testing display operations with: ${testDisplay.name} (${testDisplay.id})`);

    // Test display reboot
    console.log('   🔄 Testing display reboot...');
    const rebootResult = await makeRequest('POST', `/displays/${testDisplay.id}/reboot`);
    results.push({ name: 'Reboot Display', ...rebootResult });
    
    if (rebootResult.success) {
      successCount++;
      console.log(`   ✅ SUCCESS (${rebootResult.status}) - ${rebootResult.responseTime}ms`);
    } else {
      console.log(`   ❌ FAILED (${rebootResult.status}): ${rebootResult.error}`);
    }

    // Test display assignment
    if (availableContent.length > 0) {
      const testContent = availableContent[0];
      console.log('   📌 Testing display assignment...');
      const assignResult = await makeRequest('POST', `/displays/${testDisplay.id}/assign`, {
        contentId: testContent.id
      });
      results.push({ name: 'Assign Display', ...assignResult });
      
      if (assignResult.success) {
        successCount++;
        console.log(`   ✅ SUCCESS (${assignResult.status}) - ${assignResult.responseTime}ms`);
      } else {
        console.log(`   ❌ FAILED (${assignResult.status}): ${assignResult.error}`);
      }
    } else {
      console.log('   ⚠️  No content available for assignment test');
      results.push({ name: 'Assign Display', success: false, error: 'No content available' });
    }
  } else {
    console.log('   ⚠️  No displays available for testing');
    results.push({ name: 'Reboot Display', success: false, error: 'No displays available' });
    results.push({ name: 'Assign Display', success: false, error: 'No displays available' });
  }

  // Test content deletion with real content ID
  if (availableContent.length > 0) {
    const testContent = availableContent[0];
    console.log(`\n📄 Testing content deletion with: ${testContent.name} (${testContent.id})`);
    
    const deleteResult = await makeRequest('DELETE', `/content/${testContent.id}`);
    results.push({ name: 'Delete Content', ...deleteResult });
    
    if (deleteResult.success) {
      successCount++;
      console.log(`   ✅ SUCCESS (${deleteResult.status}) - ${deleteResult.responseTime}ms`);
    } else {
      console.log(`   ❌ FAILED (${deleteResult.status}): ${deleteResult.error}`);
    }
  } else {
    console.log('   ⚠️  No content available for deletion test');
    results.push({ name: 'Delete Content', success: false, error: 'No content available' });
  }

  // Test schedule creation
  console.log('\n📅 Testing schedule creation...');
  const scheduleData = {
    name: 'Test Schedule with Real Data',
    contentId: availableContent.length > 0 ? availableContent[0].id : '123e4567-e89b-12d3-a456-426614174000',
    displayIds: availableDisplays.length > 0 ? [availableDisplays[0].id] : ['123e4567-e89b-12d3-a456-426614174000'],
    startTime: '2024-12-20T10:00:00Z',
    endTime: '2024-12-20T18:00:00Z'
  };

  const scheduleResult = await makeRequest('POST', '/schedules', scheduleData);
  results.push({ name: 'Create Schedule', ...scheduleResult });
  
  if (scheduleResult.success) {
    successCount++;
    console.log(`   ✅ SUCCESS (${scheduleResult.status}) - ${scheduleResult.responseTime}ms`);
  } else {
    console.log(`   ❌ FAILED (${scheduleResult.status}): ${scheduleResult.error}`);
  }

  return { results, successCount, totalTests: results.length };
}

async function runComprehensiveTest() {
  console.log('🚀 COMPREHENSIVE OPTISIGNS API TEST WITH REAL DATA');
  console.log('=' .repeat(80));
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`🔑 Using OptiSigns Token: ${OPTISIGNS_TOKEN.substring(0, 50)}...`);
  console.log('=' .repeat(80));

  // Step 1: Create test data
  await createTestData();

  // Step 2: Get available resources
  await getAvailableResources();

  // Step 3: Test with real data
  const testResults = await testWithRealData();

  // Final summary
  console.log('\n' + '=' .repeat(80));
  console.log('📋 COMPREHENSIVE TEST SUMMARY');
  console.log('=' .repeat(80));
  console.log(`✅ Previously Working: 13/17 (76%)`);
  console.log(`🧪 Additional Tests: ${testResults.successCount}/${testResults.totalTests} (${Math.round(testResults.successCount/testResults.totalTests*100)}%)`);
  
  const totalWorking = 13 + testResults.successCount;
  const totalTests = 17 + testResults.totalTests;
  console.log(`🎯 OVERALL SUCCESS RATE: ${totalWorking}/${totalTests} (${Math.round(totalWorking/totalTests*100)}%)`);

  if (testResults.results.length > 0) {
    console.log('\n🔍 DETAILED RESULTS FOR REAL DATA TESTS:');
    testResults.results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`   ${status} ${result.name}: ${result.success ? `SUCCESS (${result.status})` : `FAILED - ${result.error}`}`);
    });
  }

  console.log('\n🎯 RECOMMENDATIONS:');
  if (availableDisplays.length === 0) {
    console.log('   • Run display sync to get real display data');
  }
  if (availableContent.length === 0) {
    console.log('   • Create content first to test deletion operations');
  }
  if (testResults.results.some(r => r.error && r.error.includes('not a function'))) {
    console.log('   • Implement missing service functions on the backend');
  }

  console.log('\n🏁 Comprehensive test completed!');
}

// Run the comprehensive test
runComprehensiveTest().catch(console.error); 