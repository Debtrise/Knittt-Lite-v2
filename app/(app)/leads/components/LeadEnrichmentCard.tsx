'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Users, 
  Calendar,
  Search,
  Loader2,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import api from '@/app/lib/api';
import { useToast } from '@/app/components/ui/use-toast';
import { LeadEnrichmentData, EnrichmentStatusResponse } from '@/app/types/tracers';

interface LeadEnrichmentCardProps {
  leadId: number;
  leadPhone?: string;
  leadName?: string;
  onEnrichmentComplete?: (enrichmentData: LeadEnrichmentData) => void;
}

export default function LeadEnrichmentCard({ 
  leadId, 
  leadPhone, 
  leadName,
  onEnrichmentComplete 
}: LeadEnrichmentCardProps) {
  const [enrichmentData, setEnrichmentData] = useState<LeadEnrichmentData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load existing enrichment data on mount
  useEffect(() => {
    loadEnrichmentStatus();
  }, [leadId]);

  const loadEnrichmentStatus = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.tracers.getEnrichmentStatus(leadId);
      if (response.data.enriched && response.data.enrichment) {
        setEnrichmentData(response.data.enrichment);
      }
    } catch (err: any) {
      console.error('Failed to load enrichment status:', err);
      // Don't show error for 404 (lead not enriched yet)
      if (err.response?.status !== 404) {
        setError('Failed to load enrichment status');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const enrichLead = async (forceRefresh = false) => {
    setIsEnriching(true);
    setError(null);

    try {
      const response = await api.tracers.enrichLead(leadId, { forceRefresh });
      
      if (response.data.success) {
        setEnrichmentData(response.data.enrichment);
        onEnrichmentComplete?.(response.data.enrichment);
        
        // Safely access enrichment data with fallbacks
        const enrichmentData = response.data.enrichment?.enrichmentData;
        const emailCount = enrichmentData?.emails?.length || 0;
        const phoneCount = enrichmentData?.phones?.length || 0;
        const addressCount = enrichmentData?.addresses?.length || 0;
        
        toast({
          title: "Lead Enriched Successfully",
          description: `Found ${emailCount} emails, ${phoneCount} phones, and ${addressCount} addresses`,
        });
      }
    } catch (err: any) {
      console.error('Enrichment failed:', err);
      
      let errorMessage = 'Failed to enrich lead';
      let errorDescription = '';
      
      // Handle specific error types
      if (err.response?.status === 503) {
        errorMessage = 'TracersAPI Service Unavailable';
        errorDescription = 'The TracersAPI service is currently unavailable. Please try again later.';
      } else if (err.response?.status === 404) {
        errorMessage = 'TracersAPI Not Found';
        errorDescription = 'TracersAPI endpoints are not available. Please contact your administrator.';
      } else if (err.response?.data?.error) {
        if (err.response.data.error.includes('ENOTFOUND') || err.response.data.error.includes('getaddrinfo')) {
          errorMessage = 'TracersAPI Connection Failed';
          errorDescription = 'Unable to connect to TracersAPI service. Please check your network connection or contact support.';
        } else if (err.response.data.error.includes('not configured')) {
          errorMessage = 'TracersAPI Not Configured';
          errorDescription = 'TracersAPI is not properly configured. Please contact your administrator.';
        } else if (err.response.data.error.includes('no phone number')) {
          errorMessage = 'Phone Number Required';
          errorDescription = 'This lead needs a phone number to be enriched.';
        } else {
          errorMessage = err.response.data.error;
        }
      } else if (err.code === 'NETWORK_ERROR' || err.message?.includes('Network Error')) {
        errorMessage = 'Network Connection Error';
        errorDescription = 'Unable to connect to the server. Please check your internet connection.';
      }
      
      setError(errorMessage);
      
      toast({
        title: errorMessage,
        description: errorDescription || "Please try again or contact support if the problem persists",
        variant: "destructive",
      });
    } finally {
      setIsEnriching(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Lead Enrichment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading enrichment status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Lead Enrichment
          </div>
          {enrichmentData && (
            <Badge className={getConfidenceColor(enrichmentData.confidence)}>
              {Math.round(enrichmentData.confidence * 100)}% confidence
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        {!enrichmentData ? (
          <div className="text-center py-6">
            <div className="mb-4">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">Lead Not Enriched</h3>
              <p className="text-gray-500">
                Enrich this lead to get additional contact information, relatives, and address history.
              </p>
            </div>
            <Button 
              onClick={() => enrichLead(false)}
              disabled={isEnriching || !leadPhone}
              className="w-full"
            >
              {isEnriching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Enriching Lead...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Enrich Lead
                </>
              )}
            </Button>
            {!leadPhone && (
              <p className="text-xs text-red-500 mt-2">
                Lead must have a phone number to enrich
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Enrichment Summary */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-gray-600">
                  Last enriched: {formatDate(enrichmentData.lastEnrichedAt)}
                </span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => enrichLead(true)}
                disabled={isEnriching}
              >
                {isEnriching ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
              </Button>
            </div>

            <Separator />

            {/* Personal Information */}
            <div>
              <h4 className="flex items-center gap-2 font-medium mb-2">
                <User className="h-4 w-4" />
                Personal Information
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                                 <div>
                   <span className="text-gray-500">Name:</span>
                   <span className="ml-2">
                     {[
                       enrichmentData.enrichmentData.firstName,
                       enrichmentData.enrichmentData.middleName,
                       enrichmentData.enrichmentData.lastName
                     ].filter(Boolean).join(' ') || 'N/A'}
                   </span>
                 </div>
                                 {enrichmentData.enrichmentData?.age && (
                   <div>
                     <span className="text-gray-500">Age:</span>
                     <span className="ml-2">{enrichmentData.enrichmentData.age}</span>
                   </div>
                 )}
                 {enrichmentData.enrichmentData?.dateOfBirth && (
                   <div>
                     <span className="text-gray-500">DOB:</span>
                     <span className="ml-2">{formatDate(enrichmentData.enrichmentData.dateOfBirth)}</span>
                   </div>
                 )}
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h4 className="flex items-center gap-2 font-medium mb-2">
                <Phone className="h-4 w-4" />
                Contact Information
              </h4>
              
                             {/* Phones */}
               <div className="space-y-1 mb-2">
                 {(enrichmentData.enrichmentData.phones || []).map((phone, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span>{phone.phone}</span>
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-xs">{phone.type}</Badge>
                      {phone.carrier && (
                        <Badge variant="outline" className="text-xs">{phone.carrier}</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Emails */}
              <div className="space-y-1">
                <h5 className="flex items-center gap-1 text-sm font-medium">
                  <Mail className="h-3 w-3" />
                  Emails
                </h5>
                                 {(enrichmentData.enrichmentData.emails || []).map((email, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span>{email.email}</span>
                    <Badge variant="outline" className="text-xs">{email.type}</Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Addresses */}
            <div>
              <h4 className="flex items-center gap-2 font-medium mb-2">
                <MapPin className="h-4 w-4" />
                Addresses
              </h4>
                             <div className="space-y-2">
                 {(enrichmentData.enrichmentData.addresses || []).map((address, index) => (
                  <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{address.address}</span>
                      <Badge variant="outline" className="text-xs">{address.type}</Badge>
                    </div>
                    <div className="text-gray-600">
                      {address.city}, {address.state} {address.zip}
                    </div>
                    {address.county && (
                      <div className="text-gray-500 text-xs">
                        {address.county} County
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

                         {/* Relatives */}
             {(enrichmentData.enrichmentData.relatives || []).length > 0 && (
              <div>
                <h4 className="flex items-center gap-2 font-medium mb-2">
                  <Users className="h-4 w-4" />
                  Relatives
                </h4>
                                 <div className="space-y-1">
                   {(enrichmentData.enrichmentData.relatives || []).map((relative, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span>{relative.name}</span>
                      <Badge variant="outline" className="text-xs">{relative.relationship}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next Enrichment Date */}
            <div className="pt-2 border-t">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar className="h-3 w-3" />
                Next enrichment available: {formatDate(enrichmentData.nextEnrichmentDate)}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 