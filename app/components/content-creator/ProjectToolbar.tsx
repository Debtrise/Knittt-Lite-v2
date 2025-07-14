'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { 
  Save, 
  Eye, 
  Upload, 
  Undo, 
  Redo, 
  Copy, 
  Download,
  Settings,
  Play,
  Loader2,
  FileText,
  ChevronDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';

interface ProjectToolbarProps {
  onSave: () => void;
  onSaveAsTemplate?: () => void;
  onPreview: () => void;
  onOpenAssets: () => void;
  onExport?: () => void;
  isLoading?: boolean;
  hasUnsavedChanges?: boolean;
}

export function ProjectToolbar({ 
  onSave, 
  onSaveAsTemplate,
  onPreview, 
  onOpenAssets, 
  onExport,
  isLoading = false,
  hasUnsavedChanges = false
}: ProjectToolbarProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      {/* Left Section */}
      <div className="flex items-center space-x-2">
        <h1 className="text-lg font-semibold text-gray-900">
          Content Creator
          {hasUnsavedChanges && (
            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              Unsaved changes
            </span>
          )}
        </h1>
        <div className="h-6 w-px bg-gray-300 mx-2" />
        <Button variant="ghost" size="sm" disabled>
          <Undo className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" disabled>
          <Redo className="w-4 h-4" />
        </Button>
      </div>

      {/* Center Section */}
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={onOpenAssets}>
          <Upload className="w-4 h-4 mr-2" />
          Assets
        </Button>
        <Button variant="outline" size="sm">
          <Copy className="w-4 h-4 mr-2" />
          Duplicate
        </Button>
        <Button variant="outline" size="sm" onClick={onExport}>
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={onPreview}>
          <Eye className="w-4 h-4 mr-2" />
          Preview
        </Button>
        
        {/* Save Dropdown */}
        <div className="flex items-center">
          <Button 
            onClick={onSave} 
            size="sm" 
            disabled={isLoading}
            className={`${hasUnsavedChanges ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'} rounded-r-none`}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                size="sm" 
                disabled={isLoading}
                className={`${hasUnsavedChanges ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'} rounded-l-none border-l border-white/20 px-2`}
              >
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onSave} disabled={isLoading}>
                <Save className="w-4 h-4 mr-2" />
                Save Project
              </DropdownMenuItem>
              {onSaveAsTemplate && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onSaveAsTemplate} disabled={isLoading}>
                    <FileText className="w-4 h-4 mr-2" />
                    Save as Template
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
} 