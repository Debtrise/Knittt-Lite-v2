const axios = require('axios');
const colors = require('colors');

// Configuration
const BASE_URL = 'http://34.122.156.88:3001';
const API_BASE = `${BASE_URL}/api`;
const OPTISIGNS_BASE = `${API_BASE}/optisigns`;

// Test credentials
const TEST_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

class OptisignsWorkingEndpointsTester {
  constructor() {
    this.jwtToken = null;
    this.results = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString().substring(11, 19);
    const prefix = `[${timestamp}]`;
    
    switch (type) {
      case 'success':
        console.log(`${prefix} ✅ ${message}`.green);
        break;
      case 'error':
        console.log(`${prefix} ❌ ${message}`.red);
        break;
      case 'warning':
        console.log(`${prefix} ⚠️  ${message}`.yellow);
        break;
      case 'info':
        console.log(`${prefix} ℹ️  ${message}`.blue);
        break;
      case 'section':
        console.log(`\n${prefix} 🔸 ${message}`.cyan.bold);
        break;
      default:
        console.log(`${prefix} ${message}`);
    }
  }

  async authenticate() {
    try {
      this.log('Authenticating...', 'info');
      
      const response = await axios.post(`${API_BASE}/login`, TEST_CREDENTIALS, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.data && response.data.token) {
        this.jwtToken = response.data.token;
        this.log('Authentication successful', 'success');
        return true;
      } else {
        this.log('Authentication failed: No token in response', 'error');
        return false;
      }
    } catch (error) {
      this.log(`Authentication failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testWorkingEndpoint(name, method, url) {
    try {
      const config = {
        method: method.toLowerCase(),
        url: url,
        headers: {
          'Authorization': `Bearer ${this.jwtToken}`,
          'Content-Type': 'application/json'
        }
      };

      const response = await axios(config);
      
      this.results.push({
        name,
        status: 'SUCCESS',
        httpStatus: response.status,
        data: response.data,
        dataType: Array.isArray(response.data) ? 'array' : typeof response.data,
        dataSize: Array.isArray(response.data) ? response.data.length : 
                  (typeof response.data === 'object' ? Object.keys(response.data).length : 1)
      });

      this.log(`${name}: ✓ (${response.status})`, 'success');
      
      // Show data summary
      if (Array.isArray(response.data)) {
        console.log(`   📊 Array with ${response.data.length} items`.gray);
        if (response.data.length > 0) {
          console.log(`   📋 Sample item keys: ${Object.keys(response.data[0]).join(', ')}`.gray);
        }
      } else if (typeof response.data === 'object' && response.data !== null) {
        console.log(`   📊 Object with keys: ${Object.keys(response.data).join(', ')}`.gray);
      }
      
      return true;
    } catch (error) {
      this.log(`${name}: ✗ (${error.response?.status || 'Error'})`, 'error');
      this.results.push({
        name,
        status: 'FAILED',
        error: error.message
      });
      return false;
    }
  }

  async runWorkingEndpointsTest() {
    console.log('🎯 Optisigns API - Working Endpoints Test'.cyan.bold);
    console.log('═'.repeat(60).cyan);

    // Step 1: Authentication
    if (!(await this.authenticate())) {
      this.log('Cannot proceed without authentication', 'error');
      return;
    }

    this.log('Testing Working Endpoints', 'section');

    // Test only the endpoints we know work
    const workingEndpoints = [
      {
        name: 'Get Configuration',
        method: 'GET',
        url: `${OPTISIGNS_BASE}/config`,
        description: 'Current Optisigns integration settings'
      },
      {
        name: 'Get Displays',
        method: 'GET',
        url: `${OPTISIGNS_BASE}/displays`,
        description: 'List of synced displays'
      },
      {
        name: 'Get Content',
        method: 'GET',
        url: `${OPTISIGNS_BASE}/content`,
        description: 'List of created content'
      },
      {
        name: 'Get Analytics',
        method: 'GET',
        url: `${OPTISIGNS_BASE}/analytics`,
        description: 'Analytics data for displays and content'
      },
      {
        name: 'Get Analytics (Date Range)',
        method: 'GET',
        url: `${OPTISIGNS_BASE}/analytics?startDate=2024-12-01&endDate=2024-12-20`,
        description: 'Analytics data with date filtering'
      }
    ];

    console.log(`\n📋 Testing ${workingEndpoints.length} working endpoints...\n`.blue);

    for (const endpoint of workingEndpoints) {
      await this.testWorkingEndpoint(endpoint.name, endpoint.method, endpoint.url);
    }

    this.printSummary();
    this.printRecommendations();
  }

  printSummary() {
    console.log('\n' + '═'.repeat(60).cyan);
    console.log('📊 WORKING ENDPOINTS SUMMARY'.cyan.bold);
    console.log('═'.repeat(60).cyan);

    const working = this.results.filter(r => r.status === 'SUCCESS');
    const failed = this.results.filter(r => r.status === 'FAILED');

    console.log(`\n✅ Working: ${working.length}`.green);
    console.log(`❌ Failed: ${failed.length}`.red);
    console.log(`📈 Success Rate: ${((working.length / this.results.length) * 100).toFixed(1)}%`);

    if (working.length > 0) {
      console.log('\n📋 WORKING ENDPOINTS DETAILS:'.green.bold);
      working.forEach((result, index) => {
        console.log(`\n${index + 1}. ✅ ${result.name}`.green);
        console.log(`   Status: ${result.httpStatus}`.gray);
        console.log(`   Data Type: ${result.dataType}`.gray);
        if (result.dataType === 'array') {
          console.log(`   Items: ${result.dataSize}`.gray);
        } else if (result.dataType === 'object') {
          console.log(`   Properties: ${result.dataSize}`.gray);
        }
        
        // Show actual data for configuration
        if (result.name === 'Get Configuration') {
          console.log('   📄 Configuration:'.blue);
          console.log(`      API Token: ${result.data.apiToken}`.gray);
          console.log(`      Auto Sync: ${result.data.settings.autoSync}`.gray);
          console.log(`      Sync Interval: ${result.data.settings.syncInterval}s`.gray);
          console.log(`      Is Active: ${result.data.isActive}`.gray);
          console.log(`      Last Validated: ${result.data.lastValidated}`.gray);
        }
        
        // Show analytics data
        if (result.name.includes('Analytics')) {
          console.log('   📊 Analytics Data:'.blue);
          console.log(`      Total Displays: ${result.data.totalDisplays}`.gray);
          console.log(`      Total Content: ${result.data.totalContent}`.gray);
          console.log(`      Total Impressions: ${result.data.totalImpressions}`.gray);
          console.log(`      Recent Activity: ${result.data.recentActivity.length} items`.gray);
        }
      });
    }

    if (failed.length > 0) {
      console.log('\n❌ FAILED ENDPOINTS:'.red.bold);
      failed.forEach((result, index) => {
        console.log(`${index + 1}. ❌ ${result.name}: ${result.error}`.red);
      });
    }
  }

  printRecommendations() {
    console.log('\n🎯 INTEGRATION STATUS & RECOMMENDATIONS'.yellow.bold);
    console.log('─'.repeat(50).yellow);

    const working = this.results.filter(r => r.status === 'SUCCESS');
    const configResult = working.find(r => r.name === 'Get Configuration');
    const displaysResult = working.find(r => r.name === 'Get Displays');
    const contentResult = working.find(r => r.name === 'Get Content');
    const analyticsResult = working.find(r => r.name === 'Get Analytics');

    console.log('\n📊 CURRENT STATE:'.blue.bold);
    
    if (configResult) {
      const config = configResult.data;
      console.log(`✅ Configuration: ${config.isActive ? 'Active' : 'Inactive'}`.green);
      console.log(`   • API Token: ${config.apiToken}`.gray);
      console.log(`   • Auto Sync: ${config.settings.autoSync ? 'Enabled' : 'Disabled'}`.gray);
      console.log(`   • Last Validated: ${new Date(config.lastValidated).toLocaleString()}`.gray);
    }

    if (displaysResult) {
      console.log(`📺 Displays: ${displaysResult.dataSize} synced`.blue);
      if (displaysResult.dataSize === 0) {
        console.log(`   ⚠️  No displays synced yet`.yellow);
      }
    }

    if (contentResult) {
      console.log(`📝 Content: ${contentResult.dataSize} items created`.blue);
      if (contentResult.dataSize === 0) {
        console.log(`   ⚠️  No content created yet`.yellow);
      }
    }

    if (analyticsResult) {
      const analytics = analyticsResult.data;
      console.log(`📊 Analytics:`.blue);
      console.log(`   • Total Displays: ${analytics.totalDisplays}`.gray);
      console.log(`   • Total Content: ${analytics.totalContent}`.gray);
      console.log(`   • Total Impressions: ${analytics.totalImpressions}`.gray);
    }

    console.log('\n🚨 KNOWN ISSUES:'.red.bold);
    console.log('❌ GraphQL API Connection: 404 errors when connecting to Optisigns'.red);
    console.log('❌ Content Creation: POST /api/optisigns/content endpoint missing'.red);
    console.log('❌ Display Sync: Cannot sync displays from Optisigns API'.red);
    console.log('❌ Webhook Rules: Endpoints not implemented'.red);
    console.log('❌ Debug Tools: Connectivity testing endpoints missing'.red);

    console.log('\n🔧 IMMEDIATE FIXES NEEDED:'.yellow.bold);
    console.log('1. Fix Optisigns GraphQL API connection (404 errors)'.yellow);
    console.log('2. Implement POST /api/optisigns/content endpoint'.yellow);
    console.log('3. Fix display sync functionality'.yellow);
    console.log('4. Add webhook rules endpoints'.yellow);
    console.log('5. Implement debug/connectivity endpoints'.yellow);

    console.log('\n✅ WHAT\'S WORKING:'.green.bold);
    console.log('• Configuration management (read-only)'.green);
    console.log('• Display listing (empty but functional)'.green);
    console.log('• Content listing (empty but functional)'.green);
    console.log('• Analytics reporting (basic metrics)'.green);
    console.log('• JWT authentication'.green);

    console.log('\n🎯 NEXT STEPS:'.blue.bold);
    console.log('1. Debug Optisigns API connection issues'.blue);
    console.log('2. Test with valid Optisigns API token'.blue);
    console.log('3. Implement missing POST endpoints'.blue);
    console.log('4. Add proper error handling for external API failures'.blue);
    console.log('5. Create UI components that gracefully handle empty data'.blue);

    console.log('\n' + '═'.repeat(60).cyan);
  }
}

// Run the tests
async function main() {
  const tester = new OptisignsWorkingEndpointsTester();
  await tester.runWorkingEndpointsTest();
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = OptisignsWorkingEndpointsTester; 