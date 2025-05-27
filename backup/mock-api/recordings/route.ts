import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for recordings (in a real app, this would be a database)
let recordings: any[] = [];
let nextId = 1;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const isActive = searchParams.get('isActive');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    let filteredRecordings = recordings;

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

    // Create new recording
    const newRecording = {
      id: nextId.toString(),
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
        duration: 0,
        characterCount: scriptText.length,
        isAvailable: false,
        lastGenerated: null
      }
    };

    recordings.push(newRecording);
    nextId++;

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