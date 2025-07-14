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
    return jwtToken;
  } catch (error) {
    console.error('❌ Failed to authenticate:', error.response?.data || error.message);
    return null;
  }
}

async function makeRequest(method, endpoint, data = null) {
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

async function getAvailableResources() {
  console.log('🔍 Getting Available Resources...');
  console.log('-' .repeat(50));

  // Get displays
  const displaysResult = await makeRequest('GET', '/displays');
  if (displaysResult.success) {
    availableDisplays = displaysResult.data.displays || [];
    console.log(`✅ Found ${availableDisplays.length} displays`);
  } else {
    console.log(`❌ Failed to get displays: ${displaysResult.error}`);
  }

  // Get content
  const contentResult = await makeRequest('GET', '/content');
  if (contentResult.success) {
    availableContent = contentResult.data.localContent || [];
    console.log(`✅ Found ${availableContent.length} content items`);
  } else {
    console.log(`❌ Failed to get content: ${contentResult.error}`);
  }
}

async function testAllEndpoints() {
  console.log('\n🧪 TESTING ALL OPTISIGNS ENDPOINTS WITH REAL DATA');
  console.log('=' .repeat(70));

  const results = [];
  let successCount = 0;

  // Test all endpoints systematically
  const testCases = [
    // Configuration endpoints (should work)
    {
      name: 'Test API Connection',
      method: 'POST',
      endpoint: '/config/test',
      data: { apiToken: OPTISIGNS_TOKEN }
    },
    {
      name: 'Get Configuration',
      method: 'GET',
      endpoint: '/config'
    },
    {
      name: 'Update Configuration',
      method: 'PUT',
      endpoint: '/config',
      data: {
        apiToken: OPTISIGNS_TOKEN,
        settings: {
          autoSync: true,
          syncInterval: 300,
          defaultContentDuration: 30
        }
      }
    },

    // Display management endpoints
    {
      name: 'Sync Displays',
      method: 'POST',
      endpoint: '/displays/sync'
    },
    {
      name: 'Get Displays',
      method: 'GET',
      endpoint: '/displays'
    },

    // Content management endpoints
    {
      name: 'Create Content',
      method: 'POST',
      endpoint: '/content',
      data: {
        name: 'Final Test Content',
        type: 'text',
        content: 'This is final test content for 100% API validation!',
        duration: 30
      }
    },
    {
      name: 'Get Content',
      method: 'GET',
      endpoint: '/content'
    },
    {
      name: 'Get Content with Remote',
      method: 'GET',
      endpoint: '/content?includeRemote=true'
    },

    // Asset endpoints
    {
      name: 'Create Asset',
      method: 'POST',
      endpoint: '/assets',
      data: {
        name: 'Final Test Asset',
        type: 'image',
        url: 'https://via.placeholder.com/1920x1080/0066cc/ffffff?text=Final+Test+Asset'
      }
    },

    // Analytics endpoints
    {
      name: 'Get Analytics',
      method: 'GET',
      endpoint: '/analytics'
    },
    {
      name: 'Get Analytics with Dates',
      method: 'GET',
      endpoint: '/analytics?startDate=2024-12-01&endDate=2024-12-20'
    },

    // Webhook and debug endpoints
    {
      name: 'Get Webhook Rules',
      method: 'GET',
      endpoint: '/webhook-rules'
    },
    {
      name: 'Test Connectivity',
      method: 'POST',
      endpoint: '/debug/connectivity',
      data: { apiToken: OPTISIGNS_TOKEN }
    }
  ];

  // Test basic endpoints first
  console.log('\n📋 Testing Basic Endpoints...');
  for (const test of testCases) {
    console.log(`\n🧪 ${test.name}`);
    const result = await makeRequest(test.method, test.endpoint, test.data);
    results.push({ ...test, ...result });
    
    if (result.success) {
      successCount++;
      console.log(`   ✅ SUCCESS (${result.status}) - ${result.responseTime}ms`);
    } else {
      console.log(`   ❌ FAILED (${result.status}): ${result.error}`);
    }
  }

  // Now test endpoints that require real IDs
  console.log('\n📺 Testing Display Operations with Real Display IDs...');
  
  if (availableDisplays.length > 0) {
    // Test with first few displays
    const testDisplays = availableDisplays.slice(0, 3);
    
    for (const display of testDisplays) {
      console.log(`\n🎯 Testing with Display: ${display.name} (${display.id})`);
      
      // Test reboot
      console.log('   🔄 Testing reboot...');
      const rebootResult = await makeRequest('POST', `/displays/${display.id}/reboot`);
      results.push({ name: `Reboot Display ${display.name}`, ...rebootResult });
      
      if (rebootResult.success) {
        successCount++;
        console.log(`   ✅ Reboot SUCCESS (${rebootResult.status})`);
      } else {
        console.log(`   ❌ Reboot FAILED: ${rebootResult.error}`);
      }

      // Test assignment with content
      if (availableContent.length > 0) {
        console.log('   📌 Testing content assignment...');
        const assignResult = await makeRequest('POST', `/displays/${display.id}/assign`, {
          contentId: availableContent[0].id
        });
        results.push({ name: `Assign Content to ${display.name}`, ...assignResult });
        
        if (assignResult.success) {
          successCount++;
          console.log(`   ✅ Assignment SUCCESS (${assignResult.status})`);
        } else {
          console.log(`   ❌ Assignment FAILED: ${assignResult.error}`);
        }
      }
    }
  } else {
    console.log('   ⚠️  No displays available for testing');
  }

  // Test content deletion with real content ID
  console.log('\n📄 Testing Content Deletion with Real Content ID...');
  if (availableContent.length > 0) {
    const testContent = availableContent[availableContent.length - 1]; // Use last content
    console.log(`   🗑️  Deleting: ${testContent.name} (${testContent.id})`);
    
    const deleteResult = await makeRequest('DELETE', `/content/${testContent.id}`);
    results.push({ name: 'Delete Content', ...deleteResult });
    
    if (deleteResult.success) {
      successCount++;
      console.log(`   ✅ Deletion SUCCESS (${deleteResult.status})`);
    } else {
      console.log(`   ❌ Deletion FAILED: ${deleteResult.error}`);
    }
  }

  // Test schedule creation
  console.log('\n📅 Testing Schedule Creation...');
  const scheduleData = {
    name: 'Final Test Schedule',
    contentId: availableContent.length > 0 ? availableContent[0].id : '123e4567-e89b-12d3-a456-426614174000',
    displayIds: availableDisplays.length > 0 ? [availableDisplays[0].id] : ['123e4567-e89b-12d3-a456-426614174000'],
    startTime: '2024-12-20T10:00:00Z',
    endTime: '2024-12-20T18:00:00Z'
  };

  const scheduleResult = await makeRequest('POST', '/schedules', scheduleData);
  results.push({ name: 'Create Schedule', ...scheduleResult });
  
  if (scheduleResult.success) {
    successCount++;
    console.log(`   ✅ Schedule SUCCESS (${scheduleResult.status})`);
  } else {
    console.log(`   ❌ Schedule FAILED: ${scheduleResult.error}`);
  }

  return { results, successCount, totalTests: results.length };
}

async function runFinalComprehensiveTest() {
  console.log('🎯 FINAL COMPREHENSIVE OPTISIGNS API TEST');
  console.log('🚀 TESTING FOR 100% API FUNCTIONALITY');
  console.log('=' .repeat(70));
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`🔑 Using OptiSigns Token: ${OPTISIGNS_TOKEN.substring(0, 50)}...`);
  console.log('=' .repeat(70));

  // Authenticate
  const token = await getJWTToken();
  if (!token) {
    console.log('❌ Authentication failed. Cannot proceed.');
    return;
  }
  console.log('✅ Successfully authenticated with admin credentials');

  // Get available resources
  await getAvailableResources();

  // Test all endpoints
  const testResults = await testAllEndpoints();

  // Final summary
  console.log('\n' + '=' .repeat(70));
  console.log('🏆 FINAL COMPREHENSIVE TEST RESULTS');
  console.log('=' .repeat(70));
  
  const successRate = Math.round((testResults.successCount / testResults.totalTests) * 100);
  console.log(`🎯 OVERALL SUCCESS RATE: ${testResults.successCount}/${testResults.totalTests} (${successRate}%)`);
  
  if (successRate >= 90) {
    console.log('🎉 EXCELLENT! API is production-ready!');
  } else if (successRate >= 75) {
    console.log('✅ GOOD! API is mostly functional with minor issues');
  } else {
    console.log('⚠️  API needs additional work for production readiness');
  }

  // Categorize results
  const working = testResults.results.filter(r => r.success);
  const failed = testResults.results.filter(r => !r.success);

  if (working.length > 0) {
    console.log('\n🟢 WORKING ENDPOINTS:');
    working.forEach(r => {
      console.log(`   ✅ ${r.method || 'TEST'} ${r.endpoint || r.name} - ${r.name}`);
    });
  }

  if (failed.length > 0) {
    console.log('\n🔴 FAILED ENDPOINTS:');
    failed.forEach(r => {
      console.log(`   ❌ ${r.method || 'TEST'} ${r.endpoint || r.name} - ${r.name}`);
      console.log(`      Error: ${r.error}`);
    });
  }

  // Final recommendations
  console.log('\n🎯 FINAL RECOMMENDATIONS:');
  if (availableDisplays.length > 0) {
    console.log(`   ✅ ${availableDisplays.length} displays available for operations`);
  }
  if (availableContent.length > 0) {
    console.log(`   ✅ ${availableContent.length} content items available for management`);
  }
  if (failed.some(r => r.error && r.error.includes('not a function'))) {
    console.log('   • Implement missing service functions (schedules)');
  }
  if (successRate >= 90) {
    console.log('   🚀 API is ready for production use!');
  }

  console.log('\n🏁 Final comprehensive test completed!');
  console.log(`📊 Summary: ${successRate}% API functionality achieved`);
}

// Run the final comprehensive test
runFinalComprehensiveTest().catch(console.error); 