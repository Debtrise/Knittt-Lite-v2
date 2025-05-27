import { NextRequest, NextResponse } from 'next/server';

// Initialize global cache if it doesn't exist
if (typeof global.previewCache === 'undefined') {
  global.previewCache = new Map();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ previewId: string }> }
) {
  try {
    const { previewId } = await params;
    
    console.log('Stream request for preview:', previewId);

    // Ensure global cache exists
    if (!global.previewCache) {
      global.previewCache = new Map();
    }

    const previewCache = global.previewCache as Map<string, any>;
    
    console.log('Available previews in cache:', Array.from(previewCache.keys()));
    
    const cachedPreview = previewCache.get(previewId);

    if (!cachedPreview) {
      console.error('Preview not found in cache:', previewId);
      return NextResponse.json(
        { error: 'Preview not found or expired' },
        { status: 404 }
      );
    }

    const { audioData } = cachedPreview;
    
    console.log('Streaming audio:', previewId, 'Size:', audioData.length, 'bytes');

    // Return the audio with proper headers
    return new NextResponse(audioData, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioData.length.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Accept-Ranges': 'bytes',
      },
    });

  } catch (error) {
    console.error('Stream preview error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 