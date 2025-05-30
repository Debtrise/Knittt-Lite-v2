import { NextRequest, NextResponse } from 'next/server';
import { getAllRecordings, addRecording, getNextId } from './shared-store';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const isActive = searchParams.get('isActive');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    let filteredRecordings = getAllRecordings();

    // Apply filters
    if (type) {
      filteredRecordings = filteredRecordings.filter(r => r.type === type);
    }
    if (isActive !== null) {
      const activeFilter = isActive === 'true';
      filteredRecordings = filteredRecordings.filter(r => r.isActive === activeFilter);
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedRecordings = filteredRecordings.slice(startIndex, endIndex);

    return NextResponse.json({
      data: paginatedRecordings,
      pagination: {
        page,
        limit,
        total: filteredRecordings.length,
        totalPages: Math.ceil(filteredRecordings.length / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching recordings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recordings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      type,
      scriptText,
      elevenLabsVoiceId,
      elevenLabsSettings
    } = body;

    // Validate required fields
    if (!name || !type || !scriptText || !elevenLabsVoiceId) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, scriptText, elevenLabsVoiceId' },
        { status: 400 }
      );
    }

    const recordingId = getNextId();

    // Create new recording
    const newRecording = {
      id: recordingId.toString(),
      name,
      description: description || '',
      type,
      scriptText,
      elevenLabsVoiceId,
      elevenLabsSettings: elevenLabsSettings || {},
      status: 'created',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        id: recordingId.toString(),
        duration: 0,
        characterCount: scriptText.length,
        isAvailable: false,
        canStream: false,
        hasLocalFile: false,
        lastGenerated: null
      }
    };

    addRecording(newRecording);

    return NextResponse.json({
      data: newRecording,
      success: true
    });
  } catch (error) {
    console.error('Error creating recording:', error);
    return NextResponse.json(
      { error: 'Failed to create recording' },
      { status: 500 }
    );
  }
} 