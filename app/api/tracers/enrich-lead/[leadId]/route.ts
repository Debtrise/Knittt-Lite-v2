import { NextRequest, NextResponse } from 'next/server';
import { LeadEnrichmentRequest, LeadEnrichmentResponse } from '@/app/types/tracers';

// Mock lead data storage - replace with actual database integration
const mockLeadDatabase = new Map<number, any>();

export async function POST(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    // Get authentication header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const leadId = parseInt(params.leadId);
    if (isNaN(leadId)) {
      return NextResponse.json({ 
        error: 'Invalid lead ID' 
      }, { status: 400 });
    }

    // Parse request body
    const body: LeadEnrichmentRequest = await request.json();

    // Mock lead lookup - replace with actual database query
    const mockLead = {
      id: leadId,
      tenantId: 'tenant_123',
      phone: '+15303061234',
      name: 'John Doe',
      email: 'john@example.com',
      status: 'pending',
      createdAt: '2024-01-01T10:00:00Z'
    };

    // Check if lead exists
    if (!mockLead) {
      return NextResponse.json({ 
        error: 'Lead not found' 
      }, { status: 404 });
    }

    // Check if lead has a phone number
    if (!mockLead.phone) {
      return NextResponse.json({ 
        error: 'Lead has no phone number for enrichment' 
      }, { status: 400 });
    }

    // Check if already enriched recently (unless force refresh)
    const existingEnrichment = mockLeadDatabase.get(leadId);
    if (existingEnrichment && !body.forceRefresh) {
      const lastEnriched = new Date(existingEnrichment.lastEnrichedAt);
      const daysSinceEnrichment = (Date.now() - lastEnriched.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceEnrichment < 90) { // Don't re-enrich within 90 days
        return NextResponse.json({
          success: true,
          enrichment: existingEnrichment
        });
      }
    }

    // Perform TracersAPI phone search
    // In production, this would call the actual TracersAPI
    const mockEnrichmentData = {
      leadId: leadId,
      tenantId: mockLead.tenantId,
      status: 'enriched' as const,
      confidence: 0.85,
      enrichedFields: {
        name: true,
        age: true,
        emails: true,
        phones: true,
        addresses: true,
        relatives: true,
        associates: false
      },
      enrichmentData: {
        firstName: "John",
        middleName: "Michael", 
        lastName: "Doe",
        age: 35,
        dateOfBirth: "1989-01-15",
        emails: [
          {
            email: "john.doe@email.com",
            type: "Personal"
          },
          {
            email: "j.doe@work.com",
            type: "Business"
          }
        ],
        phones: [
          {
            phone: mockLead.phone,
            type: "Mobile",
            carrier: "Verizon",
            lineType: "Wireless"
          }
        ],
        addresses: [
          {
            address: "123 Main St",
            city: "Sacramento",
            state: "CA",
            zip: "95814",
            county: "Sacramento",
            type: "Current"
          }
        ],
        relatives: [
          {
            name: "Jane Doe",
            relationship: "Spouse"
          }
        ],
        tracersPersonId: "abc123",
        lastUpdated: new Date().toISOString()
      },
      lastEnrichedAt: new Date().toISOString(),
      nextEnrichmentDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
    };

    // Store enrichment data (would save to database in production)
    mockLeadDatabase.set(leadId, mockEnrichmentData);

    // Update lead with enriched data (would update database in production)
    console.log('Lead enriched:', {
      leadId,
      confidence: mockEnrichmentData.confidence,
      enrichedFields: Object.keys(mockEnrichmentData.enrichedFields).filter(
        key => mockEnrichmentData.enrichedFields[key as keyof typeof mockEnrichmentData.enrichedFields]
      )
    });

    // TODO: Update lead record with enriched data
    // TODO: Trigger webhooks for lead enrichment
    // TODO: Add to search history
    // TODO: Update usage statistics

    const response: LeadEnrichmentResponse = {
      success: true,
      enrichment: mockEnrichmentData
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Lead enrichment error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 