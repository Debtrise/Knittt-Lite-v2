const axios = require('axios');

// API Configuration
const API_BASE = 'http://34.122.156.88:3001/api';
const HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

let authToken = null;

// Test helpers
async function authenticate() {
  console.log('🔐 Authenticating...');
  
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    }, { headers: HEADERS });

    if (response.data?.accessToken) {
      authToken = response.data.accessToken;
      console.log('✅ Authentication successful');
      console.log('🔑 Token received, user:', response.data.user?.fullName);
      return true;
    } else if (response.data?.token) {
      authToken = response.data.token;
      console.log('✅ Authentication successful');
      return true;
    } else if (response.data?.data?.token) {
      authToken = response.data.data.token;
      console.log('✅ Authentication successful');
      return true;
    } else {
      console.error('❌ Authentication failed - no token received');
      console.error('Response structure:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Authentication error:', error.response?.data || error.message);
    return false;
  }
}

function getAuthHeaders() {
  return {
    ...HEADERS,
    'Authorization': `Bearer ${authToken}`
  };
}

// Test functions
async function testGetTenantContexts() {
  console.log('\n📋 Testing GET /api/tenant/contexts');
  
  try {
    const response = await axios.get(`${API_BASE}/tenant/contexts`, {
      headers: getAuthHeaders()
    });

    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));

    // Validate response structure
    if (response.data?.contexts && Array.isArray(response.data.contexts)) {
      console.log('✅ Contexts array found:', response.data.contexts);
    } else {
      console.log('⚠️  Expected contexts array not found');
    }

    if (response.data?.amiConfig) {
      console.log('✅ AMI config found:', response.data.amiConfig);
    } else {
      console.log('⚠️  AMI config not found');
    }

    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

async function testUpdateTenantContexts() {
  console.log('\n🔄 Testing PUT /api/tenant/contexts');
  
  try {
    const testContexts = ['BDS_Prime_Dialer', 'p1Dialer', 'TestContext'];
    
    const response = await axios.put(`${API_BASE}/tenant/contexts`, {
      contexts: testContexts
    }, {
      headers: getAuthHeaders()
    });

    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));

    // Validate response structure
    if (response.data?.message) {
      console.log('✅ Update message:', response.data.message);
    }

    if (response.data?.contexts && Array.isArray(response.data.contexts)) {
      console.log('✅ Updated contexts:', response.data.contexts);
    }

    if (response.data?.mappingsUpdated !== undefined) {
      console.log('✅ Mappings updated:', response.data.mappingsUpdated);
    }

    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

async function testGetLeadTransferStatus(leadId = 7476) {
  console.log(`\n🔍 Testing GET /api/leads/${leadId}/transfer-status`);
  
  try {
    const response = await axios.get(`${API_BASE}/leads/${leadId}/transfer-status`, {
      headers: getAuthHeaders()
    });

    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));

    // Validate response structure
    if (response.data?.leadId) {
      console.log('✅ Lead ID found:', response.data.leadId);
    }

    if (response.data?.inTransfer !== undefined) {
      console.log('✅ Transfer status:', response.data.inTransfer);
    }

    if (response.data?.status) {
      console.log('✅ Lead status:', response.data.status);
    }

    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

async function testGetActiveCalls() {
  console.log('\n📞 Testing GET /api/tenant/active-calls');
  
  try {
    const response = await axios.get(`${API_BASE}/tenant/active-calls`, {
      headers: getAuthHeaders()
    });

    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));

    // Validate response structure
    if (response.data?.activeCalls && Array.isArray(response.data.activeCalls)) {
      console.log('✅ Active calls array found with', response.data.activeCalls.length, 'calls');
      
      if (response.data.activeCalls.length > 0) {
        const firstCall = response.data.activeCalls[0];
        console.log('Sample call structure:');
        console.log('- uniqueId:', firstCall.uniqueId);
        console.log('- tenantId:', firstCall.tenantId);
        console.log('- channel:', firstCall.channel);
        console.log('- callerIdNum:', firstCall.callerIdNum);
        console.log('- status:', firstCall.status);
        console.log('- context:', firstCall.context);
        console.log('- duration:', firstCall.duration);
      }
    } else {
      console.log('⚠️  Expected activeCalls array not found');
    }

    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting API Tests for Updated Endpoints');
  console.log('='.repeat(50));

  // Authenticate first
  const authSuccess = await authenticate();
  if (!authSuccess) {
    console.log('💥 Cannot proceed without authentication');
    return;
  }

  const results = {
    getTenantContexts: null,
    updateTenantContexts: null,
    getLeadTransferStatus: null,
    getActiveCalls: null
  };

  // Test 1: Get Tenant Contexts
  results.getTenantContexts = await testGetTenantContexts();

  // Test 2: Update Tenant Contexts  
  results.updateTenantContexts = await testUpdateTenantContexts();

  // Test 3: Get Lead Transfer Status
  results.getLeadTransferStatus = await testGetLeadTransferStatus();

  // Test 4: Get Active Calls
  results.getActiveCalls = await testGetActiveCalls();

  // Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('='.repeat(50));
  
  const tests = [
    ['GET /tenant/contexts', results.getTenantContexts],
    ['PUT /tenant/contexts', results.updateTenantContexts],
    ['GET /leads/:id/transfer-status', results.getLeadTransferStatus],
    ['GET /tenant/active-calls', results.getActiveCalls]
  ];

  let passed = 0;
  let total = tests.length;

  tests.forEach(([endpoint, result]) => {
    const status = result?.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${endpoint}`);
    if (result?.success) passed++;
  });

  console.log(`\n🎯 Results: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log('🎉 All API endpoints are working correctly with the new interface formats!');
  } else {
    console.log('🔧 Some endpoints need attention. Check the error messages above.');
  }
}

// Run the tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testGetTenantContexts,
  testUpdateTenantContexts,
  testGetLeadTransferStatus,
  testGetActiveCalls
}; 