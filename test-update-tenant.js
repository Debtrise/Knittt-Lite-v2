const axios = require('axios');

const API_URL = 'http://34.122.156.88:3001/api';

async function updateTenantConfig() {
  try {
    // Step 1: Authenticate
    console.log('Authenticating...');
    const loginResponse = await axios.post(`${API_URL}/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    const { token, userId, username, tenantId, role } = loginResponse.data;
    console.log('Authentication successful!');
    console.log('User:', { userId, username, tenantId, role });
    
    // Step 2: Get current tenant configuration
    console.log('\nRetrieving current tenant information...');
    const tenantResponse = await axios.get(`${API_URL}/tenants/${tenantId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    const currentConfig = tenantResponse.data;
    console.log('Current tenant configuration:', JSON.stringify(currentConfig, null, 2));
    
    // Step 3: Update the tenant with required fields
    console.log('\nUpdating tenant with required API configuration...');
    
    const updatedConfig = {
      ...currentConfig,
      apiConfig: {
        url: "https://btr.ytel.com/x5/api/non_agent_api.php",
        user: "Ytel2618231",
        password: "4USz9PfeiV8",
        source: "BTR",
        ingroup: "TaxSales", 
        ingroups: "TaxSales",
        endpoint: "https://btr.ytel.com/x5/api/non_agent_api"
      }
    };
    
    const updateResponse = await axios.put(`${API_URL}/tenants/${tenantId}`, updatedConfig, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Tenant update response:', JSON.stringify(updateResponse.data, null, 2));
    console.log('\nTenant API configuration updated successfully!');
    
    return {
      before: currentConfig,
      after: updateResponse.data
    };
  } catch (error) {
    console.error('Error updating tenant:', error.response?.data || error.message);
    throw error;
  }
}

// Execute the update
updateTenantConfig()
  .then(result => {
    console.log('Update completed successfully!');
  })
  .catch(error => {
    console.error('Update failed:', error);
  }); 