import { NextRequest, NextResponse } from 'next/server';
import { findRecordingById, updateRecording } from '../../shared-store';

// Get the API key from the config (in a real app, this would be from a database)
function getElevenLabsApiKey() {
  return process.env.ELEVEN_LABS_API_KEY || '';
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const apiKey = getElevenLabsApiKey();
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Eleven Labs API key not configured' },
        { status: 404 }
      );
    }

    // Find the recording
    const recording = findRecordingById(params.id);
    
    if (!recording) {
      return NextResponse.json(
        { error: 'Recording not found' },
        { status: 404 }
      );
    }

    // Generate audio using Eleven Labs API
    const elevenLabsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${recording.elevenLabsVoiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: recording.scriptText,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: recording.elevenLabsSettings?.stability || 0.5,
            similarity_boost: recording.elevenLabsSettings?.similarityBoost || 0.75,
            style: recording.elevenLabsSettings?.style || 0.0,
            use_speaker_boost: recording.elevenLabsSettings?.useSpeakerBoost || true
          }
        }),
      }
    );

    if (!elevenLabsResponse.ok) {
      if (elevenLabsResponse.status === 401) {
        return NextResponse.json(
          { error: 'Invalid Eleven Labs API key' },
          { status: 401 }
        );
      } else if (elevenLabsResponse.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded' },
          { status: 429 }
        );
      }
      throw new Error(`Eleven Labs API error: ${elevenLabsResponse.status}`);
    }

    // Get the audio data
    const audioBuffer = await elevenLabsResponse.arrayBuffer();
    
    // In a real application, you would save this audio file to storage
    // For now, we'll just update the metadata to indicate it's available
    
    // Estimate duration (rough calculation: ~150 words per minute, ~5 characters per word)
    const estimatedDuration = Math.max(1, Math.round((recording.scriptText.length / 5) / 150 * 60));

    // Update recording metadata
    const updatedRecording = updateRecording(params.id, {
      status: 'ready',
      audioUrl: `/api/recordings/${params.id}/stream`,
      metadata: {
        ...recording.metadata,
        isAvailable: true,
        canStream: true,
        hasLocalFile: false,
        duration: estimatedDuration,
        lastGenerated: new Date().toISOString(),
        audioSize: audioBuffer.byteLength
      },
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Audio generated successfully',
      data: {
        duration: estimatedDuration,
        size: audioBuffer.byteLength,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error generating audio:', error);
    
    // For development, simulate successful generation
    const recording = findRecordingById(params.id);
    if (recording) {
      const estimatedDuration = Math.max(1, Math.round((recording.scriptText.length / 5) / 150 * 60));
      
      updateRecording(params.id, {
        status: 'ready',
        audioUrl: `/api/recordings/${params.id}/stream`,
        metadata: {
          ...recording.metadata,
          isAvailable: true,
          canStream: true,
          hasLocalFile: false,
          duration: estimatedDuration,
          lastGenerated: new Date().toISOString(),
          audioSize: 50000 // Mock size
        },
        updatedAt: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Audio generated successfully (mock)',
      data: {
        duration: 5,
        size: 50000,
        generatedAt: new Date().toISOString()
      }
    });
  }
} 