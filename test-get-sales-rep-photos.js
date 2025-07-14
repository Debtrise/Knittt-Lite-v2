// Use built-in fetch for Node.js 18+
const fetch = globalThis.fetch || require('node-fetch');

// Test configuration
const API_BASE_URL = 'http://34.122.156.88:3001/api';

// Authentication
let authToken = null;

// Helper function to make HTTP requests
async function makeRequest(endpoint, method = 'GET', body = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {}
  };

  // Add authentication token if available
  if (authToken) {
    options.headers['Authorization'] = `Bearer ${authToken}`;
  }

  if (body) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
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

// Test GET /api/sales-rep-photos
async function testGetSalesRepPhotos() {
  console.log('\n' + '='.repeat(60));
  console.log('📸 TESTING GET /api/sales-rep-photos');
  console.log('='.repeat(60));

  // Test 1: Get all photos
  console.log('\n📋 Test 1: Get all sales rep photos');
  const allPhotosResult = await makeRequest('/sales-rep-photos');
  
  if (allPhotosResult.success) {
    const photos = allPhotosResult.data.assets || [];
    console.log(`📊 Found ${photos.length} sales rep photos`);
    
    if (photos.length > 0) {
      console.log('📝 Sample photo data:');
      console.log(`   - ID: ${photos[0].id}`);
      console.log(`   - Name: ${photos[0].name}`);
      console.log(`   - Email: ${photos[0].repEmail}`);
      console.log(`   - Rep Name: ${photos[0].repName}`);
      console.log(`   - Upload Date: ${photos[0].uploadedAt}`);
      console.log(`   - File Size: ${photos[0].fileSize} bytes`);
    }
  }

  // Test 2: Get photos with pagination
  console.log('\n📋 Test 2: Get photos with pagination (limit=2)');
  const paginatedResult = await makeRequest('/sales-rep-photos?limit=2');
  
  if (paginatedResult.success) {
    const pagination = paginatedResult.data.pagination;
    console.log('📊 Pagination info:');
    console.log(`   - Current Page: ${pagination.currentPage}`);
    console.log(`   - Total Pages: ${pagination.totalPages}`);
    console.log(`   - Total Count: ${pagination.totalCount}`);
    console.log(`   - Has Next Page: ${pagination.hasNextPage}`);
    console.log(`   - Has Previous Page: ${pagination.hasPrevPage}`);
  }

  // Test 3: Search photos
  console.log('\n📋 Test 3: Search photos (search=john)');
  const searchResult = await makeRequest('/sales-rep-photos?search=john');
  
  if (searchResult.success) {
    const searchPhotos = searchResult.data.assets || [];
    console.log(`📊 Found ${searchPhotos.length} photos matching "john"`);
  }

  // Test 4: Get photos with different page
  console.log('\n📋 Test 4: Get second page of photos');
  const page2Result = await makeRequest('/sales-rep-photos?page=2&limit=3');
  
  if (page2Result.success) {
    const page2Photos = page2Result.data.assets || [];
    console.log(`📊 Found ${page2Photos.length} photos on page 2`);
  }

  // Test 5: Test invalid parameters
  console.log('\n📋 Test 5: Test with invalid page number');
  const invalidPageResult = await makeRequest('/sales-rep-photos?page=999');
  
  if (invalidPageResult.success) {
    const invalidPhotos = invalidPageResult.data.assets || [];
    console.log(`📊 Found ${invalidPhotos.length} photos on page 999 (should be empty)`);
  }

  return {
    allPhotos: allPhotosResult,
    paginated: paginatedResult,
    search: searchResult,
    page2: page2Result,
    invalidPage: invalidPageResult
  };
}

// Main test runner
async function runTest() {
  console.log('🚀 Testing GET /api/sales-rep-photos Endpoint');
  console.log('=' .repeat(60));

  try {
    // First, login to get auth token
    const loginSuccess = await login();
    if (!loginSuccess) {
      console.log('❌ Cannot proceed without authentication token');
      return;
    }

    // Test the endpoint
    const results = await testGetSalesRepPhotos();

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));

    const tests = [
      { name: 'Get All Photos', result: results.allPhotos },
      { name: 'Paginated Photos', result: results.paginated },
      { name: 'Search Photos', result: results.search },
      { name: 'Page 2 Photos', result: results.page2 },
      { name: 'Invalid Page', result: results.invalidPage }
    ];

    let passed = 0;
    tests.forEach(test => {
      const status = test.result.success ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${test.name} (${test.result.status})`);
      if (test.result.success) passed++;
    });

    console.log(`\n🎯 Overall: ${passed}/${tests.length} tests passed`);

    if (passed === tests.length) {
      console.log('🎉 All tests passed! GET /api/sales-rep-photos is working correctly.');
    } else {
      console.log('⚠️ Some tests failed. Check the details above.');
    }

  } catch (error) {
    console.error('💥 Test runner failed:', error);
  }
}

// Run the test
runTest(); 