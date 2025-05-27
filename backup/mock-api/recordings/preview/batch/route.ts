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
    const { text, voiceIds, voiceSettings } = body;

    if (!text || !voiceIds || !Array.isArray(voiceIds)) {
      return NextResponse.json(
        { error: 'Text and voiceIds array are required' },
        { status: 400 }
      );
    }

    // Limit to 5 voices max to prevent abuse
    const limitedVoiceIds = voiceIds.slice(0, 5);

    // Prepare voice settings for Eleven Labs API
    const elevenLabsSettings = {
      stability: voiceSettings?.stability ?? 0.5,
      similarity_boost: voiceSettings?.similarityBoost ?? 0.75,
      style: voiceSettings?.style ?? 0,
      use_speaker_boost: voiceSettings?.useSpeakerBoost ?? true,
    };

    // Get voice names first
    const voiceNamesMap = new Map();
    try {
      const voicePromises = limitedVoiceIds.map(async (voiceId) => {
        const response = await fetch(`${ELEVEN_LABS_BASE_URL}/voices/${voiceId}`, {
          headers: { 'xi-api-key': ELEVEN_LABS_API_KEY },
        });
        if (response.ok) {
          const voiceData = await response.json();
          voiceNamesMap.set(voiceId, voiceData.name);
        }
      });
      await Promise.all(voicePromises);
    } catch (error) {
      console.warn('Failed to fetch voice names:', error);
    }

    // Generate audio for each voice
    const previewPromises = limitedVoiceIds.map(async (voiceId, index) => {
      try {
        const elevenLabsResponse = await fetch(
          `${ELEVEN_LABS_BASE_URL}/text-to-speech/${voiceId}`,
          {
            method: 'POST',
            headers: {
              'Accept': 'audio/mpeg',
              'Content-Type': 'application/json',
              'xi-api-key': ELEVEN_LABS_API_KEY,
            },
            body: JSON.stringify({
              text,
              model_id: 'eleven_multilingual_v2',
              voice_settings: elevenLabsSettings,
            }),
          }
        );

        if (!elevenLabsResponse.ok) {
          throw new Error(`Failed to generate audio for voice ${voiceId}`);
        }

        const audioBuffer = await elevenLabsResponse.arrayBuffer();
        const audioData = Buffer.from(audioBuffer);
        
        // Generate unique preview ID
        const previewId = `preview_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 6)}`;
        
        // Ensure global cache exists and store in cache
        if (!global.previewCache) {
          global.previewCache = new Map();
        }
        
        global.previewCache.set(previewId, {
          audioData,
          createdAt: Date.now(),
          voiceId,
          voiceSettings: elevenLabsSettings,
        });

        console.log('Batch preview cached:', previewId, 'Size:', audioData.length, 'bytes');

        // Clean up after 1 hour
        setTimeout(() => {
          if (global.previewCache) {
            global.previewCache.delete(previewId);
            console.log('Batch preview cache cleaned up:', previewId);
          }
        }, 3600000);

        return {
          previewId,
          voiceId,
          voiceName: voiceNamesMap.get(voiceId) || `Voice ${voiceId.slice(0, 8)}`,
          streamUrl: `/api/recordings/preview/${previewId}/stream`,
          characterCount: text.length,
        };

      } catch (error) {
        console.error(`Error generating preview for voice ${voiceId}:`, error);
        return null;
      }
    });

    // Wait for all previews to complete
    const results = await Promise.all(previewPromises);
    const successfulPreviews = results.filter(result => result !== null);

    if (successfulPreviews.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate any previews' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      previews: successfulPreviews,
      totalCharacters: text.length * successfulPreviews.length,
      expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
    });

  } catch (error) {
    console.error('Batch preview generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 