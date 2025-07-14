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
    console.log('   Status:', kashDisplay.isOnline ? 'Online' : 'Offline');
    console.log('   Location:', kashDisplay.location);
    return kashDisplay;
  } catch (error) {
    console.error('❌ Failed to get KASH display:', error.response?.data || error.message);
    throw error;
  }
}

async function getOrCreateAnnouncementTemplate() {
  console.log('\n🎨 Getting or creating announcement template...');
  
  try {
    // First, check if we have existing templates
    const templatesResponse = await api.get('/content/templates', {
      params: {
        category: 'announcement',
        limit: 10
      }
    });
    
    const templates = templatesResponse.data.templates || [];
    console.log(`✅ Found ${templates.length} announcement templates`);
    
    // Look for a suitable template
    let template = templates.find(t => 
      t.name.toLowerCase().includes('sales') || 
      t.name.toLowerCase().includes('deal') ||
      t.name.toLowerCase().includes('celebration')
    );
    
    if (template) {
      console.log('✅ Using existing template:');
      console.log(`   ID: ${template.id}`);
      console.log(`   Name: ${template.name}`);
      console.log(`   Description: ${template.description}`);
      
      // Validate template has required variables
      const templateVariables = template.variables || {};
      const requiredVars = ['rep_name', 'deal_amount', 'company_name'];
      const missingVars = requiredVars.filter(v => !templateVariables[v] && !templateVariables[`{{${v}}}`]);
      
      if (missingVars.length > 0) {
        console.log(`⚠️  Template missing variables: ${missingVars.join(', ')}`);
        console.log('   Available variables:', Object.keys(templateVariables));
      }
      
      return template;
    }
    
    // Create a new template if none found
    console.log('📝 Creating new announcement template...');
    
    const newTemplate = {
      name: 'Sales Achievement Celebration',
      description: 'Template for celebrating sales achievements with rep photo and deal details',
      category: 'announcement',
      canvasSize: { width: 1920, height: 1080 },
      templateData: {
        elements: [
          {
            id: 'background',
            elementType: 'rectangle',
            position: { x: 0, y: 0, z: 0 },
            size: { width: 1920, height: 1080 },
            properties: {
              fill: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            },
            styles: {}
          },
          {
            id: 'title',
            elementType: 'text',
            position: { x: 960, y: 150, z: 1 },
            size: { width: 800, height: 100 },
            properties: {
              text: '🎉 CONGRATULATIONS! 🎉',
              textAlign: 'center'
            },
            styles: {
              fontSize: '64px',
              fontWeight: 'bold',
              color: '#FFFFFF',
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
            }
          },
          {
            id: 'rep_photo',
            elementType: 'sales_rep_photo',
            position: { x: 760, y: 300, z: 2 },
            size: { width: 400, height: 400 },
            properties: {
              borderRadius: '50%',
              border: '8px solid #FFFFFF',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            },
            styles: {}
          },
          {
            id: 'rep_name',
            elementType: 'text',
            position: { x: 960, y: 750, z: 3 },
            size: { width: 600, height: 80 },
            properties: {
              text: '{{rep_name}}',
              textAlign: 'center'
            },
            styles: {
              fontSize: '48px',
              fontWeight: 'bold',
              color: '#FFD700',
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
            }
          },
          {
            id: 'deal_info',
            elementType: 'text',
            position: { x: 960, y: 850, z: 4 },
            size: { width: 800, height: 120 },
            properties: {
              text: 'Closed {{deal_amount}} deal with {{company_name}}!',
              textAlign: 'center'
            },
            styles: {
              fontSize: '36px',
              color: '#FFFFFF',
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
            }
          },
          {
            id: 'celebration_text',
            elementType: 'text',
            position: { x: 960, y: 980, z: 5 },
            size: { width: 600, height: 60 },
            properties: {
              text: 'Outstanding Achievement!',
              textAlign: 'center'
            },
            styles: {
              fontSize: '28px',
              fontStyle: 'italic',
              color: '#FFD700',
              textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
            }
          }
        ],
        canvasBackground: {
          type: 'gradient',
          value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }
      },
      variables: {
        rep_name: 'John Smith',
        deal_amount: '$50,000',
        company_name: 'Acme Corporation',
        rep_photo: 'https://via.placeholder.com/400x400/4CAF50/FFFFFF?text=JS'
      },
      isPublic: true,
      tags: ['sales', 'achievement', 'celebration', 'announcement']
    };
    
    const createResponse = await api.post('/content/templates', newTemplate);
    template = createResponse.data.template;
    
    console.log('✅ New template created:');
    console.log(`   ID: ${template.id}`);
    console.log(`   Name: ${template.name}`);
    
    return template;
  } catch (error) {
    console.error('❌ Failed to get/create announcement template:', error.response?.data || error.message);
    throw error;
  }
}

async function createProjectFromTemplate(template, salesRepPhoto) {
  console.log('\n🎨 Creating project from template...');
  
  try {
    const projectData = {
      name: `Sales Achievement - ${REP_NAME} - ${Date.now()}`,
      description: `Sales achievement announcement for ${REP_NAME}`,
      templateId: template.id,
      canvasSize: template.canvasSize,
      variables: {
        rep_name: salesRepPhoto.name,
        deal_amount: '$25,000',
        company_name: 'Acme Corporation',
        rep_photo: salesRepPhoto.photoUrl
      }
    };
    
    const response = await api.post('/content/projects', projectData);
    const project = response.data.project;
    
    console.log('✅ Project created from template:');
    console.log(`   Project ID: ${project.id}`);
    console.log(`   Template ID: ${template.id}`);
    console.log(`   Variables:`, project.variables);
    
    return project;
  } catch (error) {
    console.error('❌ Failed to create project from template:', error.response?.data || error.message);
    throw error;
  }
}

