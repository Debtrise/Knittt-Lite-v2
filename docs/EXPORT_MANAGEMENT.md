# Export Management System

## Overview

The Export Management System provides comprehensive functionality for exporting content projects and integrating with OptiSigns digital signage platform. This system supports multiple export formats, bulk operations, and real-time status tracking.

## Features

### 🔄 Export Types
- **Image Exports**: PNG/JPG formats with customizable quality and dimensions
- **Video Exports**: MP4 format with animation support and configurable duration
- **PDF Exports**: Document format for print-ready materials
- **HTML Exports**: Complete web packages with interactive elements

### 📊 OptiSigns Integration
- **Real-time Publishing**: Direct publishing to digital displays
- **Status Monitoring**: Live tracking of display sync status
- **Multi-display Support**: Publish to multiple screens simultaneously
- **Error Handling**: Comprehensive error reporting and retry mechanisms

### 🚀 Advanced Features
- **Bulk Export**: Export multiple projects simultaneously
- **Real-time Progress**: Live status updates with progress tracking
- **Auto-download**: Automatic file downloads when exports complete
- **Queue Management**: Efficient handling of multiple export requests

## Usage

### Basic Export

1. **Open Export Panel**: Click the "Export" tab in the Content Creator
2. **Choose Format**: Select from Image, Video, PDF, or HTML
3. **Configure Options**:
   - Quality: Low, Medium, High
   - Dimensions: Custom width/height
   - Animations: Include/exclude animations
   - Duration: For video exports
4. **Start Export**: Click "Start Export" to begin processing

### Bulk Export

1. **Access Bulk Export**: Click "Bulk Export" button in Export Panel
2. **Select Projects**: Choose multiple projects from the list
3. **Configure Options**: Set export format and quality settings
4. **Set Archive Name**: Custom name for the ZIP file
5. **Start Bulk Export**: Process multiple projects into a single archive

### OptiSigns Publishing

1. **Switch to OptiSigns Tab**: Navigate to the OptiSigns section
2. **Select Displays**: Choose target digital displays
3. **Publish**: Click "Publish" to deploy content
4. **Monitor Status**: Track deployment progress and display health

## API Integration

### Export Endpoints

```typescript
// Create single export
POST /api/content/projects/:projectId/export
{
  "exportType": "image",
  "options": {
    "quality": "high",
    "dimensions": { "width": 1920, "height": 1080 },
    "includeAnimations": true
  }
}

// Get project exports
GET /api/content/projects/:projectId/exports

// Download completed export
GET /api/content/exports/:exportId/download

// Real-time status updates
GET /api/content/exports/:exportId/status

// Bulk export multiple projects
POST /api/content/projects/bulk-export
{
  "projectIds": ["uuid1", "uuid2"],
  "exportType": "video",
  "options": { ... }
}
```

### OptiSigns Endpoints

```typescript
// Publish to displays
POST /api/content/projects/:projectId/publish
{
  "displayIds": ["display1", "display2"],
  "options": { "immediate": true }
}

// Get publication status
GET /api/content/projects/:projectId/optisigns-status

// Sync status updates
POST /api/content/projects/:projectId/optisigns-sync
```

## Component Architecture

### ExportPanel Component
**Location**: `app/components/content-creator/ExportPanel.tsx`

Primary interface for export management:
- Tabbed interface (Exports / OptiSigns)
- Export history and status tracking
- Quick export actions
- OptiSigns integration controls

**Props**:
```typescript
interface ExportPanelProps {
  projectId?: string;
}
```

**Key Features**:
- Real-time export status polling
- Automatic downloads
- Error handling with toast notifications
- Progress tracking with visual indicators

### BulkExportDialog Component
**Location**: `app/components/content-creator/BulkExportDialog.tsx`

Advanced bulk export functionality:
- Multi-project selection
- Unified export settings
- Progress tracking
- ZIP archive creation

**Props**:
```typescript
interface BulkExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedProjects?: string[];
}
```

### Export API Service
**Location**: `app/services/exportApi.ts`

Centralized API service for all export operations:
- RESTful API client
- Error handling
- Authentication management
- Type-safe interfaces

## Data Models

### ContentExport Interface
```typescript
interface ContentExport {
  id: string;
  projectId: string;
  exportType: 'html' | 'image' | 'video' | 'pdf';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  filename: string;
  fileSize?: number;
  downloadUrl?: string;
  options: {
    format?: string;
    quality?: 'low' | 'medium' | 'high';
    dimensions?: { width: number; height: number };
    duration?: number;
    includeAnimations?: boolean;
    backgroundColor?: string;
  };
  progress?: number;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}
```

