'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/Input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ElementRenderer } from './ElementRenderer';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Monitor, 
  Smartphone, 
  Tablet,
  Settings,
  Download,
  Share
} from 'lucide-react';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
  elements: any[];
  canvasSize: { width: number; height: number };
  canvasBackground: any;
  variables: any[];
}

export function PreviewModal({
  isOpen,
  onClose,
  project,
  elements,
  canvasSize,
  canvasBackground,
  variables
}: PreviewModalProps) {
  const [previewData, setPreviewData] = useState<any>(null);
  const [contextData, setContextData] = useState({
    lead: {
      name: 'John Doe',
      phone: '(555) 123-4567',
      email: 'john@example.com'
    },
    call: {
      status: 'Connected',
      duration: 45
    },
    tenant: {
      name: 'ACME Corporation'
    }
  });
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showExportBounds, setShowExportBounds] = useState(false);

  const getPreviewSize = () => {
    switch (previewMode) {
      case 'tablet':
        return { width: 768, height: 1024 };
      case 'mobile':
        return { width: 375, height: 667 };
      default:
        return canvasSize;
    }
  };

  const processElementsWithVariables = (elements: any[]) => {
    return elements.map(element => {
      const processedElement = { ...element };
      
      if (element.elementType === 'text' && element.properties.text) {
        processedElement.properties = {
          ...element.properties,
          text: element.properties.text.replace(/\{([^}]+)\}/g, (match: string, variable: string) => {
            return getVariableValue(variable);
          })
        };
      }
      
      return processedElement;
    });
  };

  const getVariableValue = (variableName: string) => {
    const parts = variableName.split('.');
    let value = contextData;
    
    for (const part of parts) {
      value = value?.[part];
    }
    
    if (value !== undefined) {
      return value;
    }
    
    // Fallback values
    const fallbacks: Record<string, string> = {
      'lead.name': 'John Doe',
      'lead.phone': '(555) 123-4567',
      'lead.email': 'john@example.com',
      'current.date': new Date().toLocaleDateString(),
      'current.time': new Date().toLocaleTimeString(),
      'company.name': 'ACME Corp',
      'call.status': 'Connected',
      'call.duration': '45'
    };
    
    return fallbacks[variableName] || `[${variableName}]`;
  };

  const handleContextDataChange = (category: string, field: string, value: any) => {
    setContextData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  // Calculate content bounds for export centering
  const getContentBounds = () => {
    if (processedElements.length === 0) {
      return { left: 0, top: 0, right: canvasSize.width, bottom: canvasSize.height };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    processedElements.forEach(element => {
      const left = element.position.x;
      const top = element.position.y;
      const right = left + element.size.width;
      const bottom = top + element.size.height;

      minX = Math.min(minX, left);
      minY = Math.min(minY, top);
      maxX = Math.max(maxX, right);
      maxY = Math.max(maxY, bottom);
    });

    // Add some padding around the content
    const padding = 20;
    return {
      left: Math.max(0, minX - padding),
      top: Math.max(0, minY - padding),
      right: Math.min(canvasSize.width, maxX + padding),
      bottom: Math.min(canvasSize.height, maxY + padding)
    };
  };

  const processedElements = processElementsWithVariables(elements);
  const previewSize = getPreviewSize();
  
  // Calculate proper scale to fit the content in the available space
  const maxPreviewWidth = Math.min(1200, (typeof window !== 'undefined' ? window.innerWidth * 0.6 : 800));
  const maxPreviewHeight = Math.min(800, (typeof window !== 'undefined' ? window.innerHeight * 0.6 : 600));
  const scale = Math.min(1, maxPreviewWidth / previewSize.width, maxPreviewHeight / previewSize.height);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden bg-white/95 backdrop-blur-sm">
        <DialogHeader className="border-b border-gray-200 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">Preview: {project?.name || 'Untitled Project'}</DialogTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant={previewMode === 'desktop' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewMode('desktop')}
              >
                <Monitor className="w-4 h-4" />
              </Button>
              <Button
                variant={previewMode === 'tablet' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewMode('tablet')}
              >
                <Tablet className="w-4 h-4" />
              </Button>
              <Button
                variant={previewMode === 'mobile' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewMode('mobile')}
              >
                <Smartphone className="w-4 h-4" />
              </Button>
              <div className="w-px h-6 bg-gray-300" />
              <Button size="sm" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button size="sm" variant="outline">
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Preview Area */}
          <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4 min-h-0">
            <div className="mb-4 flex items-center space-x-3 bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 shadow-sm border flex-shrink-0">
              <span className="text-sm text-gray-700 font-medium">
                {previewSize.width} × {previewSize.height} 
                {scale < 1 && ` (${Math.round(scale * 100)}%)`}
              </span>
              <div className="w-px h-4 bg-gray-300"></div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsPlaying(!isPlaying)}
                className="h-8"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button size="sm" variant="outline" className="h-8">
                <RotateCcw className="w-4 h-4" />
              </Button>
              <div className="w-px h-4 bg-gray-300"></div>
              <Button 
                size="sm" 
                variant={showExportBounds ? "default" : "outline"} 
                className="h-8 text-xs"
                onClick={() => setShowExportBounds(!showExportBounds)}
              >
                Export Bounds
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 text-xs"
                onClick={() => {
                  const bounds = getContentBounds();
                  const centerX = canvasSize.width / 2;
                  const centerY = canvasSize.height / 2;
                  const contentCenterX = (bounds.left + bounds.right) / 2;
                  const contentCenterY = (bounds.top + bounds.bottom) / 2;
                  const offsetX = centerX - contentCenterX;
                  const offsetY = centerY - contentCenterY;
                  
                  console.log('Content centered for export! Offset:', { offsetX, offsetY });
                  // Note: This would need to be connected to the actual element update system
                  // For now it just shows the export bounds
                  setShowExportBounds(true);
                }}
              >
                Center Content
              </Button>
            </div>

            {/* Preview Canvas Container - Centered */}
            <div className="flex-1 flex items-center justify-center w-full h-full min-h-0">
            <div 
                className="relative border-2 border-gray-300 shadow-2xl bg-white overflow-hidden rounded-lg"
              style={{
                  width: `${previewSize.width}px`,
                  height: `${previewSize.height}px`,
                transform: `scale(${scale})`,
                  transformOrigin: 'center center'
              }}
            >
              {/* Background */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundColor: canvasBackground.color || '#ffffff',
                  background: canvasBackground.gradient || undefined,
                  backgroundImage: canvasBackground.imageUrl ? `url(${canvasBackground.imageUrl})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />

              {/* Elements */}
              {processedElements
                .sort((a, b) => (a.layerOrder || 0) - (b.layerOrder || 0))
                .map((element) => (
                  <div
                    key={element.id}
                    className="absolute"
                    style={{
                      left: `${element.position.x}px`,
                      top: `${element.position.y}px`,
                      width: `${element.size.width}px`,
                      height: `${element.size.height}px`,
                      zIndex: element.position.z || 0,
                      opacity: element.opacity || 1,
                      transform: element.styles?.transform || 'none',
                      ...element.styles
                    }}
                  >
                    <ElementRenderer element={element} isPreview contextData={contextData} />
                  </div>
                ))}

              {/* Export Bounds Overlay */}
              {showExportBounds && (() => {
                const bounds = getContentBounds();
                return (
                  <div 
                    className="absolute border-2 border-dashed border-red-500 bg-red-100 bg-opacity-20 pointer-events-none"
                    style={{
                      left: `${bounds.left}px`,
                      top: `${bounds.top}px`,
                      width: `${bounds.right - bounds.left}px`,
                      height: `${bounds.bottom - bounds.top}px`
                    }}
                  >
                    <div className="absolute -top-6 left-0 bg-red-500 text-white text-xs px-2 py-1 rounded">
                      Export Area ({bounds.right - bounds.left} × {bounds.bottom - bounds.top})
                    </div>
                  </div>
                );
              })()}
              </div>
            </div>
          </div>

          {/* Context Data Panel */}
          <div className="w-80 border-l border-gray-200 bg-white overflow-auto">
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-4">Preview Data</h3>
              
              <Tabs defaultValue="lead" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="lead" className="text-xs">Lead</TabsTrigger>
                  <TabsTrigger value="call" className="text-xs">Call</TabsTrigger>
                  <TabsTrigger value="tenant" className="text-xs">Company</TabsTrigger>
                </TabsList>

                <TabsContent value="lead" className="space-y-3 mt-4">
                  <div>
                    <Label htmlFor="leadName">Name</Label>
                    <Input
                      id="leadName"
                      value={contextData.lead.name}
                      onChange={(e) => handleContextDataChange('lead', 'name', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="leadPhone">Phone</Label>
                    <Input
                      id="leadPhone"
                      value={contextData.lead.phone}
                      onChange={(e) => handleContextDataChange('lead', 'phone', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="leadEmail">Email</Label>
                    <Input
                      id="leadEmail"
                      value={contextData.lead.email}
                      onChange={(e) => handleContextDataChange('lead', 'email', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="call" className="space-y-3 mt-4">
                  <div>
                    <Label htmlFor="callStatus">Status</Label>
                    <Input
                      id="callStatus"
                      value={contextData.call.status}
                      onChange={(e) => handleContextDataChange('call', 'status', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="callDuration">Duration (seconds)</Label>
                    <Input
                      id="callDuration"
                      type="number"
                      value={contextData.call.duration}
                      onChange={(e) => handleContextDataChange('call', 'duration', parseInt(e.target.value) || 0)}
                      className="mt-1"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="tenant" className="space-y-3 mt-4">
                  <div>
                    <Label htmlFor="tenantName">Company Name</Label>
                    <Input
                      id="tenantName"
                      value={contextData.tenant.name}
                      onChange={(e) => handleContextDataChange('tenant', 'name', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              {/* Variable List */}
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Available Variables</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <code>{'{lead.name}'}</code>
                    <span className="text-gray-500">{getVariableValue('lead.name')}</span>
                  </div>
                  <div className="flex justify-between">
                    <code>{'{lead.phone}'}</code>
                    <span className="text-gray-500">{getVariableValue('lead.phone')}</span>
                  </div>
                  <div className="flex justify-between">
                    <code>{'{lead.email}'}</code>
                    <span className="text-gray-500">{getVariableValue('lead.email')}</span>
                  </div>
                  <div className="flex justify-between">
                    <code>{'{call.status}'}</code>
                    <span className="text-gray-500">{getVariableValue('call.status')}</span>
                  </div>
                  <div className="flex justify-between">
                    <code>{'{company.name}'}</code>
                    <span className="text-gray-500">{getVariableValue('company.name')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 