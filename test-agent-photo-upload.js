const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

// Configuration - using the same server as your working endpoints test
const BASE_URL = 'http://34.122.156.88:3001/api';
const LOGIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

// Test image path
const TEST_IMAGE_PATH = './loading-icon.png';

let jwtToken = null;

// Test data for agent photos
const testAgents = [
  { email: 'john.doe@company.com', name: 'John Doe' },
  { email: 'jane.smith@company.com', name: 'Jane Smith' },
  { email: 'mike.johnson@company.com', name: 'Mike Johnson' }
];

let testResults = [];
let createdPhotoIds = [];

async function getJWTToken() {
  if (jwtToken) return jwtToken;
  
  try {
    console.log('🔐 Authenticating with admin credentials...');
    const response = await axios.post('http://34.122.156.88:3001/api/login', LOGIN_CREDENTIALS);
    jwtToken = response.data.token;
    console.log('✅ Successfully authenticated');
    console.log(`🎫 JWT Token: ${jwtToken.substring(0, 50)}...`);
    return jwtToken;
  } catch (error) {
    console.error('❌ Failed to authenticate:', error.response?.data || error.message);
    return null;
  }
}

async function makeAuthenticatedRequest(endpoint, method = 'GET', data = null, isFormData = false) {
  const token = await getJWTToken();
  if (!token) {
    return { success: false, error: 'Failed to get JWT token' };
  }

  const config = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  };

  if (data) {
    if (isFormData) {
      // For FormData, let axios set the Content-Type automatically
      config.data = data;
    } else {
      config.headers['Content-Type'] = 'application/json';
      config.data = data;
    }
  }

  try {
    console.log(`\n🔄 ${method} ${endpoint}`);
    const startTime = Date.now();
    const response = await axios(config);
    const responseTime = Date.now() - startTime;
    
    const result = {
      success: true,
      status: response.status,
      responseTime,
      data: response.data
    };

    console.log(`✅ Success (${response.status}) - ${responseTime}ms`);
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    
    return result;
  } catch (error) {
    const result = {
      success: false,
      status: error.response?.status || 0,
      error: error.response?.data?.error || error.message,
      fullError: error.response?.data || error.message
    };

    console.log(`❌ Failed (${result.status}): ${result.error}`);
    if (error.response?.data) {
      console.log('📄 Full error response:', JSON.stringify(error.response.data, null, 2));
    }
    
    return result;
  }
}

function createAgentPhotoFormData(imagePath, agentEmail, agentName, replace = false) {
  try {
    if (!fs.existsSync(imagePath)) {
      console.log(`❌ Test image not found at ${imagePath}`);
      return null;
    }

    const formData = new FormData();
    const imageStream = fs.createReadStream(imagePath);
    
    formData.append('photo', imageStream, {
      filename: path.basename(imagePath),
      contentType: 'image/png'
    });
    formData.append('repEmail', agentEmail);
    if (agentName) formData.append('repName', agentName);
    if (replace) formData.append('replace', 'true');
    
    return formData;
  } catch (error) {
    console.error('Error creating form data:', error);
    return null;
  }
}

async function testSingleAgentPhotoUpload() {
  console.log('\n' + '='.repeat(70));
  console.log('📸 TESTING SINGLE AGENT PHOTO UPLOAD');
  console.log('='.repeat(70));

  const agent = testAgents[0];
  console.log(`👤 Testing upload for: ${agent.name} (${agent.email})`);
  
  const formData = createAgentPhotoFormData(TEST_IMAGE_PATH, agent.email, agent.name);
  if (!formData) {
    testResults.push({
      category: 'Single Upload',
      test: 'Upload agent photo',
      success: false,
      error: 'Failed to create form data'
    });
    return;
  }

  const result = await makeAuthenticatedRequest('/sales-rep-photos/upload', 'POST', formData, true);
  testResults.push({
    category: 'Single Upload',
    test: 'Upload agent photo',
    agent: agent.email,
    ...result
  });

  if (result.success && result.data.photo) {
    createdPhotoIds.push(result.data.photo.id);
    console.log(`✅ Photo uploaded successfully with ID: ${result.data.photo.id}`);
  }
}

async function testDuplicateUploadPrevention() {
  console.log('\n' + '='.repeat(70));
  console.log('🔄 TESTING DUPLICATE UPLOAD PREVENTION');
  console.log('='.repeat(70));

  const agent = testAgents[0]; // Same agent as previous test
  console.log(`👤 Attempting duplicate upload for: ${agent.name} (${agent.email})`);
  
  const formData = createAgentPhotoFormData(TEST_IMAGE_PATH, agent.email, agent.name);
  if (!formData) return;

  const result = await makeAuthenticatedRequest('/sales-rep-photos/upload', 'POST', formData, true);
  testResults.push({
    category: 'Duplicate Prevention',
    test: 'Upload duplicate (should fail)',
    agent: agent.email,
    expectedToFail: true,
    ...result
  });

  if (!result.success && result.status === 409) {
    console.log('✅ Duplicate prevention working correctly (409 Conflict)');
  }
}

