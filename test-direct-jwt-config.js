#!/usr/bin/env node

const BASE_URL = 'http://34.122.156.88:3001';

// Direct JWT token provided by user
const TENANT_JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInRlbmFudElkIjoiMSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1MDYyNDY2MywiZXhwIjoxNzUwNzExMDYzfQ.f8HOMAM9I-TnH2aTtic3HTwaH67f6SMw62y_sXP_nTA';

// OptiSigns API token to be configured (FRESH TOKEN)
const OPTISIGNS_API_TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJyM0NTQ2RLUWhTUFF6R0RwTiIsImNpZCI6Ik5hcXRxOVQ5Nm5QSFk2YjVaIiwiYWlkIjoicWh6UjRDUXlrTGRKd0RibjgiLCJpYXQiOjE3NTA2MjczMjEsImV4cCI6MTc1MDYzMDkyMSwiaXNzIjoicWh6UjRDUXlrTGRKd0RibjgifQ.qPFba1uihTQnSW4GI_qOOOtEKSFBm_P6AyegImqpOJa0Ry8TeFlKclRSUxF_IXLwx2Hw7LWaMRFklRPRzIyYfnFI2d-ORrAs0FjmHGV7REAFfAQoX6wscc86GCZ_qJHnekgGImV44kipeTM3VTZcOTKoRIN415VBXRueKAFoybkphv8lKQRFhUuOKPG4rmeZRpW1o-0hX7uUXlgn1_piC961S_-LtxN7gIa1jFcwJsw7JK4ptIEYXpApR4rrg9X-4T679EzJFZovSxOXhi6KNpBlTAnsfiMT09OWckbX7G5Ptrt7xyMPZuL2cA7MiqX7-PIzo0ZaLGPgZnA-IrytO29dgdOD3Ebq55zrOwXz1Dqfz_Xx79ryB1IRKo5zBsAUNzUe53SSMOpKHXo6k1Rf7hmXv7kMCn4jB6GRd9StnL7EzEkuxbDF_nZIfgpuP1__GWOWMKc_LNRfl0zrqWp2aUGo3TCJLXDGwQfmWkPwSDmmakBqt57AVPNDkHyEBWwOWAZC3Lb4IeeRoGH3VWvswoc_9iyP_N1OMVMIgTYi79f1QgdQDEUoBCxGXranB1efgIRaCprsh6xBlUF9hTadZOOGE0Lhsm8ob6W4c7vsJq-7Fbmm8o0B_0csWTf_FK5NVsaq6iQYIOHFiuUjIUNukvwWmbW_Z51IUA3bRVS0Xt0';

// Utility functions
const log = {
  info: (msg) => console.log(`\n🔍 ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  section: (msg) => console.log(`\n${'='.repeat(60)}\n🔧 ${msg}\n${'='.repeat(60)}`)
};

// Make API request with detailed logging
async function makeRequest(method, endpoint, data = null) {
  try {
    const url = `${BASE_URL}${endpoint}`;
    console.log(`\n📤 ${method} ${url}`);
    console.log(`🔑 Auth: Bearer ${TENANT_JWT_TOKEN.substring(0, 30)}...`);
    
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${TENANT_JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
      console.log(`📄 Body:`, JSON.stringify(data, null, 2));
    }

    const response = await fetch(url, options);
    
    // Handle both JSON and text responses
    let responseData;
    const contentType = response.headers.get('content-type');
    
    try {
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }
    } catch (parseError) {
      responseData = `Failed to parse response: ${parseError.message}`;
    }
    
    console.log(`\n📥 Response:`);
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Content-Type: ${contentType || 'unknown'}`);
    console.log(`   Body:`, typeof responseData === 'string' && responseData.length > 300 
      ? responseData.substring(0, 300) + '...' 
      : responseData);
    
    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      data: responseData,
      contentType
    };
  } catch (error) {
    console.log(`\n💥 Request Error: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// Test OptiSigns configuration
async function testOptiSignsConfig() {
  log.section('Direct JWT OptiSigns Configuration Test');
  console.log('🎯 Using provided JWT token to configure OptiSigns API');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`🔑 JWT Token: ${TENANT_JWT_TOKEN.substring(0, 50)}...`);
  console.log(`🎨 OptiSigns Token: ${OPTISIGNS_API_TOKEN.substring(0, 50)}...`);

  const results = [];

  // Step 1: Test GET config first
  log.info('Step 1: Testing GET /api/optisigns/config...');
  const getConfigResult = await makeRequest('GET', '/api/optisigns/config');
  results.push({ step: 'GET Config', ...getConfigResult });

  // Step 2: Test PUT config (configure OptiSigns)
  log.info('Step 2: Testing PUT /api/optisigns/config (configure OptiSigns)...');
  const configData = {
    apiToken: OPTISIGNS_API_TOKEN,
    settings: { 
      autoSync: true 
    }
  };
  const putConfigResult = await makeRequest('PUT', '/api/optisigns/config', configData);
  results.push({ step: 'PUT Config', ...putConfigResult });

  // Step 3: Test POST config/test (test OptiSigns connection)
  log.info('Step 3: Testing POST /api/optisigns/config/test...');
  const testData = { apiToken: OPTISIGNS_API_TOKEN };
  const testResult = await makeRequest('POST', '/api/optisigns/config/test', testData);
  results.push({ step: 'Test Connection', ...testResult });

  // Step 4: Test display sync
  log.info('Step 4: Testing POST /api/optisigns/displays/sync...');
  const syncResult = await makeRequest('POST', '/api/optisigns/displays/sync');
  results.push({ step: 'Display Sync', ...syncResult });

  // Step 5: Test display list
  log.info('Step 5: Testing GET /api/optisigns/displays...');
  const displaysResult = await makeRequest('GET', '/api/optisigns/displays');
  results.push({ step: 'Display List', ...displaysResult });

  // Summary
  log.section('TEST RESULTS SUMMARY');
  
  let successCount = 0;
  results.forEach((result, index) => {
    const icon = result.success ? '✅' : '❌';
    const status = result.success ? 'SUCCESS' : 'FAILED';
    console.log(`${icon} ${index + 1}. ${result.step}: ${status} (${result.status || 'N/A'})`);
    if (result.success) successCount++;
  });

  const successRate = Math.round((successCount / results.length) * 100);
  
  console.log(`\n📊 Overall Success Rate: ${successCount}/${results.length} (${successRate}%)`);
  
  if (successRate >= 80) {
    log.success('🎉 OptiSigns configuration test PASSED!');
    console.log('\n🚀 Your OptiSigns integration is working well!');
  } else if (successRate >= 50) {
    console.log('⚠️  OptiSigns configuration partially working');
    console.log('\n🔧 Some endpoints need attention');
  } else {
    log.error('❌ OptiSigns configuration test FAILED');
    console.log('\n🔍 Check server connectivity and API endpoints');
  }

  return results;
}

// Run the test
if (require.main === module) {
  testOptiSignsConfig().catch(console.error);
}

module.exports = { testOptiSignsConfig }; 