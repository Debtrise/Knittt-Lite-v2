const axios = require('axios');

const API_URL = 'http://34.122.156.88:3001/api';

async function testUrlUpdate() {
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
    
    // Ensure we have a different URL to test with
    const originalUrl = currentConfig.apiConfig.url;
    const testUrl = originalUrl.includes('test') 
      ? "https://btr.ytel.com/x5/api/non_agent_api.php" 
      : "https://btr.ytel.com/test/api/non_agent_api.php";
    
    console.log(`\nChanging URL from: ${originalUrl} to: ${testUrl}`);
    
    // Step 3: Update just the URL
    const updateResponse = await axios.put(`${API_URL}/tenants/${tenantId}`, 
      {
        ...currentConfig,
        apiConfig: {
          ...currentConfig.apiConfig,
          url: testUrl
        }
      }, 
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    console.log('Update response API config:', JSON.stringify(updateResponse.data.apiConfig, null, 2));
    
    // Step 4: Verify the URL was updated
    const verifyResponse = await axios.get(`${API_URL}/tenants/${tenantId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('\nVerification result:');
    console.log('API Config URL:', verifyResponse.data.apiConfig.url);
    
    if (verifyResponse.data.apiConfig.url === testUrl) {
      console.log('\nURL update successful! ✅');
    } else {
      console.log('\nURL update failed! ❌');
      console.log(`Expected: ${testUrl}`);
      console.log(`Actual: ${verifyResponse.data.apiConfig.url}`);
    }
    
    // Reset back to original URL
    console.log('\nResetting back to original URL...');
    await axios.put(`${API_URL}/tenants/${tenantId}`, 
      {
        ...verifyResponse.data,
        apiConfig: {
          ...verifyResponse.data.apiConfig,
          url: originalUrl
        }
      }, 
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    return {
      originalUrl,
      testUrl,
      success: verifyResponse.data.apiConfig.url === testUrl
    };
  } catch (error) {
    console.error('Error testing URL update:', error.response?.data || error.message);
    throw error;
  }
}

// Execute the test
testUrlUpdate()
  .then(result => {
    console.log('\nURL update test completed!');
  })
  .catch(error => {
    console.error('URL update test failed:', error);
  }); 