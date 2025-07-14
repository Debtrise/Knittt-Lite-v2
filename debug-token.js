// Debug script to analyze the JWT token and SDK requirements

const API_KEY = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJyM0NTQ2RLUWhTUFF6R0RwTiIsImNpZCI6Ik5hcXRxOVQ5Nm5QSFk2YjVaIiwiYWlkIjoicWh6UjRDUXlrTGRKd0RibjgiLCJpYXQiOjE3NTA2MjczMjEsImV4cCI6MTc1MDYzMDkyMSwiaXNzIjoicWh6UjRDUXlrTGRKd0RibjgifQ.qPFba1uihTQnSW4GI_qOOOtEKSFBm_P6AyegImqpOJa0Ry8TeFlKclRSUxF_IXLwx2Hw7LWaMRFklRPRzIyYfnFI2d-ORrAs0FjmHGV7REAFfAQoX6wscc86GCZ_qJHnekgGImV44kipeTM3VTZcOTKoRIN415VBXRueKAFoybkphv8lKQRFhUuOKPG4rmeZRpW1o-0hX7uUXlgn1_piC961S_-LtxN7gIa1jFcwJsw7JK4ptIEYXpApR4rrg9X-4T679EzJFZovSxOXhi6KNpBlTAnsfiMT09OWckbX7G5Ptrt7xyMPZuL2cA7MiqX7-PIzo0ZaLGPgZnA-IrytO29dgdOD3Ebq55zrOwXz1Dqfz_Xx79ryB1IRKo5zBsAUNzUe53SSMOpKHXo6k1Rf7hmXv7kMCn4jB6GRd9StnL7EzEkuxbDF_nZIfgpuP1__GWOWMKc_LNRfl0zrqWp2aUGo3TCJLXDGwQfmWkPwSDmmakBqt57AVPNDkHyEBWwOWAZC3Lb4IeeRoGH3VWvswoc_9iyP_N1OMVMIgTYi79f1QgdQDEUoBCxGXranB1efgIRaCprsh6xBlUF9hTadZOOGE0Lhsm8ob6W4c7vsJq-7Fbmm8o0B_0csWTf_FK5NVsaq6iQYIOHFiuUjIUNukvwWmbW_Z51IUA3bRVS0Xt0";

console.log("🔍 JWT Token Analysis");
console.log("==========================================");

// Decode JWT token
try {
    const parts = API_KEY.split('.');
    console.log(`📋 Token has ${parts.length} parts (should be 3 for JWT)`);
    
    if (parts.length === 3) {
        // Decode header
        const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
        console.log("\n📄 Header:", JSON.stringify(header, null, 2));
        
        // Decode payload
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        console.log("\n📦 Payload:", JSON.stringify(payload, null, 2));
        
        // Check expiration
        if (payload.exp) {
            const expDate = new Date(payload.exp * 1000);
            const now = new Date();
            console.log(`\n⏰ Token expires: ${expDate.toISOString()}`);
            console.log(`   Current time: ${now.toISOString()}`);
            console.log(`   Token is ${expDate > now ? '✅ VALID' : '❌ EXPIRED'}`);
        }
        
        // Extract potential team/account IDs
        console.log("\n🔑 Potential IDs:");
        console.log(`   User ID (uid): ${payload.uid}`);
        console.log(`   Client/Company ID (cid): ${payload.cid}`);
        console.log(`   Account ID (aid): ${payload.aid}`);
        console.log(`   Issuer (iss): ${payload.iss}`);
    }
} catch (error) {
    console.log("❌ Failed to decode JWT:", error.message);
}

console.log("\n🔧 SDK Requirements Check");
console.log("==========================================");

// Check SDK source to understand token validation
try {
    const fs = require('fs');
    const path = require('path');
    
    const sdkPath = path.join(__dirname, 'node_modules', '@optisigns', 'optisigns', 'src', 'index.js');
    
    if (fs.existsSync(sdkPath)) {
        const sdkCode = fs.readFileSync(sdkPath, 'utf8');
        console.log("📄 SDK Constructor code:");
        
        // Extract constructor and token validation logic
        const lines = sdkCode.split('\n');
        const constructorStart = lines.findIndex(line => line.includes('constructor'));
        const constructorEnd = lines.findIndex((line, idx) => idx > constructorStart && line.includes('}'));
        
        if (constructorStart >= 0 && constructorEnd >= 0) {
            const constructorCode = lines.slice(constructorStart, constructorEnd + 1).join('\n');
            console.log(constructorCode);
        } else {
            console.log("Could not find constructor in SDK");
        }
        
        // Look for token validation
        if (sdkCode.includes('Token is required')) {
            console.log("\n🔍 Found 'Token is required' error in SDK");
            const errorContext = sdkCode.split('Token is required')[0].slice(-200) + 'Token is required' + sdkCode.split('Token is required')[1].slice(0, 200);
            console.log("Context around error:", errorContext);
        }
    }
} catch (error) {
    console.log("⚠️  Could not read SDK source:", error.message);
}

console.log("\n🧪 Testing different token formats");
console.log("==========================================");

// Test different ways the SDK might expect the token
const testFormats = [
    API_KEY, // Original
    `Bearer ${API_KEY}`, // With Bearer prefix
    API_KEY.trim(), // Trimmed
];

testFormats.forEach((format, index) => {
    console.log(`\nTest ${index + 1}: ${format.length > 50 ? format.substring(0, 50) + '...' : format}`);
    
    try {
        const { OptiSigns } = require('@optisigns/optisigns');
        const client = new OptiSigns(format);
        console.log("✅ Token format accepted");
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
});

console.log("\n🌐 Testing with empty/null values");
console.log("==========================================");

const emptyTests = [null, undefined, '', ' '];
emptyTests.forEach((value, index) => {
    console.log(`\nEmpty test ${index + 1}: ${JSON.stringify(value)}`);
    try {
        const { OptiSigns } = require('@optisigns/optisigns');
        const client = new OptiSigns(value);
        console.log("✅ Accepted");
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}); 