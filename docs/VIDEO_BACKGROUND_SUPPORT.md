# Video Background Support

The Content Creator now supports video backgrounds as documented in the system requirements. This feature allows templates to use video files as animated backgrounds that loop seamlessly behind all other content elements.

## Features

### Video Background Types
- **Type**: `video`
- **Property**: `url` - Path to the video file
- **Behavior**: Loops automatically, plays muted, positioned behind all content
- **Formats**: MP4, WebM, and other HTML5-compatible video formats

### Implementation

#### Canvas Configuration
```typescript
canvasBackground: {
  type: "video",
  url: "https://example.com/background-video.mp4"
}
```

#### Generated HTML Output
During export, video backgrounds are rendered as:
```html
<video class="background-video" 
       src="background-video.mp4" 
       autoplay loop muted playsinline
       style="position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover;z-index:-1;">
</video>
```

## User Interface

### Background Selection
The Canvas Toolbar now includes a comprehensive background selector with four types:
- **Solid**: Single color background
- **Gradient**: CSS gradient background  
- **Image**: Static image background
- **Video**: Animated video background (NEW)

### Video-Specific Controls
When video background is selected:
- URL input field for video source
- Helpful guidance about video format compatibility
- Information about muted looping behavior

## Technical Details

### Video Properties
- **Autoplay**: Videos start automatically when page loads
- **Loop**: Videos repeat continuously 
- **Muted**: No audio playback to avoid conflicts
- **PlaysInline**: Prevents fullscreen on mobile devices
- **Object-Fit**: Cover to fill entire canvas area
- **Z-Index**: -1 to position behind all other elements

### Performance Considerations
- Use optimized video files for best performance
- Consider file size for network delivery
- MP4 format recommended for broad compatibility
- Videos should be optimized for display resolution

### Browser Support
- All modern browsers support HTML5 video backgrounds
- Graceful fallback to solid color if video fails to load
- Error handling prevents broken displays

## Usage Examples

### Deal Celebration with Video Background
```typescript
const template = {
  canvasBackground: {
    type: "video",
    url: "https://assets.example.com/celebration-background.mp4"
  },
  elements: [
    // Raining money animation over video
    // Sales rep photo elements
    // Text overlays with semi-transparent backgrounds
  ]
}
```

### Best Practices
1. **Contrast**: Ensure text elements have sufficient contrast against video
2. **Performance**: Use compressed, optimized video files
3. **Accessibility**: Provide alternative static backgrounds if needed
4. **Content**: Choose video content that enhances rather than distracts
5. **Transparency**: Use semi-transparent overlays for text readability

## Integration with Existing Features

### Sales Rep Photos
Video backgrounds work seamlessly with sales rep photo elements:
- Photos overlay the video background
- Circular frames and shadows provide visual separation
- Auto-fill functionality remains unchanged

### Animation Elements
All existing animation elements (raining money, confetti, etc.) work over video backgrounds:
- Animations render above the video layer
- Proper z-index ordering maintained
- Performance optimized for multiple animation layers

### Export System
Video backgrounds are fully supported in the export system:
- HTML exports include video element
- Video URL references preserved
- Proper styling and positioning applied
- Compatible with OptiSigns display system

## API Updates

### Content Store Interface
```typescript
canvasBackground: {
  type: 'solid' | 'gradient' | 'image' | 'video';
  color?: string;
  gradient?: string;
  imageUrl?: string;
  url?: string; // For video backgrounds
}
```

### Canvas Component
- Updated type definitions to include 'video'
- Enhanced background rendering logic
- Error handling for failed video loads
- Video-specific styling and positioning

This feature enhances the Content Creator's capabilities for creating engaging, dynamic content perfect for digital signage and announcement systems. 