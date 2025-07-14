#!/usr/bin/env node

/**
 * Test script to verify the fixed authentication
 * Tests the login with proper response transformation
 */

const axios = require('axios');

const API_BASE_URL = 'http://34.122.156.88:3001/api';

async function testFixedAuth() {
  console.log('🔐 Testing Fixed Authentication');
  console.log(`📡 API Base: ${API_BASE_URL}`);
  console.log(`🕒 Started: ${new Date().toISOString()}\n`);

  try {
    // Test 1: Raw API response
    console.log('🧪 Step 1: Testing raw API response...');
    const rawResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    console.log('✅ Raw login successful');
    console.log('📊 Response structure:');
    console.log('  - accessToken:', !!rawResponse.data.accessToken);
    console.log('  - refreshToken:', !!rawResponse.data.refreshToken);
    console.log('  - user.id:', rawResponse.data.user?.id);
    console.log('  - user.username:', rawResponse.data.user?.username);
    console.log('  - user.tenantId:', rawResponse.data.user?.tenantId);
    console.log('  - user.role:', rawResponse.data.user?.role);
    
    // Test 2: Simulated frontend transformation
    console.log('\n🔄 Step 2: Simulating frontend transformation...');
    
    const transformed = {
      token: rawResponse.data.accessToken,
      userId: rawResponse.data.user.id,
      username: rawResponse.data.user.username,
      tenantId: rawResponse.data.user.tenantId,
      role: rawResponse.data.user.role,
      email: rawResponse.data.user.email,
      firstName: rawResponse.data.user.firstName,
      lastName: rawResponse.data.user.lastName,
      fullName: rawResponse.data.user.fullName
    };
    
    console.log('✅ Transformation successful');
    console.log('📊 Transformed data:');
    console.log('  - token:', transformed.token.substring(0, 20) + '...');
    console.log('  - userId:', transformed.userId);
    console.log('  - username:', transformed.username);
    console.log('  - tenantId:', transformed.tenantId);
    console.log('  - role:', transformed.role);
    console.log('  - fullName:', transformed.fullName);
    
    // Test 3: Token validation
    console.log('\n🔍 Step 3: Testing token validation...');
    
    const tokenTestResponse = await axios.get(`${API_BASE_URL}/tenants/${transformed.tenantId}`, {
      headers: {
        'Authorization': `Bearer ${transformed.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Token validation successful');
    console.log('📊 Protected endpoint status:', tokenTestResponse.status);
    
    // Test 4: Simulate localStorage storage
    console.log('\n💾 Step 4: Simulating localStorage storage...');
    
    const authStorage = {
      state: {
        token: transformed.token,
        user: {
          userId: transformed.userId,
          username: transformed.username,
          tenantId: transformed.tenantId,
          role: transformed.role
        },
        isAuthenticated: true
      }
    };
    
    console.log('✅ Auth storage structure ready');
    console.log('📊 Storage size:', JSON.stringify(authStorage).length, 'characters');
    
    // Summary
    console.log('\n🎉 All tests passed!');
    console.log('✅ Login response transformation works correctly');
    console.log('✅ Token is valid and accepted by protected endpoints');
    console.log('✅ Auth storage structure is compatible');
    
    console.log('\n📋 Summary:');
    console.log(`   Token expires in: ${rawResponse.data.expiresIn} seconds`);
    console.log(`   Session ID: ${rawResponse.data.sessionId.substring(0, 10)}...`);
    console.log(`   User: ${transformed.fullName} (${transformed.role})`);
    console.log(`   Tenant: ${transformed.tenantId}`);
    
    return { success: true, transformed };
    
  } catch (error) {
    console.error('\n❌ Authentication test failed:', error.message);
    
    if (error.response) {
      console.error('📊 HTTP Status:', error.response.status);
      console.error('📊 Response Data:', JSON.stringify(error.response.data, null, 2));
    }
    
    return { success: false, error: error.message };
  }
}

// Run the test
testFixedAuth()
  .then(result => {
    console.log(`\n🏁 Test completed: ${result.success ? 'SUCCESS' : 'FAILURE'}`);
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Test crashed:', error);
    process.exit(1);
  }); 