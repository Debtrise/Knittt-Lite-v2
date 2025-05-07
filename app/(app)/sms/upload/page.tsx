'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Upload, File, ArrowLeft, Check, AlertTriangle } from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Button } from '@/app/components/ui/button';
import { useAuthStore } from '@/app/store/authStore';
import { uploadSmsLeads } from '@/app/utils/api';

export default function SmsLeadsUploadPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    totalContacts?: number;
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const selectedFile = e.target.files[0];
    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }
    
    setFile(selectedFile);
    setUploadResult(null);
  };
  
  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a CSV file');
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('contacts', file);
      
      // Set upload progress simulation
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 300);
      
      const response = await uploadSmsLeads(formData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setUploadResult({
        success: true,
        message: 'Leads uploaded successfully',
        totalContacts: response.campaign?.totalContacts || 0
      });
      
      toast.success('Leads uploaded successfully');
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setFile(null);
    } catch (error) {
      console.error('Error uploading leads:', error);
      setUploadResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to upload leads'
      });
      toast.error('Failed to upload leads');
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/sms')}
            className="mr-4"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900">
            Upload SMS Leads
          </h1>
        </div>
        
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Upload Leads for SMS Campaigns
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Upload a CSV file with leads that can be used across any SMS campaign.
            </p>
          </div>
          
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700">CSV File Format</h4>
                <p className="text-sm text-gray-500 mt-1">
                  The CSV file must have a <code className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">phone</code> column. 
                  Other recognized columns are <code className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">name</code> and <code className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">email</code>.
                  Any additional columns will be available as custom fields in your message templates.
                </p>
                
                <div className="mt-3 p-3 bg-gray-50 rounded-md">
                  <h4 className="text-sm font-medium text-gray-700">Example CSV format:</h4>
                  <pre className="mt-1 text-xs text-gray-600">phone,name,email,custom_field1,custom_field2
+12345678901,John Doe,john@example.com,value1,value2</pre>
                </div>
              </div>
              
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      CSV file only (max 10MB)
                    </p>
                    {file && (
                      <div className="flex items-center mt-4 text-sm font-medium text-brand">
                        <File className="h-4 w-4 mr-2" />
                        {file.name}
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    id="file-upload"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
              
              {uploadProgress > 0 && isUploading && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-1">Uploading: {uploadProgress}%</p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-brand h-2.5 rounded-full" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              {uploadResult && (
                <div className={`mt-4 p-4 rounded-md ${uploadResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex">
                    <div className="flex-shrink-0">
                      {uploadResult.success ? (
                        <Check className="h-5 w-5 text-green-400" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-400" />
                      )}
                    </div>
                    <div className="ml-3">
                      <h3 className={`text-sm font-medium ${uploadResult.success ? 'text-green-800' : 'text-red-800'}`}>
                        {uploadResult.success ? 'Upload successful' : 'Upload failed'}
                      </h3>
                      <div className={`mt-2 text-sm ${uploadResult.success ? 'text-green-700' : 'text-red-700'}`}>
                        <p>{uploadResult.message}</p>
                        {uploadResult.success && uploadResult.totalContacts !== undefined && (
                          <p className="mt-1">Total contacts processed: {uploadResult.totalContacts}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="pt-5">
                <div className="flex justify-end">
                  <Button
                    variant="secondary"
                    onClick={() => router.push('/sms')}
                    className="mr-3"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleUpload}
                    disabled={!file || isUploading}
                    isLoading={isUploading}
                  >
                    Upload
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 