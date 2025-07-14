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

async function getDisplays() {
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
    return [kashDisplay];
  } catch (error) {
    console.error('❌ Failed to get KASH display:', error.response?.data || error.message);
    throw error;
  }
}

async function createAnnouncementContent(salesRepPhoto, displays) {
  console.log('\n🎨 Creating announcement content...');
  
  try {
    // Create a simple announcement project
    const projectData = {
      name: `Sales Achievement - ${REP_NAME} - ${Date.now()}`,
      description: 'Sales rep achievement announcement',
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
    console.error('❌ Failed to create announcement content:', error.response?.data || error.message);
    throw error;
  }
}

async function publishToDisplays(project, displays) {
  console.log('\n🚀 Publishing to displays...');
  
  try {
    const displayIds = displays.map(d => d.id);
    
    const response = await api.post(`/content/projects/${project.id}/publish`, {
      displayIds: displayIds,
      priority: 'HIGH',
      duration: 30
    });
    
    console.log('✅ Published to displays:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to publish to displays:', error.response?.data || error.message);
    throw error;
  }
}

async function triggerDisplayTakeover(displays, exportId) {
  console.log('\n📺 Triggering display takeover...');
  
  try {
    const results = [];
    
    for (const display of displays) {
      try {
        const response = await api.post(`/optisigns/displays/${display.id}/assign`, {
          contentUrl: `${BASE_URL}/content/public/${exportId}`,
          priority: 'HIGH',
          duration: 30,
          immediate: true
        });
        
        console.log(`✅ Takeover triggered for ${display.name}`);
        results.push({ displayId: display.id, success: true, data: response.data });
      } catch (error) {
        console.log(`❌ Takeover failed for ${display.name}:`, error.response?.data || error.message);
        results.push({ displayId: display.id, success: false, error: error.message });
      }
    }
    
    return results;
  } catch (error) {
    console.error('❌ Failed to trigger takeover:', error.response?.data || error.message);
    throw error;
  }
}

async function createSimpleWebhook(project, displays) {
  console.log('\n🔗 Creating simple webhook...');
  
  try {
    const webhookData = {
      name: `Simple Announcement Webhook - ${Date.now()}`,
      description: 'Simple sales rep announcement webhook using backend APIs',
      webhookType: 'announcement',
      brand: 'Test Brand',
      source: 'API Test',
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
          projectName: 'Sales Achievement - {{rep_name}}'
        },
        optisigns: {
          displaySelection: {
            mode: 'specific',
            displayIds: displays.map(d => d.id)
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
    console.log('✅ Simple webhook created:', response.data);
    
    // The webhook might be in response.data or response.data.webhook
    const webhook = response.data.webhook || response.data;
    console.log('   Endpoint Key:', webhook.endpointKey);
    
    return webhook;
  } catch (error) {
    console.error('❌ Failed to create webhook:', error.response?.data || error.message);
    throw error;
  }
}

async function testDirectAnnouncement(salesRepPhoto, displays) {
  console.log('\n🎯 Testing direct announcement (no webhook)...');
  
  try {
    // Method 1: Try the simple announcement endpoints
    console.log('   Testing video announcement endpoint...');
    try {
      const videoResponse = await api.post('/announcement/video', {
        repEmail: salesRepPhoto.email,
        repName: salesRepPhoto.name,
        dealAmount: '$25,000',
        companyName: 'Acme Corporation',
        displayIds: displays.map(d => d.id)
      });
      
      console.log('✅ Video announcement successful:', videoResponse.data);
      return videoResponse.data;
    } catch (error) {
      console.log('   Video endpoint not available:', error.response?.data?.error || error.message);
    }
    
    // Method 2: Try the image announcement endpoint
    console.log('   Testing image announcement endpoint...');
    try {
      const imageResponse = await api.post('/announcement/image', {
        repEmail: salesRepPhoto.email,
        repName: salesRepPhoto.name,
        displayIds: displays.map(d => d.id)
      });
      
      console.log('✅ Image announcement successful:', imageResponse.data);
      return imageResponse.data;
    } catch (error) {
      console.log('   Image endpoint not available:', error.response?.data?.error || error.message);
    }
    
    // Method 3: Direct OptiSigns push
    console.log('   Testing direct OptiSigns announcement...');
    const announcementData = {
      type: 'announcement',
      title: 'Sales Achievement',
      content: {
        repName: salesRepPhoto.name,
        repEmail: salesRepPhoto.email,
        dealAmount: '$25,000',
        companyName: 'Acme Corporation',
        photoUrl: salesRepPhoto.photoUrl
      },
      displayIds: displays.map(d => d.id),
      duration: 30,
      priority: 'HIGH'
    };
    
    const directResponse = await api.post('/optisigns/content', announcementData);
    console.log('✅ Direct OptiSigns announcement successful:', directResponse.data);
    return directResponse.data;
    
  } catch (error) {
    console.error('❌ Direct announcement failed:', error.response?.data || error.message);
    throw error;
  }
}

async function testWebhookDirectly(webhook) {
  console.log('\n🧪 Testing webhook directly...');
  
  try {
    const testPayload = {
      rep_name: REP_NAME,
      rep_email: REP_EMAIL,
      deal_amount: '$25,000',
      company_name: 'Acme Corporation',
      achievement_type: 'deal_closed'
    };
    
    // Use the webhook's security token for authentication
    const response = await axios.post(`${BASE_URL}/webhook-receiver/${webhook.endpointKey}`, testPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${webhook.securityToken}`
      }
    });
    
    console.log('✅ Webhook test successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Webhook test failed:', error.response?.data || error.message);
    return { error: error.message, details: error.response?.data };
  }
}

async function run() {
  try {
    console.log('🎯 Starting Backend Announcement Test\n');
    
    // Step 1: Authenticate
    await authenticate();
    
    // Step 2: Ensure sales rep photo exists
    const salesRepPhoto = await ensureSalesRepPhoto();
    
    // Step 3: Get displays
    const displays = await getDisplays();
    
    // Step 4: Create announcement content
    const project = await createAnnouncementContent(salesRepPhoto, displays);
    
    // Step 5: Publish to displays
    const publishResult = await publishToDisplays(project, displays);
    
    // Step 6: Trigger display takeover
    if (publishResult.exportId) {
      await triggerDisplayTakeover(displays, publishResult.exportId);
    }
    
    // Step 7: Test direct announcement (no webhook)
    await testDirectAnnouncement(salesRepPhoto, displays);
    
    // Step 8: Create simple webhook
    const webhook = await createSimpleWebhook(project, displays);
    
    // Step 9: Test webhook (if created successfully)
    if (webhook && webhook.endpointKey) {
      await testWebhookDirectly(webhook);
    } else {
      console.log('⚠️ Skipping webhook test - webhook creation failed');
    }
    
    console.log('\n🎉 Backend announcement test completed successfully!');
    console.log(`\n📋 Summary:`);
    console.log(`   Sales Rep: ${salesRepPhoto.name} (${salesRepPhoto.email})`);
    console.log(`   Project: ${project.name} (${project.id})`);
    console.log(`   Displays: ${displays.length} displays`);
    console.log(`   Webhook: ${webhook.endpointKey}`);
    console.log(`   Public URL: ${BASE_URL}/content/public/${publishResult.exportId}`);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  run();
}

module.exports = { run }; 