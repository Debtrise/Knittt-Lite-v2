#!/usr/bin/env node

/**
 * Authentication Token Helper
 * Attempts to get a valid JWT token for testing
 */

const axios = require('axios');

const API_BASE_URL = 'http://34.122.156.88:3001/api';

async function getAuthToken() {
  try {
    console.log('Getting auth token...');
    
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Response:', response.data);

    if (response.data && response.data.accessToken) {
      const { accessToken } = response.data;
      console.log('✅ Auth token received successfully!');
      console.log('\nToken:', accessToken);
      
      // Create .env file with the token
      const fs = require('fs');
      fs.writeFileSync('.env', `AUTH_TOKEN=${accessToken}\nAPI_BASE_URL=${API_BASE_URL}`);
      console.log('\n✅ Token saved to .env file');
      
      return accessToken;
    } else {
      throw new Error('No token received in response');
    }

  } catch (error) {
    console.error('❌ Error getting auth token:', error.response?.data || error.message);
    throw error;
  }
}

// Run the auth token request
getAuthToken(); 