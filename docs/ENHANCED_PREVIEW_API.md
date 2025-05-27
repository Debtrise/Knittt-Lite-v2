# Enhanced Preview API Documentation

## Overview

The Enhanced Preview API provides comprehensive voice preview capabilities with full control over Eleven Labs parameters, batch voice comparison, and temporary preview management. This system is designed for testing and fine-tuning voice generation before creating permanent recordings.

## Key Features

- **Full Voice Control**: Complete access to Eleven Labs voice settings
- **Batch Comparison**: Test multiple voices with the same text
- **Temporary Previews**: 1-hour expiration, no database storage
- **Voice Presets**: Quick settings for common use cases
- **Real-time Cost Tracking**: Character count and cost estimation
- **Download Support**: Save previews as MP3 files

## API Endpoints

### 1. Create Single Preview

**Endpoint:** `POST /api/recordings/preview`

Creates a single voice preview with specified settings.

**Request Body:**
```json
{
  "text": "Hello, this is a test preview",
  "voiceId": "21m00Tcm4TlvDq8ikWAM",  // optional
  "voiceSettings": {                   // optional
    "stability": 0.5,
    "similarityBoost": 0.75,
    "style": 0,
    "useSpeakerBoost": true
  },
  "modelId": "eleven_monolingual_v1"   // optional
}
```

**Response:**
```json
{
  "previewId": "preview_1234567890_abc123",
  "streamUrl": "/api/recordings/preview/preview_1234567890_abc123/stream",
  "characterCount": 29,
  "estimatedCost": 29,
  "expiresAt": "2025-05-26T17:00:00.000Z",
  "voiceId": "21m00Tcm4TlvDq8ikWAM",
  "voiceSettings": {
    "stability": 0.5,
    "similarityBoost": 0.75,
    "style": 0,
    "useSpeakerBoost": true
  }
}
```

### 2. Stream Preview Audio

**Endpoint:** `GET /api/recordings/preview/:previewId/stream`

Streams the generated preview audio directly.

**Features:**
- Returns actual audio stream (audio/mpeg)
- Cached for 1 hour
- Can be used directly in `<audio>` tags
- Supports range requests for seeking

**Response Headers:**
```
Content-Type: audio/mpeg
Cache-Control: public, max-age=3600
Content-Length: [file-size]
Accept-Ranges: bytes
```

### 3. Batch Voice Comparison

**Endpoint:** `POST /api/recordings/preview/batch`

Creates previews for multiple voices using the same text.

**Request Body:**
```json
{
  "text": "Compare this text with different voices",
  "voiceIds": ["voice1", "voice2", "voice3"],
  "voiceSettings": {
    "stability": 0.5,
    "similarityBoost": 0.75,
    "style": 0,
    "useSpeakerBoost": true
  }
}
```

**Response:**
```json
{
  "previews": [
    {
      "previewId": "preview_xxx",
      "voiceId": "voice1",
      "voiceName": "Rachel",
      "streamUrl": "/api/recordings/preview/preview_xxx/stream",
      "characterCount": 39
    },
    {
      "previewId": "preview_yyy",
      "voiceId": "voice2",
      "voiceName": "Josh",
      "streamUrl": "/api/recordings/preview/preview_yyy/stream",
      "characterCount": 39
    }
  ],
  "totalCharacters": 117,  // 39 * 3 voices
  "expiresAt": "2025-05-26T17:00:00.000Z"
}
```

### 4. Voice Setting Presets

**Endpoint:** `GET /api/recordings/voice-presets`

Returns predefined voice settings for different use cases.

