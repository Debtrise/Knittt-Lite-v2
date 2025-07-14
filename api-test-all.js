const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
require('dotenv').config();

const BASE_URL = process.env.BASE_URL || 'http://34.122.156.88:3001/api';
const REP_EMAIL = process.env.REP_EMAIL || 'salesrep@example.com';
const REP_NAME = process.env.REP_NAME || 'Sales Rep';
const PHOTO_PATH = process.env.PHOTO_PATH || './test.jpg';
const DISPLAY_NAME = process.env.DISPLAY_NAME || 'KASH office';

// API instance will be configured after authentication
let api;

async function authenticate() {
  console.log('\n🔐 Authenticating with admin credentials...');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });

    if (response.data && response.data.token) {
      console.log('✅ Authentication successful');
      console.log('🔑 Full Auth Token:', response.data.token);
      
      // Configure API instance with the obtained token
      api = axios.create({
        baseURL: BASE_URL,
        headers: { 
          'Authorization': `Bearer ${response.data.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data.token;
    } else {
      throw new Error('No token received from server');
    }
  } catch (error) {
    console.error('❌ Authentication failed:', error.response?.data || error.message);
    throw error;
  }
}

async function uploadPhoto() {
  console.log('\n📸 Uploading sales rep photo...');
  const form = new FormData();
  form.append('photo', fs.createReadStream(PHOTO_PATH));
  form.append('repEmail', REP_EMAIL);
  form.append('repName', REP_NAME);
  form.append('replace', 'true'); // Allow replacing existing photos

  const res = await api.post('/sales-rep-photos/upload', form, {
    headers: form.getHeaders()
  });
  console.log('✅ Photo uploaded:', res.data.id);
  return res.data;
}

async function searchPhoto() {
  console.log('\n🔍 Searching photo by email...');
  const res = await api.get(`/sales-rep-photos/by-email/${encodeURIComponent(REP_EMAIL)}`);
  console.log('✅ Photo found:', res.data.id);
  return res.data;
}

async function createProject() {
  console.log('\n🎨 Creating project with sales rep photo element...');
  const projectData = {
    name: 'Sales Rep Photo Test',
    category: 'announcement',
    canvasSize: { width: 1920, height: 1080 },
    projectData: {
      elements: {
        photo: {
          elementType: 'sales_rep_photo',
          position: { x: 760, y: 240, z: 1 },
          size: { width: 400, height: 400 },
          properties: { src: '{rep_photo}', fit: 'cover' }
        },
        name: {
          elementType: 'text',
          position: { x: 960, y: 700, z: 1 },
          size: { width: 1000, height: 100 },
          properties: { text: '{rep_name}', fontSize: 48, textAlign: 'center' }
        }
      },
      variables: {
        rep_name: { type: 'text', default: REP_NAME },
        rep_email: { type: 'text', default: REP_EMAIL },
        rep_photo: { type: 'image', default: '' }
      },
      isPublic: false
    }
  };

  const res = await api.post('/content/projects', projectData);
  console.log('✅ Project created:', res.data.project.id);
  return res.data.project;
}

async function createWebhook(projectId) {
  console.log('\n🔗 Creating webhook for announcement...');
  const webhookData = {
    name: 'Sales Rep Photo Celebration Webhook',
    description: 'Celebrates sales achievements with rep photos and screen takeover',
    webhookType: 'announcement',
    brand: 'Sales',
    source: 'CRM',
    endpointKey: `rep_photo_${Date.now()}`,
    isActive: true,
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
      contentCreator: {
        projectId,
        variableMapping: {
          rep_name: 'rep_name',
          rep_email: 'rep_email',
          rep_photo: 'rep_photo',
          deal_amount: 'deal_amount',
          company_name: 'company_name',
          achievement_type: 'achievement_type'
        },
        autoGenerate: true,
        projectName: 'Sales Rep Celebration - {{rep_name}}'
      },
      optisigns: {
        displaySelection: { mode: 'all' },
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

  const res = await api.post('/webhooks', webhookData);
  console.log('✅ Webhook created:', res.data.endpointKey);
  return res.data;
}

async function findDisplayId(name) {
  console.log(`\n📺 Searching for display "${name}"...`);
  const res = await api.get('/optisigns/displays?limit=100');
  const display = res.data.displays.find(d => d.name.toLowerCase() === name.toLowerCase());
  if (!display) throw new Error('Display not found');
  console.log('✅ Display found:', display.id);
  return display.id;
}

async function publishProject(projectId, displayId) {
  console.log('\n🚀 Publishing project to display...');
  const res = await api.post(`/content/projects/${projectId}/publish`, { displayIds: [displayId] });
  console.log('✅ Publish initiated');
  return res.data;
}

async function testWebhook(webhook, photoData) {
  console.log('\n🧪 Testing webhook with sales rep photo data...');
  
  const testPayload = {
    rep_name: REP_NAME,
    rep_email: REP_EMAIL,
    rep_photo: photoData.photo ? photoData.photo.photoUrl : '', // Use the uploaded photo URL
    deal_amount: '$25,000',
    company_name: 'Acme Corporation',
    achievement_type: 'deal_closed'
  };

  try {
    // Create a custom axios instance with the security token for webhook testing
    // Since BASE_URL already includes /api, we use it directly for webhook calls
    const webhookApi = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${webhook.securityToken}` // Use the webhook's security token
      }
    });

    console.log(`🔐 Using security token: ${webhook.securityToken}`);
    
    const res = await webhookApi.post(`/webhook-receiver/${webhook.endpointKey}`, testPayload);
    console.log('✅ Webhook test successful:', res.data.message);
    console.log('📊 Announcement actions:', res.data.announcementActions);
    return res.data;
  } catch (error) {
    console.error('❌ Webhook test failed:', error.response?.data || error.message);
    throw error;
  }
}