async function testReplaceAgentPhoto() {
  console.log('\n' + '='.repeat(70));
  console.log('🔄 TESTING REPLACE EXISTING AGENT PHOTO');
  console.log('='.repeat(70));

  const agent = testAgents[0];
  console.log(`👤 Testing replace for: ${agent.name} (${agent.email})`);
  
  const formData = createAgentPhotoFormData(TEST_IMAGE_PATH, agent.email, agent.name + ' Updated', true);
  if (!formData) return;

  const result = await makeAuthenticatedRequest('/sales-rep-photos/upload', 'POST', formData, true);
  testResults.push({
    category: 'Replace Upload',
    test: 'Replace existing photo',
    agent: agent.email,
    ...result
  });

  if (result.success) {
    console.log('✅ Photo replacement successful');
  }
}

async function testBulkAgentPhotoUpload() {
  console.log('\n' + '='.repeat(70));
  console.log('📚 TESTING BULK AGENT PHOTO UPLOAD');
  console.log('='.repeat(70));

  if (!fs.existsSync(TEST_IMAGE_PATH)) {
    console.log(`❌ Test image not found at ${TEST_IMAGE_PATH}`);
    return;
  }

  const remainingAgents = testAgents.slice(1); // Skip first one already uploaded
  console.log(`👥 Testing bulk upload for ${remainingAgents.length} agents`);

  const formData = new FormData();
  
  try {
    const mappings = remainingAgents.map((agent, index) => {
      const fileName = `agent_photo_${index + 1}.png`;
      const imageStream = fs.createReadStream(TEST_IMAGE_PATH);
      
      formData.append('photos', imageStream, {
        filename: fileName,
        contentType: 'image/png'
      });
      
      return {
        filename: fileName,
        email: agent.email,
        name: agent.name
      };
    });
    
    formData.append('mappings', JSON.stringify(mappings));
    
    const result = await makeAuthenticatedRequest('/sales-rep-photos/bulk-upload', 'POST', formData, true);
    testResults.push({
      category: 'Bulk Upload',
      test: 'Upload multiple agent photos',
      agents: remainingAgents.map(a => a.email),
      ...result
    });

    if (result.success && result.data.results?.successful) {
      result.data.results.successful.forEach(item => {
        if (item.photoId) {
          createdPhotoIds.push(item.photoId);
        }
      });
      console.log(`✅ Bulk upload successful: ${result.data.results.successful.length} photos uploaded`);
    }
  } catch (error) {
    console.error('Error in bulk upload test:', error);
    testResults.push({
      category: 'Bulk Upload',
      test: 'Upload multiple agent photos',
      success: false,
      error: error.message
    });
  }
}

async function testGetAgentPhotos() {
  console.log('\n' + '='.repeat(70));
  console.log('📋 TESTING GET AGENT PHOTOS');
  console.log('='.repeat(70));

  const result = await makeAuthenticatedRequest('/sales-rep-photos');
  testResults.push({
    category: 'Get Photos',
    test: 'Get all agent photos',
    ...result
  });

  if (result.success) {
    console.log(`✅ Retrieved ${result.data.photos?.length || 0} agent photos`);
  }
}

async function testGetAgentPhotoByEmail() {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 TESTING GET AGENT PHOTO BY EMAIL');
  console.log('='.repeat(70));

  const agent = testAgents[0];
  console.log(`👤 Looking up photo for: ${agent.email}`);
  
  const result = await makeAuthenticatedRequest(`/sales-rep-photos/by-email/${encodeURIComponent(agent.email)}`);
  testResults.push({
    category: 'Get Photo by Email',
    test: 'Get agent photo by email',
    agent: agent.email,
    ...result
  });

  if (result.success) {
    console.log('✅ Successfully retrieved agent photo by email');
  }
}

async function testValidation() {
  console.log('\n' + '='.repeat(70));
  console.log('✅ TESTING INPUT VALIDATION');
  console.log('='.repeat(70));

  // Test upload without email
  console.log('📝 Testing upload without email...');
  const formDataNoEmail = new FormData();
  const imageStream = fs.createReadStream(TEST_IMAGE_PATH);
  formDataNoEmail.append('photo', imageStream, {
    filename: 'test.png',
    contentType: 'image/png'
  });

  const noEmailResult = await makeAuthenticatedRequest('/sales-rep-photos/upload', 'POST', formDataNoEmail, true);
  testResults.push({
    category: 'Validation',
    test: 'Upload without email (should fail)',
    expectedToFail: true,
    ...noEmailResult
  });

  // Test upload with invalid email
  console.log('📝 Testing upload with invalid email...');
  const formDataInvalidEmail = new FormData();
  const imageStream2 = fs.createReadStream(TEST_IMAGE_PATH);
  formDataInvalidEmail.append('photo', imageStream2, {
    filename: 'test.png',
    contentType: 'image/png'
  });
  formDataInvalidEmail.append('repEmail', 'invalid-email');

  const invalidEmailResult = await makeAuthenticatedRequest('/sales-rep-photos/upload', 'POST', formDataInvalidEmail, true);
  testResults.push({
    category: 'Validation',
    test: 'Upload with invalid email (should fail)',
    expectedToFail: true,
    ...invalidEmailResult
  });
}

