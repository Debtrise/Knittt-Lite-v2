import React from 'react';
import { Input } from '@/app/components/ui/Input';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';

interface CallActionConfigProps {
  config: Record<string, any>;
  onChange: (config: Record<string, any>) => void;
}

const CallActionConfig: React.FC<CallActionConfigProps> = ({ config, onChange }) => {
  const handleChange = (field: string, value: any) => {
    onChange({
      ...config,
      [field]: value
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="phoneNumber">Phone Number</Label>
        <Input
          id="phoneNumber"
          value={config.phoneNumber || ''}
          onChange={(e) => handleChange('phoneNumber', e.target.value)}
          placeholder="Enter phone number to call"
        />
      </div>
      
      <div>
        <Label htmlFor="callerId">Caller ID</Label>
        <Input
          id="callerId"
          value={config.callerId || ''}
          onChange={(e) => handleChange('callerId', e.target.value)}
          placeholder="Enter caller ID to use"
        />
      </div>
      
      <div>
        <Label htmlFor="script">Call Script</Label>
        <Textarea
          id="script"
          value={config.script || ''}
          onChange={(e) => handleChange('script', e.target.value)}
          placeholder="Enter call script or notes"
          rows={4}
        />
      </div>
      
      <div>
        <Label htmlFor="recordCall">Record Call</Label>
        <Select
          value={config.recordCall === undefined ? 'yes' : (config.recordCall ? 'yes' : 'no')}
          onValueChange={(value) => handleChange('recordCall', value === 'yes')}
        >
          <SelectTrigger id="recordCall">
            <SelectValue placeholder="Record call?" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="yes">Yes</SelectItem>
            <SelectItem value="no">No</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="maxAttempts">Maximum Attempts</Label>
        <Input
          id="maxAttempts"
          type="number"
          value={config.maxAttempts || 1}
          onChange={(e) => handleChange('maxAttempts', parseInt(e.target.value, 10))}
          min={1}
          max={10}
        />
      </div>
    </div>
  );
};

export default CallActionConfig; 