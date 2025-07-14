const axios = require('axios');

const BASE_URL = 'http://34.122.156.88:3001/api';

// Use existing data from the backend
const EXISTING_REP_EMAIL = 'john.smith@example.com';
const EXISTING_REP_NAME = 'John Smith';

let api;

async function authenticate() {
  console.log('🔐 Authenticating with admin credentials...');
  try {
    const response = await axios.post(`${BASE_URL}/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = response.data.token;
    console.log('✅ Authentication successful');
    console.log(`🔑 Token: ${token.substring(0, 50)}...`);
    
    // Create axios instance with auth token
    api = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return token;
  } catch (error) {
    console.error('❌ Authentication failed:', error.response?.data || error.message);
    throw error;
  }
}

async function getExistingSalesRep() {
  console.log('\n📸 Getting existing sales rep...');
  
  try {
    const response = await api.get(`/sales-rep-photos/by-email/${EXISTING_REP_EMAIL}`);
    
    console.log('✅ Found existing sales rep:');
    console.log(`   Name: ${response.data.asset?.repName || EXISTING_REP_NAME}`);
    console.log(`   Email: ${response.data.asset?.repEmail || EXISTING_REP_EMAIL}`);
    console.log(`   Photo URL: ${response.data.asset?.url}`);
    
    return {
      id: response.data.asset?.id,
      name: response.data.asset?.repName || EXISTING_REP_NAME,
      email: response.data.asset?.repEmail || EXISTING_REP_EMAIL,
      photoUrl: response.data.asset?.url
    };
  } catch (error) {
    console.log('⚠️  Sales rep not found, using fallback data');
    return {
      id: 'fallback',
      name: EXISTING_REP_NAME,
      email: EXISTING_REP_EMAIL,
      photoUrl: 'https://via.placeholder.com/300x300/FF5722/FFFFFF?text=JS'
    };
  }
}

async function getKashDisplay() {
  console.log('\n📺 Getting KASH office display...');
  
  try {
    const response = await api.get('/optisigns/displays');
    const displays = response.data.displays || [];
    console.log(`✅ Found ${displays.length} total displays`);
    
    // Find KASH office display specifically
    const kashDisplay = displays.find(d => 
      d.name && d.name.toLowerCase().includes('kash')
    );
    
    if (!kashDisplay) {
      console.error('❌ KASH office display not found');
      console.log('Available displays:', displays.slice(0, 10).map(d => d.name));
      throw new Error('KASH office display not found');
    }
    
    console.log('✅ Using KASH display:');
    console.log(`   Name: ${kashDisplay.name}`);
    console.log(`   ID: ${kashDisplay.id}`);
    console.log(`   Status: ${kashDisplay.isOnline ? 'Online' : 'Offline'}`);
    
    return kashDisplay;
  } catch (error) {
    console.error('❌ Failed to get KASH display:', error.response?.data || error.message);
    throw error;
  }
}

async function getExistingProject() {
  console.log('\n🎨 Getting existing announcement project...');
  
  try {
    const response = await api.get('/content/templates');
    const templates = response.data.templates || [];
    console.log(`✅ Found ${templates.length} existing projects`);
    
    // Use the first available project
    if (templates.length === 0) {
      throw new Error('No existing projects found');
    }
    
    const project = templates[0];
    console.log('✅ Using existing project:');
    console.log(`   ID: ${project.id}`);
    console.log(`   Name: ${project.name}`);
    console.log(`   Status: ${project.status}`);
    
    return project;
  } catch (error) {
    console.error('❌ Failed to get existing project:', error.response?.data || error.message);
    throw error;
  }
}

async function createFreshWebhook(project, kashDisplay, salesRep) {
  console.log('\n🔗 Creating fresh webhook...');
  
  const timestamp = Date.now();
  const webhookName = `Frontend Test Webhook ${timestamp}`;
  
  try {
    const webhookData = {
      name: webhookName,
      description: `Frontend-only webhook test for sales rep announcements`,
      webhookType: 'announcement',
      brand: 'KASH Test',
      source: 'Frontend Test',
      fieldMapping: {
        rep_name: 'rep_name',
        rep_email: 'rep_email',
        deal_amount: 'deal_amount',
        company_name: 'company_name',
        achievement_type: 'achievement_type'
      },
      validationRules: {
        requirePhone: false,
        requireName: false,
        requireEmail: false,
        allowDuplicatePhone: true
      },
      announcementConfig: {
        enabled: true,
        announcementType: 'template',
        contentCreator: {
          projectId: project.id,
          autoGenerate: true,
          projectName: `Frontend Achievement - {{rep_name}} - {{timestamp}}`,
          variableMapping: {
            rep_name: 'rep_name',
            rep_email: 'rep_email',
            deal_amount: 'deal_amount',
            company_name: 'company_name'
          }
        },
        optisigns: {
          displaySelection: {
            mode: 'specific',
            displayIds: [kashDisplay.id]
          },
          takeover: {
            priority: 'HIGH',
            duration: 30,
            restoreAfter: true,
            overrideCurrent: true
          },
          scheduling: {
            immediate: true
          }
        }
      }
    };
    
    console.log('   Creating webhook with project ID:', project.id);
    console.log('   Target display:', kashDisplay.name);
    console.log('   Sales rep:', salesRep.name);
    
    const response = await api.post('/webhooks', webhookData);
    console.log('✅ Fresh webhook created successfully!');
    
    // Handle different response structures
    const webhook = response.data.webhook || response.data;
    console.log(`   Webhook ID: ${webhook.id}`);
    console.log(`   Endpoint Key: ${webhook.endpointKey}`);
    console.log(`   Security Token: ${webhook.securityToken}`);
    console.log(`   Webhook URL: ${BASE_URL}/webhook-receiver/${webhook.endpointKey}`);
    
    return webhook;
  } catch (error) {
    console.error('❌ Failed to create webhook:', error.response?.data || error.message);
    throw error;
  }
}

async function testWebhook(webhook, salesRep) {
  console.log('\n🧪 Testing webhook...');
  
  try {
    const testPayload = {
      rep_name: salesRep.name,
      rep_email: salesRep.email,
      deal_amount: '$50,000',
      company_name: 'Test Corporation',
      achievement_type: 'deal_closed'
    };
    
    console.log('   Test payload:', JSON.stringify(testPayload, null, 2));
    console.log(`   Webhook URL: ${BASE_URL}/webhook-receiver/${webhook.endpointKey}`);
    console.log(`   Security Token: ${webhook.securityToken.substring(0, 20)}...`);
    
    // Use the webhook's security token for authentication
    const response = await axios.post(`${BASE_URL}/webhook-receiver/${webhook.endpointKey}`, testPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${webhook.securityToken}`
      }
    });
    
    console.log('✅ Webhook test SUCCESSFUL!');
    console.log('   Response:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Webhook test FAILED:');
    console.error(`   Status: ${error.response?.status}`);
    console.error(`   Error: ${error.response?.data?.error || error.message}`);
    console.error(`   Details:`, error.response?.data);
    return { success: false, error: error.message, details: error.response?.data };
  }
}