async function createAnnouncementVideo(displayIds) {
  console.log('\n🎬 Creating announcement video with sales rep photo...');
  
  const videoPayload = {
    repEmail: REP_EMAIL,
    repName: REP_NAME,
    dealAmount: '$25,000',
    companyName: 'Acme Corporation',
    displayIds: displayIds
  };

  try {
    const res = await api.post('/announcement/video', videoPayload);
    console.log('✅ Announcement video created and sent to displays');
    console.log('📹 Video details:', res.data);
    return res.data;
  } catch (error) {
    console.error('❌ Announcement video creation failed:', error.response?.data || error.message);
    throw error;
  }
}

async function createAnnouncementImage(displayIds) {
  console.log('\n🖼️ Creating announcement image with sales rep photo...');
  
  const imagePayload = {
    repEmail: REP_EMAIL,
    repName: REP_NAME,
    displayIds: displayIds
  };

  try {
    const res = await api.post('/announcement/image', imagePayload);
    console.log('✅ Announcement image sent to displays');
    console.log('🖼️ Image details:', res.data);
    return res.data;
  } catch (error) {
    console.error('❌ Announcement image creation failed:', error.response?.data || error.message);
    throw error;
  }
}

async function run() {
  try {
    // Authenticate first
    await authenticate();
    
    // Now run the workflow with authenticated API
    const photo = await uploadPhoto();
    const searchResult = await searchPhoto();
    const project = await createProject();
    const webhook = await createWebhook(project.id);
    const displayId = await findDisplayId(DISPLAY_NAME);
    const publishRes = await publishProject(project.id, displayId);
    
    console.log('\n📊 Publish summary:', publishRes.summary);
    console.log('🌐 Public URL:', publishRes.export?.publicUrl);
    
    // Test the webhook with sales rep photo data
    const webhookTest = await testWebhook(webhook, photo);
    
    console.log('\n🎯 Webhook Details:');
    console.log(`   📡 Endpoint: ${BASE_URL}/webhook-receiver/${webhook.endpointKey}`);
    console.log(`   🔑 Endpoint Key: ${webhook.endpointKey}`);
    console.log(`   🔐 Security Token: ${webhook.securityToken}`);
    console.log(`   📋 Variables: rep_name, rep_email, rep_photo, deal_amount, company_name, achievement_type`);
    console.log(`   ⚠️  Important: Include security token as Bearer token in Authorization header`);
    
    // Test the new simple announcement endpoints
    console.log('\n🚀 Testing Simple Announcement Endpoints...');
    
    // Test announcement video endpoint
    const videoResult = await createAnnouncementVideo([displayId]);
    
    // Wait a moment before testing image endpoint
    console.log('\n⏳ Waiting 3 seconds before testing image endpoint...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test announcement image endpoint
    const imageResult = await createAnnouncementImage([displayId]);
    
    console.log('\n🎯 Simple Announcement API Details:');
    console.log(`   🎬 Video Endpoint: ${BASE_URL}/announcement/video`);
    console.log(`   🖼️  Image Endpoint: ${BASE_URL}/announcement/image`);
    console.log(`   📋 Required Fields: repEmail, displayIds`);
    console.log(`   📋 Optional Fields: repName, dealAmount, companyName`);
    
    console.log('\n✅ Complete workflow finished successfully!');
    console.log('🎉 Sales rep photo system is ready for all types of announcements');
    console.log('💡 You can now use both webhook triggers and direct API calls');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', err.response.data);
    }
  }
}

// Standalone function to test just the simple announcement endpoints
async function testSimpleAnnouncements() {
  try {
    await authenticate();
    
    // Get a display ID for testing
    const displayId = await findDisplayId(DISPLAY_NAME);
    
    console.log('\n🎬 Testing Video Announcement...');
    await createAnnouncementVideo([displayId]);
    
    console.log('\n⏳ Waiting 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\n🖼️ Testing Image Announcement...');
    await createAnnouncementImage([displayId]);
    
    console.log('\n✅ Simple announcement tests completed!');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', err.response.data);
    }
  }
}

if (require.main === module) {
  // Check if user wants to run simple announcements only
  if (process.argv.includes('--simple')) {
    console.log('🚀 Running simple announcement tests only...');
    testSimpleAnnouncements();
  } else {
    run();
  }
}

module.exports = { run, testSimpleAnnouncements, createAnnouncementVideo, createAnnouncementImage }; 