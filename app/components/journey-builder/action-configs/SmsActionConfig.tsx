import React from 'react';
import { Input } from '@/app/components/ui/Input';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { Checkbox } from '@/app/components/ui/checkbox';

interface SmsActionConfigProps {
  config: Record<string, any>;
  onChange: (config: Record<string, any>) => void;
}

const SmsActionConfig: React.FC<SmsActionConfigProps> = ({ config, onChange }) => {
  const handleChange = (field: string, value: any) => {
    onChange({
      ...config,
      [field]: value
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="fromNumber">From Number</Label>
        <Input
          id="fromNumber"
          value={config.fromNumber || ''}
          onChange={(e) => handleChange('fromNumber', e.target.value)}
          placeholder="Enter sender phone number"
        />
      </div>
      
      <div>
        <Label htmlFor="messageTemplate">Message Template</Label>
        <Textarea
          id="messageTemplate"
          value={config.messageTemplate || ''}
          onChange={(e) => handleChange('messageTemplate', e.target.value)}
          placeholder="Enter SMS message template. Use {{variable}} for personalization."
          rows={4}
        />
        <p className="text-xs text-gray-500 mt-1">
          Available variables: {{firstName}}, {{lastName}}, {{phone}}, {{email}}
        </p>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="trackClicks"
          checked={config.trackClicks || false}
          onCheckedChange={(checked) => handleChange('trackClicks', !!checked)}
        />
        <Label htmlFor="trackClicks">Track link clicks</Label>
      </div>
      
      <div>
        <Label htmlFor="maxAttempts">Maximum Attempts</Label>
        <Input
          id="maxAttempts"
          type="number"
          value={config.maxAttempts || 1}
          onChange={(e) => handleChange('maxAttempts', parseInt(e.target.value, 10))}
          min={1}
          max={5}
        />
      </div>
    </div>
  );
};

export default SmsActionConfig; 