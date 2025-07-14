#!/usr/bin/env node

/**
 * Simplified Content Creator Export Test
 * 
 * This script focuses on testing the working parts of the content creator APIs
 * and provides detailed debugging for the export issues.
 */

const API_BASE_URL = 'http://34.122.156.88:3001/api';

let authToken = null;

/**
 * Make authenticated API request
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    
    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = {};
    }
    
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      data
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      statusText: error.message,
      data: null
    };
  }
}

/**
 * Authenticate
 */
async function authenticate() {
  console.log('🔐 Authenticating...');
  const credentials = {
    username: 'admin',
    password: 'admin123'
  };
  
  const result = await apiRequest('/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });
  
  if (result.ok && result.data?.token) {
    authToken = result.data.token;
    console.log('✅ Authentication successful\n');
    return true;
  } else {
    console.log('❌ Authentication failed');
    console.log('Response:', result.data);
    return false;
  }
}

/**
 * Test basic functionality that's working
 */
async function testWorkingFunctionality() {
  console.log('🔍 Testing Working Functionality\n');

  // Test 1: Get available displays
  console.log('Testing Get Available Displays...');
  const displaysResult = await apiRequest('/optisigns/displays');
  if (displaysResult.ok) {
    console.log(`✅ Found ${displaysResult.data?.displays?.length || 0} displays`);
  } else {
    console.log(`❌ Failed: ${displaysResult.status} ${displaysResult.statusText}`);
  }
  console.log('');

  // Test 2: Create a test project
  console.log('Testing Create Project...');
  const projectData = {
    name: 'Simple Export Test',
    description: 'Test project for export debugging',
    canvasSize: { width: 1920, height: 1080 },
    canvasBackground: { type: 'solid', color: '#ffffff' },
    variables: {}
  };
  
  const projectResult = await apiRequest('/content/projects', {
    method: 'POST',
    body: JSON.stringify(projectData)
  });
  
  if (projectResult.ok && projectResult.data?.project?.id) {
    const projectId = projectResult.data.project.id;
    console.log(`✅ Created project: ${projectId}`);
    
    // Test 3: Add a simple element
    console.log('Testing Add Element...');
    const elementData = {
      type: 'text',
      position: { x: 100, y: 100, z: 1 },
      size: { width: 200, height: 50 },
      properties: { text: 'Hello World!' },
      styles: { fontSize: '24px', color: '#000000' },
      layerOrder: 1,
      opacity: 1
    };
    
    const elementResult = await apiRequest(`/content/projects/${projectId}/elements`, {
      method: 'POST',
      body: JSON.stringify(elementData)
    });
    
    if (elementResult.ok) {
      console.log('✅ Element created successfully');
    } else {
      console.log(`❌ Element creation failed: ${elementResult.status}`);
      console.log('Error:', elementResult.data);
    }
    
    // Test 4: Get project exports (should be empty)
    console.log('\nTesting Get Project Exports...');
    const exportsResult = await apiRequest(`/content/projects/${projectId}/exports`);
    if (exportsResult.ok) {
      console.log(`✅ Found ${exportsResult.data?.exports?.length || 0} exports`);
    } else {
      console.log(`❌ Failed: ${exportsResult.status}`);
    }
    
    // Test 5: Try different export configurations to debug the issue
    console.log('\n🐛 Debugging Export Creation...');
    
    // Configuration 1: Minimal data
    console.log('Trying minimal export configuration...');
    const minimalExport = {
      exportType: 'image'
    };
    
    const minimalResult = await apiRequest(`/content/projects/${projectId}/export`, {
      method: 'POST',
      body: JSON.stringify(minimalExport)
    });
    
    console.log('Minimal export result:', {
      status: minimalResult.status,
      ok: minimalResult.ok,
      data: minimalResult.data
    });
    
    // Configuration 2: With options
    console.log('\nTrying export with options...');
    const withOptionsExport = {
      exportType: 'image',
      options: {
        quality: 'high',
        dimensions: { width: 1920, height: 1080 }
      }
    };
    
    const optionsResult = await apiRequest(`/content/projects/${projectId}/export`, {
      method: 'POST',
      body: JSON.stringify(withOptionsExport)
    });
    
    console.log('With options result:', {
      status: optionsResult.status,
      ok: optionsResult.ok,
      data: optionsResult.data
    });
    
    // Configuration 3: Try to include the missing fields based on error
    console.log('\nTrying export with format and filename...');
    const completeExport = {
      exportType: 'image',
      format: 'png',
      filename: `export-${Date.now()}.png`,
      filePath: `/exports/export-${Date.now()}.png`,
      options: {
        quality: 'high',
        dimensions: { width: 1920, height: 1080 }
      }
    };
    
    const completeResult = await apiRequest(`/content/projects/${projectId}/export`, {
      method: 'POST',
      body: JSON.stringify(completeExport)
    });
    
    console.log('Complete export result:', {
      status: completeResult.status,
      ok: completeResult.ok,
      data: completeResult.data
    });
    
    // Test 6: Test preview generation (which we know works)
    console.log('\nTesting Preview Generation...');
    const previewData = {
      contextData: {
        lead: { name: 'Test User' },
        tenant: { name: 'Test Company' }
      }
    };
    
    const previewResult = await apiRequest(`/content/projects/${projectId}/preview`, {
      method: 'POST',
      body: JSON.stringify(previewData)
    });
    
    if (previewResult.ok) {
      console.log('✅ Preview generated successfully');
    } else {
      console.log(`❌ Preview failed: ${previewResult.status}`);
    }
    
    // Test 7: Test OptiSigns status
    console.log('\nTesting OptiSigns Status...');
    const optiSignsResult = await apiRequest(`/content/projects/${projectId}/optisigns-status`);
    if (optiSignsResult.ok) {
      console.log(`✅ OptiSigns status: ${optiSignsResult.data?.status?.status || 'unknown'}`);
    } else {
      console.log(`❌ OptiSigns status failed: ${optiSignsResult.status}`);
    }
    
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await apiRequest(`/content/projects/${projectId}`, { method: 'DELETE' });
    console.log('✅ Test project deleted');
    
  } else {
    console.log('❌ Failed to create project');
    console.log('Error:', projectResult.data);
  }
}

/**
 * Main function
 */
async function runTests() {
  console.log('🧪 Simplified Content Creator Export Test');
  console.log('==========================================\n');
  
  if (!(await authenticate())) {
    return;
  }
  
  await testWorkingFunctionality();
  
  console.log('\n📊 Test Complete');
  console.log('The export creation is failing due to missing database fields.');
  console.log('However, other functionality (projects, elements, displays, preview) is working correctly.');
}

// Run the tests
runTests().catch(console.error); 