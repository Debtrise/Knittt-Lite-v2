'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Switch } from '@/app/components/ui/switch';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/Input';
import { Textarea } from '@/app/components/ui/textarea';
import { 
  Search, 
  Settings, 
  Info, 
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface TracersEnrichmentConfig {
  enabled: boolean;
  autoEnrich: boolean;
  delayMinutes: number;
  minimumConfidence: number;
  retryOnFailure: boolean;
  maxRetries: number;
  updateLeadFields: boolean;
  addEnrichmentTags: boolean;
  customTags: string[];
  notifyOnSuccess: boolean;
  notifyOnFailure: boolean;
}

interface TracersEnrichmentActionProps {
  config: TracersEnrichmentConfig;
  onChange: (config: TracersEnrichmentConfig) => void;
  onTest?: () => void;
}

export default function TracersEnrichmentAction({
  config,
  onChange,
  onTest
}: TracersEnrichmentActionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateConfig = (updates: Partial<TracersEnrichmentConfig>) => {
    onChange({ ...config, ...updates });
  };

  const handleCustomTagsChange = (value: string) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    updateConfig({ customTags: tags });
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-600" />
            <span>TracersAPI Lead Enrichment</span>
            <Badge variant={config.enabled ? "default" : "secondary"}>
              {config.enabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Settings className="h-4 w-4" />
            </Button>
            {onTest && (
              <Button variant="outline" size="sm" onClick={onTest}>
                Test
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Enable/Disable */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label>Enable TracersAPI Enrichment</Label>
            <p className="text-sm text-gray-500">
              Automatically enrich leads with additional data from TracersAPI
            </p>
          </div>
          <Switch
            checked={config.enabled}
            onCheckedChange={(enabled) => updateConfig({ enabled })}
          />
        </div>

        {config.enabled && (
          <>
            {/* Auto Enrichment */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Auto-enrich new leads</Label>
                <p className="text-sm text-gray-500">
                  Automatically enrich leads when they are created via webhook
                </p>
              </div>
              <Switch
                checked={config.autoEnrich}
                onCheckedChange={(autoEnrich) => updateConfig({ autoEnrich })}
              />
            </div>

            {/* Delay Settings */}
            {config.autoEnrich && (
              <div className="space-y-2">
                <Label htmlFor="delay">Enrichment Delay (minutes)</Label>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <Input
                    id="delay"
                    type="number"
                    min="0"
                    max="60"
                    value={config.delayMinutes}
                    onChange={(e) => updateConfig({ delayMinutes: parseInt(e.target.value) || 0 })}
                    className="w-24"
                  />
                  <span className="text-sm text-gray-500">
                    Wait before enriching (0 = immediate)
                  </span>
                </div>
              </div>
            )}

            {/* Advanced Settings */}
            {isExpanded && (
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium">Advanced Settings</h4>

                {/* Minimum Confidence */}
                <div className="space-y-2">
                  <Label htmlFor="confidence">Minimum Confidence Threshold</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="confidence"
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={config.minimumConfidence}
                      onChange={(e) => updateConfig({ minimumConfidence: parseFloat(e.target.value) || 0 })}
                      className="w-24"
                    />
                    <span className="text-sm text-gray-500">
                      Only use enrichment data with confidence above this threshold
                    </span>
                  </div>
                </div>

                {/* Retry Settings */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Retry on failure</Label>
                      <p className="text-sm text-gray-500">Retry enrichment if it fails</p>
                    </div>
                    <Switch
                      checked={config.retryOnFailure}
                      onCheckedChange={(retryOnFailure) => updateConfig({ retryOnFailure })}
                    />
                  </div>

                  {config.retryOnFailure && (
                    <div className="ml-4 space-y-2">
                      <Label htmlFor="maxRetries">Maximum retries</Label>
                      <Input
                        id="maxRetries"
                        type="number"
                        min="1"
                        max="5"
                        value={config.maxRetries}
                        onChange={(e) => updateConfig({ maxRetries: parseInt(e.target.value) || 1 })}
                        className="w-24"
                      />
                    </div>
                  )}
                </div>

                {/* Lead Update Settings */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Update lead fields</Label>
                      <p className="text-sm text-gray-500">
                        Update lead record with enriched data (emails, addresses, etc.)
                      </p>
                    </div>
                    <Switch
                      checked={config.updateLeadFields}
                      onCheckedChange={(updateLeadFields) => updateConfig({ updateLeadFields })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Add enrichment tags</Label>
                      <p className="text-sm text-gray-500">
                        Tag leads that have been enriched
                      </p>
                    </div>
                    <Switch
                      checked={config.addEnrichmentTags}
                      onCheckedChange={(addEnrichmentTags) => updateConfig({ addEnrichmentTags })}
                    />
                  </div>

                  {config.addEnrichmentTags && (
                    <div className="ml-4 space-y-2">
                      <Label htmlFor="customTags">Custom enrichment tags</Label>
                      <Input
                        id="customTags"
                        placeholder="enriched, tracers-data, verified"
                        value={config.customTags.join(', ')}
                        onChange={(e) => handleCustomTagsChange(e.target.value)}
                      />
                      <p className="text-xs text-gray-500">
                        Comma-separated list of tags to add to enriched leads
                      </p>
                    </div>
                  )}
                </div>

                {/* Notification Settings */}
                <div className="space-y-3">
                  <h5 className="font-medium text-sm">Notifications</h5>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Notify on success</Label>
                      <p className="text-sm text-gray-500">
                        Send notification when enrichment succeeds
                      </p>
                    </div>
                    <Switch
                      checked={config.notifyOnSuccess}
                      onCheckedChange={(notifyOnSuccess) => updateConfig({ notifyOnSuccess })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Notify on failure</Label>
                      <p className="text-sm text-gray-500">
                        Send notification when enrichment fails
                      </p>
                    </div>
                    <Switch
                      checked={config.notifyOnFailure}
                      onCheckedChange={(notifyOnFailure) => updateConfig({ notifyOnFailure })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Cost Warning */}
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <DollarSign className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Cost Consideration</p>
                <p className="text-yellow-700">
                  Each TracersAPI enrichment request incurs a cost. Monitor your usage on the TracersAPI dashboard.
                </p>
              </div>
            </div>

            {/* Configuration Summary */}
            <div className="bg-gray-50 p-3 rounded-md">
              <h5 className="font-medium text-sm mb-2">Configuration Summary</h5>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  {config.autoEnrich ? (
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-3 w-3 text-yellow-600" />
                  )}
                  <span>
                    {config.autoEnrich 
                      ? `Auto-enrich enabled (${config.delayMinutes}min delay)`
                      : 'Manual enrichment only'
                    }
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Info className="h-3 w-3 text-blue-600" />
                  <span>Minimum confidence: {(config.minimumConfidence * 100).toFixed(0)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Info className="h-3 w-3 text-blue-600" />
                  <span>
                    {config.updateLeadFields ? 'Will update lead fields' : 'Read-only enrichment'}
                  </span>
                </div>
                {config.customTags.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Info className="h-3 w-3 text-blue-600" />
                    <span>Tags: {config.customTags.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 