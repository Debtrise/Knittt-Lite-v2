const axios = require('axios');
const readline = require('readline');

// API URL - adjust if needed
const API_URL = process.env.API_URL || 'http://34.122.156.88:3001/api';

// Get API token from environment or prompt
const API_TOKEN = process.env.API_TOKEN || '';

// Create axios instance with auth
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${API_TOKEN}`
  }
});

// Function to prompt for input
const prompt = (question) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
};

// Function to get auth token
async function getAuthToken(username, password) {
  try {
    console.log('Fetching auth token...');
    const response = await api.post('/login', { username, password });
    console.log('Auth token received');
    return response.data.token;
  } catch (error) {
    console.error('Error fetching auth token:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received from server');
    } else {
      console.error('Error:', error.message);
    }
    throw error;
  }
}

// Function to test lead upload with auto-enroll
async function testLeadUploadWithAutoEnroll(journeyId) {
  try {
    console.log(`Testing lead upload with auto-enrollment for journey ID: ${journeyId}`);
    const leadData = {
      data: {
        leads: [
          {
            phone_number: '1234567890',
            name: 'Test Lead'
          }
        ],
        auto_enroll_journey_id: parseInt(journeyId)
      }
    };
    console.log('Request Data:', JSON.stringify(leadData, null, 2));
    const response = await api.post('/leads/upload', leadData);
    console.log('Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error testing lead upload with auto-enrollment:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received from server');
    } else {
      console.error('Error:', error.message);
    }
    console.error('Note: The API is rejecting the request with a 400 error about an "iterable" argument. Please check the API documentation or contact backend support for the correct endpoint or data format for lead upload with auto-enrollment.');
    throw error;
  }
}

// Main function
async function main() {
  try {
    let token = API_TOKEN;
    if (!token) {
      const username = await prompt('Enter your username (default: admin): ') || 'admin';
      const password = await prompt('Enter your password (default: admin123): ') || 'admin123';
      token = await getAuthToken(username, password);
      api.defaults.headers.Authorization = `Bearer ${token}`;
    }

    const journeyId = await prompt('Enter the Journey ID for auto-enrollment testing: ');
    await testLeadUploadWithAutoEnroll(journeyId);
  } catch (error) {
    console.error('Script failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main(); 