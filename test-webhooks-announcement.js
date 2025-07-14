#!/usr/bin/env node

// Test script for Webhooks Announcement Feature
// Run with: node test-webhooks-announcement.js

// Use built-in fetch in Node.js 18+

const BASE_URL = 'http://34.122.156.88:3001';
const API_BASE_URL = 'http://34.122.156.88:3001/api'; // All APIs are hosted here

// Test configuration
const testConfig = {
  auth: {
    username: 'admin',
    password: 'admin123'
  }
};

let authCookie = '';
let authToken = '';

// Helper function to make authenticated requests
async function authenticatedFetch(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  // Use bearer token for external API, cookie for local API
  if (url.includes('34.122.156.88') && authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  } else if (authCookie) {
    headers.Cookie = authCookie;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  return response;
}

// Authentication
async function authenticate() {
  console.log('🔐 Authenticating...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testConfig.auth)
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
    }

    // Extract cookie and token from response
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
      authCookie = setCookieHeader.split(';')[0];
    }

    // Extract token from response body
    const loginData = await response.json();
    if (loginData.data?.token) {
      authToken = loginData.data.token;
      console.log('✅ Authentication successful - Token received');
    } else if (loginData.token) {
      authToken = loginData.token;
      console.log('✅ Authentication successful - Token received');
    } else {
      console.log('✅ Authentication successful - No token in response');
      console.log('Response:', loginData);
    }

    return true;
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    return false;
  }
}

// Test content projects endpoint
async function testContentProjects() {
  console.log('\n📋 Testing content projects...');
  
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/content/projects?status=published`);
    
    if (!response.ok) {
      throw new Error(`Content projects request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Found ${data.projects?.length || 0} published content projects`);
    
    if (data.projects && data.projects.length > 0) {
      console.log('   Content projects found:');
      data.projects.forEach(project => {
        console.log(`   - ${project.name}`);
        console.log(`     Description: ${project.description || 'No description'}`);
        console.log(`     Status: ${project.status}`);
        console.log(`     Canvas: ${project.canvasSize?.width}x${project.canvasSize?.height}`);
        console.log(`     Elements: ${project.elements?.length || 0}`);
      });
    }
    
    return data;
  } catch (error) {
    console.error('❌ Content projects test failed:', error.message);
    return null;
  }
}

// Test announcement displays endpoint
async function testAnnouncementDisplays() {
  console.log('\n🖥️  Testing announcement displays...');
  
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/optisigns/displays`);
    
    if (!response.ok) {
      throw new Error(`Displays request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const displays = data.displays || data || [];
    console.log(`✅ Found ${displays.length} displays`);
    
    if (displays.length > 0) {
      console.log('   Displays found:');
      displays.forEach(display => {
        const isOnline = display.isOnline || display.status === 'online';
        const statusIcon = isOnline ? '🟢' : '🔴';
        const displayName = display.name || display.deviceName || `Display ${display.id}`;
        const location = display.location || display.address || 'Unknown Location';
        console.log(`   ${statusIcon} ${displayName} - ${location}`);
        
        if (display.resolution) {
          console.log(`      Resolution: ${display.resolution.width}x${display.resolution.height}`);
        }
        console.log(`      Tags: ${display.tags?.join(', ') || 'none'}`);
      });
    }
    
    // Test filtering
    console.log('\n   Testing display filtering...');
    const onlineResponse = await authenticatedFetch(`${API_BASE_URL}/optisigns/displays?status=online`);
    const onlineData = await onlineResponse.json();
    const onlineDisplays = onlineData.displays || onlineData || [];
    console.log(`   - Online displays: ${onlineDisplays.length}`);
    
    const locationResponse = await authenticatedFetch(`${API_BASE_URL}/optisigns/displays?location=lobby`);
    const locationData = await locationResponse.json();
    const locationDisplays = locationData.displays || locationData || [];
    console.log(`   - Lobby displays: ${locationDisplays.length}`);
    
    return data;
  } catch (error) {
    console.error('❌ Displays test failed:', error.message);
    return null;
  }
}

// Test creating an announcement webhook
async function testCreateAnnouncementWebhook(projects, displays) {
  console.log('\n🎯 Testing announcement webhook creation...');
  
  const projectList = projects?.projects || projects || [];
  const displayList = displays?.displays || displays || [];
  
  if (!projectList.length || !displayList.length) {
    console.log('⚠️  Skipping webhook creation - missing projects or displays');
    return null;
  }

  const testWebhook = {
    name: 'Test Announcement Webhook',
    description: 'Test webhook for announcement functionality',
    webhookType: 'announcement',
    brand: 'Test Brand',
    source: 'Test Source',
    fieldMapping: {
      phone: 'phone',
      name: 'full_name',
      email: 'email_address',
      rep_name: 'rep_name',
      deal_amount: 'deal_amount',
      company_name: 'company_name'
    },
    validationRules: {
      requirePhone: true,
      requireName: false,
      requireEmail: false,
      allowDuplicatePhone: false
    },
    autoTagRules: [
      {
        field: 'source',
        operator: 'equals',
        value: 'test',
        tag: 'test-announcement'
      }
    ],
    announcementConfig: {
      enabled: true,
      contentCreator: {
        templateId: projectList[0].id,
        variableMapping: {
          rep_name: 'rep_name',
          deal_amount: 'deal_amount',
          company_name: 'company_name'
        },
        autoGenerate: true,
        projectName: 'Test Announcement - {{rep_name}}'
      },
      optisigns: {
        displaySelection: {
          mode: 'specific',
          displayIds: [displayList[0].id, displayList[1]?.id].filter(Boolean)
        },
        takeover: {
          priority: 'HIGH',
          duration: 45,
          restoreAfter: true,
          overrideCurrent: false
        },
        scheduling: {
          immediate: true
        }
      }
    }
  };

  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/webhooks`, {
      method: 'POST',
      body: JSON.stringify(testWebhook)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Webhook creation failed: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Announcement webhook created successfully');
    console.log(`   Webhook ID: ${data.id}`);
    console.log(`   Endpoint Key: ${data.endpointKey}`);
    console.log(`   Webhook URL: ${data.webhookUrl}`);
    
    return data;
  } catch (error) {
    console.error('❌ Webhook creation failed:', error.message);
    return null;
  }
}

// Test webhook listing with announcement type
async function testWebhookListing() {
  console.log('\n📋 Testing webhook listing...');
  
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/webhooks`);
    
    if (!response.ok) {
      throw new Error(`Webhook listing failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const webhooks = data.webhooks || data || [];
    
    console.log(`✅ Found ${webhooks.length} webhooks`);
    
    const announcementWebhooks = webhooks.filter(w => w.webhookType === 'announcement');
    console.log(`   - Announcement webhooks: ${announcementWebhooks.length}`);
    
    if (announcementWebhooks.length > 0) {
      console.log('   Announcement webhooks:');
      announcementWebhooks.forEach(webhook => {
        console.log(`   - ${webhook.name} (${webhook.isActive ? 'Active' : 'Inactive'})`);
        if (webhook.announcementConfig) {
          console.log(`     Project: ${webhook.announcementConfig.contentCreator?.templateId || 'none'}`);
          console.log(`     Display mode: ${webhook.announcementConfig.optisigns?.displaySelection?.mode || 'unknown'}`);
          const displayCount = webhook.announcementConfig.optisigns?.displaySelection?.displayIds?.length || 0;
          if (displayCount > 0) {
            console.log(`     Selected displays: ${displayCount}`);
          }
        }
      });
    }
    
    return data;
  } catch (error) {
    console.error('❌ Webhook listing failed:', error.message);
    return null;
  }
}