async function createWebhookWithTemplate(template, project, kashDisplay) {
  console.log('\n🔗 Creating webhook with template configuration...');
  
  try {
    const webhookData = {
      name: `Sales Achievement Webhook - ${Date.now()}`,
      description: 'Sales rep announcement webhook with template integration',
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
          templateId: template.id,
          autoGenerate: true,
          projectName: 'Sales Achievement - {{rep_name}} - {{timestamp}}',
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
    
    const response = await api.post('/webhooks', webhookData);
    const webhook = response.data.webhook || response.data;
    
    console.log('✅ Webhook created with template configuration:');
    console.log(`   Webhook ID: ${webhook.id}`);
    console.log(`   Endpoint Key: ${webhook.endpointKey}`);
    console.log(`   Template ID: ${template.id}`);
    console.log(`   Project ID: ${project.id}`);
    console.log(`   Display ID: ${kashDisplay.id}`);
    
    return webhook;
  } catch (error) {
    console.error('❌ Failed to create webhook with template:', error.response?.data || error.message);
    throw error;
  }
}

async function testWebhookWithTemplate(webhook, template) {
  console.log('\n🧪 Testing webhook with template variables...');
  
  try {
    const testPayload = {
      rep_name: REP_NAME,
      rep_email: REP_EMAIL,
      deal_amount: '$35,000',
      company_name: 'TechCorp Solutions',
      achievement_type: 'deal_closed',
      deal_type: 'new_business'
    };
    
    console.log('📋 Test payload:');
    console.log(JSON.stringify(testPayload, null, 2));
    
    console.log('\n🔧 Template variables:');
    console.log(JSON.stringify(template.variables, null, 2));
    
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

async function validateSystemStatus() {
  console.log('\n🔍 Validating system status...');
  
  try {
    const checks = [
      { name: 'Authentication', endpoint: '/login', method: 'POST', data: { username: 'admin', password: 'admin123' } },
      { name: 'Sales Rep Photos', endpoint: '/sales-rep-photos', method: 'GET' },
      { name: 'Content Templates', endpoint: '/content/templates', method: 'GET' },
      { name: 'Content Projects', endpoint: '/content/projects', method: 'GET' },
      { name: 'OptiSigns Displays', endpoint: '/optisigns/displays', method: 'GET' },
      { name: 'Webhooks', endpoint: '/webhooks', method: 'GET' }
    ];
    
    const results = {};
    
    for (const check of checks) {
      try {
        let response;
        if (check.method === 'POST') {
          response = await axios.post(`${BASE_URL}${check.endpoint}`, check.data);
        } else {
          response = await api.get(check.endpoint);
        }
        
        results[check.name] = {
          status: 'OK',
          statusCode: response.status,
          dataLength: JSON.stringify(response.data).length
        };
        
        console.log(`✅ ${check.name}: OK (${response.status})`);
      } catch (error) {
        results[check.name] = {
          status: 'ERROR',
          statusCode: error.response?.status || 'NETWORK_ERROR',
          error: error.message
        };
        
        console.log(`❌ ${check.name}: ERROR (${error.response?.status || 'NETWORK'})`);
      }
    }
    
    return results;
  } catch (error) {
    console.error('❌ System validation failed:', error.message);
    return {};
  }
}

async function run() {
  try {
    console.log('🚀 Starting Complete Webhook Test with Templates\n');
    
    // Step 1: Validate system status
    const systemStatus = await validateSystemStatus();
    
    // Step 2: Authenticate
    await authenticate();
    
    // Step 3: Ensure sales rep photo exists
    const salesRepPhoto = await ensureSalesRepPhoto();
    
    // Step 4: Get KASH display
    const kashDisplay = await getKashDisplay();
    
    // Step 5: Get or create announcement template
    const template = await getOrCreateAnnouncementTemplate();
    
    // Step 6: Create project from template
    const project = await createProjectFromTemplate(template, salesRepPhoto);
    
    // Step 7: Create webhook with template
    const webhook = await createWebhookWithTemplate(template, project, kashDisplay);
    
    // Step 8: Test webhook with template variables
    const webhookResult = await testWebhookWithTemplate(webhook, template);
    
    console.log('\n🎉 Complete webhook test with templates completed!');
    console.log('\n📋 Final Summary:');
    console.log(`   Sales Rep: ${salesRepPhoto.name} (${salesRepPhoto.email})`);
    console.log(`   Template: ${template.name} (${template.id})`);
    console.log(`   Project: ${project.name} (${project.id})`);
    console.log(`   Display: ${kashDisplay.name} (${kashDisplay.id})`);
    console.log(`   Webhook: ${webhook.endpointKey}`);
    console.log(`   Test Result: ${webhookResult.error ? '❌ Failed' : '✅ Success'}`);
    
    if (webhookResult.error) {
      console.log(`   Error: ${webhookResult.error}`);
      console.log(`   Details:`, webhookResult.details);
    }
    
    console.log('\n🔍 System Status Summary:');
    Object.entries(systemStatus).forEach(([service, status]) => {
      console.log(`   ${service}: ${status.status === 'OK' ? '✅' : '❌'} ${status.status}`);
    });
    
    console.log('\n📖 Template Variables:');
    console.log(`   Available: ${Object.keys(template.variables).join(', ')}`);
    
    console.log('\n🔗 Webhook Configuration:');
    console.log(`   Type: ${webhook.webhookType || 'announcement'}`);
    console.log(`   URL: ${BASE_URL}/webhook-receiver/${webhook.endpointKey}`);
    console.log(`   Security Token: ${webhook.securityToken?.substring(0, 20)}...`);
    
  } catch (error) {
    console.error('\n❌ Complete test failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  run();
}

module.exports = { run }; 