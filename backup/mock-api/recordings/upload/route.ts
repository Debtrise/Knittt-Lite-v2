import { NextRequest, NextResponse } from 'next/server';
import { addRecording, getNextId } from '../shared-store';

// Function to check FreePBX configuration and auto-upload if enabled
async function checkAutoUpload(recording: any, tenantId: string) {
  try {
    // In a real app, get FreePBX config from database based on tenantId
    // For demo, we'll simulate having auto-upload enabled
    const freepbxConfig = {
      serverUrl: 'https://dial.knittt.com',
      username: 'admin',
      password: 'boom',
      isActive: true,
      autoUpload: true
    };

    if (freepbxConfig.isActive && freepbxConfig.autoUpload) {
      // Trigger FreePBX upload in the background
      // In a real app, you might use a queue system for this
      setTimeout(async () => {
        try {
          // Simulate FreePBX upload
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const freepbxRecordingId = `recording_${recording.id}_${Date.now()}`;
          
          // Update recording with FreePBX status
          // Note: In a real app, you'd need to import and use the updateRecording function
          console.log(`Auto-uploaded recording ${recording.id} to FreePBX as ${freepbxRecordingId}`);
        } catch (error) {
          console.error(`Auto-upload to FreePBX failed for recording ${recording.id}:`, error);
        }
      }, 1000);

      return {
        freepbxStatus: 'pending',
        freepbxAutoUpload: true
      };
    }

    return {
      freepbxStatus: 'not_configured',
      freepbxAutoUpload: false
    };
  } catch (error) {
    console.error('Error checking auto-upload:', error);
    return {
      freepbxStatus: 'not_configured',
      freepbxAutoUpload: false
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const audioFile = formData.get('audio') as File;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string || '';
    const type = formData.get('type') as string || 'ivr';

    // Validate required fields
    if (!audioFile || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: audio file and name' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!audioFile.type.startsWith('audio/')) {
      return NextResponse.json(
        { error: 'File must be an audio file' },
        { status: 400 }
      );
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 50MB' },
        { status: 400 }
      );
    }

    // In a real application, you would:
    // 1. Store the file in cloud storage (AWS S3, Google Cloud Storage, etc.)
    // 2. Get the file URL from the storage service
    // 3. Extract audio metadata (duration, bitrate, etc.)
    // 4. Convert to a standard format if needed
    
    // For now, we'll simulate this by creating a URL blob reference
    const audioBuffer = await audioFile.arrayBuffer();
    
    // Estimate duration based on file size and typical audio bitrate (rough calculation)
    const estimatedDuration = Math.round(audioBuffer.byteLength / (128 * 1024 / 8)); // Assuming 128kbps

    const recordingId = getNextId();
    const tenantId = request.headers.get('x-tenant-id') || 'default';

    // Check FreePBX auto-upload configuration
    const freepbxInfo = await checkAutoUpload({ id: recordingId }, tenantId);

    // Create new recording
    const newRecording = {
      id: recordingId.toString(),
      name: name.replace(/\.[^/.]+$/, ''), // Remove file extension from name
      description,
      type,
      scriptText: '', // No script text for uploaded files
      elevenLabsVoiceId: '', // No voice ID for uploaded files
      elevenLabsSettings: {},
      status: 'ready', // Uploaded files are immediately ready
      audioUrl: `/api/recordings/${recordingId}/stream`, // Point to stream endpoint
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        id: recordingId.toString(),
        duration: estimatedDuration,
        characterCount: 0,
        isAvailable: true,
        canStream: true,
        hasLocalFile: true,
        fileSize: audioBuffer.byteLength,
        lastGenerated: new Date().toISOString(),
        streamingInfo: {
          supportsStreaming: true,
          requiresRegeneration: false,
          lastStreamedAt: new Date().toISOString()
        }
      },
      // FreePBX information
      freepbxStatus: freepbxInfo.freepbxStatus,
      freepbxAutoUpload: freepbxInfo.freepbxAutoUpload,
      freepbxRecordingId: null,
      freepbxUploadedAt: null,
      freepbxError: null,
      // Store the audio data (in a real app, this would be a file path/URL)
      _audioData: audioBuffer
    };

    addRecording(newRecording);

    return NextResponse.json({
      data: newRecording,
      success: true,
      message: `Audio file uploaded successfully${freepbxInfo.freepbxAutoUpload ? '. FreePBX upload initiated.' : ''}`
    });

  } catch (error) {
    console.error('Error uploading audio file:', error);
    return NextResponse.json(
      { error: 'Failed to upload audio file' },
      { status: 500 }
    );
  }
} 