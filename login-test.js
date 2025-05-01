const axios = require('axios');
const config = require('./app/utils/dialplanApiConfig');

async function testLogin() {
  try {
    console.log(`Attempting to login to: ${config.apiUrl}/login`);
    
    // Replace with actual credentials
    const credentials = {
      username: 'admin', // Replace with your username
      password: 'admin123', // Replace with your password
    };
    
    console.log('Using credentials:', credentials.username);
    
    const response = await axios.post(`${config.apiUrl}/login`, credentials);
    
    if (response.data && response.data.token) {
      console.log('Login successful!');
      console.log('Auth token:', response.data.token);
      console.log('\nUpdate app/utils/dialplanApiConfig.js with this token to run the dialplan tests.');
    } else {
      console.log('Login returned unexpected data:', response.data);
    }
  } catch (error) {
    console.error('Login failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Status code:', error.response.status);
    }
  }
}

testLogin(); 