import { NextResponse } from 'next/server';

const ELEVEN_LABS_API_KEY = process.env.ELEVEN_LABS_API_KEY;
const ELEVEN_LABS_BASE_URL = 'https://api.elevenlabs.io/v1';

export async function GET() {
  try {
    if (!ELEVEN_LABS_API_KEY) {
      // Return fallback voices if API key not configured
      const fallbackVoices = [
        {
          voice_id: '21m00Tcm4TlvDq8ikWAM',
          name: 'Rachel',
          category: 'premade',
          description: 'A warm, expressive voice with a touch of humor.',
          preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/21m00Tcm4TlvDq8ikWAM/df6788f9-5c96-470d-8312-aab3b3d8f50a.mp3'
        },
        {
          voice_id: 'AZnzlk1XvdvUeBnXmlld',
          name: 'Domi',
          category: 'premade',
          description: 'A strong, confident voice with a slight accent.',
          preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/AZnzlk1XvdvUeBnXmlld/69c48e85-4c4c-4c2c-8c9c-9c9c9c9c9c9c.mp3'
        },
        {
          voice_id: 'EXAVITQu4vr4xnSDxMaL',
          name: 'Bella',
          category: 'premade',
          description: 'A sweet, gentle voice perfect for storytelling.',
          preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/EXAVITQu4vr4xnSDxMaL/69c48e85-4c4c-4c2c-8c9c-9c9c9c9c9c9c.mp3'
        },
        {
          voice_id: 'ErXwobaYiN019PkySvjV',
          name: 'Antoni',
          category: 'premade',
          description: 'A deep, resonant voice with authority.',
          preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/ErXwobaYiN019PkySvjV/69c48e85-4c4c-4c2c-8c9c-9c9c9c9c9c9c.mp3'
        },
        {
          voice_id: 'MF3mGyEYCl7XYWbV9V6O',
          name: 'Elli',
          category: 'premade',
          description: 'A youthful, energetic voice.',
          preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/MF3mGyEYCl7XYWbV9V6O/69c48e85-4c4c-4c2c-8c9c-9c9c9c9c9c9c.mp3'
        }
      ];

      return NextResponse.json({ data: fallbackVoices });
    }

    // Fetch voices from Eleven Labs API
    const response = await fetch(`${ELEVEN_LABS_BASE_URL}/voices`, {
      headers: {
        'xi-api-key': ELEVEN_LABS_API_KEY,
      },
    });

    if (!response.ok) {
      console.error('Eleven Labs voices API error:', response.status);
      // Return fallback voices on error
      const fallbackVoices = [
        {
          voice_id: '21m00Tcm4TlvDq8ikWAM',
          name: 'Rachel',
          category: 'premade',
          description: 'A warm, expressive voice with a touch of humor.',
          preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/21m00Tcm4TlvDq8ikWAM/df6788f9-5c96-470d-8312-aab3b3d8f50a.mp3'
        }
      ];
      return NextResponse.json({ data: fallbackVoices });
    }

    const data = await response.json();
    
    // Transform Eleven Labs response to our format
    const voices = data.voices?.map((voice: any) => ({
      voice_id: voice.voice_id,
      name: voice.name,
      category: voice.category || 'unknown',
      description: voice.description || '',
      preview_url: voice.preview_url || '',
      labels: voice.labels || {},
      settings: voice.settings || {},
    })) || [];

    return NextResponse.json({ data: voices });

  } catch (error) {
    console.error('Voices endpoint error:', error);
    
    // Return fallback voices on any error
    const fallbackVoices = [
      {
        voice_id: '21m00Tcm4TlvDq8ikWAM',
        name: 'Rachel',
        category: 'premade',
        description: 'A warm, expressive voice with a touch of humor.',
        preview_url: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/21m00Tcm4TlvDq8ikWAM/df6788f9-5c96-470d-8312-aab3b3d8f50a.mp3'
      }
    ];
    
    return NextResponse.json({ data: fallbackVoices });
  }
} 