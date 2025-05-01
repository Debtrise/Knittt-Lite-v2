const axios = require('axios');

const API_URL = 'http://34.122.156.88:3001/api';

async function testAPI() {
  try {
    // Step 1: Get authentication token
    console.log('Authenticating...');
    const loginResponse = await axios.post(`${API_URL}/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    const { token, userId, username, tenantId, role } = loginResponse.data;
    console.log('Authentication successful!');
    console.log('User:', { userId, username, tenantId, role });
    
    // Step 2: Test getTenant function with the token
    console.log('\nRetrieving tenant information...');
    const tenantResponse = await axios.get(`${API_URL}/tenants/${tenantId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Tenant data retrieved successfully:');
    console.log(JSON.stringify(tenantResponse.data, null, 2));
    
    // Step 3: Test the agent status API using the backend
    console.log('\nTesting agent status API through backend...');
    const agentStatusResponse = await axios.get(`${API_URL}/agent-status`, {
      params: {
        url: tenantResponse.data.apiConfig.url,
        user: tenantResponse.data.apiConfig.user,
        pass: tenantResponse.data.apiConfig.password,
        ingroups: tenantResponse.data.apiConfig.ingroup
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Agent status response:');
    console.log(JSON.stringify(agentStatusResponse.data, null, 2));
    
    return {
      auth: { token, userId, username, tenantId, role },
      tenant: tenantResponse.data,
      agentStatus: agentStatusResponse.data
    };
  } catch (error) {
    console.error('API Test Error:', error.response?.data || error.message);
    throw error;
  }
}

// Execute the test
testAPI()
  .then(result => {
    console.log('\nAPI Test completed successfully!');
  })
  .catch(error => {
    console.error('API Test failed:', error);
  }); 