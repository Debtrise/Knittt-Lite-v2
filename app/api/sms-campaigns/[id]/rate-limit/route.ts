import { NextRequest, NextResponse } from 'next/server';

const SMS_API_BASE = 'http://34.122.156.88:3001/api';

// PATCH /api/sms-campaigns/[id]/rate-limit - Update rate limit
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${SMS_API_BASE}/campaigns/${params.id}/rate-limit`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.message || 'Failed to update rate limit' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating rate limit:', error);
    return NextResponse.json(
      { error: 'Failed to update rate limit' },
      { status: 500 }
    );
  }
} 