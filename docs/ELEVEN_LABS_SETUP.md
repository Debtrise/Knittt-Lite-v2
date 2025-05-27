# Eleven Labs Integration Setup

## 🎯 Overview

This guide shows how to set up real Eleven Labs API integration for the Enhanced Preview System.

## 🔑 API Key Setup

### 1. Get Your Eleven Labs API Key

1. Go to [ElevenLabs.io](https://elevenlabs.io)
2. Sign up or log in to your account
3. Navigate to your profile settings
4. Copy your API key from the "API Key" section

### 2. Configure Environment Variables

Create a `.env.local` file in your project root:

```bash
# Eleven Labs API Configuration
ELEVEN_LABS_API_KEY=your_actual_api_key_here
```

**Important:** Never commit your actual API key to version control!

## 🚀 Features Enabled

With the API key configured, you get:

### ✅ **Real Audio Generation**
- Actual Eleven Labs text-to-speech
- High-quality MP3 audio output
- All voice settings working (stability, similarity, style, etc.)

### ✅ **Live Voice Library**
- Fetches your actual Eleven Labs voices
- Includes custom cloned voices
- Voice previews and metadata

### ✅ **Batch Voice Comparison**
- Generate multiple voices simultaneously
- Compare different voices with same text
- Real audio playback for each voice

### ✅ **Advanced Voice Settings**
- Stability control (0-1)
- Similarity boost (0-1) 
- Style enhancement (0-1)
- Speaker boost toggle
- Voice presets (Audiobook, Dramatic, News Anchor, etc.)

## 🔧 API Endpoints Created

### `POST /api/recordings/preview`
Creates a preview with Eleven Labs API:
```typescript
{
  text: string,
  voiceId?: string,
  voiceSettings?: {
    stability: number,
    similarityBoost: number,
    style: number,
    useSpeakerBoost: boolean
  }
}
```

### `GET /api/recordings/preview/[id]/stream`
Streams the generated audio file.

### `POST /api/recordings/preview/batch`
Generates multiple voice comparisons:
```typescript
{
  text: string,
  voiceIds: string[],
  voiceSettings?: VoiceSettings
}
```

### `GET /api/recordings/voices`
Fetches available voices from Eleven Labs.

### `GET /api/recordings/voice-presets`
Returns predefined voice setting presets.

## 💰 Cost Considerations

- Eleven Labs charges per character generated
- Preview system caches audio for 1 hour to avoid regeneration
- Batch comparisons multiply character usage by number of voices
- Character count is displayed in real-time

## 🛡️ Fallback Behavior

Without API key configured:
- System shows demo mode with mock data
- All UI interactions work normally
- No actual audio generation
- Graceful error handling with helpful messages

## 🔄 Testing the Integration

1. Add your API key to `.env.local`
2. Restart your development server
3. Go to `/recordings/enhanced-preview`
4. Enter some text and generate a preview
5. You should hear real Eleven Labs audio!

## 📊 Monitoring Usage

- Character counts are tracked in real-time
- Cost estimates shown (approximate)
- Preview expiration times displayed
- Error handling for API limits

## 🎛️ Voice Settings Explained

### Stability (0-1)
- **Low (0.1-0.3)**: More variable, expressive
- **Medium (0.4-0.6)**: Balanced
- **High (0.7-1.0)**: Very consistent, less variation

### Similarity Boost (0-1)
- Controls how closely the AI matches the original voice
- Higher values = closer to original voice characteristics

### Style (0-1)
- Amplifies the style of the original speaker
- Higher values = more pronounced style characteristics

### Speaker Boost
- Toggle to enhance similarity to original speaker
- Recommended for cloned voices

## 🎨 Voice Presets

Pre-configured settings for common use cases:

- **Default**: Balanced for general use
- **Audiobook**: Optimized for long-form narration
- **Conversational**: Natural dialogue
- **Dramatic**: Enhanced emotion and expression
- **News Anchor**: Professional and authoritative
- **Very Stable**: Maximum consistency
- **Highly Expressive**: Maximum variation and style

## 🚨 Troubleshooting

### "API key not configured" Error
- Check your `.env.local` file exists
- Verify the API key is correct
- Restart your development server

### "Failed to generate audio" Error
- Check your Eleven Labs account has credits
- Verify the voice ID exists
- Check API rate limits

### Audio Not Playing
- Check browser audio permissions
- Verify the stream URL is accessible
- Check network connectivity

## 🔐 Security Notes

- API key is only used server-side
- Audio is temporarily cached (1 hour max)
- No sensitive data stored permanently
- Graceful degradation without API key

## 📈 Production Deployment

For production:
1. Set `ELEVEN_LABS_API_KEY` in your hosting environment
2. Consider implementing Redis for audio caching
3. Add rate limiting for preview generation
4. Monitor API usage and costs
5. Implement user authentication for cost control

## 🎯 Next Steps

With Eleven Labs integrated, you can:
- Generate real voice previews
- Compare multiple voices
- Fine-tune voice settings
- Create professional audio content
- Build a complete voice-over workflow

The system is now ready for production use with real audio generation! 