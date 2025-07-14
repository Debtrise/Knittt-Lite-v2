# Backend Content API Requirements

The following API endpoints need to be implemented on the backend server at `http://34.122.156.88:3001/api` to support the enhanced content creation and publishing functionality.

## Base URL
```
http://34.122.156.88:3001/api
```

## Content Management APIs

### 1. Get All Projects
**Endpoint:** `GET /content/projects`

**Parameters:**
- `status` (optional): Filter by status ('draft', 'published', 'archived')
- `search` (optional): Search by name or description
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "projects": [
    {
      "id": "uuid",
      "name": "Project Name",
      "description": "Description",
      "status": "published",
      "version": 1,
      "canvasSize": { "width": 1920, "height": 1080 },
      "canvasBackground": {
        "type": "solid",
        "color": "#ffffff"
      },
      "elements": [...],
      "variables": {},
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z",
      "lastEditedBy": 1,
      "publishedAt": "2024-01-15T10:00:00Z",
      "exportId": "export-uuid"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### 2. Create Project
**Endpoint:** `POST /content/projects`

**Request Body:**
```json
{
  "name": "Project Name",
  "description": "Description",
  "canvasSize": { "width": 1920, "height": 1080 },
  "canvasBackground": {
    "type": "solid",
    "color": "#ffffff"
  }
}
```

**Response:**
```json
{
  "message": "Project created successfully",
  "project": { ... }
}
```

### 3. Get Specific Project
**Endpoint:** `GET /content/projects/{projectId}`

**Response:**
```json
{
  "project": { ... }
}
```

### 4. Update Project
**Endpoint:** `PUT /content/projects/{projectId}`

**Request Body:** (any project fields to update)

**Response:**
```json
{
  "message": "Project updated successfully",
  "project": { ... }
}
```

### 5. Delete Project
**Endpoint:** `DELETE /content/projects/{projectId}`

**Response:**
```json
{
  "message": "Project deleted successfully",
  "project": { ... }
}
```

### 6. Add Elements to Project
**Endpoint:** `POST /content/projects/{projectId}/elements`

**Request Body:**
```json
{
  "type": "text",
  "position": { "x": 960, "y": 540, "z": 1 },
  "size": { "width": 800, "height": 100 },
  "properties": { "text": "Hello World" },
  "styles": { "fontSize": "48px", "color": "#333333" },
  "layerOrder": 1,
  "animations": [],
  "assetId": "optional-asset-id",
  "opacity": 1,
  "metadata": {},
  "isLocked": false,
  "isVisible": true,
  "groupId": "optional-group-id",
  "constraints": {}
}
```

**Response:**
```json
{
  "message": "Element created successfully",
  "element": { ... }
}
```

## Publishing APIs

### 7. Publish Project to OptiSigns
**Endpoint:** `POST /content/projects/{projectId}/publish`

**Request Body:**
```json
{
  "displayIds": ["display-uuid-1", "display-uuid-2"],
  "priority": "HIGH",
  "duration": 3600,
  "message": "New content update",
  "restoreAfter": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Project published successfully. 2/2 displays updated.",
  "asset": {
    "id": "asset-uuid",
    "optisignsId": "optisigns-asset-id",
    "name": "My Project_1705315200000",
    "url": "https://api.knittt.com/api/content/public/72e09d8c-d0ca-4233-83b7-d2b72cd521f9",
    "publicUrl": "https://api.knittt.com/api/content/public/72e09d8c-d0ca-4233-83b7-d2b72cd521f9"
  },
  "takeovers": {
    "successful": [
      {
        "displayId": "display-uuid-1",
        "takeoverId": "takeover-uuid",
        "deviceName": "Lobby Display"
      }
    ],
    "failed": []
  },
  "summary": {
    "totalDisplays": 2,
    "successfulTakeovers": 2,
    "failedTakeovers": 0,
    "assetUploaded": true
  },
  "displayIds": ["display-uuid-1", "display-uuid-2"],
  "export": {
    "id": "export-uuid",
    "url": "https://api.knittt.com/api/content/public/export-uuid",
    "type": "web",
    "resolution": { "width": 1920, "height": 1080 }
  }
}
```

## Public Content APIs

### 8. Serve Public Content
**Endpoint:** `GET /content/public/{exportId}`

**Authentication:** None required (public endpoint)

**Response:** HTML content ready for display

**Headers:**
- `Content-Type: text/html`
- `Cache-Control: public, max-age=300`
- `X-Frame-Options: ALLOWALL`
- `Access-Control-Allow-Origin: *`

### 9. Get Content Metadata
**Endpoint:** `GET /content/public/{exportId}/info`

**Authentication:** None required (public endpoint)

**Response:**
```json
{
  "id": "72e09d8c-d0ca-4233-83b7-d2b72cd521f9",
  "projectId": "12345678-1234-1234-1234-123456789012",
  "resolution": {
    "width": 1920,
    "height": 1080
  },
  "type": "web",
  "url": "https://api.knittt.com/api/content/public/72e09d8c-d0ca-4233-83b7-d2b72cd521f9",
  "created": "2024-01-15T10:00:00Z",
  "updated": "2024-01-15T10:00:00Z"
}
```

## Export Management APIs

### 10. Create Export
**Endpoint:** `POST /content/projects/{projectId}/export`

**Request Body:**
```json
{
  "exportType": "image",
  "options": {
    "quality": "high",
    "dimensions": { "width": 1920, "height": 1080 },
    "includeAnimations": true,
    "backgroundColor": "#ffffff"
  }
}
```

### 11. Get Project Exports
**Endpoint:** `GET /content/projects/{projectId}/exports`

**Parameters:**
- `exportType` (optional)
- `status` (optional)
- `page` (optional)
- `limit` (optional)

### 12. Export Status and Management
**Endpoints:**
- `GET /content/exports/{exportId}`
- `GET /content/exports/{exportId}/status`
- `GET /content/exports/{exportId}/download`
- `DELETE /content/exports/{exportId}`

## OptiSigns Status APIs

### 13. OptiSigns Status Management
**Endpoints:**
- `GET /content/projects/{projectId}/optisigns-status`
- `POST /content/projects/{projectId}/unpublish`
- `POST /content/projects/{projectId}/optisigns-sync`

## Implementation Notes

### Database Schema
You'll need database tables for:
- `content_projects`
- `content_elements`
- `content_exports`
- `content_assets`
- `optisigns_publications`

### HTML Generation
The `/content/public/{exportId}` endpoint should:
1. Fetch project data from database
2. Generate responsive HTML with CSS
3. Include auto-scaling JavaScript
4. Handle different element types (text, image, video, shapes)
5. Apply animations and styling
6. Return optimized HTML for display

### OptiSigns Integration
The publish endpoint should:
1. Generate HTML export
2. Create OptiSigns web asset
3. Trigger display takeovers
4. Handle offline devices (queue for later)
5. Return detailed status

### Authentication
All authenticated endpoints should:
- Validate Bearer tokens
- Check tenant permissions
- Log user actions

### Error Handling
- Return consistent error formats
- Log errors for debugging
- Handle OptiSigns API failures gracefully

This API structure matches the frontend expectations and provides a complete content hosting and publishing solution integrated with OptiSigns. 