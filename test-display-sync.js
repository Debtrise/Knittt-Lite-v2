const axios = require('axios');

const BASE_URL = 'http://34.122.156.88:3001/api/optisigns';
const LOGIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

const OPTISIGNS_TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJyM0NTQ2RLUWhTUFF6R0RwTiIsImNpZCI6Ik5hcXRxOVQ5Nm5QSFk2YjVaIiwiYWlkIjoicWh6UjRDUXlrTGRKd0RibjgiLCJpYXQiOjE3NTA2MjczMjEsImV4cCI6MTc1MDYzMDkyMSwiaXNzIjoicWh6UjRDUXlrTGRKd0RibjgifQ.qPFba1uihTQnSW4GI_qOOOtEKSFBm_P6AyegImqpOJa0Ry8TeFlKclRSUxF_IXLwx2Hw7LWaMRFklRPRzIyYfnFI2d-ORrAs0FjmHGV7REAFfAQoX6wscc86GCZ_qJHnekgGImV44kipeTM3VTZcOTKoRIN415VBXRueKAFoybkphv8lKQRFhUuOKPG4rmeZRpW1o-0hX7uUXlgn1_piC961S_-LtxN7gIa1jFcwJsw7JK4ptIEYXpApR4rrg9X-4T679EzJFZovSxOXhi6KNpBlTAnsfiMT09OWckbX7G5Ptrt7xyMPZuL2cA7MiqX7-PIzo0ZaLGPgZnA-IrytO29dgdOD3Ebq55zrOwXz1Dqfz_Xx79ryB1IRKo5zBsAUNzUe53SSMOpKHXo6k1Rf7hmXv7kMCn4jB6GRd9StnL7EzEkuxbDF_nZIfgpuP1__GWOWMKc_LNRfl0zrqWp2aUGo3TCJLXDGwQfmWkPwSDmmakBqt57AVPNDkHyEBWwOWAZC3Lb4IeeRoGH3VWvswoc_9iyP_N1OMVMIgTYi79f1QgdQDEUoBCxGXranB1efgIRaCprsh6xBlUF9hTadZOOGE0Lhsm8ob6W4c7vsJq-7Fbmm8o0B_0csWTf_FK5NVsaq6iQYIOHFiuUjIUNukvwWmbW_Z51IUA3bRVS0Xt0';

let jwtToken = null;

async function getJWTToken() {
  if (jwtToken) return jwtToken;
  
  try {
    const response = await axios.post('http://34.122.156.88:3001/api/login', LOGIN_CREDENTIALS);
    jwtToken = response.data.token;
    console.log('✅ Successfully authenticated with admin credentials');
    return jwtToken;
  } catch (error) {
    console.error('❌ Failed to authenticate:', error.response?.data || error.message);
    return null;
  }
}

async function makeRequest(method, endpoint, data = null) {
  const token = await getJWTToken();
  if (!token) {
    return { success: false, error: 'Failed to get JWT token' };
  }

  const config = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  if (data) {
    config.data = data;
  }

  try {
    const startTime = Date.now();
    const response = await axios(config);
    const responseTime = Date.now() - startTime;
    
    return {
      success: true,
      status: response.status,
      responseTime,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 0,
      error: error.response?.data?.error || error.message,
      fullError: error.response?.data || error.message
    };
  }
}

