const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://34.122.156.88:3001/api'; // Updated to use port 88 as mentioned
const AUTH_TOKEN = 'YOUR_JWT_TOKEN_HERE'; // Replace with actual token

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function testEmailAPI() {
  console.log('🧪 Testing Knittt Mailgun Integration API');
  console.log('='.repeat(50));

  try {
    // Test 1: Get Email Providers
    console.log('\n1️⃣ Testing GET /email/providers');
    try {
      const providersResponse = await api.get('/email/providers');
      console.log('✅ Email providers fetched successfully');
      console.log('Providers:', providersResponse.data.data?.map(p => p.name).join(', '));
    } catch (error) {
      console.log('❌ Failed to fetch email providers:', error.response?.data?.error || error.message);
    }

    // Test 2: Get Email Configuration
    console.log('\n2️⃣ Testing GET /email/config');
    let emailConfig = null;
    try {
      const configResponse = await api.get('/email/config');
      emailConfig = configResponse.data.data;
      console.log('✅ Email configuration fetched successfully');
      console.log('Provider:', emailConfig?.provider);
      console.log('From Email:', emailConfig?.fromEmail);
      console.log('Daily Limit:', emailConfig?.dailyLimit);
      console.log('Is Active:', emailConfig?.isActive);
    } catch (error) {
      console.log('❌ Failed to fetch email config:', error.response?.data?.error || error.message);
    }

    // Test 3: Save Email Configuration (Mailgun)
    console.log('\n3️⃣ Testing POST /email/config (Mailgun Configuration)');
    const testConfig = {
      provider: 'mailgun',
      fromEmail: 'test@yourdomain.com',
      fromName: 'Test Company',
      replyToEmail: 'support@yourdomain.com',
      dailyLimit: 1000,
      settings: {
        apiKey: 'key-test123456789',
        domain: 'mg.yourdomain.com',
        host: 'api.mailgun.net',
        tracking: true,
        trackingClicks: 'yes',
        trackingOpens: true,
        tags: 'test,automated'
      }
    };

    try {
      const saveResponse = await api.post('/email/config', testConfig);
      console.log('✅ Email configuration saved successfully');
      console.log('Config ID:', saveResponse.data.data?.id);
    } catch (error) {
      console.log('❌ Failed to save email config:', error.response?.data?.error || error.message);
    }

    // Test 4: Test Email Connection
    console.log('\n4️⃣ Testing POST /email/test');
    try {
      const testRequest = {
        to: 'test@example.com',
        testType: 'basic'
      };
      const testResponse = await api.post('/email/test', testRequest);
      console.log('✅ Email test successful');
      console.log('Message ID:', testResponse.data.data?.messageId);
      console.log('Provider:', testResponse.data.data?.provider);
    } catch (error) {
      console.log('❌ Email test failed:', error.response?.data?.error || error.message);
    }

    // Test 5: Get Email Statistics
    console.log('\n5️⃣ Testing GET /email/stats');
    try {
      const statsResponse = await api.get('/email/stats');
      const stats = statsResponse.data.data;
      console.log('✅ Email statistics fetched successfully');
      console.log('Provider:', stats?.provider);
      console.log('Emails sent:', stats?.stats?.sent);
      console.log('Emails delivered:', stats?.stats?.delivered);
      console.log('Open rate:', stats?.stats?.opened + '/' + stats?.stats?.delivered);
      console.log('Daily usage:', stats?.sentToday + '/' + stats?.dailyLimit);
    } catch (error) {
      console.log('❌ Failed to fetch email stats:', error.response?.data?.error || error.message);
    }

    // Test 6: List Email Templates
    console.log('\n6️⃣ Testing GET /templates (Email Templates)');
    try {
      const templatesResponse = await api.get('/templates', {
        params: { type: 'email', page: 1, limit: 10 }
      });
      const templates = templatesResponse.data.data?.templates || [];
      console.log('✅ Email templates fetched successfully');
      console.log('Total templates:', templates.length);
      if (templates.length > 0) {
        console.log('First template:', templates[0].name);
        console.log('Subject:', templates[0].subject);
        console.log('Variables:', templates[0].variables?.map(v => v.name).join(', '));
      }
    } catch (error) {
      console.log('❌ Failed to fetch email templates:', error.response?.data?.error || error.message);
    }

    // Test 7: Create Email Template
    console.log('\n7️⃣ Testing POST /templates (Create Email Template)');
    const testTemplate = {
      name: 'Test Welcome Email',
      description: 'A test welcome email template',
      type: 'email',
      subject: 'Welcome to {{companyName}}, {{firstName}}!',
      content: 'Hi {{firstName}}, Welcome to {{companyName}}! We\'re excited to have you on board.',
      htmlContent: '<div><h1>Welcome {{firstName}}!</h1><p>Hi {{firstName}}, Welcome to <strong>{{companyName}}</strong>!</p></div>',
      isActive: true
    };

    try {
      const createResponse = await api.post('/templates', testTemplate);
      const newTemplate = createResponse.data.data;
      console.log('✅ Email template created successfully');
      console.log('Template ID:', newTemplate?.id);
      console.log('Variables detected:', newTemplate?.variables?.map(v => v.name).join(', '));

      // Test 8: Render Template
      if (newTemplate?.id) {
        console.log('\n8️⃣ Testing POST /templates/' + newTemplate.id + '/render');
        try {
          const renderRequest = {
            variables: {
              firstName: 'John',
              companyName: 'Acme Corp'
            },
            context: {
              agentName: 'Sarah'
            }
          };
          const renderResponse = await api.post(`/templates/${newTemplate.id}/render`, renderRequest);
          const rendered = renderResponse.data.data;
          console.log('✅ Template rendered successfully');
          console.log('Rendered subject:', rendered?.subject);
          console.log('Rendered content preview:', rendered?.content?.substring(0, 100) + '...');
        } catch (error) {
          console.log('❌ Failed to render template:', error.response?.data?.error || error.message);
        }

        // Test 9: Send Email with Template
        console.log('\n9️⃣ Testing POST /email/send (Send Templated Email)');
        try {
          const sendRequest = {
            to: 'test@example.com',
            templateId: newTemplate.id,
            variables: {
              firstName: 'John',
              companyName: 'Acme Corp'
            },
            tags: ['test', 'welcome'],
            campaignId: 'test-campaign-2024'
          };
          const sendResponse = await api.post('/email/send', sendRequest);
          const sendResult = sendResponse.data.data;
          console.log('✅ Email sent successfully');
          console.log('Message ID:', sendResult?.messageId);
          console.log('Provider:', sendResult?.provider);
        } catch (error) {
          console.log('❌ Failed to send email:', error.response?.data?.error || error.message);
        }

        // Test 10: Clone Template
        console.log('\n🔟 Testing POST /templates/' + newTemplate.id + '/clone');
        try {
          const cloneResponse = await api.post(`/templates/${newTemplate.id}/clone`);
          const clonedTemplate = cloneResponse.data.data;
          console.log('✅ Template cloned successfully');
          console.log('Cloned template ID:', clonedTemplate?.id);
          console.log('Cloned template name:', clonedTemplate?.name);
        } catch (error) {
          console.log('❌ Failed to clone template:', error.response?.data?.error || error.message);
        }
      }
    } catch (error) {
      console.log('❌ Failed to create email template:', error.response?.data?.error || error.message);
    }

    // Test 11: Get Template Categories
    console.log('\n1️⃣1️⃣ Testing GET /templates/categories');
    try {
      const categoriesResponse = await api.get('/templates/categories', {
        params: { type: 'email' }
      });
      const categories = categoriesResponse.data.data?.categories || [];
      console.log('✅ Template categories fetched successfully');
      console.log('Categories found:', categories.length);
      categories.forEach(cat => {
        console.log(`- ${cat.name}: ${cat.description || 'No description'}`);
      });
    } catch (error) {
      console.log('❌ Failed to fetch template categories:', error.response?.data?.error || error.message);
    }

    // Test 12: Create Template Category
    console.log('\n1️⃣2️⃣ Testing POST /templates/categories');
    try {
      const newCategory = {
        name: 'Test Marketing Emails',
        description: 'Test category for marketing email templates',
        type: 'email'
      };
      const categoryResponse = await api.post('/templates/categories', newCategory);
      const createdCategory = categoryResponse.data.data;
      console.log('✅ Template category created successfully');
      console.log('Category ID:', createdCategory?.id);
      console.log('Category name:', createdCategory?.name);
    } catch (error) {
      console.log('❌ Failed to create template category:', error.response?.data?.error || error.message);
    }

    // Test 13: Reset Daily Email Limit (Admin function)
    console.log('\n1️⃣3️⃣ Testing POST /email/reset-daily-limit');
    try {
      const resetResponse = await api.post('/email/reset-daily-limit');
      console.log('✅ Daily email limit reset successfully');
      console.log('Message:', resetResponse.data.data?.message);
    } catch (error) {
      console.log('❌ Failed to reset daily limit:', error.response?.data?.error || error.message);
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 Email API testing completed!');
    console.log('📧 Mailgun Integration API is ready for use');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

// Helper function to test with actual auth token
async function getAuthToken() {
  try {
    // Replace with actual login credentials
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'password123'
    });
    return loginResponse.data.token;
  } catch (error) {
    console.error('Failed to get auth token:', error.response?.data || error.message);
    return null;
  }
}

// Run tests
if (require.main === module) {
  testEmailAPI().catch(console.error);
}

module.exports = { testEmailAPI }; 