const axios = require('axios');

const BASE_URL = 'http://34.122.156.88:3001/api';
const REP_NAME = 'Sarah Johnson';
const REP_EMAIL = 'sarah.johnson@example.com';

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

async function getSalesRepPhoto() {
  console.log('\n📸 Getting sales rep photo...');
  
  try {
    // Try to get existing photo first
    try {
      const photoResponse = await api.get(`/sales-rep-photos/by-email/${encodeURIComponent(REP_EMAIL)}`);
      console.log('✅ Found existing photo:', photoResponse.data.name);
      return photoResponse.data;
    } catch (error) {
      if (error.response?.status === 404) {
        // Create a new photo if not found
        console.log('📸 Creating new sales rep photo...');
        const createResponse = await api.post('/sales-rep-photos', {
          name: REP_NAME,
          email: REP_EMAIL,
          photoUrl: 'https://via.placeholder.com/300x300/9C27B0/FFFFFF?text=SJ'
        });
        console.log('✅ New photo created:', createResponse.data.name);
        return createResponse.data;
      }
      throw error;
    }
  } catch (error) {
    console.error('❌ Failed to get/create sales rep photo:', error.response?.data || error.message);
    throw error;
  }
}

async function getKashDisplay() {
  console.log('\n📺 Getting KASH office display...');
  
  try {
    const response = await api.get('/optisigns/displays');
    const displays = response.data.displays || [];
    
    const kashDisplay = displays.find(d => 
      d.name && d.name.toLowerCase().includes('kash')
    );
    
    if (!kashDisplay) {
      throw new Error('KASH office display not found');
    }
    
    console.log('✅ Found KASH display:', kashDisplay.name);
    console.log(`   Status: ${kashDisplay.isOnline ? 'Online' : 'Offline'}`);
    return kashDisplay;
  } catch (error) {
    console.error('❌ Failed to get KASH display:', error.response?.data || error.message);
    throw error;
  }
}

async function getExistingTemplate() {
  console.log('\n🎨 Getting existing announcement template...');
  
  try {
    const response = await api.get('/content/templates');
    const templates = response.data.templates || [];
    
    if (templates.length === 0) {
      throw new Error('No templates found - please run test-complete-webhook-with-templates.js first');
    }
    
    // Find the best template for announcements
    let template = templates.find(t => 
      t.category === 'announcement' || 
      t.name.toLowerCase().includes('sales') || 
      t.name.toLowerCase().includes('achievement')
    );
    
    if (!template) {
      // Use the first available template
      template = templates[0];
    }
    
    console.log('✅ Using existing template:');
    console.log(`   ID: ${template.id}`);
    console.log(`   Name: ${template.name}`);
    console.log(`   Category: ${template.category}`);
    
    if (template.variables) {
      console.log(`   Variables: ${Object.keys(template.variables).join(', ')}`);
    }
    
    return template;
  } catch (error) {
    console.error('❌ Failed to get existing template:', error.response?.data || error.message);
    throw error;
  }
}

async function getExistingProject() {
  console.log('\n📁 Getting existing project...');
  
  try {
    const response = await api.get('/content/projects');
    const projects = response.data.projects || [];
    
    if (projects.length === 0) {
      throw new Error('No projects found - please run test-complete-webhook-with-templates.js first');
    }
    
    // Use the most recent project
    const project = projects[0];
    
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

async function createSimpleWebhook(project, kashDisplay) {
  console.log('\n🔗 Creating simple webhook with existing resources...');
  
  try {
    const webhookData = {
      name: `Simple Announcement Webhook - ${Date.now()}`,
      description: 'Simple webhook using existing templates and projects',
      webhookType: 'announcement',
      brand: 'KASH',
      source: 'Sales CRM',
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
          projectName: 'Quick Announcement - {{rep_name}} - {{timestamp}}'
        },
        optisigns: {
          displaySelection: {
            mode: 'specific',
            displayIds: [kashDisplay.id]
          },
          takeover: {
            priority: 'MEDIUM',
            duration: 25,
            restoreAfter: true,
            overrideCurrent: false
          },
          scheduling: {
            immediate: true
          }
        }
      }
    };
    
    const response = await api.post('/webhooks', webhookData);
    const webhook = response.data.webhook || response.data;
    
    console.log('✅ Simple webhook created:');
    console.log(`   Webhook ID: ${webhook.id}`);
    console.log(`   Endpoint Key: ${webhook.endpointKey}`);
    console.log(`   Security Token: ${webhook.securityToken?.substring(0, 20)}...`);
    
    return webhook;
  } catch (error) {
    console.error('❌ Failed to create simple webhook:', error.response?.data || error.message);
    throw error;
  }
}

async function testSimpleWebhook(webhook) {
  console.log('\n🧪 Testing simple webhook...');
  
  try {
    const testPayload = {
      rep_name: REP_NAME,
      rep_email: REP_EMAIL,
      deal_amount: '$42,500',
      company_name: 'Global Tech Solutions',
      achievement_type: 'upsell',
      deal_type: 'existing_customer'
    };
    
    console.log('📋 Test payload:');
    console.log(JSON.stringify(testPayload, null, 2));
    
    const response = await axios.post(`${BASE_URL}/webhook-receiver/${webhook.endpointKey}`, testPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${webhook.securityToken}`
      }
    });
    
    console.log('✅ Webhook test successful!');
    console.log('📊 Response:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ Webhook test failed:', error.response?.data || error.message);
    return { 
      error: error.message, 
      details: error.response?.data,
      status: error.response?.status
    };
  }
}

async function run() {
  try {
    console.log('🚀 Starting Simple Webhook Test with Existing Templates\n');
    
    // Step 1: Authenticate
    await authenticate();
    
    // Step 2: Get sales rep photo
    const salesRepPhoto = await getSalesRepPhoto();
    
    // Step 3: Get KASH display
    const kashDisplay = await getKashDisplay();
    
    // Step 4: Get existing template
    const template = await getExistingTemplate();
    
    // Step 5: Get existing project
    const project = await getExistingProject();
    
    // Step 6: Create simple webhook
    const webhook = await createSimpleWebhook(project, kashDisplay);
    
    // Step 7: Test simple webhook
    const webhookResult = await testSimpleWebhook(webhook);
    
    console.log('\n🎉 Simple webhook test completed!');
    console.log('\n📋 Summary:');
    console.log(`   Sales Rep: ${salesRepPhoto.name || REP_NAME} (${salesRepPhoto.email || REP_EMAIL})`);
    console.log(`   Template: ${template.name} (${template.id})`);
    console.log(`   Project: ${project.name} (${project.id})`);
    console.log(`   Display: ${kashDisplay.name} (${kashDisplay.id})`);
    console.log(`   Webhook: ${webhook.endpointKey}`);
    console.log(`   Test Result: ${webhookResult.error ? '❌ Failed' : '✅ Success'}`);
    
    if (webhookResult.error) {
      console.log(`   Error: ${webhookResult.error}`);
    }
    
    console.log('\n💡 Usage:');
    console.log(`   Webhook URL: ${BASE_URL}/webhook-receiver/${webhook.endpointKey}`);
    console.log(`   Security Token: ${webhook.securityToken}`);
    console.log('   Required fields: rep_name, rep_email, deal_amount, company_name');
    
  } catch (error) {
    console.error('\n❌ Simple test failed:', error.message);
    console.log('\n💡 Tip: Run "node test-complete-webhook-with-templates.js" first to create templates and projects');
    process.exit(1);
  }
}

if (require.main === module) {
  run();
}

module.exports = { run }; 