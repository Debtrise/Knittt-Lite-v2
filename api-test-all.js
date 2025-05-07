const axios = require('axios');
const fs = require('fs');

// API URLs
const MAIN_API_URL = 'http://34.122.156.88:3001/api';
const SMS_API_URL = 'http://34.122.156.88:3100';

// Test function for the main API
async function testMainApi(endpoint, method = 'get', data = null) {
  try {
    console.log(`Testing MAIN API: ${method.toUpperCase()} ${endpoint}`);
    
    let response;
    if (method === 'get') {
      response = await axios.get(`${MAIN_API_URL}${endpoint}`);
    } else if (method === 'post') {
      response = await axios.post(`${MAIN_API_URL}${endpoint}`, data);
    } else if (method === 'put') {
      response = await axios.put(`${MAIN_API_URL}${endpoint}`, data);
    }
    
    console.log(`Response status: ${response.status}`);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error(`Error with ${method.toUpperCase()} ${endpoint}:`, 
      error.response?.status, 
      error.response?.data || error.message);
    return null;
  }
}

// Test function for the SMS API
async function testSmsApi(endpoint, method = 'get', data = null) {
  try {
    console.log(`Testing SMS API: ${method.toUpperCase()} ${endpoint}`);
    
    let response;
    if (method === 'get') {
      response = await axios.get(`${SMS_API_URL}${endpoint}`);
    } else if (method === 'post') {
      response = await axios.post(`${SMS_API_URL}${endpoint}`, data);
    } else if (method === 'put') {
      response = await axios.put(`${SMS_API_URL}${endpoint}`, data);
    } else if (method === 'patch') {
      response = await axios.patch(`${SMS_API_URL}${endpoint}`, data);
    }
    
    console.log(`Response status: ${response.status}`);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error(`Error with ${method.toUpperCase()} ${endpoint}:`, 
      error.response?.status, 
      error.response?.data || error.message);
    return null;
  }
}

// Test leads upload API
async function testLeadsUpload() {
  try {
    console.log('Testing leads upload API...');
    
    const sampleCsv = 'name,phone,email\nJohn Doe,+1234567890,john@example.com\nJane Smith,+0987654321,jane@example.com';
    
    const response = await axios.post(`${MAIN_API_URL}/leads/upload`, {
      fileContent: sampleCsv,
      options: {
        hasHeader: true,
        columns: {
          name: 0,
          phone: 1,
          email: 2
        }
      }
    });
    
    console.log('Leads upload response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Leads upload error:', 
      error.response?.status, 
      error.response?.data || error.message);
    return null;
  }
}

// Test SMS campaign contacts upload
async function testSmsContactsUpload(campaignId) {
  try {
    console.log(`Testing SMS contacts upload for campaign ${campaignId}...`);
    
    // Create a sample CSV file
    const sampleCsv = 'name,phone,email\nJohn Doe,+1234567890,john@example.com\nJane Smith,+0987654321,jane@example.com';
    fs.writeFileSync('test-contacts.csv', sampleCsv);
    
    // Create form data
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('file', fs.createReadStream('test-contacts.csv'));
    
    const response = await axios.post(
      `${SMS_API_URL}/campaigns/${campaignId}/upload`,
      formData,
      {
        headers: formData.getHeaders()
      }
    );
    
    console.log('SMS contacts upload response:', JSON.stringify(response.data, null, 2));
    
    // Clean up
    fs.unlinkSync('test-contacts.csv');
    return response.data;
  } catch (error) {
    console.error('SMS contacts upload error:', 
      error.response?.status, 
      error.response?.data || error.message);
    
    // Clean up even on error
    if (fs.existsSync('test-contacts.csv')) {
      fs.unlinkSync('test-contacts.csv');
    }
    return null;
  }
}

// Run all tests
async function runAllTests() {
  console.log('=== TESTING MAIN API ===');
  // Test login (you'll need valid credentials)
  // const loginResult = await testMainApi('/login', 'post', { username: 'test', password: 'test' });
  
  // Test leads endpoints
  await testMainApi('/leads?limit=5');
  await testLeadsUpload();
  
  console.log('\n=== TESTING SMS API ===');
  // Test SMS campaign endpoints
  await testSmsApi('/campaigns');
  
  const campaignResult = await testSmsApi('/campaigns', 'post', {
    name: 'Test Campaign All APIs',
    messageTemplate: 'Hello {{name}}, testing all APIs',
    rateLimit: 60
  });
  
  if (campaignResult && campaignResult.id) {
    const campaignId = campaignResult.id;
    
    // Test other SMS campaign endpoints
    await testSmsApi(`/campaigns/${campaignId}`);
    await testSmsContactsUpload(campaignId);
    await testSmsApi(`/campaigns/${campaignId}/start`, 'post');
    await testSmsApi(`/campaigns/${campaignId}/pause`, 'post');
    await testSmsApi(`/campaigns/${campaignId}/rate-limit`, 'patch', { rateLimit: 30 });
  }
}

// Run everything
runAllTests().catch(console.error); 