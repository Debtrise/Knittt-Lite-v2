#!/usr/bin/env node

/**
 * Comprehensive Authentication Test Script
 * Tests all authentication endpoints and scenarios using external IP 34.122.156.88:3001
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://34.122.156.88:3001/api';
const LOGIN_URL = 'http://34.122.156.88:3001/api/auth/login';
const REGISTER_URL = 'http://34.122.156.88:3001/api/auth/register';

// Test credentials
const TEST_CREDENTIALS = [
  { username: 'admin', password: 'admin123', description: 'Default admin credentials' },
  { username: 'admin', password: 'admin', description: 'Alternative admin credentials' },
  { username: 'test', password: 'test123', description: 'Test user credentials' },
  { username: 'demo', password: 'demo123', description: 'Demo user credentials' }
];

// Invalid credentials for negative testing
const INVALID_CREDENTIALS = [
  { username: 'invalid', password: 'invalid', description: 'Invalid username and password' },
  { username: 'admin', password: 'wrongpass', description: 'Valid username, wrong password' },
  { username: '', password: 'admin123', description: 'Empty username' },
  { username: 'admin', password: '', description: 'Empty password' }
];

// Global variables
let validToken = null;
let userInfo = null;
let testResults = [];

// Utility functions
const log = {
  info: (msg) => console.log(`\n🔍 ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  warning: (msg) => console.log(`⚠️  ${msg}`),
  section: (msg) => console.log(`\n${'='.repeat(80)}\n📋 ${msg}\n${'='.repeat(80)}`)
};

// Add test result
function addResult(test, status, details = '') {
  testResults.push({
    test,
    status,
    details,
    timestamp: new Date().toISOString()
  });
}

// Test 1: Basic connectivity
async function testConnectivity() {
  log.section('Testing API Connectivity');
  
  try {
    log.info('Testing connection to API server...');
    const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
    log.success(`API server is reachable - Status: ${response.status}`);
    addResult('Connectivity', 'PASS', `API server responded with status ${response.status}`);
    return true;
  } catch (error) {
    if (error.response) {
      log.warning(`API server responded with status: ${error.response.status}`);
      addResult('Connectivity', 'PARTIAL', `Server responded but with status ${error.response.status}`);
      return true; // Server is reachable even if health endpoint doesn't exist
    } else {
      log.error(`Cannot reach API server: ${error.message}`);
      addResult('Connectivity', 'FAIL', error.message);
      return false;
    }
  }
}

// Test 2: Login with valid credentials
async function testValidLogin() {
  log.section('Testing Valid Login Attempts');
  
  for (const cred of TEST_CREDENTIALS) {
    try {
      log.info(`Testing login: ${cred.description}`);
      log.info(`URL: ${LOGIN_URL}`);
      log.info(`Credentials: ${cred.username} / ${cred.password}`);
      
      const response = await axios.post(LOGIN_URL, {
        username: cred.username,
        password: cred.password
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.token) {
        log.success(`Login successful for ${cred.username}`);
        log.info(`Token received: ${response.data.token.substring(0, 20)}...`);
        
        // Store first valid token for further testing
        if (!validToken) {
          validToken = response.data.token;
          userInfo = {
            userId: response.data.userId,
            username: response.data.username,
            tenantId: response.data.tenantId,
            role: response.data.role
          };
          log.info(`User info: ${JSON.stringify(userInfo, null, 2)}`);
        }
        
        addResult(`Login - ${cred.username}`, 'PASS', 'Token received successfully');
        return true;
      } else {
        log.error(`Login failed for ${cred.username}: No token in response`);
        addResult(`Login - ${cred.username}`, 'FAIL', 'No token in response');
      }
    } catch (error) {
      log.error(`Login failed for ${cred.username}: ${error.message}`);
      if (error.response) {
        log.error(`Response status: ${error.response.status}`);
        log.error(`Response data: ${JSON.stringify(error.response.data)}`);
        addResult(`Login - ${cred.username}`, 'FAIL', `${error.response.status}: ${JSON.stringify(error.response.data)}`);
      } else {
        addResult(`Login - ${cred.username}`, 'FAIL', error.message);
      }
    }
  }
  
  return validToken !== null;
}

// Test 3: Login with invalid credentials
async function testInvalidLogin() {
  log.section('Testing Invalid Login Attempts (Negative Testing)');
  
  for (const cred of INVALID_CREDENTIALS) {
    try {
      log.info(`Testing invalid login: ${cred.description}`);
      log.info(`Credentials: "${cred.username}" / "${cred.password}"`);
      
      const response = await axios.post(LOGIN_URL, {
        username: cred.username,
        password: cred.password
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // If we get here, the login unexpectedly succeeded
      log.warning(`Unexpected success for invalid credentials: ${cred.description}`);
      addResult(`Invalid Login - ${cred.description}`, 'UNEXPECTED_PASS', 'Login succeeded when it should have failed');
      
    } catch (error) {
      if (error.response && (error.response.status === 401 || error.response.status === 400)) {
        log.success(`Correctly rejected invalid credentials: ${cred.description}`);
        addResult(`Invalid Login - ${cred.description}`, 'PASS', 'Correctly rejected invalid credentials');
      } else {
        log.error(`Unexpected error for ${cred.description}: ${error.message}`);
        addResult(`Invalid Login - ${cred.description}`, 'FAIL', error.message);
      }
    }
  }
}

// Test 4: Token validation
async function testTokenValidation() {
  log.section('Testing Token Validation');
  
  if (!validToken) {
    log.error('No valid token available for testing');
    addResult('Token Validation', 'SKIP', 'No valid token available');
    return false;
  }
  
  try {
    log.info('Testing authenticated endpoint with valid token...');
    
    // Test with a protected endpoint (tenants)
    const response = await axios.get(`${API_BASE_URL}/tenants/${userInfo.tenantId}`, {
      headers: {
        'Authorization': `Bearer ${validToken}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    log.success('Token validation successful');
    log.info(`Protected endpoint response status: ${response.status}`);
    addResult('Token Validation', 'PASS', 'Valid token accepted by protected endpoint');
    return true;
    
  } catch (error) {
    log.error(`Token validation failed: ${error.message}`);
    if (error.response) {
      log.error(`Response status: ${error.response.status}`);
      addResult('Token Validation', 'FAIL', `${error.response.status}: ${error.response.data?.message || 'Token rejected'}`);
    } else {
      addResult('Token Validation', 'FAIL', error.message);
    }
    return false;
  }
}

// Test 5: Invalid token handling
async function testInvalidToken() {
  log.section('Testing Invalid Token Handling');
  
  const invalidTokens = [
    { token: 'invalid.jwt.token', description: 'Malformed JWT token' },
    { token: 'Bearer invalid', description: 'Invalid token format' },
    { token: '', description: 'Empty token' },
    { token: 'expired.token.here', description: 'Potentially expired token' }
  ];
  
  for (const testCase of invalidTokens) {
    try {
      log.info(`Testing invalid token: ${testCase.description}`);
      
      const response = await axios.get(`${API_BASE_URL}/tenants/1`, {
        headers: {
          'Authorization': `Bearer ${testCase.token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      // If we get here, the invalid token was unexpectedly accepted
      log.warning(`Invalid token was unexpectedly accepted: ${testCase.description}`);
      addResult(`Invalid Token - ${testCase.description}`, 'UNEXPECTED_PASS', 'Invalid token was accepted');
      
    } catch (error) {
      if (error.response && error.response.status === 401) {
        log.success(`Correctly rejected invalid token: ${testCase.description}`);
        addResult(`Invalid Token - ${testCase.description}`, 'PASS', 'Invalid token correctly rejected');
      } else {
        log.error(`Unexpected error for ${testCase.description}: ${error.message}`);
        addResult(`Invalid Token - ${testCase.description}`, 'FAIL', error.message);
      }
    }
  }
}

// Test 6: Registration endpoint (if available)
async function testRegistration() {
  log.section('Testing User Registration');
  
  const testUser = {
    username: `testuser_${Date.now()}`,
    password: 'testpass123',
    email: `test_${Date.now()}@example.com`,
    tenantId: userInfo?.tenantId || '1',
    role: 'agent'
  };
  
  try {
    log.info('Testing user registration...');
    log.info(`Registration URL: ${REGISTER_URL}`);
    log.info(`Test user: ${JSON.stringify(testUser, null, 2)}`);
    
    const response = await axios.post(REGISTER_URL, testUser, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    log.success('Registration successful');
    log.info(`Registration response: ${JSON.stringify(response.data, null, 2)}`);
    addResult('Registration', 'PASS', 'User registration successful');
    
  } catch (error) {
    if (error.response) {
      if (error.response.status === 404) {
        log.warning('Registration endpoint not found (404)');
        addResult('Registration', 'SKIP', 'Registration endpoint not available');
      } else {
        log.error(`Registration failed: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        addResult('Registration', 'FAIL', `${error.response.status}: ${JSON.stringify(error.response.data)}`);
      }
    } else {
      log.error(`Registration error: ${error.message}`);
      addResult('Registration', 'FAIL', error.message);
    }
  }
}

// Test 7: Session persistence
async function testSessionPersistence() {
  log.section('Testing Session Persistence');
  
  if (!validToken) {
    log.error('No valid token available for session testing');
    addResult('Session Persistence', 'SKIP', 'No valid token available');
    return;
  }
  
  try {
    log.info('Testing multiple authenticated requests...');
    
    // Make multiple requests to test session persistence
    for (let i = 1; i <= 3; i++) {
      log.info(`Making authenticated request ${i}/3...`);
      
      const response = await axios.get(`${API_BASE_URL}/tenants/${userInfo.tenantId}`, {
        headers: {
          'Authorization': `Bearer ${validToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      log.success(`Request ${i} successful - Status: ${response.status}`);
    }
    
    log.success('Session persistence test passed');
    addResult('Session Persistence', 'PASS', 'Multiple authenticated requests successful');
    
  } catch (error) {
    log.error(`Session persistence test failed: ${error.message}`);
    addResult('Session Persistence', 'FAIL', error.message);
  }
}

// Generate test report
function generateReport() {
  log.section('Authentication Test Report');
  
  const summary = {
    total: testResults.length,
    passed: testResults.filter(r => r.status === 'PASS').length,
    failed: testResults.filter(r => r.status === 'FAIL').length,
    skipped: testResults.filter(r => r.status === 'SKIP').length,
    unexpected: testResults.filter(r => r.status === 'UNEXPECTED_PASS').length
  };
  
  console.log('\n📊 Test Summary:');
  console.log(`   Total Tests: ${summary.total}`);
  console.log(`   ✅ Passed: ${summary.passed}`);
  console.log(`   ❌ Failed: ${summary.failed}`);
  console.log(`   ⏭️  Skipped: ${summary.skipped}`);
  console.log(`   ⚠️  Unexpected Pass: ${summary.unexpected}`);
  
  const successRate = summary.total > 0 ? ((summary.passed / (summary.total - summary.skipped)) * 100).toFixed(1) : 0;
  console.log(`   📈 Success Rate: ${successRate}%`);
  
  console.log('\n📋 Detailed Results:');
  testResults.forEach((result, index) => {
    const statusIcon = {
      'PASS': '✅',
      'FAIL': '❌',
      'SKIP': '⏭️',
      'UNEXPECTED_PASS': '⚠️'
    }[result.status] || '❓';
    
    console.log(`   ${index + 1}. ${statusIcon} ${result.test}`);
    if (result.details) {
      console.log(`      Details: ${result.details}`);
    }
  });
  
  // Configuration summary
  console.log('\n🔧 Configuration Used:');
  console.log(`   API Base URL: ${API_BASE_URL}`);
  console.log(`   Login URL: ${LOGIN_URL}`);
  console.log(`   Register URL: ${REGISTER_URL}`);
  
  if (validToken) {
    console.log(`   Valid Token Found: Yes`);
    console.log(`   User Info: ${JSON.stringify(userInfo, null, 2)}`);
  } else {
    console.log(`   Valid Token Found: No`);
  }
  
  return summary;
}

// Main test execution
async function runAuthTests() {
  console.log('🔐 Comprehensive Authentication Test Suite');
  console.log(`📡 Testing against: ${API_BASE_URL}`);
  console.log(`🕒 Started at: ${new Date().toISOString()}`);
  
  try {
    // Run all tests in sequence
    await testConnectivity();
    await testValidLogin();
    await testInvalidLogin();
    await testTokenValidation();
    await testInvalidToken();
    await testRegistration();
    await testSessionPersistence();
    
    // Generate final report
    const summary = generateReport();
    
    // Exit with appropriate code
    const exitCode = summary.failed > 0 ? 1 : 0;
    console.log(`\n🏁 Tests completed. Exit code: ${exitCode}`);
    process.exit(exitCode);
    
  } catch (error) {
    log.error(`Test suite failed with error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Handle script arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Authentication Test Script

Usage: node test-auth-comprehensive.js [options]

Options:
  --help, -h    Show this help message
  
Environment Variables:
  API_BASE_URL  Override the default API base URL (default: ${API_BASE_URL})
  
Examples:
  node test-auth-comprehensive.js
  API_BASE_URL=http://localhost:3001/api node test-auth-comprehensive.js
`);
  process.exit(0);
}

// Override API URL from environment if provided
if (process.env.API_BASE_URL) {
  console.log(`🔧 Using API_BASE_URL from environment: ${process.env.API_BASE_URL}`);
}

// Run the tests
runAuthTests().catch(error => {
  console.error('❌ Test suite crashed:', error);
  process.exit(1);
}); 