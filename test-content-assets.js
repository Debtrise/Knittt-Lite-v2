// OptiSigns Content & Asset Endpoints Explorer
// Testing all available content and asset retrieval methods

const { OptiSigns } = require('@optisigns/optisigns');

const API_KEY = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJyM0NTQ2RLUWhTUFF6R0RwTiIsImNpZCI6Ik5hcXRxOVQ5Nm5QSFk2YjVaIiwiYWlkIjoicWh6UjRDUXlrTGRKd0RibjgiLCJpYXQiOjE3NTA2MjczMjEsImV4cCI6MTc1MDYzMDkyMSwiaXNzIjoicWh6UjRDUXlrTGRKd0RibjgifQ.qPFba1uihTQnSW4GI_qOOOtEKSFBm_P6AyegImqpOJa0Ry8TeFlKclRSUxF_IXLwx2Hw7LWaMRFklRPRzIyYfnFI2d-ORrAs0FjmHGV7REAFfAQoX6wscc86GCZ_qJHnekgGImV44kipeTM3VTZcOTKoRIN415VBXRueKAFoybkphv8lKQRFhUuOKPG4rmeZRpW1o-0hX7uUXlgn1_piC961S_-LtxN7gIa1jFcwJsw7JK4ptIEYXpApR4rrg9X-4T679EzJFZovSxOXhi6KNpBlTAnsfiMT09OWckbX7G5Ptrt7xyMPZuL2cA7MiqX7-PIzo0ZaLGPgZnA-IrytO29dgdOD3Ebq55zrOwXz1Dqfz_Xx79ryB1IRKo5zBsAUNzUe53SSMOpKHXo6k1Rf7hmXv7kMCn4jB6GRd9StnL7EzEkuxbDF_nZIfgpuP1__GWOWMKc_LNRfl0zrqWp2aUGo3TCJLXDGwQfmWkPwSDmmakBqt57AVPNDkHyEBWwOWAZC3Lb4IeeRoGH3VWvswoc_9iyP_N1OMVMIgTYi79f1QgdQDEUoBCxGXranB1efgIRaCprsh6xBlUF9hTadZOOGE0Lhsm8ob6W4c7vsJq-7Fbmm8o0B_0csWTf_FK5NVsaq6iQYIOHFiuUjIUNukvwWmbW_Z51IUA3bRVS0Xt0";

const TEAM_ID = "Naqtq9T96nPHY6b5Z";

async function testEndpoint(name, testFn) {
    try {
        console.log(`\n🧪 Testing: ${name}`);
        const result = await testFn();
        
        if (result === null || result === undefined) {
            console.log(`✅ Success: ${result} (null/undefined response)`);
        } else if (Array.isArray(result)) {
            console.log(`✅ Success: Array with ${result.length} items`);
            if (result.length > 0) {
                console.log(`   📋 Sample item keys: ${Object.keys(result[0]).slice(0, 5).join(', ')}${Object.keys(result[0]).length > 5 ? '...' : ''}`);
            }
        } else if (typeof result === 'object') {
            console.log(`✅ Success: Object with ${Object.keys(result).length} properties`);
            console.log(`   📋 Keys: ${Object.keys(result).slice(0, 8).join(', ')}${Object.keys(result).length > 8 ? '...' : ''}`);
        } else {
            console.log(`✅ Success: ${String(result).substring(0, 100)}`);
        }
        
        return { success: true, result, type: Array.isArray(result) ? 'array' : typeof result };
    } catch (error) {
        const errorMsg = error.message.substring(0, 150);
        console.log(`❌ Failed: ${errorMsg}`);
        
        // Check error types
        if (error.message.includes('API_NOT_AVAILABLE')) {
            console.log(`   🚫 Endpoint not available`);
        } else if (error.message.includes('not a function')) {
            console.log(`   📝 Method doesn't exist in SDK`);
        } else if (error.message.includes('Variable') && error.message.includes('required')) {
            console.log(`   📝 Missing required parameters`);
        }
        
        return { success: false, error: errorMsg };
    }
}

