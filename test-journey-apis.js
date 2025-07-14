#!/usr/bin/env node

/**
 * Journey APIs Test Script
 * 
 * This script comprehensively tests all journey-related API endpoints
 * to verify functionality and backend connectivity at 34.122.156.88:3001
 */

const axios = require('axios');
const readline = require('readline');

// Configuration
const API_BASE_URL = 'http://34.122.156.88:3001/api';
const TEST_CONFIG = {
  timeout: 30000,
  retries: 3
};

// Test credentials
const TEST_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

// Global variables
let authToken = null;
let testJourneyId = null;
let testStepId = null;
let testLeadId = null;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: TEST_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for auth
api.interceptors.request.use(config => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// Utility functions
const log = {
  info: (msg) => console.log(`\n🔍 ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  warning: (msg) => console.log(`⚠️  ${msg}`),
  section: (msg) => console.log(`\n${'='.repeat(80)}\n🧪 ${msg}\n${'='.repeat(80)}`)
};

// Test result tracking
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

// Test helper function
async function runTest(testName, testFunction) {
  log.info(`Testing: ${testName}`);
  try {
    const result = await testFunction();
    testResults.passed++;
    testResults.tests.push({ name: testName, status: 'PASS', result });
    log.success(`${testName} - PASSED`);
    return result;
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name: testName, status: 'FAIL', error: error.message });
    log.error(`${testName} - FAILED: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    throw error;
  }
}

// Authentication
async function authenticate() {
  log.section('AUTHENTICATION');
  
  return runTest('User Authentication', async () => {
    const response = await api.post('/login', TEST_CREDENTIALS);
    
    if (!response.data.token) {
      throw new Error('No token received from authentication');
    }
    
    authToken = response.data.token;
    log.success(`Token obtained: ${authToken.substring(0, 50)}...`);
    
    return {
      token: authToken,
      userId: response.data.userId,
      username: response.data.username,
      role: response.data.role
    };
  });
}

// Journey Management Tests
async function testJourneyManagement() {
  log.section('JOURNEY MANAGEMENT TESTS');
  
  // Test 1: List Journeys
  const journeysData = await runTest('List Journeys', async () => {
    const response = await api.get('/journeys', {
      params: { page: 1, limit: 10 }
    });
    
    log.info(`Found ${response.data.journeys?.length || 0} journeys`);
    return response.data;
  });
  
  // Test 2: Create Journey
  const journeyData = await runTest('Create Journey', async () => {
    const newJourney = {
      name: `Test Journey ${Date.now()}`,
      description: 'Automated test journey for API validation',
      isActive: true,
      triggerCriteria: {
        leadStatus: ['pending', 'new'],
        leadTags: ['test'],
        leadAgeDays: { min: 0, max: 30 },
        brands: ['test-brand'],
        sources: ['test-source'],
        autoEnroll: false
      }
    };
    
    const response = await api.post('/journeys', newJourney);
    testJourneyId = response.data.id;
    
    log.success(`Created journey with ID: ${testJourneyId}`);
    return response.data;
  });
  
  // Test 3: Get Journey Details
  await runTest('Get Journey Details', async () => {
    const response = await api.get(`/journeys/${testJourneyId}`);
    
    if (response.data.name !== journeyData.name) {
      throw new Error('Journey name mismatch');
    }
    
    log.success(`Retrieved journey: ${response.data.name}`);
    return response.data;
  });
  
  // Test 4: Update Journey
  await runTest('Update Journey', async () => {
    const updates = {
      description: 'Updated description for API test',
      isActive: false,
      triggerCriteria: {
        ...journeyData.triggerCriteria,
        autoEnroll: true
      }
    };
    
    const response = await api.put(`/journeys/${testJourneyId}`, updates);
    
    if (response.data.description !== updates.description) {
      throw new Error('Journey update failed');
    }
    
    log.success('Journey updated successfully');
    return response.data;
  });
}

// Journey Steps Tests
async function testJourneySteps() {
  log.section('JOURNEY STEPS TESTS');
  
  // Test 1: List Journey Steps (should be empty initially)
  await runTest('List Journey Steps', async () => {
    const response = await api.get(`/journeys/${testJourneyId}/steps`);
    
    log.info(`Found ${response.data.length || 0} steps in journey`);
    return response.data;
  });
  
  // Test 2: Create Call Step
  const callStep = await runTest('Create Call Step', async () => {
    const stepData = {
      name: 'Initial Call',
      description: 'First call attempt to the lead',
      stepOrder: 10,
      actionType: 'call',
      actionConfig: {
        transferGroup: 'sales',
        maxAttempts: 3,
        dialTimeout: 30
      },
      delayType: 'immediate',
      delayConfig: {},
      conditions: {
        leadStatus: ['pending']
      },
      isActive: true,
      isExitPoint: false,
      position: { x: 456, y: 80 }
    };
    
    const response = await api.post(`/journeys/${testJourneyId}/steps`, stepData);
    testStepId = response.data.id;
    
    log.success(`Created call step with ID: ${testStepId}`);
    return response.data;
  });
  
  // Test 3: Create SMS Step
  await runTest('Create SMS Step', async () => {
    const stepData = {
      name: 'Follow-up SMS',
      description: 'SMS follow-up after call attempt',
      stepOrder: 20,
      actionType: 'sms',
      actionConfig: {
        message: 'Hi {{firstName}}, we tried to reach you. Please call us back.',
        fromNumber: '+1234567890'
      },
      delayType: 'delay_after_previous',
      delayConfig: {
        delayMinutes: 60
      },
      conditions: {},
      isActive: true,
      isExitPoint: false,
      position: { x: 456, y: 280 }
    };
    
    const response = await api.post(`/journeys/${testJourneyId}/steps`, stepData);
    
    log.success(`Created SMS step with ID: ${response.data.id}`);
    return response.data;
  });
  
  // Test 4: Create Email Step
  await runTest('Create Email Step', async () => {
    const stepData = {
      name: 'Email Follow-up',
      description: 'Email follow-up after SMS',
      stepOrder: 30,
      actionType: 'email',
      actionConfig: {
        subject: 'Follow-up from {{companyName}}',
        templateId: 'default-followup'
      },
      delayType: 'delay_after_previous',
      delayConfig: {
        delayHours: 24
      },
      conditions: {},
      isActive: true,
      isExitPoint: false,
      position: { x: 456, y: 480 }
    };
    
    const response = await api.post(`/journeys/${testJourneyId}/steps`, stepData);
    
    log.success(`Created email step with ID: ${response.data.id}`);
    return response.data;
  });
  
  // Test 5: Create End Step
  await runTest('Create End Step', async () => {
    const stepData = {
      name: 'End',
      description: 'Journey completion point',
      stepOrder: 40,
      actionType: 'delay',
      actionConfig: {},
      delayType: 'immediate',
      delayConfig: {},
      conditions: {},
      isActive: true,
      isExitPoint: true,
      position: { x: 456, y: 680 }
    };
    
    const response = await api.post(`/journeys/${testJourneyId}/steps`, stepData);
    
    log.success(`Created end step with ID: ${response.data.id}`);
    return response.data;
  });
  
  // Test 6: Update Step
  await runTest('Update Journey Step', async () => {
    const updates = {
      name: 'Updated Initial Call',
      description: 'Updated description for initial call',
      actionConfig: {
        ...callStep.actionConfig,
        maxAttempts: 5
      }
    };
    
    const response = await api.put(`/journeys/${testJourneyId}/steps/${testStepId}`, updates);
    
    if (response.data.name !== updates.name) {
      throw new Error('Step update failed');
    }
    
    log.success('Step updated successfully');
    return response.data;
  });
  
  // Test 7: List Steps Again (should have all steps now)
  await runTest('List Journey Steps (After Creation)', async () => {
    const response = await api.get(`/journeys/${testJourneyId}/steps`);
    
    if (!response.data || response.data.length < 4) {
      throw new Error(`Expected at least 4 steps, got ${response.data?.length || 0}`);
    }
    
    log.success(`Found ${response.data.length} steps in journey`);
    return response.data;
  });
}

// Lead Management Tests
async function testLeadManagement() {
  log.section('LEAD MANAGEMENT TESTS');
  
  // Test 1: Create Test Lead
  const leadData = await runTest('Create Test Lead', async () => {
    const newLead = {
      phone: '+1234567890',
      name: 'Test Lead',
      email: 'test@example.com',
      brand: 'test-brand',
      source: 'test-source',
      status: 'pending',
      additionalData: {
        firstName: 'Test',
        lastName: 'Lead',
        company: 'Test Company'
      }
    };
    
    const response = await api.post('/leads', newLead);
    testLeadId = response.data.id;
    
    log.success(`Created test lead with ID: ${testLeadId}`);
    return response.data;
  });
  
  // Test 2: Get Journey Leads (should be empty initially)
  await runTest('Get Journey Leads (Empty)', async () => {
    const response = await api.get(`/journeys/${testJourneyId}/leads`, {
      params: { page: 1, limit: 10 }
    });
    
    log.info(`Found ${response.data.leads?.length || 0} leads in journey`);
    return response.data;
  });
  
  // Test 3: Enroll Lead in Journey
  await runTest('Enroll Lead in Journey', async () => {
    const response = await api.post(`/journeys/${testJourneyId}/enroll`, {
      leadIds: [testLeadId],
      restart: false
    });
    
    log.success('Lead enrolled successfully');
    return response.data;
  });
  
  // Test 4: Get Journey Leads (should have our lead now)
  await runTest('Get Journey Leads (After Enrollment)', async () => {
    const response = await api.get(`/journeys/${testJourneyId}/leads`, {
      params: { page: 1, limit: 10 }
    });
    
    if (!response.data.leads || response.data.leads.length === 0) {
      throw new Error('No leads found in journey after enrollment');
    }
    
    log.success(`Found ${response.data.leads.length} leads in journey`);
    return response.data;
  });
  
  // Test 5: Get Lead's Journeys
  await runTest('Get Lead\'s Journeys', async () => {
    const response = await api.get(`/leads/${testLeadId}/journeys`);
    
    if (!response.data || response.data.length === 0) {
      throw new Error('No journeys found for lead');
    }
    
    log.success(`Lead is in ${response.data.length} journey(s)`);
    return response.data;
  });
  
  // Test 6: Update Lead Journey Status
  await runTest('Update Lead Journey Status', async () => {
    const response = await api.put(`/leads/${testLeadId}/journeys/${testJourneyId}/status`, {
      status: 'active'
    });
    
    log.success('Lead journey status updated');
    return response.data;
  });
  
  // Test 7: Execute Journey Step
  await runTest('Execute Journey Step', async () => {
    const response = await api.post(`/leads/${testLeadId}/journeys/${testJourneyId}/execute`, {
      stepId: testStepId
    });
    
    log.success('Journey step executed');
    return response.data;
  });
}

// Journey Statistics Tests
async function testJourneyStatistics() {
  log.section('JOURNEY STATISTICS TESTS');
  
  // Test 1: Get Journey Statistics
  await runTest('Get Journey Statistics', async () => {
    const response = await api.get('/journeys/stats');
    
    log.info(`Active journeys: ${response.data.activeJourneys || 0}`);
    log.info(`Active lead journeys: ${response.data.activeLeadJourneys || 0}`);
    return response.data;
  });
  
  // Test 2: Get Journey Matching Stats
  await runTest('Get Journey Matching Stats', async () => {
    const response = await api.get(`/journeys/${testJourneyId}/matching-stats`);
    
    log.info(`Total leads: ${response.data.totalLeads || 0}`);
    log.info(`Matching leads: ${response.data.matchingLeads || 0}`);
    return response.data;
  });
  
  // Test 3: Get Journey Stats by Brand
  await runTest('Get Journey Stats by Brand', async () => {
    const response = await api.get('/stats/journeys/by-brand');
    
    log.info(`Brand stats entries: ${response.data?.length || 0}`);
    return response.data;
  });
  
  // Test 4: Get Journey Stats by Source
  await runTest('Get Journey Stats by Source', async () => {
    const response = await api.get('/stats/journeys/by-source');
    
    log.info(`Source stats entries: ${response.data?.length || 0}`);
    return response.data;
  });
  
  // Test 5: Get Upcoming Executions
  await runTest('Get Upcoming Executions', async () => {
    const response = await api.get('/executions/upcoming', {
      params: { limit: 10 }
    });
    
    log.info(`Upcoming executions: ${response.data?.length || 0}`);
    return response.data;
  });
}

// Journey Enrollment Tests
async function testJourneyEnrollment() {
  log.section('JOURNEY ENROLLMENT TESTS');
  
  // Test 1: Enroll Leads by Criteria
  await runTest('Enroll Leads by Criteria', async () => {
    const response = await api.post(`/journeys/${testJourneyId}/enroll-by-criteria`, {
      criteria: {
        brands: ['test-brand'],
        sources: ['test-source'],
        leadStatus: ['pending'],
        leadAgeDays: { min: 0, max: 30 }
      },
      restart: false,
      limit: 10
    });
    
    log.success(`Enrolled ${response.data.enrolledCount || 0} leads by criteria`);
    return response.data;
  });
  
  // Test 2: Get Auto-Enrollment Status
  await runTest('Get Auto-Enrollment Status', async () => {
    const response = await api.get('/journeys/auto-enrollment/status');
    
    log.info(`Auto-enrollment enabled: ${response.data.enabled || false}`);
    return response.data;
  });
  
  // Test 3: Test Auto-Enrollment
  await runTest('Test Auto-Enrollment', async () => {
    try {
      const response = await api.post(`/journeys/${testJourneyId}/test-auto-enrollment`, {
        dryRun: true,
        sampleSize: 5
      });
      
      log.success(`Auto-enrollment test completed`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        log.warning('Auto-enrollment test endpoint not available');
        return { message: 'Endpoint not available' };
      }
      throw error;
    }
  });
}

// Advanced Journey Tests
async function testAdvancedJourneyFeatures() {
  log.section('ADVANCED JOURNEY FEATURES');
  
  // Test 1: Generate Journey Analytics Report
  await runTest('Generate Journey Analytics Report', async () => {
    const response = await api.post('/reports/journey-analytics', {
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      journeyIds: [testJourneyId]
    });
    
    log.success('Journey analytics report generated');
    return response.data;
  });
  
  // Test 2: Get Journey Overview
  await runTest('Get Journey Overview', async () => {
    const response = await api.post('/reports/journey-overview', {
      journeyIds: [testJourneyId],
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      compareEnabled: false
    });
    
    log.success('Journey overview retrieved');
    return response.data;
  });
  
  // Test 3: Get Journey Enrollment Stats
  await runTest('Get Journey Enrollment Stats', async () => {
    const response = await api.get(`/journeys/${testJourneyId}/enrollment-stats`);
    
    log.info(`Enrollment stats retrieved`);
    return response.data;
  });
}

// Cleanup Tests
async function cleanupTestData() {
  log.section('CLEANUP TEST DATA');
  
  // Delete test step
  if (testStepId) {
    await runTest('Delete Test Step', async () => {
      const response = await api.delete(`/journeys/${testJourneyId}/steps/${testStepId}`, {
        params: { force: true }
      });
      
      log.success('Test step deleted');
      return response.data;
    });
  }
  
  // Delete test journey
  if (testJourneyId) {
    await runTest('Delete Test Journey', async () => {
      const response = await api.delete(`/journeys/${testJourneyId}`, {
        params: { force: true }
      });
      
      log.success('Test journey deleted');
      return response.data;
    });
  }
  
  // Delete test lead
  if (testLeadId) {
    await runTest('Delete Test Lead', async () => {
      const response = await api.delete(`/leads/${testLeadId}`);
      
      log.success('Test lead deleted');
      return response.data;
    });
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 JOURNEY APIS COMPREHENSIVE TEST SUITE');
  console.log('==========================================');
  console.log(`🌐 Testing Backend: ${API_BASE_URL}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  
  try {
    // Authentication
    await authenticate();
    
    // Core journey management
    await testJourneyManagement();
    
    // Journey steps
    await testJourneySteps();
    
    // Lead management
    await testLeadManagement();
    
    // Statistics
    await testJourneyStatistics();
    
    // Enrollment
    await testJourneyEnrollment();
    
    // Advanced features
    await testAdvancedJourneyFeatures();
    
    // Cleanup
    await cleanupTestData();
    
  } catch (error) {
    log.error(`Test suite failed: ${error.message}`);
  }
  
  // Print summary
  printTestSummary();
}

// Print test summary
function printTestSummary() {
  log.section('TEST SUMMARY');
  
  console.log(`📊 Total Tests: ${testResults.passed + testResults.failed}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`⚠️  Warnings: ${testResults.warnings}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(2)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.tests
      .filter(test => test.status === 'FAIL')
      .forEach(test => {
        console.log(`   • ${test.name}: ${test.error}`);
      });
  }
  
  console.log('\n🏁 TEST SUITE COMPLETED');
  console.log(`⏰ Finished at: ${new Date().toISOString()}`);
  console.log('==========================================');
}

// Handle script execution
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testResults
}; 