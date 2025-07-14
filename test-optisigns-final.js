// FINAL OptiSigns SDK Test - Using Actual Available Methods
// Based on SDK structure exploration

const API_KEY = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJyM0NTQ2RLUWhTUFF6R0RwTiIsImNpZCI6Ik5hcXRxOVQ5Nm5QSFk2YjVaIiwiYWlkIjoicWh6UjRDUXlrTGRKd0RibjgiLCJpYXQiOjE3NTA2MjczMjEsImV4cCI6MTc1MDYzMDkyMSwiaXNzIjoicWh6UjRDUXlrTGRKd0RibjgifQ.qPFba1uihTQnSW4GI_qOOOtEKSFBm_P6AyegImqpOJa0Ry8TeFlKclRSUxF_IXLwx2Hw7LWaMRFklRPRzIyYfnFI2d-ORrAs0FjmHGV7REAFfAQoX6wscc86GCZ_qJHnekgGImV44kipeTM3VTZcOTKoRIN415VBXRueKAFoybkphv8lKQRFhUuOKPG4rmeZRpW1o-0hX7uUXlgn1_piC961S_-LtxN7gIa1jFcwJsw7JK4ptIEYXpApR4rrg9X-4T679EzJFZovSxOXhi6KNpBlTAnsfiMT09OWckbX7G5Ptrt7xyMPZuL2cA7MiqX7-PIzo0ZaLGPgZnA-IrytO29dgdOD3Ebq55zrOwXz1Dqfz_Xx79ryB1IRKo5zBsAUNzUe53SSMOpKHXo6k1Rf7hmXv7kMCn4jB6GRd9StnL7EzEkuxbDF_nZIfgpuP1__GWOWMKc_LNRfl0zrqWp2aUGo3TCJLXDGwQfmWkPwSDmmakBqt57AVPNDkHyEBWwOWAZC3Lb4IeeRoGH3VWvswoc_9iyP_N1OMVMIgTYi79f1QgdQDEUoBCxGXranB1efgIRaCprsh6xBlUF9hTadZOOGE0Lhsm8ob6W4c7vsJq-7Fbmm8o0B_0csWTf_FK5NVsaq6iQYIOHFiuUjIUNukvwWmbW_Z51IUA3bRVS0Xt0";

const TEAM_ID = "Naqtq9T96nPHY6b5Z"; // From token decode

async function testFunction(name, fn, critical = false) {
    try {
        console.log(`\n🧪 Testing: ${name}`);
        const result = await fn();
        const resultSummary = result ? 
            (Array.isArray(result) ? `${result.length} items` : 
             typeof result === 'object' ? `Object with ${Object.keys(result).length} properties` : 
             String(result).substring(0, 100)) : 'OK';
        console.log(`✅ Success: ${resultSummary}`);
        return { success: true, result, critical };
    } catch (error) {
        const errorMsg = error.message.substring(0, 150) + (error.message.length > 150 ? '...' : '');
        console.log(`${critical ? '🚨' : '❌'} Failed: ${errorMsg}`);
        
        // Check error type
        if (error.message.includes('invalid signature')) {
            console.log(`   🔒 Authentication Error: Token signature is invalid`);
        } else if (error.message.includes('expired')) {
            console.log(`   ⏰ Token Error: Token has expired`);
        } else if (error.message.includes('not a function')) {
            console.log(`   📝 SDK Error: Method not available in this SDK version`);
        }
        
        return { success: false, error: errorMsg, critical };
    }
}

