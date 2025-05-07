const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// Base URL for SMS API
const SMS_API = 'http://34.122.156.88:3100';

// Basic GET test
async function testListCampaigns() {
  try {
    console.log('Testing GET /campaigns');
    const response = await axios.get(`${SMS_API}/campaigns`);
    console.log('✅ Success! Status:', response.status);
    console.log('Data:', response.data);
    return response.data;
  } catch (error) {
    console.log('❌ Error:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', error.response.data);
    }
    return null;
  }
}

// Create campaign test
async function testCreateCampaign() {
  try {
    console.log('\nTesting POST /campaigns');
    const campaignData = {
      name: `Test Campaign ${Date.now()}`,
      messageTemplate: 'Hello {{name}}, this is a test message from the API test',
      rateLimit: 60
    };
    
    const response = await axios.post(`${SMS_API}/campaigns`, campaignData);
    console.log('✅ Success! Status:', response.status);
    console.log('Campaign created:', response.data);
    return response.data;
  } catch (error) {
    console.log('❌ Error:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', error.response.data);
    }
    return null;
  }
}

// Upload contacts test
async function testUploadContacts(campaignId) {
  if (!campaignId) {
    console.log('\n❌ Cannot test upload: No campaign ID');
    return null;
  }
  
  try {
    console.log(`\nTesting POST /campaigns/${campaignId}/upload`);
    
    // Create test CSV
    const csv = 'phone,name,email\n+12345678901,Test User,test@example.com';
    fs.writeFileSync('test-contacts.csv', csv);
    
    // Create form data
    const formData = new FormData();
    formData.append('contacts', fs.createReadStream('test-contacts.csv'));
    
    const response = await axios.post(
      `${SMS_API}/campaigns/${campaignId}/upload`,
      formData,
      { headers: formData.getHeaders() }
    );
    
    console.log('✅ Success! Status:', response.status);
    console.log('Upload result:', response.data);
    
    // Clean up
    fs.unlinkSync('test-contacts.csv');
    return response.data;
  } catch (error) {
    console.log('❌ Error:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', error.response.data);
    }
    
    // Clean up even on error
    if (fs.existsSync('test-contacts.csv')) {
      fs.unlinkSync('test-contacts.csv');
    }
    return null;
  }
}

// Campaign control tests
async function testCampaignControls(campaignId) {
  if (!campaignId) {
    console.log('\n❌ Cannot test controls: No campaign ID');
    return;
  }
  
  // Start campaign
  try {
    console.log(`\nTesting POST /campaigns/${campaignId}/start`);
    const response = await axios.post(`${SMS_API}/campaigns/${campaignId}/start`);
    console.log('✅ Campaign started! Status:', response.status);
    console.log('Result:', response.data);
  } catch (error) {
    console.log('❌ Error starting campaign:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', error.response.data);
    }
  }
  
  // Pause campaign
  try {
    console.log(`\nTesting POST /campaigns/${campaignId}/pause`);
    const response = await axios.post(`${SMS_API}/campaigns/${campaignId}/pause`);
    console.log('✅ Campaign paused! Status:', response.status);
    console.log('Result:', response.data);
  } catch (error) {
    console.log('❌ Error pausing campaign:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', error.response.data);
    }
  }
  
  // Update rate limit
  try {
    console.log(`\nTesting PATCH /campaigns/${campaignId}/rate-limit`);
    const response = await axios.patch(
      `${SMS_API}/campaigns/${campaignId}/rate-limit`, 
      { rateLimit: 120 }
    );
    console.log('✅ Rate limit updated! Status:', response.status);
    console.log('Result:', response.data);
  } catch (error) {
    console.log('❌ Error updating rate limit:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', error.response.data);
    }
  }
}

// Run the tests
async function runTests() {
  console.log('=== TESTING SMS API ON PORT 3100 ===\n');
  
  // Get existing campaigns
  await testListCampaigns();
  
  // Create a new campaign
  const campaign = await testCreateCampaign();
  
  if (campaign && campaign.id) {
    // Test upload
    await testUploadContacts(campaign.id);
    
    // Test campaign controls
    await testCampaignControls(campaign.id);
  }
  
  console.log('\n=== TEST COMPLETE ===');
}

runTests().catch(console.error); 