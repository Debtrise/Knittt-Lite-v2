'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, Check, AlertTriangle, UploadCloud, Table, X } from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Button } from '@/app/components/ui/button';
import { useAuthStore } from '@/app/store/authStore';
import { previewCsv, importContactsSimplified, listSmsCampaigns, getSmsCampaignDetails } from '@/app/utils/api';
import { CsvPreview, SmsCampaign } from '@/app/types/sms';

// Field mapping component (simplified example)
const FieldMapping = ({ headers, recommendedMappings, fieldMapping, setFieldMapping }: {
  headers: string[];
  recommendedMappings: Record<string, string>;
  fieldMapping: Record<string, string>;
  setFieldMapping: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) => {
  const systemFields = [
    { id: 'phone', label: 'Phone Number', required: true },
    { id: 'name', label: 'Contact Name', required: false },
    { id: 'email', label: 'Email Address', required: false }
  ]; 

  const handleMappingChange = (systemField: string, csvHeader: string) => {
    setFieldMapping(prev => ({ ...prev, [systemField]: csvHeader }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-md font-medium text-gray-700">Map CSV Headers to System Fields:</h3>
        <div className="text-xs text-red-500 font-medium">* Required field</div>
      </div>
      
      {systemFields.map(field => (
        <div key={field.id} className="grid grid-cols-3 gap-4 items-center">
          <label htmlFor={`map-${field.id}`} className={`block text-sm font-medium ${field.required ? 'text-gray-800' : 'text-gray-700'} capitalize`}>
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <div className="col-span-2">
            <select
              id={`map-${field.id}`}
              value={fieldMapping[field.id] || ''}
              onChange={(e) => handleMappingChange(field.id, e.target.value)}
              className={`block w-full pl-3 pr-10 py-2 text-base border ${
                field.required && !fieldMapping[field.id] 
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                  : 'border-gray-300 focus:ring-brand focus:border-brand'
              } rounded-md`}
              required={field.required}
            >
              <option value="">-- Select CSV Header --</option>
              {headers.map(header => (
                <option key={header} value={header}>{header}</option>
              ))}
            </select>
            {field.required && !fieldMapping[field.id] && (
              <p className="mt-1 text-xs text-red-500">This field is required for importing contacts</p>
            )}
          </div>
        </div>
      ))}
       
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-sm text-blue-800">
          <strong>Field Mapping Instructions:</strong>
        </p>
        <ul className="mt-2 text-xs text-blue-700 list-disc pl-5 space-y-1">
          <li><strong>Phone Number</strong> is required and must be mapped to a CSV column containing valid phone numbers.</li>
          <li>Name and Email are optional but recommended for better contact management.</li>
          <li>Any unmapped CSV columns will be imported as custom fields.</li>
          <li>Make sure your CSV headers match the expected format to ensure proper importing.</li>
        </ul>
      </div>
    </div>
  );
};

function UploadLeadsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<CsvPreview | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [campaigns, setCampaigns] = useState<SmsCampaign[]>([]);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [preselectedCampaign, setPreselectedCampaign] = useState<SmsCampaign | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Check for campaign ID in URL
    const campaignIdFromUrl = searchParams.get('campaignId');
    
    // Fetch campaigns for the dropdown
    const fetchCampaigns = async () => {
      try {
        const data = await listSmsCampaigns({ limit: 1000 }); // Fetch all campaigns
        setCampaigns(data.campaigns || []);
        
        // If campaign ID is in the URL, pre-select it and fetch details
        if (campaignIdFromUrl) {
          setSelectedCampaignId(campaignIdFromUrl);
          try {
            const campaignDetails = await getSmsCampaignDetails(parseInt(campaignIdFromUrl, 10));
            setPreselectedCampaign(campaignDetails);
          } catch (error) {
            console.error('Error fetching campaign details:', error);
          }
        }
        
        // If we can fetch campaigns, we're implicitly connected to the API
        setApiConnected(true);
      } catch (error) {
        console.error('Error fetching campaigns:', error);
        toast.error('Failed to load campaigns for selection.');
        // If we can't fetch campaigns, there might be connectivity issues
        setApiConnected(false);
      }
    };
    
    fetchCampaigns();
  }, [isAuthenticated, router, searchParams]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewData(null); // Reset preview on new file
      setFieldMapping({}); // Reset mapping
    }
  };

  const handlePreview = async () => {
    if (!file) {
      toast.error('Please select a CSV file first.');
      return;
    }
    
    setIsPreviewing(true);
    setPreviewData(null);
    setFieldMapping({});
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await previewCsv(formData);
      setPreviewData(response);
      
      // Set initial field mapping from recommendations or attempt to find common fields
      let initialMapping = response.recommendedMappings ? { ...response.recommendedMappings } : {};
      
      // If no recommended mappings for phone, try to find common phone field names
      if (!initialMapping.phone && response.headers) {
        const phoneHeaders = response.headers.filter((h: string) => 
          h.toLowerCase().includes('phone') || 
          h.toLowerCase().includes('mobile') || 
          h.toLowerCase().includes('cell') ||
          h.toLowerCase() === 'number' ||
          h.toLowerCase() === 'tel'
        );
        
        if (phoneHeaders.length > 0) {
          initialMapping.phone = phoneHeaders[0];
        }
      }
      
      // Try to find name fields if not recommended
      if (!initialMapping.name && response.headers) {
        const nameHeaders = response.headers.filter((h: string) => 
          h.toLowerCase().includes('name') || 
          h.toLowerCase() === 'fullname' || 
          h.toLowerCase() === 'contact' ||
          h.toLowerCase() === 'customer'
        );
        
        if (nameHeaders.length > 0) {
          initialMapping.name = nameHeaders[0];
        }
      }
      
      // Try to find email fields if not recommended
      if (!initialMapping.email && response.headers) {
        const emailHeaders = response.headers.filter((h: string) => 
          h.toLowerCase().includes('email') || 
          h.toLowerCase().includes('mail') ||
          h.toLowerCase() === 'e-mail'
        );
        
        if (emailHeaders.length > 0) {
          initialMapping.email = emailHeaders[0];
        }
      }
      
      setFieldMapping(initialMapping);
      
      if (!initialMapping.phone) {
        toast.success('CSV preview loaded. Please map the required Phone Number field.');
      } else {
        toast.success('CSV preview loaded successfully with auto-mapped fields.');
      }
      
      // If we can preview successfully, we have API connectivity
      setApiConnected(true);
    } catch (error: any) {
      console.error('Error previewing CSV:', error);
      // Display a more user-friendly error message
      const errorMessage = error.message || 'Failed to preview CSV. Please check the file format.';
      toast.error(errorMessage);
      
      // Network error indicates API connectivity issues
      if (error.message === 'Network Error' || errorMessage.includes('Network connection failed')) {
        setApiConnected(false);
        toast.error('API server might be unreachable. Please try again later or contact support.', {
          duration: 5000,
        });
      }
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleImport = async () => {
    if (!file || !previewData) {
      toast.error('Please select a file and preview it first.');
      return;
    }
    
    // Enhanced field mapping validation
    if (!fieldMapping.phone || fieldMapping.phone.trim() === '') {
      toast.error('Phone Number field mapping is required. Please select a column for phone numbers.');
      // Scroll to the field mapping section
      document.querySelector('#map-phone')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    
    // Check if there are any CSV headers that weren't properly mapped
    const mappedValues = Object.values(fieldMapping).filter(Boolean);
    const uniqueMappedValues = new Set(mappedValues);
    
    if (mappedValues.length !== uniqueMappedValues.size) {
      toast.error('You have mapped multiple fields to the same CSV column. Please use each column only once.');
      return;
    }
    
    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    const campaignIdNum = selectedCampaignId ? parseInt(selectedCampaignId, 10) : undefined;

    // Show debug info
    console.log('Importing with mapping:', fieldMapping);
    console.log('Field mapping:', fieldMapping);
    console.log('File name:', file.name);
    console.log('File size:', file.size);

    try {
        // Use the simplified import approach
        const response = await importContactsSimplified(formData);
        
        // Successful import means API is connected
        setApiConnected(true);
        toast.success(response.message || 'Contacts imported successfully!');
        
        // Optionally redirect or clear form
        setFile(null);
        setPreviewData(null);
        setFieldMapping({});
        setSelectedCampaignId('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        
        // Maybe redirect to the campaign page if one was selected
        if(campaignIdNum) router.push(`/sms/${campaignIdNum}/settings`);
        else router.push('/sms'); 

    } catch (error: any) {
      console.error('Error importing contacts:', error);
      
      // More detailed error handling
      if (error.code === 'ECONNABORTED') {
        setApiConnected(false);
        toast.error('Connection timeout. The server took too long to respond.');
      } else if (error.message === 'Network Error') {
        setApiConnected(false);
        toast.error('Network connection failed. Please check your internet connection or try again later.');
      } else if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Server error data:', error.response.data);
        console.error('Server error status:', error.response.status);
        console.error('Server error headers:', error.response.headers);
        
        const errorMsg = error.response.data?.error || 
                         error.response.data?.message || 
                         `Server error (${error.response.status}): Please check your data and try again.`;
        toast.error(errorMsg);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        toast.error('No response received from the server. Please try again later.');
      } else {
        // Something happened in setting up the request that triggered an Error
        const errorMsg = error.message || 'Failed to import contacts. Please check console for details.';
        toast.error(errorMsg);
      }
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button variant="ghost" onClick={() => router.back()} className="mr-4">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-semibold text-gray-900">
              {preselectedCampaign 
                ? `Upload Contacts for: ${preselectedCampaign.name}` 
                : 'Upload & Import Contacts'}
            </h1>
          </div>
          {preselectedCampaign && (
            <div className="text-sm text-gray-500">
              Campaign Status: <span className={`font-medium ${
                preselectedCampaign.status === 'active' ? 'text-green-600' : 'text-yellow-600'
              }`}>{preselectedCampaign.status}</span>
            </div>
          )}
        </div>

        {apiConnected === false && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Connection Warning</h3>
                <p className="text-sm text-yellow-700">
                  We're having trouble connecting to the server. Some features might be temporarily unavailable. 
                  You can still prepare your CSV file and try uploading again shortly.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6 space-y-6">
          {/* File Upload Section */}
          <div>
            <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
              Select CSV File
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload-input"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-brand hover:text-brand-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-brand"
                  >
                    <span>Upload a file</span>
                    <input id="file-upload-input" name="file-upload" type="file" className="sr-only" accept=".csv" onChange={handleFileChange} ref={fileInputRef}/>
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">CSV up to 10MB</p>
              </div>
            </div>
            {file && (
              <div className="mt-4 flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <p className="text-sm font-medium text-gray-700 truncate">Selected: {file.name}</p>
                <Button variant="ghost" size="sm" onClick={() => { setFile(null); setPreviewData(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
                  <X className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            )}
            <Button 
              onClick={handlePreview} 
              disabled={!file || isPreviewing}
              isLoading={isPreviewing}
              className="mt-4 w-full"
              variant="secondary"
             >
              <Table className="w-4 h-4 mr-2" />
              Preview CSV & Configure Mapping
            </Button>
          </div>

          {/* Preview & Mapping Section */}
          {previewData && (
            <div className="border-t pt-6 space-y-6">
              <div className="flex flex-col space-y-2">
                <h2 className="text-lg font-semibold text-gray-900">CSV Preview & Field Mapping</h2>
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-red-600">Field mapping is required</span> to correctly import your contacts. 
                  At minimum, you must map the <span className="font-medium">Phone Number</span> field.
                </p>
                <p className="text-sm text-gray-600">Estimated Total Rows: {previewData.totalRowsEstimate || 'N/A'}</p>
              </div>
              
              {/* Preview Table */}
              <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                          <tr>
                              {previewData.headers.map(header => (
                                  <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      {header}
                                  </th>
                              ))}
                          </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                          {previewData.previewRows.map((row, index) => (
                              <tr key={index}>
                                  {previewData.headers.map(header => (
                                      <td key={`${index}-${header}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                          {row[header]}
                                      </td>
                                  ))}
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>

              {/* Field Mapping Component */}
              <FieldMapping 
                headers={previewData.headers}
                recommendedMappings={previewData.recommendedMappings}
                fieldMapping={fieldMapping}
                setFieldMapping={setFieldMapping}
              />

              {/* Campaign Assignment (Optional) - Updated to handle preselected campaign */}
               <div>
                  <label htmlFor="campaign-select" className="block text-sm font-medium text-gray-700">
                      {preselectedCampaign ? 'Selected Campaign' : 'Assign to Campaign (Optional)'}
                  </label>
                  <select
                    id="campaign-select"
                    value={selectedCampaignId}
                    onChange={(e) => setSelectedCampaignId(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand focus:border-brand sm:text-sm rounded-md"
                    disabled={!!preselectedCampaign}
                  >
                    {!preselectedCampaign && <option value="">-- Assign Later or Use Default --</option>}
                    {campaigns.map(campaign => (
                      <option key={campaign.id} value={campaign.id.toString()}>{campaign.name}</option>
                    ))}
                  </select>
                   <p className="mt-2 text-xs text-gray-500">
                      {preselectedCampaign 
                        ? 'Contacts will be uploaded to the selected campaign.' 
                        : 'If no campaign is selected, contacts might be assigned to a default campaign or held for later assignment, depending on backend configuration.'}
                   </p>
              </div>

              {/* Import Button */}
              <div className="space-y-2">
                <Button 
                  onClick={handleImport} 
                  disabled={isImporting || !fieldMapping.phone}
                  isLoading={isImporting}
                  className="w-full"
                  variant="brand"
                >
                  <Check className="w-4 h-4 mr-2" />
                  {isImporting ? 'Importing...' : 'Import Contacts'}
                </Button>
                {!fieldMapping.phone && (
                  <p className="text-center text-sm text-red-500">
                    Phone Number field mapping is required to import contacts
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function UploadLeadsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UploadLeadsContent />
    </Suspense>
  );
} 