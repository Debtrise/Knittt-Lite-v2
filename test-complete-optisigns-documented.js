#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://34.122.156.88:3001/api/optisigns';

// Authentication credentials
const LOGIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

// OptiSigns API Token (provided by user)
const OPTISIGNS_TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJ4RGRuREpOdXVQMmJEb2pudyIsImNpZCI6Ilk2S0QyeUpjZ1hRZjZOU2JvIiwiYWlkIjoicWh6UjRDUXlrTGRKd0RibjgiLCJpYXQiOjE3NTA0NDcyMTMsImV4cCI6MTc1MDQ1MDgxMywiaXNzIjoicWh6UjRDUXlrTGRKd0RibjgifQ.zWYHOHFFtZ7xaNDlUP88sUAFRFYOgMgv-g11532DmHAjIV0uTJR91i_VAJNsCGLBIRYpfdmAxrL1Mwzh3cj69Mj-1EN1oEuiGQpwVExDCzAgb2tyO49UWV4X7RjaCizwPdOLweKZ-UXWBKX4rImGQDrd6TWl4hIOUuY4NnAk-JlULwnMIo3VKrYKsCzTXaPSjXPWkTsnQMTt8d6QAr024Owgy3numT_vdv3waZ_PPTKxhrR3hNRIGijjJaki0URk8TMWo3Ji-xVZ3rmJxS5d1G-9Mj2RIQuJTH-a41Cz-_X6uZJRe6OSaxf_9BoYxgK2AxalaTKrFXAp7tNDSraA1YvHjb8GqH-jtIDi_Q1mWPLlWSVHKYrdRsbpWPqmLOQQFhUgCgBHxE54ic8vlNFcXwtFHl-5TC29zXQCyZNvAQNm-i-VCeC_4UbhrEDhgtemPHZw7Yc4L-4rKlIbvno-1dZasaDzHwLaK6t4ym97I2UtmQWsSl6qXV_yegapNcbQL_Y4PoG14Qavy3FI3h2iOZSncGM22Ca6wbuPaKKdhAO2wBGQsOs4n4Cg-4_hODNKCHRc18qvCQK5gBqd0aeUYQ98p7c85G57rLE3SK1fDyaXCAHFYZKdgUUUFcVTOCzoaMyYIqh_-p6sHYLR_Y9sOWkjSDl7yBZSNERIxq73uXQ';

// Test configuration
let jwtToken = null;

// Utility function to get JWT token
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

