const axios = require('axios');

const API_URL = 'http://34.122.156.88:3001/api';

async function testTenantSchedule() {
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
    console.log('Current tenant schedule:', JSON.stringify(currentConfig.schedule, null, 2));
    console.log('Current tenant timezone:', currentConfig.timezone);
    
    // Step 3: Update only the schedule
    console.log('\nUpdating tenant schedule...');
    
    const updatedSchedule = {
      monday: { enabled: true, start: '08:00', end: '18:00' },
      tuesday: { enabled: true, start: '08:00', end: '18:00' },
      wednesday: { enabled: true, start: '08:00', end: '18:00' },
      thursday: { enabled: true, start: '08:00', end: '18:00' },
      friday: { enabled: true, start: '08:00', end: '17:00' },
      saturday: { enabled: true, start: '09:00', end: '15:00' },
      sunday: { enabled: false, start: '09:00', end: '17:00' }
    };
    
    const updateResponse = await axios.put(`${API_URL}/tenants/${tenantId}`, {
      schedule: updatedSchedule,
      timezone: 'America/New_York'
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Tenant update response:', JSON.stringify(updateResponse.data, null, 2));
    console.log('\nTenant schedule updated successfully!');
    
    // Step 4: Get updated tenant configuration
    console.log('\nRetrieving updated tenant information...');
    const updatedTenantResponse = await axios.get(`${API_URL}/tenants/${tenantId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    const updatedConfig = updatedTenantResponse.data;
    console.log('Updated tenant schedule:', JSON.stringify(updatedConfig.schedule, null, 2));
    console.log('Updated tenant timezone:', updatedConfig.timezone);
    
    return {
      before: currentConfig,
      after: updatedConfig
    };
  } catch (error) {
    console.error('Error updating tenant schedule:', error.response?.data || error.message);
    throw error;
  }
}

// Execute the test
testTenantSchedule()
  .then(result => {
    console.log('Test completed successfully!');
  })
  .catch(error => {
    console.error('Test failed:', error);
  }); 