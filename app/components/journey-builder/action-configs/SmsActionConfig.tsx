import React, { useState, useEffect } from 'react';
import { Input } from '@/app/components/ui/Input';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Badge } from '@/app/components/ui/badge';
import toast from 'react-hot-toast';
import api from '@/app/lib/api';
import { SmsProvidersResponse } from '@/types/sms';

interface SmsActionConfigProps {
  config: Record<string, any>;
  onChange: (config: Record<string, any>) => void;
  actionType?: string; // New prop to determine which provider to lock to
}

const SmsActionConfig: React.FC<SmsActionConfigProps> = ({ config, onChange, actionType }) => {
  const [providers, setProviders] = useState<SmsProvidersResponse | null>(null);
  const [loadingProviders, setLoadingProviders] = useState(false);

  useEffect(() => {
    fetchProviders();
  }, []);

  // Auto-set provider based on action type
  useEffect(() => {
    if (actionType === 'sms_twilio' && config.provider !== 'twilio') {
      handleChange('provider', 'twilio');
    } else if (actionType === 'sms_meera' && config.provider !== 'meera') {
      handleChange('provider', 'meera');
    }
  }, [actionType, config.provider]);

  const fetchProviders = async () => {
    try {
      setLoadingProviders(true);
      const response = await api.smsProviders.getProviders();
      setProviders(response.data);
    } catch (error) {
      console.error('Error fetching SMS providers:', error);
      setProviders(null);
    } finally {
      setLoadingProviders(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    onChange({
      ...config,
      [field]: value
    });
  };

  const smsMode = config.mode || 'single';
  const isProviderLocked = actionType === 'sms_twilio' || actionType === 'sms_meera';
  const lockedProvider = actionType === 'sms_twilio' ? 'twilio' : actionType === 'sms_meera' ? 'meera' : null;

  return (
    <div className="space-y-4">
      {/* Provider Status Display */}
      {providers && (
        <div className="p-3 bg-gray-50 rounded-md border">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-medium">SMS Provider Status</Label>
            {isProviderLocked ? (
              <Badge variant="outline" className="bg-blue-100 text-blue-700">
                Locked: {lockedProvider?.charAt(0).toUpperCase() + lockedProvider?.slice(1)}
              </Badge>
            ) : (
              <Badge variant="outline">
                Default: {providers.defaultProvider}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Badge 
              variant={providers.providers.twilio.configured ? "default" : "secondary"}
              className={providers.providers.twilio.configured ? "bg-green-100 text-green-700" : ""}
            >
              Twilio: {providers.providers.twilio.configured ? 'Configured' : 'Not configured'}
            </Badge>
            <Badge 
              variant={providers.providers.meera.configured ? "default" : "secondary"}
              className={providers.providers.meera.configured ? "bg-green-100 text-green-700" : ""}
            >
              Meera: {providers.providers.meera.configured ? 'Configured' : 'Not configured'}
            </Badge>
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="smsMode">SMS Mode</Label>
        <Select 
          value={smsMode} 
          onValueChange={(value) => handleChange('mode', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select SMS mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="single">Single Message</SelectItem>
            <SelectItem value="template">Template Message</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500 mt-1">
          Single: Send one message | Template: Use SMS template
        </p>
      </div>

      {/* Provider Selection */}
      {!isProviderLocked && (
        <div>
          <Label htmlFor="provider">SMS Provider</Label>
          <Select 
            value={config.provider || ''} 
            onValueChange={(value) => handleChange('provider', value || undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Use default provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Use Default Provider</SelectItem>
              {providers?.providers.twilio.configured && (
                <SelectItem value="twilio">Twilio</SelectItem>
              )}
              {providers?.providers.meera.configured && (
                <SelectItem value="meera">Meera</SelectItem>
              )}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 mt-1">
            Leave empty to use the default provider ({providers?.defaultProvider || 'none'})
          </p>
        </div>
      )}

      <div>
        <Label htmlFor="fromNumber">From Number</Label>
        <Input
          id="fromNumber"
          value={config.fromNumber || config.from || ''}
          onChange={(e) => handleChange('from', e.target.value)}
          placeholder={`Enter sender phone number (optional${lockedProvider ? ` - ${lockedProvider} default` : ''})`}
        />
        <p className="text-xs text-gray-500 mt-1">
          Leave empty to use default number from {lockedProvider || 'provider'} settings
        </p>
      </div>

      {smsMode === 'single' && (
        <div>
          <Label htmlFor="messageTemplate">Message</Label>
          <Textarea
            id="messageTemplate"
            value={config.message || config.messageTemplate || ''}
            onChange={(e) => handleChange('message', e.target.value)}
            placeholder="Enter SMS message. Use {{variable}} for personalization."
            rows={4}
          />
          <p className="text-xs text-gray-500 mt-1">
            Available variables: {{firstName}}, {{lastName}}, {{phone}}, {{email}}, {{name}}
          </p>
        </div>
      )}

      {smsMode === 'template' && (
        <div>
          <Label htmlFor="templateId">SMS Template</Label>
          <Input
            id="templateId"
            type="number"
            value={config.templateId || ''}
            onChange={(e) => handleChange('templateId', parseInt(e.target.value) || '')}
            placeholder="Enter template ID"
          />
          <p className="text-xs text-gray-500 mt-1">
            Template ID from SMS templates section
          </p>
        </div>
      )}

      {/* Provider-specific settings */}
      {lockedProvider === 'twilio' && (
        <div>
          <Label htmlFor="statusCallback">Status Callback URL</Label>
          <Input
            id="statusCallback"
            value={config.statusCallback || ''}
            onChange={(e) => handleChange('statusCallback', e.target.value)}
            placeholder="Custom status callback URL for this message"
          />
          <p className="text-xs text-gray-500 mt-1">
            Override the default Twilio status callback URL
          </p>
        </div>
      )}

      {lockedProvider === 'meera' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="enableUnicode"
              checked={config.enableUnicode !== false}
              onCheckedChange={(checked) => handleChange('enableUnicode', !!checked)}
            />
            <Label htmlFor="enableUnicode">Enable Unicode</Label>
          </div>
          <div>
            <Label htmlFor="maxSegments">Max Segments</Label>
            <Input
              id="maxSegments"
              type="number"
              value={config.maxSegments || 4}
              onChange={(e) => handleChange('maxSegments', parseInt(e.target.value) || 4)}
              min={1}
              max={10}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="scheduleDelay">Schedule Delay (minutes)</Label>
          <Input
            id="scheduleDelay"
            type="number"
            value={config.scheduleDelay || 0}
            onChange={(e) => handleChange('scheduleDelay', parseInt(e.target.value) || 0)}
            min={0}
            max={1440}
          />
        </div>

        <div>
          <Label htmlFor="maxAttempts">Maximum Attempts</Label>
          <Input
            id="maxAttempts"
            type="number"
            value={config.maxAttempts || 1}
            onChange={(e) => handleChange('maxAttempts', parseInt(e.target.value) || 1)}
            min={1}
            max={5}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="trackClicks"
            checked={config.trackClicks !== false}
            onCheckedChange={(checked) => handleChange('trackClicks', !!checked)}
          />
          <Label htmlFor="trackClicks">Track link clicks</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="optOutMessage"
            checked={config.optOutMessage !== false}
            onCheckedChange={(checked) => handleChange('optOutMessage', !!checked)}
          />
          <Label htmlFor="optOutMessage">Include opt-out instructions</Label>
        </div>
      </div>

      {/* Metadata for tracking */}
      <div>
        <Label htmlFor="metadata">Metadata (Optional)</Label>
        <Textarea
          id="metadata"
          value={config.metadata ? JSON.stringify(config.metadata, null, 2) : ''}
          onChange={(e) => {
            try {
              const parsed = e.target.value ? JSON.parse(e.target.value) : {};
              handleChange('metadata', parsed);
            } catch (error) {
              // Invalid JSON, don't update
            }
          }}
          placeholder='{"campaign": "welcome", "source": "journey"}'
          rows={2}
        />
        <p className="text-xs text-gray-500 mt-1">
          JSON metadata for tracking and analytics (optional)
        </p>
      </div>

      {!providers && !loadingProviders && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-sm text-amber-700">
            Unable to load SMS provider settings. Please configure your SMS providers in the settings page.
          </p>
        </div>
      )}

      {isProviderLocked && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-700">
            This SMS node is configured to use {lockedProvider?.charAt(0).toUpperCase() + lockedProvider?.slice(1)} specifically. 
            Use the generic "SMS" node type for auto provider selection.
          </p>
        </div>
      )}
    </div>
  );
};

export default SmsActionConfig; 