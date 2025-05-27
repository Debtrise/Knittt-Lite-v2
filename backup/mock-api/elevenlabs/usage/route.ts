import { NextResponse } from 'next/server';

// Get the API key from the config (in a real app, this would be from a database)
function getElevenLabsApiKey() {
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

    // Fetch usage from Eleven Labs API
    const response = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
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
    const usage = {
      used: data.character_count || 0,
      limit: data.character_limit || 10000,
      remaining: (data.character_limit || 10000) - (data.character_count || 0),
      percentUsed: data.character_limit ? 
        ((data.character_count / data.character_limit) * 100).toFixed(2) : '0.00',
      resetDate: data.next_character_count_reset_unix ? 
        new Date(data.next_character_count_reset_unix * 1000).toISOString().split('T')[0] : 
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };

    return NextResponse.json(usage);
  } catch (error) {
    console.error('Error fetching usage:', error);
    
    // Return mock data for development/testing
    const mockUsage = {
      used: 2500,
      limit: 10000,
      remaining: 7500,
      percentUsed: '25.00',
      resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };

    return NextResponse.json(mockUsage);
  }
} 