async function testFallbackPhoto() {
  console.log('\n' + '='.repeat(70));
  console.log('🖼️ TESTING FALLBACK PHOTO FUNCTIONALITY');
  console.log('='.repeat(70));

  // Test setting fallback photo
  console.log('📝 Testing set fallback photo...');
  const formData = new FormData();
  const imageStream = fs.createReadStream(TEST_IMAGE_PATH);
  formData.append('photo', imageStream, {
    filename: 'fallback.png',
    contentType: 'image/png'
  });

  const setResult = await makeAuthenticatedRequest('/sales-rep-photos/fallback', 'POST', formData, true);
  testResults.push({
    category: 'Fallback Photo',
    test: 'Set fallback photo',
    ...setResult
  });

  // Test getting fallback photo
  console.log('📝 Testing get fallback photo...');
  const getResult = await makeAuthenticatedRequest('/sales-rep-photos/fallback');
  testResults.push({
    category: 'Fallback Photo',
    test: 'Get fallback photo',
    ...getResult
  });
}

function printTestSummary() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80));

  const categories = [...new Set(testResults.map(r => r.category))];
  
  categories.forEach(category => {
    console.log(`\n🔹 ${category}`);
    const categoryTests = testResults.filter(r => r.category === category);
    
    categoryTests.forEach(test => {
      const status = test.expectedToFail 
        ? (!test.success ? '✅ EXPECTED FAIL' : '❌ SHOULD HAVE FAILED')
        : (test.success ? '✅ PASS' : '❌ FAIL');
      
      console.log(`   ${status} ${test.test}`);
      if (test.agent) console.log(`      Agent: ${test.agent}`);
      if (!test.success && !test.expectedToFail) {
        console.log(`      Error: ${test.error}`);
      }
      if (test.responseTime) {
        console.log(`      Response Time: ${test.responseTime}ms`);
      }
    });
  });

  // Overall stats
  const totalTests = testResults.length;
  const passedTests = testResults.filter(r => 
    r.expectedToFail ? !r.success : r.success
  ).length;
  const failedTests = totalTests - passedTests;

  console.log(`\n📈 OVERALL RESULTS:`);
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   Passed: ${passedTests}`);
  console.log(`   Failed: ${failedTests}`);
  console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (createdPhotoIds.length > 0) {
    console.log(`\n📸 Created Agent Photos: ${createdPhotoIds.length}`);
    console.log(`   IDs: ${createdPhotoIds.join(', ')}`);
  }
}

async function runAllAgentPhotoTests() {
  console.log('🚀 STARTING COMPREHENSIVE AGENT PHOTO UPLOAD TESTS');
  console.log('=' .repeat(80));
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`🖼️ Test Image: ${TEST_IMAGE_PATH}`);
  console.log('=' .repeat(80));

  // Check if test image exists
  if (!fs.existsSync(TEST_IMAGE_PATH)) {
    console.log(`❌ Test image not found at ${TEST_IMAGE_PATH}`);
    console.log('💡 Please ensure the test image exists before running tests');
    return;
  }

  // Authenticate first
  const token = await getJWTToken();
  if (!token) {
    console.log('❌ Authentication failed. Cannot proceed with tests.');
    return;
  }

  try {
    // Run all tests in sequence
    await testSingleAgentPhotoUpload();
    await testDuplicateUploadPrevention();
    await testReplaceAgentPhoto();
    await testBulkAgentPhotoUpload();
    await testGetAgentPhotos();
    await testGetAgentPhotoByEmail();
    await testValidation();
    await testFallbackPhoto();

  } catch (error) {
    console.error('💥 Unexpected error during testing:', error);
  }

  // Print final summary
  printTestSummary();
  
  console.log('\n' + '='.repeat(80));
  console.log('🏁 AGENT PHOTO UPLOAD TESTS COMPLETED');
  console.log('='.repeat(80));
}

// Run the tests
if (require.main === module) {
  runAllAgentPhotoTests().catch(console.error);
}

module.exports = {
  getJWTToken,
  makeAuthenticatedRequest,
  testSingleAgentPhotoUpload,
  runAllAgentPhotoTests
}; 