const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

// API configuration
const API_URL = 'http://34.122.156.88:3001/api';
let authToken = null;

// Create a configured axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000
});

// Add request/response logging
api.interceptors.request.use(request => {
  console.log(`REQUEST: ${request.method.toUpperCase()} ${request.baseURL}${request.url}`);
  if (authToken) {
    console.log('Using auth token');
  }
  return request;
});

api.interceptors.response.use(
  response => {
    console.log(`RESPONSE: ${response.status} for ${response.config.url}`);
    return response;
  },
  error => {
    if (error.response) {
      console.log(`ERROR: ${error.response.status} for ${error.config.url}`);
      console.log('Response data:', error.response.data);
    } else {
      console.log(`ERROR: ${error.message}`);
    }
    return Promise.reject(error);
  }
);

// Step 1: Authenticate to get token
async function authenticate() {
  try {
    console.log('\n=== AUTHENTICATION ===');
    // Update these credentials as needed
    const credentials = {
      username: 'admin',
      password: 'password'
    };
    
    console.log(`Attempting login with username: ${credentials.username}`);
    const response = await api.post('/login', credentials);
    
    if (response.data && response.data.token) {
      authToken = response.data.token;
      console.log('✅ Authentication successful');
      
      // Configure future requests to use the token
      api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      return true;
    } else {
      console.log('❌ Authentication failed: No token in response');
      console.log('Response:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Authentication failed');
    return false;
  }
}

// Step 2: Test SMS Campaign Creation
async function testCreateCampaign() {
  try {
    console.log('\n=== CREATING SMS CAMPAIGN ===');
    const campaignData = {
      name: `Test Campaign ${Date.now()}`,
      messageTemplate: 'Hello {{name}}, this is a test message',
      rateLimit: 60
    };
    
    const response = await api.post('/sms/campaigns', campaignData);
    console.log('✅ Campaign created successfully');
    console.log('Campaign details:', response.data);
    return response.data.id;
  } catch (error) {
    console.log('❌ Failed to create campaign');
    return null;
  }
}

// Step 3: Test Campaign Listing
async function testListCampaigns() {
  try {
    console.log('\n=== LISTING SMS CAMPAIGNS ===');
    const response = await api.get('/sms/campaigns');
    console.log('✅ Retrieved campaigns successfully');
    console.log(`Found ${response.data.length} campaigns`);
    return true;
  } catch (error) {
    console.log('❌ Failed to list campaigns');
    return false;
  }
}

// Step 4: Test Contact Upload
async function testContactUpload(campaignId) {
  if (!campaignId) {
    console.log('❌ Cannot test upload: No campaign ID');
    return false;
  }

  try {
    console.log('\n=== UPLOADING CONTACTS ===');
    
    // Create test CSV file
    const csvContent = 'phone,name,email\n+12345678901,Test User,test@example.com';
    fs.writeFileSync('test-contacts.csv', csvContent);
    
    // Create form data with 'contacts' field (known to work)
    const formData = new FormData();
    formData.append('contacts', fs.createReadStream('test-contacts.csv'));
    
    const response = await api.post(
      `/sms/campaigns/${campaignId}/upload`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        }
      }
    );
    
    console.log('✅ Contacts uploaded successfully');
    console.log('Upload response:', response.data);
    
    // Clean up
    fs.unlinkSync('test-contacts.csv');
    return true;
  } catch (error) {
    console.log('❌ Contact upload failed');
    
    // Clean up even on error
    if (fs.existsSync('test-contacts.csv')) {
      fs.unlinkSync('test-contacts.csv');
    }
    return false;
  }
}

// Step 5: Test Campaign Start/Pause
async function testCampaignControls(campaignId) {
  if (!campaignId) {
    console.log('❌ Cannot test controls: No campaign ID');
    return false;
  }

  try {
    console.log('\n=== TESTING CAMPAIGN CONTROLS ===');
    
    // Start campaign
    console.log('Starting campaign...');
    const startResponse = await api.post(`/sms/campaigns/${campaignId}/start`);
    console.log('✅ Campaign started successfully');
    console.log('Start response:', startResponse.data);
    
    // Pause campaign
    console.log('Pausing campaign...');
    const pauseResponse = await api.post(`/sms/campaigns/${campaignId}/pause`);
    console.log('✅ Campaign paused successfully');
    console.log('Pause response:', pauseResponse.data);
    
    return true;
  } catch (error) {
    console.log('❌ Campaign control operations failed');
    return false;
  }
}

// Step 6: Try alternative API paths if the default ones fail
async function testAlternativePaths() {
  console.log('\n=== TESTING ALTERNATIVE API PATHS ===');
  
  const possiblePaths = [
    '/campaigns',
    '/sms-campaigns',
    '/api/sms/campaigns',
    '/api/campaigns',
    '/v1/sms/campaigns',
    '/v1/campaigns'
  ];
  
  for (const path of possiblePaths) {
    try {
      console.log(`Testing GET ${path}`);
      const response = await api.get(path);
      console.log(`✅ Path ${path} works!`);
      console.log('Response data:', response.data);
      return path; // Return working path
    } catch (error) {
      console.log(`❌ Path ${path} failed`);
    }
  }
  
  console.log('No alternative paths worked');
  return null;
}

// Main test sequence
async function runTests() {
  console.log('=== SMS API TEST WITH AUTHENTICATION ===');
  
  // First authenticate
  const isAuthenticated = await authenticate();
  if (!isAuthenticated) {
    console.log('⚠️ Not authenticated, attempting tests without authentication');
  }
  
  // First try the standard paths
  let campaignId = await testCreateCampaign();
  let listingSuccess = await testListCampaigns();
  
  // If standard paths fail, try alternatives
  if (!campaignId || !listingSuccess) {
    console.log('\n⚠️ Standard API paths failed, trying alternatives...');
    const workingPath = await testAlternativePaths();
    
    if (workingPath) {
      console.log(`Found working path: ${workingPath}`);
      console.log('Please update the API.ts file to use this path');
    }
  } else {
    // Continue testing if creation worked
    await testContactUpload(campaignId);
    await testCampaignControls(campaignId);
  }
  
  console.log('\n=== TEST COMPLETE ===');
}

// Run all tests
runTests().catch(error => {
  console.error('Test script error:', error);
}); 