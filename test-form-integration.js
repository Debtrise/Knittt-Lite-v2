const axios = require('axios');

const API_URL = 'http://34.122.156.88:3001/api';

async function testFormIntegration() {
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
    console.log('\nRetrieving current tenant information...');
    const tenantResponse = await axios.get(`${API_URL}/tenants/${tenantId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    const currentConfig = tenantResponse.data;
    console.log('Current API config:', JSON.stringify(currentConfig.apiConfig, null, 2));
    
    // Step 3: Simulate form data as it would be submitted from the settings page
    console.log('\nSimulating form submission...');
    
    const formData = {
      apiConfig: {
        url: "https://btr.ytel.com/x5/api/non_agent_api.php",
        apiKey: "Ytel2618231",
        apiSecret: "4USz9PfeiV8",
        groups: ["TaxSales", "TaxSupport"],
        source: "BTR"
      },
      dialerConfig: {
        speed: 12,
        minAgentsAvailable: 4,
        autoDelete: true,
        sortOrder: 'oldest',
        didDistribution: 'even'
      }
    };
    
    console.log('Form data:', JSON.stringify(formData, null, 2));
    
    // Step 4: Transform form data as the onSubmit function would
    console.log('\nTransforming form data for API...');
    
    // Extract groups
    let groups = formData.apiConfig.groups;
    if (!Array.isArray(groups)) {
      groups = [];
    }
    
    // Ensure at least one group is set
    if (groups.length === 0) {
      groups = ['TaxSales'];
    }
    
    // Prepare the API config update
    const updatedApiConfig = {
      ...currentConfig.apiConfig,
      url: formData.apiConfig.url,
      user: formData.apiConfig.apiKey,
      password: formData.apiConfig.apiSecret,
      ingroup: groups.length > 0 ? groups[0] : 'TaxSales',
      ingroups: groups.join(',')
    };
    
    console.log('Transformed API config:', JSON.stringify(updatedApiConfig, null, 2));
    
    // Step 5: Make the API update
    console.log('\nSending update to API...');
    
    const updateResponse = await axios.put(`${API_URL}/tenants/${tenantId}`, 
      {
        ...currentConfig,
        apiConfig: updatedApiConfig,
        dialerConfig: {
          ...currentConfig.dialerConfig,
          ...formData.dialerConfig
        }
      }, 
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    // Step 6: Verify the update
    console.log('\nVerifying the update...');
    
    const verifyResponse = await axios.get(`${API_URL}/tenants/${tenantId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    const updatedConfig = verifyResponse.data;
    
    console.log('\nUpdated API Config:');
    console.log(JSON.stringify(updatedConfig.apiConfig, null, 2));
    
    console.log('\nUpdated Dialer Config:');
    console.log(JSON.stringify(updatedConfig.dialerConfig, null, 2));
    
    // Step 7: Check if all fields were updated correctly
    const checks = {
      url: updatedConfig.apiConfig.url === formData.apiConfig.url,
      user: updatedConfig.apiConfig.user === formData.apiConfig.apiKey,
      password: updatedConfig.apiConfig.password === formData.apiConfig.apiSecret,
      ingroup: updatedConfig.apiConfig.ingroup === groups[0],
      ingroups: updatedConfig.apiConfig.ingroups === groups.join(','),
      speed: updatedConfig.dialerConfig.speed === formData.dialerConfig.speed,
      minAgentsAvailable: updatedConfig.dialerConfig.minAgentsAvailable === formData.dialerConfig.minAgentsAvailable,
    };
    
    console.log('\nVerification Results:');
    Object.entries(checks).forEach(([field, isCorrect]) => {
      console.log(`${field}: ${isCorrect ? '✅ Passed' : '❌ Failed'}`);
      if (!isCorrect) {
        console.log(`  Expected: ${field === 'ingroups' ? groups.join(',') : 
                              field === 'ingroup' ? groups[0] : 
                              formData.apiConfig[field] || formData.dialerConfig[field]}`);
        console.log(`  Actual: ${updatedConfig.apiConfig[field] || updatedConfig.dialerConfig[field]}`);
      }
    });
    
    const allPassed = Object.values(checks).every(check => check === true);
    
    console.log(`\nOverall Test: ${allPassed ? '✅ All Passed' : '❌ Some Checks Failed'}`);
    
    return {
      success: allPassed,
      checks
    };
  } catch (error) {
    console.error('Error testing form integration:', error.response?.data || error.message);
    throw error;
  }
}

// Execute the test
testFormIntegration()
  .then(result => {
    console.log('\nForm integration test completed!');
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Form integration test failed with error:', error);
    process.exit(1);
  }); 