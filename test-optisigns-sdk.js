// OptiSigns SDK Test Script
// Testing API functionality with provided key

const API_KEY = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJyM0NTQ2RLUWhTUFF6R0RwTiIsImNpZCI6Ik5hcXRxOVQ5Nm5QSFk2YjVaIiwiYWlkIjoicWh6UjRDUXlrTGRKd0RibjgiLCJpYXQiOjE3NTA2MjczMjEsImV4cCI6MTc1MDYzMDkyMSwiaXNzIjoicWh6UjRDUXlrTGRKd0RibjgifQ.qPFba1uihTQnSW4GI_qOOOtEKSFBm_P6AyegImqpOJa0Ry8TeFlKclRSUxF_IXLwx2Hw7LWaMRFklRPRzIyYfnFI2d-ORrAs0FjmHGV7REAFfAQoX6wscc86GCZ_qJHnekgGImV44kipeTM3VTZcOTKoRIN415VBXRueKAFoybkphv8lKQRFhUuOKPG4rmeZRpW1o-0hX7uUXlgn1_piC961S_-LtxN7gIa1jFcwJsw7JK4ptIEYXpApR4rrg9X-4T679EzJFZovSxOXhi6KNpBlTAnsfiMT09OWckbX7G5Ptrt7xyMPZuL2cA7MiqX7-PIzo0ZaLGPgZnA-IrytO29dgdOD3Ebq55zrOwXz1Dqfz_Xx79ryB1IRKo5zBsAUNzUe53SSMOpKHXo6k1Rf7hmXv7kMCn4jB6GRd9StnL7EzEkuxbDF_nZIfgpuP1__GWOWMKc_LNRfl0zrqWp2aUGo3TCJLXDGwQfmWkPwSDmmakBqt57AVPNDkHyEBWwOWAZC3Lb4IeeRoGH3VWvswoc_9iyP_N1OMVMIgTYi79f1QgdQDEUoBCxGXranB1efgIRaCprsh6xBlUF9hTadZOOGE0Lhsm8ob6W4c7vsJq-7Fbmm8o0B_0csWTf_FK5NVsaq6iQYIOHFiuUjIUNukvwWmbW_Z51IUA3bRVS0Xt0";

