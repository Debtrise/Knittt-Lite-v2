const axios = require('axios');
const FormData = require('form-data');

const BASE_URL = 'http://34.122.156.88:3001/api';

// Generate unique test data
const timestamp = Date.now();
const REP_NAME = `Test Rep ${timestamp}`;
const REP_EMAIL = `testrep${timestamp}@example.com`;
const PROJECT_NAME = `Fresh Test Project ${timestamp}`;
const WEBHOOK_NAME = `Fresh Test Webhook ${timestamp}`;

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

async function createFreshSalesRep() {
  console.log('\n📸 Creating fresh sales rep...');
  
  try {
    // Create a simple image buffer
    const imageBuffer = createSimpleImageBuffer();
    
    // Create FormData for the upload
    const formData = new FormData();
    formData.append('photo', imageBuffer, {
      filename: `${REP_NAME.replace(/\s+/g, '_')}.png`,
      contentType: 'image/png'
    });
    formData.append('repEmail', REP_EMAIL);
    formData.append('repName', REP_NAME);
    formData.append('replace', 'true'); // Allow overwriting if exists
    
    console.log('   Uploading sales rep photo...');
    console.log(`   Name: ${REP_NAME}`);
    console.log(`   Email: ${REP_EMAIL}`);
    
    // Use the upload endpoint with FormData
    const response = await axios.post(`${BASE_URL}/sales-rep-photos/upload`, formData, {
      headers: {
        'Authorization': `Bearer ${api.defaults.headers.Authorization.replace('Bearer ', '')}`,
        ...formData.getHeaders()
      }
    });
    
    console.log('✅ Fresh sales rep created successfully!');
    console.log(`   ID: ${response.data.photo.id}`);
    console.log(`   Name: ${response.data.photo.repName}`);
    console.log(`   Email: ${response.data.photo.repEmail}`);
    console.log(`   File Size: ${response.data.photo.fileSize} bytes`);
    console.log(`   Photo URL: ${response.data.photo.photoUrl.substring(0, 50)}...`);
    
    return {
      id: response.data.photo.id,
      name: response.data.photo.repName,
      email: response.data.photo.repEmail,
      photoUrl: response.data.photo.photoUrl
    };
  } catch (error) {
    console.error('❌ Failed to create sales rep:', error.response?.data || error.message);
    throw error;
  }
}

function createSimpleImageBuffer() {
  // Create a minimal valid PNG file (1x1 pixel, orange color)
  const simpleImageData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk header
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 pixel dimensions
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, // IHDR data + CRC
    0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, // IDAT chunk header
    0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // IDAT data
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82 // IEND chunk
  ]);
  
  return simpleImageData;
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

async function createFreshProject(salesRep) {
  console.log('\n🎨 Creating fresh announcement project...');
  
  try {
    const projectData = {
      name: PROJECT_NAME,
      description: `Fresh sales rep achievement announcement for ${salesRep.name}`,
      canvasSize: { width: 1920, height: 1080 },
      elements: [
        {
          id: 'background',
          type: 'rectangle',
          x: 0,
          y: 0,
          width: 1920,
          height: 1080,
          fill: '#0f172a'
        },
        {
          id: 'header',
          type: 'text',
          x: 960,
          y: 150,
          text: '🎉 SALES ACHIEVEMENT 🎉',
          fontSize: 64,
          fontWeight: 'bold',
          fill: '#fbbf24',
          textAlign: 'center'
        },
        {
          id: 'congratulations',
          type: 'text',
          x: 960,
          y: 250,
          text: 'CONGRATULATIONS!',
          fontSize: 72,
          fontWeight: 'bold',
          fill: '#ffffff',
          textAlign: 'center'
        },
        {
          id: 'rep_photo',
          type: 'image',
          x: 760,
          y: 350,
          width: 400,
          height: 400,
          src: salesRep.photoUrl,
          borderRadius: 200,
          border: '8px solid #10b981'
        },
        {
          id: 'rep_name',
          type: 'text',
          x: 960,
          y: 800,
          text: salesRep.name,
          fontSize: 56,
          fontWeight: 'bold',
          fill: '#10b981',
          textAlign: 'center'
        },
        {
          id: 'achievement_text',
          type: 'text',
          x: 960,
          y: 900,
          text: 'Just closed a major deal!',
          fontSize: 42,
          fill: '#e5e7eb',
          textAlign: 'center'
        },
        {
          id: 'deal_amount',
          type: 'text',
          x: 960,
          y: 980,
          text: '$25,000 with Acme Corporation',
          fontSize: 36,
          fontWeight: 'bold',
          fill: '#fbbf24',
          textAlign: 'center'
        }
      ]
    };
    
    console.log('   Creating project:', PROJECT_NAME);
    
    const response = await api.post('/content/projects', projectData);
    console.log('✅ Fresh project created successfully!');
    console.log(`   ID: ${response.data.project.id}`);
    console.log(`   Name: ${response.data.project.name}`);
    console.log(`   Elements: ${response.data.project.elements?.length || 0}`);
    console.log(`   Status: ${response.data.project.status}`);
    
    return response.data.project;
  } catch (error) {
    console.error('❌ Failed to create project:', error.response?.data || error.message);
    throw error;
  }
}

