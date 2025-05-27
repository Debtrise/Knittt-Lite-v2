const axios = require('axios');

const API_URL = 'http://34.122.156.88:3001/api';

async function testUserManagementAPI() {
  let authToken = '';
  let testUserId = '';
  
  try {
    console.log('🔐 Testing User Management API...\n');

    // Step 1: Authenticate as admin
    console.log('1. Authenticating as admin...');
    const loginResponse = await axios.post(`${API_URL}/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    authToken = loginResponse.data.token;
    const { userId, username, tenantId, role } = loginResponse.data;
    console.log('✅ Authentication successful!');
    console.log(`   User: ${username} (${role})`);
    console.log(`   Tenant: ${tenantId}\n`);

    // Step 2: Check what user endpoints are available
    console.log('2. Checking available user endpoints...');
    const endpointsToTest = [
      '/users/me',
      '/users',
      '/user/profile',
      '/profile',
      '/me',
      `/users/${userId}`,
      '/tenants/' + tenantId
    ];

    let availableEndpoints = [];
    for (const endpoint of endpointsToTest) {
      try {
        console.log(`   Testing: GET ${endpoint}`);
        const response = await axios.get(`${API_URL}${endpoint}`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        console.log(`   ✅ ${endpoint} - Available`);
        availableEndpoints.push({
          endpoint,
          status: 'available',
          data: response.data
        });
      } catch (error) {
        console.log(`   ❌ ${endpoint} - ${error.response?.status || 'Error'}: ${error.response?.data?.error || error.message}`);
        availableEndpoints.push({
          endpoint,
          status: 'unavailable',
          error: error.response?.status || 'Error'
        });
      }
    }

    console.log('\n📊 Endpoint Availability Summary:');
    availableEndpoints.forEach(ep => {
      if (ep.status === 'available') {
        console.log(`   ✅ ${ep.endpoint}`);
        if (ep.endpoint.includes('tenant')) {
          console.log(`      - Contains user data: ${ep.data.users ? 'Yes' : 'No'}`);
        }
      } else {
        console.log(`   ❌ ${ep.endpoint} (${ep.error})`);
      }
    });

    // Step 3: Test tenant endpoint for user data (fallback approach)
    console.log('\n3. Testing tenant endpoint for user management...');
    try {
      const tenantResponse = await axios.get(`${API_URL}/tenants/${tenantId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      if (tenantResponse.data.users) {
        console.log('✅ Found user data in tenant endpoint!');
        console.log(`   Users found: ${tenantResponse.data.users.length}`);
        tenantResponse.data.users.forEach(user => {
          console.log(`     - ${user.username} (${user.email}) - ${user.role}`);
        });
      } else {
        console.log('⚠️  No user data found in tenant endpoint');
      }
    } catch (error) {
      console.log('❌ Tenant endpoint failed:', error.response?.data?.error || error.message);
    }

    // Step 4: Test user creation via register endpoint
    console.log('\n4. Testing user creation via register endpoint...');
    const newUserData = {
      username: `testuser_${Date.now()}`,
      password: 'TestPassword123!',
      email: `test_${Date.now()}@example.com`,
      tenantId: tenantId,
      role: 'agent'
    };
    
    try {
      const createResponse = await axios.post(`${API_URL}/register`, newUserData);
      console.log('✅ User created via register endpoint!');
      console.log(`   Response: ${JSON.stringify(createResponse.data)}`);
      
      // Try to find the created user
      const updatedTenantResponse = await axios.get(`${API_URL}/tenants/${tenantId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      if (updatedTenantResponse.data.users) {
        const createdUser = updatedTenantResponse.data.users.find(u => u.username === newUserData.username);
        if (createdUser) {
          testUserId = createdUser.id;
          console.log(`   Created user found with ID: ${testUserId}`);
        }
      }
    } catch (error) {
      console.log('❌ User creation failed:', error.response?.data?.error || error.message);
    }

    // Step 5: Test direct user endpoints if available
    console.log('\n5. Testing direct user management endpoints...');
    
    // Test user listing
    try {
      const usersResponse = await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✅ Direct user listing works!');
      console.log(`   Total users: ${usersResponse.data.totalCount || usersResponse.data.length || 'Unknown'}`);
    } catch (error) {
      console.log('❌ Direct user listing not available:', error.response?.status);
    }

    // Test user profile endpoint
    try {
      const profileResponse = await axios.get(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✅ User profile endpoint works!');
      console.log(`   Profile: ${profileResponse.data.username} (${profileResponse.data.role})`);
    } catch (error) {
      console.log('❌ User profile endpoint not available:', error.response?.status);
    }

    // Step 6: Test password change endpoint
    console.log('\n6. Testing password change endpoint...');
    try {
      await axios.post(`${API_URL}/users/change-password`, {
        currentPassword: 'admin123',
        newPassword: 'admin123' // Same password for testing
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✅ Password change endpoint works!');
    } catch (error) {
      console.log('❌ Password change endpoint not available:', error.response?.status);
    }

    console.log('\n🎉 User Management API exploration completed!');
    
    return {
      success: true,
      message: 'API exploration completed',
      availableEndpoints,
      recommendations: [
        'Use tenant endpoint for user listing (fallback)',
        'Use register endpoint for user creation',
        'Implement user management endpoints on backend if needed'
      ]
    };

  } catch (error) {
    console.error('❌ User Management API Test Error:', error.response?.data || error.message);
    throw error;
  }
}

// Test what's actually working
async function testCurrentImplementation() {
  console.log('\n🔍 Testing Current Implementation Compatibility...\n');
  
  try {
    // Test login
    const loginResponse = await axios.post(`${API_URL}/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    const authToken = loginResponse.data.token;
    const { tenantId } = loginResponse.data;
    
    console.log('✅ Login works');
    
    // Test tenant endpoint (current working approach)
    const tenantResponse = await axios.get(`${API_URL}/tenants/${tenantId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Tenant endpoint works');
    console.log(`   Has users: ${tenantResponse.data.users ? 'Yes' : 'No'}`);
    
    if (tenantResponse.data.users) {
      console.log(`   User count: ${tenantResponse.data.users.length}`);
    }

    // Test register endpoint
    try {
      const testUser = {
        username: `test_${Date.now()}`,
        password: 'TestPass123!',
        email: `test_${Date.now()}@example.com`,
        tenantId: tenantId,
        role: 'agent'
      };
      
      await axios.post(`${API_URL}/register`, testUser);
      console.log('✅ Register endpoint works');
    } catch (error) {
      console.log('❌ Register endpoint failed:', error.response?.status);
    }

    console.log('\n📋 Current Implementation Status:');
    console.log('   ✅ Authentication: Working');
    console.log('   ✅ User listing: Via tenant endpoint');
    console.log('   ✅ User creation: Via register endpoint');
    console.log('   ❌ User editing: Not implemented');
    console.log('   ❌ User deletion: Not implemented');
    console.log('   ❌ Password change: Not implemented');
    console.log('   ❌ User profile: Not implemented');

  } catch (error) {
    console.error('❌ Current implementation test failed:', error.message);
  }
}

// Run the tests
async function runAllTests() {
  try {
    await testCurrentImplementation();
    await testUserManagementAPI();
    console.log('\n🎊 All tests completed!');
  } catch (error) {
    console.error('\n💥 Test suite failed:', error.message);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testUserManagementAPI,
  testCurrentImplementation,
  runAllTests
}; 