import { NextResponse } from 'next/server';

// Get the API key from the config (in a real app, this would be from a database)
function getElevenLabsApiKey() {
  // For now, check environment variable or return a placeholder
  return process.env.ELEVEN_LABS_API_KEY || '';
}

export async function GET() {
  try {
    const apiKey = getElevenLabsApiKey();
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Eleven Labs API key not configured' },
        { status: 404 }
      );
    }

    // Fetch voices from Eleven Labs API
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Invalid Eleven Labs API key' },
          { status: 401 }
        );
      } else if (response.status === 429) {
        return NextResponse.json(
          { error: 'Rate limit exceeded' },
          { status: 429 }
        );
      }
      throw new Error(`Eleven Labs API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform the response to match our expected format
    const voices = data.voices?.map((voice: any) => ({
      voice_id: voice.voice_id,
      name: voice.name,
      category: voice.category || 'Generated'
    })) || [];

    return NextResponse.json(voices);
  } catch (error) {
    console.error('Error fetching voices:', error);
    
    // Return mock data for development/testing
    const mockVoices = [
      {
        voice_id: '21m00Tcm4TlvDq8ikWAM',
        name: 'Rachel',
        category: 'Generated'
      },
      {
        voice_id: 'AZnzlk1XvdvUeBnXmlld',
        name: 'Domi',
        category: 'Generated'
      },
      {
        voice_id: 'EXAVITQu4vr4xnSDxMaL',
        name: 'Bella',
        category: 'Generated'
      },
      {
        voice_id: 'ErXwobaYiN019PkySvjV',
        name: 'Antoni',
        category: 'Generated'
      },
      {
        voice_id: 'MF3mGyEYCl7XYWbV9V6O',
        name: 'Elli',
        category: 'Generated'
      }
    ];

    return NextResponse.json(mockVoices);
  }
} 