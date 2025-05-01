const axios = require('axios');
const readline = require('readline');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Base API URL
const API_URL = 'http://34.122.156.88:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Prompt for credentials
const getCredentials = () => {
  return new Promise((resolve) => {
    rl.question('Enter username: ', (username) => {
      rl.question('Enter password: ', (password) => {
        resolve({ username, password });
      });
    });
  });
};

// Menu options
const showMenu = () => {
  console.log('\n=== Call API Test Menu ===');
  console.log('1. Get Call List');
  console.log('2. Get Call Details');
  console.log('3. Update Call Status');
  console.log('4. Make Call');
  console.log('5. Exit');
  
  return new Promise((resolve) => {
    rl.question('\nSelect an option (1-5): ', (option) => {
      resolve(option);
    });
  });
};

// Login and get token
const login = async (username, password) => {
  try {
    const response = await api.post('/login', { username, password });
    return response.data.token;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  }
};

// Get calls list
const getCalls = async (token, options = {}) => {
  try {
    const response = await api.get('/calls', {
      params: options,
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting calls:', error.response?.data || error.message);
    throw error;
  }
};

// Get call details
const getCallDetails = async (token, id) => {
  try {
    const response = await api.get(`/calls/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting call details:', error.response?.data || error.message);
    throw error;
  }
};

// Update call status
const updateCallStatus = async (token, id, status) => {
  try {
    const response = await api.put(`/calls/${id}/status`, 
      { status },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating call status:', error.response?.data || error.message);
    throw error;
  }
};

// Make call
const makeCall = async (token, callData) => {
  try {
    const response = await api.post('/make-call', 
      callData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error('Error making call:', error.response?.data || error.message);
    throw error;
  }
};

// Main function
const main = async () => {
  try {
    // Get credentials
    const credentials = await getCredentials();
    
    // Login
    console.log('Logging in...');
    const token = await login(credentials.username, credentials.password);
    console.log('Login successful!');
    
    // Show menu and handle options
    let exit = false;
    while (!exit) {
      const option = await showMenu();
      
      switch (option) {
        case '1': {
          // Get Call List
          rl.question('Enter page (default 1): ', async (page) => {
            rl.question('Enter limit (default 50): ', async (limit) => {
              rl.question('Enter status (optional): ', async (status) => {
                rl.question('Enter leadId (optional): ', async (leadId) => {
                  try {
                    const options = {
                      page: page || 1,
                      limit: limit || 50,
                      ...(status ? { status } : {}),
                      ...(leadId ? { leadId } : {})
                    };
                    
                    console.log('Fetching calls...');
                    const result = await getCalls(token, options);
                    console.log('Calls:', JSON.stringify(result, null, 2));
                  } catch (error) {
                    console.error('Operation failed');
                  }
                });
              });
            });
          });
          break;
        }
        
        case '2': {
          // Get Call Details
          rl.question('Enter call ID: ', async (id) => {
            try {
              console.log(`Fetching details for call ID ${id}...`);
              const result = await getCallDetails(token, id);
              console.log('Call details:', JSON.stringify(result, null, 2));
            } catch (error) {
              console.error('Operation failed');
            }
          });
          break;
        }
        
        case '3': {
          // Update Call Status
          rl.question('Enter call ID: ', (id) => {
            rl.question('Enter new status (initiated, answered, transferred, completed, failed): ', async (status) => {
              try {
                console.log(`Updating status for call ID ${id} to "${status}"...`);
                const result = await updateCallStatus(token, id, status);
                console.log('Update result:', JSON.stringify(result, null, 2));
              } catch (error) {
                console.error('Operation failed');
              }
            });
          });
          break;
        }
        
        case '4': {
          // Make Call
          rl.question('Enter "to" number: ', (to) => {
            rl.question('Enter "from" number: ', (from) => {
              rl.question('Enter transfer number: ', (transfer_number) => {
                rl.question('Enter lead ID: ', async (leadId) => {
                  try {
                    const callData = {
                      to,
                      from,
                      transfer_number,
                      leadId: parseInt(leadId, 10),
                      variables: {
                        custom_field1: 'test value',
                        custom_field2: 'test value 2'
                      }
                    };
                    
                    console.log('Making call with data:', JSON.stringify(callData, null, 2));
                    const result = await makeCall(token, callData);
                    console.log('Call initiated:', JSON.stringify(result, null, 2));
                  } catch (error) {
                    console.error('Operation failed');
                  }
                });
              });
            });
          });
          break;
        }
        
        case '5': {
          // Exit
          console.log('Exiting...');
          exit = true;
          rl.close();
          break;
        }
        
        default: {
          console.log('Invalid option. Please try again.');
          break;
        }
      }
    }
  } catch (error) {
    console.error('An error occurred:', error);
    rl.close();
  }
};

// Start the application
main(); 