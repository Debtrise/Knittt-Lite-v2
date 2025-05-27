# Recordings Streaming API

This document describes the new streaming functionality for the Knittt recordings system, which allows on-demand audio generation and streaming directly from Eleven Labs.

## New Endpoints

### GET /api/recordings/:id/stream

Streams audio directly from Eleven Labs API with on-demand generation.

**Features:**
- Renders template variables on-demand
- Checks character limits before streaming
- Tracks character usage
- Falls back to local file if API fails
- Supports browser audio playback with proper headers

**Response:**
- Content-Type: `audio/mpeg`
- Cache-Control: `no-cache, no-store, must-revalidate`
- Audio data as binary stream

**Usage:**
```typescript
const streamResponse = await recordings.stream(recordingId);
const blob = new Blob([streamResponse.data], { type: 'audio/mpeg' });
const audioUrl = URL.createObjectURL(blob);
```

### GET /api/recordings/:id/metadata

Returns recording metadata for player UI to help decide playback strategy.

**Response:**
```typescript
interface RecordingMetadata {
  id: string;
  duration?: number;
  isAvailable: boolean;
  characterCount: number;
  canStream: boolean;
  hasLocalFile: boolean;
  fileSize?: number;
  lastGenerated?: string;
  elevenLabsUsage?: {
    charactersUsed: number;
    estimatedCost: number;
  };
  streamingInfo?: {
    supportsStreaming: boolean;
    requiresRegeneration: boolean;
    lastStreamedAt?: string;
  };
}
```

## Frontend Implementation

### AudioPlayer Component

The new `AudioPlayer` component (`app/components/ui/AudioPlayer.tsx`) provides:

- **Smart Source Selection**: Automatically chooses between streaming and local files
- **Progress Control**: Seek, volume, and playback controls
- **Metadata Display**: Shows streaming status and character count
- **Usage Tracking**: Tracks playback for analytics
- **Error Handling**: Graceful fallbacks when streaming fails

**Usage:**
```tsx
<AudioPlayer
  recordingId={recording.id}
  recordingName={recording.name}
  audioUrl={recording.audioUrl}
  onPlayStateChange={(isPlaying) => handlePlayStateChange(recording.id, isPlaying)}
/>
```

### API Integration

The frontend API client (`app/lib/api.ts`) includes new methods:

```typescript
// Stream audio directly
recordings.stream(id: string)

// Get metadata
recordings.getMetadata(id: string)

// Track usage
recordings.trackUsage(id: string, data: UsageData)
```

## Key Features

### On-Demand Generation
- Audio is generated fresh each time from script text
- Template variables are rendered dynamically
- No need to pre-generate and store audio files

### Character Tracking
- Each stream counts against monthly character limit
- Real-time usage monitoring
- Prevents overages with limit checks

### Intelligent Fallbacks
- Falls back to local files if streaming fails
- Graceful error handling with user notifications
- Maintains playback functionality even when API is unavailable

### Browser Compatibility
- Proper streaming headers for HTML5 audio
- Blob URL generation for seamless playback
- Memory management with URL cleanup

## Testing

Use the test page at `/recordings/test` to:
- Test streaming endpoints
- View metadata information
- Monitor Eleven Labs usage
- Compare streaming vs local file playback

## Performance Considerations

### Caching Strategy
- Streams are not cached by default (fresh generation)
- Local files are cached normally
- Consider implementing client-side caching for frequently accessed recordings

### Character Usage
- Monitor character consumption carefully
- Implement usage alerts near limits
- Consider batching or pre-generation for high-volume use cases

### Error Handling
- Always provide fallback options
- Implement retry logic for transient failures
- Track failed requests for monitoring

## Migration Guide

### Existing Recordings
- Existing recordings with local files continue to work
- Streaming is available as an additional option
- No breaking changes to existing functionality

### API Changes
- New endpoints are additive
- Existing endpoints remain unchanged
- Backward compatibility maintained

### UI Updates
- Replace basic audio controls with AudioPlayer component
- Add metadata display where appropriate
- Implement usage tracking for analytics

## Security Considerations

- Streaming endpoints require authentication
- Character usage is tracked per tenant
- Rate limiting should be implemented for streaming endpoints
- Validate recording ownership before streaming

## Monitoring

Track these metrics:
- Stream success/failure rates
- Character usage per tenant
- Fallback frequency
- Audio generation latency
- User engagement with streaming features 