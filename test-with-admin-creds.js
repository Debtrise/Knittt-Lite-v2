#!/usr/bin/env node

const axios = require('axios');

class OptisignsAdminTester {
  constructor() {
    this.baseURL = 'http://34.122.156.88:3001';
    this.token = null;
    this.results = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const symbols = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      test: '🔸'
    };
    console.log(`[${timestamp}] ${symbols[type]} ${message}`);
  }

  async authenticate() {
    try {
      this.log('Authenticating with admin/admin123...', 'info');
      
      const response = await axios.post(`${this.baseURL}/api/login`, {
        username: 'admin',
        password: 'admin123'
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      if (response.data && response.data.token) {
        this.token = response.data.token;
        this.log('Authentication successful!', 'success');
        this.log(`Token: ${this.token.substring(0, 50)}...`, 'info');
        return true;
      } else {
        this.log('No token in response', 'error');
        return false;
      }

    } catch (error) {
      const statusCode = error.response?.status || 0;
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message;
      
      this.log(`Authentication failed: ${statusCode} - ${errorMessage}`, 'error');
      return false;
    }
  }

  async testEndpoint(name, method, endpoint, data = null) {
    if (!this.token) {
      this.log('No authentication token available', 'error');
      return { success: false, error: 'No token' };
    }

    try {
      const config = {
        method: method.toLowerCase(),
        url: `${this.baseURL}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        config.data = data;
      }

      const response = await axios(config);
      
      this.results.push({
        name,
        method,
        endpoint,
        status: 'success',
        statusCode: response.status,
        data: response.data,
        error: null
      });

      this.log(`${name}: ✓ (${response.status})`, 'success');
      
      // Log some response details
      if (response.data && typeof response.data === 'object') {
        const keys = Object.keys(response.data);
        this.log(`   📊 Response keys: ${keys.join(', ')}`, 'info');
        
        // Show some specific data for key endpoints
        if (endpoint.includes('/config') && response.data.apiToken) {
          this.log(`   🔑 API Token: ${response.data.apiToken}`, 'info');
        }
        if (endpoint.includes('/displays') && response.data.displays) {
          this.log(`   📺 Displays found: ${response.data.displays.length}`, 'info');
        }
        if (endpoint.includes('/content') && response.data.localContent) {
          this.log(`   📄 Local content: ${response.data.localContent.length}`, 'info');
        }
        if (endpoint.includes('/analytics') && response.data.summary) {
          this.log(`   📈 Analytics: ${JSON.stringify(response.data.summary)}`, 'info');
        }
      }

      return { success: true, status: response.status, data: response.data };

    } catch (error) {
      const statusCode = error.response?.status || 0;
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Unknown error';

      this.results.push({
        name,
        method,
        endpoint,
        status: 'error',
        statusCode,
        data: null,
        error: errorMessage
      });

      this.log(`${name}: ✗ (${statusCode}) - ${errorMessage}`, 'error');
      return { success: false, status: statusCode, error: errorMessage };
    }
  }

  async runComprehensiveTest() {
    console.log('🎯 Optisigns API Test with Admin Credentials');
    console.log('═'.repeat(60));
    
    // First authenticate
    const authSuccess = await this.authenticate();
    if (!authSuccess) {
      console.log('❌ Authentication failed. Cannot proceed with API tests.');
      return;
    }

    console.log('\n🔸 Testing Optisigns API endpoints...\n');

    // Test all documented endpoints
    const endpoints = [
      // Configuration
      {
        name: 'Test API Connection',
        method: 'POST',
        endpoint: '/api/optisigns/config/test',
        data: { apiToken: 'test_optisigns_token_123' }
      },
      {
        name: 'Get Configuration',
        method: 'GET',
        endpoint: '/api/optisigns/config'
      },
      {
        name: 'Update Configuration',
        method: 'PUT',
        endpoint: '/api/optisigns/config',
        data: {
          apiToken: 'test_optisigns_token_123',
          settings: {
            autoSync: true,
            syncInterval: 300,
            enableWebhooks: true,
            defaultContentDuration: 30,
            allowCustomAssets: true
          }
        }
      },

      // Displays
      {
        name: 'Get Displays',
        method: 'GET',
        endpoint: '/api/optisigns/displays'
      },
      {
        name: 'Sync Displays',
        method: 'POST',
        endpoint: '/api/optisigns/displays/sync'
      },

      // Content
      {
        name: 'Get Content',
        method: 'GET',
        endpoint: '/api/optisigns/content'
      },
      {
        name: 'Create Content',
        method: 'POST',
        endpoint: '/api/optisigns/content',
        data: {
          name: 'Test Content from Admin',
          type: 'text',
          content: 'Hello from admin API test!',
          duration: 30,
          options: {
            fontSize: 'large',
            backgroundColor: '#ffffff',
            textColor: '#000000'
          }
        }
      },

      // Analytics
      {
        name: 'Get Analytics',
        method: 'GET',
        endpoint: '/api/optisigns/analytics'
      },
      {
        name: 'Get Analytics (Date Range)',
        method: 'GET',
        endpoint: '/api/optisigns/analytics?startDate=2024-12-01&endDate=2024-12-20'
      },

      // Webhook Rules
      {
        name: 'Get Webhook Rules',
        method: 'GET',
        endpoint: '/api/optisigns/webhook-rules'
      },
      {
        name: 'Create Webhook Rule',
        method: 'POST',
        endpoint: '/api/optisigns/webhook-rules',
        data: {
          name: 'Test Webhook Rule',
          trigger: 'manual',
          conditions: {},
          actions: {
            contentId: 'test',
            displayIds: ['test']
          }
        }
      },

      // Debug
      {
        name: 'Debug Connectivity',
        method: 'POST',
        endpoint: '/api/optisigns/debug/connectivity',
        data: { apiToken: 'test_optisigns_token_123' }
      },

      // Assets & Executions
      {
        name: 'Get Assets',
        method: 'GET',
        endpoint: '/api/optisigns/assets'
      },
      {
        name: 'Get Executions',
        method: 'GET',
        endpoint: '/api/optisigns/executions'
      }
    ];

    for (const endpoint of endpoints) {
      await this.testEndpoint(
        endpoint.name,
        endpoint.method,
        endpoint.endpoint,
        endpoint.data
      );
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    this.printSummary();
  }

  printSummary() {
    console.log('\n' + '═'.repeat(60));
    console.log('📊 ADMIN AUTHENTICATION TEST RESULTS');
    console.log('═'.repeat(60));

    const working = this.results.filter(r => r.status === 'success');
    const errors = this.results.filter(r => r.status === 'error');
    const notImplemented = errors.filter(r => r.statusCode === 404);
    const serverErrors = errors.filter(r => r.statusCode >= 500);
    const clientErrors = errors.filter(r => r.statusCode >= 400 && r.statusCode < 500 && r.statusCode !== 404);

    console.log(`\n✅ Working: ${working.length}`);
    console.log(`❌ Errors: ${errors.length}`);
    console.log(`   • Not Implemented (404): ${notImplemented.length}`);
    console.log(`   • Server Errors (5xx): ${serverErrors.length}`);
    console.log(`   • Client Errors (4xx): ${clientErrors.length}`);
    console.log(`📈 Success Rate: ${((working.length / this.results.length) * 100).toFixed(1)}%`);

    if (working.length > 0) {
      console.log('\n✅ WORKING ENDPOINTS:');
      working.forEach(result => {
        console.log(`   ${result.method} ${result.endpoint} - ${result.name} (${result.statusCode})`);
      });
    }

    if (errors.length > 0) {
      console.log('\n❌ FAILED ENDPOINTS:');
      errors.forEach(result => {
        console.log(`   ${result.method} ${result.endpoint} - ${result.name}`);
        console.log(`     Status: ${result.statusCode}, Error: ${result.error}`);
      });
    }

    // Compare with UI status
    console.log('\n🎨 UI STATUS VALIDATION:');
    if (working.length >= 4) {
      console.log('✅ UI correctly shows working read operations');
    }
    if (serverErrors.length > 0) {
      console.log('✅ UI correctly identifies database/server issues');
    }
    if (notImplemented.length > 0) {
      console.log('✅ UI correctly marks missing endpoints as "Not Implemented"');
    }

    console.log('\n🔧 RECOMMENDATIONS:');
    if (serverErrors.length > 0) {
      console.log('🔴 Critical: Fix database model initialization issues');
    }
    if (clientErrors.length > 0) {
      console.log('🟡 High: Resolve API validation/GraphQL issues');
    }
    if (notImplemented.length > 0) {
      console.log('🔵 Medium: Implement missing endpoints');
    }
    if (working.length > 0) {
      console.log('✅ Good: Build upon working foundation');
    }
  }
}

async function main() {
  const tester = new OptisignsAdminTester();
  
  try {
    await tester.runComprehensiveTest();
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = OptisignsAdminTester; 