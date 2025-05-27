import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Predefined voice presets based on Eleven Labs best practices
    const presets = [
      {
        name: "Default",
        description: "Balanced settings for general use",
        settings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0,
          useSpeakerBoost: true
        }
      },
      {
        name: "Very Stable",
        description: "Maximum consistency, minimal variation",
        settings: {
          stability: 0.9,
          similarityBoost: 0.8,
          style: 0,
          useSpeakerBoost: true
        }
      },
      {
        name: "More Variable",
        description: "More expressive with natural variation",
        settings: {
          stability: 0.3,
          similarityBoost: 0.6,
          style: 0.2,
          useSpeakerBoost: false
        }
      },
      {
        name: "Highly Expressive",
        description: "Maximum expressiveness and style",
        settings: {
          stability: 0.1,
          similarityBoost: 0.5,
          style: 0.8,
          useSpeakerBoost: false
        }
      },
      {
        name: "Audiobook",
        description: "Optimized for long-form narration",
        settings: {
          stability: 0.7,
          similarityBoost: 0.8,
          style: 0.1,
          useSpeakerBoost: true
        }
      },
      {
        name: "Conversational",
        description: "Natural dialogue and conversation",
        settings: {
          stability: 0.4,
          similarityBoost: 0.7,
          style: 0.3,
          useSpeakerBoost: false
        }
      },
      {
        name: "Dramatic",
        description: "Enhanced emotion and dramatic delivery",
        settings: {
          stability: 0.2,
          similarityBoost: 0.6,
          style: 0.9,
          useSpeakerBoost: false
        }
      },
      {
        name: "News Anchor",
        description: "Professional, clear, and authoritative",
        settings: {
          stability: 0.8,
          similarityBoost: 0.9,
          style: 0.1,
          useSpeakerBoost: true
        }
      }
    ];

    return NextResponse.json({ data: presets });

  } catch (error) {
    console.error('Voice presets error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 