'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Copy, Share2, Trash2, Eye, Play, Settings,
  Calendar, Tag, Users, Globe, Lock, MoreVertical, BarChart3
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { 
  listReportBuilders,
  deleteReportBuilder,
  cloneReportBuilder,
  shareReportBuilder,
  executeReportBuilder
} from '@/app/utils/api';
import CustomReportBuilder from './CustomReportBuilder';
import toast from 'react-hot-toast';

interface CustomReport {
  id: string;
  name: string;
  description: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  widgets: any[];
  layout: any;
  theme: any;
}

interface CustomReportsManagerProps {
  onRefresh?: () => void;
}

export default function CustomReportsManager({ onRefresh }: CustomReportsManagerProps) {
  const [customReports, setCustomReports] = useState<CustomReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedReport, setSelectedReport] = useState<CustomReport | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareData, setShareData] = useState({
    reportId: '',
    sharedWith: '',
    permissions: {
      view: true,
      edit: false,
      delete: false,
      share: false
    },
    expiresAt: ''
  });

  useEffect(() => {
    fetchCustomReports();
  }, []);

  const fetchCustomReports = async () => {
    setIsLoading(true);
    try {
      const reports = await listReportBuilders();
      setCustomReports(reports);
    } catch (error) {
      console.error('Error fetching custom reports:', error);
      toast.error('Failed to load custom reports');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateReport = () => {
    setSelectedReport(null);
    setShowBuilder(true);
  };

  const handleEditReport = (report: CustomReport) => {
    setSelectedReport(report);
    setShowBuilder(true);
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteReportBuilder(reportId);
      toast.success('Report deleted successfully');
      fetchCustomReports();
      onRefresh?.();
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Failed to delete report');
    }
  };

  const handleCloneReport = async (report: CustomReport) => {
    try {
      const newName = `${report.name} - Copy`;
      await cloneReportBuilder(report.id, { name: newName });
      toast.success('Report cloned successfully');
      fetchCustomReports();
      onRefresh?.();
    } catch (error) {
      console.error('Error cloning report:', error);
      toast.error('Failed to clone report');
    }
  };

  const handleShareReport = (report: CustomReport) => {
    setShareData({
      reportId: report.id,
      sharedWith: '',
      permissions: {
        view: true,
        edit: false,
        delete: false,
        share: false
      },
      expiresAt: ''
    });
    setShowShareModal(true);
  };

  const handleShareSubmit = async () => {
    try {
      const result = await shareReportBuilder(shareData.reportId, {
        sharedWith: shareData.sharedWith ? parseInt(shareData.sharedWith) : undefined,
        permissions: shareData.permissions,
        expiresAt: shareData.expiresAt || undefined
      });
      
      toast.success('Report shared successfully');
      setShowShareModal(false);
      
      // Show share URL if it's a public share
      if (result.shareUrl) {
        toast.success(`Share URL: ${result.shareUrl}`);
      }
    } catch (error) {
      console.error('Error sharing report:', error);
      toast.error('Failed to share report');
    }
  };

  const handleExecuteReport = async (reportId: string) => {
    try {
      const result = await executeReportBuilder(reportId, {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      });
      
      // Open result in new window or show in modal
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head><title>Report Results</title></head>
            <body>
              <h1>Report Results</h1>
              <pre>${JSON.stringify(result, null, 2)}</pre>
            </body>
          </html>
        `);
      }
      
      toast.success('Report executed successfully');
    } catch (error) {
      console.error('Error executing report:', error);
      toast.error('Failed to execute report');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Custom Reports</h2>
          <p className="text-gray-600">Create and manage your custom reports</p>
        </div>
        <Button onClick={handleCreateReport} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          Create Report
        </Button>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customReports.map((report) => (
          <div key={report.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{report.name}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{report.description}</p>
                </div>
                <div className="flex items-center space-x-1">
                  {report.isPublic ? (
                    <Globe className="w-4 h-4 text-green-500" title="Public" />
                  ) : (
                    <Lock className="w-4 h-4 text-gray-400" title="Private" />
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              {/* Tags */}
              {report.tags && report.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {report.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {report.tags.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{report.tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Widgets</p>
                  <p className="text-sm font-medium text-gray-900">{report.widgets?.length || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Layout</p>
                  <p className="text-sm font-medium text-gray-900">
                    {report.layout?.columns || 12} cols
                  </p>
                </div>
              </div>

              {/* Dates */}
              <div className="text-xs text-gray-500 space-y-1">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>Created: {formatDate(report.createdAt)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>Updated: {formatDate(report.updatedAt)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExecuteReport(report.id)}
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Run
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditReport(report)}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCloneReport(report)}
                    title="Clone"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShareReport(report)}
                    title="Share"
                  >
                    <Share2 className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteReport(report.id)}
                    title="Delete"
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {customReports.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <BarChart3 className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No custom reports yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first custom report to start visualizing your data
          </p>
          <Button onClick={handleCreateReport} className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            Create Your First Report
          </Button>
        </div>
      )}

      {/* Custom Report Builder Modal */}
      <CustomReportBuilder
        isOpen={showBuilder}
        onClose={() => setShowBuilder(false)}
        report={selectedReport}
        onSave={() => {
          fetchCustomReports();
          onRefresh?.();
        }}
      />

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Share Report</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Share with User ID (optional)
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Leave empty for public link"
                  value={shareData.sharedWith}
                  onChange={(e) => setShareData(prev => ({ ...prev, sharedWith: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permissions
                </label>
                <div className="space-y-2">
                  {Object.entries(shareData.permissions).map(([permission, enabled]) => (
                    <label key={permission} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => setShareData(prev => ({
                          ...prev,
                          permissions: {
                            ...prev.permissions,
                            [permission]: e.target.checked
                          }
                        }))}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 capitalize">
                        {permission}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expires At (optional)
                </label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={shareData.expiresAt}
                  onChange={(e) => setShareData(prev => ({ ...prev, expiresAt: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 p-6 border-t">
              <Button
                variant="outline"
                onClick={() => setShowShareModal(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleShareSubmit}>
                Share
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 