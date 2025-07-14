# Content Creation System - API Documentation

## Overview
The Content Creation System provides a comprehensive API for managing digital content, templates, assets, and variables for dynamic display generation. This system integrates with OptiSigns for digital signage deployment.

### Base URL
```
http://3001/api
```

### Authentication
All endpoints require Bearer token authentication:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 📋 Template Endpoints

### GET /content/templates
Get all templates with filtering and pagination.

**Query Parameters:**
- `category` (optional): Filter by template category
- `isPublic` (optional): Filter by public/private templates
- `search` (optional): Search in name and description
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "templates": [
    {
      "id": "uuid",
      "name": "Welcome Hero",
      "description": "Bold welcome screen with animated text",
      "category": "welcome_screen",
      "canvasSize": {"width": 1920, "height": 1080},
      "previewImage": "url",
      "usageCount": 25,
      "isPublic": false,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalCount": 12
  },
  "message": "Retrieved 5 templates",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### GET /content/templates/:templateId
Get a specific template with full details.

**Response:**
```json
{
  "template": {
    "id": "uuid",
    "name": "Welcome Hero",
    "description": "Bold welcome screen with animated text",
    "category": "welcome_screen",
    "canvasSize": {"width": 1920, "height": 1080},
    "templateData": {
      "elements": [...],
      "canvasBackground": {"type": "solid", "color": "#ffffff"}
    },
    "variables": {"lead.name": "Valued Customer"},
    "isPublic": false,
    "usageCount": 25
  },
  "message": "Template retrieved successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### POST /content/templates
Create a new template.

**Request Body:**
```json
{
  "name": "Custom Template",
  "description": "My custom template",
  "category": "custom",
  "canvasSize": {"width": 1920, "height": 1080},
  "elements": [
    {
      "elementType": "text",
      "position": {"x": 100, "y": 100, "z": 1},
      "size": {"width": 400, "height": 80},
      "properties": {"text": "Hello {lead.name}!"},
      "styles": {"fontSize": "24px", "color": "#000000"}
    }
  ],
  "variables": {"lead.name": "Customer"},
  "isPublic": false
}
```

**Response:**
```json
{
  "template": {
    "id": "new-uuid",
    "name": "Custom Template",
    "description": "My custom template",
    "category": "custom",
    "usageCount": 0,
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "message": "Template created successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 📁 Project Endpoints

### GET /content/projects
Get all projects with filtering and pagination.

**Query Parameters:**
- `status` (optional): Filter by project status (draft, published, archived)
- `search` (optional): Search in name and description
- `createdBy` (optional): Filter by creator user ID
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "projects": [
    {
      "id": "uuid",
      "name": "Welcome Screen V2",
      "description": "Updated welcome screen",
      "status": "published",
      "version": 1,
      "lastEditedBy": 1,
      "publishedAt": "2024-01-15T10:30:00Z",
      "template": {
        "id": "template-uuid",
        "name": "Welcome Hero",
        "category": "welcome_screen"
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 2,
    "totalCount": 8
  },
  "message": "Retrieved 5 projects",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### GET /content/projects/:projectId
Get a specific project with all elements.

**Response:**
```json
{
  "project": {
    "id": "uuid",
    "name": "Welcome Screen V2",
    "description": "Updated welcome screen",
    "canvasSize": {"width": 1920, "height": 1080},
    "canvasBackground": {"type": "solid", "color": "#ffffff"},
    "status": "published",
    "elements": [
      {
        "id": "element-uuid",
        "elementType": "text",
        "position": {"x": 100, "y": 100, "z": 1},
        "size": {"width": 400, "height": 80},
        "properties": {"text": "Welcome {lead.name}!"},
        "styles": {"fontSize": "24px", "color": "#000000"},
        "layerOrder": 1,
        "asset": null
      }
    ],
    "template": {
      "id": "template-uuid",
      "name": "Welcome Hero",
      "category": "welcome_screen"
    }
  },
  "message": "Project retrieved successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### POST /content/projects
Create a new project.

**Request Body:**
```json
{
  "name": "My New Project",
  "description": "A custom project",
  "templateId": "template-uuid",  // Optional: create from template
  "canvasSize": {"width": 1920, "height": 1080},
  "canvasBackground": {"type": "solid", "color": "#ffffff"},
  "variables": {"lead.name": "Customer"}
}
```

**Response:**
```json
{
  "project": {
    "id": "new-uuid",
    "name": "My New Project",
    "status": "draft",
    "version": 1,
    "elements": [],
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "message": "Project created successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### PUT /content/projects/:projectId
Update project properties.

**Request Body:**
```json
{
  "name": "Updated Project Name",
  "description": "Updated description",
  "canvasBackground": {"type": "gradient", "gradient": "linear-gradient(45deg, #ff0000, #0000ff)"},
  "variables": {"lead.name": "Valued Customer", "company.name": "ACME Corp"}
}
```

### POST /content/projects/:projectId/duplicate
Duplicate an existing project.

**Request Body:**
```json
{
  "name": "Copy of Original Project"
}
```

### DELETE /content/projects/:projectId
Delete a project and all its elements.

**Response:**
```json
{
  "message": "Project deleted successfully",
  "projectId": "uuid",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 🧩 Element Endpoints

### POST /content/projects/:projectId/elements
Create a new element in a project.

**Request Body:**
```json
{
  "type": "text",
  "position": {"x": 200, "y": 150, "z": 1},
  "size": {"width": 400, "height": 100},
  "properties": {
    "text": "Hello {lead.name}!",
    "textAlign": "center"
  },
  "styles": {
    "fontSize": "32px",
    "fontWeight": "bold",
    "color": "#1f2937",
    "fontFamily": "Arial, sans-serif"
  },
  "animations": [
    {
      "type": "fadeIn",
      "duration": 1000,
      "delay": 500
    }
  ],
  "assetId": "asset-uuid"  // Optional: for image/video elements
}
```

**Response:**
```json
{
  "element": {
    "id": "new-element-uuid",
    "elementType": "text",
    "position": {"x": 200, "y": 150, "z": 1},
    "size": {"width": 400, "height": 100},
    "layerOrder": 3,
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "message": "Element created successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### PUT /content/projects/:projectId/elements/:elementId
Update an existing element.

**Request Body:**
```json
{
  "position": {"x": 250, "y": 200, "z": 1},
  "size": {"width": 500, "height": 120},
  "properties": {
    "text": "Updated text content"
  },
  "styles": {
    "fontSize": "36px",
    "color": "#3b82f6"
  },
  "opacity": 0.9
}
```

### DELETE /content/projects/:projectId/elements/:elementId
Delete an element from a project.

### PUT /content/projects/:projectId/elements/reorder
Reorder elements by layer order.

**Request Body:**
```json
{
  "elementOrders": [
    {"elementId": "uuid1", "layerOrder": 0},
    {"elementId": "uuid2", "layerOrder": 1},
    {"elementId": "uuid3", "layerOrder": 2}
  ]
}
```

---

## 📎 Asset Endpoints

### GET /content/assets
Get all assets with filtering and pagination.

**Query Parameters:**
- `assetType` (optional): Filter by type (image, video, audio, document)
- `search` (optional): Search in name
- `tags` (optional): Comma-separated list of tags
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)

**Response:**
```json
{
  "assets": [
    {
      "id": "uuid",
      "name": "company-logo.png",
      "assetType": "image",
      "mimeType": "image/png",
      "fileSize": 512000,
      "publicUrl": "/uploads/content/assets/logo.png",
      "thumbnailUrl": "/uploads/content/thumbnails/thumb-logo.png",
      "dimensions": {"width": 500, "height": 500},
      "tags": ["logo", "brand"],
      "usageCount": 12,
      "uploadedAt": "2024-01-10T14:20:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalCount": 45
  },
  "message": "Retrieved 20 assets",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### POST /content/assets/upload
Upload a new asset file.

**Request:** Multipart form data
- `file`: The file to upload
- `name` (optional): Custom name for the asset
- `tags` (optional): Comma-separated tags
- `metadata` (optional): JSON string with additional metadata

**Response:**
```json
{
  "asset": {
    "id": "new-uuid",
    "name": "uploaded-image.jpg",
    "assetType": "image",
    "mimeType": "image/jpeg",
    "fileSize": 2048576,
    "publicUrl": "/uploads/content/assets/uploaded-image.jpg",
    "thumbnailUrl": "/uploads/content/thumbnails/thumb-uploaded-image.jpg",
    "dimensions": {"width": 1920, "height": 1080},
    "processingStatus": "completed"
  },
  "message": "Asset uploaded successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### DELETE /content/assets/:assetId
Delete an asset (only if not in use).

**Response:**
```json
{
  "message": "Asset deleted successfully",
  "assetId": "uuid",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 🔧 Variable Endpoints

### GET /content/variables
Get all variables with optional filtering.

**Query Parameters:**
- `category` (optional): Filter by variable category
- `dataSource` (optional): Filter by data source (lead, call, tenant, system, etc.)

**Response:**
```json
{
  "variables": [
    {
      "id": "uuid",
      "name": "lead.name",
      "displayName": "Lead Name",
      "description": "Full name of the lead",
      "dataType": "string",
      "dataSource": "lead",
      "sourceField": "name",
      "defaultValue": "Valued Customer",
      "category": "Lead Information",
      "isSystemVariable": true
    }
  ],
  "groupedVariables": {
    "Lead Information": [...],
    "System": [...],
    "Company": [...]
  },
  "message": "Retrieved 15 variables",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### POST /content/variables
Create a new variable.

**Request Body:**
```json
{
  "name": "custom.greeting",
  "displayName": "Custom Greeting",
  "description": "Personalized greeting message",
  "dataType": "string",
  "dataSource": "static",
  "defaultValue": "Hello there!",
  "formatTemplate": "🎉 {value}",
  "category": "Custom",
  "isRequired": false
}
```

**Response:**
```json
{
  "variable": {
    "id": "new-uuid",
    "name": "custom.greeting",
    "displayName": "Custom Greeting",
    "dataType": "string",
    "dataSource": "static",
    "isSystemVariable": false,
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "message": "Variable created successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### POST /content/variables/initialize-system
Initialize default system variables for the tenant.

**Response:**
```json
{
  "variables": [
    {
      "name": "lead.name",
      "displayName": "Lead Name",
      "category": "Lead Information"
    },
    {
      "name": "current.date",
      "displayName": "Current Date",
      "category": "System"
    }
  ],
  "message": "Initialized 8 system variables",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 👁️ Preview & Export Endpoints

### POST /content/projects/:projectId/preview
Generate a preview of the project with variable data.

**Request Body:**
```json
{
  "contextData": {
    "lead": {
      "id": 123,
      "name": "John Doe",
      "phone": "(555) 123-4567",
      "email": "john@example.com"
    },
    "call": {
      "status": "Connected",
      "duration": 45
    },
    "tenant": {
      "name": "ACME Corporation"
    }
  }
}
```

**Response:**
```json
{
  "preview": {
    "project": {
      "id": "uuid",
      "name": "Welcome Screen",
      "canvasSize": {"width": 1920, "height": 1080},
      "canvasBackground": {"type": "solid", "color": "#ffffff"}
    },
    "elements": [
      {
        "id": "element-uuid",
        "type": "text",
        "position": {"x": 400, "y": 200, "z": 1},
        "size": {"width": 600, "height": 100},
        "properties": {
          "text": "Welcome, John Doe!"  // Variable resolved
        },
        "styles": {"fontSize": "48px", "color": "#1f2937"},
        "layerOrder": 1
      }
    ],
    "variables": {
      "lead.name": "John Doe",
      "current.date": "January 15, 2024",
      "company.name": "ACME Corporation"
    },
    "timestamp": "2024-01-15T10:30:00Z"
  },
  "message": "Preview generated successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### POST /content/projects/:projectId/publish
Publish project to OptiSigns displays.

**Request Body:**
```json
{
  "displayIds": ["display-uuid-1", "display-uuid-2"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Project published to OptiSigns successfully",
  "displayIds": ["display-uuid-1", "display-uuid-2"],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 📊 Analytics Endpoint

### GET /content/analytics
Get content creation analytics and statistics.

**Response:**
```json
{
  "summary": {
    "totalProjects": 12,
    "totalTemplates": 6,
    "totalAssets": 45,
    "totalElements": 89
  },
  "projectStatuses": [
    {"status": "draft", "count": 4},
    {"status": "published", "count": 8}
  ],
  "assetTypes": [
    {"assetType": "image", "count": 35, "totalSize": 52428800},
    {"assetType": "video", "count": 8, "totalSize": 157286400},
    {"assetType": "audio", "count": 2, "totalSize": 5242880}
  ],
  "message": "Analytics retrieved successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## ⚙️ System Endpoint

### GET /content/system/status
Get system status and capabilities.

**Response:**
```json
{
  "status": "active",
  "capabilities": {
    "templates": true,
    "projects": true,
    "dragAndDrop": true,
    "variables": true,
    "animations": true,
    "assetUpload": true,
    "preview": true,
    "optisignsIntegration": true,
    "export": false
  },
  "supportedAssetTypes": [
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "video/mp4", "video/webm",
    "audio/mp3", "audio/wav",
    "application/pdf"
  ],
  "supportedElementTypes": [
    "text", "image", "video", "shape", "button", 
    "qr_code", "chart", "timer", "weather", "animation", "confetti"
  ],
  "maxFileSize": "50MB",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Detailed error message",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Element Types Reference

### Text Element
```json
{
  "elementType": "text",
  "properties": {
    "text": "Hello {lead.name}!",
    "textAlign": "center"
  },
  "styles": {
    "fontSize": "24px",
    "fontWeight": "bold",
    "color": "#000000",
    "fontFamily": "Arial, sans-serif"
  }
}
```

### Image Element
```json
{
  "elementType": "image",
  "properties": {
    "src": "https://example.com/image.jpg",
    "alt": "Description"
  },
  "styles": {
    "objectFit": "cover",
    "borderRadius": "8px"
  },
  "assetId": "asset-uuid"
}
```

### Shape Element
```json
{
  "elementType": "shape",
  "properties": {
    "shape": "rectangle"
  },
  "styles": {
    "backgroundColor": "#3b82f6",
    "borderRadius": "12px",
    "boxShadow": "0 4px 6px rgba(0, 0, 0, 0.1)"
  }
}
```

### Video Element
```json
{
  "elementType": "video",
  "properties": {
    "src": "/uploads/video.mp4",
    "autoplay": true,
    "loop": false
  },
  "assetId": "video-asset-uuid"
}
```

### Confetti Element
```json
{
  "elementType": "confetti",
  "properties": {
    "particleCount": 100,
    "spread": 70,
    "origin": {"y": 0.6}
  },
  "animations": [
    {
      "type": "trigger",
      "trigger": "onLoad",
      "duration": 3000
    }
  ]
}
```

---

## Variable System Reference

### Available Data Sources:
- `lead` - Lead/customer information
- `call` - Current call data
- `tenant` - Company/organization data
- `system` - System-generated values (date, time)
- `external_api` - External API data
- `static` - Static predefined values

### System Variables:
- `{lead.name}` - Lead's full name
- `{lead.phone}` - Lead's phone number
- `{lead.email}` - Lead's email address
- `{current.date}` - Current date
- `{current.time}` - Current time
- `{company.name}` - Company name
- `{call.status}` - Current call status
- `{call.duration}` - Call duration in seconds

### Data Types:
- `string` - Text values
- `number` - Numeric values
- `date` - Date/time values
- `boolean` - True/false values
- `image` - Image URLs
- `url` - Web addresses

---

This completes the comprehensive API documentation for the Content Creation System. The system provides powerful tools for creating dynamic, variable-driven content that can be deployed to digital signage displays through OptiSigns integration.