import { NextRequest, NextResponse } from 'next/server';

const ELEVEN_LABS_API_KEY = process.env.ELEVEN_LABS_API_KEY;
const ELEVEN_LABS_BASE_URL = 'https://api.elevenlabs.io/v1';

// Initialize global cache if it doesn't exist
if (typeof global.previewCache === 'undefined') {
  global.previewCache = new Map();
}

export async function POST(request: NextRequest) {
  try {
    if (!ELEVEN_LABS_API_KEY) {
      return NextResponse.json(
        { error: 'Eleven Labs API key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { text, voiceId, voiceSettings, modelId } = body;

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // Use default voice if none specified
    const selectedVoiceId = voiceId || '21m00Tcm4TlvDq8ikWAM'; // Rachel voice

    // Prepare voice settings for Eleven Labs API
    const elevenLabsSettings = {
      stability: voiceSettings?.stability ?? 0.5,
      similarity_boost: voiceSettings?.similarityBoost ?? 0.75,
      style: voiceSettings?.style ?? 0,
      use_speaker_boost: voiceSettings?.useSpeakerBoost ?? true,
    };

    console.log('Generating preview with:', {
      text: text.substring(0, 50) + '...',
      voiceId: selectedVoiceId,
      settings: elevenLabsSettings
    });

    // Call Eleven Labs API
    const elevenLabsResponse = await fetch(
      `${ELEVEN_LABS_BASE_URL}/text-to-speech/${selectedVoiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVEN_LABS_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: modelId || 'eleven_multilingual_v2',
          voice_settings: elevenLabsSettings,
        }),
      }
    );

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text();
      console.error('Eleven Labs API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to generate audio with Eleven Labs' },
        { status: elevenLabsResponse.status }
      );
    }

    // Get the audio data
    const audioBuffer = await elevenLabsResponse.arrayBuffer();
    
    // Generate a unique preview ID
    const previewId = `preview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store the audio in cache
    const audioData = Buffer.from(audioBuffer);
    
    // Ensure global cache exists
    if (!global.previewCache) {
      global.previewCache = new Map();
    }
    
    global.previewCache.set(previewId, {
      audioData,
      createdAt: Date.now(),
      voiceId: selectedVoiceId,
      voiceSettings: elevenLabsSettings,
    });

    console.log('Preview cached:', previewId, 'Size:', audioData.length, 'bytes');

    // Clean up after 1 hour
    setTimeout(() => {
      if (global.previewCache) {
        global.previewCache.delete(previewId);
        console.log('Preview cache cleaned up:', previewId);
      }
    }, 3600000); // 1 hour

    // Return preview metadata
    return NextResponse.json({
      previewId,
      streamUrl: `/api/recordings/preview/${previewId}/stream`,
      characterCount: text.length,
      estimatedCost: text.length, // Eleven Labs charges per character
      expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      voiceId: selectedVoiceId,
      voiceSettings: {
        stability: elevenLabsSettings.stability,
        similarityBoost: elevenLabsSettings.similarity_boost,
        style: elevenLabsSettings.style,
        useSpeakerBoost: elevenLabsSettings.use_speaker_boost,
      },
    });

  } catch (error) {
    console.error('Preview generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 