// Clean up test webhook
async function cleanupTestWebhook(webhookId) {
  if (!webhookId) return;
  
  console.log('\n🧹 Cleaning up test webhook...');
  
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/webhooks/${webhookId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      console.log('✅ Test webhook deleted successfully');
    } else {
      console.log('⚠️  Failed to delete test webhook (may need manual cleanup)');
    }
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Webhooks Announcement Feature Tests\n');
  
  // Authenticate
  const authSuccess = await authenticate();
  if (!authSuccess) {
    console.log('\n❌ Tests aborted due to authentication failure');
    return;
  }

  // Test content projects endpoint
  const projects = await testContentProjects();
  
  // Test displays endpoint
  const displays = await testAnnouncementDisplays();
  
  // Test webhook creation
  const createdWebhook = await testCreateAnnouncementWebhook(projects, displays);
  
  // Test webhook listing
  await testWebhookListing();
  
  // Clean up
  if (createdWebhook) {
    await cleanupTestWebhook(createdWebhook.id);
  }

  console.log('\n🎉 All tests completed!');
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log(`   Content projects endpoint: ${projects ? '✅' : '❌'}`);
  console.log(`   Displays endpoint: ${displays ? '✅' : '❌'}`);
  console.log(`   Webhook creation: ${createdWebhook ? '✅' : '❌'}`);
  console.log(`   Display selection: ${createdWebhook?.announcementConfig ? '✅' : '❌'}`);
}

// Run the tests
if (require.main === module) {
  runTests().catch(error => {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = { runTests }; 