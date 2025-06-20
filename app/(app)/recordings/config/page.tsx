'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Check, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/Input';
import { Select } from '@/app/components/ui/select';
import { Badge } from '@/app/components/ui/badge';
import { Tabs } from '@/app/components/ui/tabs';
import { recordingsService } from '@/app/services/recordingsService';
import { ElevenLabsConfig, Voice, FreePBXStatus } from '@/app/types/recordings';

export default function RecordingsConfigPage() {
  // ElevenLabs Config
  const [elevenLabsConfig, setElevenLabsConfig] = useState<ElevenLabsConfig | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [defaultVoiceId, setDefaultVoiceId] = useState('');
  const [monthlyLimit, setMonthlyLimit] = useState('10000');
  const [stability, setStability] = useState('0.5');
  const [similarityBoost, setSimilarityBoost] = useState('0.8');
  const [voices, setVoices] = useState<Voice[]>([]);
  
  // FreePBX Config
  const [freePBXStatus, setFreePBXStatus] = useState<FreePBXStatus | null>(null);
  const [freePBXRecordings, setFreePBXRecordings] = useState<any[]>([]);
  
  // UI State
  const [activeTab, setActiveTab] = useState('elevenlabs');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchElevenLabsConfig();
    fetchFreePBXStatus();
  }, []);

  const fetchElevenLabsConfig = async () => {
    try {
      setLoading(true);
      const config = await recordingsService.getElevenLabsConfig();
      setElevenLabsConfig(config);
      setApiKey(config.apiKey ? '********' : '');
      setDefaultVoiceId(config.defaultVoiceId || '');
      setMonthlyLimit(config.monthlyCharacterLimit?.toString() || '10000');
      setStability(config.voiceSettings?.stability?.toString() || '0.5');
      setSimilarityBoost(config.voiceSettings?.similarity_boost?.toString() || '0.8');
      
      // Fetch available voices
      const voicesResponse = await recordingsService.getAvailableVoices();
      setVoices(voicesResponse.voices);
    } catch (err: any) {
      console.error('Error fetching ElevenLabs config:', err);
      setError(err.message || 'Failed to fetch ElevenLabs configuration');
    } finally {
      setLoading(false);
    }
  };

  const fetchFreePBXStatus = async () => {
    try {
      setLoading(true);
      const status = await recordingsService.getFreePBXStatus();
      setFreePBXStatus(status);
      
      // Fetch FreePBX recordings if server is online
      if (status.online) {
        const recordings = await recordingsService.listFreePBXRecordings();
        setFreePBXRecordings(recordings.recordings || []);
      }
    } catch (err: any) {
      console.error('Error fetching FreePBX status:', err);
      setFreePBXStatus({
        online: false,
        serverUrl: 'Unknown',
        serverIp: 'Unknown',
        lastChecked: new Date().toISOString(),
        responseTime: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveElevenLabsConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      const configData = {
        apiKey: apiKey === '********' ? undefined : apiKey, // Don't send if unchanged
        defaultVoiceId,
        monthlyCharacterLimit: parseInt(monthlyLimit),
        voiceSettings: {
          stability: parseFloat(stability),
          similarity_boost: parseFloat(similarityBoost)
        }
      };
      
      await recordingsService.configureElevenLabs(configData);
      setSuccess('ElevenLabs configuration saved successfully');
      
      // Refresh config
      fetchElevenLabsConfig();
    } catch (err: any) {
      console.error('Error saving ElevenLabs config:', err);
      setError(err.message || 'Failed to save ElevenLabs configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleTestElevenLabsConnection = async () => {
    try {
      setTesting(true);
      setError(null);
      setSuccess(null);
      
      const testApiKey = apiKey === '********' ? undefined : apiKey;
      const result = await recordingsService.testElevenLabsConnection(testApiKey);
      
      if (result.success) {
        setSuccess(`ElevenLabs connection successful. Found ${result.voiceCount} voices.`);
      } else {
        setError('ElevenLabs connection test failed');
      }
    } catch (err: any) {
      console.error('Error testing ElevenLabs connection:', err);
      setError(err.message || 'Failed to test ElevenLabs connection');
    } finally {
      setTesting(false);
    }
  };

  const handleTestFreePBXConnection = async () => {
    try {
      setTesting(true);
      setError(null);
      setSuccess(null);
      
      const result = await recordingsService.testFreePBXConnection();
      
      if (result.success) {
        setSuccess(`FreePBX connection successful. Server: ${result.serverUrl}`);
      } else {
        setError('FreePBX connection test failed');
      }
      
      // Refresh status
      fetchFreePBXStatus();
    } catch (err: any) {
      console.error('Error testing FreePBX connection:', err);
      setError(err.message || 'Failed to test FreePBX connection');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Settings className="h-6 w-6 mr-2" />
        <h1 className="text-2xl font-bold">Recordings Configuration</h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex items-center">
          <Check className="h-5 w-5 mr-2" />
          {success}
        </div>
      )}

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('elevenlabs')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'elevenlabs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ElevenLabs Configuration
            </button>
            <button
              onClick={() => setActiveTab('freepbx')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'freepbx'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              FreePBX Integration
            </button>
          </nav>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {activeTab === 'elevenlabs' && (
            <div>
              <Card className="mb-6">
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4">ElevenLabs Status</h2>
                  
                  {elevenLabsConfig ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">API Key Status</p>
                        <p className="mt-1">
                          {elevenLabsConfig.apiKey ? (
                            <Badge variant="success" className="flex items-center w-fit">
                              <Check className="h-4 w-4 mr-1" />
                              Configured
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="flex items-center w-fit">
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              Not Configured
                            </Badge>
                          )}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-500">Active Status</p>
                        <p className="mt-1">
                          {elevenLabsConfig.isActive ? (
                            <Badge variant="success" className="flex items-center w-fit">
                              <Check className="h-4 w-4 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="flex items-center w-fit">
                              Inactive
                            </Badge>
                          )}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-500">Character Usage</p>
                        <p className="mt-1">
                          {elevenLabsConfig.charactersUsedThisMonth !== undefined && elevenLabsConfig.monthlyCharacterLimit ? (
                            <span>
                              {elevenLabsConfig.charactersUsedThisMonth} / {elevenLabsConfig.monthlyCharacterLimit} characters
                              ({((elevenLabsConfig.charactersUsedThisMonth / elevenLabsConfig.monthlyCharacterLimit) * 100).toFixed(1)}%)
                            </span>
                          ) : (
                            <span>Unknown</span>
                          )}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-500">Last Reset Date</p>
                        <p className="mt-1">
                          {elevenLabsConfig.lastResetDate ? (
                            new Date(elevenLabsConfig.lastResetDate).toLocaleDateString()
                          ) : (
                            'Unknown'
                          )}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">No configuration found</p>
                  )}
                </div>
              </Card>

              <Card>
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4">ElevenLabs Configuration</h2>
                  
                  <form onSubmit={handleSaveElevenLabsConfig}>
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
                          API Key
                        </label>
                        <Input
                          id="apiKey"
                          type="password"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="Enter your ElevenLabs API key"
                          className="mt-1"
                        />
                        <p className="mt-1 text-sm text-gray-500">
                          Get your API key from the <a href="https://beta.elevenlabs.io/account" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">ElevenLabs dashboard</a>
                        </p>
                      </div>
                      
                      <div>
                        <label htmlFor="defaultVoice" className="block text-sm font-medium text-gray-700">
                          Default Voice
                        </label>
                        <Select
                          id="defaultVoice"
                          value={defaultVoiceId}
                          onChange={(e) => setDefaultVoiceId(e.target.value)}
                          className="mt-1"
                        >
                          <option value="">Select a default voice</option>
                          {voices.map((voice) => (
                            <option key={voice.voiceId} value={voice.voiceId}>
                              {voice.name} ({voice.category})
                            </option>
                          ))}
                        </Select>
                      </div>
                      
                      <div>
                        <label htmlFor="monthlyLimit" className="block text-sm font-medium text-gray-700">
                          Monthly Character Limit
                        </label>
                        <Input
                          id="monthlyLimit"
                          type="number"
                          value={monthlyLimit}
                          onChange={(e) => setMonthlyLimit(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="stability" className="block text-sm font-medium text-gray-700">
                            Stability ({stability})
                          </label>
                          <input
                            id="stability"
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={stability}
                            onChange={(e) => setStability(e.target.value)}
                            className="w-full mt-1"
                          />
                          <p className="mt-1 text-sm text-gray-500">
                            Lower values result in more dynamic and spontaneous speech
                          </p>
                        </div>
                        
                        <div>
                          <label htmlFor="similarityBoost" className="block text-sm font-medium text-gray-700">
                            Similarity Boost ({similarityBoost})
                          </label>
                          <input
                            id="similarityBoost"
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={similarityBoost}
                            onChange={(e) => setSimilarityBoost(e.target.value)}
                            className="w-full mt-1"
                          />
                          <p className="mt-1 text-sm text-gray-500">
                            Higher values result in more similar voice to the original
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleTestElevenLabsConnection}
                          disabled={testing || saving}
                        >
                          {testing ? (
                            <>
                              <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                              Testing...
                            </>
                          ) : (
                            'Test Connection'
                          )}
                        </Button>
                        
                        <Button
                          type="submit"
                          disabled={testing || saving}
                        >
                          {saving ? (
                            <>
                              <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                              Saving...
                            </>
                          ) : (
                            'Save Configuration'
                          )}
                        </Button>
                      </div>
                    </div>
                  </form>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'freepbx' && (
            <div>
              <Card className="mb-6">
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4">FreePBX Status</h2>
                  
                  {freePBXStatus ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Connection Status</p>
                        <p className="mt-1">
                          {freePBXStatus.online ? (
                            <Badge variant="success" className="flex items-center w-fit">
                              <Check className="h-4 w-4 mr-1" />
                              Online
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="flex items-center w-fit">
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              Offline
                            </Badge>
                          )}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-500">Server URL</p>
                        <p className="mt-1">{freePBXStatus.serverUrl}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-500">Server IP</p>
                        <p className="mt-1">{freePBXStatus.serverIp}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-500">Response Time</p>
                        <p className="mt-1">{freePBXStatus.responseTime}ms</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-500">Last Checked</p>
                        <p className="mt-1">
                          {new Date(freePBXStatus.lastChecked).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">No FreePBX connection information available</p>
                  )}
                  
                  <div className="mt-4">
                    <Button
                      onClick={handleTestFreePBXConnection}
                      disabled={testing}
                    >
                      {testing ? (
                        <>
                          <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                          Testing...
                        </>
                      ) : (
                        'Test Connection'
                      )}
                    </Button>
                  </div>
                </div>
              </Card>

              {freePBXStatus?.online && (
                <Card>
                  <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">FreePBX Recordings</h2>
                    
                    {freePBXRecordings.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Name
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Filename
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Duration
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                FreePBX ID
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {freePBXRecordings.map((recording) => (
                              <tr key={recording.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {recording.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {recording.filename}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {recording.duration ? `${recording.duration}s` : 'Unknown'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {recording.freepbxId}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-500">No FreePBX recordings found</p>
                    )}
                  </div>
                </Card>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
} 