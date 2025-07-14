// Explore OptiSigns SDK Structure
// Check what methods are actually available

const API_KEY = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJyM0NTQ2RLUWhTUFF6R0RwTiIsImNpZCI6Ik5hcXRxOVQ5Nm5QSFk2YjVaIiwiYWlkIjoicWh6UjRDUXlrTGRKd0RibjgiLCJpYXQiOjE3NTA2MjczMjEsImV4cCI6MTc1MDYzMDkyMSwiaXNzIjoicWh6UjRDUXlrTGRKd0RibjgifQ.qPFba1uihTQnSW4GI_qOOOtEKSFBm_P6AyegImqpOJa0Ry8TeFlKclRSUxF_IXLwx2Hw7LWaMRFklRPRzIyYfnFI2d-ORrAs0FjmHGV7REAFfAQoX6wscc86GCZ_qJHnekgGImV44kipeTM3VTZcOTKoRIN415VBXRueKAFoybkphv8lKQRFhUuOKPG4rmeZRpW1o-0hX7uUXlgn1_piC961S_-LtxN7gIa1jFcwJsw7JK4ptIEYXpApR4rrg9X-4T679EzJFZovSxOXhi6KNpBlTAnsfiMT09OWckbX7G5Ptrt7xyMPZuL2cA7MiqX7-PIzo0ZaLGPgZnA-IrytO29dgdOD3Ebq55zrOwXz1Dqfz_Xx79ryB1IRKo5zBsAUNzUe53SSMOpKHXo6k1Rf7hmXv7kMCn4jB6GRd9StnL7EzEkuxbDF_nZIfgpuP1__GWOWMKc_LNRfl0zrqWp2aUGo3TCJLXDGwQfmWkPwSDmmakBqt57AVPNDkHyEBWwOWAZC3Lb4IeeRoGH3VWvswoc_9iyP_N1OMVMIgTYi79f1QgdQDEUoBCxGXranB1efgIRaCprsh6xBlUF9hTadZOOGE0Lhsm8ob6W4c7vsJq-7Fbmm8o0B_0csWTf_FK5NVsaq6iQYIOHFiuUjIUNukvwWmbW_Z51IUA3bRVS0Xt0";

function exploreObject(obj, path = '', maxDepth = 3, currentDepth = 0) {
    if (currentDepth >= maxDepth || !obj || typeof obj !== 'object') {
        return;
    }
    
    const properties = Object.getOwnPropertyNames(obj);
    const prototype = Object.getPrototypeOf(obj);
    
    if (prototype && prototype !== Object.prototype) {
        const protoProps = Object.getOwnPropertyNames(prototype);
        properties.push(...protoProps);
    }
    
    const uniqueProps = [...new Set(properties)].filter(prop => 
        prop !== 'constructor' && 
        !prop.startsWith('_') && 
        prop !== 'length'
    );
    
    for (const prop of uniqueProps) {
        try {
            const value = obj[prop];
            const fullPath = path ? `${path}.${prop}` : prop;
            
            if (typeof value === 'function') {
                console.log(`📎 Function: ${fullPath}()`);
                
                // Try to get function signature
                const funcStr = value.toString();
                const paramMatch = funcStr.match(/function\s*\([^)]*\)|[^=]*=>\s*\([^)]*\)|async\s+[^(]*\([^)]*\)/);
                if (paramMatch) {
                    console.log(`   Parameters: ${paramMatch[0]}`);
                }
            } else if (typeof value === 'object' && value !== null) {
                console.log(`📁 Object: ${fullPath}`);
                if (currentDepth < maxDepth - 1) {
                    exploreObject(value, fullPath, maxDepth, currentDepth + 1);
                }
            } else {
                console.log(`📄 Property: ${fullPath} = ${typeof value}`);
            }
        } catch (error) {
            console.log(`⚠️  Error accessing ${path}.${prop}: ${error.message}`);
        }
    }
}

function exploreSDK() {
    console.log("🔍 OptiSigns SDK Structure Exploration");
    console.log("=====================================");
    
    try {
        const { OptiSigns } = require('@optisigns/optisigns');
        console.log("✅ SDK imported successfully");
        
        // Check static methods/properties on the class
        console.log("\n📚 Static OptiSigns Class Properties:");
        exploreObject(OptiSigns, 'OptiSigns', 2);
        
        // Initialize client
        console.log("\n🔧 Initializing client...");
        const client = new OptiSigns({ token: API_KEY });
        console.log("✅ Client created");
        
        // Explore client instance
        console.log("\n🎯 Client Instance Structure:");
        exploreObject(client, 'client', 4);
        
        // Check each major module
        const modules = ['devices', 'assets', 'playlists'];
        
        for (const module of modules) {
            if (client[module]) {
                console.log(`\n📦 ${module.toUpperCase()} Module:`);
                console.log(`   Type: ${typeof client[module]}`);
                console.log(`   Constructor: ${client[module].constructor.name}`);
                
                exploreObject(client[module], module, 3);
            }
        }
        
        // Try to read the actual source code structure
        console.log("\n📖 Reading SDK Source Files:");
        const fs = require('fs');
        const path = require('path');
        
        const sdkDir = path.join(__dirname, 'node_modules', '@optisigns', 'optisigns');
        
        function readSDKFiles(dir, relativePath = '') {
            try {
                const items = fs.readdirSync(dir);
                
                for (const item of items) {
                    const fullPath = path.join(dir, item);
                    const stat = fs.statSync(fullPath);
                    
                    if (stat.isDirectory() && item !== 'node_modules') {
                        console.log(`📁 Directory: ${relativePath}${item}/`);
                        if (relativePath.split('/').length < 3) { // Limit depth
                            readSDKFiles(fullPath, `${relativePath}${item}/`);
                        }
                    } else if (stat.isFile() && (item.endsWith('.js') || item.endsWith('.ts'))) {
                        console.log(`📄 File: ${relativePath}${item}`);
                        
                        // Read and analyze key files
                        if (item === 'index.js' || item.includes('device') || item.includes('asset')) {
                            const content = fs.readFileSync(fullPath, 'utf8');
                            
                            // Extract class definitions and exported functions
                            const classMatches = content.match(/class\s+(\w+)/g);
                            const functionMatches = content.match(/(?:function\s+(\w+)|const\s+(\w+)\s*=.*function|(\w+):\s*async?\s*function)/g);
                            const exportMatches = content.match(/(?:module\.exports|exports?\.)/g);
                            
                            if (classMatches) {
                                console.log(`     Classes: ${classMatches.join(', ')}`);
                            }
                            if (functionMatches) {
                                console.log(`     Functions: ${functionMatches.slice(0, 5).join(', ')}${functionMatches.length > 5 ? '...' : ''}`);
                            }
                            if (exportMatches) {
                                console.log(`     Exports: ${exportMatches.length} export statements`);
                            }
                        }
                    }
                }
            } catch (error) {
                console.log(`❌ Error reading ${dir}: ${error.message}`);
            }
        }
        
        readSDKFiles(sdkDir);
        
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        console.log("Stack:", error.stack);
    }
}

exploreSDK(); 