import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');
    
    if (!imageUrl) {
      return new NextResponse('Image URL is required', { status: 400 });
    }

    // Validate URL
    let targetUrl: URL;
    try {
      targetUrl = new URL(imageUrl);
    } catch (error) {
      return new NextResponse('Invalid URL', { status: 400 });
    }

    // Security: Only allow HTTP/HTTPS
    if (!['http:', 'https:'].includes(targetUrl.protocol)) {
      return new NextResponse('Invalid protocol', { status: 400 });
    }

    console.log(`Proxying image request to: ${imageUrl}`);
    
    // Fetch the image from the external URL
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ImageProxy/1.0)',
        'Accept': 'image/*,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
      },
      // Add timeout
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });
    
    if (!response.ok) {
      console.error(`Image proxy error: ${response.status} ${response.statusText}`);
      return new NextResponse(`Failed to fetch image: ${response.statusText}`, { 
        status: response.status 
      });
    }
    
    // Check if response is actually an image
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      return new NextResponse('Response is not an image', { status: 400 });
    }
    
    // Get the image data as array buffer
    const imageData = await response.arrayBuffer();
    
    // Create response with proper CORS headers
    const proxyResponse = new NextResponse(imageData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': imageData.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cross-Origin-Resource-Policy': 'cross-origin',
      },
    });
    
    return proxyResponse;
  } catch (error) {
    console.error('Image proxy error:', error);
    
    if (error.name === 'TimeoutError') {
      return new NextResponse('Image request timeout', { status: 504 });
    }
    
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 