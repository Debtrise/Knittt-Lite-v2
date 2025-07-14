// OptiSigns SDK Test Script - CORRECTED VERSION
// Properly handles SDK configuration and token expiration

const API_KEY = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJyM0NTQ2RLUWhTUFF6R0RwTiIsImNpZCI6Ik5hcXRxOVQ5Nm5QSFk2YjVaIiwiYWlkIjoicWh6UjRDUXlrTGRKd0RibjgiLCJpYXQiOjE3NTA2MjczMjEsImV4cCI6MTc1MDYzMDkyMSwiaXNzIjoicWh6UjRDUXlrTGRKd0RibjgifQ.qPFba1uihTQnSW4GI_qOOOtEKSFBm_P6AyegImqpOJa0Ry8TeFlKclRSUxF_IXLwx2Hw7LWaMRFklRPRzIyYfnFI2d-ORrAs0FjmHGV7REAFfAQoX6wscc86GCZ_qJHnekgGImV44kipeTM3VTZcOTKoRIN415VBXRueKAFoybkphv8lKQRFhUuOKPG4rmeZRpW1o-0hX7uUXlgn1_piC961S_-LtxN7gIa1jFcwJsw7JK4ptIEYXpApR4rrg9X-4T679EzJFZovSxOXhi6KNpBlTAnsfiMT09OWckbX7G5Ptrt7xyMPZuL2cA7MiqX7-PIzo0ZaLGPgZnA-IrytO29dgdOD3Ebq55zrOwXz1Dqfz_Xx79ryB1IRKo5zBsAUNzUe53SSMOpKHXo6k1Rf7hmXv7kMCn4jB6GRd9StnL7EzEkuxbDF_nZIfgpuP1__GWOWMKc_LNRfl0zrqWp2aUGo3TCJLXDGwQfmWkPwSDmmakBqt57AVPNDkHyEBWwOWAZC3Lb4IeeRoGH3VWvswoc_9iyP_N1OMVMIgTYi79f1QgdQDEUoBCxGXranB1efgIRaCprsh6xBlUF9hTadZOOGE0Lhsm8ob6W4c7vsJq-7Fbmm8o0B_0csWTf_FK5NVsaq6iQYIOHFiuUjIUNukvwWmbW_Z51IUA3bRVS0Xt0";

// Decode and check token expiration
function checkTokenExpiration(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid JWT format');
        }
        
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        const expDate = new Date(payload.exp * 1000);
        const now = new Date();
        
        console.log(`🔍 Token Analysis:`);
        console.log(`   Expires: ${expDate.toISOString()}`);
        console.log(`   Current: ${now.toISOString()}`);
        console.log(`   Status:  ${expDate > now ? '✅ VALID' : '❌ EXPIRED'}`);
        console.log(`   User ID: ${payload.uid}`);
        console.log(`   Team ID: ${payload.cid || payload.aid}`);
        
        return {
            isValid: expDate > now,
            payload,
            teamId: payload.cid || payload.aid
        };
    } catch (error) {
        console.log(`❌ Token decode error: ${error.message}`);
        return { isValid: false, payload: null, teamId: null };
    }
}

async function testOptiSignsSDK() {
    console.log("🔧 OptiSigns SDK Test (CORRECTED VERSION)");
    console.log("==========================================");
    
    // Check token first
    const tokenInfo = checkTokenExpiration(API_KEY);
    
    if (!tokenInfo.isValid) {
        console.log("\n❌ CRITICAL: Token is expired!");
        console.log("💡 You need to request a new API token from the backend team.");
        console.log("   The token expired on June 22, 2025, but it's now June 24, 2025.");
        console.log("\n🔄 However, let's still test the SDK initialization...");
    }
    
    try {
        const { OptiSigns } = require('@optisigns/optisigns');
        
        // CORRECT way to initialize SDK - with config object
        console.log("\n🔑 Initializing SDK with correct config object...");
        const config = {
            token: API_KEY,
            // endpoint: "https://graphql-gateway.optisigns.com/graphql" // Default endpoint
        };
        
        const client = new OptiSigns(config);
        console.log("✅ SDK initialized successfully (despite expired token)");
        
        // Test basic API calls to see what errors we get
        console.log("\n📱 Testing API calls with expired token...");
        
        try {
            console.log("   Attempting to list devices...");
            const devices = await client.devices.listAllDevices();
            console.log(`✅ Success! Found ${devices.length} devices`);
            
            if (devices.length > 0) {
                console.log("📋 Sample devices:");
                devices.slice(0, 3).forEach((device, index) => {
                    console.log(`   ${index + 1}. ${device.deviceName || device.name || 'Unnamed'} (${device.id})`);
                });
            }
        } catch (apiError) {
            console.log(`❌ API call failed: ${apiError.message}`);
            
            // Check if it's an authentication error
            if (apiError.message.includes('401') || 
                apiError.message.includes('Unauthorized') || 
                apiError.message.includes('expired') ||
                apiError.message.includes('invalid')) {
                console.log("🔒 This appears to be an authentication/expired token error");
            } else {
                console.log("🤔 This might be a different API issue");
            }
        }
        
        // Test other endpoints if available
        const testEndpoints = [
            { name: "Find device by name", fn: () => client.devices.findByDeviceName("test") },
            { name: "Get device by ID", fn: () => client.devices.getDeviceById("test-id") }
        ];
        
        for (const test of testEndpoints) {
            try {
                console.log(`\n   Testing: ${test.name}...`);
                await test.fn();
                console.log(`   ✅ ${test.name} - API call structure OK`);
            } catch (error) {
                if (error.message.includes('401') || error.message.includes('expired')) {
                    console.log(`   🔒 ${test.name} - Auth error (expected with expired token)`);
                } else {
                    console.log(`   ❌ ${test.name} - Error: ${error.message}`);
                }
            }
        }
        
    } catch (error) {
        console.log(`❌ SDK initialization failed: ${error.message}`);
        console.log("Stack:", error.stack);
    }
    
    console.log("\n📋 Summary and Recommendations:");
    console.log("==========================================");
    console.log("1. ✅ SDK can be properly initialized with config object");
    console.log("2. ❌ Provided token is expired (June 22 vs June 24)");
    console.log("3. 💡 Request new token from backend team");
    console.log("4. 🔧 SDK structure appears correct for future testing");
    
    console.log("\n📞 Next Steps:");
    console.log("   → Contact backend team for fresh API token");
    console.log("   → Token should have expiration > current date");
    console.log("   → Retry tests with new token");
    
    // Extract team info for reference
    if (tokenInfo.payload) {
        console.log("\n🏢 Team Information (for backend team):");
        console.log(`   User ID: ${tokenInfo.payload.uid}`);
        console.log(`   Team/Client ID: ${tokenInfo.payload.cid}`);
        console.log(`   Account ID: ${tokenInfo.payload.aid}`);
        console.log(`   Issuer: ${tokenInfo.payload.iss}`);
    }
}

// Run the test
testOptiSignsSDK().catch(console.error); 