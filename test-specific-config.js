#!/usr/bin/env node

const BASE_URL = 'http://34.122.156.88:3001';

// Test credentials
const LOGIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

// The specific token to test
const OPTISIGNS_JWT_TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJ4RGRuREpOdXVQMmJEb2pudyIsImNpZCI6Ilk2S0QyeUpjZ1hRZjZOU2JvIiwiYWlkIjoicWh6UjRDUXlrTGRKd0RibjgiLCJpYXQiOjE3NTA0NDcyMTMsImV4cCI6MTc1MDQ1MDgxMywiaXNzIjoicWh6UjRDUXlrTGRKd0RibjgifQ.zWYHOHFFtZ7xaNDlUP88sUAFRFYOgMgv-g11532DmHAjIV0uTJR91i_VAJNsCGLBIRYpfdmAxrL1Mwzh3cj69Mj-1EN1oEuiGQpwVExDCzAgb2tyO49UWV4X7RjaCizwPdOLweKZ-UXWBKX4rImGQDrd6TWl4hIOUuY4NnAk-JlULwnMIo3VKrYKsCzTXaPSjXPWkTsnQMTt8d6QAr024Owgy3numT_vdv3waZ_PPTKxhrR3hNRIGijjJaki0URk8TMWo3Ji-xVZ3rmJxS5d1G-9Mj2RIQuJTH-a41Cz-_X6uZJRe6OSaxf_9BoYxgK2AxalaTKrFXAp7tNDSraA1YvHjb8GqH-jtIDi_Q1mWPLlWSVHKYrdRsbpWPqmLOQQFhUgCgBHxE54ic8vlNFcXwtFHl-5TC29zXQCyZNvAQNm-i-VCeC_4UbhrEDhgtemPHZw7Yc4L-4rKlIbvno-1dZasaDzHwLaK6t4ym97I2UtmQWsSl6qXV_yegapNcbQL_Y4PoG14Qavy3FI3h2iOZSncGM22Ca6wbuPaKKdhAO2wBGQsOs4n4Cg-4_hODNKCHRc18qvCQK5gBqd0aeUYQ98p7c85G57rLE3SK1fDyaXCAHFYZKdgUUUFcVTOCzoaMyYIqh_-p6sHYLR_Y9sOWkjSDl7yBZSNERIxq73uXQ';

let jwtToken = null;

// Utility functions
const log = {
  info: (msg) => console.log(`\n🔍 ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  section: (msg) => console.log(`\n${'='.repeat(60)}\n🔧 ${msg}\n${'='.repeat(60)}`)
};

// Authentication function
async function authenticate() {
  try {
    log.info('Step 1: Authenticating to dialer app...');
    
    const response = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(LOGIN_CREDENTIALS)
    });

    if (response.ok) {
      const data = await response.json();
      jwtToken = data.token;
      log.success('Login successful! Got JWT token');
      return true;
    } else {
      log.error(`Login failed with status: ${response.status}`);
      return false;
    }
  } catch (error) {
    log.error(`Authentication error: ${error.message}`);
    return false;
  }
}

// Test the specific configuration request
async function testSpecificConfig() {
  try {
    log.info('Step 2: Testing specific POST /api/optisigns/config request...');
    
    const configData = {
      apiToken: OPTISIGNS_JWT_TOKEN,
      settings: { 
        autoSync: true 
      }
    };

    console.log('📤 Request Details:');
    console.log(`   Method: POST`);
    console.log(`   URL: ${BASE_URL}/api/optisigns/config`);
    console.log(`   Headers: Authorization: Bearer [JWT_TOKEN]`);
    console.log(`   Body:`, JSON.stringify(configData, null, 2));

    const response = await fetch(`${BASE_URL}/api/optisigns/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify(configData)
    });

    const data = await response.json();
    
    console.log('\n📥 Response Details:');
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Body:`, JSON.stringify(data, null, 2));
    
    if (response.ok) {
      log.success('Configuration saved successfully! 🎉');
      return { success: true, httpStatus: response.status, data };
    } else {
      log.error(`Configuration save failed with status: ${response.status}`);
      return { success: false, httpStatus: response.status, data };
    }
  } catch (error) {
    log.error(`Configuration save error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Verify the saved configuration
async function verifyConfig() {
  try {
    log.info('Step 3: Verifying saved configuration...');
    
    const response = await fetch(`${BASE_URL}/api/optisigns/config`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwtToken}`
      }
    });

    const data = await response.json();
    
    console.log('\n📥 Verification Response:');
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Body:`, JSON.stringify(data, null, 2));
    
    if (response.ok) {
      log.success('Configuration verified successfully!');
      return { success: true, httpStatus: response.status, data };
    } else {
      log.error('Configuration verification failed');
      return { success: false, httpStatus: response.status, data };
    }
  } catch (error) {
    log.error(`Configuration verify error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Test sync after configuration
async function testSyncAfterConfig() {
  try {
    log.info('Step 4: Testing display sync after configuration...');
    
    const response = await fetch(`${BASE_URL}/api/optisigns/displays/sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwtToken}`
      }
    });

    const data = await response.json();
    
    console.log('\n📥 Sync Response:');
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Body:`, JSON.stringify(data, null, 2));
    
    if (response.ok) {
      log.success('Display sync working after configuration! 🎉');
      return { success: true, httpStatus: response.status, data };
    } else {
      log.error(`Display sync failed with status: ${response.status}`);
      return { success: false, httpStatus: response.status, data };
    }
  } catch (error) {
    log.error(`Display sync error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Main test function
async function runSpecificConfigTest() {
  log.section('Specific OptiSigns Config Test');
  console.log('🎯 Testing the exact POST /api/optisigns/config request you specified');
  console.log(`📍 Base URL: ${BASE_URL}`);

  // Step 1: Authentication
  const authSuccess = await authenticate();
  if (!authSuccess) {
    log.error('Cannot proceed without authentication');
    return;
  }

  // Step 2: Test specific config request
  const configResult = await testSpecificConfig();

  // Step 3: Verify configuration (if save was successful)
  let verifyResult = null;
  if (configResult.success) {
    verifyResult = await verifyConfig();
  }

  // Step 4: Test sync (if config was successful)
  let syncResult = null;
  if (configResult.success) {
    syncResult = await testSyncAfterConfig();
  }

  // Summary
  log.section('TEST SUMMARY');
  
  const getIcon = (result) => result?.success ? '✅' : '❌';
  const getStatus = (result) => result?.success ? 'SUCCESS' : 'FAILED';
  
  console.log(`${getIcon({ success: authSuccess })} Authentication: ${authSuccess ? 'SUCCESS' : 'FAILED'}`);
  console.log(`${getIcon(configResult)} Configuration Save: ${getStatus(configResult)}`);
  if (verifyResult) console.log(`${getIcon(verifyResult)} Configuration Verify: ${getStatus(verifyResult)}`);
  if (syncResult) console.log(`${getIcon(syncResult)} Display Sync: ${getStatus(syncResult)}`);

  if (configResult.success) {
    log.success('🎉 OptiSigns configuration test PASSED!');
    console.log('\n🚀 Your OptiSigns integration is now configured and ready to use!');
  } else {
    log.error('❌ OptiSigns configuration test FAILED');
    console.log('\n🔍 Check the error details above for troubleshooting');
  }
}

// Run the test
if (require.main === module) {
  runSpecificConfigTest().catch(console.error);
}

module.exports = { runSpecificConfigTest }; 