**Response:**
```json
{
  "presets": [
    {
      "name": "Default",
      "description": "Balanced settings for general use",
      "settings": {
        "stability": 0.5,
        "similarityBoost": 0.75,
        "style": 0,
        "useSpeakerBoost": true
      }
    },
    {
      "name": "Very Stable",
      "description": "Maximum consistency, minimal variation",
      "settings": {
        "stability": 0.9,
        "similarityBoost": 0.8,
        "style": 0,
        "useSpeakerBoost": true
      }
    },
    {
      "name": "More Variable",
      "description": "More expressive with natural variation",
      "settings": {
        "stability": 0.3,
        "similarityBoost": 0.6,
        "style": 0.2,
        "useSpeakerBoost": false
      }
    },
    {
      "name": "Highly Expressive",
      "description": "Maximum expressiveness and style",
      "settings": {
        "stability": 0.1,
        "similarityBoost": 0.5,
        "style": 0.8,
        "useSpeakerBoost": false
      }
    }
  ]
}
```

### 5. Enhanced Recording Metadata

**Endpoint:** `GET /api/recordings/:id/metadata`

Returns comprehensive recording metadata including voice settings.

**Response:**
```json
{
  "id": 123,
  "name": "Welcome Message",
  "duration": 15.5,
  "hasLocalFile": true,
  "canStream": true,
  "characterCount": 250,
  "voiceId": "21m00Tcm4TlvDq8ikWAM",
  "voiceSettings": {
    "stability": 0.5,
    "similarityBoost": 0.75,
    "style": 0,
    "useSpeakerBoost": true
  },
  "scriptText": "Hello {{name}}, welcome...",
  "templateVariables": {
    "name": "John"
  }
}
```

## Voice Settings Parameters

### Stability (0.0 - 1.0)
- **Low (0.0-0.3)**: More variable and expressive
- **Medium (0.4-0.7)**: Balanced consistency and expression
- **High (0.8-1.0)**: Very consistent, less variation

### Similarity Boost (0.0 - 1.0)
- **Low (0.0-0.3)**: More creative interpretation
- **Medium (0.4-0.7)**: Balanced similarity
- **High (0.8-1.0)**: Maximum similarity to original voice

### Style (0.0 - 1.0)
- **Low (0.0-0.2)**: Neutral delivery
- **Medium (0.3-0.6)**: Some style amplification
- **High (0.7-1.0)**: Maximum style expression

### Speaker Boost (boolean)
- **true**: Enhanced similarity to original speaker
- **false**: More natural variation allowed

## Frontend Integration

### React Component Example

```jsx
import { useState } from 'react';
import { recordings } from '@/app/lib/api';

function VoicePreview() {
  const [previewId, setPreviewId] = useState(null);
  const [text, setText] = useState('');
  const [voiceId, setVoiceId] = useState('');
  const [voiceSettings, setVoiceSettings] = useState({
    stability: 0.5,
    similarityBoost: 0.75,
    style: 0,
    useSpeakerBoost: true
  });

  const createPreview = async () => {
    try {
      const response = await recordings.preview({
        text,
        voiceId,
        voiceSettings
      });
      
      setPreviewId(response.data.previewId);
      console.log(`Preview ready! ${response.data.characterCount} characters, $${response.data.estimatedCost / 1000}`);
    } catch (error) {
      console.error('Preview failed:', error);
    }
  };

  const createBatchPreview = async (voiceIds) => {
    try {
      const response = await recordings.batchPreview({
        text,
        voiceIds,
        voiceSettings
      });
      
      console.log(`Generated ${response.data.previews.length} voice comparisons`);
      return response.data.previews;
    } catch (error) {
      console.error('Batch preview failed:', error);
    }
  };

  return (
    <div>
      <textarea 
        value={text} 
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text to preview..."
      />
      
      <VoiceSelector value={voiceId} onChange={setVoiceId} />
      <VoiceSettings value={voiceSettings} onChange={setVoiceSettings} />
      
      <button onClick={createPreview}>Generate Preview</button>
      
      {previewId && (
        <audio 
          controls 
          src={`/api/recordings/preview/${previewId}/stream`}
          key={previewId}
        />
      )}
    </div>
  );
}
```

