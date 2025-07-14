#!/usr/bin/env node

/**
 * Content Creator API Test Script
 * 
 * This script tests the essential backend endpoints required for the
 * drag-and-drop content creator to function properly.
 */

const API_BASE_URL = process.env.API_URL || 'http://34.122.156.88:3001/api';
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NCwidXNlcm5hbWUiOiJhZG1pbiIsInRlbmFudElkIjoiMSIsInJvbGUiOiJhZG1pbiIsInBlcm1pc3Npb25zIjp7fSwiaWF0IjoxNzUxODM2NDQ1LCJleHAiOjE3NTE5MjI4NDV9.EvnuhdkZ2SlUN1Dvhzb-_lgh5D-jtGkj74clIAIiSbE';

// Test configuration
const TEST_CONFIG = {
  apiUrl: API_BASE_URL,
  authToken: AUTH_TOKEN,
  timeout: 10000
};

console.log('🧪 Content Creator API Test Suite');
console.log('==================================');
console.log(`API Base URL: ${TEST_CONFIG.apiUrl}`);
console.log(`Auth Token: ${TEST_CONFIG.authToken ? '✓ Provided' : '❌ Missing'}`);
console.log('');

/**
 * Make authenticated API request
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${TEST_CONFIG.apiUrl}${endpoint}`;
  const config = {
    timeout: TEST_CONFIG.timeout,
    headers: {
      'Authorization': `Bearer ${TEST_CONFIG.authToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));
    
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      data
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      statusText: error.message,
      data: null
    };
  }
}

/**
 * Test individual endpoint
 */
async function testEndpoint(name, endpoint, method = 'GET', body = null) {
  console.log(`Testing ${name}...`);
  
  const options = {
    method,
    ...(body && { body: JSON.stringify(body) })
  };
  
  const result = await apiRequest(endpoint, options);
  
  if (result.ok) {
    console.log(`✅ ${name}: ${result.status} ${result.statusText}`);
    return { success: true, data: result.data };
  } else {
    console.log(`❌ ${name}: ${result.status} ${result.statusText}`);
    if (result.data?.error) {
      console.log(`   Error: ${result.data.error}`);
    }
    return { success: false, error: result.statusText };
  }
}

/**
 * Main test suite
 */
async function runTests() {
  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };

  console.log('🔍 Testing Core Endpoints\n');

  // Test 1: Get Projects
  results.total++;
  const projectsTest = await testEndpoint('Get Projects', '/content/projects');
  if (projectsTest.success) {
    results.passed++;
    console.log(`   Found ${projectsTest.data?.projects?.length || 0} projects`);
  } else {
    results.failed++;
  }
  console.log('');

  // Test 2: Get Assets
  results.total++;
  const assetsTest = await testEndpoint('Get Assets', '/content/assets');
  if (assetsTest.success) {
    results.passed++;
    console.log(`   Found ${assetsTest.data?.assets?.length || 0} assets`);
  } else {
    results.failed++;
  }
  console.log('');

  // Test 3: Get Variables
  results.total++;
  const variablesTest = await testEndpoint('Get Variables', '/content/variables');
  if (variablesTest.success) {
    results.passed++;
    console.log(`   Found ${variablesTest.data?.variables?.length || 0} variables`);
  } else {
    results.failed++;
  }
  console.log('');

  // Test 4: Get Templates
  results.total++;
  const templatesTest = await testEndpoint('Get Templates', '/content/templates');
  if (templatesTest.success) {
    results.passed++;
    console.log(`   Found ${templatesTest.data?.templates?.length || 0} templates`);
  } else {
    results.failed++;
  }
  console.log('');

  // Test 5: Create Project (if basic endpoints work)
  if (projectsTest.success) {
    results.total++;
    const createProjectTest = await testEndpoint(
      'Create Project',
      '/content/projects',
      'POST',
      {
        name: 'Test Project',
        description: 'Created by API test script',
        canvasSize: { width: 1920, height: 1080 },
        canvasBackground: { type: 'solid', color: '#ffffff' },
        variables: {}
      }
    );
    
    if (createProjectTest.success) {
      results.passed++;
      const projectId = createProjectTest.data?.project?.id;
      console.log(`   Created project with ID: ${projectId}`);
      
      // Test 6: Create Element (if project creation worked)
      if (projectId) {
        results.total++;
        const createElementTest = await testEndpoint(
          'Create Element',
          `/content/projects/${projectId}/elements`,
          'POST',
          {
            type: 'text',
            position: { x: 100, y: 100, z: 1 },
            size: { width: 200, height: 100 },
            properties: { text: 'Test Element' },
            styles: { fontSize: '24px', color: '#000000' }
          }
        );
        
        if (createElementTest.success) {
          results.passed++;
          console.log(`   Created element with ID: ${createElementTest.data?.element?.id}`);
        } else {
          results.failed++;
        }
        console.log('');

        // Cleanup: Delete test project
        console.log('🧹 Cleaning up test data...');
        await testEndpoint('Delete Test Project', `/content/projects/${projectId}`, 'DELETE');
      }
    } else {
      results.failed++;
    }
    console.log('');
  }

  // Test 7: System Status
  results.total++;
  const statusTest = await testEndpoint('System Status', '/content/system/status');
  if (statusTest.success) {
    results.passed++;
    const capabilities = statusTest.data?.capabilities || {};
    console.log('   System Capabilities:');
    Object.entries(capabilities).forEach(([key, value]) => {
      console.log(`     ${key}: ${value ? '✅' : '❌'}`);
    });
  } else {
    results.failed++;
  }

  // Print results
  console.log('\n📊 Test Results');
  console.log('================');
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed} ✅`);
  console.log(`Failed: ${results.failed} ❌`);
  console.log(`Success Rate: ${Math.round((results.passed / results.total) * 100)}%`);

  if (results.failed === 0) {
    console.log('\n🎉 All tests passed! Content Creator should work properly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the backend implementation.');
    console.log('\n💡 Common issues:');
    console.log('   - Backend server not running');
    console.log('   - Invalid authentication token');
    console.log('   - Missing database tables');
    console.log('   - CORS configuration issues');
  }

  return results.failed === 0;
}

/**
 * Check if fetch is available (Node.js 18+)
 */
if (typeof fetch === 'undefined') {
  console.log('❌ This script requires Node.js 18+ with built-in fetch support.');
  console.log('   Alternatively, install node-fetch: npm install node-fetch');
  process.exit(1);
}

// Run the tests
runTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 Test suite crashed:', error);
    process.exit(1);
  }); 