import React, { useState, useEffect } from 'react';
import { Input } from '@/app/components/ui/Input';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Checkbox } from '@/app/components/ui/checkbox';
import api from '@/app/lib/api';

interface CallActionConfigProps {
  config: Record<string, any>;
  onChange: (config: Record<string, any>) => void;
}

const CallActionConfig: React.FC<CallActionConfigProps> = ({ config, onChange }) => {
  const [hasContext, setHasContext] = useState(false);
  const [availableContexts, setAvailableContexts] = useState<any[]>([]);
  const [loadingContexts, setLoadingContexts] = useState(false);

  useEffect(() => {
    setHasContext(!!config.context);
  }, [config.context]);

  // Fetch available contexts
  useEffect(() => {
    const fetchContexts = async () => {
      try {
        setLoadingContexts(true);
        const response = await api.tenants.getContexts();
        
        // API returns { contexts: string[], amiConfig: {...} } directly
        if (response.data?.contexts) {
          // Convert string array to objects for UI compatibility
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
    if (field === 'context') {
      setHasContext(!!value);
    }
    onChange({
      ...config,
      [field]: value
    });
  };

  return (
    <div className="space-y-4">
      {/* Primary Configuration */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-3">Primary Call Configuration</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="context">Context</Label>
            <div className="space-y-2">
              <Select
                value={config.context || 'none'}
                onValueChange={(value) => handleChange('context', value === 'none' ? '' : value)}
                disabled={loadingContexts}
              >
                <SelectTrigger id="context">
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
              
              {/* Allow manual input as fallback */}
              <Input
                placeholder="Or enter context manually (e.g., BDS_Prime_Dialer)"
                value={config.context || ''}
                onChange={(e) => handleChange('context', e.target.value)}
                className="text-sm"
              />
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Context overrides most other settings when provided. Select from dropdown or enter manually.
            </p>
          </div>

          <div>
            <Label htmlFor="ingroup">Ingroup</Label>
            <Input
              id="ingroup"
              value={config.ingroup || 'SALES'}
              onChange={(e) => handleChange('ingroup', e.target.value)}
              placeholder="e.g., SALES, SALES_FOLLOWUP"
            />
          </div>
        </div>
      </div>

      {/* Transfer Configuration */}
      <div className="bg-green-50 border border-green-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-green-900 mb-3">Transfer Configuration</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="transferNumber">Transfer Number</Label>
            <Input
              id="transferNumber"
              value={config.transferNumber || ''}
              onChange={(e) => handleChange('transferNumber', e.target.value)}
              placeholder="e.g., 8005551234"
            />
          </div>

          <div>
            <Label htmlFor="transferGroup">Transfer Group</Label>
            <Select
              value={config.transferGroup || 'none'}
              onValueChange={(value) => handleChange('transferGroup', value === 'none' ? '' : value)}
            >
              <SelectTrigger id="transferGroup">
                <SelectValue placeholder="Select transfer group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {/* Transfer groups will be populated from props */}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Call Settings */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Call Settings</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="did">DID</Label>
            <Input
              id="did"
              value={config.did || ''}
              onChange={(e) => handleChange('did', e.target.value)}
              placeholder="e.g., 8005554321"
              disabled={hasContext}
            />
          </div>

          <div>
            <Label htmlFor="callerId">Caller ID</Label>
            <Input
              id="callerId"
              value={config.callerId || ''}
              onChange={(e) => handleChange('callerId', e.target.value)}
              placeholder="Enter caller ID to use"
              disabled={hasContext}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="amd"
              checked={config.amd !== false}
              onCheckedChange={(checked) => handleChange('amd', checked)}
              disabled={hasContext}
            />
            <Label htmlFor="amd">AMD (Answering Machine Detection)</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="respectBusinessHours"
              checked={config.respectBusinessHours !== false}
              onCheckedChange={(checked) => handleChange('respectBusinessHours', checked)}
            />
            <Label htmlFor="respectBusinessHours">Respect Business Hours</Label>
          </div>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-yellow-900 mb-3">Advanced Settings</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="maxAttempts">Maximum Attempts</Label>
            <Input
              id="maxAttempts"
              type="number"
              value={config.maxAttempts || 3}
              onChange={(e) => handleChange('maxAttempts', parseInt(e.target.value, 10))}
              min={1}
              max={10}
              disabled={hasContext}
            />
          </div>

          <div>
            <Label htmlFor="fallbackDID">Fallback DID</Label>
            <Input
              id="fallbackDID"
              value={config.fallbackDID || ''}
              onChange={(e) => handleChange('fallbackDID', e.target.value)}
              placeholder="Backup DID if primary fails"
              disabled={hasContext}
            />
          </div>
        </div>

        <div className="mt-4">
          <Label htmlFor="script">Call Script</Label>
          <Textarea
            id="script"
            value={config.script || ''}
            onChange={(e) => handleChange('script', e.target.value)}
            placeholder="Enter call script or notes"
            rows={3}
            disabled={hasContext}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="recordCall"
              checked={config.recordCall !== false}
              onCheckedChange={(checked) => handleChange('recordCall', checked)}
              disabled={hasContext}
            />
            <Label htmlFor="recordCall">Record Call</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="useLocalDID"
              checked={config.useLocalDID !== false}
              onCheckedChange={(checked) => handleChange('useLocalDID', checked)}
              disabled={hasContext}
            />
            <Label htmlFor="useLocalDID">Use Local DID</Label>
          </div>
        </div>
      </div>

      {/* Legacy Configuration */}
      <details className="bg-gray-100 border border-gray-300 rounded-md p-4">
        <summary className="text-sm font-medium text-gray-700 cursor-pointer">
          Legacy Configuration (Deprecated)
        </summary>
        <div className="mt-4">
          <Label htmlFor="dialerContext">Dialer Context (JSON)</Label>
          <Textarea
            id="dialerContext"
            value={config.dialerContext || ''}
            onChange={(e) => handleChange('dialerContext', e.target.value)}
            placeholder="Enter legacy dialer context in JSON format"
            rows={4}
            className="font-mono text-sm"
          />
          <p className="text-sm text-gray-500 mt-1">
            Legacy field - use individual fields above instead for better configuration management.
          </p>
        </div>
      </details>

      {hasContext && (
        <div className="bg-blue-100 border border-blue-300 rounded-md p-3">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> When Context is provided, it will override most other call settings. 
            Only Transfer settings, Ingroup, and Business Hours settings will still apply.
          </p>
        </div>
      )}
    </div>
  );
};

export default CallActionConfig; 