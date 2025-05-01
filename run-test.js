const { execSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt user for credentials
const promptCredentials = () => {
  return new Promise((resolve) => {
    rl.question('Enter username: ', (username) => {
      rl.question('Enter password: ', (password) => {
        rl.question('Enter tenant ID: ', (tenantId) => {
          resolve({ username, password, tenantId: parseInt(tenantId, 10) });
        });
      });
    });
  });
};

// Main function
const runTest = async () => {
  try {
    console.log('=== Working Hours API Test ===');
    console.log('This script will test updating the working hours for a tenant');
    console.log('Please provide credentials to authenticate:');
    
    const credentials = await promptCredentials();
    
    // Generate a test file with credentials included
    const testFileContent = `
const axios = require('axios');

// API configuration
const API_URL = 'http://34.122.156.88:3001/api';
const api = axios.create({ baseURL: API_URL });

// Login to get authentication token
const login = async (username, password) => {
  try {
    const response = await api.post('/login', { username, password });
    return response.data.token;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  }
};

// Get tenant data
const getTenant = async (id, token) => {
  try {
    const response = await api.get(\`/tenants/\${id}\`, {
      headers: { Authorization: \`Bearer \${token}\` }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching tenant:', error.response?.data || error.message);
    throw error;
  }
};

// Update tenant data
const updateTenant = async (id, tenantData, token) => {
  try {
    const response = await api.put(\`/tenants/\${id}\`, tenantData, {
      headers: { Authorization: \`Bearer \${token}\` }
    });
    return response.data;
  } catch (error) {
    console.error('Error updating tenant:', error.response?.data || error.message);
    throw error;
  }
};

// Test function
const testUpdateWorkingHours = async () => {
  try {
    // Login with provided credentials
    console.log('Logging in...');
    const token = await login('${credentials.username}', '${credentials.password}');
    console.log('Login successful, received token');
    
    // Get tenant data
    const tenantId = ${credentials.tenantId};
    console.log(\`Fetching tenant data for ID: \${tenantId}...\`);
    const currentTenant = await getTenant(tenantId, token);
    console.log('Current schedule:', JSON.stringify(currentTenant.schedule, null, 2));
    
    // Create updated schedule - 8AM-4PM weekdays, weekends off
    const updatedSchedule = {
      '0': { enabled: false, startTime: '09:00', endTime: '17:00' }, // Sunday
      '1': { enabled: true, startTime: '08:00', endTime: '16:00' },  // Monday
      '2': { enabled: true, startTime: '08:00', endTime: '16:00' },  // Tuesday
      '3': { enabled: true, startTime: '08:00', endTime: '16:00' },  // Wednesday
      '4': { enabled: true, startTime: '08:00', endTime: '16:00' },  // Thursday
      '5': { enabled: true, startTime: '08:00', endTime: '16:00' },  // Friday
      '6': { enabled: false, startTime: '09:00', endTime: '17:00' }  // Saturday
    };
    
    // Update tenant
    const updatedTenant = {
      ...currentTenant,
      schedule: updatedSchedule
    };
    
    console.log('Updating tenant with new working hours...');
    await updateTenant(tenantId, updatedTenant, token);
    
    // Verify update
    console.log('Verifying update...');
    const verifiedTenant = await getTenant(tenantId, token);
    console.log('Updated schedule:', JSON.stringify(verifiedTenant.schedule, null, 2));
    
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Test failed:', error);
  }
};

// Run the test
testUpdateWorkingHours();
    `;
    
    // Write the temporary test file
    const tempTestFile = 'temp-test-working-hours.js';
    fs.writeFileSync(tempTestFile, testFileContent);
    
    console.log('\nRunning test...');
    
    // Execute the test
    execSync(`node ${tempTestFile}`, { stdio: 'inherit' });
    
    // Clean up the temporary file
    fs.unlinkSync(tempTestFile);
    console.log('Test execution completed');
    
  } catch (error) {
    console.error('Error running test:', error);
  } finally {
    rl.close();
  }
};

// Run the main function
runTest(); 