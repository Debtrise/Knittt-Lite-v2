// OptiSigns API - Correct Usage Examples
// Use this as a reference for proper implementation

const { OptiSigns } = require('@optisigns/optisigns');

// Example configuration - replace with your actual token
const API_CONFIG = {
    token: "YOUR_FRESH_JWT_TOKEN_HERE", // Get this from backend team
    teamId: "Naqtq9T96nPHY6b5Z" // Your team ID
};

class OptiSignsManager {
    constructor(config) {
        this.client = new OptiSigns({ token: config.token });
        this.teamId = config.teamId;
    }

    // =====================================
    // DEVICE MANAGEMENT - WORKING EXAMPLES
    // =====================================

    async getAllDevices() {
        try {
            console.log("📱 Fetching all devices...");
            const devices = await this.client.devices.listAllDevices();
            
            // Filter out devices with invalid IDs
            const validDevices = devices.filter(device => 
                device.id && 
                device.id !== 'undefined' && 
                device.deviceName
            );
            
            console.log(`✅ Found ${validDevices.length} valid devices (${devices.length} total)`);
            return validDevices;
        } catch (error) {
            console.error("❌ Failed to get devices:", error.message);
            throw error;
        }
    }

    async findDeviceByName(deviceName) {
        try {
            console.log(`🔍 Searching for device: ${deviceName}`);
            const device = await this.client.devices.getDeviceByName(deviceName);
            
            if (device) {
                console.log(`✅ Found device: ${device.deviceName} (ID: ${device.id})`);
                return device;
            } else {
                console.log(`❌ Device not found: ${deviceName}`);
                return null;
            }
        } catch (error) {
            console.error("❌ Search failed:", error.message);
            throw error;
        }
    }

    async getDeviceById(deviceId) {
        try {
            // Validate device ID first
            if (!deviceId || deviceId === 'undefined') {
                throw new Error('Invalid device ID provided');
            }

            console.log(`📋 Getting device details for ID: ${deviceId}`);
            const device = await this.client.devices.getDeviceById(deviceId);
            console.log(`✅ Retrieved device: ${device.deviceName}`);
            return device;
        } catch (error) {
            console.error("❌ Failed to get device by ID:", error.message);
            throw error;
        }
    }

    async updateDevice(deviceId, updates) {
        try {
            // Validate inputs
            if (!deviceId || deviceId === 'undefined') {
                throw new Error('Invalid device ID');
            }

            console.log(`📝 Updating device ${deviceId}...`);
            const result = await this.client.devices.updateDevice(deviceId, updates);
            console.log(`✅ Device updated successfully`);
            return result;
        } catch (error) {
            console.error("❌ Failed to update device:", error.message);
            throw error;
        }
    }

    // =====================================
    // ASSET MANAGEMENT - WORKING EXAMPLES
    // =====================================

    async createWebsiteAsset(url, title, description = '') {
        try {
            // Validate inputs
            if (!url || !title) {
                throw new Error('URL and title are required');
            }
            if (!this.teamId) {
                throw new Error('Team ID is required');
            }

            console.log(`🌐 Creating website asset: ${title}`);
            const assetData = {
                url: url,
                title: title
            };

            if (description) {
                assetData.description = description;
            }

            const asset = await this.client.assets.createWebsiteAppAsset(assetData, this.teamId);
            console.log(`✅ Created asset: ${asset.name || asset.title} (ID: ${asset._id})`);
            return asset;
        } catch (error) {
            console.error("❌ Failed to create website asset:", error.message);
            throw error;
        }
    }

    async uploadFileAsset(filePath) {
        try {
            if (!filePath) {
                throw new Error('File path is required');
            }
            if (!this.teamId) {
                throw new Error('Team ID is required');
            }

            console.log(`📁 Uploading file: ${filePath}`);
            const asset = await this.client.assets.uploadFileAsset(filePath, this.teamId);
            console.log(`✅ File uploaded: ${asset.name || asset.filename}`);
            return asset;
        } catch (error) {
            console.error("❌ Failed to upload file:", error.message);
            throw error;
        }
    }

    async modifyAsset(assetId, modifications) {
        try {
            if (!assetId) {
                throw new Error('Asset ID is required');
            }

            console.log(`✏️ Modifying asset: ${assetId}`);
            
            // Use correct field names for asset modifications
            const validModifications = {
                meta: modifications.meta || {},
                // Add other valid AssetInput fields here
            };

            const result = await this.client.assets.modifyAssetSettings(
                assetId, 
                validModifications, 
                this.teamId
            );
            console.log(`✅ Asset modified successfully`);
            return result;
        } catch (error) {
            console.error("❌ Failed to modify asset:", error.message);
            throw error;
        }
    }

    // =====================================
    // PLAYLIST MANAGEMENT - WORKING EXAMPLES
    // =====================================

