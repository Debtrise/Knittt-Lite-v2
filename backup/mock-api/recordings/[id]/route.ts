import { NextRequest, NextResponse } from 'next/server';

// Import the recordings array from the main route (in a real app, this would be a database)
// For now, we'll recreate it here - in a real app you'd use a shared database
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

    return NextResponse.json({ data: recording });
  } catch (error) {
    console.error('Error fetching recording:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recording' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const recordingIndex = recordings.findIndex(r => r.id === params.id);
    
    if (recordingIndex === -1) {
      return NextResponse.json(
        { error: 'Recording not found' },
        { status: 404 }
      );
    }

    // Update recording
    recordings[recordingIndex] = {
      ...recordings[recordingIndex],
      ...body,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      data: recordings[recordingIndex],
      success: true
    });
  } catch (error) {
    console.error('Error updating recording:', error);
    return NextResponse.json(
      { error: 'Failed to update recording' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const recordingIndex = recordings.findIndex(r => r.id === params.id);
    
    if (recordingIndex === -1) {
      return NextResponse.json(
        { error: 'Recording not found' },
        { status: 404 }
      );
    }

    // Remove recording
    recordings.splice(recordingIndex, 1);

    return NextResponse.json({
      success: true,
      message: 'Recording deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting recording:', error);
    return NextResponse.json(
      { error: 'Failed to delete recording' },
      { status: 500 }
    );
  }
} 