async function testDisplaySync() {
  console.log('📺 OPTISIGNS DISPLAY SYNC COMPREHENSIVE TEST');
  console.log('=' .repeat(70));
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`🔑 Using OptiSigns Token: ${OPTISIGNS_TOKEN.substring(0, 50)}...`);
  console.log('=' .repeat(70));

  // Step 1: Check current configuration
  console.log('\n🔧 STEP 1: Checking Current Configuration');
  console.log('-' .repeat(50));
  
  const configResult = await makeRequest('GET', '/config');
  if (configResult.success) {
    console.log('✅ Configuration retrieved successfully');
    console.log('📊 Configuration Details:');
    console.log(JSON.stringify(configResult.data, null, 2));
  } else {
    console.log(`❌ Failed to get configuration: ${configResult.error}`);
    return;
  }

  // Step 2: Test API connection first
  console.log('\n🔌 STEP 2: Testing OptiSigns API Connection');
  console.log('-' .repeat(50));
  
  const connectionResult = await makeRequest('POST', '/config/test', {
    apiToken: OPTISIGNS_TOKEN
  });
  
  if (connectionResult.success) {
    console.log('✅ OptiSigns API connection successful');
    console.log('📊 Connection Test Results:');
    console.log(JSON.stringify(connectionResult.data, null, 2));
    
    if (connectionResult.data.displayCount !== undefined) {
      console.log(`🎯 OptiSigns reports ${connectionResult.data.displayCount} displays available`);
    }
  } else {
    console.log(`❌ OptiSigns API connection failed: ${connectionResult.error}`);
    console.log('⚠️  This may affect display sync results');
  }

  // Step 3: Check displays before sync
  console.log('\n📋 STEP 3: Checking Displays Before Sync');
  console.log('-' .repeat(50));
  
  const displaysBefore = await makeRequest('GET', '/displays');
  if (displaysBefore.success) {
    console.log('✅ Successfully retrieved displays (before sync)');
    console.log('📊 Current Display Status:');
    console.log(JSON.stringify(displaysBefore.data, null, 2));
    console.log(`📈 Total displays in database: ${displaysBefore.data.displays?.length || 0}`);
  } else {
    console.log(`❌ Failed to get displays: ${displaysBefore.error}`);
  }

  // Step 4: Perform display sync
  console.log('\n🔄 STEP 4: Performing Display Sync');
  console.log('-' .repeat(50));
  
  console.log('🚀 Initiating display sync...');
  const syncResult = await makeRequest('POST', '/displays/sync');
  
  if (syncResult.success) {
    console.log('✅ Display sync completed successfully!');
    console.log('📊 Sync Results:');
    console.log(JSON.stringify(syncResult.data, null, 2));
    
    if (syncResult.data.displays) {
      console.log(`📈 Synced ${syncResult.data.displays.length} displays`);
      syncResult.data.displays.forEach((display, index) => {
        console.log(`   ${index + 1}. ${display.name || 'Unnamed'} (ID: ${display.id})`);
        console.log(`      OptiSigns ID: ${display.optisignsId || 'N/A'}`);
        console.log(`      Status: ${display.status || 'Unknown'}`);
        console.log(`      Online: ${display.isOnline ? 'Yes' : 'No'}`);
      });
    }
    
    if (syncResult.data.summary) {
      console.log('📋 Sync Summary:');
      console.log(`   Message: ${syncResult.data.summary.message || 'N/A'}`);
      console.log(`   Total: ${syncResult.data.summary.total || 0}`);
      console.log(`   New: ${syncResult.data.summary.new || 0}`);
      console.log(`   Updated: ${syncResult.data.summary.updated || 0}`);
    }
  } else {
    console.log(`❌ Display sync failed: ${syncResult.error}`);
    console.log('🔍 Full error details:');
    console.log(JSON.stringify(syncResult.fullError, null, 2));
  }

  // Step 5: Check displays after sync
  console.log('\n📋 STEP 5: Checking Displays After Sync');
  console.log('-' .repeat(50));
  
  const displaysAfter = await makeRequest('GET', '/displays');
  if (displaysAfter.success) {
    console.log('✅ Successfully retrieved displays (after sync)');
    console.log('📊 Updated Display Status:');
    console.log(JSON.stringify(displaysAfter.data, null, 2));
    console.log(`📈 Total displays in database: ${displaysAfter.data.displays?.length || 0}`);
    
    if (displaysAfter.data.displays && displaysAfter.data.displays.length > 0) {
      console.log('\n🎯 Available Displays for Testing:');
      displaysAfter.data.displays.forEach((display, index) => {
        console.log(`   ${index + 1}. Name: ${display.name || 'Unnamed'}`);
        console.log(`      UUID: ${display.id}`);
        console.log(`      OptiSigns ID: ${display.optisignsId || 'N/A'}`);
        console.log(`      Status: ${display.status || 'Unknown'}`);
        console.log(`      Location: ${display.location || 'N/A'}`);
        console.log(`      Last Seen: ${display.lastSeen || 'Never'}`);
        console.log('      ---');
      });
    } else {
      console.log('⚠️  No displays found after sync');
    }
  } else {
    console.log(`❌ Failed to get displays after sync: ${displaysAfter.error}`);
  }

  // Step 6: Debug connectivity
  console.log('\n🔍 STEP 6: Debug Connectivity Test');
  console.log('-' .repeat(50));
  
  const debugResult = await makeRequest('POST', '/debug/connectivity', {
    apiToken: OPTISIGNS_TOKEN
  });
  
  if (debugResult.success) {
    console.log('✅ Debug connectivity test successful');
    console.log('📊 Debug Results:');
    console.log(JSON.stringify(debugResult.data, null, 2));
  } else {
    console.log(`❌ Debug connectivity test failed: ${debugResult.error}`);
  }

  // Summary
  console.log('\n' + '=' .repeat(70));
  console.log('📋 DISPLAY SYNC TEST SUMMARY');
  console.log('=' .repeat(70));
  
  const beforeCount = displaysBefore.success ? (displaysBefore.data.displays?.length || 0) : 0;
  const afterCount = displaysAfter.success ? (displaysAfter.data.displays?.length || 0) : 0;
  
  console.log(`📊 Displays before sync: ${beforeCount}`);
  console.log(`📊 Displays after sync: ${afterCount}`);
  console.log(`📈 Net change: ${afterCount - beforeCount}`);
  
  if (connectionResult.success && connectionResult.data.displayCount !== undefined) {
    console.log(`🎯 OptiSigns API reports: ${connectionResult.data.displayCount} displays`);
    console.log(`🔄 Local database has: ${afterCount} displays`);
    
    if (connectionResult.data.displayCount > afterCount) {
      console.log('⚠️  Sync may not have captured all displays from OptiSigns');
    } else if (connectionResult.data.displayCount === afterCount) {
      console.log('✅ Sync appears to have captured all available displays');
    }
  }

  console.log('\n🎯 RECOMMENDATIONS:');
  if (afterCount === 0) {
    console.log('   • No displays were synced - check OptiSigns account for active displays');
    console.log('   • Verify OptiSigns API token has proper permissions');
    console.log('   • Check if displays exist in the OptiSigns dashboard');
  } else {
    console.log(`   • ${afterCount} display(s) available for testing display operations`);
    console.log('   • Use these display IDs for reboot/assign testing');
  }

  if (!syncResult.success) {
    console.log('   • Fix display sync errors to enable display management features');
  }

  console.log('\n🏁 Display sync test completed!');
}

// Run the display sync test
testDisplaySync().catch(console.error); 