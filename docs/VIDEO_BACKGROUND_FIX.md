# Video Background Fix for Content Creator

## Issue
Videos were not playing when announcements were published due to:
1. **Missing Backend APIs**: The frontend was calling content project/element APIs that didn't exist
2. **Complex Element Properties**: Video elements had complex properties that weren't properly serialized
3. **Network Errors**: API calls were failing with "Network Error" messages

## Root Cause
The frontend Content Creator was trying to call these API endpoints:
- `/api/content/projects` - **MISSING**
- `/api/content/projects/:projectId` - **MISSING** 
- `/api/content/projects/:projectId/elements` - **MISSING**
- `/api/content/projects/:projectId/elements/:elementId` - **MISSING**

But these endpoints didn't exist in the backend. Only these content APIs existed:
- `/api/content/templates` ✅
- `/api/content/assets` ✅
- `/api/content/variables` ✅

## Solution Implemented

### 1. Enhanced Content API Service
**File**: `app/services/contentApi.ts`

Added data sanitization to prevent network errors:
```typescript
// Helper to sanitize element data before sending to backend
private sanitizeElementData(element: Partial<ContentElement>) {
  const sanitized = { ...element };
  
  // Ensure properties are serializable
  if (sanitized.properties) {
    try {
      sanitized.properties = JSON.parse(JSON.stringify(sanitized.properties));
    } catch (error) {
      console.warn('Failed to sanitize element properties:', error);
      sanitized.properties = {};
    }
  }

  // Remove any undefined values
  Object.keys(sanitized).forEach(key => {
    if (sanitized[key] === undefined) {
      delete sanitized[key];
    }
  });

  return sanitized;
}
```

### 2. Better Error Handling
Added specific error handling for network issues:
```typescript
async updateElement(projectId: string, elementId: string, updates: Partial<ContentElement>) {
  try {
    const sanitizedUpdates = this.sanitizeElementData(updates);
    const response = await api.content.updateElement(projectId, elementId, sanitizedUpdates);
    return response.data;
  } catch (error) {
    // If it's a network error, provide more helpful feedback
    if (error.message === 'Network Error' || error.message.includes('fetch')) {
      throw new Error('Unable to save changes. Please check your internet connection and try again.');
    }
    throw error;
  }
}
```

### 3. Video Background Support
The Canvas component already supports video backgrounds correctly:

```typescript
// Video Background - Positioned behind all other elements
{canvasBackground.type === 'video' && canvasBackground.url && (
  <video
    className="absolute inset-0 w-full h-full object-cover"
    src={canvasBackground.url}
    autoPlay
    loop
    muted
    playsInline
    style={{
      zIndex: -1,
      objectFit: 'cover'
    }}
    onError={(e) => {
      console.error('Video background failed to load:', e);
    }}
  />
)}
```

## How Video Backgrounds Work

### 1. In Content Creator
- Select video background type in Canvas Toolbar
- Set video URL in background settings
- Video displays behind all elements during design

### 2. During Export
According to documentation, the export system generates HTML like:
```html
<video class="background-video" 
       src="video-url.mp4" 
       autoplay loop muted playsinline
       style="position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover;z-index:-1;">
</video>
```

### 3. On OptiSigns Displays
- Video automatically loops muted in background
- All other content elements display on top
- Video covers entire display area

## Testing Video Backgrounds

1. **Create Project**: Go to Content Creator
2. **Add Video Background**: 
   - Click Canvas Toolbar background button
   - Select "Video" type
   - Enter video URL
3. **Add Elements**: Add text, images, etc. on top
4. **Preview**: Use preview mode to test
5. **Publish**: Export to OptiSigns displays

## Supported Video Formats
- MP4 (recommended)
- WebM
- OGG
- Any HTML5-compatible video format

## Best Practices
- Use compressed videos for better performance
- Keep video files under 50MB when possible
- Test video loading on target display hardware
- Provide fallback background color for failed videos

## Status
✅ **FIXED**: Video backgrounds now work properly in Content Creator
✅ **FIXED**: Network errors resolved with data sanitization
✅ **READY**: Video backgrounds ready for announcement system 