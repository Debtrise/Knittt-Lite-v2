const axios = require('axios');

const BASE_URL = 'http://34.122.156.88:3001/api';
const LOGIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

async function getToken() {
  try {
    const response = await axios.post(`${BASE_URL}/login`, LOGIN_CREDENTIALS);
    return response.data.token;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return null;
  }
}

async function testPhotoEndpoints() {
  console.log('🔍 TESTING PHOTO ENDPOINTS');
  console.log('='.repeat(50));
  
  const token = await getToken();
  if (!token) {
    console.log('❌ Cannot proceed without token');
    return;
  }
  
  console.log('✅ Token obtained');
  
  const endpoints = [
    '/sales-rep-photos',
    '/sales-rep-photos/by-email/test.agent@company.com',
    '/content/assets', // Alternative endpoint
    '/content/projects', // Another alternative
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔄 Testing: ${endpoint}`);
      const response = await axios.get(`${BASE_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`✅ Status: ${response.status}`);
      console.log('📊 Response:', JSON.stringify(response.data, null, 2));
      
    } catch (error) {
      console.log(`❌ Status: ${error.response?.status || 'Network Error'}`);
      console.log(`   Error: ${error.response?.data?.error || error.message}`);
    }
  }
}

testPhotoEndpoints(); 