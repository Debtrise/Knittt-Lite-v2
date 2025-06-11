#!/usr/bin/env node

const axios = require('axios');

// Configuration
const BASE_URL = 'http://34.122.156.88:3001/api';
const TEST_EMAIL = 'admin';
const TEST_PASSWORD = 'admin123';

// Test credentials and tokens
let authToken = null;

async function authenticate() {
    try {
        console.log('🔐 Authenticating...');
        const response = await axios.post(`${BASE_URL}/login`, {
            username: TEST_EMAIL,
            password: TEST_PASSWORD
        });
        
        if (response.data.token) {
            authToken = response.data.token;
            console.log('✅ Authentication successful');
            return authToken;
        } else {
            console.log('❌ Authentication failed:', response.data);
            return null;
        }
    } catch (error) {
        console.log('❌ Authentication error:', error.message);
        if (error.response) {
            console.log('Response status:', error.response.status);
            console.log('Response data:', error.response.data);
        }
        return null;
    }
}

async function testApi(endpoint, method = 'GET', data = null, params = null) {
    try {
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        };

        if (data) {
            config.data = data;
        }

        if (params) {
            config.params = params;
        }

        console.log(`📡 Testing ${method} ${endpoint}...`);
        const response = await axios(config);
        
        console.log(`✅ ${method} ${endpoint} - Status: ${response.status}`);
        if (response.data) {
            console.log('   Response keys:', Object.keys(response.data));
            if (response.data.data) {
                console.log('   Data structure:', typeof response.data.data, Array.isArray(response.data.data) ? `array[${response.data.data.length}]` : 'object');
            }
        }
        return { success: true, data: response.data };
    } catch (error) {
        console.log(`❌ ${method} ${endpoint} - Error: ${error.message}`);
        if (error.response) {
            console.log(`   Status: ${error.response.status}`);
            console.log(`   Error data:`, error.response.data);
        }
        return { success: false, error: error.message };
    }
}

async function runDashboardTests() {
    const token = await authenticate();
    if (!token) {
        console.error('Cannot proceed without a valid token.');
        return;
    }

    console.log('\n📊 Testing Dashboard API Endpoints...\n');

    // Dashboard Stats Endpoints
    const dashboardEndpoints = [
        '/dashboard/stats',
        '/dashboard/history?hours=24',
        '/stats/today',
        '/stats/hourly'
    ];

    console.log('🏠 Dashboard Endpoints:');
    for (const endpoint of dashboardEndpoints) {
        await testApi(endpoint);
    }

    // Report Endpoints
    console.log('\n📈 Report Endpoints:');
    const reportEndpoints = [
        '/reports/daily?date=2024-12-24',
        '/reports/call-summary',
        '/reports/sms-summary',
        '/reports/agent-performance',
        '/reports/lead-conversion',
        '/reports/journey-analytics'
    ];

    for (const endpoint of reportEndpoints) {
        await testApi(endpoint);
    }

    // Report Templates
    console.log('\n📋 Report Template Endpoints:');
    const templateEndpoints = [
        '/report-templates',
        '/report-executions'
    ];

    for (const endpoint of templateEndpoints) {
        await testApi(endpoint);
    }

    // Test POST endpoints with sample data
    console.log('\n📝 Testing POST Report Endpoints:');
    
    const reportData = {
        startDate: '2024-12-01',
        endDate: '2024-12-24',
        groupBy: 'day'
    };

    const postEndpoints = [
        { endpoint: '/reports/call-summary', data: reportData },
        { endpoint: '/reports/sms-summary', data: reportData },
        { endpoint: '/reports/agent-performance', data: { ...reportData, agentIds: [] } },
        { endpoint: '/reports/lead-conversion', data: { ...reportData, sources: [], brands: [] } },
        { endpoint: '/reports/journey-analytics', data: { ...reportData, journeyIds: [] } }
    ];

    for (const { endpoint, data } of postEndpoints) {
        await testApi(endpoint, 'POST', data);
    }

    // System Endpoints  
    console.log('\n🔧 System Endpoints:');
    const systemEndpoints = [
        '/agent-status?url=test&user=test&pass=test&ingroups=test',
        '/system/module-status',
        '/system/dialplan-capabilities'
    ];

    for (const endpoint of systemEndpoints) {
        await testApi(endpoint);
    }

    console.log('\n✨ Dashboard API testing completed!');
}

// Run the tests
runDashboardTests().catch(console.error); 