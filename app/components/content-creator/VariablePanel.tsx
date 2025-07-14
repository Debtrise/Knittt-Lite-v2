'use client';

import React, { useEffect, useState } from 'react';
import { useContentStore } from '../../store/contentStore';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/badge';
import { 
  Search, 
  Plus, 
  Copy, 
  Database, 
  User, 
  Phone, 
  Building, 
  Clock,
  Globe
} from 'lucide-react';

interface VariablePanelProps {
  searchQuery?: string;
}

export function VariablePanel({ searchQuery = '' }: VariablePanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const {
    variables,
    isLoading,
    loadVariables,
    createVariable
  } = useContentStore();

  useEffect(() => {
    loadVariables();
  }, [loadVariables]);

  const filteredVariables = variables.filter(variable => {
    const effectiveSearch = searchQuery || searchTerm;
    const matchesSearch = variable.name.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
                         variable.displayName.toLowerCase().includes(effectiveSearch.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || variable.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...new Set(variables.map(v => v.category))];
  const groupedVariables = variables.reduce((acc, variable) => {
    if (!acc[variable.category]) {
      acc[variable.category] = [];
    }
    acc[variable.category].push(variable);
    return acc;
  }, {} as Record<string, any[]>);

  const handleCopyVariable = (variableName: string) => {
    navigator.clipboard.writeText(`{${variableName}}`);
  };

  const getVariableIcon = (dataSource: string) => {
    switch (dataSource) {
      case 'lead':
        return <User className="w-4 h-4 text-blue-600" />;
      case 'call':
        return <Phone className="w-4 h-4 text-green-600" />;
      case 'tenant':
        return <Building className="w-4 h-4 text-purple-600" />;
      case 'system':
        return <Clock className="w-4 h-4 text-orange-600" />;
      case 'external_api':
        return <Globe className="w-4 h-4 text-red-600" />;
      default:
        return <Database className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Variables</h3>
        <Button size="sm" variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Add
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search variables..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map(category => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className="capitalize text-xs"
          >
            {category === 'all' ? 'All' : category}
          </Button>
        ))}
      </div>

      {/* Variables List */}
      <div className="space-y-3 max-h-96 overflow-auto">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : filteredVariables.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Database className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No variables found</p>
          </div>
        ) : (
          filteredVariables.map(variable => (
            <VariableCard
              key={variable.id}
              variable={variable}
              onCopy={handleCopyVariable}
            />
          ))
        )}
      </div>

      {/* Quick Insert Section */}
      <div className="border-t border-gray-200 pt-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Insert</h4>
        <div className="space-y-2">
          {Object.entries(groupedVariables).slice(0, 3).map(([category, categoryVariables]) => (
            <div key={category}>
              <p className="text-xs font-medium text-gray-600 mb-1">{category}</p>
              <div className="flex flex-wrap gap-1">
                {categoryVariables.slice(0, 3).map(variable => (
                  <Button
                    key={variable.id}
                    variant="outline"
                    size="sm"
                    className="text-xs h-6 px-2"
                    onClick={() => handleCopyVariable(variable.name)}
                  >
                    {variable.displayName}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Usage Guide */}
      <div className="bg-blue-50 rounded-lg p-3">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Usage Guide</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Use variables in text: {'{lead.name}'}</li>
          <li>• Click variable to copy to clipboard</li>
          <li>• Variables update automatically</li>
          <li>• Preview shows sample data</li>
        </ul>
      </div>
    </div>
  );
}

interface VariableCardProps {
  variable: any;
  onCopy: (variableName: string) => void;
}

function VariableCard({ variable, onCopy }: VariableCardProps) {
  return (
    <Card 
      className="p-3 cursor-pointer hover:shadow-sm transition-all duration-200 border-l-4 border-l-blue-500"
      onClick={() => onCopy(variable.name)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="flex-shrink-0 mt-0.5">
            {getVariableIcon(variable.dataSource)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {variable.displayName}
              </p>
              {variable.isSystemVariable && (
                <Badge variant="outline" className="text-xs">
                  System
                </Badge>
              )}
              {variable.isRequired && (
                <Badge variant="destructive" className="text-xs">
                  Required
                </Badge>
              )}
            </div>
            
            <p className="text-xs text-gray-500 mb-2 truncate">
              {variable.description}
            </p>
            
            <div className="flex items-center justify-between">
              <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                {'{' + variable.name + '}'}
              </code>
              
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs capitalize">
                  {variable.dataType}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopy(variable.name);
                  }}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
            
            {variable.defaultValue && (
              <p className="text-xs text-gray-400 mt-1">
                Default: {variable.defaultValue}
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function getVariableIcon(dataSource: string) {
  switch (dataSource) {
    case 'lead':
      return <User className="w-4 h-4 text-blue-600" />;
    case 'call':
      return <Phone className="w-4 h-4 text-green-600" />;
    case 'tenant':
      return <Building className="w-4 h-4 text-purple-600" />;
    case 'system':
      return <Clock className="w-4 h-4 text-orange-600" />;
    case 'external_api':
      return <Globe className="w-4 h-4 text-red-600" />;
    default:
      return <Database className="w-4 h-4 text-gray-600" />;
  }
} 