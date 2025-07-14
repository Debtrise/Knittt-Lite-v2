#!/usr/bin/env node

/**
 * Quick Journey API Test
 * Tests the most critical journey endpoints to verify functionality
 */

const axios = require('axios');

const API_BASE_URL = 'http://34.122.156.88:3001/api';
const TEST_CREDS = { username: 'admin', password: 'admin123' };

let authToken = null;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
});

// Add auth interceptor
api.interceptors.request.use(config => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

async function test(name, fn) {
  try {
    console.log(`\n🧪 ${name}...`);
    const result = await fn();
    console.log(`✅ ${name} - PASSED`);
    return result;
  } catch (error) {
    console.log(`❌ ${name} - FAILED: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    throw error;
  }
}

async function quickTest() {
  console.log('🚀 Quick Journey API Test');
  console.log('=========================');
  
  try {
    // 1. Authenticate
    const auth = await test('Authentication', async () => {
      const response = await api.post('/login', TEST_CREDS);
      authToken = response.data.token;
      return response.data;
    });
    
    // 2. List journeys
    const journeys = await test('List Journeys', async () => {
      const response = await api.get('/journeys');
      console.log(`   Found ${response.data.journeys?.length || 0} journeys`);
      return response.data;
    });
    
    // 3. Create test journey
    const journey = await test('Create Journey', async () => {
      const response = await api.post('/journeys', {
        name: `Quick Test Journey ${Date.now()}`,
        description: 'Quick API test',
        isActive: true,
        triggerCriteria: {
          leadStatus: ['pending'],
          autoEnroll: false
        }
      });
      console.log(`   Created journey ID: ${response.data.id}`);
      return response.data;
    });
    
    // 4. Get journey details
    await test('Get Journey Details', async () => {
      const response = await api.get(`/journeys/${journey.id}`);
      return response.data;
    });
    
    // 5. Create journey step
    const step = await test('Create Journey Step', async () => {
      const response = await api.post(`/journeys/${journey.id}/steps`, {
        name: 'Test Call Step',
        description: 'Test step',
        stepOrder: 10,
        actionType: 'call',
        actionConfig: { transferGroup: 'sales' },
        delayType: 'immediate',
        delayConfig: {},
        isActive: true,
        isExitPoint: false
      });
      console.log(`   Created step ID: ${response.data.id}`);
      return response.data;
    });
    
    // 6. List journey steps
    await test('List Journey Steps', async () => {
      const response = await api.get(`/journeys/${journey.id}/steps`);
      console.log(`   Found ${response.data.length} steps`);
      return response.data;
    });
    
    // 7. Get journey statistics
    await test('Get Journey Stats', async () => {
      const response = await api.get('/journeys/stats');
      return response.data;
    });
    
    // 8. Cleanup - Delete step
    await test('Delete Journey Step', async () => {
      const response = await api.delete(`/journeys/${journey.id}/steps/${step.id}?force=true`);
      return response.data;
    });
    
    // 9. Cleanup - Delete journey
    await test('Delete Journey', async () => {
      const response = await api.delete(`/journeys/${journey.id}?force=true`);
      return response.data;
    });
    
    console.log('\n✅ ALL TESTS PASSED!');
    console.log('Journey APIs are working correctly with backend at 34.122.156.88:3001');
    
  } catch (error) {
    console.log('\n❌ TEST SUITE FAILED');
    console.log('Some journey APIs may not be working correctly');
  }
}

// Run the test
quickTest(); 