const axios = require('axios');

const API_URL = 'http://34.122.156.88:3001/api';

async function testSettingsUpdate() {
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
    console.log('Current API config:', JSON.stringify(currentConfig.apiConfig, null, 2));
    
    // Step 3: Update the settings like our form does
    console.log('\nTesting settings update...');
    
    // Create the update payload similar to our form
    const groups = ["TaxSales", "TaxSupport"];
    
    // First call updateTenantSettings with just the URL and groups
    console.log('\nUpdating tenant settings (Step 1)...');
    const settingsUpdateResponse = await axios.put(`${API_URL}/tenants/${tenantId}`, 
      {
        ...currentConfig,
        apiConfig: {
          ...currentConfig.apiConfig,
          url: "https://btr.ytel.com/x5/api/non_agent_api.php",
          ingroup: groups[0],
          ingroups: groups.join(',')
        }
      }, 
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    console.log('Settings update response:', 
      JSON.stringify(settingsUpdateResponse.data.apiConfig, null, 2));
    
    // Now update all other settings
    console.log('\nUpdating all tenant settings (Step 2)...');
    const fullUpdateResponse = await axios.put(`${API_URL}/tenants/${tenantId}`, 
      {
        ...currentConfig,
        apiConfig: {
          ...currentConfig.apiConfig,
          url: "https://btr.ytel.com/x5/api/non_agent_api.php",
          user: "Ytel2618231",
          password: "4USz9PfeiV8",
          ingroup: groups[0],
          ingroups: groups.join(',')
        },
        dialerConfig: {
          ...currentConfig.dialerConfig,
          speed: 10,
          minAgentsAvailable: 3
        }
      }, 
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    console.log('Full update response:');
    console.log('- API Config:', JSON.stringify(fullUpdateResponse.data.apiConfig, null, 2));
    console.log('- Dialer Config:', JSON.stringify(fullUpdateResponse.data.dialerConfig, null, 2));
    
    // Step 4: Verify the settings were updated
    console.log('\nVerifying settings update...');
    const verifyResponse = await axios.get(`${API_URL}/tenants/${tenantId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Verification result:');
    console.log('- API Config:', JSON.stringify(verifyResponse.data.apiConfig, null, 2));
    console.log('- Dialer Config:', JSON.stringify(verifyResponse.data.dialerConfig, null, 2));
    
    return {
      before: currentConfig,
      after: verifyResponse.data
    };
  } catch (error) {
    console.error('Error testing settings update:', error.response?.data || error.message);
    throw error;
  }
}

// Execute the test
testSettingsUpdate()
  .then(result => {
    console.log('\nSettings update test completed successfully!');
  })
  .catch(error => {
    console.error('Settings update test failed:', error);
  }); 