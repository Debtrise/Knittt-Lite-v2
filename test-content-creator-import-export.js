#!/usr/bin/env node

/**
 * Content Creator Import/Export API Test Script
 * 
 * This script tests the import and export functionality of the content creator APIs
 * including project exports, OptiSigns integration, and bulk operations.
 */

const API_BASE_URL = process.env.API_URL || 'http://34.122.156.88:3001/api';

// Test configuration
const TEST_CONFIG = {
  apiUrl: API_BASE_URL,
  authToken: null,
  timeout: 30000 // Longer timeout for export operations
};

console.log('🧪 Content Creator Import/Export API Test Suite');
console.log('================================================');
console.log(`API Base URL: ${TEST_CONFIG.apiUrl}`);
console.log('');

/**
 * Make authenticated API request
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${TEST_CONFIG.apiUrl}${endpoint}`;
  const config = {
    headers: {
      'Authorization': `Bearer ${TEST_CONFIG.authToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    
    // Handle blob responses (for downloads)
    if (options.expectBlob) {
      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        blob: response.ok ? await response.blob() : null,
        data: null
      };
    }
    
    const data = await response.json().catch(() => ({}));
    
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
 * Test individual endpoint
 */
async function testEndpoint(name, endpoint, method = 'GET', body = null, options = {}) {
  console.log(`Testing ${name}...`);
  
  const requestOptions = {
    method,
    ...(body && { body: JSON.stringify(body) }),
    ...options
  };
  
  const result = await apiRequest(endpoint, requestOptions);
  
  if (result.ok) {
    console.log(`✅ ${name}: ${result.status} ${result.statusText}`);
    return { success: true, data: result.data, blob: result.blob };
  } else {
    console.log(`❌ ${name}: ${result.status} ${result.statusText}`);
    if (result.data?.error) {
      console.log(`   Error: ${result.data.error}`);
    }
    return { success: false, error: result.statusText };
  }
}

/**
 * Wait for export to complete
 */
async function waitForExportCompletion(exportId, maxWaitTime = 60000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTime) {
    const statusResult = await apiRequest(`/content/exports/${exportId}/status`);
    
    if (statusResult.ok && statusResult.data?.export) {
      const status = statusResult.data.export.status;
      console.log(`   Export status: ${status}`);
      
      if (status === 'completed') {
        return { success: true, export: statusResult.data.export };
      } else if (status === 'failed') {
        return { success: false, error: 'Export failed' };
      }
    }
    
    // Wait 2 seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return { success: false, error: 'Export timeout' };
}

/**
 * Create a test project for export testing
 */
async function createTestProject() {
  const projectData = {
    name: 'Export Test Project',
    description: 'Test project for export functionality',
    canvasSize: { width: 1920, height: 1080 },
    canvasBackground: { type: 'solid', color: '#ffffff' },
    variables: {}
  };
  
  const result = await testEndpoint('Create Test Project', '/content/projects', 'POST', projectData);
  
  if (result.success && result.data?.project?.id) {
    const projectId = result.data.project.id;
    
         // Add some test elements
     const elements = [
       {
         type: 'text',
         position: { x: 100, y: 100, z: 1 },
         size: { width: 300, height: 80 },
         properties: { text: 'Test Title', textAlign: 'center' },
         styles: { fontSize: '32px', color: '#000000', fontWeight: 'bold' },
         layerOrder: 1,
         opacity: 1
       },
       {
         type: 'text',
         position: { x: 100, y: 200, z: 2 },
         size: { width: 500, height: 60 },
         properties: { text: 'This is a test project for export functionality' },
         styles: { fontSize: '18px', color: '#333333' },
         layerOrder: 2,
         opacity: 1
       },
       {
         type: 'shape',
         position: { x: 50, y: 50, z: 0 },
         size: { width: 600, height: 300 },
         properties: { shape: 'rectangle' },
         styles: { backgroundColor: '#f0f0f0', borderRadius: '8px' },
         layerOrder: 0,
         opacity: 0.8
       }
     ];
    
    for (const element of elements) {
             await testEndpoint(
         `Add ${element.type} element`,
         `/content/projects/${projectId}/elements`,
         'POST',
         element
       );
    }
    
    return projectId;
  }
  
  return null;
}

