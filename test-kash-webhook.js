const axios = require('axios');

const BASE_URL = 'http://34.122.156.88:3001/api';
const REP_NAME = 'John Smith';
const REP_EMAIL = 'john.smith@example.com';

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

async function ensureSalesRepPhoto() {
  console.log('\n📸 Ensuring sales rep photo exists...');
  
  try {
    // Check if photo exists
    const photoResponse = await api.get(`/sales-rep-photos/by-email/${encodeURIComponent(REP_EMAIL)}`);
    console.log('✅ Sales rep photo already exists:', photoResponse.data.name);
    return photoResponse.data;
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('📸 Creating sales rep photo...');
      
      // Create the photo
      const createResponse = await api.post('/sales-rep-photos', {
        name: REP_NAME,
        email: REP_EMAIL,
        photoUrl: 'https://via.placeholder.com/300x300/4CAF50/FFFFFF?text=JS'
      });
      
      console.log('✅ Sales rep photo created:', createResponse.data.name);
      return createResponse.data;
    } else {
      throw error;
    }
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
      console.log('Available displays:', displays.map(d => d.name).slice(0, 10));
      throw new Error('KASH office display not found');
    }
    
    console.log('✅ Using KASH display:', `${kashDisplay.name} (${kashDisplay.id})`);
    return kashDisplay;
  } catch (error) {
    console.error('❌ Failed to get KASH display:', error.response?.data || error.message);
    throw error;
  }
}

async function createAnnouncementProject(salesRepPhoto) {
  console.log('\n🎨 Creating announcement project...');
  
  try {
    // Create a simple announcement project
    const projectData = {
      name: `KASH Sales Achievement - ${REP_NAME} - ${Date.now()}`,
      description: 'Sales rep achievement announcement for KASH office',
      canvasSize: { width: 1920, height: 1080 },
      elements: [
        {
          id: 'background',
          type: 'rectangle',
          x: 0,
          y: 0,
          width: 1920,
          height: 1080,
          fill: '#1a1a1a'
        },
        {
          id: 'title',
          type: 'text',
          x: 960,
          y: 200,
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
          y: 300,
          width: 400,
          height: 400,
          src: salesRepPhoto.photoUrl,
          borderRadius: 200
        },
        {
          id: 'rep_name',
          type: 'text',
          x: 960,
          y: 750,
          text: salesRepPhoto.name,
          fontSize: 48,
          fontWeight: 'bold',
          fill: '#4CAF50',
          textAlign: 'center'
        },
        {
          id: 'achievement',
          type: 'text',
          x: 960,
          y: 850,
          text: 'Closed a $25,000 deal with Acme Corporation!',
          fontSize: 36,
          fill: '#ffffff',
          textAlign: 'center'
        }
      ]
    };
    
    const response = await api.post('/content/projects', projectData);
    console.log('✅ Announcement project created:', response.data.project.id);
    
    return response.data.project;
  } catch (error) {
    console.error('❌ Failed to create announcement project:', error.response?.data || error.message);
    throw error;
  }
}

async function createKashWebhook(project, kashDisplay) {
  console.log('\n🔗 Creating KASH webhook...');
  
  try {
    const webhookData = {
      name: `KASH Sales Achievement Webhook - ${Date.now()}`,
      description: 'Sales rep announcement webhook for KASH office display',
      webhookType: 'announcement',
      brand: 'KASH',
      source: 'Sales System',
      fieldMapping: {
        rep_name: 'rep_name',
        rep_email: 'rep_email',
        deal_amount: 'deal_amount',
        company_name: 'company_name'
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
          projectName: 'KASH Sales Achievement - {{rep_name}} - {{timestamp}}'
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
    
    const response = await api.post('/webhooks', webhookData);
    console.log('✅ KASH webhook created successfully');
    
    // The webhook might be in response.data or response.data.webhook
    const webhook = response.data.webhook || response.data;
    console.log('   Endpoint Key:', webhook.endpointKey);
    console.log('   Security Token:', webhook.securityToken);
    console.log('   Webhook URL:', `${BASE_URL}/webhook-receiver/${webhook.endpointKey}`);
    
    return webhook;
  } catch (error) {
    console.error('❌ Failed to create KASH webhook:', error.response?.data || error.message);
    throw error;
  }
}

async function testKashWebhook(webhook) {
  console.log('\n🧪 Testing KASH webhook...');
  
  try {
    const testPayload = {
      rep_name: REP_NAME,
      rep_email: REP_EMAIL,
      deal_amount: '$25,000',
      company_name: 'Acme Corporation',
      achievement_type: 'deal_closed'
    };
    
    console.log('   Payload:', JSON.stringify(testPayload, null, 2));
    console.log('   Using security token:', webhook.securityToken);
    
    // Use the webhook's security token for authentication
    const response = await axios.post(`${BASE_URL}/webhook-receiver/${webhook.endpointKey}`, testPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${webhook.securityToken}`
      }
    });
    
    console.log('✅ KASH webhook test successful!');
    console.log('   Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ KASH webhook test failed:', error.response?.data || error.message);
    return { error: error.message, details: error.response?.data };
  }
}

async function publishProjectToKash(project, kashDisplay) {
  console.log('\n🚀 Publishing project to KASH display...');
  
  try {
    const response = await api.post(`/content/projects/${project.id}/publish`, {
      displayIds: [kashDisplay.id],
      priority: 'HIGH',
      duration: 30
    });
    
    console.log('✅ Published to KASH display successfully!');
    console.log('   Public URL:', response.data.summary?.publicApiUrl);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to publish to KASH display:', error.response?.data || error.message);
    throw error;
  }
}

async function run() {
  try {
    console.log('🎯 Starting KASH Webhook Test\n');
    
    // Step 1: Authenticate
    await authenticate();
    
    // Step 2: Ensure sales rep photo exists
    const salesRepPhoto = await ensureSalesRepPhoto();
    
    // Step 3: Get KASH display
    const kashDisplay = await getKashDisplay();
    
    // Step 4: Create announcement project
    const project = await createAnnouncementProject(salesRepPhoto);
    
    // Step 5: Publish project to KASH display (test the content works)
    const publishResult = await publishProjectToKash(project, kashDisplay);
    
    // Step 6: Create KASH webhook
    const webhook = await createKashWebhook(project, kashDisplay);
    
    // Step 7: Test KASH webhook
    const webhookResult = await testKashWebhook(webhook);
    
    console.log('\n🎉 KASH webhook test completed!');
    console.log(`\n📋 Summary:`);
    console.log(`   Sales Rep: ${salesRepPhoto.name} (${salesRepPhoto.email})`);
    console.log(`   Project: ${project.name} (${project.id})`);
    console.log(`   Display: ${kashDisplay.name} (${kashDisplay.id})`);
    console.log(`   Webhook: ${webhook.endpointKey}`);
    console.log(`   Public URL: ${publishResult.summary?.publicApiUrl}`);
    console.log(`   Webhook Success: ${webhookResult.error ? '❌ Failed' : '✅ Success'}`);
    
    if (webhookResult.error) {
      console.log(`   Error: ${webhookResult.error}`);
    }
    
  } catch (error) {
    console.error('\n❌ KASH test failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  run();
}

module.exports = { run }; 