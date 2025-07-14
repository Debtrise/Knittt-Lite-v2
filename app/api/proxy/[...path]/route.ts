import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://34.122.156.88:3001';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Reconstruct the path from the path segments
    const path = params.path.join('/');
    
    // Build the target URL
    const targetUrl = `${API_URL}/${path}`;
    console.log(`Proxying request to: ${targetUrl}`);
    
    // Fetch the resource from the API
    const response = await fetch(targetUrl, {
      headers: {
        // Forward authorization header if present
        ...(request.headers.get('Authorization') 
          ? { 'Authorization': request.headers.get('Authorization')! } 
          : {}),
      },
    });
    
    if (!response.ok) {
      console.error(`Proxy error: ${response.status} ${response.statusText}`);
      return new NextResponse(`Proxy error: ${response.statusText}`, { 
        status: response.status 
      });
    }
    
    // Get the response body as an array buffer for binary data like audio
    const data = await response.arrayBuffer();
    
    // Create a new response with the data
    const proxyResponse = new NextResponse(data, {
      status: response.status,
      statusText: response.statusText,
    });
    
    // Copy all headers from the original response
    response.headers.forEach((value, key) => {
      // Skip setting the 'content-encoding' header as it can cause issues
      if (key.toLowerCase() !== 'content-encoding') {
        proxyResponse.headers.set(key, value);
      }
    });
    
    // Ensure proper content type for audio files
    if (path.endsWith('.mp3')) {
      proxyResponse.headers.set('Content-Type', 'audio/mpeg');
    } else if (path.endsWith('.wav')) {
      proxyResponse.headers.set('Content-Type', 'audio/wav');
    } else if (path.endsWith('.ogg')) {
      proxyResponse.headers.set('Content-Type', 'audio/ogg');
    }
    
    return proxyResponse;
  } catch (error) {
    console.error('Proxy error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 