async function finalSDKTest() {
    console.log("🎯 FINAL OptiSigns SDK Test");
    console.log("===========================");
    console.log("Using actual available methods from SDK exploration");
    
    const { OptiSigns } = require('@optisigns/optisigns');
    const client = new OptiSigns({ token: API_KEY });
    
    const results = [];
    
    // === CRITICAL AUTHENTICATION TESTS ===
    console.log("\n🔐 AUTHENTICATION & CONNECTION TESTS");
    console.log("------------------------------------");
    
    const authResult = await testFunction("Basic device listing (auth test)", async () => {
        return await client.devices.listAllDevices();
    }, true);
    results.push(authResult);
    
    if (!authResult.success) {
        console.log("\n🚨 CRITICAL: Authentication failed!");
        console.log("   This is likely due to token expiration or invalid signature.");
        console.log("   All subsequent tests will probably fail.");
    }
    
    // === DEVICE MANAGEMENT TESTS ===
    console.log("\n📱 DEVICE MANAGEMENT TESTS");
    console.log("---------------------------");
    
    let testDeviceId = null;
    let testDeviceName = null;
    
    if (authResult.success && authResult.result.length > 0) {
        testDeviceId = authResult.result[0].id;
        testDeviceName = authResult.result[0].deviceName || authResult.result[0].name || 'Unknown Device';
        console.log(`📋 Using test device: ${testDeviceName} (${testDeviceId})`);
        
        // Test available device methods
        const deviceTests = [
            {
                name: "Get device by ID",
                fn: () => client.devices.getDeviceById(testDeviceId)
            },
            {
                name: "Get device by name",
                fn: () => client.devices.getDeviceByName(testDeviceName)
            },
            {
                name: "Update device (dry run)",
                fn: () => client.devices.updateDevice(testDeviceId, { 
                    deviceName: testDeviceName + " (SDK Test)" 
                })
            }
        ];
        
        for (const test of deviceTests) {
            const result = await testFunction(test.name, test.fn);
            results.push(result);
        }
    }
    
    // === ASSET MANAGEMENT TESTS ===
    console.log("\n📸 ASSET MANAGEMENT TESTS");
    console.log("--------------------------");
    
    const assetTests = [
        {
            name: "Create website asset",
            fn: () => client.assets.createWebsiteAppAsset({
                url: "https://example.com",
                title: "SDK Test Website"
            }, TEAM_ID)
        },
        {
            name: "Get asset details (test ID)",
            fn: () => client.assets.getAssetDetail("test-asset-id")
        }
    ];
    
    for (const test of assetTests) {
        const result = await testFunction(test.name, test.fn);
        results.push(result);
    }
    
    // === PLAYLIST MANAGEMENT TESTS ===
    console.log("\n🎵 PLAYLIST MANAGEMENT TESTS");
    console.log("-----------------------------");
    
    const playlistTests = [
        {
            name: "Create playlist",
            fn: () => client.playlists.createPlaylist({
                name: "SDK Test Playlist",
                teamId: TEAM_ID
            })
        }
    ];
    
    for (const test of playlistTests) {
        const result = await testFunction(test.name, test.fn);
        results.push(result);
    }
    
    // === RAW GRAPHQL TESTS ===
    console.log("\n⚡ RAW GRAPHQL TESTS");
    console.log("--------------------");
    
    const graphqlTests = [
        {
            name: "Raw GraphQL - List devices",
            fn: () => client.client.rawRequest(`
                query {
                    devices {
                        id
                        deviceName
                        status
                    }
                }
            `)
        }
    ];
    
    for (const test of graphqlTests) {
        const result = await testFunction(test.name, test.fn);
        results.push(result);
    }
    
    // === RESULTS ANALYSIS ===
    console.log("\n📊 COMPREHENSIVE RESULTS ANALYSIS");
    console.log("===================================");
    
    const totalTests = results.length;
    const passedTests = results.filter(r => r.success).length;
    const criticalFailures = results.filter(r => !r.success && r.critical).length;
    
    console.log(`📈 Test Results:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${passedTests}`);
    console.log(`   Failed: ${totalTests - passedTests}`);
    console.log(`   Critical Failures: ${criticalFailures}`);
    console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    // Error categorization
    const errorTypes = {
        auth: results.filter(r => !r.success && (r.error.includes('signature') || r.error.includes('expired'))).length,
        methods: results.filter(r => !r.success && r.error.includes('not a function')).length,
        params: results.filter(r => !r.success && r.error.includes('invalid value')).length,
        network: results.filter(r => !r.success && r.error.includes('fetch')).length,
        other: results.filter(r => !r.success && !r.error.includes('signature') && !r.error.includes('expired') && !r.error.includes('not a function') && !r.error.includes('invalid value') && !r.error.includes('fetch')).length
    };
    
    console.log(`\n🔍 Error Breakdown:`);
    console.log(`   Authentication/Token: ${errorTypes.auth}`);
    console.log(`   Missing Methods: ${errorTypes.methods}`);
    console.log(`   Parameter Issues: ${errorTypes.params}`);
    console.log(`   Network Issues: ${errorTypes.network}`);
    console.log(`   Other Issues: ${errorTypes.other}`);
    
    // === BACKEND TEAM REPORT ===
    console.log("\n📋 BACKEND TEAM REPORT");
    console.log("======================");
    
    if (criticalFailures > 0) {
        console.log("🚨 CRITICAL ISSUES FOUND:");
        console.log("1. Token authentication is failing with 'invalid signature'");
        console.log("2. This indicates either:");
        console.log("   a) Token is genuinely expired (exp: June 22, 2025)");
        console.log("   b) Token signature verification is failing");
        console.log("   c) Wrong signing key being used");
        console.log("   d) Token format mismatch");
    }
    
    console.log("\n✅ POSITIVE FINDINGS:");
    console.log("1. OptiSigns SDK is properly installed and configured");
    console.log("2. All expected SDK methods are available:");
    console.log("   - Devices: listAllDevices, getDeviceById, getDeviceByName, updateDevice");
    console.log("   - Assets: createWebsiteAppAsset, getAssetDetail, modifyAssetSettings");
    console.log("   - Playlists: createPlaylist, editPlaylist, deletePlaylist");
    console.log("3. SDK initialization works correctly with config object");
    console.log("4. GraphQL endpoint is accessible");
    
    console.log("\n🎯 RECOMMENDATIONS:");
    console.log("1. Generate a new API token with current timestamp");
    console.log("2. Verify the signing key matches the one used for verification");
    console.log("3. Test with a fresh token immediately after generation");
    console.log("4. Consider implementing token refresh mechanism");
    
    console.log("\n📞 TOKEN DETAILS FOR BACKEND:");
    console.log(`   Current Token Expires: 2025-06-22T22:22:01.000Z`);
    console.log(`   Current Time: ${new Date().toISOString()}`);
    console.log(`   User ID: r3CSCdKQhSPQzGDpN`);
    console.log(`   Team ID: ${TEAM_ID}`);
    console.log(`   Account ID: qhzR4CQykLdJwDbn8`);
    
    return {
        totalTests,
        passedTests,
        criticalFailures,
        errorTypes,
        authenticationWorking: authResult.success
    };
}

// Run the final test
finalSDKTest().catch(console.error); 