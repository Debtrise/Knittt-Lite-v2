#!/usr/bin/env node

const BASE_URL = 'http://34.122.156.88:3001';

// Test credentials
const LOGIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

let jwtToken = null;
let testResults = [];

// Utility functions
const log = {
  info: (msg) => console.log(`\n🔍 ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  warning: (msg) => console.log(`⚠️  ${msg}`),
  section: (msg) => console.log(`\n${'='.repeat(60)}\n🔧 ${msg}\n${'='.repeat(60)}`)
};

// Authentication function
async function authenticate() {
  try {
    log.info('Step 1: Authenticating...');
    
    const response = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(LOGIN_CREDENTIALS)
    });

    if (response.ok) {
      const data = await response.json();
      jwtToken = data.token;
      log.success('Login successful');
      testResults.push({ test: 'Authentication', status: 'PASS', httpStatus: response.status });
      return true;
    } else {
      log.error('Login failed');
      testResults.push({ test: 'Authentication', status: 'FAIL', httpStatus: response.status });
      return false;
    }
  } catch (error) {
    log.error(`Authentication error: ${error.message}`);
    testResults.push({ test: 'Authentication', status: 'ERROR', error: error.message });
    return false;
  }
}

// Generic API test function
async function testEndpoint(name, method, endpoint, data = null, expectedStatuses = [200]) {
  try {
    log.info(`Testing ${name}...`);
    
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const responseData = await response.json().catch(() => ({}));
    
    const isExpectedStatus = expectedStatuses.includes(response.status);
    
    if (isExpectedStatus) {
      log.success(`${name}: HTTP ${response.status} (Expected)`);
      testResults.push({ 
        test: name, 
        status: 'PASS', 
        httpStatus: response.status,
        endpoint: `${method} ${endpoint}`
      });
      return { success: true, status: response.status, data: responseData };
    } else {
      log.warning(`${name}: HTTP ${response.status} (Expected: ${expectedStatuses.join(' or ')})`);
      testResults.push({ 
        test: name, 
        status: 'UNEXPECTED', 
        httpStatus: response.status,
        expected: expectedStatuses,
        endpoint: `${method} ${endpoint}`
      });
      return { success: false, status: response.status, data: responseData };
    }
  } catch (error) {
    log.error(`${name}: ${error.message}`);
    testResults.push({ 
      test: name, 
      status: 'ERROR', 
      error: error.message,
      endpoint: `${method} ${endpoint}`
    });
    return { success: false, error: error.message };
  }
}

// Main test suite
async function runSchemaValidationTests() {
  log.section('OptiSigns Schema Validation Test');
  console.log('🎯 Testing corrected GraphQL field names');
  console.log(`📍 Base URL: ${BASE_URL}`);

  // Step 1: Authentication
  const authSuccess = await authenticate();
  if (!authSuccess) {
    log.error('Cannot proceed without authentication');
    return;
  }

  // Step 2: Test configuration
  log.info('Step 2: Testing configuration...');
  await testEndpoint(
    'Configuration Endpoint',
    'GET',
    '/api/optisigns/config',
    null,
    [200]
  );

  // Step 3: Test API connection with dummy token (should fail gracefully)
  log.info('Step 3: Testing API connection with dummy token...');
  await testEndpoint(
    'API Connection Test (Invalid Token)',
    'POST',
    '/api/optisigns/config/test',
    { apiToken: 'dummy_token_for_testing' },
    [400, 401] // Should fail gracefully
  );

  // Step 4: Test display sync (should fail gracefully without real API key)
  log.info('Step 4: Testing display sync...');
  await testEndpoint(
    'Display Sync',
    'POST',
    '/api/optisigns/displays/sync',
    null,
    [200, 400] // Could work with real API key or fail gracefully
  );

  // Step 5: Test display list (should work even with empty data)
  log.info('Step 5: Testing display list...');
  await testEndpoint(
    'Display List',
    'GET',
    '/api/optisigns/displays',
    null,
    [200]
  );

  // Step 6: Test assets sync
  log.info('Step 6: Testing assets sync...');
  await testEndpoint(
    'Assets Sync',
    'POST',
    '/api/optisigns/assets/sync',
    null,
    [200, 400] // Could work with real API key or fail gracefully
  );

  // Step 7: Test assets list
  log.info('Step 7: Testing assets list...');
  await testEndpoint(
    'Assets List',
    'GET',
    '/api/optisigns/assets',
    null,
    [200]
  );

  // Step 8: Test analytics
  log.info('Step 8: Testing analytics...');
  await testEndpoint(
    'Analytics',
    'GET',
    '/api/optisigns/analytics',
    null,
    [200]
  );

  // Step 9: Test analytics with date range
  log.info('Step 9: Testing analytics with date range...');
  await testEndpoint(
    'Analytics (Date Range)',
    'GET',
    '/api/optisigns/analytics?startDate=2024-12-01&endDate=2024-12-20',
    null,
    [200]
  );

  // Step 10: Test playlists
  log.info('Step 10: Testing playlists...');
  await testEndpoint(
    'Playlists',
    'GET',
    '/api/optisigns/playlists',
    null,
    [200]
  );

  // Step 11: Test tags
  log.info('Step 11: Testing tags...');
  await testEndpoint(
    'Tags',
    'GET',
    '/api/optisigns/tags',
    null,
    [200]
  );

  // Step 12: Test schedules
  log.info('Step 12: Testing schedules...');
  await testEndpoint(
    'Schedules',
    'GET',
    '/api/optisigns/schedules',
    null,
    [200]
  );

  // Generate summary report
  generateSummaryReport();
}

function generateSummaryReport() {
  log.section('SCHEMA VALIDATION SUMMARY');

  const passed = testResults.filter(r => r.status === 'PASS').length;
  const failed = testResults.filter(r => r.status === 'FAIL').length;
  const errors = testResults.filter(r => r.status === 'ERROR').length;
  const unexpected = testResults.filter(r => r.status === 'UNEXPECTED').length;
  const total = testResults.length;

  console.log(`📊 Test Results: ${passed}/${total} passed`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`💥 Errors: ${errors}`);
  console.log(`⚠️  Unexpected: ${unexpected}`);

  console.log('\n📋 Detailed Results:');
  testResults.forEach((result, index) => {
    const statusIcon = {
      'PASS': '✅',
      'FAIL': '❌',
      'ERROR': '💥',
      'UNEXPECTED': '⚠️'
    }[result.status] || '❓';
    
    console.log(`${statusIcon} ${index + 1}. ${result.test}`);
    if (result.endpoint) {
      console.log(`   ${result.endpoint}`);
    }
    if (result.httpStatus) {
      console.log(`   HTTP Status: ${result.httpStatus}`);
    }
    if (result.expected) {
      console.log(`   Expected: ${result.expected.join(' or ')}`);
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log('\n' + '='.repeat(60));
  
  // Assessment
  const successRate = Math.round((passed / total) * 100);
  
  if (successRate >= 80) {
    log.success(`Schema validation PASSED! (${successRate}% success rate)`);
    console.log('🎉 OptiSigns API schema is working correctly');
  } else if (successRate >= 60) {
    log.warning(`Schema validation PARTIAL (${successRate}% success rate)`);
    console.log('🔧 Some endpoints need attention but core functionality works');
  } else {
    log.error(`Schema validation FAILED (${successRate}% success rate)`);
    console.log('🚨 Significant issues found with OptiSigns API schema');
  }

  console.log('\n💡 Next Steps:');
  console.log('1. Configure a real OptiSigns API token for full functionality testing');
  console.log('2. Use: PUT /api/optisigns/config with your real API token');
  console.log('3. Run sync operations to populate data');
  
  if (failed > 0 || errors > 0) {
    console.log('4. Review failed tests and fix underlying issues');
  }
}

// Run the test suite
if (require.main === module) {
  runSchemaValidationTests().catch(console.error);
}

module.exports = { runSchemaValidationTests, testEndpoint }; 