// Test endpoints with proper authentication
const testEndpoints = [
  // Configuration endpoints
  {
    name: 'Test API Connection',
    method: 'POST',
    endpoint: '/config/test',
    requiresOptisignsToken: true,
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
    requiresOptisignsToken: true,
    data: {
      apiToken: OPTISIGNS_TOKEN,
      settings: {
        autoSync: true,
        syncInterval: 300,
        defaultContentDuration: 30
      }
    }
  },
  
  // Display management
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
  {
    name: 'Reboot Display',
    method: 'POST',
    endpoint: '/displays/550e8400-e29b-41d4-a716-446655440000/reboot'
  },
  {
    name: 'Assign Display',
    method: 'POST',
    endpoint: '/displays/550e8400-e29b-41d4-a716-446655440000/assign',
    data: { contentId: 'test-content-id' }
  },
  
  // Content management
  {
    name: 'Create Content',
    method: 'POST',
    endpoint: '/content',
    data: {
      name: 'Test Content',
      type: 'text',
      content: 'Hello World!',
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
  {
    name: 'Delete Content',
    method: 'DELETE',
    endpoint: '/content/test-content-id'
  },
  
  // Assets
  {
    name: 'Create Asset',
    method: 'POST',
    endpoint: '/assets',
    requiresOptisignsToken: true,
    data: {
      name: 'Test Asset',
      type: 'image',
      url: 'https://example.com/image.jpg'
    }
  },
  
  // Analytics
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
  
  // Schedules
  {
    name: 'Create Schedule',
    method: 'POST',
    endpoint: '/schedules',
    data: {
      name: 'Test Schedule',
      contentId: 'test-content-id',
      displayIds: ['test-display-id'],
      startTime: '2024-12-20T10:00:00Z',
      endTime: '2024-12-20T18:00:00Z'
    }
  },
  
  // Webhook rules
  {
    name: 'Get Webhook Rules',
    method: 'GET',
    endpoint: '/webhook-rules'
  },
  
  // Debug
  {
    name: 'Test Connectivity',
    method: 'POST',
    endpoint: '/debug/connectivity',
    requiresOptisignsToken: true,
    data: { apiToken: OPTISIGNS_TOKEN }
  }
];

async function testEndpoint(test) {
  const token = await getJWTToken();
  if (!token) {
    return { success: false, error: 'Failed to get JWT token' };
  }

  const config = {
    method: test.method,
    url: `${BASE_URL}${test.endpoint}`,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  if (test.data) {
    config.data = test.data;
  }

  try {
    const startTime = Date.now();
    const response = await axios(config);
    const responseTime = Date.now() - startTime;
    
    return {
      success: true,
      status: response.status,
      responseTime,
      data: response.data,
      dataSize: JSON.stringify(response.data).length
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

async function runTests() {
  console.log('🚀 Starting Complete OptiSigns API Test with OptiSigns Token');
  console.log('=' .repeat(80));
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`🔑 Using OptiSigns Token: ${OPTISIGNS_TOKEN.substring(0, 50)}...`);
  console.log('=' .repeat(80));

  const results = [];
  let successCount = 0;
  let totalTests = testEndpoints.length;

  for (const test of testEndpoints) {
    console.log(`\n🧪 Testing: ${test.name}`);
    console.log(`   ${test.method} ${test.endpoint}`);
    
    if (test.requiresOptisignsToken) {
      console.log(`   🔑 Using OptiSigns API Token`);
    }

    const result = await testEndpoint(test);
    results.push({ ...test, ...result });

    if (result.success) {
      successCount++;
      console.log(`   ✅ SUCCESS (${result.status}) - ${result.responseTime}ms`);
      
      // Show data summary for successful requests
      if (result.data) {
        if (Array.isArray(result.data)) {
          console.log(`   📊 Returned ${result.data.length} items`);
        } else if (typeof result.data === 'object') {
          const keys = Object.keys(result.data);
          console.log(`   📊 Response keys: ${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''}`);
        }
      }
    } else {
      console.log(`   ❌ FAILED (${result.status}): ${result.error}`);
    }
  }

  // Summary
  console.log('\n' + '=' .repeat(80));
  console.log('📋 TEST SUMMARY');
  console.log('=' .repeat(80));
  console.log(`✅ Successful: ${successCount}/${totalTests} (${Math.round(successCount/totalTests*100)}%)`);
  console.log(`❌ Failed: ${totalTests - successCount}/${totalTests}`);

  // Categorize results
  const working = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  if (working.length > 0) {
    console.log('\n🟢 WORKING ENDPOINTS:');
    working.forEach(r => {
      console.log(`   ✅ ${r.method} ${r.endpoint} - ${r.name}`);
    });
  }

  if (failed.length > 0) {
    console.log('\n🔴 FAILED ENDPOINTS:');
    failed.forEach(r => {
      console.log(`   ❌ ${r.method} ${r.endpoint} - ${r.name}`);
      console.log(`      Error: ${r.error}`);
    });
  }

  // Analyze failure patterns
  console.log('\n📊 FAILURE ANALYSIS:');
  const errorTypes = {};
  failed.forEach(r => {
    const errorKey = r.error.split(':')[0] || r.error;
    errorTypes[errorKey] = (errorTypes[errorKey] || 0) + 1;
  });

  Object.entries(errorTypes).forEach(([error, count]) => {
    console.log(`   • ${error}: ${count} endpoint(s)`);
  });

  console.log('\n🎯 RECOMMENDATIONS:');
  if (failed.some(r => r.error.includes('JWT token validation failed'))) {
    console.log('   • Some endpoints still have JWT token validation issues');
  }
  if (failed.some(r => r.error.includes('404'))) {
    console.log('   • Several endpoints return 404 (not implemented)');
  }
  if (failed.some(r => r.error.includes('invalid input syntax for type uuid'))) {
    console.log('   • Display endpoints need valid UUIDs');
  }
  if (failed.some(r => r.error.includes('Cannot read properties'))) {
    console.log('   • Database model issues need to be fixed');
  }

  console.log('\n🏁 Test completed!');
}

// Run the tests
runTests().catch(console.error);

module.exports = { getJWTToken, testEndpoints }; 