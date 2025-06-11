#!/usr/bin/env node

/**
 * Real API Endpoint Test - NO MOCK DATA
 * Tests actual reporting endpoints with proper authentication
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://34.122.156.88:3001/api';
const TEST_TOKEN = process.env.TEST_TOKEN;
const TENANT_ID = process.env.TEST_TENANT_ID || '1';

if (!TEST_TOKEN) {
  console.error('❌ TEST_TOKEN environment variable is required!');
  console.log('\nUsage:');
  console.log('  TEST_TOKEN=your_jwt_token node test-real-endpoints.js');
  console.log('  TEST_TOKEN=your_jwt_token TEST_TENANT_ID=2 node test-real-endpoints.js');
  process.exit(1);
}

// Create API client with authentication
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Authorization': `Bearer ${TEST_TOKEN}`,
    'Content-Type': 'application/json',
    'X-Tenant-ID': TENANT_ID
  }
});

class RealAPITester {
  constructor() {
    this.results = [];
  }

  async testEndpoint(name, method, endpoint, data = null, params = null) {
    const startTime = Date.now();
    console.log(`\n🧪 Testing ${name}...`);
    console.log(`   ${method.toUpperCase()} ${endpoint}`);
    
    if (data) {
      console.log(`   📝 Request Body:`, JSON.stringify(data, null, 2));
    }
    if (params) {
      console.log(`   🔍 Query Params:`, JSON.stringify(params, null, 2));
    }

    try {
      let response;
      
      switch (method.toLowerCase()) {
        case 'get':
          response = await api.get(endpoint, { params });
          break;
        case 'post':
          response = await api.post(endpoint, data, { params });
          break;
        case 'put':
          response = await api.put(endpoint, data, { params });
          break;
        case 'delete':
          response = await api.delete(endpoint, { data, params });
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }

      const duration = Date.now() - startTime;
      
      console.log(`   ✅ SUCCESS (${duration}ms)`);
      console.log(`   📊 Status: ${response.status}`);
      console.log(`   📈 Response Headers:`, Object.keys(response.headers).slice(0, 3).join(', '));
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          console.log(`   📋 Data: Array with ${response.data.length} items`);
          if (response.data.length > 0) {
            console.log(`   🔍 Sample keys: ${Object.keys(response.data[0]).join(', ')}`);
          }
        } else if (typeof response.data === 'object') {
          console.log(`   📋 Data keys: ${Object.keys(response.data).join(', ')}`);
          
          // Show sample of important data
          if (response.data.summary) {
            console.log(`   📊 Summary:`, JSON.stringify(response.data.summary, null, 2));
          }
          if (response.data.sourcePerformance && response.data.sourcePerformance.length > 0) {
            console.log(`   🎯 First Source:`, JSON.stringify(response.data.sourcePerformance[0], null, 2));
          }
        }
      }

      this.results.push({
        name,
        method,
        endpoint,
        status: 'SUCCESS',
        duration,
        statusCode: response.status,
        responseSize: JSON.stringify(response.data).length
      });

      return response.data;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      console.log(`   ❌ FAILED (${duration}ms)`);
      console.log(`   💥 Error: ${error.message}`);
      
      if (error.response) {
        console.log(`   📊 Status: ${error.response.status} (${error.response.statusText})`);
        console.log(`   📋 Error Response:`, JSON.stringify(error.response.data, null, 2));
        
        // Log headers for debugging
        console.log(`   📈 Response Headers:`, Object.keys(error.response.headers).join(', '));
      } else if (error.request) {
        console.log(`   🌐 Network Error - No response received`);
        console.log(`   🔗 Request URL: ${error.config?.baseURL}${error.config?.url}`);
      }

      this.results.push({
        name,
        method,
        endpoint,
        status: 'FAILED',
        duration,
        error: error.message,
        statusCode: error.response?.status || 'NO_RESPONSE',
        errorData: error.response?.data
      });

      // Re-throw to stop execution on critical failures
      throw error;
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 REAL API ENDPOINT TEST RESULTS');
    console.log('='.repeat(80));

    const successful = this.results.filter(r => r.status === 'SUCCESS');
    const failed = this.results.filter(r => r.status === 'FAILED');

    console.log(`\n✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    console.log(`📈 Success Rate: ${((successful.length / this.results.length) * 100).toFixed(1)}%`);

    if (successful.length > 0) {
      console.log('\n✅ SUCCESSFUL ENDPOINTS:');
      successful.forEach(test => {
        console.log(`   • ${test.name}`);
        console.log(`     ${test.method.toUpperCase()} ${test.endpoint} (${test.duration}ms, ${test.responseSize} bytes)`);
      });
    }

    if (failed.length > 0) {
      console.log('\n❌ FAILED ENDPOINTS:');
      failed.forEach(test => {
        console.log(`   • ${test.name}`);
        console.log(`     ${test.method.toUpperCase()} ${test.endpoint}`);
        console.log(`     Status: ${test.statusCode}, Error: ${test.error}`);
      });
    }
  }
}

async function testRealEndpoints() {
  console.log('🚀 REAL API ENDPOINT TESTING - NO MOCK DATA');
  console.log(`📍 API Base URL: ${API_BASE_URL}`);
  console.log(`🔑 Using Tenant ID: ${TENANT_ID}`);
  console.log(`🔐 Auth Token: ${TEST_TOKEN.substring(0, 20)}...`);
  console.log(`⏰ Test started at: ${new Date().toISOString()}`);

  const tester = new RealAPITester();
  
  // Get current date ranges for testing
  const today = new Date();
  const endDate = today.toISOString().split('T')[0];
  const startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const compareEndDate = new Date(today.getTime() - 31 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const compareStartDate = new Date(today.getTime() - 61 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  console.log(`\n📅 Date Ranges:`);
  console.log(`   Current: ${startDate} to ${endDate}`);
  console.log(`   Compare: ${compareStartDate} to ${compareEndDate}`);

  try {
    // Test 1: Lead Sources Filter Endpoints
    console.log('\n' + '='.repeat(50));
    console.log('📊 LEAD SOURCE FILTER ENDPOINTS');
    console.log('='.repeat(50));

    await tester.testEndpoint(
      'Get Available Lead Sources',
      'GET',
      '/lead-sources'
    );

    await tester.testEndpoint(
      'Get Available Lead Tags',
      'GET',
      '/lead-tags'
    );

    // Get actual sources for subsequent tests
    const sourcesData = await tester.testEndpoint(
      'Get Lead Sources for Testing',
      'GET',
      '/lead-sources'
    );
    
    const availableSources = sourcesData && Array.isArray(sourcesData) 
      ? sourcesData.slice(0, 3).map(s => s.source) 
      : ['website', 'facebook'];

    console.log(`\n🎯 Using sources for testing: ${availableSources.join(', ')}`);

    // Test 2: New Lead Source Reporting Endpoints
    console.log('\n' + '='.repeat(50));
    console.log('🆕 NEW LEAD SOURCE REPORTING ENDPOINTS');
    console.log('='.repeat(50));

    await tester.testEndpoint(
      'Generate Lead Source Performance Report',
      'POST',
      '/reports/lead-source-performance',
      {
        startDate,
        endDate,
        sources: availableSources,
        groupBy: 'day',
        closedTag: 'closed',
        contactedStatuses: ['contacted', 'transferred']
      }
    );

    await tester.testEndpoint(
      'Generate Lead Source Comparison Report',
      'POST',
      '/reports/lead-source-comparison',
      {
        startDate,
        endDate,
        compareStartDate,
        compareEndDate,
        sources: availableSources,
        closedTag: 'closed',
        contactedStatuses: ['contacted', 'transferred']
      }
    );

    await tester.testEndpoint(
      'Get Lead Summary Metrics',
      'GET',
      '/metrics/lead-summary',
      null,
      {
        startDate,
        endDate,
        sources: availableSources.join(','),
        closedTag: 'closed'
      }
    );

    await tester.testEndpoint(
      'Get Lead Trends',
      'POST',
      '/reports/lead-trends',
      {
        period: '30days',
        sources: availableSources,
        closedTag: 'closed',
        contactedStatuses: ['contacted', 'transferred']
      }
    );

    await tester.testEndpoint(
      'Get Real-time Lead Metrics',
      'GET',
      '/metrics/real-time-leads'
    );

    // Test single source performance if we have sources
    if (availableSources.length > 0) {
      const testSource = encodeURIComponent(availableSources[0]);
      await tester.testEndpoint(
        'Get Single Source Performance',
        'GET',
        `/reports/lead-source/${testSource}/performance`,
        null,
        {
          startDate,
          endDate,
          groupBy: 'day',
          closedTag: 'closed'
        }
      );
    }

    // Test 3: Existing Reporting Endpoints
    console.log('\n' + '='.repeat(50));
    console.log('📈 EXISTING REPORTING ENDPOINTS');
    console.log('='.repeat(50));

    await tester.testEndpoint(
      'Get Dashboard Stats',
      'GET',
      '/dashboard/stats'
    );

    await tester.testEndpoint(
      'Get Dashboard History',
      'GET',
      '/dashboard/history',
      null,
      { hours: 24 }
    );

    await tester.testEndpoint(
      'Generate Call Summary Report',
      'POST',
      '/reports/call-summary',
      {
        startDate,
        endDate,
        groupBy: 'day',
        filters: {}
      }
    );

    await tester.testEndpoint(
      'Generate SMS Summary Report',
      'POST',
      '/reports/sms-summary',
      {
        startDate,
        endDate,
        groupBy: 'day',
        filters: {}
      }
    );

    await tester.testEndpoint(
      'Generate Agent Performance Report',
      'POST',
      '/reports/agent-performance',
      {
        startDate,
        endDate,
        agentIds: []
      }
    );

    // Test 4: System Status Endpoints
    console.log('\n' + '='.repeat(50));
    console.log('🔧 SYSTEM STATUS ENDPOINTS');
    console.log('='.repeat(50));

    await tester.testEndpoint(
      'Get Module Status',
      'GET',
      '/system/module-status'
    );

    await tester.testEndpoint(
      'Get Dialplan Capabilities',
      'GET',
      '/system/dialplan-capabilities'
    );

  } catch (error) {
    console.log(`\n💥 Test sequence stopped due to error: ${error.message}`);
    console.log(`   This indicates a critical API issue that needs to be resolved.`);
  }

  // Print final summary
  tester.printSummary();

  console.log('\n' + '='.repeat(80));
  console.log('🏁 REAL ENDPOINT TESTING COMPLETED');
  console.log(`⏰ Test finished at: ${new Date().toISOString()}`);
  console.log('='.repeat(80));

  // Exit with error code if any tests failed
  const failedCount = tester.results.filter(r => r.status === 'FAILED').length;
  if (failedCount > 0) {
    console.log(`\n❌ ${failedCount} endpoint(s) failed - check your API implementation!`);
    process.exit(1);
  } else {
    console.log(`\n✅ All endpoints working correctly!`);
  }
}

if (require.main === module) {
  testRealEndpoints().catch(error => {
    console.error('\n💥 Test execution failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  });
}

module.exports = { testRealEndpoints, RealAPITester }; 