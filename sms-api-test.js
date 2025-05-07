const axios = require('axios');

// Base URL for the SMS API
const SMS_API_URL = 'http://34.122.156.88:3100';

// Test creating a campaign
async function testCreateCampaign() {
  try {
    console.log('Testing create campaign...');
    const response = await axios.post(`${SMS_API_URL}/campaigns`, {
      name: 'Test Campaign',
      messageTemplate: 'Hello {{name}}, this is a test message',
      rateLimit: 60
    });
    console.log('Create campaign response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Create campaign error:', error.response?.data || error.message);
  }
}

// Test listing campaigns
async function testListCampaigns() {
  try {
    console.log('Testing list campaigns...');
    const response = await axios.get(`${SMS_API_URL}/campaigns`);
    console.log('List campaigns response:', response.data);
    return response.data;
  } catch (error) {
    console.error('List campaigns error:', error.response?.data || error.message);
  }
}

// Test getting campaign details
async function testGetCampaignDetails(id) {
  try {
    console.log(`Testing get campaign details for ID ${id}...`);
    const response = await axios.get(`${SMS_API_URL}/campaigns/${id}`);
    console.log('Campaign details response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Get campaign details error:', error.response?.data || error.message);
  }
}

// Run tests
async function runTests() {
  // First create a campaign
  const campaign = await testCreateCampaign();
  
  // Then list all campaigns
  await testListCampaigns();
  
  // If campaign was created successfully, test other endpoints
  if (campaign && campaign.id) {
    await testGetCampaignDetails(campaign.id);
    console.log(`\nYou can now test other endpoints with campaign ID ${campaign.id}`);
  }
}

runTests(); 