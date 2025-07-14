#!/usr/bin/env node

const BASE_URL = 'http://34.122.156.88:3001';

// Test credentials
const LOGIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

// Your OptiSigns API Token (updated)
const OPTISIGNS_API_TOKEN = 'op-Naqtq9T96nPHY6b5Z-SzNmeUFTYnpNU0FCdmpZeUQxNzUwNjIzMjc4NzQy';

let jwtToken = null;
let setupResults = [];

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
      setupResults.push({ step: 'Authentication', status: 'SUCCESS', httpStatus: response.status });
      return true;
    } else {
      log.error(`Login failed with status: ${response.status}`);
      setupResults.push({ step: 'Authentication', status: 'FAILED', httpStatus: response.status });
      return false;
    }
  } catch (error) {
    log.error(`Authentication error: ${error.message}`);
    setupResults.push({ step: 'Authentication', status: 'ERROR', error: error.message });
    return false;
  }
}

// Test OptiSigns API token
async function testOptiSignsToken() {
  try {
    log.info('Step 2: Testing OptiSigns API token...');
    
    const response = await fetch(`${BASE_URL}/api/optisigns/config/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify({ apiToken: OPTISIGNS_API_TOKEN })
    });

    const data = await response.json();
    
    if (response.ok) {
      log.success('OptiSigns API token is valid!');
      console.log('Response:', JSON.stringify(data, null, 2));
      setupResults.push({ step: 'API Token Test', status: 'SUCCESS', httpStatus: response.status });
      return true;
    } else {
      log.error(`OptiSigns API token test failed with status: ${response.status}`);
      console.log('Response:', JSON.stringify(data, null, 2));
      log.warning('Proceeding anyway - the token might still work for some operations');
      setupResults.push({ step: 'API Token Test', status: 'FAILED', httpStatus: response.status, data });
      return false;
    }
  } catch (error) {
    log.error(`API token test error: ${error.message}`);
    setupResults.push({ step: 'API Token Test', status: 'ERROR', error: error.message });
    return false;
  }
}

// Save configuration
async function saveConfiguration() {
  try {
    log.info('Step 3: Saving OptiSigns configuration...');
    
    const configData = {
      apiToken: OPTISIGNS_API_TOKEN,
      settings: {
        autoSync: true,
        syncInterval: 300
      }
    };

    const response = await fetch(`${BASE_URL}/api/optisigns/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify(configData)
    });

    const data = await response.json();
    
    if (response.ok) {
      log.success('OptiSigns configuration saved successfully!');
      console.log('Response:', JSON.stringify(data, null, 2));
      setupResults.push({ step: 'Configuration Save', status: 'SUCCESS', httpStatus: response.status });
      return true;
    } else {
      log.error(`Configuration save failed with status: ${response.status}`);
      console.log('Response:', JSON.stringify(data, null, 2));
      setupResults.push({ step: 'Configuration Save', status: 'FAILED', httpStatus: response.status, data });
      return false;
    }
  } catch (error) {
    log.error(`Configuration save error: ${error.message}`);
    setupResults.push({ step: 'Configuration Save', status: 'ERROR', error: error.message });
    return false;
  }
}

// Verify configuration
async function verifyConfiguration() {
  try {
    log.info('Step 4: Verifying saved configuration...');
    
    const response = await fetch(`${BASE_URL}/api/optisigns/config`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${jwtToken}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      log.success('Configuration verified!');
      console.log('Saved config:', JSON.stringify(data, null, 2));
      setupResults.push({ step: 'Configuration Verify', status: 'SUCCESS', httpStatus: response.status });
      return true;
    } else {
      log.error('Configuration verification failed');
      setupResults.push({ step: 'Configuration Verify', status: 'FAILED', httpStatus: response.status });
      return false;
    }
  } catch (error) {
    log.error(`Configuration verify error: ${error.message}`);
    setupResults.push({ step: 'Configuration Verify', status: 'ERROR', error: error.message });
    return false;
  }
}

