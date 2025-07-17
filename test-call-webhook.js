const axios = require('axios');
require('dotenv').config();

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://34.122.156.88:3001/api';
const AUTH_TOKEN = process.env.AUTH_TOKEN;

if (!AUTH_TOKEN) {
  console.error('❌ Error: AUTH_TOKEN not found in .env file');
  process.exit(1);
}

// Test data
const testWebhook = {
  name: 'Test Outbound Call Campaign',
  description: 'Webhook to test outbound calls with multiple attempts',
  webhookType: 'call',
  isActive: true,
  brand: 'TestBrand',
  source: 'WebForm',
  
  // Field mapping - maps incoming data fields to lead fields
  fieldMapping: {
    phone: 'phone',      // incoming phone field -> lead.phone
    name: 'name',        // incoming name field -> lead.name
    email: 'email'       // incoming email field -> lead.email
  },
  
  // Validation rules
  validationRules: {
    requirePhone: true,
    requireName: false,
    requireEmail: false,
    allowDuplicatePhone: false
  },
  
  // Call-specific configuration
  callConfig: {
    enabled: true,
    dialerContext: 'BDS_Prime_Dialer',    // Your Asterisk context
    transferNumber: '18005551234',         // Number to transfer to
    maxAttempts: 3,                        // Number of call attempts
    delayBetweenCalls: 300,                // 5 minutes between attempts
    amd: false,                            // Answering Machine Detection
    playPosition: false,                   // Play position in queue
    skipPositionAnnouncement: true,        // Skip position announcement
    ivrFile: null,                         // Optional IVR file
    recordingId: null                      // Optional recording ID
  },
  
  // Optional: Auto-tag leads
  autoTagRules: [
    {
      field: 'source',
      operator: 'equals',
      value: 'test-call',
      tag: 'test-call-campaign'
    }
  ],
  
  // Optional: Security token for webhook authentication
  securityToken: 'test-webhook-secret-123',
  
  // Optional: Test payload for testing
  testPayload: {
    phone: '5555551234',
    name: 'Test Lead',
    email: 'test@example.com'
  }
};

// Function to create a call webhook
async function createCallWebhook() {
  try {
    console.log('Creating call webhook...');
    console.log('Using API URL:', API_BASE_URL);
    
    const response = await axios.post(
      `${API_BASE_URL}/webhooks`,
      testWebhook,
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Webhook created successfully!');
    console.log('Response:', JSON.stringify(response.data, null, 2));

    return response.data;

  } catch (error) {
    console.error('❌ Error creating webhook:', error.response?.data || error.message);
    throw error;
  }
}

// Function to test the webhook with sample data
async function testCallWebhook(webhookUrl, endpointKey) {
  try {
    console.log('Testing call webhook...');
    
    const testData = {
      phone: '5555551234',
      name: 'Test Lead',
      email: 'test@example.com',
      source: 'test-call'
    };

    const response = await axios.post(
      webhookUrl,
      testData,
      {
        headers: {
          'X-Webhook-Key': endpointKey,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Test webhook call successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));

    return response.data;

  } catch (error) {
    console.error('❌ Error testing webhook:', error.response?.data || error.message);
    throw error;
  }
}

// Function to get webhook status
async function getWebhookStatus(webhookId) {
  try {
    console.log('Getting webhook status...');
    
    const response = await axios.get(
      `${API_BASE_URL}/webhooks/${webhookId}`,
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Webhook status retrieved!');
    console.log('Status:', JSON.stringify(response.data, null, 2));

    return response.data;

  } catch (error) {
    console.error('❌ Error getting webhook status:', error.response?.data || error.message);
    throw error;
  }
}

// Main test function
async function runTests() {
  try {
    // Step 1: Create the webhook
    console.log('\n📞 Step 1: Creating call webhook');
    const webhook = await createCallWebhook();
    
    // Step 2: Test the webhook
    if (webhook.webhookUrl && webhook.endpointKey) {
      console.log('\n📞 Step 2: Testing webhook with sample data');
      await testCallWebhook(webhook.webhookUrl, webhook.endpointKey);
    }
    
    // Step 3: Check webhook status
    if (webhook.id) {
      console.log('\n📞 Step 3: Checking webhook status');
      await getWebhookStatus(webhook.id);
    }
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runTests(); 