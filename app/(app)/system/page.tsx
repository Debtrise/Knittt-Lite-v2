'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Server, Settings, Activity } from 'lucide-react';
import DashboardLayout from '@/app/components/layout/Dashboard';
import Button from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/Input';
import api from '@/app/lib/api';
import { useAuthStore } from '@/app/store/authStore';

type ModuleStatus = {
  name: string;
  status: string;
  version: string;
  lastChecked: string;
};

type DialplanCapability = {
  name: string;
  description: string;
  enabled: boolean;
  parameters: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
};

export default function SystemPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [moduleStatus, setModuleStatus] = useState<ModuleStatus[]>([]);
  const [dialplanCapabilities, setDialplanCapabilities] = useState<DialplanCapability[]>([]);
  const [agentStatus, setAgentStatus] = useState<any>(null);
  const [agentConfig, setAgentConfig] = useState({
    url: '',
    ingroup: '',
    user: '',
    pass: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchModuleStatus();
    fetchDialplanCapabilities();
  }, [isAuthenticated, router]);

  const fetchModuleStatus = async () => {
    try {
      const response = await api.system.getModuleStatus();
      setModuleStatus(response.data.modules || []);
    } catch (error) {
      console.error('Error fetching module status:', error);
      toast.error('Failed to load module status');
    }
  };

  const fetchDialplanCapabilities = async () => {
    try {
      const response = await api.system.getDialplanCapabilities();
      setDialplanCapabilities(response.data.capabilities || []);
    } catch (error) {
      console.error('Error fetching dialplan capabilities:', error);
      toast.error('Failed to load dialplan capabilities');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgentStatusCheck = async () => {
    if (!agentConfig.url || !agentConfig.ingroup || !agentConfig.user || !agentConfig.pass) {
      toast.error('Please fill in all agent configuration fields');
      return;
    }

    try {
      const response = await api.system.getAgentStatus(agentConfig);
      setAgentStatus(response);
      toast.success('Agent status checked successfully');
    } catch (error) {
      console.error('Error checking agent status:', error);
      toast.error('Failed to check agent status');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">System Status</h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor system modules and capabilities
          </p>
        </div>

        {/* Module Status */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Module Status</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {moduleStatus.map((module) => (
                <div
                  key={module.name}
                  className="bg-gray-50 rounded-lg p-4"
                >
                  <div className="flex items-center">
                    <Server className={`h-5 w-5 ${
                      module.status === 'active' ? 'text-green-500' : 'text-red-500'
                    }`} />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-900">{module.name}</h3>
                      <p className="text-sm text-gray-500">Version: {module.version}</p>
                      <p className="text-xs text-gray-400">
                        Last checked: {new Date(module.lastChecked).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dialplan Capabilities */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Dialplan Capabilities</h2>
            <div className="space-y-4">
              {dialplanCapabilities.map((capability) => (
                <div
                  key={capability.name}
                  className="border rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{capability.name}</h3>
                      <p className="text-sm text-gray-500">{capability.description}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      capability.enabled
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {capability.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  {capability.parameters.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-xs font-medium text-gray-500 uppercase">Parameters</h4>
                      <div className="mt-2 space-y-2">
                        {capability.parameters.map((param) => (
                          <div key={param.name} className="text-sm">
                            <span className="font-medium">{param.name}</span>
                            <span className="text-gray-500"> ({param.type})</span>
                            {param.required && (
                              <span className="ml-1 text-red-500">*</span>
                            )}
                            <p className="text-xs text-gray-500">{param.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Agent Status Check */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Agent Status Check</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">URL</label>
                <Input
                  type="text"
                  value={agentConfig.url}
                  onChange={(e) => setAgentConfig({ ...agentConfig, url: e.target.value })}
                  placeholder="Agent URL"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Inbound Group</label>
                <Input
                  type="text"
                  value={agentConfig.ingroup}
                  onChange={(e) => setAgentConfig({ ...agentConfig, ingroup: e.target.value })}
                  placeholder="Inbound Group"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <Input
                  type="text"
                  value={agentConfig.user}
                  onChange={(e) => setAgentConfig({ ...agentConfig, user: e.target.value })}
                  placeholder="Username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <Input
                  type="password"
                  value={agentConfig.pass}
                  onChange={(e) => setAgentConfig({ ...agentConfig, pass: e.target.value })}
                  placeholder="Password"
                />
              </div>
            </div>
            <div className="mt-4">
              <Button
                variant="primary"
                onClick={handleAgentStatusCheck}
              >
                <Activity className="w-4 h-4 mr-2" />
                Check Status
              </Button>
            </div>
            {agentStatus && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Status Response</h3>
                <pre className="text-xs text-gray-500 overflow-x-auto">
                  {JSON.stringify(agentStatus, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 