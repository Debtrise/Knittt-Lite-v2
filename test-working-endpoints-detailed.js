const axios = require('axios');

const BASE_URL = 'http://34.122.156.88:3001/api/optisigns';
const LOGIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

let jwtToken = null;

async function getJWTToken() {
  if (jwtToken) return jwtToken;
  
  try {
    const response = await axios.post('http://34.122.156.88:3001/api/login', LOGIN_CREDENTIALS);
    jwtToken = response.data.token;
    return jwtToken;
  } catch (error) {
    console.error('❌ Failed to authenticate:', error.response?.data || error.message);
    return null;
  }
}

// Only test the working endpoints with detailed response logging
const workingEndpoints = [
  {
    name: 'Get Configuration',
    method: 'GET',
    endpoint: '/config'
  },
  {
    name: 'Get Displays',
    method: 'GET',
    endpoint: '/displays'
  },
  {
    name: 'Get Content',
    method: 'GET',
    endpoint: '/content'
  },
  {
    name: 'Get Content with Remote',
    method: 'GET',
    endpoint: '/content?includeRemote=true'
  },
  {
    name: 'Get Analytics',
    method: 'GET',
    endpoint: '/analytics'
  },
  {
    name: 'Get Analytics with Dates',
    method: 'GET',
    endpoint: '/analytics?startDate=2024-12-01&endDate=2024-12-20'
  }
];

async function testWorkingEndpoint(test) {
  const token = await getJWTToken();
  if (!token) {
    return { success: false, error: 'Failed to get JWT token' };
  }

  const config = {
    method: test.method,
    url: `${BASE_URL}${test.endpoint}`,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  try {
    const startTime = Date.now();
    const response = await axios(config);
    const responseTime = Date.now() - startTime;
    
    return {
      success: true,
      status: response.status,
      responseTime,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 0,
      error: error.response?.data?.error || error.message,
      fullError: error.response?.data || error.message
    };
  }
}

async function runDetailedWorkingTests() {
  console.log('🔍 DETAILED TEST OF WORKING OPTISIGNS ENDPOINTS');
  console.log('=' .repeat(80));
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log('=' .repeat(80));

  // Authenticate first
  const token = await getJWTToken();
  if (!token) {
    console.log('❌ Authentication failed. Cannot proceed.');
    return;
  }
  console.log('✅ Successfully authenticated with admin credentials\n');

  for (const test of workingEndpoints) {
    console.log(`\n🧪 Testing: ${test.name}`);
    console.log(`   ${test.method} ${test.endpoint}`);
    console.log('   ' + '-'.repeat(50));

    const result = await testWorkingEndpoint(test);

    if (result.success) {
      console.log(`   ✅ SUCCESS (${result.status}) - ${result.responseTime}ms`);
      console.log('   📊 RESPONSE DATA:');
      console.log(JSON.stringify(result.data, null, 4).split('\n').map(line => '   ' + line).join('\n'));
    } else {
      console.log(`   ❌ FAILED (${result.status}): ${result.error}`);
    }
    
    console.log('   ' + '-'.repeat(50));
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '=' .repeat(80));
  console.log('🏁 DETAILED WORKING ENDPOINTS TEST COMPLETED');
  console.log('=' .repeat(80));
}

// Run the detailed tests
runDetailedWorkingTests().catch(console.error); 