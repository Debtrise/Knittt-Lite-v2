# Video Upload Feature for Content Creator

## Overview
The Content Creator now supports video upload functionality for video elements, allowing users to upload video files directly from their local storage to use in their content projects.

## Features Added

### 1. Video Upload in Properties Panel
- **Location**: Properties panel when a video element is selected
- **Upload Button**: "Upload Video" button that opens a file picker
- **File Validation**: 
  - Accepts video files only (MP4, WebM, OGV, etc.)
  - Maximum file size: 100MB
  - Real-time validation with user feedback
- **Upload Process**:
  - Shows loading toast during upload
  - Uploads to content API endpoint
  - Updates video element source URL automatically
  - Provides success/error feedback

### 2. Enhanced Video Element
- **Drag & Drop Support**: Users can drag video files directly onto video elements
- **File Size Validation**: 100MB limit with user feedback
- **Click to Upload**: Button in video placeholder to trigger upload
- **Visual Feedback**: Loading states and error handling
- **Preview**: Video preview in properties panel after upload

### 3. API Endpoints
- **POST /api/content/assets/upload**: Upload new video files
- **GET /api/content/assets**: Retrieve all assets with filtering
- **DELETE /api/content/assets**: Delete assets

## Technical Implementation

### Frontend Components Modified

#### PropertiesPanel.tsx
- Added `handleVideoUpload` function for file processing
- Added video upload button and file input
- Added video preview functionality
- Added event listener for trigger-video-upload events
- Enhanced video element properties with:
  - Poster image support
  - Object fit controls
  - Additional video settings

#### ElementRenderer.tsx
- Enhanced video drop handler with file validation
- Added click-to-upload button in video placeholder
- Improved user feedback for drag & drop operations
- Added custom events for cross-component communication

### Backend API Endpoints

#### /api/content/assets/upload
```typescript
POST /api/content/assets/upload
Content-Type: multipart/form-data

Form Data:
- file: Video file
- name: Optional custom name
- tags: Comma-separated tags

Response:
{
  "success": true,
  "message": "Asset uploaded successfully",
  "asset": {
    "id": "asset_1",
    "name": "video.mp4",
    "assetType": "video",
    "mimeType": "video/mp4",
    "fileSize": 1024000,
    "publicUrl": "data:video/mp4;base64,...",
    "tags": ["video", "uploaded"],
    "uploadedAt": "2024-01-15T10:30:00Z"
  }
}
```

#### /api/content/assets
```typescript
GET /api/content/assets?assetType=video&search=test&page=1&limit=50

Response:
{
  "success": true,
  "assets": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalCount": 5,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

## Usage Instructions

### Method 1: Properties Panel Upload
1. Add a video element to your canvas
2. Select the video element
3. In the Properties panel, click "Upload Video"
4. Select a video file from your computer
5. Wait for upload to complete
6. Video will automatically appear in the element

### Method 2: Drag & Drop
1. Add a video element to your canvas
2. Drag a video file from your computer onto the video element
3. Drop the file to trigger upload
4. Video will be uploaded and displayed

### Method 3: Click to Upload
1. Add a video element to your canvas
2. Click the "Click to Upload Video" button in the video placeholder
3. Select a video file
4. Video will be uploaded and displayed

## File Requirements

### Supported Formats
- **MP4** (recommended)
- **WebM**
- **OGV**
- **MOV**
- **AVI**

### File Size Limits
- **Maximum**: 100MB per file
- **Recommended**: Under 50MB for better performance

### Quality Recommendations
- **Resolution**: 1920x1080 or lower for web display
- **Bitrate**: 2-5 Mbps for good quality/size balance
- **Codec**: H.264 for maximum compatibility

## Error Handling

### Common Issues
1. **File too large**: Shows error message for files > 100MB
2. **Invalid file type**: Only video files accepted
3. **Upload failure**: Falls back to local blob URL for preview
4. **Network issues**: Retry mechanism with user feedback

### User Feedback
- Loading toasts during upload
- Success messages on completion
- Error messages with helpful information
- Fallback options when upload fails

## Integration with Existing Features

### Asset Library
- Uploaded videos appear in the Asset Library
- Can be reused across multiple projects
- Searchable and filterable by tags

### Content Store
- Videos are stored in the content store
- Persistent across sessions
- Available for all projects

### Export Functionality
- Videos are included in project exports
- Maintain quality and settings
- Compatible with all export formats

## Future Enhancements

### Planned Features
1. **Video Processing**: Automatic thumbnail generation
2. **Compression**: Server-side video optimization
3. **Streaming**: Adaptive bitrate streaming for large files
4. **Analytics**: Usage tracking and performance metrics
5. **Batch Upload**: Multiple video upload support

### Technical Improvements
1. **Cloud Storage**: Integration with AWS S3 or similar
2. **CDN**: Global content delivery network
3. **Transcoding**: Multiple format support
4. **Metadata Extraction**: Automatic video information extraction

## Testing

### Test Script
Run the test script to verify functionality:
```bash
node test-video-upload.js
```

### Manual Testing
1. Upload various video formats
2. Test file size limits
3. Verify drag & drop functionality
4. Check error handling
5. Test integration with other features

## Security Considerations

### File Validation
- MIME type checking
- File extension validation
- Size limit enforcement
- Malware scanning (future)

### Access Control
- User authentication required
- Tenant isolation
- Asset ownership tracking

## Performance Considerations

### Upload Optimization
- Chunked uploads for large files
- Progress tracking
- Background processing
- Compression options

### Storage Efficiency
- Deduplication
- Compression
- Cleanup policies
- CDN integration

---

This feature enhances the Content Creator by providing a seamless video upload experience, making it easy for users to add custom video content to their projects without needing external hosting or complex URL management. 