'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/Input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { FileText, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SaveAsTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (templateData: TemplateData) => Promise<void>;
  currentProjectName?: string;
  isLoading?: boolean;
}

export interface TemplateData {
  name: string;
  description: string;
  category: string;
  isPublic: boolean;
  tags: string[];
}

const TEMPLATE_CATEGORIES = [
  { value: 'welcome_screen', label: 'Welcome Screen' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'celebration', label: 'Celebration' },
  { value: 'promotion', label: 'Promotion' },
  { value: 'informational', label: 'Informational' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'seasonal', label: 'Seasonal' },
  { value: 'custom', label: 'Custom' },
];

export function SaveAsTemplateDialog({
  isOpen,
  onClose,
  onSave,
  currentProjectName = '',
  isLoading = false
}: SaveAsTemplateDialogProps) {
  const [formData, setFormData] = useState<TemplateData>({
    name: currentProjectName ? `${currentProjectName} Template` : '',
    description: '',
    category: 'custom',
    isPublic: false,
    tags: []
  });
  const [tagInput, setTagInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Template name is required');
      return;
    }

    try {
      await onSave(formData);
      handleClose();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  };

  const handleClose = () => {
    setFormData({
      name: currentProjectName ? `${currentProjectName} Template` : '',
      description: '',
      category: 'custom',
      isPublic: false,
      tags: []
    });
    setTagInput('');
    onClose();
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Save as Template
          </DialogTitle>
          <DialogDescription>
            Create a reusable template from your current project. Templates can be used to quickly start new projects with similar layouts and elements.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name *</Label>
              <Input
                id="template-name"
                placeholder="Enter template name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="template-category">Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-description">Description</Label>
            <Textarea
              id="template-description"
              placeholder="Describe what this template is for and when to use it"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-tags">Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                id="template-tags"
                placeholder="Add tags (press Enter)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <Button type="button" variant="outline" onClick={handleAddTag} disabled={!tagInput.trim()}>
                Add
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Tags help categorize and search for templates
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="template-public"
              checked={formData.isPublic}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: !!checked }))}
            />
            <Label htmlFor="template-public" className="text-sm">
              Make this template available to all users
            </Label>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">What will be saved:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• All elements and their properties</li>
              <li>• Canvas size and background settings</li>
              <li>• Element positions and styling</li>
              <li>• Variable placeholders (if any)</li>
              <li>• Asset references (assets must be uploaded separately)</li>
            </ul>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving Template...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Save Template
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 