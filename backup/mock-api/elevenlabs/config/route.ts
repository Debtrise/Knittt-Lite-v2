import { NextRequest, NextResponse } from 'next/server';

// In a real application, you would store this in a database
// For now, we'll use a simple in-memory store or environment variables
let elevenLabsConfig = {
  apiKey: process.env.ELEVEN_LABS_API_KEY || '',
  monthlyCharacterLimit: 100000,
  defaultVoiceId: '21m00Tcm4TlvDq8ikWAM'
};

export async function GET() {
  try {
    // Return config without exposing the full API key
    return NextResponse.json({
      apiKey: elevenLabsConfig.apiKey ? '***' + elevenLabsConfig.apiKey.slice(-4) : '',
      monthlyCharacterLimit: elevenLabsConfig.monthlyCharacterLimit,
      defaultVoiceId: elevenLabsConfig.defaultVoiceId,
      isConfigured: !!elevenLabsConfig.apiKey
    });
  } catch (error) {
    console.error('Error getting Eleven Labs config:', error);
    return NextResponse.json(
      { error: 'Failed to get configuration' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, monthlyCharacterLimit, defaultVoiceId } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    // Update configuration
    elevenLabsConfig = {
      apiKey,
      monthlyCharacterLimit: monthlyCharacterLimit || elevenLabsConfig.monthlyCharacterLimit,
      defaultVoiceId: defaultVoiceId || elevenLabsConfig.defaultVoiceId
    };

    // In a real application, you would save this to a database
    // For now, we'll just keep it in memory

    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating Eleven Labs config:', error);
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    );
  }
} 