#!/usr/bin/env node

const BASE_URL = 'http://localhost:3000';

// Tenant credentials for JWT authentication
const TENANT_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

// OptiSigns API token to be configured
const OPTISIGNS_API_TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJ4RGRuREpOdXVQMmJEb2pudyIsImNpZCI6Ilk2S0QyeUpjZ1hRZjZOU2JvIiwiYWlkIjoicWh6UjRDUXlrTGRKd0RibjgiLCJpYXQiOjE3NTA0NDcyMTMsImV4cCI6MTc1MDQ1MDgxMywiaXNzIjoicWh6UjRDUXlrTGRKd0RibjgifQ.zWYHOHFFtZ7xaNDlUP88sUAFRFYOgMgv-g11532DmHAjIV0uTJR91i_VAJNsCGLBIRYpfdmAxrL1Mwzh3cj69Mj-1EN1oEuiGQpwVExDCzAgb2tyO49UWV4X7RjaCizwPdOLweKZ-UXWBKX4rImGQDrd6TWl4hIOUuY4NnAk-JlULwnMIo3VKrYKsCzTXaPSjXPWkTsnQMTt8d6QAr024Owgy3numT_vdv3waZ_PPTKxhrR3hNRIGijjJaki0URk8TMWo3Ji-xVZ3rmJxS5d1G-9Mj2RIQuJTH-a41Cz-_X6uZJRe6OSaxf_9BoYxgK2AxalaTKrFXAp7tNDSraA1YvHjb8GqH-jtIDi_Q1mWPLlWSVHKYrdRsbpWPqmLOQQFhUgCgBHxE54ic8vlNFcXwtFHl-5TC29zXQCyZNvAQNm-i-VCeC_4UbhrEDhgtemPHZw7Yc4L-4rKlIbvno-1dZasaDzHwLaK6t4ym97I2UtmQWsSl6qXV_yegapNcbQL_Y4PoG14Qavy3FI3h2iOZSncGM22Ca6wbuPaKKdhAO2wBGQsOs4n4Cg-4_hODNKCHRc18qvCQK5gBqd0aeUYQ98p7c85G57rLE3SK1fDyaXCAHFYZKdgUUUFcVTOCzoaMyYIqh_-p6sHYLR_Y9sOWkjSDl7yBZSNERIxq73uXQ';

let tenantJwtToken = null;

// Utility functions
const log = {
  info: (msg) => console.log(`\n🔍 ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  section: (msg) => console.log(`\n${'='.repeat(60)}\n🔧 ${msg}\n${'='.repeat(60)}`)
};

// Get tenant JWT token via admin/admin123
async function getTenantAuth() {
  try {
    log.info('Step 1: Getting tenant JWT token via admin/admin123...');
    
    const response = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TENANT_CREDENTIALS)
    });

    if (response.ok) {
      const data = await response.json();
      tenantJwtToken = data.token;
      log.success('Tenant authentication successful! Got JWT token');
      console.log(`🔑 Tenant JWT: ${tenantJwtToken.substring(0, 50)}...`);
      return true;
    } else {
      const errorText = await response.text();
      log.error(`Tenant login failed with status: ${response.status}`);
      console.log('Response:', errorText);
      return false;
    }
  } catch (error) {
    log.error(`Tenant authentication error: ${error.message}`);
    return false;
  }
}

// Configure OptiSigns API token using tenant JWT
async function configureOptiSignsToken() {
  try {
    log.info('Step 2: Configuring OptiSigns API token using tenant JWT...');
    
    const configData = {
      apiToken: OPTISIGNS_API_TOKEN,
      settings: { 
        autoSync: true 
      }
    };

    console.log('📤 Configuration Request:');
    console.log(`   Method: PUT`);
    console.log(`   URL: ${BASE_URL}/api/optisigns/config`);
    console.log(`   Auth: Bearer ${tenantJwtToken.substring(0, 30)}...`);
    console.log(`   OptiSigns Token: ${OPTISIGNS_API_TOKEN.substring(0, 50)}...`);
    console.log(`   Settings:`, JSON.stringify(configData.settings, null, 2));

    const response = await fetch(`${BASE_URL}/api/optisigns/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tenantJwtToken}`
      },
      body: JSON.stringify(configData)
    });

    // Handle both JSON and text responses
    let responseData;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }
    
    console.log('\n📥 Configuration Response:');
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Content-Type: ${contentType}`);
    console.log(`   Body:`, typeof responseData === 'string' ? responseData.substring(0, 200) + '...' : JSON.stringify(responseData, null, 2));
    
    if (response.ok) {
      log.success('OptiSigns API token configured successfully! 🎉');
      return { success: true, httpStatus: response.status, data: responseData };
    } else {
      log.error(`Configuration failed with status: ${response.status}`);
      return { success: false, httpStatus: response.status, data: responseData };
    }
  } catch (error) {
    log.error(`Configuration error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Test the configuration by trying to retrieve it
async function testConfiguration() {
  try {
    log.info('Step 3: Testing configuration retrieval...');
    
    const response = await fetch(`${BASE_URL}/api/optisigns/config`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tenantJwtToken}`
      }
    });

    let responseData;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }
    
    console.log('\n📥 Config Retrieval Response:');
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Content-Type: ${contentType}`);
    console.log(`   Body:`, typeof responseData === 'string' ? responseData.substring(0, 200) + '...' : JSON.stringify(responseData, null, 2));
    
    if (response.ok) {
      log.success('Configuration retrieved successfully!');
      return { success: true, httpStatus: response.status, data: responseData };
    } else {
      log.error(`Configuration retrieval failed with status: ${response.status}`);
      return { success: false, httpStatus: response.status, data: responseData };
    }
  } catch (error) {
    log.error(`Configuration test error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Test OptiSigns API connection