### OptiSignsStatus Interface
```typescript
interface OptiSignsStatus {
  projectId: string;
  status: 'not_published' | 'publishing' | 'published' | 'failed' | 'updating';
  displayIds: string[];
  publishedAt?: string;
  lastSyncAt?: string;
  errorMessage?: string;
  displays: Array<{
    id: string;
    name: string;
    status: 'online' | 'offline' | 'syncing' | 'error';
    lastSeen?: string;
  }>;
}
```

## State Management

### Content Store Integration
The export system integrates with the main content store (`useContentStore`) for:
- Project data access
- Loading state management
- Error handling
- Authentication

**Export Actions**:
```typescript
// Store actions for export functionality
createExport: (projectId: string, exportType: string, options: any) => Promise<any>;
getProjectExports: (projectId: string) => Promise<any>;
downloadExport: (exportId: string) => Promise<Blob>;
deleteExport: (exportId: string) => Promise<void>;
getOptiSignsStatus: (projectId: string) => Promise<any>;
publishToOptiSigns: (projectId: string, displayIds: string[], options?: any) => Promise<void>;
```

## Error Handling

### Client-Side Error Management
- **Toast Notifications**: User-friendly error messages
- **Retry Mechanisms**: Automatic retry for network failures
- **Fallback States**: Graceful degradation when services unavailable
- **Validation**: Input validation before API calls

### Server-Side Error Responses
```typescript
// Standard error response format
{
  "error": "Detailed error message",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Common HTTP Status Codes**:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

## Performance Considerations

### Optimization Strategies
1. **Lazy Loading**: Components loaded on-demand
2. **Progress Polling**: Efficient status updates without overwhelming the server
3. **Batch Operations**: Bulk exports processed efficiently
4. **Caching**: Export metadata cached for performance
5. **Compression**: Large exports automatically compressed

### Real-time Updates
- **WebSocket Alternative**: HTTP polling with exponential backoff
- **Status Polling**: 2-second intervals during processing
- **Error Recovery**: 5-second retry intervals with backoff

## Security

### Authentication
- **Bearer Token**: JWT-based authentication for all API calls
- **Token Management**: Automatic token retrieval from auth storage
- **Session Handling**: Graceful handling of expired sessions

### File Security
- **Secure Downloads**: Temporary signed URLs for export downloads
- **Access Control**: User-specific export access
- **File Cleanup**: Automatic cleanup of temporary export files

## Deployment

### Environment Configuration
```bash
# Required environment variables
NEXT_PUBLIC_API_URL=http://34.122.156.88:3001/api
```

### Dependencies
```json
{
  "react": "^18.0.0",
  "zustand": "^4.0.0",
  "lucide-react": "^0.200.0",
  "sonner": "^1.0.0"
}
```

## Testing

### Unit Tests
- Component rendering tests
- API service tests
- State management tests
- Error handling tests

### Integration Tests
- End-to-end export workflows
- OptiSigns integration tests
- Bulk export functionality
- Real-time status updates

### Test Commands
```bash
# Run all tests
npm test

# Run export-specific tests
npm test -- --grep "export"

# Run integration tests
npm run test:integration
```

## Troubleshooting

### Common Issues

**Export Stuck in Processing**
- Check server logs for processing errors
- Verify file system permissions
- Monitor server resource usage

**OptiSigns Connection Failed**
- Verify OptiSigns API credentials
- Check network connectivity
- Review display configuration

**Downloads Not Working**
- Check browser download permissions
- Verify file URLs are accessible
- Clear browser cache

### Debug Mode
Enable debug logging by setting:
```javascript
localStorage.setItem('debug', 'export:*');
```

## Future Enhancements

### Planned Features
1. **Scheduled Exports**: Time-based export automation
2. **Export Templates**: Predefined export configurations
3. **Webhook Integration**: Export completion notifications
4. **Analytics Dashboard**: Export usage and performance metrics
5. **Cloud Storage**: Direct export to cloud storage services

### API Improvements
1. **WebSocket Support**: Real-time updates without polling
2. **Batch Processing**: More efficient bulk operations
3. **Export Queuing**: Advanced queue management
4. **Rate Limiting**: Better handling of concurrent exports

## Support

For technical support or feature requests:
- **Documentation**: Refer to API documentation in `docs/content_creation_api_docs.md`
- **Issues**: Report bugs via the project issue tracker
- **Development**: Contact the development team for technical questions

---

This export management system provides a robust foundation for content export and digital signage integration, with room for future enhancements and scalability. 