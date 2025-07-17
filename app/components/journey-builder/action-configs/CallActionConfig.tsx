import React, { useState, useEffect } from 'react';
import { Input } from '@/app/components/ui/Input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Checkbox } from '@/app/components/ui/checkbox';
import api from '@/app/lib/api';

interface CallActionConfigProps {
  config: Record<string, any>;
  onChange: (config: Record<string, any>) => void;
}

const CallActionConfig: React.FC<CallActionConfigProps> = ({ config, onChange }) => {
  const [availableContexts, setAvailableContexts] = useState<any[]>([]);
  const [loadingContexts, setLoadingContexts] = useState(false);

  // Fetch available contexts
  useEffect(() => {
    const fetchContexts = async () => {
      try {
        setLoadingContexts(true);
        const response = await api.tenants.getContexts();
        
        if (response.data?.contexts) {
          const contextObjects = response.data.contexts.map((name: string, index: number) => ({
            id: `context-${index}`,
            name,
            description: `AMI Context: ${name}`
          }));
          setAvailableContexts(contextObjects);
        } else {
          setAvailableContexts([]);
        }
      } catch (error) {
        console.error('Error fetching contexts:', error);
        setAvailableContexts([]);
      } finally {
        setLoadingContexts(false);
      }
    };

    fetchContexts();
  }, []);

  const handleChange = (field: string, value: any) => {
    onChange({
      ...config,
      [field]: value
    });
  };

  return (
    <div className="space-y-4">
      {/* Primary Configuration */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-3">Call Configuration</h4>
        
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="transferNumber">Transfer Number</Label>
            <Input
              id="transferNumber"
              value={config.transferNumber || ''}
              onChange={(e) => handleChange('transferNumber', e.target.value)}
              placeholder="e.g., 18005551234"
            />
          </div>

          <div>
            <Label htmlFor="dialerContext">Dialer Context</Label>
            <div className="space-y-2">
              <Select
                value={config.dialerContext || 'none'}
                onValueChange={(value) => handleChange('dialerContext', value === 'none' ? '' : value)}
                disabled={loadingContexts}
              >
                <SelectTrigger id="dialerContext">
                  <SelectValue placeholder={loadingContexts ? "Loading contexts..." : "Select context"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {availableContexts.map((context) => (
                    <SelectItem key={context.id} value={context.name}>
                      {context.name} {context.description && `- ${context.description}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Input
                placeholder="Or enter context manually (e.g., BDS_Prime_Dialer)"
                value={config.dialerContext || ''}
                onChange={(e) => handleChange('dialerContext', e.target.value)}
                className="text-sm"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="ingroup">Ingroup</Label>
            <Input
              id="ingroup"
              value={config.ingroup || 'SALES'}
              onChange={(e) => handleChange('ingroup', e.target.value)}
              placeholder="e.g., SALES"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="skipAgentCheck"
                checked={config.skipAgentCheck === true}
                onCheckedChange={(checked) => handleChange('skipAgentCheck', checked)}
              />
              <Label htmlFor="skipAgentCheck">Skip Agent Check</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="amd"
                checked={config.amd === true}
                onCheckedChange={(checked) => handleChange('amd', checked)}
              />
              <Label htmlFor="amd">AMD (Answering Machine Detection)</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="playPosition"
                checked={config.playPosition === true}
                onCheckedChange={(checked) => handleChange('playPosition', checked)}
              />
              <Label htmlFor="playPosition">Play Position</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="skipPositionAnnouncement"
                checked={config.skipPositionAnnouncement === true}
                onCheckedChange={(checked) => handleChange('skipPositionAnnouncement', checked)}
              />
              <Label htmlFor="skipPositionAnnouncement">Skip Position Announcement</Label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallActionConfig; 