// Test sync functionality
async function testDisplaySync() {
  try {
    log.info('Step 5: Testing display sync with your API token...');
    
    const response = await fetch(`${BASE_URL}/api/optisigns/displays/sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwtToken}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      log.success('Display sync working! Your OptiSigns integration is ready!');
      console.log('Sync result:', JSON.stringify(data, null, 2));
      setupResults.push({ step: 'Display Sync', status: 'SUCCESS', httpStatus: response.status });
      return true;
    } else {
      log.error(`Display sync failed with status: ${response.status}`);
      console.log('Response:', JSON.stringify(data, null, 2));
      setupResults.push({ step: 'Display Sync', status: 'FAILED', httpStatus: response.status, data });
      return false;
    }
  } catch (error) {
    log.error(`Display sync error: ${error.message}`);
    setupResults.push({ step: 'Display Sync', status: 'ERROR', error: error.message });
    return false;
  }
}

// Generate summary report
function generateSummary() {
  log.section('CONFIGURATION SUMMARY');

  const getStatusIcon = (step) => {
    const result = setupResults.find(r => r.step === step);
    if (!result) return '❓';
    switch (result.status) {
      case 'SUCCESS': return '✅';
      case 'FAILED': return '❌';
      case 'ERROR': return '💥';
      default: return '❓';
    }
  };

  const getStatusText = (step) => {
    const result = setupResults.find(r => r.step === step);
    if (!result) return 'Unknown';
    switch (result.status) {
      case 'SUCCESS': return 'Working';
      case 'FAILED': return 'Failed';
      case 'ERROR': return 'Error';
      default: return 'Unknown';
    }
  };

  console.log(`${getStatusIcon('Authentication')} Authentication: ${getStatusText('Authentication')}`);
  console.log(`${getStatusIcon('API Token Test')} API Token Test: ${getStatusText('API Token Test')}`);
  console.log(`${getStatusIcon('Configuration Save')} Configuration Save: ${getStatusText('Configuration Save')}`);
  console.log(`${getStatusIcon('Configuration Verify')} Configuration Verify: ${getStatusText('Configuration Verify')}`);
  console.log(`${getStatusIcon('Display Sync')} Display Sync: ${getStatusText('Display Sync')}`);

  const configSaveSuccess = setupResults.find(r => r.step === 'Configuration Save')?.status === 'SUCCESS';
  
  if (configSaveSuccess) {
    log.success('🎉 OptiSigns API token successfully configured!');
    console.log('\n🚀 You can now:');
    console.log('   • Sync displays: POST /api/optisigns/displays/sync');
    console.log('   • Sync assets: POST /api/optisigns/assets/sync');
    console.log('   • Pair devices: POST /api/optisigns/devices/pair');
    console.log('   • View analytics: GET /api/optisigns/analytics');
    console.log('\n💡 Run the enhanced test script to see all features in action!');
  } else {
    log.error('❌ Configuration failed. Please check your API token and try again.');
  }
}

// Main setup function
async function runConfigurationSetup() {
  log.section('OptiSigns Configuration Setup');
  console.log('🎯 Adding your API token to the system');
  console.log(`📍 Base URL: ${BASE_URL}`);

  // Step 1: Authentication
  const authSuccess = await authenticate();
  if (!authSuccess) {
    log.error('Cannot proceed without authentication');
    return;
  }

  // Step 2: Test OptiSigns API token
  await testOptiSignsToken();

  // Step 3: Save configuration
  const saveSuccess = await saveConfiguration();
  if (!saveSuccess) {
    log.error('Configuration save failed, stopping setup');
    generateSummary();
    return;
  }

  // Step 4: Verify configuration
  await verifyConfiguration();

  // Step 5: Test sync functionality
  await testDisplaySync();

  // Generate summary
  generateSummary();
}

// Run the setup
if (require.main === module) {
  runConfigurationSetup().catch(console.error);
}

module.exports = { runConfigurationSetup, OPTISIGNS_API_TOKEN }; 