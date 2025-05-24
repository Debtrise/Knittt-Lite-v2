const axios = require('axios');

const API_URL = 'http://34.122.156.88:3001/api';
let authToken = null;

// Create a configured axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000
});

// Add request/response logging
api.interceptors.request.use(request => {
  console.log('\n=== REQUEST DETAILS ===');
  console.log(`Method: ${request.method.toUpperCase()}`);
  console.log(`URL: ${request.baseURL}${request.url}`);
  console.log('Headers:', request.headers);
  console.log('Params:', request.params);
  return request;
});

api.interceptors.response.use(
  response => {
    console.log('\n=== RESPONSE DETAILS ===');
    console.log(`Status: ${response.status}`);
    console.log(`URL: ${response.config.url}`);
    console.log('Headers:', response.headers);
    return response;
  },
  error => {
    console.log('\n=== ERROR DETAILS ===');
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`URL: ${error.config.url}`);
      console.log('Response data:', error.response.data);
      console.log('Response headers:', error.response.headers);
    } else {
      console.log(`Error: ${error.message}`);
    }
    return Promise.reject(error);
  }
);

async function testWebhookAPI() {
  try {
    // Step 1: Authenticate
    console.log('\n=== AUTHENTICATION ===');
    const loginResponse = await api.post('/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    if (loginResponse.data && loginResponse.data.token) {
      authToken = loginResponse.data.token;
      console.log('✅ Authentication successful');
      console.log('Token:', authToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    } else {
      throw new Error('No token in response');
    }

    // Step 2: Test tenant endpoint first (to verify auth)
    console.log('\n=== TESTING TENANT ENDPOINT ===');
    try {
      const tenantResponse = await api.get('/tenants/1');
      console.log('✅ Tenant endpoint works!');
      console.log('Tenant data:', tenantResponse.data);
    } catch (error) {
      console.log('❌ Tenant endpoint failed');
      throw error;
    }

    // Step 3: Test webhook endpoints
    console.log('\n=== TESTING WEBHOOK ENDPOINTS ===');
    const endpoints = [
      '/webhooks',
      '/api/webhooks',
      '/webhook',
      '/api/webhook',
      '/v1/webhooks',
      '/v1/webhook'
    ];

    let workingEndpoint = null;
    for (const endpoint of endpoints) {
      try {
        console.log(`\nTesting GET ${endpoint}`);
        const response = await api.get(endpoint, {
          params: { page: 1, limit: 10 }
        });
        console.log(`✅ Endpoint ${endpoint} works!`);
        console.log('Response data:', response.data);
        workingEndpoint = endpoint;
        break;
      } catch (error) {
        console.log(`❌ Endpoint ${endpoint} failed`);
      }
    }

    if (!workingEndpoint) {
      // Try direct axios call as fallback
      console.log('\nTrying direct axios call...');
      const response = await axios.get(`${API_URL}/webhooks`, {
        params: { page: 1, limit: 10 },
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      console.log('✅ Direct axios call works!');
      console.log('Response data:', response.data);
      workingEndpoint = '/webhooks';
    }

    // Step 4: Test webhook creation if we found a working endpoint
    if (workingEndpoint) {
      console.log('\n=== TESTING WEBHOOK CREATION ===');
      const webhookData = {
        name: `Test Webhook ${Date.now()}`,
        description: 'Test webhook created by API test script',
        url: 'https://example.com/webhook',
        events: ['lead.created', 'lead.updated'],
        isActive: true
      };

      try {
        const createResponse = await api.post(workingEndpoint, webhookData);
        console.log('✅ Webhook created successfully');
        console.log('Created webhook:', createResponse.data);
      } catch (error) {
        console.log('❌ Failed to create webhook');
      }
    }

    // Step 5: Print final configuration
    console.log('\n=== FINAL CONFIGURATION ===');
    console.log('Working endpoint:', workingEndpoint);
    console.log('API URL:', API_URL);
    console.log('Auth token:', authToken ? 'Present' : 'Missing');

    return {
      workingEndpoint,
      apiUrl: API_URL,
      hasAuthToken: !!authToken
    };

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    throw error;
  }
}

// Run the test
testWebhookAPI()
  .then(result => {
    console.log('\n✅ API Test completed successfully!');
    console.log('Final configuration:', result);
  })
  .catch(error => {
    console.error('\n❌ API Test failed:', error);
  }); 