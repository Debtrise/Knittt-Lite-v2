'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Phone, ArrowLeft, Upload, Plus } from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Button } from '@/app/components/ui/button';
import Input from '@/app/components/ui/Input';
import {
  listTwilioNumbers,
  addTwilioNumber,
  uploadTwilioNumbers
} from '@/app/utils/api';
import { useAuthStore } from '@/app/store/authStore';
import { TwilioNumber } from '@/app/types/sms';
import axios from 'axios';

export default function TwilioNumbersPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [numbers, setNumbers] = useState<TwilioNumber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [newNumber, setNewNumber] = useState({
    phoneNumber: '',
    accountSid: '',
    authToken: ''
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchNumbers();
  }, [isAuthenticated, router]);

  const fetchNumbers = async () => {
    setIsLoading(true);
    try {
      const data = await listTwilioNumbers();
      setNumbers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching Twilio numbers:', error);
      toast.error('Failed to load Twilio numbers');
      setNumbers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNumber = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newNumber.phoneNumber || !newNumber.accountSid || !newNumber.authToken) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setIsAdding(true);
    try {
      const data = await addTwilioNumber(newNumber);
      setNumbers([...numbers, data]);
      toast.success('Twilio number added successfully');
      setShowAddForm(false);
      setNewNumber({
        phoneNumber: '',
        accountSid: '',
        authToken: ''
      });
    } catch (error) {
      console.error('Error adding Twilio number:', error);
      toast.error('Failed to add Twilio number');
    } finally {
      setIsAdding(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }
    
    const formData = new FormData();
    formData.append('numbers', file);
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Use axios directly for upload progress tracking
      const response = await axios.post(
        `/api/twilio-numbers/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(progress);
            }
          },
        }
      );
      
      setUploadProgress(100);
      fetchNumbers();
      toast.success('Twilio numbers uploaded successfully');
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading Twilio numbers:', error);
      toast.error('Failed to upload Twilio numbers');
    } finally {
      setIsUploading(false);
      // Reset progress after a delay
      setTimeout(() => setUploadProgress(0), 2000);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
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
            Twilio Numbers
          </h1>
        </div>

        <div className="flex justify-end space-x-3 mb-6">
          <div>
            <input
              type="file"
              id="csvFile"
              accept=".csv"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="hidden"
            />
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 mr-2 rounded-full border-2 border-t-transparent border-white animate-spin"></div>
                  Uploading {uploadProgress}%...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload CSV
                </>
              )}
            </Button>
          </div>
          <Button
            variant="primary"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? 'Cancel' : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add Number
              </>
            )}
          </Button>
        </div>

        {showAddForm && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Add Twilio Number</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Enter your Twilio phone number and credentials
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <form onSubmit={handleAddNumber} className="space-y-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <div className="mt-1">
                      <Input
                        type="text"
                        id="phoneNumber"
                        value={newNumber.phoneNumber}
                        onChange={(e) => setNewNumber({...newNumber, phoneNumber: e.target.value})}
                        placeholder="+15551234567"
                        required
                      />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">Format: +15551234567</p>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="accountSid" className="block text-sm font-medium text-gray-700">
                      Account SID
                    </label>
                    <div className="mt-1">
                      <Input
                        type="text"
                        id="accountSid"
                        value={newNumber.accountSid}
                        onChange={(e) => setNewNumber({...newNumber, accountSid: e.target.value})}
                        placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        required
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-6">
                    <label htmlFor="authToken" className="block text-sm font-medium text-gray-700">
                      Auth Token
                    </label>
                    <div className="mt-1">
                      <Input
                        type="password"
                        id="authToken"
                        value={newNumber.authToken}
                        onChange={(e) => setNewNumber({...newNumber, authToken: e.target.value})}
                        placeholder="Your Twilio Auth Token"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowAddForm(false)}
                    className="mr-3"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isAdding}
                  >
                    Add Number
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
          </div>
        ) : numbers.length > 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone Number
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Messages Count
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Used
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {numbers.map((number) => (
                  <tr key={number.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{number.phoneNumber}</div>
                      <div className="text-xs text-gray-500 truncate max-w-xs">{number.accountSid}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                        ${number.status === 'available' ? 'bg-green-100 text-green-800' :
                          number.status === 'in-use' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'}`}
                      >
                        {number.status === 'available' ? 'Available' :
                          number.status === 'in-use' ? 'In Use' : 'Error'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {number.messagesCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(number.lastUsed || '')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(number.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 bg-white shadow sm:rounded-lg">
            <Phone className="w-12 h-12 mx-auto text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No Twilio numbers</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding a Twilio number or uploading a CSV file.
            </p>
            <div className="mt-6 flex justify-center space-x-3">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="secondary"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload CSV
              </Button>
              <Button
                onClick={() => setShowAddForm(true)}
                variant="primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Number
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 