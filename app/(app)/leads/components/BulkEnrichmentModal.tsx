'use client';

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Progress } from '@/app/components/ui/progress';
import { 
  Search, 
  Loader2, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Users,
  Phone
} from 'lucide-react';
import { useToast } from '@/app/components/ui/use-toast';
import api from '@/app/lib/api';
import { BulkEnrichmentResponse } from '@/app/types/tracers';

interface Lead {
  id: number;
  name: string;
  phone: string;
  email?: string;
}

interface BulkEnrichmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLeads: Lead[];
  onEnrichmentComplete: () => void;
}

export default function BulkEnrichmentModal({
  isOpen,
  onClose,
  selectedLeads,
  onEnrichmentComplete
}: BulkEnrichmentModalProps) {
  const [isEnriching, setIsEnriching] = useState(false);
  const [results, setResults] = useState<BulkEnrichmentResponse | null>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  // Filter leads that have phone numbers
  const enrichableLeads = selectedLeads.filter(lead => lead.phone && lead.phone.trim() !== '');
  const nonEnrichableLeads = selectedLeads.filter(lead => !lead.phone || lead.phone.trim() === '');

  const startBulkEnrichment = async () => {
    if (enrichableLeads.length === 0) {
      toast({
        title: "No enrichable leads",
        description: "Selected leads must have phone numbers to be enriched.",
        variant: "destructive",
      });
      return;
    }

    setIsEnriching(true);
    setProgress(0);
    setResults(null);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const response = await api.tracers.bulkEnrich({
        leadIds: enrichableLeads.map(lead => lead.id)
      });

      clearInterval(progressInterval);
      setProgress(100);
      setResults(response.data);

      toast({
        title: "Bulk enrichment completed",
        description: `${response.data.summary.successful} of ${response.data.summary.total} leads enriched successfully`,
        variant: response.data.summary.successful > 0 ? "default" : "destructive",
      });

      onEnrichmentComplete();
    } catch (error: any) {
      console.error('Bulk enrichment failed:', error);
      
      let errorTitle = "Bulk enrichment failed";
      let errorDescription = "Unknown error occurred";
      
      if (error.response?.status === 503) {
        errorTitle = "TracersAPI Service Unavailable";
        errorDescription = "The TracersAPI service is currently unavailable. Please try again later.";
      } else if (error.response?.status === 404) {
        errorTitle = "TracersAPI Not Found";
        errorDescription = "TracersAPI endpoints are not available. Please contact your administrator.";
      } else if (error.response?.data?.error) {
        if (error.response.data.error.includes('ENOTFOUND') || error.response.data.error.includes('getaddrinfo')) {
          errorTitle = "TracersAPI Connection Failed";
          errorDescription = "Unable to connect to TracersAPI service. Please check your network connection or contact support.";
        } else {
          errorDescription = error.response.data.error;
        }
      } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        errorTitle = "Network Connection Error";
        errorDescription = "Unable to connect to the server. Please check your internet connection.";
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive",
      });
    } finally {
      setIsEnriching(false);
    }
  };

  const handleClose = () => {
    if (!isEnriching) {
      setResults(null);
      setProgress(0);
      onClose();
    }
  };

  const getStatusIcon = (status: 'success' | 'error') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: 'success' | 'error') => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Bulk Lead Enrichment
          </DialogTitle>
          <DialogDescription>
            Enrich multiple leads at once with TracersAPI data including additional emails, 
            phone numbers, addresses, and relatives.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Lead Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium mb-3">Selected Leads Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span>Total Selected: <strong>{selectedLeads.length}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-green-600" />
                <span>Enrichable: <strong>{enrichableLeads.length}</strong></span>
              </div>
            </div>
            
            {nonEnrichableLeads.length > 0 && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">
                    {nonEnrichableLeads.length} leads cannot be enriched
                  </span>
                </div>
                <p className="text-xs text-yellow-700">
                  These leads are missing phone numbers and will be skipped during enrichment.
                </p>
              </div>
            )}
          </div>

          {/* Progress */}
          {isEnriching && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Enriching leads...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-3">Enrichment Results</h4>
                <div className="grid grid-cols-3 gap-4 text-sm text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{results.summary.total}</div>
                    <div className="text-gray-600">Total</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{results.summary.successful}</div>
                    <div className="text-gray-600">Successful</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{results.summary.failed}</div>
                    <div className="text-gray-600">Failed</div>
                  </div>
                </div>
              </div>

              {/* Detailed Results */}
              <div className="max-h-60 overflow-y-auto space-y-2">
                {results.results.map((result) => {
                  const lead = enrichableLeads.find(l => l.id === result.leadId);
                  return (
                    <div key={result.leadId} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result.status)}
                        <div>
                          <div className="font-medium">{lead?.name}</div>
                          <div className="text-sm text-gray-500">{lead?.phone}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(result.status)}>
                          {result.status}
                        </Badge>
                        {result.enrichment && (
                          <Badge variant="outline">
                            {Math.round(result.enrichment.confidence * 100)}% confidence
                          </Badge>
                        )}
                      </div>
                      {result.error && (
                        <div className="text-xs text-red-600 max-w-xs truncate">
                          {result.error}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Lead List */}
          {!results && !isEnriching && (
            <div className="max-h-60 overflow-y-auto">
              <h4 className="font-medium mb-3">Leads to Enrich ({enrichableLeads.length})</h4>
              <div className="space-y-2">
                {enrichableLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">{lead.name}</div>
                      <div className="text-sm text-gray-500">{lead.phone}</div>
                    </div>
                    <Badge variant="outline">Ready</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isEnriching}
          >
            {results ? 'Close' : 'Cancel'}
          </Button>
          
          {!results && (
            <Button 
              onClick={startBulkEnrichment}
              disabled={isEnriching || enrichableLeads.length === 0}
            >
              {isEnriching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Enriching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Enrich {enrichableLeads.length} Lead{enrichableLeads.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 