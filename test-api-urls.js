const axios = require('axios');

// API configuration
const API_URL = 'http://34.122.156.88:3001/api';

async function authenticate() {
    try {
        console.log('\nAuthenticating...');
        const response = await axios.post(`${API_URL}/login`, {
            username: 'admin',
            password: 'admin123'
        });
        if (response.data && response.data.token) {
            console.log('Authentication successful. Token obtained.');
            return response.data.token;
        } else {
            console.error('Authentication failed: No token in response');
            return null;
        }
    } catch (error) {
        console.error('Authentication error:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        return null;
    }
}

async function testGetApi(endpoint, token, params = {}) {
    const url = `${API_URL}${endpoint}`;
    try {
        console.log(`\nTesting GET API endpoint: ${url}`);
        if (Object.keys(params).length > 0) {
            console.log('Request params:', params);
        }
        const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` },
            params: params
        });
        console.log('Status:', response.status);
        console.log('Response:', response.data);
        return true;
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        return false;
    }
}

async function runTests() {
    const token = await authenticate();
    if (!token) {
        console.error('Cannot proceed without a valid token.');
        return;
    }

    // Test GET endpoints
    const getEndpoints = [
        '/dashboard/stats',
        '/stats/today',
        '/reports/daily?date=2024-06-01',
        '/report-templates',
        '/report-executions'
    ];

    console.log('\nTesting GET endpoints...');
    for (const endpoint of getEndpoints) {
        await testGetApi(endpoint, token);
    }

    // Test GET endpoint for call summary report with query parameters
    const callSummaryParams = {
        startDate: "2024-06-01",
        endDate: "2024-06-30",
        groupBy: "day",
        status: "completed",
        agentId: 1,
        didId: 1
    };

    console.log('\nTesting GET endpoint for call summary report...');
    await testGetApi('/reports/call-summary', token, callSummaryParams);
}

runTests().catch(console.error);