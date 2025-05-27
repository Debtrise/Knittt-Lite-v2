import { NextRequest, NextResponse } from 'next/server';

// In-memory storage (in a real app, this would be a database)
let recordings: any[] = [];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const recording = recordings.find(r => r.id === params.id);
    
    if (!recording) {
      return NextResponse.json(
        { error: 'Recording not found' },
        { status: 404 }
      );
    }

    if (!recording.metadata?.isAvailable) {
      return NextResponse.json(
        { error: 'Audio not available. Please generate it first.' },
        { status: 404 }
      );
    }

    // In a real application, you would:
    // 1. Check if the audio file exists in storage
    // 2. Stream the actual audio file
    // 3. Handle range requests for seeking
    
    // For development/testing, we'll return a mock audio response
    // You could also redirect to a sample audio file or generate a tone
    
    // Create a simple audio tone for testing (440Hz sine wave)
    const sampleRate = 44100;
    const duration = recording.metadata.duration || 5; // seconds
    const samples = sampleRate * duration;
    const buffer = new ArrayBuffer(samples * 2); // 16-bit audio
    const view = new DataView(buffer);
    
    for (let i = 0; i < samples; i++) {
      const sample = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.3; // 440Hz tone at 30% volume
      const intSample = Math.max(-32768, Math.min(32767, sample * 32767));
      view.setInt16(i * 2, intSample, true); // little endian
    }

    // Create a simple WAV header
    const wavHeader = new ArrayBuffer(44);
    const headerView = new DataView(wavHeader);
    
    // WAV header
    headerView.setUint32(0, 0x46464952, false); // "RIFF"
    headerView.setUint32(4, 36 + samples * 2, true); // file size
    headerView.setUint32(8, 0x45564157, false); // "WAVE"
    headerView.setUint32(12, 0x20746d66, false); // "fmt "
    headerView.setUint32(16, 16, true); // fmt chunk size
    headerView.setUint16(20, 1, true); // PCM format
    headerView.setUint16(22, 1, true); // mono
    headerView.setUint32(24, sampleRate, true); // sample rate
    headerView.setUint32(28, sampleRate * 2, true); // byte rate
    headerView.setUint16(32, 2, true); // block align
    headerView.setUint16(34, 16, true); // bits per sample
    headerView.setUint32(36, 0x61746164, false); // "data"
    headerView.setUint32(40, samples * 2, true); // data size

    // Combine header and audio data
    const audioData = new Uint8Array(44 + samples * 2);
    audioData.set(new Uint8Array(wavHeader), 0);
    audioData.set(new Uint8Array(buffer), 44);

    return new NextResponse(audioData, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': audioData.length.toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error streaming audio:', error);
    return NextResponse.json(
      { error: 'Failed to stream audio' },
      { status: 500 }
    );
  }
} 