async function exploreContentAndAssets() {
    console.log("📁 OptiSigns Content & Asset Endpoints Explorer");
    console.log("===============================================");
    
    const client = new OptiSigns({ token: API_KEY });
    const results = {};
    
    // === EXPLORE ASSET METHODS ===
    console.log("\n📸 ASSET ENDPOINTS");
    console.log("==================");
    
    console.log("\n🔍 Available Asset Methods:");
    const assetMethods = Object.getOwnPropertyNames(client.assets).filter(name => 
        typeof client.assets[name] === 'function' && !name.startsWith('handle')
    );
    console.log(`   Methods found: ${assetMethods.join(', ')}`);
    
    results.assets = {};
    
    // Test each asset method
    const assetTests = [
        {
            name: "Get asset detail (test ID)",
            method: "getAssetDetail",
            fn: () => client.assets.getAssetDetail("test-asset-id")
        },
        {
            name: "Get asset detail (empty ID)",
            method: "getAssetDetail", 
            fn: () => client.assets.getAssetDetail("")
        },
        {
            name: "List all assets (if available)",
            method: "listAllAssets",
            fn: () => client.assets.listAllAssets ? client.assets.listAllAssets() : Promise.reject(new Error("Method not available"))
        },
        {
            name: "Get assets (if available)",
            method: "getAssets",
            fn: () => client.assets.getAssets ? client.assets.getAssets() : Promise.reject(new Error("Method not available"))
        },
        {
            name: "Search assets (if available)",
            method: "searchAssets",
            fn: () => client.assets.searchAssets ? client.assets.searchAssets("test") : Promise.reject(new Error("Method not available"))
        }
    ];
    
    for (const test of assetTests) {
        const result = await testEndpoint(test.name, test.fn);
        results.assets[test.method] = result;
    }
    
    // === EXPLORE PLAYLIST METHODS ===
    console.log("\n🎵 PLAYLIST/CONTENT ENDPOINTS");
    console.log("=============================");
    
    console.log("\n🔍 Available Playlist Methods:");
    const playlistMethods = Object.getOwnPropertyNames(client.playlists).filter(name => 
        typeof client.playlists[name] === 'function' && !name.startsWith('handle')
    );
    console.log(`   Methods found: ${playlistMethods.join(', ')}`);
    
    results.playlists = {};
    
    const playlistTests = [
        {
            name: "Get playlist (test ID)",
            method: "getPlaylist",
            fn: () => client.playlists.getPlaylist ? client.playlists.getPlaylist("test-id") : Promise.reject(new Error("Method not available"))
        },
        {
            name: "List all playlists",
            method: "listAllPlaylists",
            fn: () => client.playlists.listAllPlaylists ? client.playlists.listAllPlaylists() : Promise.reject(new Error("Method not available"))
        },
        {
            name: "Get playlists",
            method: "getPlaylists", 
            fn: () => client.playlists.getPlaylists ? client.playlists.getPlaylists() : Promise.reject(new Error("Method not available"))
        }
    ];
    
    for (const test of playlistTests) {
        const result = await testEndpoint(test.name, test.fn);
        results.playlists[test.method] = result;
    }
    
    // === RAW GRAPHQL EXPLORATION ===
    console.log("\n⚡ RAW GRAPHQL QUERIES");
    console.log("=====================");
    
    results.graphql = {};
    
    const graphqlTests = [
        {
            name: "Query all assets via GraphQL",
            query: `
                query {
                    assets {
                        _id
                        name
                        title
                        type
                        status
                        createdAt
                        fileType
                        thumbnail
                    }
                }
            `
        },
        {
            name: "Query playlists via GraphQL",
            query: `
                query {
                    playlists {
                        _id
                        name
                        description
                        createdAt
                        assets {
                            _id
                            name
                        }
                    }
                }
            `
        },
        {
            name: "Query content via GraphQL",
            query: `
                query {
                    content {
                        _id
                        name
                        type
                        status
                    }
                }
            `
        },
        {
            name: "Query media via GraphQL",
            query: `
                query {
                    media {
                        _id
                        name
                        type
                        url
                    }
                }
            `
        }
    ];
    
    for (const test of graphqlTests) {
        const result = await testEndpoint(test.name, async () => {
            return await client.client.rawRequest(test.query);
        });
        results.graphql[test.name] = result;
    }
    
    // === CREATE SAMPLE ASSET FOR TESTING ===
    console.log("\n🆕 CREATE TEST ASSET");
    console.log("====================");
    
    const createAssetResult = await testEndpoint("Create sample website asset", async () => {
        return await client.assets.createWebsiteAppAsset({
            url: "https://example.com",
            title: `Test Asset ${Date.now()}`
        }, TEAM_ID);
    });
    
    let testAssetId = null;
    if (createAssetResult.success && createAssetResult.result) {
        testAssetId = createAssetResult.result._id || createAssetResult.result.id;
        console.log(`🎯 Created test asset with ID: ${testAssetId}`);
        
        if (testAssetId) {
            // Test getting the asset we just created
            const getCreatedAsset = await testEndpoint("Get created asset by ID", async () => {
                return await client.assets.getAssetDetail(testAssetId);
            });
            results.assets.getCreatedAsset = getCreatedAsset;
        }
    }
    
    // === SUMMARY ===
    console.log("\n📊 ENDPOINT AVAILABILITY SUMMARY");
    console.log("=================================");
    
    const availableEndpoints = [];
    const unavailableEndpoints = [];
    
    // Analyze results
    Object.keys(results).forEach(category => {
        Object.keys(results[category]).forEach(method => {
            const result = results[category][method];
            const endpointName = `${category}.${method}`;
            
            if (result.success) {
                availableEndpoints.push({
                    name: endpointName,
                    type: result.type,
                    hasData: result.type === 'array' ? result.result.length > 0 : !!result.result
                });
            } else {
                unavailableEndpoints.push({
                    name: endpointName,
                    reason: result.error
                });
            }
        });
    });
    
    console.log(`\n✅ AVAILABLE ENDPOINTS (${availableEndpoints.length}):`);
    availableEndpoints.forEach(endpoint => {
        console.log(`   📍 ${endpoint.name} (${endpoint.type}) ${endpoint.hasData ? '📊 HAS DATA' : '📭 EMPTY'}`);
    });
    
    console.log(`\n❌ UNAVAILABLE ENDPOINTS (${unavailableEndpoints.length}):`);
    unavailableEndpoints.forEach(endpoint => {
        console.log(`   📍 ${endpoint.name} - ${endpoint.reason.substring(0, 50)}...`);
    });
    
    // === RECOMMENDATIONS ===
    console.log(`\n💡 CONTENT & ASSET RECOMMENDATIONS:`);
    console.log(`===================================`);
    
    const workingAssetMethods = availableEndpoints.filter(e => e.name.startsWith('assets.')).length;
    const workingPlaylistMethods = availableEndpoints.filter(e => e.name.startsWith('playlists.')).length;
    const workingGraphQLQueries = availableEndpoints.filter(e => e.name.startsWith('graphql.')).length;
    
    console.log(`\n📸 Asset Management:`);
    console.log(`   ✅ Working methods: ${workingAssetMethods}`);
    console.log(`   ❌ Non-working methods: ${unavailableEndpoints.filter(e => e.name.startsWith('assets.')).length}`);
    
    console.log(`\n🎵 Playlist/Content Management:`);
    console.log(`   ✅ Working methods: ${workingPlaylistMethods}`);
    console.log(`   ❌ Non-working methods: ${unavailableEndpoints.filter(e => e.name.startsWith('playlists.')).length}`);
    
    console.log(`\n⚡ GraphQL Queries:`);
    console.log(`   ✅ Working queries: ${workingGraphQLQueries}`);
    console.log(`   ❌ Non-working queries: ${unavailableEndpoints.filter(e => e.name.startsWith('graphql.')).length}`);
    
    console.log(`\n🎯 BEST PRACTICES FOR CONTENT/ASSETS:`);
    
    if (workingAssetMethods > 0) {
        console.log(`   1. Use createWebsiteAppAsset() for creating web content`);
        console.log(`   2. Use uploadFileAsset() for file uploads`);
        console.log(`   3. Use modifyAssetSettings() for updates`);
    }
    
    if (workingGraphQLQueries > 0) {
        console.log(`   4. Use raw GraphQL for complex queries`);
        console.log(`   5. Check GraphQL schema for available fields`);
    }
    
    if (testAssetId) {
        console.log(`   6. Asset IDs work with format: ${testAssetId}`);
    }
    
    return {
        totalEndpointsTested: availableEndpoints.length + unavailableEndpoints.length,
        availableEndpoints: availableEndpoints.length,
        unavailableEndpoints: unavailableEndpoints.length,
        assetMethods: workingAssetMethods,
        playlistMethods: workingPlaylistMethods,
        graphqlQueries: workingGraphQLQueries,
        testAssetId
    };
}

// Run the exploration
exploreContentAndAssets().catch(console.error); 