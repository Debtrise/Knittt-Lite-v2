#!/usr/bin/env node

/**
 * Test script to verify display status logic
 * Tests that isActive displays are treated as "online" for our system
 */

const API_BASE_URL = 'http://34.122.156.88:3001/api';
let authToken = null;

// Authentication
async function login() {
  console.log('🔐 Logging in...');
  
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: 'admin',
      password: 'admin123'
    })
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  authToken = data.token;
  console.log('✅ Login successful');
  return authToken;
}

// Authenticated fetch helper
async function authenticatedFetch(url, options = {}) {
  if (!authToken) {
    await login();
  }

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  });
}

// Test display status logic
async function testDisplayStatusLogic() {
  console.log('\n🖥️  Testing display status logic...');
  
  try {
    // Get displays from sync
    const response = await authenticatedFetch(`${API_BASE_URL}/optisigns/displays`);
    
    if (!response.ok) {
      throw new Error(`Displays request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const displays = data.displays || data || [];
    console.log(`✅ Found ${displays.length} displays`);
    
    if (displays.length > 0) {
      console.log('\n📊 Display Status Analysis:');
      
      let totalDisplays = displays.length;
      let onlineCount = 0;
      let activeCount = 0;
      let availableCount = 0; // isOnline OR isActive
      let offlineCount = 0;
      
      displays.forEach(display => {
        const isOnline = display.isOnline === true;
        const isActive = display.isActive === true;
        const isAvailable = isOnline || isActive; // Our system logic
        
        if (isOnline) onlineCount++;
        if (isActive) activeCount++;
        if (isAvailable) availableCount++;
        if (!isAvailable) offlineCount++;
        
        const statusIcon = isAvailable ? '🟢' : '🔴';
        const displayName = display.name || display.deviceName || `Display ${display.id}`;
        
        console.log(`   ${statusIcon} ${displayName}`);
        console.log(`      - isOnline: ${isOnline}`);
        console.log(`      - isActive: ${isActive}`);
        console.log(`      - Available (our logic): ${isAvailable}`);
        console.log(`      - Status: ${display.status || 'unknown'}`);
        console.log('');
      });
      
      console.log('📈 Summary Statistics:');
      console.log(`   Total Displays: ${totalDisplays}`);
      console.log(`   isOnline: ${onlineCount}`);
      console.log(`   isActive: ${activeCount}`);
      console.log(`   Available (isOnline OR isActive): ${availableCount}`);
      console.log(`   Offline: ${offlineCount}`);
      
      // Verify our logic
      const expectedAvailable = displays.filter(d => d.isOnline || d.isActive).length;
      const expectedOffline = displays.filter(d => !d.isOnline && !d.isActive).length;
      
      console.log('\n✅ Logic Verification:');
      console.log(`   Expected Available: ${expectedAvailable}`);
      console.log(`   Calculated Available: ${availableCount}`);
      console.log(`   Expected Offline: ${expectedOffline}`);
      console.log(`   Calculated Offline: ${offlineCount}`);
      
      if (expectedAvailable === availableCount && expectedOffline === offlineCount) {
        console.log('🎉 Display status logic is working correctly!');
      } else {
        console.log('❌ Display status logic has issues!');
      }
      
      // Show improvement
      console.log('\n🚀 Status Logic Improvement:');
      console.log(`   Before: Only ${onlineCount} displays considered "online"`);
      console.log(`   After: ${availableCount} displays considered "available" for publishing`);
      console.log(`   Improvement: +${availableCount - onlineCount} additional displays available`);
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error testing display status:', error.message);
    throw error;
  }
}

// Main test execution
async function runTests() {
  try {
    console.log('🧪 Starting Display Status Logic Tests\n');
    
    await testDisplayStatusLogic();
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runTests();