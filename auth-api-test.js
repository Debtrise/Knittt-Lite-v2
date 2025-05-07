const axios = require('axios');

// API URLs
const MAIN_API_URL = 'http://34.122.156.88:3001/api';

// Test login to get auth token
async function testLogin() {
  try {
    console.log('Testing login...');
    
    // Try a test login - replace with valid credentials
    const response = await axios.post(`${MAIN_API_URL}/login`, {
      username: 'admin',  // Replace with actual username
      password: 'admin'   // Replace with actual password
    });
    
    console.log('Login successful!');
    console.log('Token:', response.data.token);
    return response.data.token;
  } catch (error) {
    console.error('Login error:', 
      error.response?.status, 
      error.response?.data || error.message);
    return null;
  }
}

// Test API call with auth token
async function testAuthenticatedCall(token) {
  try {
    console.log('\nTesting authenticated API call...');
    
    const response = await axios.get(`${MAIN_API_URL}/leads?limit=5`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('API call successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('API call error:', 
      error.response?.status, 
      error.response?.data || error.message);
    return false;
  }
}

// Run tests
async function runAuthTest() {
  // First login to get token
  const token = await testLogin();
  
  if (token) {
    // Use token for authenticated API call
    await testAuthenticatedCall(token);
  } else {
    console.log('\nSkipping authenticated call test as login failed');
  }
}

runAuthTest(); 