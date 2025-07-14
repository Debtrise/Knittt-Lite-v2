'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Label } from '@/app/components/ui/label';
import { useAuthStore } from '@/app/store/authStore';
import { recordings } from '@/app/lib/api';
import { 
  Mic, CheckCircle, XCircle, AlertCircle, 
  ArrowLeft, Save, TestTube, Activity, Volume2, Play
} from 'lucide-react';
import Link from 'next/link';

type ElevenLabsConfig = {
  apiKey: string;
  defaultVoiceId: string;
  defaultSettings: {
    stability: number;
    similarityBoost: number;
    style: number;
    useSpeakerBoost: boolean;
  };
  usage: {
    characterCount: number;
    characterLimit: number;
    voiceLimit: number;
    canExtendCharacterLimit: boolean;
  } | null;
};

type Voice = {
  id: string;
  name: string;
  category: string;
  previewUrl: string;
  settings?: {
    stability: number;
    similarityBoost: number;
    style?: number;
    useSpeakerBoost?: boolean;
  };
};

export default function ElevenLabsSettingsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [usageData, setUsageData] = useState<any>(null);

  const form = useForm<ElevenLabsConfig>({
    defaultValues: {
      apiKey: '',
      defaultVoiceId: '',
      defaultSettings: {
        stability: 0.5,
        similarityBoost: 0.8,
        style: 0.0,
        useSpeakerBoost: true
      },
      usage: null
    }
  });

  const { register, handleSubmit, setValue, watch, formState: { errors } } = form;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.role !== 'admin') {
      router.push('/settings');
      return;
    }

    fetchElevenLabsConfig();
  }, [isAuthenticated, user, router]);

  const fetchElevenLabsConfig = async () => {
    setIsLoading(true);
    try {
      // Get current configuration
      const configResponse = await recordings.getConfig();
      if (configResponse.data) {
        setValue('apiKey', configResponse.data.apiKey || '');
        
        // Get usage data
        const usageResponse = await recordings.getUsage();
        setUsageData(usageResponse.data);
        setValue('usage', usageResponse.data);
        
        // Get available voices
        const voicesResponse = await recordings.getVoices();
        setVoices(voicesResponse.data || []);
        
        if (voicesResponse.data && voicesResponse.data.length > 0) {
          setValue('defaultVoiceId', voicesResponse.data[0].id);
          setSelectedVoice(voicesResponse.data[0]);
        }
      }
      
      toast.success('Eleven Labs configuration loaded');
    } catch (error) {
      console.error('Error fetching Eleven Labs config:', error);
      toast.error('Failed to load Eleven Labs configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: ElevenLabsConfig) => {
    setIsSaving(true);
    try {
      await recordings.configure({ apiKey: data.apiKey });
      toast.success('Eleven Labs configuration saved successfully');
      
      // Refresh data after saving
      await fetchElevenLabsConfig();
    } catch (error) {
      console.error('Error saving Eleven Labs config:', error);
      toast.error('Failed to save Eleven Labs configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const testConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const formData = form.getValues();
      
      // Save the API key first
      await recordings.configure({ apiKey: formData.apiKey });
      
      // Test by fetching voices
      const voicesResponse = await recordings.getVoices();
      
      if (voicesResponse.data && voicesResponse.data.length > 0) {
        setTestResult({
          success: true,
          message: `Connection successful! Found ${voicesResponse.data.length} voices.`
        });
        setVoices(voicesResponse.data);
      } else {
        setTestResult({
          success: false,
          message: 'Connection failed or no voices available.'
        });
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.response?.data?.message || 'Connection test failed'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const testVoice = async (voiceId: string, text: string = "Hello, this is a test of the Eleven Labs voice synthesis.") => {
    setIsPlayingPreview(true);
    try {
      const previewResponse = await recordings.preview({
        text,
        voiceId,
        voiceSettings: form.getValues().defaultSettings
      });
      
      if (previewResponse.data?.previewId) {
        // Stream the preview
        const audioResponse = await recordings.streamPreview(previewResponse.data.previewId);
        
        // Create audio element and play
        const audioBlob = new Blob([audioResponse.data], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          setIsPlayingPreview(false);
          URL.revokeObjectURL(audioUrl);
        };
        
        audio.play();
      }
    } catch (error) {
      console.error('Error testing voice:', error);
      toast.error('Failed to test voice');
      setIsPlayingPreview(false);
    }
  };

  const handleVoiceSelect = (voice: Voice) => {
    setSelectedVoice(voice);
    setValue('defaultVoiceId', voice.id);
    if (voice.settings) {
      setValue('defaultSettings.stability', voice.settings.stability);
      setValue('defaultSettings.similarityBoost', voice.settings.similarityBoost);
      setValue('defaultSettings.style', voice.settings.style || 0);
      setValue('defaultSettings.useSpeakerBoost', voice.settings.useSpeakerBoost || false);
    }
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <DashboardLayout>
        <div className="py-6 text-center text-gray-500">
          Access denied. Admin privileges required.
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="py-6">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-3">
              <Activity className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-lg text-gray-700">Loading Eleven Labs configuration...</span>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const usagePercentage = usageData?.characterCount && usageData?.characterLimit 
    ? (usageData.characterCount / usageData.characterLimit) * 100 
    : 0;

  return (
    <DashboardLayout>
      <div className="py-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/settings">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Settings
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <Mic className="w-8 h-8 mr-3 text-blue-600" />
                  Eleven Labs Settings
                </h1>
                <p className="mt-2 text-gray-600">
                  Configure text-to-speech voice synthesis settings
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Overview */}
        {usageData && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Usage Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {usageData.characterCount?.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-gray-600">Characters Used</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {usageData.characterLimit?.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-gray-600">Character Limit</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {usageData.voiceLimit || 0}
                  </div>
                  <div className="text-sm text-gray-600">Voice Limit</div>
                </div>
              </div>
              
              {/* Usage Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    usagePercentage > 90 ? 'bg-red-500' : 
                    usagePercentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {usagePercentage.toFixed(1)}% of monthly limit used
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration Form */}
          <div className="space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* API Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>API Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="apiKey">API Key</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      {...register('apiKey', { required: 'API Key is required' })}
                      placeholder="Enter your Eleven Labs API key"
                    />
                    {errors.apiKey && (
                      <p className="text-sm text-red-600 mt-1">{errors.apiKey.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="defaultVoiceId">Default Voice</Label>
                    <select
                      id="defaultVoiceId"
                      {...register('defaultVoiceId')}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      onChange={(e) => {
                        const voice = voices.find(v => v.id === e.target.value);
                        if (voice) handleVoiceSelect(voice);
                      }}
                    >
                      <option value="">Select a voice</option>
                      {voices.map((voice) => (
                        <option key={voice.id} value={voice.id}>
                          {voice.name} ({voice.category})
                        </option>
                      ))}
                    </select>
                  </div>
                </CardContent>
              </Card>

              {/* Voice Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Default Voice Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="stability">
                      Stability: {watch('defaultSettings.stability')}
                    </Label>
                    <input
                      id="stability"
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      {...register('defaultSettings.stability')}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Higher values make the voice more stable but less expressive
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="similarityBoost">
                      Similarity Boost: {watch('defaultSettings.similarityBoost')}
                    </Label>
                    <input
                      id="similarityBoost"
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      {...register('defaultSettings.similarityBoost')}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Higher values make the voice more similar to the original
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="style">
                      Style: {watch('defaultSettings.style')}
                    </Label>
                    <input
                      id="style"
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      {...register('defaultSettings.style')}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Higher values add more style and emotion to the voice
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="useSpeakerBoost"
                      {...register('defaultSettings.useSpeakerBoost')}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="useSpeakerBoost">Use Speaker Boost</Label>
                  </div>
                </CardContent>
              </Card>

              {/* Test Connection */}
              <Card>
                <CardHeader>
                  <CardTitle>Connection Test</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">
                        Test your Eleven Labs API connection.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={testConnection}
                      disabled={isTesting}
                      className="flex items-center space-x-2"
                    >
                      <TestTube className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
                      <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
                    </Button>
                  </div>

                  {testResult && (
                    <div className={`mt-4 p-3 rounded-md ${
                      testResult.success 
                        ? 'bg-green-50 border border-green-200 text-green-800'
                        : 'bg-red-50 border border-red-200 text-red-800'
                    }`}>
                      <div className="flex items-center">
                        {testResult.success ? (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-2" />
                        )}
                        <span className="text-sm font-medium">
                          {testResult.success ? 'Connection Successful' : 'Connection Failed'}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{testResult.message}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center space-x-2"
                >
                  <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
                  <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
                </Button>
              </div>
            </form>
          </div>

          {/* Voice Library */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Volume2 className="w-5 h-5 mr-2" />
                  Available Voices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {voices.map((voice) => (
                    <div
                      key={voice.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedVoice?.id === voice.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleVoiceSelect(voice)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{voice.name}</div>
                          <div className="text-sm text-gray-600">{voice.category}</div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            testVoice(voice.id);
                          }}
                          disabled={isPlayingPreview}
                          className="flex items-center space-x-1"
                        >
                          <Play className={`w-3 h-3 ${isPlayingPreview ? 'animate-spin' : ''}`} />
                          <span>Test</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 