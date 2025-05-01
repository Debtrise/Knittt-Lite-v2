const axios = require('axios');

// Mock token for authentication (replace with your actual token)
const TOKEN = 'YOUR_AUTH_TOKEN';

// API base URL
const API_URL = 'http://34.122.156.88:3001/api';

// Create an axios instance with the base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Function to get tenant data
const getTenant = async (id) => {
  try {
    const response = await api.get(`/tenants/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching tenant:', error.response?.data || error.message);
    throw error;
  }
};

// Function to update tenant
const updateTenant = async (id, tenantData) => {
  try {
    const response = await api.put(`/tenants/${id}`, tenantData);
    return response.data;
  } catch (error) {
    console.error('Error updating tenant:', error.response?.data || error.message);
    throw error;
  }
};

// Test function to update working hours
const testUpdateWorkingHours = async () => {
  try {
    // Replace with your actual tenant ID
    const tenantId = 1;
    
    // 1. First get the current tenant data
    console.log(`Fetching tenant data for ID: ${tenantId}...`);
    const currentTenant = await getTenant(tenantId);
    console.log('Current tenant data:', JSON.stringify(currentTenant, null, 2));
    
    // 2. Prepare the updated schedule
    const updatedSchedule = {
      0: { enabled: false, startTime: '09:00', endTime: '17:00' }, // Sunday
      1: { enabled: true, startTime: '08:00', endTime: '16:00' },  // Monday
      2: { enabled: true, startTime: '08:00', endTime: '16:00' },  // Tuesday
      3: { enabled: true, startTime: '08:00', endTime: '16:00' },  // Wednesday
      4: { enabled: true, startTime: '08:00', endTime: '16:00' },  // Thursday
      5: { enabled: true, startTime: '08:00', endTime: '16:00' },  // Friday
      6: { enabled: false, startTime: '09:00', endTime: '17:00' }  // Saturday
    };
    
    // 3. Create the updated tenant data object
    const updatedTenant = {
      ...currentTenant,
      schedule: updatedSchedule
    };
    
    // 4. Update the tenant
    console.log('Updating tenant with new schedule...');
    const result = await updateTenant(tenantId, updatedTenant);
    console.log('Update successful:', JSON.stringify(result, null, 2));
    
    // 5. Verify the update by fetching the tenant data again
    console.log('Verifying update...');
    const verifiedTenant = await getTenant(tenantId);
    console.log('Updated tenant data:', JSON.stringify(verifiedTenant?.schedule, null, 2));
    
  } catch (error) {
    console.error('Test failed:', error);
  }
};

// Run the test
testUpdateWorkingHours(); 