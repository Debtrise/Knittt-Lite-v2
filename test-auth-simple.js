#!/usr/bin/env node

/**
 * Simple Authentication Test Script
 * Quick test of login functionality using external IP 34.122.156.88:3001
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://34.122.156.88:3001/api';
const LOGIN_URL = 'http://34.122.156.88:3001/api/auth/login';

// Test credentials to try
const CREDENTIALS = [
  { username: 'admin', password: 'admin123' },
  { username: 'admin', password: 'admin' },
  { username: 'test', password: 'test123' },
  { username: 'demo', password: 'demo123' }
];

async function testLogin() {
  console.log('🔐 Simple Authentication Test');
  console.log(`📡 Testing against: ${API_BASE_URL}`);
  console.log(`🕒 Started at: ${new Date().toISOString()}\n`);

  for (const cred of CREDENTIALS) {
    try {
      console.log(`🔍 Testing login with: ${cred.username} / ${cred.password}`);
      console.log(`📍 URL: ${LOGIN_URL}`);
      
      const startTime = Date.now();
      const response = await axios.post(LOGIN_URL, {
        username: cred.username,
        password: cred.password
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const duration = Date.now() - startTime;
      
      if (response.data && response.data.token) {
        console.log(`✅ SUCCESS! Login successful for ${cred.username}`);
        console.log(`⏱️  Response time: ${duration}ms`);
        console.log(`🔑 Token received: ${response.data.token.substring(0, 30)}...`);
        
        if (response.data.userId) console.log(`👤 User ID: ${response.data.userId}`);
        if (response.data.username) console.log(`👤 Username: ${response.data.username}`);
        if (response.data.tenantId) console.log(`🏢 Tenant ID: ${response.data.tenantId}`);
        if (response.data.role) console.log(`🎭 Role: ${response.data.role}`);
        
        // Test the token with a protected endpoint
        console.log(`\n🔍 Testing token with protected endpoint...`);
        try {
          const testResponse = await axios.get(`${API_BASE_URL}/tenants/${response.data.tenantId}`, {
            headers: {
              'Authorization': `Bearer ${response.data.token}`,
              'Content-Type': 'application/json'
            },
            timeout: 5000
          });
          
          console.log(`✅ Token validation successful - Status: ${testResponse.status}`);
          console.log(`📊 Protected endpoint accessible`);
          
        } catch (tokenError) {
          console.log(`❌ Token validation failed: ${tokenError.message}`);
          if (tokenError.response) {
            console.log(`📊 Status: ${tokenError.response.status}`);
          }
        }
        
        console.log(`\n🎉 Authentication test PASSED for ${cred.username}!`);
        return { success: true, credentials: cred, token: response.data.token, userInfo: response.data };
        
      } else {
        console.log(`❌ FAILED! No token in response for ${cred.username}`);
        console.log(`📊 Response: ${JSON.stringify(response.data)}`);
      }
      
    } catch (error) {
      console.log(`❌ FAILED! Login error for ${cred.username}: ${error.message}`);
      
      if (error.response) {
        console.log(`📊 HTTP Status: ${error.response.status}`);
        console.log(`📊 Response: ${JSON.stringify(error.response.data)}`);
      } else if (error.code === 'ECONNREFUSED') {
        console.log(`🔌 Connection refused - server may be down`);
      } else if (error.code === 'ETIMEDOUT') {
        console.log(`⏰ Request timed out - server may be slow or unreachable`);
      }
    }
    
    console.log(''); // Empty line between tests
  }
  
  console.log(`❌ All login attempts failed!`);
  return { success: false };
}

// Test invalid credentials (negative test)
async function testInvalidCredentials() {
  console.log(`\n🚫 Testing invalid credentials (negative test)...`);
  
  try {
    const response = await axios.post(LOGIN_URL, {
      username: 'invalid_user',
      password: 'invalid_pass'
    }, {
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`⚠️  WARNING: Invalid credentials were accepted! This may be a security issue.`);
    console.log(`📊 Response: ${JSON.stringify(response.data)}`);
    
  } catch (error) {
    if (error.response && (error.response.status === 401 || error.response.status === 400)) {
      console.log(`✅ GOOD: Invalid credentials correctly rejected (${error.response.status})`);
    } else {
      console.log(`❌ Unexpected error: ${error.message}`);
    }
  }
}

// Test server connectivity
async function testConnectivity() {
  console.log(`🔍 Testing server connectivity...`);
  
  try {
    // Try to reach any endpoint to test basic connectivity
    const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
    console.log(`✅ Server is reachable - Status: ${response.status}`);
    return true;
  } catch (error) {
    if (error.response) {
      console.log(`⚠️  Server responded but health endpoint returned: ${error.response.status}`);
      return true; // Server is reachable
    } else {
      console.log(`❌ Cannot reach server: ${error.message}`);
      if (error.code === 'ECONNREFUSED') {
        console.log(`🔌 Connection refused - check if server is running on ${API_BASE_URL}`);
      } else if (error.code === 'ETIMEDOUT') {
        console.log(`⏰ Connection timed out - check network connectivity`);
      }
      return false;
    }
  }
}

// Main execution
async function main() {
  try {
    // Test basic connectivity first
    const isConnected = await testConnectivity();
    if (!isConnected) {
      console.log(`\n❌ Cannot connect to server. Exiting.`);
      process.exit(1);
    }
    
    // Test authentication
    const authResult = await testLogin();
    
    // Test invalid credentials
    await testInvalidCredentials();
    
    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📋 Test Summary:`);
    console.log(`   Server: ${API_BASE_URL}`);
    console.log(`   Authentication: ${authResult.success ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (authResult.success) {
      console.log(`   Working Credentials: ${authResult.credentials.username} / ${authResult.credentials.password}`);
      console.log(`   Token: ${authResult.token.substring(0, 20)}...`);
    }
    
    console.log(`   Completed: ${new Date().toISOString()}`);
    console.log(`${'='.repeat(60)}`);
    
    // Exit with appropriate code
    process.exit(authResult.success ? 0 : 1);
    
  } catch (error) {
    console.error(`\n❌ Test script failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Help message
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Simple Authentication Test Script

Usage: node test-auth-simple.js

This script tests basic login functionality against the API server.

Options:
  --help, -h    Show this help message

Environment Variables:
  None required - uses hardcoded external IP 34.122.156.88:3001

Examples:
  node test-auth-simple.js
`);
  process.exit(0);
}

// Run the test
main(); 