// Test function to check if we can install and use the OptiSigns SDK
async function testOptiSignsSDK() {
    console.log("🔧 OptiSigns SDK Test Starting...");
    console.log("==========================================");
    
    try {
        // First check if the SDK is installed
        console.log("📦 Checking SDK installation...");
        
        let OptiSigns;
        try {
            // Try to import the SDK
            const module = await import("@optisigns/optisigns");
            OptiSigns = module.OptiSigns;
            console.log("✅ SDK found and imported successfully");
        } catch (error) {
            console.log("❌ SDK not installed. Error:", error.message);
            console.log("💡 Please run: npm install @optisigns/optisigns");
            return;
        }
        
        // Initialize the client
        console.log("\n🔑 Initializing OptiSigns client...");
        const client = new OptiSigns(API_KEY);
        console.log("✅ Client initialized successfully");
        
        // Test 1: List all devices
        console.log("\n📱 Test 1: Listing all devices...");
        try {
            const devices = await client.devices.listAllDevices();
            console.log(`✅ Found ${devices.length} devices`);
            
            if (devices.length > 0) {
                console.log("📋 First few devices:");
                devices.slice(0, 3).forEach((device, index) => {
                    console.log(`   ${index + 1}. ${device.deviceName || device.name || 'Unnamed'} (ID: ${device.id})`);
                });
                
                // Store first device ID for later tests
                window.testDeviceId = devices[0].id;
            } else {
                console.log("ℹ️  No devices found");
            }
        } catch (error) {
            console.log("❌ Failed to list devices:", error.message);
        }
        
        // Test 2: Create a new device
        console.log("\n🆕 Test 2: Creating a new test device...");
        try {
            const newDevice = await client.devices.createDevice({
                deviceName: "SDK Test Device",
                orientation: "LANDSCAPE",
            });
            console.log(`✅ Created device: ${newDevice.deviceName} (ID: ${newDevice.id})`);
            window.testCreatedDeviceId = newDevice.id;
        } catch (error) {
            console.log("❌ Failed to create device:", error.message);
        }
        
        // Test 3: Find device by name
        if (window.testCreatedDeviceId) {
            console.log("\n🔍 Test 3: Finding device by name...");
            try {
                const foundDevice = await client.devices.findByDeviceName("SDK Test Device");
                if (foundDevice) {
                    console.log(`✅ Found device: ${foundDevice.deviceName} (ID: ${foundDevice.id})`);
                } else {
                    console.log("❌ Device not found by name");
                }
            } catch (error) {
                console.log("❌ Failed to find device by name:", error.message);
            }
        }
        
        // Test 4: Asset management
        console.log("\n📸 Test 4: Testing asset management...");
        
        // Get team ID from token payload (decode JWT)
        let teamId = null;
        try {
            const tokenPayload = JSON.parse(atob(API_KEY.split('.')[1]));
            teamId = tokenPayload.cid || tokenPayload.aid;
            console.log(`📋 Extracted team ID: ${teamId}`);
        } catch (error) {
            console.log("⚠️  Could not extract team ID from token");
        }
        
        if (teamId) {
            try {
                // Create a website asset
                const websiteAsset = await client.assets.createWebsiteAppAsset(
                    {
                        url: "https://example.com",
                        title: "SDK Test Website",
                    },
                    teamId
                );
                console.log(`✅ Created website asset: ${websiteAsset.title} (ID: ${websiteAsset.id})`);
                window.testAssetId = websiteAsset.id;
            } catch (error) {
                console.log("❌ Failed to create website asset:", error.message);
            }
        }
        
        // Test 5: Device operations (if we have a device)
        if (window.testDeviceId) {
            console.log("\n🔄 Test 5: Testing device operations...");
            
            try {
                const deviceInfo = await client.devices.getDeviceById(window.testDeviceId);
                console.log(`✅ Retrieved device info: ${deviceInfo.deviceName || deviceInfo.name}`);
            } catch (error) {
                console.log("❌ Failed to get device info:", error.message);
            }
            
            // Test device reboot (be careful with this!)
            // Uncomment only if you want to test rebooting
            /*
            try {
                await client.devices.rebootDevice(window.testDeviceId);
                console.log("✅ Device reboot command sent");
            } catch (error) {
                console.log("❌ Failed to reboot device:", error.message);
            }
            */
        }
        
        // Test 6: Asset modification (if we have an asset)
        if (window.testAssetId && teamId) {
            console.log("\n✏️  Test 6: Modifying asset settings...");
            try {
                await client.assets.modifyAssetSettings(
                    window.testAssetId,
                    {
                        name: "Updated SDK Test Website",
                        metadata: { testRun: new Date().toISOString() },
                    },
                    teamId
                );
                console.log("✅ Asset settings updated successfully");
            } catch (error) {
                console.log("❌ Failed to modify asset settings:", error.message);
            }
        }
        
        // Cleanup: Delete test device
        if (window.testCreatedDeviceId && teamId) {
            console.log("\n🗑️  Cleanup: Deleting test device...");
            try {
                await client.devices.deleteDeviceById(window.testCreatedDeviceId, teamId);
                console.log("✅ Test device deleted successfully");
            } catch (error) {
                console.log("❌ Failed to delete test device:", error.message);
            }
        }
        
        console.log("\n==========================================");
        console.log("🎉 OptiSigns SDK test completed!");
        
    } catch (error) {
        console.log("\n❌ Unexpected error during testing:", error);
        console.log("Stack trace:", error.stack);
    }
}

// Check if we're in Node.js or browser environment
if (typeof window === 'undefined') {
    // Node.js environment
    console.log("🌐 Running in Node.js environment");
    
    // Check if @optisigns/optisigns is installed
    try {
        require.resolve('@optisigns/optisigns');
        console.log("✅ OptiSigns SDK is installed");
        
        // Run the test
        const { OptiSigns } = require('@optisigns/optisigns');
        
        (async () => {
            console.log("🔧 OptiSigns SDK Test Starting...");
            console.log("==========================================");
            
            const client = new OptiSigns(API_KEY);
            console.log("✅ Client initialized successfully");
            
            // Test devices
            try {
                console.log("\n📱 Testing device listing...");
                const devices = await client.devices.listAllDevices();
                console.log(`✅ Found ${devices.length} devices`);
                
                if (devices.length > 0) {
                    console.log("📋 Sample devices:");
                    devices.slice(0, 5).forEach((device, index) => {
                        console.log(`   ${index + 1}. ${device.deviceName || device.name || 'Unnamed'} (${device.id})`);
                    });
                }
            } catch (error) {
                console.log("❌ Device listing failed:", error.message);
            }
            
            console.log("\n🎉 Basic test completed!");
        })().catch(console.error);
        
    } catch (error) {
        console.log("❌ OptiSigns SDK not found. Please install it first:");
        console.log("   npm install @optisigns/optisigns");
    }
} else {
    // Browser environment
    console.log("🌐 Running in browser environment");
    window.testOptiSignsSDK = testOptiSignsSDK;
    console.log("💡 Call testOptiSignsSDK() to run the tests");
}

module.exports = { testOptiSignsSDK, API_KEY }; 