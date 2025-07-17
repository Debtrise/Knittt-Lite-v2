'use client';

import React, { useState } from 'react';
import { 
  Database, Plus, Trash2, Settings, Eye, EyeOff, Lock, 
  Filter, Calculator, Link, Shield, AlertTriangle
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';

interface DataSourceConfiguratorProps {
  dataSource: any;
  onUpdate: (config: any) => void;
  availableTables?: string[];
  availableFields?: Record<string, any[]>;
}

export default function DataSourceConfigurator({ 
  dataSource, 
  onUpdate, 
  availableTables = [],
  availableFields = {}
}: DataSourceConfiguratorProps) {
  const [activeTab, setActiveTab] = useState<'basic' | 'joins' | 'fields' | 'filters' | 'security' | 'validation'>('basic');

  const updateConfig = (updates: any) => {
    onUpdate({ ...dataSource.config, ...updates });
  };

  const addJoin = () => {
    const newJoin = {
      type: 'LEFT',
      table: '',
      alias: '',
      on: '',
      fields: []
    };
    updateConfig({
      joins: [...(dataSource.config?.joins || []), newJoin]
    });
  };

  const updateJoin = (index: number, updates: any) => {
    const joins = [...(dataSource.config?.joins || [])];
    joins[index] = { ...joins[index], ...updates };
    updateConfig({ joins });
  };

  const removeJoin = (index: number) => {
    const joins = [...(dataSource.config?.joins || [])];
    joins.splice(index, 1);
    updateConfig({ joins });
  };

  const addCalculatedField = () => {
    const newField = {
      name: '',
      expression: '',
      type: 'string'
    };
    updateConfig({
      calculatedFields: [...(dataSource.config?.calculatedFields || []), newField]
    });
  };

  const updateCalculatedField = (index: number, updates: any) => {
    const fields = [...(dataSource.config?.calculatedFields || [])];
    fields[index] = { ...fields[index], ...updates };
    updateConfig({ calculatedFields: fields });
  };

  const removeCalculatedField = (index: number) => {
    const fields = [...(dataSource.config?.calculatedFields || [])];
    fields.splice(index, 1);
    updateConfig({ calculatedFields: fields });
  };

  const addFilter = () => {
    const newFilter = {
      field: '',
      operator: 'eq',
      value: '',
      enabled: true
    };
    updateConfig({
      filters: { ...(dataSource.config?.filters || {}), [Date.now().toString()]: newFilter }
    });
  };

  const updateFilter = (key: string, updates: any) => {
    const filters = { ...(dataSource.config?.filters || {}) };
    filters[key] = { ...filters[key], ...updates };
    updateConfig({ filters });
  };

  const removeFilter = (key: string) => {
    const filters = { ...(dataSource.config?.filters || {}) };
    delete filters[key];
    updateConfig({ filters });
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 border-b">
        <button
          onClick={() => setActiveTab('basic')}
          className={`px-3 py-2 text-sm font-medium rounded-t-lg ${
            activeTab === 'basic' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          <Database className="w-4 h-4 mr-1 inline" />
          Basic
        </button>
        <button
          onClick={() => setActiveTab('joins')}
          className={`px-3 py-2 text-sm font-medium rounded-t-lg ${
            activeTab === 'joins' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          <Link className="w-4 h-4 mr-1 inline" />
          Joins
        </button>
        <button
          onClick={() => setActiveTab('fields')}
          className={`px-3 py-2 text-sm font-medium rounded-t-lg ${
            activeTab === 'fields' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          <Calculator className="w-4 h-4 mr-1 inline" />
          Calculated Fields
        </button>
        <button
          onClick={() => setActiveTab('filters')}
          className={`px-3 py-2 text-sm font-medium rounded-t-lg ${
            activeTab === 'filters' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          <Filter className="w-4 h-4 mr-1 inline" />
          Filters
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-3 py-2 text-sm font-medium rounded-t-lg ${
            activeTab === 'security' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          <Shield className="w-4 h-4 mr-1 inline" />
          Security
        </button>
        <button
          onClick={() => setActiveTab('validation')}
          className={`px-3 py-2 text-sm font-medium rounded-t-lg ${
            activeTab === 'validation' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
          }`}
        >
          <AlertTriangle className="w-4 h-4 mr-1 inline" />
          Validation
        </button>
      </div>

      {/* Basic Configuration */}
      {activeTab === 'basic' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Table Name
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={dataSource.config?.table || ''}
              onChange={(e) => updateConfig({ table: e.target.value })}
            >
              <option value="">Select table</option>
              {availableTables.map((table) => (
                <option key={table} value={table}>{table}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Schema
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="public"
              value={dataSource.config?.schema || ''}
              onChange={(e) => updateConfig({ schema: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Available Fields
            </label>
            <div className="bg-gray-50 p-3 rounded-md text-sm">
              {Object.keys(dataSource.config?.fields || {}).length > 0 ? (
                <div className="space-y-1">
                  {Object.entries(dataSource.config?.fields || {}).map(([field, config]: [string, any]) => (
                    <div key={field} className="flex justify-between items-center">
                      <span className="font-mono text-xs">{field}</span>
                      <span className="text-xs text-gray-500">{config.type}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500">No fields configured</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Joins Configuration */}
      {activeTab === 'joins' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-gray-900">Table Joins</h4>
            <Button size="sm" onClick={addJoin}>
              <Plus className="w-4 h-4 mr-1" />
              Add Join
            </Button>
          </div>

          {(dataSource.config?.joins || []).map((join: any, index: number) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h5 className="font-medium text-sm">Join {index + 1}</h5>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => removeJoin(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                  <select
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    value={join.type}
                    onChange={(e) => updateJoin(index, { type: e.target.value })}
                  >
                    <option value="INNER">INNER</option>
                    <option value="LEFT">LEFT</option>
                    <option value="RIGHT">RIGHT</option>
                    <option value="FULL">FULL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Table</label>
                  <select
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    value={join.table}
                    onChange={(e) => updateJoin(index, { table: e.target.value })}
                  >
                    <option value="">Select table</option>
                    {availableTables.map((table) => (
                      <option key={table} value={table}>{table}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Alias</label>
                  <input
                    type="text"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    value={join.alias}
                    onChange={(e) => updateJoin(index, { alias: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">ON Condition</label>
                  <input
                    type="text"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="table1.id = table2.id"
                    value={join.on}
                    onChange={(e) => updateJoin(index, { on: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Fields to Include</label>
                <input
                  type="text"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="field1, field2 as alias2"
                  value={join.fields.join(', ')}
                  onChange={(e) => updateJoin(index, { fields: e.target.value.split(',').map(f => f.trim()) })}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Calculated Fields Configuration */}
      {activeTab === 'fields' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-gray-900">Calculated Fields</h4>
            <Button size="sm" onClick={addCalculatedField}>
              <Plus className="w-4 h-4 mr-1" />
              Add Field
            </Button>
          </div>

          {(dataSource.config?.calculatedFields || []).map((field: any, index: number) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h5 className="font-medium text-sm">Field {index + 1}</h5>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => removeCalculatedField(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    value={field.name}
                    onChange={(e) => updateCalculatedField(index, { name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                  <select
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    value={field.type}
                    onChange={(e) => updateCalculatedField(index, { type: e.target.value })}
                  >
                    <option value="string">String</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                    <option value="date">Date</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Expression</label>
                  <input
                    type="text"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="CONCAT(firstName, ' ', lastName)"
                    value={field.expression}
                    onChange={(e) => updateCalculatedField(index, { expression: e.target.value })}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters Configuration */}
      {activeTab === 'filters' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-gray-900">Default Filters</h4>
            <Button size="sm" onClick={addFilter}>
              <Plus className="w-4 h-4 mr-1" />
              Add Filter
            </Button>
          </div>

          {Object.entries(dataSource.config?.filters || {}).map(([key, filter]: [string, any]) => (
            <div key={key} className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h5 className="font-medium text-sm">Filter</h5>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => removeFilter(key)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Field</label>
                  <input
                    type="text"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    value={filter.field}
                    onChange={(e) => updateFilter(key, { field: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Operator</label>
                  <select
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    value={filter.operator}
                    onChange={(e) => updateFilter(key, { operator: e.target.value })}
                  >
                    <option value="eq">Equals</option>
                    <option value="ne">Not Equals</option>
                    <option value="gt">Greater Than</option>
                    <option value="gte">Greater Than or Equal</option>
                    <option value="lt">Less Than</option>
                    <option value="lte">Less Than or Equal</option>
                    <option value="in">In</option>
                    <option value="not_in">Not In</option>
                    <option value="like">Like</option>
                    <option value="not_like">Not Like</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Value</label>
                  <input
                    type="text"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    value={filter.value}
                    onChange={(e) => updateFilter(key, { value: e.target.value })}
                  />
                </div>

                <div className="flex items-end">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={filter.enabled}
                      onChange={(e) => updateFilter(key, { enabled: e.target.checked })}
                    />
                    <span className="text-xs text-gray-700">Enabled</span>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Security Configuration */}
      {activeTab === 'security' && (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Row-Level Security</h4>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={dataSource.config?.permissions?.rowLevel?.enabled || false}
                  onChange={(e) => updateConfig({
                    permissions: {
                      ...dataSource.config?.permissions,
                      rowLevel: {
                        ...dataSource.config?.permissions?.rowLevel,
                        enabled: e.target.checked
                      }
                    }
                  })}
                />
                <span className="text-sm text-gray-700">Enable row-level security</span>
              </label>

              {dataSource.config?.permissions?.rowLevel?.enabled && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Field</label>
                    <input
                      type="text"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="assignedTo"
                      value={dataSource.config?.permissions?.rowLevel?.field || ''}
                      onChange={(e) => updateConfig({
                        permissions: {
                          ...dataSource.config?.permissions,
                          rowLevel: {
                            ...dataSource.config?.permissions?.rowLevel,
                            field: e.target.value
                          }
                        }
                      })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Value</label>
                    <input
                      type="text"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="{context.userId}"
                      value={dataSource.config?.permissions?.rowLevel?.value || ''}
                      onChange={(e) => updateConfig({
                        permissions: {
                          ...dataSource.config?.permissions,
                          rowLevel: {
                            ...dataSource.config?.permissions?.rowLevel,
                            value: e.target.value
                          }
                        }
                      })}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-3">Column-Level Security</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Hidden Columns</label>
                <input
                  type="text"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="ssn, internalNotes"
                  value={(dataSource.config?.permissions?.columnLevel?.hidden || []).join(', ')}
                  onChange={(e) => updateConfig({
                    permissions: {
                      ...dataSource.config?.permissions,
                      columnLevel: {
                        ...dataSource.config?.permissions?.columnLevel,
                        hidden: e.target.value.split(',').map(f => f.trim()).filter(f => f)
                      }
                    }
                  })}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Masked Columns</label>
                <input
                  type="text"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="phone, email"
                  value={(dataSource.config?.permissions?.columnLevel?.masked || []).join(', ')}
                  onChange={(e) => updateConfig({
                    permissions: {
                      ...dataSource.config?.permissions,
                      columnLevel: {
                        ...dataSource.config?.permissions?.columnLevel,
                        masked: e.target.value.split(',').map(f => f.trim()).filter(f => f)
                      }
                    }
                  })}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Validation Configuration */}
      {activeTab === 'validation' && (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Query Validation</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Max Execution Time (ms)</label>
                <input
                  type="number"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  value={dataSource.config?.validation?.maxExecutionTime || 30000}
                  onChange={(e) => updateConfig({
                    validation: {
                      ...dataSource.config?.validation,
                      maxExecutionTime: parseInt(e.target.value) || 30000
                    }
                  })}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Max Rows</label>
                <input
                  type="number"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  value={dataSource.config?.validation?.maxRows || 10000}
                  onChange={(e) => updateConfig({
                    validation: {
                      ...dataSource.config?.validation,
                      maxRows: parseInt(e.target.value) || 10000
                    }
                  })}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Allowed Statements</label>
                <input
                  type="text"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="SELECT"
                  value={(dataSource.config?.validation?.allowedStatements || ['SELECT']).join(', ')}
                  onChange={(e) => updateConfig({
                    validation: {
                      ...dataSource.config?.validation,
                      allowedStatements: e.target.value.split(',').map(s => s.trim().toUpperCase()).filter(s => s)
                    }
                  })}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Forbidden Keywords</label>
                <input
                  type="text"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="DROP, DELETE, UPDATE, INSERT"
                  value={(dataSource.config?.validation?.forbiddenKeywords || ['DROP', 'DELETE', 'UPDATE', 'INSERT']).join(', ')}
                  onChange={(e) => updateConfig({
                    validation: {
                      ...dataSource.config?.validation,
                      forbiddenKeywords: e.target.value.split(',').map(k => k.trim().toUpperCase()).filter(k => k)
                    }
                  })}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 