/**
 * Authenticate to get token
 */
async function authenticate() {
  try {
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
      TEST_CONFIG.authToken = result.data.token;
      console.log('✅ Authentication successful\n');
      return true;
    } else {
      console.log('❌ Authentication failed\n');
      console.log('Response:', result.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Authentication error:', error.message);
    return false;
  }
}

/**
 * Main test suite
 */
async function runImportExportTests() {
  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };

  // First authenticate
  if (!(await authenticate())) {
    console.log('Authentication failed. Cannot proceed with tests.');
    return;
  }

  console.log('🔍 Testing Export/Import Endpoints\n');

  // Step 1: Create a test project
  console.log('📝 Setting up test project...\n');
  const testProjectId = await createTestProject();
  
  if (!testProjectId) {
    console.log('❌ Failed to create test project. Aborting tests.');
    return;
  }
  
  console.log(`✅ Test project created with ID: ${testProjectId}\n`);

  // Test 1: Get project exports (should be empty initially)
  results.total++;
  const getExportsTest = await testEndpoint(
    'Get Project Exports',
    `/content/projects/${testProjectId}/exports`
  );
  if (getExportsTest.success) {
    results.passed++;
    console.log(`   Found ${getExportsTest.data?.exports?.length || 0} existing exports`);
  } else {
    results.failed++;
  }
  console.log('');

     // Test 2: Create Image Export
   results.total++;
   const imageExportOptions = {
     exportType: 'image',
     options: {
       format: 'png',
       quality: 'high',
       dimensions: { width: 1920, height: 1080 },
       includeAnimations: false,
       backgroundColor: '#ffffff'
     }
   };
  
  const createImageExportTest = await testEndpoint(
    'Create Image Export',
    `/content/projects/${testProjectId}/export`,
    'POST',
    imageExportOptions
  );
  
  let imageExportId = null;
  if (createImageExportTest.success) {
    results.passed++;
    imageExportId = createImageExportTest.data?.export?.id;
    console.log(`   Created image export with ID: ${imageExportId}`);
  } else {
    results.failed++;
  }
  console.log('');

     // Test 3: Create PDF Export
   results.total++;
   const pdfExportOptions = {
     exportType: 'pdf',
     options: {
       format: 'pdf',
       quality: 'medium',
       dimensions: { width: 1920, height: 1080 }
     }
   };
  
  const createPdfExportTest = await testEndpoint(
    'Create PDF Export',
    `/content/projects/${testProjectId}/export`,
    'POST',
    pdfExportOptions
  );
  
  let pdfExportId = null;
  if (createPdfExportTest.success) {
    results.passed++;
    pdfExportId = createPdfExportTest.data?.export?.id;
    console.log(`   Created PDF export with ID: ${pdfExportId}`);
  } else {
    results.failed++;
  }
  console.log('');

     // Test 4: Create HTML Export
   results.total++;
   const htmlExportOptions = {
     exportType: 'html',
     options: {
       format: 'html',
       includeAnimations: true
     }
   };
  
  const createHtmlExportTest = await testEndpoint(
    'Create HTML Export',
    `/content/projects/${testProjectId}/export`,
    'POST',
    htmlExportOptions
  );
  
  let htmlExportId = null;
  if (createHtmlExportTest.success) {
    results.passed++;
    htmlExportId = createHtmlExportTest.data?.export?.id;
    console.log(`   Created HTML export with ID: ${htmlExportId}`);
  } else {
    results.failed++;
  }
  console.log('');

  // Test 5: Wait for image export to complete and download
  if (imageExportId) {
    console.log('⏳ Waiting for image export to complete...');
    const imageExportResult = await waitForExportCompletion(imageExportId);
    
    if (imageExportResult.success) {
      console.log('✅ Image export completed successfully');
      
      // Test download
      results.total++;
      const downloadTest = await testEndpoint(
        'Download Image Export',
        `/content/exports/${imageExportId}/download`,
        'GET',
        null,
        { expectBlob: true }
      );
      
      if (downloadTest.success && downloadTest.blob) {
        results.passed++;
        console.log(`   Downloaded ${downloadTest.blob.size} bytes`);
      } else {
        results.failed++;
      }
    } else {
      console.log(`❌ Image export failed: ${imageExportResult.error}`);
    }
    console.log('');
  }

  // Test 6: Get export status for all exports
  for (const exportId of [imageExportId, pdfExportId, htmlExportId].filter(Boolean)) {
    results.total++;
    const statusTest = await testEndpoint(
      `Get Export Status (${exportId})`,
      `/content/exports/${exportId}/status`
    );
    
    if (statusTest.success) {
      results.passed++;
      const status = statusTest.data?.export?.status;
      console.log(`   Export status: ${status}`);
    } else {
      results.failed++;
    }
  }
  console.log('');

  // Test 7: Bulk Export
  results.total++;
     const bulkExportOptions = {
     projectIds: [testProjectId],
     exportType: 'image',
     options: {
       format: 'png',
       quality: 'medium',
       dimensions: { width: 1280, height: 720 }
     }
   };
  
  const bulkExportTest = await testEndpoint(
    'Bulk Export',
    '/content/projects/bulk-export',
    'POST',
    bulkExportOptions
  );
  
  if (bulkExportTest.success) {
    results.passed++;
    console.log(`   Started bulk export for ${bulkExportOptions.projectIds.length} projects`);
  } else {
    results.failed++;
  }
  console.log('');

  // Test 8: OptiSigns Integration - Get Available Displays
  results.total++;
  const getDisplaysTest = await testEndpoint(
    'Get Available Displays',
    '/optisigns/displays'
  );
  
  if (getDisplaysTest.success) {
    results.passed++;
    console.log(`   Found ${getDisplaysTest.data?.displays?.length || 0} displays`);
  } else {
    results.failed++;
  }
  console.log('');

  // Test 9: Get OptiSigns Status
  results.total++;
  const optiSignsStatusTest = await testEndpoint(
    'Get OptiSigns Status',
    `/content/projects/${testProjectId}/optisigns-status`
  );
  
  if (optiSignsStatusTest.success) {
    results.passed++;
    const status = optiSignsStatusTest.data?.status?.status || 'not_published';
    console.log(`   OptiSigns status: ${status}`);
  } else {
    results.failed++;
  }
  console.log('');

  // Test 10: Test Project Preview
  results.total++;
  const previewOptions = {
    contextData: {
      lead: {
        name: 'John Doe',
        email: 'john@example.com'
      },
      tenant: {
        name: 'Test Company'
      }
    }
  };
  
  const previewTest = await testEndpoint(
    'Generate Project Preview',
    `/content/projects/${testProjectId}/preview`,
    'POST',
    previewOptions
  );
  
  if (previewTest.success) {
    results.passed++;
    console.log('   Preview generated successfully');
  } else {
    results.failed++;
  }
  console.log('');

  // Cleanup: Delete test exports
  console.log('🧹 Cleaning up test data...');
  for (const exportId of [imageExportId, pdfExportId, htmlExportId].filter(Boolean)) {
    await testEndpoint(
      `Delete Export (${exportId})`,
      `/content/exports/${exportId}`,
      'DELETE'
    );
  }

  // Cleanup: Delete test project
  await testEndpoint(
    'Delete Test Project',
    `/content/projects/${testProjectId}`,
    'DELETE'
  );
  console.log('');

  // Summary
  console.log('📊 Test Summary');
  console.log('================');
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  
  if (results.failed === 0) {
    console.log('🎉 All import/export tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Check the output above for details.');
  }
}

// Run the tests
if (require.main === module) {
  runImportExportTests().catch(console.error);
}

module.exports = { runImportExportTests }; 