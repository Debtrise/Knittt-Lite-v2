#!/usr/bin/env node

const BASE_URL = 'http://34.122.156.88:3001';

// Test credentials
const LOGIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

// Different token formats to test
const TOKENS_TO_TEST = [
  {
    name: 'New Token (op-format)',
    token: 'op-Naqtq9T96nPHY6b5Z-SzNmeUFTYnpNU0FCdmpZeUQxNzUwNjIzMjc4NzQy'
  },
  {
    name: 'Original JWT Token',
    token: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJ4RGRuREpOdXVQMmJEb2pudyIsImNpZCI6Ilk2S0QyeUpjZ1hRZjZOU2JvIiwiYWlkIjoicWh6UjRDUXlrTGRKd0RibjgiLCJpYXQiOjE3NTA0NDcyMTMsImV4cCI6MTc1MDQ1MDgxMywiaXNzIjoicWh6UjRDUXlrTGRKd0RibjgifQ.zWYHOHFFtZ7xaNDlUP88sUAFRFYOgMgv-g11532DmHAjIV0uTJR91i_VAJNsCGLBIRYpfdmAxrL1Mwzh3cj69Mj-1EN1oEuiGQpwVExDCzAgb2tyO49UWV4X7RjaCizwPdOLweKZ-UXWBKX4rImGQDrd6TWl4hIOUuY4NnAk-JlULwnMIo3VKrYKsCzTXaPSjXPWkTsnQMTt8d6QAr024Owgy3numT_vdv3waZ_PPTKxhrR3hNRIGijjJaki0URk8TMWo3Ji-xVZ3rmJxS5d1G-9Mj2RIQuJTH-a41Cz-_X6uZJRe6OSaxf_9BoYxgK2AxalaTKrFXAp7tNDSraA1YvHjb8GqH-jtIDi_Q1mWPLlWSVHKYrdRsbpWPqmLOQQFhUgCgBHxE54ic8vlNFcXwtFHl-5TC29zXQCyZNvAQNm-i-VCeC_4UbhrEDhgtemPHZw7Yc4L-4rKlIbvno-1dZasaDzHwLaK6t4ym97I2UtmQWsSl6qXV_yegapNcbQL_Y4PoG14Qavy3FI3h2iOZSncGM22Ca6wbuPaKKdhAO2wBGQsOs4n4Cg-4_hODNKCHRc18qvCQK5gBqd0aeUYQ98p7c85G57rLE3SK1fDyaXCAHFYZKdgUUUFcVTOCzoaMyYIqh_-p6sHYLR_Y9sOWkjSDl7yBZSNERIxq73uXQ'
  },
  {
    name: 'Dummy Token (for control)',
    token: 'dummy_token_123'
  }
];

let jwtToken = null;

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
    log.info('Authenticating to dialer app...');
    
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

// Test a specific token
async function testToken(tokenInfo) {
  try {
    console.log(`\n📋 Testing: ${tokenInfo.name}`);
    console.log(`🔑 Token: ${tokenInfo.token.substring(0, 50)}...`);
    
    const response = await fetch(`${BASE_URL}/api/optisigns/config/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify({ apiToken: tokenInfo.token })
    });

    const data = await response.json();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📄 Response:`, JSON.stringify(data, null, 2));
    
    if (response.ok) {
      log.success(`${tokenInfo.name} - VALID TOKEN! 🎉`);
      return { name: tokenInfo.name, status: 'SUCCESS', httpStatus: response.status, data };
    } else {
      const errorType = data.error?.includes('jwt malformed') ? 'MALFORMED JWT' :
                       data.error?.includes('API_NOT_AVAILABLE') ? 'API NOT AVAILABLE' :
                       data.error?.includes('Unauthorized') ? 'UNAUTHORIZED' :
                       'OTHER ERROR';
      
      log.error(`${tokenInfo.name} - ${errorType}`);
      return { name: tokenInfo.name, status: 'FAILED', httpStatus: response.status, errorType, data };
    }
  } catch (error) {
    log.error(`${tokenInfo.name} - ERROR: ${error.message}`);
    return { name: tokenInfo.name, status: 'ERROR', error: error.message };
  }
}

// Main test function
async function runTokenFormatTest() {
  log.section('OptiSigns Token Format Testing');
  console.log('🎯 Testing different token formats to find the correct one');
  console.log(`📍 Base URL: ${BASE_URL}`);

  // Step 1: Authentication
  const authSuccess = await authenticate();
  if (!authSuccess) {
    log.error('Cannot proceed without authentication');
    return;
  }

  // Step 2: Test all token formats
  const results = [];
  
  for (const tokenInfo of TOKENS_TO_TEST) {
    const result = await testToken(tokenInfo);
    results.push(result);
  }

  // Step 3: Generate summary
  log.section('TOKEN FORMAT TEST SUMMARY');
  
  console.log('📊 Results:');
  results.forEach((result, index) => {
    const icon = result.status === 'SUCCESS' ? '✅' : 
                 result.status === 'FAILED' ? '❌' : '💥';
    console.log(`${icon} ${index + 1}. ${result.name}`);
    console.log(`   Status: ${result.status}`);
    if (result.httpStatus) console.log(`   HTTP: ${result.httpStatus}`);
    if (result.errorType) console.log(`   Error Type: ${result.errorType}`);
    console.log('');
  });

  const successCount = results.filter(r => r.status === 'SUCCESS').length;
  const totalCount = results.length;
  
  if (successCount > 0) {
    log.success(`🎉 Found ${successCount} working token(s) out of ${totalCount} tested!`);
    
    const workingTokens = results.filter(r => r.status === 'SUCCESS');
    console.log('\n🚀 Working tokens:');
    workingTokens.forEach((token, index) => {
      console.log(`${index + 1}. ${token.name}`);
    });
  } else {
    log.error(`❌ No working tokens found out of ${totalCount} tested`);
    console.log('\n🔍 Error analysis:');
    results.forEach(result => {
      if (result.errorType) {
        console.log(`• ${result.name}: ${result.errorType}`);
      }
    });
    
    console.log('\n💡 Possible solutions:');
    console.log('• Check if OptiSigns service is running');
    console.log('• Verify token format with OptiSigns documentation');
    console.log('• Generate a fresh token from OptiSigns dashboard');
    console.log('• Check network connectivity to OptiSigns API');
  }
}

// Run the test
if (require.main === module) {
  runTokenFormatTest().catch(console.error);
}

module.exports = { runTokenFormatTest }; 