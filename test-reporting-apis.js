#!/usr/bin/env node

/**
 * Comprehensive Reporting API Test Script
 * Tests all reporting endpoints including the new Lead Source Reporting API
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://34.122.156.88:3001/api';
const TEST_TOKEN = process.env.TEST_TOKEN || 'your-test-jwt-token-here';
const TENANT_ID = process.env.TEST_TENANT_ID || '1';

// Test utilities
class APITester {
  constructor(baseURL, token, tenantId) {
    this.baseURL = baseURL;
    this.token = token;
    this.tenantId = tenantId;
    this.results = [];
    
    // Create axios instance
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        'X-Tenant-ID': this.tenantId
      }
    });
  }

  async testEndpoint(name, method, endpoint, data = null, params = null) {
    const startTime = Date.now();
    try {
      console.log(`\n🧪 Testing ${name}...`);
      console.log(`   ${method.toUpperCase()} ${endpoint}`);
      
      if (data) {
        console.log(`   Body:`, JSON.stringify(data, null, 2));
      }
      if (params) {
        console.log(`   Params:`, JSON.stringify(params, null, 2));
      }

      let response;
      switch (method.toLowerCase()) {
        case 'get':
          response = await this.api.get(endpoint, { params });
          break;
        case 'post':
          response = await this.api.post(endpoint, data, { params });
          break;
        case 'put':
          response = await this.api.put(endpoint, data, { params });
          break;
        case 'delete':
          response = await this.api.delete(endpoint, { data, params });
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }

      const duration = Date.now() - startTime;
      
      console.log(`   ✅ SUCCESS (${duration}ms)`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Data keys:`, Object.keys(response.data || {}));
      
      if (response.data && typeof response.data === 'object') {
        // Show a sample of the data structure
        const sampleData = JSON.stringify(response.data, null, 2);
        if (sampleData.length > 500) {
          console.log(`   Sample:`, sampleData.substring(0, 500) + '...');
        } else {
          console.log(`   Data:`, sampleData);
        }
      }

      this.results.push({
        name,
        method,
        endpoint,
        status: 'SUCCESS',
        duration,
        statusCode: response.status,
        dataKeys: Object.keys(response.data || {})
      });

      return response.data;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      console.log(`   ❌ FAILED (${duration}ms)`);
      console.log(`   Error:`, error.message);
      
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Response:`, JSON.stringify(error.response.data, null, 2));
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

      return null;
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(80));

    const successful = this.results.filter(r => r.status === 'SUCCESS');
    const failed = this.results.filter(r => r.status === 'FAILED');

    console.log(`\n✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    console.log(`📈 Success Rate: ${((successful.length / this.results.length) * 100).toFixed(1)}%`);

    if (failed.length > 0) {
      console.log('\n❌ FAILED TESTS:');
      failed.forEach(test => {
        console.log(`   • ${test.name} (${test.method.toUpperCase()} ${test.endpoint})`);
        console.log(`     Status: ${test.statusCode}, Error: ${test.error}`);
      });
    }

    if (successful.length > 0) {
      console.log('\n✅ SUCCESSFUL TESTS:');
      successful.forEach(test => {
        console.log(`   • ${test.name} (${test.duration}ms)`);
      });
    }
  }
}

// Test date ranges
const getDateRanges = () => {
  const today = new Date();
  const endDate = today.toISOString().split('T')[0];
  const startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const compareEndDate = new Date(today.getTime() - 31 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const compareStartDate = new Date(today.getTime() - 61 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return { startDate, endDate, compareStartDate, compareEndDate };
};

// Main test function
async function runAllTests() {
  console.log('🚀 Starting Comprehensive Reporting API Tests');
  console.log(`📍 API Base URL: ${API_BASE_URL}`);
  console.log(`🔑 Using Tenant ID: ${TENANT_ID}`);
  console.log(`⏰ Test started at: ${new Date().toISOString()}`);

  const tester = new APITester(API_BASE_URL, TEST_TOKEN, TENANT_ID);
  const { startDate, endDate, compareStartDate, compareEndDate } = getDateRanges();

  console.log('\n📅 Test Date Ranges:');
  console.log(`   Current Period: ${startDate} to ${endDate}`);
  console.log(`   Compare Period: ${compareStartDate} to ${compareEndDate}`);

  // ==========================================
  // 1. NEW LEAD SOURCE REPORTING API TESTS
  // ==========================================
  
  console.log('\n' + '='.repeat(50));
  console.log('🆕 LEAD SOURCE REPORTING API TESTS');
  console.log('='.repeat(50));

  // Filter Endpoints
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

  // Get sources for subsequent tests
  const sourcesData = await tester.testEndpoint(
    'Get Lead Sources (for testing)',
    'GET',
    '/lead-sources'
  );
  
  const availableSources = sourcesData ? sourcesData.slice(0, 3).map(s => s.source) : ['website', 'facebook'];

  // Lead Source Performance Report
  await tester.testEndpoint(
    'Generate Lead Source Performance Report (Day)',
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
    'Generate Lead Source Performance Report (Week)',
    'POST',
    '/reports/lead-source-performance',
    {
      startDate,
      endDate,
      groupBy: 'week',
      closedTag: 'closed'
    }
  );

  // Lead Source Comparison Report
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

  // Quick Metrics Endpoints
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

  // Single Source Performance
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

  // Export Lead Source Report
  await tester.testEndpoint(
    'Export Lead Source Report',
    'POST',
    '/reports/lead-source-performance/export',
    {
      startDate,
      endDate,
      sources: availableSources,
      groupBy: 'day',
      closedTag: 'closed',
      contactedStatuses: ['contacted', 'transferred'],
      format: 'csv',
      filename: 'test_lead_source_report'
    }
  );

  // ==========================================
  // 2. EXISTING REPORTING API TESTS
  // ==========================================

  console.log('\n' + '='.repeat(50));
  console.log('📊 EXISTING REPORTING API TESTS');
  console.log('='.repeat(50));

  // Dashboard Stats
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

  // General Reports
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

  await tester.testEndpoint(
    'Generate Lead Conversion Report',
    'POST',
    '/reports/lead-conversion',
    {
      startDate,
      endDate,
      sources: [],
      brands: []
    }
  );

  await tester.testEndpoint(
    'Generate Journey Analytics Report',
    'POST',
    '/reports/journey-analytics',
    {
      startDate,
      endDate,
      journeyIds: []
    }
  );

  // Daily Report
  await tester.testEndpoint(
    'Get Daily Report',
    'GET',
    '/reports/daily',
    null,
    { date: endDate }
  );

  // Report Templates
  await tester.testEndpoint(
    'List Report Templates',
    'GET',
    '/report-templates'
  );

  // ==========================================
  // 3. SYSTEM & STATUS ENDPOINTS
  // ==========================================

  console.log('\n' + '='.repeat(50));
  console.log('🔧 SYSTEM & STATUS TESTS');
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

  await tester.testEndpoint(
    'Get Webhook Capabilities',
    'GET',
    '/system/webhook-capabilities'
  );

  // ==========================================
  // 4. JOURNEY REPORTING TESTS
  // ==========================================

  console.log('\n' + '='.repeat(50));
  console.log('🛤️ JOURNEY REPORTING TESTS');
  console.log('='.repeat(50));

  await tester.testEndpoint(
    'Get Journey Statistics',
    'GET',
    '/journeys/stats'
  );

  await tester.testEndpoint(
    'Get Journey Stats by Brand',
    'GET',
    '/stats/journeys/by-brand'
  );

  await tester.testEndpoint(
    'Get Journey Stats by Source',
    'GET',
    '/stats/journeys/by-source'
  );

  await tester.testEndpoint(
    'Get Upcoming Journey Executions',
    'GET',
    '/executions/upcoming',
    null,
    { limit: 10 }
  );

  // ==========================================
  // 5. METRICS AND ANALYTICS TESTS
  // ==========================================

  console.log('\n' + '='.repeat(50));
  console.log('📈 METRICS & ANALYTICS TESTS');
  console.log('='.repeat(50));

  await tester.testEndpoint(
    'Get Today Stats',
    'GET',
    '/stats/today'
  );

  await tester.testEndpoint(
    'Get Hourly Breakdown',
    'GET',
    '/stats/hourly'
  );

  // ==========================================
  // PRINT SUMMARY
  // ==========================================

  tester.printSummary();

  console.log('\n' + '='.repeat(80));
  console.log('🏁 TESTING COMPLETED');
  console.log(`⏰ Test finished at: ${new Date().toISOString()}`);
  console.log('='.repeat(80));
}

// Handle command line execution
if (require.main === module) {
  // Check if token is provided
  if (!TEST_TOKEN || TEST_TOKEN === 'your-test-jwt-token-here') {
    console.error('❌ Please set TEST_TOKEN environment variable with a valid JWT token');
    console.log('\nUsage:');
    console.log('  TEST_TOKEN=your_jwt_token node test-reporting-apis.js');
    console.log('  TEST_TOKEN=your_jwt_token TEST_TENANT_ID=2 node test-reporting-apis.js');
    process.exit(1);
  }

  runAllTests().catch(error => {
    console.error('\n💥 Test execution failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  });
}

module.exports = { APITester, runAllTests }; 