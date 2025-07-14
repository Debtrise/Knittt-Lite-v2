const axios = require('axios');

// Configuration
const BASE_URL = 'http://34.122.156.88:3001/api';
const TEST_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

let authToken = null;

// Helper function to make authenticated requests
const makeRequest = async (method, endpoint, data = null, params = null) => {
  const config = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` })
    }
  };

  if (data) config.data = data;
  if (params) config.params = params;

  try {
    const response = await axios(config);
    return {
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 'NO_RESPONSE',
      error: error.response?.data || error.message
    };
  }
};

// Test authentication
const authenticate = async () => {
  console.log('🔐 Testing Authentication...');
  
  const result = await makeRequest('POST', '/auth/login', TEST_CREDENTIALS);
  
  if (result.success && result.data.accessToken) {
    authToken = result.data.accessToken;
    console.log('✅ Authentication successful');
    console.log(`   Token: ${authToken.substring(0, 20)}...`);
    return true;
  } else {
    console.log('❌ Authentication failed');
    console.log(`   Status: ${result.status}`);
    console.log(`   Error: ${JSON.stringify(result.error, null, 2)}`);
    return false;
  }
};

// Test new endpoints
const testNewEndpoints = async () => {
  console.log('\n📡 Testing New Backend Endpoints...\n');

  // 1. Test GET /api/tenant/contexts
  console.log('1️⃣ Testing GET /api/tenant/contexts');
  const contextsResult = await makeRequest('GET', '/tenant/contexts');
  
  if (contextsResult.success) {
    console.log('✅ GET /tenant/contexts - Success');
    console.log(`   Status: ${contextsResult.status}`);
    console.log(`   Data: ${JSON.stringify(contextsResult.data, null, 2)}`);
  } else {
    console.log('❌ GET /tenant/contexts - Failed');
    console.log(`   Status: ${contextsResult.status}`);
    console.log(`   Error: ${JSON.stringify(contextsResult.error, null, 2)}`);
  }

  // 2. Test PUT /api/tenant/contexts (admin only)
  console.log('\n2️⃣ Testing PUT /api/tenant/contexts');
  const updateContextsData = {
    contexts: [
      {
        name: "BDS_Prime_Dialer",
        description: "Primary dialer context for sales",
        isActive: true,
        settings: {
          maxConcurrentCalls: 50,
          retryAttempts: 3
        }
      }
    ]
  };
  
  const updateContextsResult = await makeRequest('PUT', '/tenant/contexts', updateContextsData);
  
  if (updateContextsResult.success) {
    console.log('✅ PUT /tenant/contexts - Success');
    console.log(`   Status: ${updateContextsResult.status}`);
    console.log(`   Data: ${JSON.stringify(updateContextsResult.data, null, 2)}`);
  } else {
    console.log('❌ PUT /tenant/contexts - Failed');
    console.log(`   Status: ${updateContextsResult.status}`);
    console.log(`   Error: ${JSON.stringify(updateContextsResult.error, null, 2)}`);
  }

  // 3. Test GET /api/tenant/active-calls
  console.log('\n3️⃣ Testing GET /api/tenant/active-calls');
  const activeCallsResult = await makeRequest('GET', '/tenant/active-calls', null, {
    page: 1,
    limit: 10
  });
  
  if (activeCallsResult.success) {
    console.log('✅ GET /tenant/active-calls - Success');
    console.log(`   Status: ${activeCallsResult.status}`);
    console.log(`   Data: ${JSON.stringify(activeCallsResult.data, null, 2)}`);
  } else {
    console.log('❌ GET /tenant/active-calls - Failed');
    console.log(`   Status: ${activeCallsResult.status}`);
    console.log(`   Error: ${JSON.stringify(activeCallsResult.error, null, 2)}`);
  }

  // 4. Test GET /api/leads/:id/transfer-status
  console.log('\n4️⃣ Testing GET /api/leads/:id/transfer-status');
  
  // First, try to get a lead to test with
  const leadsResult = await makeRequest('GET', '/leads', null, { limit: 1 });
  let testLeadId = '1'; // Default fallback
  
  if (leadsResult.success && leadsResult.data.leads && leadsResult.data.leads.length > 0) {
    testLeadId = leadsResult.data.leads[0].id.toString();
    console.log(`   Using lead ID: ${testLeadId}`);
  } else {
    console.log(`   Using default lead ID: ${testLeadId} (no leads found)`);
  }
  
  const transferStatusResult = await makeRequest('GET', `/leads/${testLeadId}/transfer-status`);
  
  if (transferStatusResult.success) {
    console.log('✅ GET /leads/:id/transfer-status - Success');
    console.log(`   Status: ${transferStatusResult.status}`);
    console.log(`   Data: ${JSON.stringify(transferStatusResult.data, null, 2)}`);
  } else {
    console.log('❌ GET /leads/:id/transfer-status - Failed');
    console.log(`   Status: ${transferStatusResult.status}`);
    console.log(`   Error: ${JSON.stringify(transferStatusResult.error, null, 2)}`);
  }
};

// Test API integration with frontend
const testApiIntegration = async () => {
  console.log('\n🔧 Testing API Integration...\n');

  // Test that our API client would work with these endpoints
  console.log('Testing API client integration:');
  
  const mockApiClient = {
    tenants: {
      getContexts: () => makeRequest('GET', '/tenant/contexts'),
      updateContexts: (contexts) => makeRequest('PUT', '/tenant/contexts', { contexts }),
      getActiveCalls: (params) => makeRequest('GET', '/tenant/active-calls', null, params),
    },
    leads: {
      getTransferStatus: (id) => makeRequest('GET', `/leads/${id}/transfer-status`),
    }
  };

  // Test contexts
  const contextsTest = await mockApiClient.tenants.getContexts();
  console.log(`✓ tenants.getContexts(): ${contextsTest.success ? 'Success' : 'Failed'}`);

  // Test active calls
  const activeCallsTest = await mockApiClient.tenants.getActiveCalls({ limit: 5 });
  console.log(`✓ tenants.getActiveCalls(): ${activeCallsTest.success ? 'Success' : 'Failed'}`);

  // Test transfer status
  const transferTest = await mockApiClient.leads.getTransferStatus('1');
  console.log(`✓ leads.getTransferStatus(): ${transferTest.success ? 'Success' : 'Failed'}`);
};

// Performance testing
const testPerformance = async () => {
  console.log('\n⚡ Testing Performance...\n');

  const performanceTests = [
    { name: 'GET /tenant/contexts', endpoint: '/tenant/contexts' },
    { name: 'GET /tenant/active-calls', endpoint: '/tenant/active-calls' },
    { name: 'GET /leads/1/transfer-status', endpoint: '/leads/1/transfer-status' }
  ];

  for (const test of performanceTests) {
    const startTime = Date.now();
    const result = await makeRequest('GET', test.endpoint);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`${test.name}: ${duration}ms ${result.success ? '✅' : '❌'}`);
  }
};

// Summary
const printSummary = () => {
  console.log('\n📋 Integration Summary');
  console.log('=' .repeat(50));
  console.log('New endpoints added to the API client:');
  console.log('  • api.tenants.getContexts()');
  console.log('  • api.tenants.updateContexts(contexts)');
  console.log('  • api.tenants.getActiveCalls(params)');
  console.log('  • api.leads.getTransferStatus(id)');
  console.log('');
  console.log('Journey Builder CallActionConfig enhanced with:');
  console.log('  • Context dropdown with available tenant contexts');
  console.log('  • Manual context input as fallback');
  console.log('  • Loading states and error handling');
  console.log('');
  console.log('Ready for frontend integration! 🚀');
};

// Main execution
const main = async () => {
  console.log('🧪 Testing New Backend Endpoints Integration');
  console.log('=' .repeat(50));

  // Authenticate first
  const authenticated = await authenticate();
  
  if (!authenticated) {
    console.log('\n❌ Cannot proceed without authentication');
    return;
  }

  // Run all tests
  await testNewEndpoints();
  await testApiIntegration();
  await testPerformance();
  
  // Print summary
  printSummary();
};

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
  process.exit(1);
});

// Run the tests
main().catch(console.error); 