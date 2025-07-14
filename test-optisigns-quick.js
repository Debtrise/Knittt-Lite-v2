#!/usr/bin/env node

const axios = require('axios');
const colors = require('colors');

// Configuration
const BASE_URL = 'http://34.122.156.88:3001';
const LOGIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

let authToken = null;

// Helper functions
const log = {
  success: (msg) => console.log(`✅ ${msg}`.green),
  error: (msg) => console.log(`❌ ${msg}`.red),
  info: (msg) => console.log(`ℹ️  ${msg}`.blue),
  warning: (msg) => console.log(`⚠️  ${msg}`.yellow),
  section: (msg) => console.log(`\n🔸 ${msg}`.cyan.bold)
};

// Authentication
async function authenticate() {
  try {
    const response = await axios.post(`${BASE_URL}/api/login`, LOGIN_CREDENTIALS);
    
    if (response.data.token) {
      authToken = response.data.token;
      log.success(`Authenticated successfully`);
      return true;
    } else {
      log.error('No token received from login');
      return false;
    }
  } catch (error) {
    log.error(`Authentication failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// API request helper
async function testEndpoint(method, endpoint, data = null, description = '') {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    log.success(`${description} - ${response.status}`);
    return { success: true, status: response.status, data: response.data };
  } catch (error) {
    const status = error.response?.status || 'Network Error';
    const message = error.response?.data?.error || error.response?.data?.message || error.message;
    log.error(`${description} - ${status}: ${message}`);
    return { success: false, status, error: message };
  }
}

// Quick test of key endpoints
async function runQuickTests() {
  console.log('🚀 Quick Optisigns API Test\n'.rainbow.bold);
  
  // Authenticate first
  const authSuccess = await authenticate();
  if (!authSuccess) {
    log.error('Authentication failed. Cannot proceed with API tests.');
    process.exit(1);
  }

  log.section('Testing Key Endpoints');

  const tests = [
    {
      method: 'POST',
      endpoint: '/api/optisigns/config/test',
      data: { apiToken: 'test_token' },
      description: 'Test API Connection'
    },
    {
      method: 'GET',
      endpoint: '/api/optisigns/config',
      description: 'Get Configuration'
    },
    {
      method: 'GET',
      endpoint: '/api/optisigns/displays',
      description: 'Get Displays'
    },
    {
      method: 'POST',
      endpoint: '/api/optisigns/displays/sync',
      description: 'Sync Displays'
    },
    {
      method: 'GET',
      endpoint: '/api/optisigns/content',
      description: 'Get Content'
    },
    {
      method: 'POST',
      endpoint: '/api/optisigns/content',
      data: {
        name: 'Test Content',
        type: 'text',
        content: 'Hello World',
        duration: 30
      },
      description: 'Create Content'
    },
    {
      method: 'GET',
      endpoint: '/api/optisigns/analytics',
      description: 'Get Analytics'
    },
    {
      method: 'GET',
      endpoint: '/api/optisigns/webhook-rules',
      description: 'Get Webhook Rules'
    },
    {
      method: 'POST',
      endpoint: '/api/optisigns/webhook-rules',
      data: {
        name: 'Test Rule',
        description: 'Test webhook rule'
      },
      description: 'Create Webhook Rule'
    },
    {
      method: 'POST',
      endpoint: '/api/optisigns/debug/connectivity',
      data: { apiToken: 'test_token' },
      description: 'Debug Connectivity'
    }
  ];

  const results = [];
  
  for (const test of tests) {
    const result = await testEndpoint(test.method, test.endpoint, test.data, test.description);
    results.push({
      ...test,
      ...result
    });
  }

  // Summary
  log.section('Summary');
  const working = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`\n📊 Results: ${working}/${total} endpoints working\n`);
  
  console.log('✅ Working Endpoints:'.green);
  results.filter(r => r.success).forEach(r => {
    console.log(`   ${r.method} ${r.endpoint} - ${r.description}`.green);
  });
  
  console.log('\n❌ Failed Endpoints:'.red);
  results.filter(r => !r.success).forEach(r => {
    console.log(`   ${r.method} ${r.endpoint} - ${r.description}`.red);
    console.log(`     Error: ${r.error}`.gray);
  });

  // Recommendations
  log.section('Quick Fix Recommendations');
  
  const dbErrors = results.filter(r => !r.success && r.error?.includes('Cannot read properties of undefined'));
  if (dbErrors.length > 0) {
    log.warning(`${dbErrors.length} endpoints have database connection issues`);
    console.log('   - Check database models initialization');
    console.log('   - Verify database connection');
    console.log('   - Ensure Optisigns tables exist');
  }

  const notImplemented = results.filter(r => !r.success && (r.status === 404 || r.status === 501));
  if (notImplemented.length > 0) {
    log.info(`${notImplemented.length} endpoints are not implemented yet`);
    console.log('   - These can be implemented later');
    console.log('   - Focus on database issues first');
  }

  const workingEndpoints = results.filter(r => r.success);
  if (workingEndpoints.length > 0) {
    log.success(`${workingEndpoints.length} endpoints are working correctly`);
    console.log('   - Basic API structure is functional');
    console.log('   - Authentication is working');
    console.log('   - Read operations mostly work');
  }

  console.log('\n🔧 Next Steps:');
  console.log('1. Fix database connection issues (high priority)');
  console.log('2. Test configuration and content creation');
  console.log('3. Implement missing webhook rule creation');
  console.log('4. Add missing assets/templates endpoints if needed');
  
  console.log('\n📝 For detailed testing, run: node test-optisigns-api.js');
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  log.error(`Unhandled Rejection: ${reason}`);
});

process.on('uncaughtException', (error) => {
  log.error(`Uncaught Exception: ${error.message}`);
  process.exit(1);
});

// Run the tests
if (require.main === module) {
  runQuickTests();
}

module.exports = {
  runQuickTests,
  authenticate,
  testEndpoint
}; 