### API Client Integration

```javascript
// Single preview
const preview = await recordings.preview({
  text: "Hello world",
  voiceId: "21m00Tcm4TlvDq8ikWAM",
  voiceSettings: {
    stability: 0.5,
    similarityBoost: 0.75,
    style: 0,
    useSpeakerBoost: true
  }
});

// Batch comparison
const batchPreview = await recordings.batchPreview({
  text: "Compare voices",
  voiceIds: ["voice1", "voice2", "voice3"],
  voiceSettings: { stability: 0.5, similarityBoost: 0.75 }
});

// Stream preview
const audioBlob = await recordings.streamPreview(previewId);

// Get voice presets
const presets = await recordings.getVoicePresets();
```

## Cost Management

### Character Tracking
- Each preview tracks character count
- Batch previews multiply characters by voice count
- Real-time cost estimation based on Eleven Labs pricing

### Usage Optimization
- Previews expire after 1 hour
- Identical previews are cached
- No database storage for temporary previews
- Automatic cleanup of expired previews

## Error Handling

### Common Error Responses

```json
{
  "error": "INVALID_VOICE_ID",
  "message": "The specified voice ID is not available",
  "code": 400
}

{
  "error": "TEXT_TOO_LONG",
  "message": "Text exceeds maximum length of 5000 characters",
  "code": 400
}

{
  "error": "PREVIEW_EXPIRED",
  "message": "Preview has expired and is no longer available",
  "code": 404
}

{
  "error": "ELEVEN_LABS_ERROR",
  "message": "Eleven Labs API error: insufficient credits",
  "code": 402
}
```

### Error Handling Best Practices

```javascript
try {
  const preview = await recordings.preview(data);
  // Handle success
} catch (error) {
  if (error.response?.status === 402) {
    // Handle insufficient credits
    showCreditError();
  } else if (error.response?.status === 400) {
    // Handle validation errors
    showValidationError(error.response.data.message);
  } else {
    // Handle general errors
    showGenericError();
  }
}
```

## Performance Considerations

### Caching Strategy
- Preview audio cached for 1 hour
- Voice presets cached indefinitely
- Metadata cached for 5 minutes

### Rate Limiting
- 10 previews per minute per user
- 3 batch comparisons per minute per user
- Shared rate limit across all preview endpoints

### Optimization Tips
- Use batch comparison for voice selection
- Apply presets before fine-tuning settings
- Cache voice lists locally
- Implement debounced preview generation

## Security

### Authentication
- All endpoints require valid JWT token
- User-specific preview isolation
- Tenant-based voice access control

### Data Protection
- Previews automatically expire
- No permanent storage of preview content
- Secure audio streaming with signed URLs

## Migration Guide

### From Old Preview System

```javascript
// Old system
const response = await recordings.preview({
  scriptText: text,
  elevenLabsVoiceId: voiceId
});

// New system
const response = await recordings.preview({
  text: text,
  voiceId: voiceId,
  voiceSettings: {
    stability: 0.5,
    similarityBoost: 0.75,
    style: 0,
    useSpeakerBoost: true
  }
});
```

### Breaking Changes
- `scriptText` → `text`
- `elevenLabsVoiceId` → `voiceId`
- Added required `voiceSettings` parameter
- Response structure changed to include more metadata

## Troubleshooting

### Common Issues

1. **Preview Not Playing**
   - Check if preview has expired
   - Verify audio format support
   - Check network connectivity

2. **High Character Usage**
   - Monitor batch preview usage
   - Implement text length limits
   - Use preview sparingly during development

3. **Voice Settings Not Applied**
   - Verify settings are within valid ranges
   - Check if voice supports all settings
   - Use presets as starting points

### Debug Mode

Enable debug logging for detailed API information:

```javascript
// Enable debug mode
recordings.setDebugMode(true);

// This will log all API calls and responses
const preview = await recordings.preview(data);
``` 