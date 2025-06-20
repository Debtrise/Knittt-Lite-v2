'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { useToast } from '@/app/components/ui/use-toast';
import { Loader2, Volume2, Settings } from 'lucide-react';
import { recordingsService } from '@/app/services/recordingsService';
import type { Voice, VoiceSettingsInfo } from '@/app/types/recordings';

export default function VoiceSettingsPage() {
  const { toast } = useToast();
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [voiceSettings, setVoiceSettings] = useState({
    stability: 0.5,
    similarity_boost: 0.8,
    style: 0.0,
    use_speaker_boost: true
  });
  const [settingsInfo, setSettingsInfo] = useState<VoiceSettingsInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [voicesResponse, settingsInfoResponse] = await Promise.all([
        recordingsService.getAvailableVoices(),
        recordingsService.getVoiceSettingsInfo()
      ]);
      setVoices(voicesResponse.voices);
      setSettingsInfo(settingsInfoResponse);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load voice settings',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!selectedVoice) return;

    try {
      setIsSaving(true);
      await recordingsService.updateVoiceSettings(selectedVoice, voiceSettings);
      toast({
        title: 'Success',
        description: 'Voice settings updated successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update voice settings',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Voice Settings</h1>
        <Button
          onClick={handleSaveSettings}
          disabled={isSaving || !selectedVoice}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Settings className="w-4 h-4 mr-2" />
          )}
          Save Settings
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Voice Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Select Voice</Label>
            <Select
              value={selectedVoice}
              onValueChange={setSelectedVoice}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a voice" />
              </SelectTrigger>
              <SelectContent>
                {voices.map((voice) => (
                  <SelectItem key={voice.voice_id} value={voice.voice_id}>
                    {voice.name} - {voice.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {settingsInfo && (
            <>
              <div>
                <Label>
                  Stability ({voiceSettings.stability})
                  <span className="text-sm text-gray-500 ml-2">
                    {settingsInfo.settings.stability.description}
                  </span>
                </Label>
                <input
                  type="range"
                  min={settingsInfo.settings.stability.range[0]}
                  max={settingsInfo.settings.stability.range[1]}
                  step="0.1"
                  value={voiceSettings.stability}
                  onChange={(e) => setVoiceSettings({
                    ...voiceSettings,
                    stability: parseFloat(e.target.value)
                  })}
                  className="w-full"
                />
              </div>

              <div>
                <Label>
                  Similarity Boost ({voiceSettings.similarity_boost})
                  <span className="text-sm text-gray-500 ml-2">
                    {settingsInfo.settings.similarity_boost.description}
                  </span>
                </Label>
                <input
                  type="range"
                  min={settingsInfo.settings.similarity_boost.range[0]}
                  max={settingsInfo.settings.similarity_boost.range[1]}
                  step="0.1"
                  value={voiceSettings.similarity_boost}
                  onChange={(e) => setVoiceSettings({
                    ...voiceSettings,
                    similarity_boost: parseFloat(e.target.value)
                  })}
                  className="w-full"
                />
              </div>

              <div>
                <Label>
                  Style ({voiceSettings.style})
                  <span className="text-sm text-gray-500 ml-2">
                    {settingsInfo.settings.style.description}
                  </span>
                </Label>
                <input
                  type="range"
                  min={settingsInfo.settings.style.range[0]}
                  max={settingsInfo.settings.style.range[1]}
                  step="0.1"
                  value={voiceSettings.style}
                  onChange={(e) => setVoiceSettings({
                    ...voiceSettings,
                    style: parseFloat(e.target.value)
                  })}
                  className="w-full"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="speaker_boost"
                  checked={voiceSettings.use_speaker_boost}
                  onChange={(e) => setVoiceSettings({
                    ...voiceSettings,
                    use_speaker_boost: e.target.checked
                  })}
                />
                <Label htmlFor="speaker_boost">
                  Use Speaker Boost
                  <span className="text-sm text-gray-500 ml-2">
                    {settingsInfo.settings.use_speaker_boost.description}
                  </span>
                </Label>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 