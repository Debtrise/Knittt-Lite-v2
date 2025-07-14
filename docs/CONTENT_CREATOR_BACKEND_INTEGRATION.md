# Content Creator - Backend Integration Guide

## Overview
The Content Creator system is now fully integrated with the backend API as documented in `content_creation_api_docs.md`. This guide explains the integration points and how to ensure proper backend connectivity.

## Required Backend Endpoints

### Core Endpoints (MUST be implemented)
The following endpoints are essential for the drag-and-drop functionality to work:

1. **GET /content/projects** - Load all projects
2. **POST /content/projects** - Create new project
3. **GET /content/projects/:id** - Load specific project with elements
4. **PUT /content/projects/:id** - Update project
5. **POST /content/projects/:id/elements** - Create new element
6. **PUT /content/projects/:id/elements/:elementId** - Update element
7. **DELETE /content/projects/:id/elements/:elementId** - Delete element
8. **GET /content/assets** - Load assets for library
9. **POST /content/assets/upload** - Upload new assets
10. **GET /content/variables** - Load dynamic variables

### API Configuration
The system uses the following environment variable for API base URL:
```
NEXT_PUBLIC_API_URL=http://34.122.156.88:3001/api
```

## Integration Features

### 1. Drag-and-Drop Element Creation
When users drag elements from the panel to the canvas:
- **Frontend**: Calls `createElement()` from contentStore
- **Backend**: `POST /content/projects/:id/elements`
- **Response**: Returns created element with server-generated ID
- **UI Update**: Element appears on canvas with proper backend ID

### 2. Real-time Element Updates
When users move, resize, or edit elements:
- **Frontend**: Calls `updateElement()` with changes
- **Backend**: `PUT /content/projects/:id/elements/:elementId`
- **Persistence**: Changes are immediately saved to backend
- **Sync**: All element properties stay synchronized

### 3. Asset Management
For video, image, and other media content:
- **Upload**: Files are uploaded via `POST /content/assets/upload`
- **Storage**: Backend handles file storage and generates public URLs
- **Thumbnails**: System generates thumbnails for preview
- **Integration**: Assets are linked to elements via `assetId`

### 4. Variable System
For dynamic content replacement:
- **Load**: Variables loaded from `GET /content/variables`
- **Categories**: Variables grouped by data source (lead, system, etc.)
- **Preview**: Variables resolved during preview generation
- **Integration**: Text elements support `{variable.name}` syntax

## Error Handling

### Connection Issues
The `ContentCreatorWrapper` component handles:
- Backend connection failures
- API authentication errors
- Network timeouts
- Initialization failures

### User Experience
- Loading states during API calls
- Error messages with retry options
- Graceful degradation when backend is unavailable
- Clear feedback on connection status

## Testing Backend Integration

### 1. Check API Endpoints
Test that all required endpoints are available:
```bash
# Test project endpoints
curl -H "Authorization: Bearer YOUR_TOKEN" http://34.122.156.88:3001/api/content/projects

# Test asset endpoints
curl -H "Authorization: Bearer YOUR_TOKEN" http://34.122.156.88:3001/api/content/assets

# Test variable endpoints
curl -H "Authorization: Bearer YOUR_TOKEN" http://34.122.156.88:3001/api/content/variables
```

### 2. Verify Element Creation
1. Open Content Creator in browser
2. Drag a text element to canvas
3. Check browser network tab for API calls
4. Verify element appears with backend-generated ID

### 3. Test Asset Upload
1. Go to Assets tab in Content Creator
2. Upload an image or video file
3. Verify file appears in asset library
4. Check that asset can be dragged to canvas

### 4. Validate Variable System
1. Check Variables tab shows system variables
2. Create text element with `{lead.name}` syntax
3. Use preview feature to test variable resolution

## Development Setup

### Environment Variables
```bash
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://34.122.156.88:3001/api

# Backend
DATABASE_URL=your_database_connection
JWT_SECRET=your_jwt_secret
UPLOAD_PATH=/path/to/uploads
```

### Database Tables
Ensure these tables exist in your backend database:
- `content_projects`
- `content_elements`
- `content_assets`
- `content_variables`
- `content_templates`

### File Upload Configuration
Backend must handle:
- Multipart form data for file uploads
- File validation (size, type)
- Thumbnail generation for images/videos
- Public URL generation for assets

## Troubleshooting

### Common Issues

1. **"Failed to Initialize Content Creator"**
   - Check backend server is running
   - Verify API_URL environment variable
   - Test authentication token is valid

2. **Elements not saving**
   - Check network tab for failed API calls
   - Verify project ID exists in database
   - Test element creation endpoint manually

3. **Assets not uploading**
   - Check file size limits
   - Verify upload directory permissions
   - Test multipart form handling in backend

4. **Variables not loading**
   - Ensure variables table is populated
   - Check variable initialization endpoint
   - Verify system variables are created

### Debug Mode
Enable debug logging by adding to browser console:
```javascript
localStorage.setItem('debug', 'content-creator:*');
```

## API Response Examples

### Project Creation Response
```json
{
  "project": {
    "id": "proj_123",
    "name": "New Project",
    "status": "draft",
    "elements": [],
    "canvasSize": {"width": 1920, "height": 1080},
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### Element Creation Response
```json
{
  "element": {
    "id": "elem_456",
    "elementType": "text",
    "position": {"x": 100, "y": 100, "z": 1},
    "size": {"width": 200, "height": 100},
    "properties": {"text": "Hello World"},
    "layerOrder": 1
  }
}
```

### Asset Upload Response
```json
{
  "asset": {
    "id": "asset_789",
    "name": "image.jpg",
    "assetType": "image",
    "publicUrl": "/uploads/content/assets/image.jpg",
    "thumbnailUrl": "/uploads/content/thumbnails/thumb-image.jpg",
    "dimensions": {"width": 1920, "height": 1080}
  }
}
```

This integration ensures the Content Creator provides a seamless drag-and-drop experience with full backend persistence and real-time synchronization. 