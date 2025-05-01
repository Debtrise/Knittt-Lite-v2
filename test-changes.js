const axios = require('axios');

const API_URL = 'http://34.122.156.88:3001/api';

async function testChanges() {
  try {
    // Step 1: Authenticate
    console.log('Authenticating...');
    const loginResponse = await axios.post(`${API_URL}/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    const { token, userId, username, tenantId, role } = loginResponse.data;
    console.log('Authentication successful!');
    
    // Step 2: Get current tenant configuration
    console.log('\nRetrieving tenant information...');
    const tenantResponse = await axios.get(`${API_URL}/tenants/${tenantId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    const tenantData = tenantResponse.data;
    console.log('Current tenant data:');
    console.log(JSON.stringify(tenantData, null, 2));
    
    // Step 3: Update tenant settings
    console.log('\nUpdating tenant settings...');
    
    // Create updated tenant data based on what we received
    const updatedTenant = {
      ...tenantData,
      apiConfig: {
        ...tenantData.apiConfig,
        url: 'https://btr.ytel.com/x5/api/non_agent_api.php',
        user: 'Ytel2618231', 
        password: '4USz9PfeiV8',
        source: 'BTR',
        ingroup: 'TaxSales',
        ingroups: 'TaxSales',
        endpoint: 'https://btr.ytel.com/x5/api/non_agent_api'
      }
    };
    
    const updateResponse = await axios.put(`${API_URL}/tenants/${tenantId}`, updatedTenant, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Tenant update response:');
    console.log(JSON.stringify(updateResponse.data, null, 2));
    
    // Step 4: Test agent status API with updated settings through the backend API
    console.log('\nTesting agent status API...');
    
    // Use the backend API endpoint for agent status instead of direct call
    // Include all required parameters
    const agentStatusResponse = await axios.get(`${API_URL}/agent-status`, {
      params: {
        url: updatedTenant.apiConfig.url,
        user: updatedTenant.apiConfig.user,
        pass: updatedTenant.apiConfig.password,
        ingroups: updatedTenant.apiConfig.ingroup
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Agent status response:');
    console.log(JSON.stringify(agentStatusResponse.data, null, 2));
    
    return {
      auth: { token, userId, username, tenantId, role },
      tenant: tenantData,
      updatedTenant: updateResponse.data,
      agentStatus: agentStatusResponse.data
    };
  } catch (error) {
    console.error('Test Error:', error.response?.data || error.message);
    throw error;
  }
}

// Execute the test
testChanges()
  .then(result => {
    console.log('\nTest completed successfully!');
  })
  .catch(error => {
    console.error('Test failed:', error);
  }); 