    async createPlaylist(name, description = '') {
        try {
            if (!name) {
                throw new Error('Playlist name is required');
            }

            console.log(`🎵 Creating playlist: ${name}`);
            const playlistData = {
                name: name,
                teamId: this.teamId
            };

            if (description) {
                playlistData.description = description;
            }

            const playlist = await this.client.playlists.createPlaylist(playlistData);
            console.log(`✅ Created playlist: ${playlist.name} (ID: ${playlist._id})`);
            return playlist;
        } catch (error) {
            console.error("❌ Failed to create playlist:", error.message);
            throw error;
        }
    }

    async addAssetsToPlaylist(playlistId, assetIds) {
        try {
            if (!playlistId || !assetIds || assetIds.length === 0) {
                throw new Error('Playlist ID and asset IDs are required');
            }

            console.log(`➕ Adding ${assetIds.length} assets to playlist ${playlistId}`);
            const result = await this.client.playlists.addAssetsToPlaylist(playlistId, assetIds);
            console.log(`✅ Assets added to playlist successfully`);
            return result;
        } catch (error) {
            console.error("❌ Failed to add assets to playlist:", error.message);
            throw error;
        }
    }

    // =====================================
    // ERROR HANDLING WRAPPER
    // =====================================

    async safeApiCall(apiFunction, ...args) {
        try {
            return await apiFunction.apply(this, args);
        } catch (error) {
            if (error.message.includes('invalid signature')) {
                console.log("🔒 Token signature invalid - need fresh token");
                throw new Error('Authentication failed: Token expired or invalid');
            } else if (error.message.includes('Variable') && error.message.includes('required')) {
                console.log("📝 Parameter validation failed");
                throw new Error(`Invalid parameters: ${error.message}`);
            } else if (error.message.includes('API_NOT_AVAILABLE')) {
                console.log("🚫 API endpoint not available");
                throw new Error('This feature is not available');
            }
            throw error;
        }
    }

    // =====================================
    // UTILITY METHODS
    // =====================================

    validateDeviceId(deviceId) {
        return deviceId && deviceId !== 'undefined' && deviceId.length > 0;
    }

    validateTeamId() {
        if (!this.teamId) {
            throw new Error('Team ID not configured');
        }
        return true;
    }
}

// =====================================
// USAGE EXAMPLES
// =====================================

async function demonstrateUsage() {
    console.log("🚀 OptiSigns API Usage Examples");
    console.log("================================");

    // Initialize the manager
    const optisigns = new OptiSignsManager(API_CONFIG);

    try {
        // 1. Get all devices
        const devices = await optisigns.getAllDevices();
        console.log(`\n📊 Summary: ${devices.length} devices available`);

        // 2. Find a specific device
        if (devices.length > 0) {
            const firstDevice = devices[0];
            await optisigns.findDeviceByName(firstDevice.deviceName);

            // 3. Get device details (if ID is valid)
            if (optisigns.validateDeviceId(firstDevice.id)) {
                await optisigns.getDeviceById(firstDevice.id);
            }
        }

        // 4. Create a website asset
        const asset = await optisigns.createWebsiteAsset(
            "https://example.com",
            "Test Website Asset",
            "Created via API"
        );

        // 5. Create a playlist
        const playlist = await optisigns.createPlaylist(
            "API Test Playlist",
            "Created for testing purposes"
        );

        // 6. Add asset to playlist
        if (asset && playlist) {
            await optisigns.addAssetsToPlaylist(playlist._id, [asset._id]);
        }

        console.log("\n✅ All examples completed successfully!");

    } catch (error) {
        console.error("\n❌ Example failed:", error.message);
        
        if (error.message.includes('Authentication failed')) {
            console.log("\n💡 Action Required:");
            console.log("   1. Get fresh JWT token from backend team");
            console.log("   2. Update API_CONFIG.token with new token");
            console.log("   3. Ensure token expiration > current date");
        }
    }
}

// =====================================
// FOR BACKEND TEAM: TOKEN GENERATION
// =====================================

function generateTokenExample() {
    console.log("\n🔧 Backend Team - Token Generation Example:");
    console.log("============================================");
    
    console.log(`
const jwt = require('jsonwebtoken');

const tokenPayload = {
    uid: "r3CSCdKQhSPQzGDpN",           // User ID
    cid: "Naqtq9T96nPHY6b5Z",           // Team/Client ID  
    aid: "qhzR4CQykLdJwDbn8",           // Account ID
    iat: Math.floor(Date.now() / 1000), // Issued at (now)
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // Expires in 24h
    iss: "qhzR4CQykLdJwDbn8"            // Issuer (account ID)
};

const token = jwt.sign(tokenPayload, YOUR_SIGNING_KEY, { 
    algorithm: 'RS256' 
});

console.log('Fresh token:', token);
    `);
}

// Run examples if called directly
if (require.main === module) {
    demonstrateUsage();
    generateTokenExample();
}

module.exports = { OptiSignsManager, API_CONFIG }; 