async function testProjectPublish(project, kashDisplay) {
  console.log('\n🚀 Testing project publish to KASH display...');
  
  try {
    const publishData = {
      displayIds: [kashDisplay.id],
      priority: 'HIGH',
      duration: 30
    };
    
    console.log('   Publishing with data:', publishData);
    
    const response = await api.post(`/content/projects/${project.id}/publish`, publishData);
    console.log('✅ Project published successfully!');
    console.log(`   Export ID: ${response.data.summary?.exportId}`);
    console.log(`   Public URL: ${response.data.summary?.publicApiUrl}`);
    console.log(`   Successful pushes: ${response.data.summary?.successfulPushes}`);
    console.log(`   Failed pushes: ${response.data.summary?.failedPushes}`);
    
    return response.data;
  } catch (error) {
    console.error('❌ Failed to publish project:', error.response?.data || error.message);
    throw error;
  }
}

async function createFreshWebhook(project, kashDisplay) {
  console.log('\n🔗 Creating fresh webhook...');
  
  try {
    const webhookData = {
      name: WEBHOOK_NAME,
      description: `Fresh webhook for testing sales rep announcements on KASH display`,
      webhookType: 'announcement',
      brand: 'KASH Test',
      source: 'Fresh Test System',
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
          projectName: `Fresh Achievement - {{rep_name}} - {{timestamp}}`,
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

async function verifyWebhookConfig(webhook) {
  console.log('\n🔍 Verifying webhook configuration...');
  
  try {
    const response = await api.get(`/webhooks/${webhook.id}`);
    const webhookDetails = response.data.webhook || response.data;
    
    console.log('✅ Webhook configuration verified:');
    console.log(`   Name: ${webhookDetails.name}`);
    console.log(`   Type: ${webhookDetails.webhookType}`);
    console.log(`   Project ID: ${webhookDetails.announcementConfig?.contentCreator?.projectId}`);
    console.log(`   Display IDs: ${webhookDetails.announcementConfig?.optisigns?.displaySelection?.displayIds}`);
    console.log(`   Auto Generate: ${webhookDetails.announcementConfig?.contentCreator?.autoGenerate}`);
    
    return webhookDetails;
  } catch (error) {
    console.error('❌ Failed to verify webhook config:', error.response?.data || error.message);
    throw error;
  }
}

async function testFreshWebhook(webhook, salesRep) {
  console.log('\n🧪 Testing fresh webhook...');
  
  try {
    const testPayload = {
      rep_name: salesRep.name,
      rep_email: salesRep.email,
      deal_amount: '$25,000',
      company_name: 'Acme Corporation',
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
    
    console.log('✅ Fresh webhook test SUCCESSFUL!');
    console.log('   Response:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Fresh webhook test FAILED:');
    console.error(`   Status: ${error.response?.status}`);
    console.error(`   Error: ${error.response?.data?.error || error.message}`);
    console.error(`   Details:`, error.response?.data);
    return { success: false, error: error.message, details: error.response?.data };
  }
}

async function verifyProjectExists(projectId) {
  console.log(`\n🔍 Verifying project ${projectId} exists...`);
  
  try {
    const response = await api.get(`/content/projects/${projectId}`);
    console.log('✅ Project verification successful:');
    console.log(`   ID: ${response.data.project.id}`);
    console.log(`   Name: ${response.data.project.name}`);
    console.log(`   Status: ${response.data.project.status}`);
    console.log(`   Elements: ${response.data.project.elements?.length || 0}`);
    
    return response.data.project;
  } catch (error) {
    console.error('❌ Project verification failed:', error.response?.data || error.message);
    throw error;
  }
}

async function run() {
  try {
    console.log('🎯 Starting COMPLETE FRESH SETUP TEST\n');
    console.log(`📊 Test Data:`);
    console.log(`   Timestamp: ${timestamp}`);
    console.log(`   Rep Name: ${REP_NAME}`);
    console.log(`   Rep Email: ${REP_EMAIL}`);
    console.log(`   Project Name: ${PROJECT_NAME}`);
    console.log(`   Webhook Name: ${WEBHOOK_NAME}`);
    
    // Step 1: Authenticate
    const token = await authenticate();
    
    // Step 2: Create fresh sales rep
    const salesRep = await createFreshSalesRep();
    
    // Step 3: Get KASH display
    const kashDisplay = await getKashDisplay();
    
    // Step 4: Create fresh project
    const project = await createFreshProject(salesRep);
    
    // Step 5: Test project publishing
    const publishResult = await testProjectPublish(project, kashDisplay);
    
    // Step 6: Verify project exists (double-check)
    await verifyProjectExists(project.id);
    
    // Step 7: Create fresh webhook
    const webhook = await createFreshWebhook(project, kashDisplay);
    
    // Step 8: Verify webhook configuration
    await verifyWebhookConfig(webhook);
    
    // Step 9: Test fresh webhook
    const webhookResult = await testFreshWebhook(webhook, salesRep);
    
    console.log('\n🎉 COMPLETE FRESH SETUP TEST COMPLETED!\n');
    
    console.log('📋 FINAL SUMMARY:');
    console.log('================');
    console.log(`✅ Sales Rep: ${salesRep.name} (${salesRep.email})`);
    console.log(`   ID: ${salesRep.id}`);
    console.log(`   Photo: ${salesRep.photoUrl}`);
    console.log('');
    console.log(`✅ Project: ${project.name}`);
    console.log(`   ID: ${project.id}`);
    console.log(`   Status: ${project.status}`);
    console.log(`   Elements: ${project.elements?.length || 0}`);
    console.log('');
    console.log(`✅ Display: ${kashDisplay.name}`);
    console.log(`   ID: ${kashDisplay.id}`);
    console.log(`   Status: ${kashDisplay.isOnline ? 'Online' : 'Offline'}`);
    console.log('');
    console.log(`✅ Webhook: ${webhook.name || WEBHOOK_NAME}`);
    console.log(`   ID: ${webhook.id}`);
    console.log(`   Endpoint: ${webhook.endpointKey}`);
    console.log(`   URL: ${BASE_URL}/webhook-receiver/${webhook.endpointKey}`);
    console.log('');
    console.log(`✅ Publishing: ${publishResult.summary?.successfulPushes || 0} successful`);
    console.log(`   Public URL: ${publishResult.summary?.publicApiUrl}`);
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
      console.log('\n🎉 ALL SYSTEMS WORKING PERFECTLY! 🎉');
    } else {
      console.log('\n⚠️  WEBHOOK ISSUE IDENTIFIED - BACKEND NEEDS FIXING');
    }
    
  } catch (error) {
    console.error('\n❌ FRESH SETUP TEST FAILED:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  run();
}

module.exports = { run }; 