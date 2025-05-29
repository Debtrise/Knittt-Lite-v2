import { NextRequest, NextResponse } from 'next/server';
import { findRecordingById } from '../../shared-store';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const recording = findRecordingById(params.id);
    
    if (!recording) {
      return NextResponse.json(
        { error: 'Recording not found' },
        { status: 404 }
      );
    }

    // Return metadata for audio players
    const metadata = {
      id: recording.id,
      name: recording.name,
      duration: recording.metadata?.duration || 0,
      characterCount: recording.metadata?.characterCount || recording.scriptText?.length || 0,
      isAvailable: recording.metadata?.isAvailable || false,
      canStream: recording.metadata?.canStream || false,
      hasLocalFile: recording.metadata?.hasLocalFile || false,
      lastGenerated: recording.metadata?.lastGenerated,
      audioSize: recording.metadata?.audioSize || 0,
      format: 'mp3',
      sampleRate: 44100,
      bitrate: 128,
      channels: 1,
      status: recording.status || 'created',
      createdAt: recording.createdAt,
      updatedAt: recording.updatedAt
    };

    return NextResponse.json({
      data: metadata
    });
  } catch (error) {
    console.error('Error fetching recording metadata:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recording metadata' },
      { status: 500 }
    );
  }
} 