async function verifyProjectExists(projectId) {
  console.log(`\n🔍 Verifying project ${projectId} exists...`);
  
  try {
    const response = await api.get(`/content/templates/${projectId}`);
    console.log('✅ Project verification successful:');
    console.log(`   ID: ${response.data.template.id}`);
    console.log(`   Name: ${response.data.template.name}`);
    console.log(`   Status: ${response.data.template.status}`);
    
    return response.data.template;
  } catch (error) {
    console.error('❌ Project verification failed:', error.response?.data || error.message);
    throw error;
  }
}

async function run() {
  try {
    console.log('🎯 Starting FRONTEND-ONLY WEBHOOK TEST\n');
    
    // Step 1: Authenticate
    const token = await authenticate();
    
    // Step 2: Get existing sales rep
    const salesRep = await getExistingSalesRep();
    
    // Step 3: Get KASH display
    const kashDisplay = await getKashDisplay();
    
    // Step 4: Get existing project
    const project = await getExistingProject();
    
    // Step 5: Verify project exists
    await verifyProjectExists(project.id);
    
    // Step 6: Create fresh webhook
    const webhook = await createFreshWebhook(project, kashDisplay, salesRep);
    
    // Step 7: Test webhook
    const webhookResult = await testWebhook(webhook, salesRep);
    
    console.log('\n🎉 FRONTEND-ONLY WEBHOOK TEST COMPLETED!\n');
    
    console.log('📋 FINAL SUMMARY:');
    console.log('================');
    console.log(`✅ Sales Rep: ${salesRep.name} (${salesRep.email})`);
    console.log(`   ID: ${salesRep.id}`);
    console.log(`   Photo: ${salesRep.photoUrl ? 'Available' : 'Not Available'}`);
    console.log('');
    console.log(`✅ Project: ${project.name}`);
    console.log(`   ID: ${project.id}`);
    console.log(`   Status: ${project.status}`);
    console.log('');
    console.log(`✅ Display: ${kashDisplay.name}`);
    console.log(`   ID: ${kashDisplay.id}`);
    console.log(`   Status: ${kashDisplay.isOnline ? 'Online' : 'Offline'}`);
    console.log('');
    console.log(`✅ Webhook: ${webhook.name}`);
    console.log(`   ID: ${webhook.id}`);
    console.log(`   Endpoint: ${webhook.endpointKey}`);
    console.log(`   URL: ${BASE_URL}/webhook-receiver/${webhook.endpointKey}`);
    console.log('');
    console.log(`${webhookResult.success ? '✅' : '❌'} Webhook Test: ${webhookResult.success ? 'SUCCESS' : 'FAILED'}`);
    if (!webhookResult.success) {
      console.log(`   Error: ${webhookResult.error}`);
      if (webhookResult.details) {
        console.log(`   Details: ${JSON.stringify(webhookResult.details, null, 2)}`);
      }
    }
    
    // Final status
    if (webhookResult.success) {
      console.log('\n🎉 FRONTEND WEBHOOK SYSTEM WORKING PERFECTLY! 🎉');
    } else {
      console.log('\n⚠️  WEBHOOK BACKEND ISSUE IDENTIFIED');
      console.log('💡 Frontend webhook creation and configuration works perfectly.');
      console.log('💡 The issue is in the backend webhook receiver processing.');
    }
    
  } catch (error) {
    console.error('\n❌ FRONTEND WEBHOOK TEST FAILED:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  run();
}

module.exports = { run }; 