async function testOptiSignsConnection() {
  try {
    log.info('Step 4: Testing OptiSigns API connection...');
    
    const response = await fetch(`${BASE_URL}/api/optisigns/config/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tenantJwtToken}`
      },
      body: JSON.stringify({ apiToken: OPTISIGNS_API_TOKEN })
    });

    let responseData;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }
    
    console.log('\n📥 OptiSigns Connection Test Response:');
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Content-Type: ${contentType}`);
    console.log(`   Body:`, typeof responseData === 'string' ? responseData.substring(0, 200) + '...' : JSON.stringify(responseData, null, 2));
    
    if (response.ok) {
      log.success('OptiSigns API connection test successful! 🎉');
      return { success: true, httpStatus: response.status, data: responseData };
    } else {
      log.error(`OptiSigns connection test failed with status: ${response.status}`);
      return { success: false, httpStatus: response.status, data: responseData };
    }
  } catch (error) {
    log.error(`OptiSigns connection test error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Main test function
async function runTenantAuthConfigTest() {
  log.section('Tenant Auth + OptiSigns Config Test');
  console.log('🎯 Using tenant JWT (admin/admin123) to configure OptiSigns API token');
  console.log(`📍 Base URL: ${BASE_URL}`);

  // Step 1: Get tenant JWT token
  const authSuccess = await getTenantAuth();
  if (!authSuccess) {
    log.error('Cannot proceed without tenant authentication');
    return;
  }

  // Step 2: Configure OptiSigns API token
  const configResult = await configureOptiSignsToken();

  // Step 3: Test configuration retrieval
  const testResult = await testConfiguration();

  // Step 4: Test OptiSigns connection
  const connectionResult = await testOptiSignsConnection();

  // Summary
  log.section('TEST SUMMARY');
  
  const getIcon = (result) => result?.success ? '✅' : '❌';
  const getStatus = (result) => result?.success ? 'SUCCESS' : 'FAILED';
  
  console.log(`${getIcon({ success: authSuccess })} Tenant Authentication: ${authSuccess ? 'SUCCESS' : 'FAILED'}`);
  console.log(`${getIcon(configResult)} OptiSigns Configuration: ${getStatus(configResult)}`);
  console.log(`${getIcon(testResult)} Configuration Retrieval: ${getStatus(testResult)}`);
  console.log(`${getIcon(connectionResult)} OptiSigns Connection Test: ${getStatus(connectionResult)}`);

  const overallSuccess = authSuccess && configResult.success;
  
  if (overallSuccess) {
    log.success('🎉 Tenant auth + OptiSigns config test PASSED!');
    console.log('\n🚀 Your system is now configured with:');
    console.log('   • Tenant JWT authentication working');
    console.log('   • OptiSigns API token configured');
    console.log('   • Ready for OptiSigns integration!');
  } else {
    log.error('❌ Test FAILED - Check error details above');
    console.log('\n🔍 Common issues:');
    console.log('   • API endpoint routing problems');
    console.log('   • OptiSigns API token format issues');
    console.log('   • Server configuration problems');
  }
}

// Run the test
if (require.main === module) {
  runTenantAuthConfigTest().catch(console.error);
}

module.exports = { runTenantAuthConfigTest }; 