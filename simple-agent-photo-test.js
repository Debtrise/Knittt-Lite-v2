const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

// Configuration - using the same server as your working endpoints test
const BASE_URL = 'http://34.122.156.88:3001/api';
const LOGIN_URL = 'http://34.122.156.88:3001/api/login';
const LOGIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

// Test image path
const TEST_IMAGE_PATH = './loading-icon.png';

// Test agent data - using timestamp to ensure unique email
const timestamp = Date.now();
const TEST_AGENT = {
  email: `test.agent.${timestamp}@company.com`,
  name: `Test Agent ${timestamp}`
};

let jwtToken = null;

/**
 * Step 1: Login and get JWT token
 */
async function loginAndGetToken() {
  console.log('🔐 STEP 1: Authenticating...');
  console.log(`📍 Login URL: ${LOGIN_URL}`);
  console.log(`👤 Username: ${LOGIN_CREDENTIALS.username}`);
  
  try {
    const response = await axios.post(LOGIN_URL, LOGIN_CREDENTIALS, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data && response.data.token) {
      jwtToken = response.data.token;
      console.log('✅ Authentication successful!');
      console.log(`🎫 JWT Token: ${jwtToken.substring(0, 50)}...`);
      console.log(`👤 User ID: ${response.data.userId}`);
      console.log(`🏢 Tenant ID: ${response.data.tenantId || 'N/A'}`);
      console.log(`🎭 Role: ${response.data.role || 'N/A'}`);
      return jwtToken;
    } else {
      console.log('❌ Authentication failed: No token in response');
      return null;
    }
  } catch (error) {
    console.log('❌ Authentication failed:');
    console.log(`   Status: ${error.response?.status || 'Unknown'}`);
    console.log(`   Error: ${error.response?.data?.error || error.message}`);
    if (error.response?.data) {
      console.log(`   Full response:`, JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

/**
 * Step 2: Upload agent photo
 */
async function uploadAgentPhoto(token, agentEmail, agentName, imagePath) {
  console.log('\n📸 STEP 2: Uploading agent photo...');
  console.log(`👤 Agent: ${agentName} (${agentEmail})`);
  console.log(`🖼️ Image: ${imagePath}`);
  
  // Check if image exists
  if (!fs.existsSync(imagePath)) {
    console.log(`❌ Image file not found: ${imagePath}`);
    return false;
  }
  
  // Get image stats
  const imageStats = fs.statSync(imagePath);
  console.log(`📏 Image size: ${(imageStats.size / 1024).toFixed(2)} KB`);
  
  try {
    // Create FormData
    const formData = new FormData();
    formData.append('photo', fs.createReadStream(imagePath), {
      filename: 'agent-photo.png',
      contentType: 'image/png'
    });
    formData.append('repEmail', agentEmail);
    formData.append('repName', agentName);
    
    const uploadUrl = `${BASE_URL}/sales-rep-photos/upload`;
    console.log(`📤 Upload URL: ${uploadUrl}`);
    
    const response = await axios.post(uploadUrl, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      }
    });
    
    if (response.status === 200 || response.status === 201) {
      console.log('✅ Photo upload successful!');
      console.log('📊 Response data:');
      console.log(JSON.stringify(response.data, null, 2));
      
             if (response.data.photo || response.data.asset) {
         const photoData = response.data.photo || response.data.asset;
         console.log(`🆔 Photo ID: ${photoData.id}`);
         console.log(`📧 Agent Email: ${photoData.repEmail}`);
         console.log(`👤 Agent Name: ${photoData.repName}`);
         console.log(`📁 File Name: ${photoData.fileName || 'N/A'}`);
         console.log(`💾 File Size: ${photoData.fileSize} bytes`);
         console.log(`🕒 Uploaded At: ${photoData.uploadedAt || 'N/A'}`);
         if (photoData.url) {
           console.log(`🔗 Photo URL: ${photoData.url}`);
         }
         if (photoData.thumbnailUrl) {
           console.log(`🖼️ Thumbnail URL: ${photoData.thumbnailUrl}`);
         }
       }
      
      return true;
    } else {
      console.log(`❌ Upload failed with status: ${response.status}`);
      return false;
    }
    
  } catch (error) {
    console.log('❌ Photo upload failed:');
    console.log(`   Status: ${error.response?.status || 'Unknown'}`);
    console.log(`   Error: ${error.response?.data?.error || error.message}`);
    
    if (error.response?.status === 409) {
      console.log('💡 Tip: Photo already exists for this email. Try with replace=true or different email.');
    }
    
    if (error.response?.data) {
      console.log('📄 Full error response:');
      console.log(JSON.stringify(error.response.data, null, 2));
    }
    
    return false;
  }
}

/**
 * Step 3: Verify upload by retrieving the photo
 */
async function verifyUpload(token, agentEmail) {
  console.log('\n🔍 STEP 3: Verifying upload...');
  console.log(`👤 Looking up photo for: ${agentEmail}`);
  
  // Try the sales-rep-photos endpoint first
  try {
    const lookupUrl = `${BASE_URL}/sales-rep-photos/by-email/${encodeURIComponent(agentEmail)}`;
    console.log(`🔍 Lookup URL: ${lookupUrl}`);
    
    const response = await axios.get(lookupUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200) {
      console.log('✅ Photo found in sales-rep-photos endpoint!');
      console.log('📊 Photo details:');
      console.log(JSON.stringify(response.data, null, 2));
      return true;
    }
    
  } catch (error) {
    console.log('❌ Sales-rep-photos lookup failed:');
    console.log(`   Status: ${error.response?.status || 'Unknown'}`);
    console.log(`   Error: ${error.response?.data?.error || error.message}`);
  }
  
  // Try the content/assets endpoint as fallback
  try {
    console.log('\n🔍 Trying content/assets endpoint...');
    const assetsUrl = `${BASE_URL}/content/assets`;
    console.log(`🔍 Assets URL: ${assetsUrl}`);
    
    const response = await axios.get(assetsUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200 && response.data.assets) {
      // Look for our uploaded photo by checking the email in tags or metadata
      const ourPhoto = response.data.assets.find(asset => 
        asset.tags?.some(tag => tag.includes(agentEmail)) ||
        asset.name?.includes('Test Agent') ||
        asset.originalName === 'agent-photo.png'
      );
      
      if (ourPhoto) {
        console.log('✅ Photo found in content/assets endpoint!');
        console.log('📊 Photo details:');
        console.log(JSON.stringify(ourPhoto, null, 2));
        return true;
      } else {
        console.log('⚠️ Content/assets endpoint working but our photo not found');
        console.log(`📊 Found ${response.data.assets.length} assets total`);
        if (response.data.assets.length > 0) {
          console.log('📋 Recent assets:');
          response.data.assets.slice(0, 3).forEach((asset, i) => {
            console.log(`   ${i + 1}. ${asset.name} (${asset.originalName})`);
          });
        }
      }
    }
    
  } catch (error) {
    console.log('❌ Content/assets lookup also failed:');
    console.log(`   Status: ${error.response?.status || 'Unknown'}`);
    console.log(`   Error: ${error.response?.data?.error || error.message}`);
  }
  
  console.log('❌ Photo verification failed on both endpoints');
  return false;
}

/**
 * Main function to run the complete test
 */
async function runSimpleTest() {
  console.log('🚀 STARTING SIMPLE AGENT PHOTO UPLOAD TEST');
  console.log('=' .repeat(60));
  console.log(`📍 Server: ${BASE_URL}`);
  console.log(`🖼️ Test Image: ${TEST_IMAGE_PATH}`);
  console.log(`👤 Test Agent: ${TEST_AGENT.name} (${TEST_AGENT.email})`);
  console.log('=' .repeat(60));
  
  let success = false;
  
  try {
    // Step 1: Login
    const token = await loginAndGetToken();
    if (!token) {
      console.log('\n❌ FAILED: Could not authenticate');
      return;
    }
    
    // Step 2: Upload photo
    const uploadSuccess = await uploadAgentPhoto(
      token, 
      TEST_AGENT.email, 
      TEST_AGENT.name, 
      TEST_IMAGE_PATH
    );
    
    if (!uploadSuccess) {
      console.log('\n❌ FAILED: Could not upload photo');
      return;
    }
    
    // Step 3: Verify upload
    const verifySuccess = await verifyUpload(token, TEST_AGENT.email);
    
    if (verifySuccess) {
      success = true;
      console.log('\n✅ SUCCESS: All steps completed successfully!');
    } else {
      console.log('\n⚠️ PARTIAL SUCCESS: Upload completed but verification failed');
    }
    
  } catch (error) {
    console.log('\n💥 UNEXPECTED ERROR:', error.message);
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log(`🏁 TEST COMPLETED - ${success ? 'SUCCESS' : 'FAILED'}`);
  console.log('=' .repeat(60));
}

/**
 * Simple login-only test
 */
async function testLoginOnly() {
  console.log('🔐 TESTING LOGIN ONLY');
  console.log('=' .repeat(40));
  
  const token = await loginAndGetToken();
  
  if (token) {
    console.log('\n✅ LOGIN TEST PASSED');
    console.log(`🎫 Token received: ${token.length} characters`);
  } else {
    console.log('\n❌ LOGIN TEST FAILED');
  }
  
  console.log('=' .repeat(40));
  return token;
}

// Export functions for use in other scripts
module.exports = {
  loginAndGetToken,
  uploadAgentPhoto,
  verifyUpload,
  runSimpleTest,
  testLoginOnly
};

// Run the test if this script is executed directly
if (require.main === module) {
  // Check command line arguments
  const args = process.argv.slice(2);
  
  if (args.includes('--login-only')) {
    testLoginOnly().catch(console.error);
  } else {
    runSimpleTest().catch(console.error);
  }
} 