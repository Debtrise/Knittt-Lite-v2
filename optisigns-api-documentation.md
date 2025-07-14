# OptiSigns API Documentation

Complete API documentation for the OptiSigns digital signage integration.

## Authentication

All endpoints require authentication using a Bearer token in the Authorization header:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

## Base URL

```
https://your-domain.com/api/optisigns
```

---

## 🔧 Configuration Endpoints

### Test API Connection

Test the OptiSigns API connection with provided credentials.

**Endpoint:** `POST /config/test`

**Request Body:**
```json
{
  "apiToken": "your_optisigns_api_token"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "user_id",
    "name": "User Name"
  },
  "message": "OptiSigns API connection test successful",
  "testDuration": "1250ms",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "GraphQL API connection failed: Invalid token",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### Get Configuration

Retrieve current OptiSigns configuration for the tenant.

**Endpoint:** `GET /config`

**Response:**
```json
{
  "apiToken": "***12345678",
  "settings": {},
  "isActive": true,
  "lastValidated": "2024-01-15T10:30:00.000Z",
  "status": "active"
}
```

---

### Update Configuration

Update OptiSigns configuration with new API token and settings.

**Endpoint:** `PUT /config`

**Request Body:**
```json
{
  "apiToken": "your_new_optisigns_api_token",
  "settings": {
    "autoSync": true,
    "syncInterval": 300
  }
}
```

**Response:**
```json
{
  "message": "Configuration updated successfully",
  "apiToken": "***12345678",
  "settings": {
    "autoSync": true,
    "syncInterval": 300
  },
  "isActive": true,
  "lastValidated": "2024-01-15T10:30:00.000Z"
}
```

---

## 📺 Device Management Endpoints

### Pair New Device

Pair a new OptiSigns device using a pairing code.

**Endpoint:** `POST /devices/pair`

**Request Body:**
```json
{
  "pairingCode": "3JRKC8"
}
```

**Response:**
```json
{
  "message": "Device paired successfully",
  "device": {
    "id": "uuid-device-id",
    "name": "OptiSign Display 12345678",
    "optisignsDisplayId": "optisigns-device-id",
    "uuid": "device-uuid",
    "status": "PAIRED",
    "isActive": true,
    "isOnline": true
  },
  "optisignsData": {
    "_id": "optisigns-device-id",
    "deviceName": "Display Name",
    "UUID": "device-uuid",
    "currentType": "PLAYLIST"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### Update Device

Update device settings and content assignments.

**Endpoint:** `PUT /devices/{deviceId}`

**Path Parameters:**
- `deviceId` (UUID) - Local device ID

**Request Body:**
```json
{
  "deviceName": "Lobby Display",
  "currentType": "PLAYLIST",
  "currentPlaylistId": "playlist-id"
}
```

**Response:**
```json
{
  "message": "Device updated successfully",
  "device": {
    "id": "uuid-device-id",
    "name": "Lobby Display",
    "currentType": "PLAYLIST",
    "currentPlaylistId": "playlist-id",
    "status": "ONLINE"
  },
  "optisignsData": {
    "_id": "optisigns-device-id",
    "deviceName": "Lobby Display",
    "currentType": "PLAYLIST",
    "currentPlaylistId": "playlist-id"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### Sync Displays

Synchronize all displays from OptiSigns API to local database.

**Endpoint:** `POST /displays/sync`

**Response:**
```json
{
  "message": "Successfully synced 5 displays",
  "summary": {
    "totalSynced": 5,
    "onlineDisplays": 4,
    "offlineDisplays": 1
  },
  "displays": [
    {
      "id": "uuid-device-id",
      "name": "Display 1",
      "status": "ONLINE",
      "isOnline": true,
      "location": "Lobby"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### Get Displays

Retrieve displays with filtering and pagination.

**Endpoint:** `GET /displays`

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 50) - Items per page
- `status` (string) - Filter by status
- `isOnline` (boolean) - Filter by online status
- `location` (string) - Filter by location

**Response:**
```json
{
  "displays": [
    {
      "id": "uuid-device-id",
      "name": "Lobby Display",
      "status": "ONLINE",
      "isOnline": true,
      "location": "Main Lobby",
      "currentType": "PLAYLIST",
      "schedules": [
        {
          "id": "schedule-id",
          "status": "ACTIVE",
          "startTime": "2024-01-15T09:00:00.000Z",
          "endTime": "2024-01-15T18:00:00.000Z"
        }
      ]
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalCount": 150,
    "hasNextPage": true,
    "hasPreviousPage": false
  },
  "statistics": {
    "total": 150,
    "online": 140,
    "offline": 10,
    "withActiveSchedules": 75
  }
}
```

---

### Delete Device

Delete a device from both OptiSigns and local database.

**Endpoint:** `DELETE /devices/{deviceId}`

**Path Parameters:**
- `deviceId` (UUID) - Local device ID

**Response:**
```json
{
  "message": "Device deleted successfully",
  "deviceId": "uuid-device-id",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 🎨 Asset Management Endpoints

### Upload Asset

Upload a media file as an asset to OptiSigns.

**Endpoint:** `POST /assets/upload`

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `file` (file) - Media file to upload
- `name` (string) - Asset name
- `type` (string, optional) - Asset type

**Response:**
```json
{
  "message": "Asset uploaded successfully",
  "asset": {
    "id": "uuid-asset-id",
    "name": "My Video.mp4",
    "type": "video/mp4",
    "fileType": "video/mp4",
    "fileSize": 1048576,
    "url": "https://cdn.optisigns.com/assets/...",
    "status": "uploaded"
  },
  "optisignsData": {
    "id": "optisigns-asset-id",
    "name": "My Video.mp4",
    "url": "https://cdn.optisigns.com/assets/...",
    "fileSize": 1048576
  },
  "fileInfo": {
    "originalName": "video.mp4",
    "size": 1048576,
    "mimetype": "video/mp4"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### Sync Assets

Synchronize all assets from OptiSigns API to local database.

**Endpoint:** `POST /assets/sync`

**Response:**
```json
{
  "message": "Successfully synced 25 assets",
  "summary": {
    "totalSynced": 25,
    "byType": {
      "image": 15,
      "video": 8,
      "pdf": 2
    }
  },
  "assets": [
    {
      "id": "uuid-asset-id",
      "name": "Asset Name",
      "type": "image",
      "fileSize": 512000
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### Get Assets

Retrieve assets with filtering and pagination.

**Endpoint:** `GET /assets`

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 50) - Items per page
- `type` (string) - Filter by asset type
- `search` (string) - Search in name and file type

**Response:**
```json
{
  "assets": [
    {
      "id": "uuid-asset-id",
      "name": "Marketing Video",
      "type": "video",
      "fileType": "video/mp4",
      "fileSize": 2048000,
      "url": "https://cdn.optisigns.com/assets/...",
      "webLink": "https://cdn.optisigns.com/assets/...",
      "status": "created",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalCount": 250
  },
  "statistics": {
    "total": 250,
    "byType": {
      "image": 150,
      "video": 75,
      "pdf": 25
    },
    "totalSize": 104857600
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### Delete Asset

Delete an asset from both OptiSigns and local database.

**Endpoint:** `DELETE /assets/{assetId}`

**Path Parameters:**
- `assetId` (UUID) - Local asset ID

**Response:**
```json
{
  "message": "Asset deleted successfully",
  "assetId": "uuid-asset-id",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 📋 Playlist Management Endpoints

### Create Playlist

Create a new playlist in OptiSigns.

**Endpoint:** `POST /playlists`

**Request Body:**
```json
{
  "name": "Morning Announcements",
  "description": "Daily morning content rotation"
}
```

**Response:**
```json
{
  "message": "Playlist created successfully",
  "playlist": {
    "id": "uuid-playlist-id",
    "name": "Morning Announcements",
    "description": "Daily morning content rotation",
    "assetCount": 0,
    "duration": null,
    "isActive": true
  },
  "optisignsData": {
    "id": "optisigns-playlist-id",
    "name": "Morning Announcements",
    "assetCount": 0
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### Add Assets to Playlist

Add multiple assets to an existing playlist.

**Endpoint:** `POST /playlists/{playlistId}/assets`

**Path Parameters:**
- `playlistId` (UUID) - Local playlist ID

**Request Body:**
```json
{
  "assetIds": [
    "uuid-asset-1",
    "uuid-asset-2",
    "uuid-asset-3"
  ]
}
```

**Response:**
```json
{
  "message": "Assets added to playlist successfully",
  "playlist": {
    "id": "uuid-playlist-id",
    "name": "Morning Announcements",
    "assetCount": 3,
    "duration": 180
  },
  "addedAssets": 3,
  "optisignsData": {
    "id": "optisigns-playlist-id",
    "assetCount": 3,
    "duration": 180
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### Get Playlists

Retrieve playlists with their associated assets.

**Endpoint:** `GET /playlists`

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 50) - Items per page
- `search` (string) - Search in name and description

**Response:**
```json
{
  "playlists": [
    {
      "id": "uuid-playlist-id",
      "name": "Morning Announcements",
      "description": "Daily morning content rotation",
      "assetCount": 3,
      "duration": 180,
      "isActive": true,
      "playlistAssets": [
        {
          "position": 0,
          "duration": 60,
          "content": {
            "id": "uuid-asset-1",
            "name": "Welcome Message",
            "type": "video",
            "fileType": "video/mp4"
          }
        }
      ],
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 2,
    "totalCount": 15
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 🏷️ Tag Management Endpoints

### Create Tag

Create a new tag for organizing resources.

**Endpoint:** `POST /tags`

**Request Body:**
```json
{
  "name": "Lobby Content",
  "color": "#FF5733"
}
```

**Response:**
```json
{
  "message": "Tag created successfully",
  "tag": {
    "id": "uuid-tag-id",
    "name": "Lobby Content",
    "color": "#FF5733",
    "isActive": true
  },
  "optisignsData": {
    "id": "optisigns-tag-id",
    "name": "Lobby Content"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### Apply Tag to Resource

Apply a tag to a display, content, or playlist.

**Endpoint:** `POST /tags/{tagId}/apply`

**Path Parameters:**
- `tagId` (UUID) - Local tag ID

**Request Body:**
```json
{
  "resourceType": "DISPLAY",
  "resourceId": "uuid-display-id"
}
```

**Valid resourceType values:**
- `DISPLAY` - Apply to a display
- `CONTENT` - Apply to content/asset
- `PLAYLIST` - Apply to a playlist

**Response:**
```json
{
  "message": "Tag applied successfully",
  "tag": {
    "id": "uuid-tag-id",
    "name": "Lobby Content"
  },
  "resource": {
    "id": "uuid-display-id",
    "name": "Lobby Display"
  },
  "optisignsData": {
    "id": "optisigns-resource-id",
    "tags": [
      {
        "id": "optisigns-tag-id",
        "name": "Lobby Content"
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### Get Tags

Retrieve all tags with usage statistics.

**Endpoint:** `GET /tags`

**Response:**
```json
{
  "tags": [
    {
      "id": "uuid-tag-id",
      "name": "Lobby Content",
      "color": "#FF5733",
      "isActive": true,
      "usageCount": 5,
      "usageByType": {
        "DISPLAY": 2,
        "CONTENT": 3,
        "PLAYLIST": 0
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 📅 Scheduling Endpoints

### Schedule Content

Schedule content to be displayed on a device during specific time periods.

**Endpoint:** `POST /schedules`

**Request Body:**
```json
{
  "deviceId": "uuid-device-id",
  "playlistId": "uuid-playlist-id",
  "contentType": "PLAYLIST",
  "startTime": "2024-01-15T09:00:00Z",
  "endTime": "2024-01-15T18:00:00Z",
  "isRecurring": true,
  "recurrencePattern": {
    "type": "daily",
    "weekdays": [1, 2, 3, 4, 5]
  }
}
```

**Request Body (for single asset):**
```json
{
  "deviceId": "uuid-device-id",
  "contentId": "uuid-content-id",
  "contentType": "ASSET",
  "startTime": "2024-01-15T12:00:00Z",
  "endTime": "2024-01-15T12:30:00Z",
  "isRecurring": false
}
```

**Response:**
```json
{
  "message": "Content scheduled successfully",
  "schedule": {
    "id": "uuid-schedule-id",
    "displayId": "uuid-device-id",
    "playlistId": "uuid-playlist-id",
    "contentType": "PLAYLIST",
    "startTime": "2024-01-15T09:00:00.000Z",
    "endTime": "2024-01-15T18:00:00.000Z",
    "status": "SCHEDULED",
    "isRecurring": true,
    "recurrencePattern": {
      "type": "daily",
      "weekdays": [1, 2, 3, 4, 5]
    }
  },
  "optisignsData": {
    "id": "optisigns-schedule-id",
    "status": "SCHEDULED",
    "deviceId": "optisigns-device-id",
    "playlistId": "optisigns-playlist-id"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### Get Schedules

Retrieve schedules with filtering options.

**Endpoint:** `GET /schedules`

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 50) - Items per page
- `status` (string) - Filter by status (SCHEDULED, ACTIVE, COMPLETED, CANCELLED)
- `deviceId` (UUID) - Filter by device
- `startDate` (ISO date) - Filter schedules starting after this date
- `endDate` (ISO date) - Filter schedules starting before this date

**Response:**
```json
{
  "schedules": [
    {
      "id": "uuid-schedule-id",
      "displayId": "uuid-device-id",
      "playlistId": "uuid-playlist-id",
      "contentType": "PLAYLIST",
      "startTime": "2024-01-15T09:00:00.000Z",
      "endTime": "2024-01-15T18:00:00.000Z",
      "status": "ACTIVE",
      "isRecurring": true,
      "display": {
        "id": "uuid-device-id",
        "name": "Lobby Display",
        "status": "ONLINE",
        "isOnline": true
      },
      "playlist": {
        "id": "uuid-playlist-id",
        "name": "Morning Announcements",
        "assetCount": 3,
        "duration": 180
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalCount": 125
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 📊 Analytics Endpoints

### Get Analytics

Retrieve comprehensive analytics and statistics.

**Endpoint:** `GET /analytics`

**Query Parameters:**
- `startDate` (ISO date, optional) - Analytics start date
- `endDate` (ISO date, optional) - Analytics end date

**Response:**
```json
{
  "summary": {
    "totalDisplays": 25,
    "onlineDisplays": 23,
    "offlineDisplays": 2,
    "totalAssets": 150,
    "totalPlaylists": 15,
    "totalSchedules": 75,
    "activeSchedules": 12,
    "uptime": "92.0"
  },
  "contentAnalytics": {
    "byType": [
      {
        "type": "image",
        "count": 85,
        "totalSize": 45000000
      },
      {
        "type": "video", 
        "count": 50,
        "totalSize": 2500000000
      },
      {
        "type": "pdf",
        "count": 15,
        "totalSize": 75000000
      }
    ],
    "totalSize": 2620000000
  },
  "playlistAnalytics": {
    "topUsed": [
      {
        "id": "uuid-playlist-1",
        "name": "Morning Announcements",
        "assetCount": 5,
        "scheduleCount": 8
      }
    ],
    "averageAssets": "10.0"
  },
  "health": {
    "status": "warning",
    "issues": [
      "2 displays offline"
    ]
  },
  "lastUpdated": "2024-01-15T10:30:00.000Z"
}
```

---

## ⚠️ Legacy Endpoints (Deprecated)

These endpoints are maintained for backward compatibility but are deprecated:

### Legacy Content Endpoints
- `GET /content` → Use `GET /assets`
- `POST /content` → Use `POST /assets/upload`

### Legacy Display Endpoints
- `POST /displays/{displayId}/reboot` → Not supported (returns 501)
- `POST /displays/{displayId}/assign` → Use `PUT /devices/{deviceId}`

---

## Error Responses

All endpoints may return these error responses:

### 400 Bad Request
```json
{
  "error": "Invalid request parameters",
  "details": "Device ID is required"
}
```

### 401 Unauthorized
```json
{
  "error": "Access denied",
  "message": "Invalid or missing authentication token"
}
```

### 403 Forbidden
```json
{
  "error": "Access denied",
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found",
  "message": "Device not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Database connection failed"
}
```

### OptiSigns API Errors
```json
{
  "error": "GraphQL Error: Invalid device ID",
  "hint": "Check that the device exists in OptiSigns"
}
```

---

## Rate Limiting

- **Configuration endpoints**: 10 requests per minute
- **Data retrieval endpoints**: 100 requests per minute  
- **File upload endpoints**: 5 requests per minute
- **Sync operations**: 2 requests per minute

---

## Webhooks

Currently, OptiSigns does not support webhook functionality. All data synchronization must be done through polling or manual sync operations.

---

## Examples

### Complete Workflow Example

```bash
# 1. Test API connection
curl -X POST "https://your-domain.com/api/optisigns/config/test" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"apiToken": "your_optisigns_token"}'

# 2. Update configuration
curl -X PUT "https://your-domain.com/api/optisigns/config" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"apiToken": "your_optisigns_token", "settings": {}}'

# 3. Sync displays
curl -X POST "https://your-domain.com/api/optisigns/displays/sync" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 4. Upload an asset
curl -X POST "https://your-domain.com/api/optisigns/assets/upload" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@video.mp4" \
  -F "name=Welcome Video"

# 5. Create a playlist
curl -X POST "https://your-domain.com/api/optisigns/playlists" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Morning Content", "description": "Daily rotation"}'

# 6. Schedule content
curl -X POST "https://your-domain.com/api/optisigns/schedules" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "device-uuid",
    "playlistId": "playlist-uuid", 
    "contentType": "PLAYLIST",
    "startTime": "2024-01-15T09:00:00Z",
    "endTime": "2024-01-15T18:00:00Z"
  }'
```

---

## SDK and Libraries

### JavaScript/Node.js Example

```javascript
const axios = require('axios');

class OptiSignsClient {
  constructor(baseUrl, authToken) {
    this.baseUrl = baseUrl;
    this.authToken = authToken;
  }

  async syncDisplays() {
    const response = await axios.post(
      `${this.baseUrl}/api/optisigns/displays/sync`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      }
    );
    return response.data;
  }

  async uploadAsset(file, name) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);

    const response = await axios.post(
      `${this.baseUrl}/api/optisigns/assets/upload`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  }
}
```

---

## Support

For technical support or API questions:
- Review error messages and HTTP status codes
- Check the OptiSigns API status at their documentation
- Ensure proper authentication and API token validity
- Verify database connectivity for sync operations