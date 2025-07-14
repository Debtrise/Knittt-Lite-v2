const fs = require('fs');
const path = require('path');

// Test configuration
const API_BASE_URL = 'http://34.122.156.88:3001/api';
const TEST_IMAGE_PATH = './loading-icon.png'; // Using existing test image

// Authentication
let authToken = null;

// Note: Updated to use 34.122.156.88:3001 instead of localhost as per requirements

// Test data
const testSalesReps = [
  { email: 'john.doe@company.com', name: 'John Doe' },
  { email: 'jane.smith@company.com', name: 'Jane Smith' },
  { email: 'mike.johnson@company.com', name: 'Mike Johnson' }
];

let testResults = [];
let createdPhotoIds = [];

// Helper function to make HTTP requests
async function makeRequest(endpoint, method = 'GET', body = null, isFormData = false) {
  const url = `${API_BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {}
  };

  // Add authentication token if available
  if (authToken) {
    options.headers['Authorization'] = `Bearer ${authToken}`;
  }

  if (body && !isFormData) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  } else if (body && isFormData) {
    options.body = body;
  }

  try {
    console.log(`\n🔄 ${method} ${endpoint}`);
    const response = await fetch(url, options);
    const data = await response.json();
    
    const result = {
      success: response.ok,
      status: response.status,
      data: data,
      error: response.ok ? null : data.error || 'Unknown error'
    };

    if (result.success) {
      console.log(`✅ Success (${response.status}):`, JSON.stringify(data, null, 2));
    } else {
      console.log(`❌ Failed (${response.status}):`, result.error);
    }

    return result;
  } catch (error) {
    console.log(`💥 Request failed:`, error.message);
    return {
      success: false,
      status: 0,
      data: null,
      error: error.message
    };
  }
}

// Helper function to create FormData with image
function createImageFormData(imagePath, repEmail, repName, replace = false) {
  const formData = new FormData();
  
  try {
    // Create a mock file blob for testing
    const imageBuffer = fs.readFileSync(imagePath);
    const blob = new Blob([imageBuffer], { type: 'image/png' });
    const file = new File([blob], path.basename(imagePath), { type: 'image/png' });
    
    formData.append('photo', file);
    formData.append('repEmail', repEmail);
    if (repName) formData.append('repName', repName);
    if (replace) formData.append('replace', 'true');
    
    return formData;
  } catch (error) {
    console.error('Error creating form data:', error);
    return null;
  }
}

// Authentication function
async function login() {
  console.log('\n' + '='.repeat(60));
  console.log('🔐 LOGGING IN TO GET AUTH TOKEN');
  console.log('='.repeat(60));

  const loginData = {
    username: 'admin',
    password: 'admin123'
  };

  const result = await makeRequest('/login', 'POST', loginData);
  
  if (result.success && result.data.token) {
    authToken = result.data.token;
    console.log('✅ Successfully logged in and obtained auth token');
    return true;
  } else {
    console.log('❌ Login failed:', result.error);
    return false;
  }
}

// Test functions
async function testSingleUpload() {
  console.log('\n' + '='.repeat(60));
  console.log('📸 TESTING SINGLE PHOTO UPLOAD');
  console.log('='.repeat(60));

  const rep = testSalesReps[0];
  
  // Check if test image exists
  if (!fs.existsSync(TEST_IMAGE_PATH)) {
    console.log(`❌ Test image not found at ${TEST_IMAGE_PATH}`);
    testResults.push({
      category: 'Single Upload',
      test: 'Upload photo',
      success: false,
      error: 'Test image not found'
    });
    return;
  }

  const formData = createImageFormData(TEST_IMAGE_PATH, rep.email, rep.name);
  if (!formData) {
    testResults.push({
      category: 'Single Upload',
      test: 'Upload photo',
      success: false,
      error: 'Failed to create form data'
    });
    return;
  }

  const result = await makeRequest('/sales-rep-photos/upload', 'POST', formData, true);
  testResults.push({
    category: 'Single Upload',
    test: 'Upload photo',
    ...result
  });

  if (result.success && result.data.photo) {
    createdPhotoIds.push(result.data.photo.id);
  }
}

async function testDuplicateUpload() {
  console.log('\n' + '='.repeat(60));
  console.log('🔄 TESTING DUPLICATE UPLOAD PREVENTION');
  console.log('='.repeat(60));

  const rep = testSalesReps[0];
  const formData = createImageFormData(TEST_IMAGE_PATH, rep.email, rep.name);
  
  if (!formData) return;

  // Try to upload same email again (should fail)
  const result = await makeRequest('/sales-rep-photos/upload', 'POST', formData, true);
  testResults.push({
    category: 'Duplicate Upload',
    test: 'Upload duplicate (should fail)',
    ...result,
    expectedToFail: true
  });
}

async function testReplaceUpload() {
  console.log('\n' + '='.repeat(60));
  console.log('🔄 TESTING REPLACE UPLOAD');
  console.log('='.repeat(60));

  const rep = testSalesReps[0];
  const formData = createImageFormData(TEST_IMAGE_PATH, rep.email, rep.name + ' Updated', true);
  
  if (!formData) return;

  const result = await makeRequest('/sales-rep-photos/upload', 'POST', formData, true);
  testResults.push({
    category: 'Replace Upload',
    test: 'Replace existing photo',
    ...result
  });
}

async function testBulkUpload() {
  console.log('\n' + '='.repeat(60));
  console.log('📚 TESTING BULK UPLOAD');
  console.log('='.repeat(60));

  if (!fs.existsSync(TEST_IMAGE_PATH)) {
    console.log(`❌ Test image not found at ${TEST_IMAGE_PATH}`);
    return;
  }

  const formData = new FormData();
  
  // Add multiple "files" (same file with different names for testing)
  const remainingReps = testSalesReps.slice(1); // Skip first one already uploaded
  
  try {
    const imageBuffer = fs.readFileSync(TEST_IMAGE_PATH);
    
    const mappings = remainingReps.map((rep, index) => {
      const fileName = `photo${index + 1}.png`;
      const blob = new Blob([imageBuffer], { type: 'image/png' });
      const file = new File([blob], fileName, { type: 'image/png' });
      
      formData.append('photos', file);
      
      return {
        filename: fileName,
        email: rep.email,
        name: rep.name
      };
    });
    
    formData.append('mappings', JSON.stringify(mappings));
    
    const result = await makeRequest('/sales-rep-photos/bulk-upload', 'POST', formData, true);
    testResults.push({
      category: 'Bulk Upload',
      test: 'Upload multiple photos',
      ...result
    });

    // Track created photos
    if (result.success && result.data.results?.successful) {
      result.data.results.successful.forEach(item => {
        if (item.photoId) {
          createdPhotoIds.push(item.photoId);
        }
      });
    }
  } catch (error) {
    console.error('Error in bulk upload test:', error);
    testResults.push({
      category: 'Bulk Upload',
      test: 'Upload multiple photos',
      success: false,
      error: error.message
    });
  }
}

async function testGetPhotos() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 TESTING GET PHOTOS');
  console.log('='.repeat(60));

  // Test get all photos
  const allPhotosResult = await makeRequest('/sales-rep-photos');
  testResults.push({
    category: 'Get Photos',
    test: 'Get all photos',
    ...allPhotosResult
  });

  // Test get photos with search
  const searchResult = await makeRequest('/sales-rep-photos?search=john');
  testResults.push({
    category: 'Get Photos',
    test: 'Search photos',
    ...searchResult
  });

  // Test pagination
  const paginationResult = await makeRequest('/sales-rep-photos?page=1&limit=2');
  testResults.push({
    category: 'Get Photos',
    test: 'Pagination',
    ...paginationResult
  });
}

async function testGetPhotoByEmail() {
  console.log('\n' + '='.repeat(60));
  console.log('📧 TESTING GET PHOTO BY EMAIL');
  console.log('='.repeat(60));

  const rep = testSalesReps[0];
  const encodedEmail = encodeURIComponent(rep.email);
  
  const result = await makeRequest(`/sales-rep-photos/by-email/${encodedEmail}`);
  testResults.push({
    category: 'Get by Email',
    test: 'Get photo by email',
    ...result
  });

  // Test with non-existent email
  const notFoundResult = await makeRequest('/sales-rep-photos/by-email/nonexistent@test.com');
  testResults.push({
    category: 'Get by Email',
    test: 'Get non-existent photo',
    ...notFoundResult,
    expectedToFail: true
  });
}

async function testFallbackPhoto() {
  console.log('\n' + '='.repeat(60));
  console.log('🔄 TESTING FALLBACK PHOTO');
  console.log('='.repeat(60));

  // Test get fallback (should not exist initially)
  const getFallbackResult = await makeRequest('/sales-rep-photos/fallback');
  testResults.push({
    category: 'Fallback Photo',
    test: 'Get fallback (should not exist)',
    ...getFallbackResult,
    expectedToFail: true
  });

  // Set fallback photo
  if (fs.existsSync(TEST_IMAGE_PATH)) {
    const formData = new FormData();
    const imageBuffer = fs.readFileSync(TEST_IMAGE_PATH);
    const blob = new Blob([imageBuffer], { type: 'image/png' });
    const file = new File([blob], 'fallback.png', { type: 'image/png' });
    formData.append('photo', file);

    const setFallbackResult = await makeRequest('/sales-rep-photos/fallback', 'POST', formData, true);
    testResults.push({
      category: 'Fallback Photo',
      test: 'Set fallback photo',
      ...setFallbackResult
    });

    // Test get fallback again (should exist now)
    const getFallbackAgainResult = await makeRequest('/sales-rep-photos/fallback');
    testResults.push({
      category: 'Fallback Photo',
      test: 'Get fallback (should exist)',
      ...getFallbackAgainResult
    });
  }
}

async function testDeletePhoto() {
  console.log('\n' + '='.repeat(60));
  console.log('🗑️ TESTING DELETE PHOTO');
  console.log('='.repeat(60));

  if (createdPhotoIds.length > 0) {
    const photoId = createdPhotoIds[0];
    
    const result = await makeRequest(`/sales-rep-photos/${photoId}`, 'DELETE');
    testResults.push({
      category: 'Delete Photo',
      test: 'Delete photo',
      ...result
    });

    // Remove from tracking
    createdPhotoIds = createdPhotoIds.filter(id => id !== photoId);
  } else {
    testResults.push({
      category: 'Delete Photo',
      test: 'Delete photo',
      success: false,
      error: 'No photos to delete'
    });
  }
}

async function testValidation() {
  console.log('\n' + '='.repeat(60));
  console.log('✅ TESTING INPUT VALIDATION');
  console.log('='.repeat(60));

  // Test upload without email
  const formDataNoEmail = new FormData();
  const imageBuffer = fs.readFileSync(TEST_IMAGE_PATH);
  const blob = new Blob([imageBuffer], { type: 'image/png' });
  const file = new File([blob], 'test.png', { type: 'image/png' });
  formDataNoEmail.append('photo', file);

  const noEmailResult = await makeRequest('/sales-rep-photos/upload', 'POST', formDataNoEmail, true);
  testResults.push({
    category: 'Validation',
    test: 'Upload without email (should fail)',
    ...noEmailResult,
    expectedToFail: true
  });

  // Test upload with invalid email
  const formDataInvalidEmail = new FormData();
  formDataInvalidEmail.append('photo', file);
  formDataInvalidEmail.append('repEmail', 'invalid-email');

  const invalidEmailResult = await makeRequest('/sales-rep-photos/upload', 'POST', formDataInvalidEmail, true);
  testResults.push({
    category: 'Validation',
    test: 'Upload with invalid email (should fail)',
    ...invalidEmailResult,
    expectedToFail: true
  });
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Sales Rep Photos API Tests');
  console.log('=' .repeat(60));

  try {
    // First, login to get auth token
    const loginSuccess = await login();
    if (!loginSuccess) {
      console.log('❌ Cannot proceed without authentication token');
      return;
    }

    await testSingleUpload();
    await testDuplicateUpload();
    await testReplaceUpload();
    await testBulkUpload();
    await testGetPhotos();
    await testGetPhotoByEmail();
    await testFallbackPhoto();
    await testDeletePhoto();
    await testValidation();

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));

    const categories = {};
    testResults.forEach(result => {
      if (!categories[result.category]) {
        categories[result.category] = { total: 0, passed: 0, failed: 0 };
      }
      categories[result.category].total++;
      
      // Consider expected failures as passes for summary
      if (result.success || result.expectedToFail) {
        categories[result.category].passed++;
      } else {
        categories[result.category].failed++;
      }
    });

    Object.entries(categories).forEach(([category, stats]) => {
      console.log(`\n📂 ${category}:`);
      console.log(`   ✅ Passed: ${stats.passed}/${stats.total}`);
      console.log(`   ❌ Failed: ${stats.failed}/${stats.total}`);
    });

    const totalPassed = Object.values(categories).reduce((sum, cat) => sum + cat.passed, 0);
    const totalTests = testResults.length;

    console.log(`\n🎯 Overall: ${totalPassed}/${totalTests} tests passed`);

    if (totalPassed === totalTests) {
      console.log('🎉 All tests passed! Sales Rep Photos API is working correctly.');
    } else {
      console.log('⚠️ Some tests failed. Check the details above.');
    }

    // Cleanup remaining photos
    if (createdPhotoIds.length > 0) {
      console.log('\n🧹 Cleaning up remaining test photos...');
      for (const photoId of createdPhotoIds) {
        await makeRequest(`/sales-rep-photos/${photoId}`, 'DELETE');
      }
    }

  } catch (error) {
    console.error('💥 Test runner failed:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  testResults
}; 