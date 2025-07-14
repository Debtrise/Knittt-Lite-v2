'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Button } from '@/app/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import {
  ArrowLeft,
  FileText,
  Edit,
  Play,
  Copy,
  Trash2,
  Download,
  Send,
  Eye,
  Settings,
  Image,
  Type,
  Video,
  Sparkles,
  ChevronDown,
  Monitor,
  Zap
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/app/lib/api';

interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  contentType: string;
  isTemplate: boolean;
  templateCategory: string;
  template: {
    background: {
      type: string;
      value: string;
    };
    elements: Array<{
      type: string;
      content: string;
      position: { x: number; y: number };
      size?: { width: number; height: number };
      style?: Record<string, any>;
    }>;
    animations?: Array<{
      element: number;
      type: string;
      duration: number;
      delay?: number;
      easing?: string;
    }>;
    duration: number;
  };
  variables: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  usageCount?: number;
}

interface Display {
  id: string;
  name: string;
  location: string;
  status: string;
}

export default function ContentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const contentId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<ContentTemplate | null>(null);
  const [displays, setDisplays] = useState<Display[]>([]);
  const [selectedDisplays, setSelectedDisplays] = useState<string[]>([]);
  const [previewVariables, setPreviewVariables] = useState<Record<string, any>>({});

  const fetchContent = async () => {
    try {
      setLoading(true);
      const response = await api.optisigns.getContentItem(contentId);
      setContent(response.data);
      
      // Initialize preview variables with default values
      if (response.data.variables) {
        setPreviewVariables(response.data.variables);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const fetchDisplays = async () => {
    try {
      const response = await api.optisigns.getDisplays({ limit: 500 });
      setDisplays(response.data.displays || []);
    } catch (error) {
      console.error('Error fetching displays:', error);
    }
  };

  useEffect(() => {
    if (contentId) {
      fetchContent();
      fetchDisplays();
    }
  }, [contentId]);

  const handleSendToDisplays = async () => {
    if (selectedDisplays.length === 0) {
      toast.error('Please select at least one display');
      return;
    }

    try {
      await api.optisigns.sendContentToDisplays(contentId, {
        displayIds: selectedDisplays,
        duration: content?.template.duration || 30,
        variables: previewVariables
      });
      
      toast.success(`Content sent to ${selectedDisplays.length} display(s)`);
      setSelectedDisplays([]);
    } catch (error) {
      console.error('Error sending content:', error);
      toast.error('Failed to send content to displays');
    }
  };

  const handleDuplicate = async () => {
    if (!content) return;

    try {
      const duplicateData = {
        ...content,
        name: `${content.name} (Copy)`,
        id: undefined,
        createdAt: undefined,
        updatedAt: undefined,
        usageCount: undefined
      };

      const response = await api.optisigns.createContent(duplicateData);
      toast.success('Content duplicated successfully');
      router.push(`/optisigns/content/${response.data.id}`);
    } catch (error) {
      console.error('Error duplicating content:', error);
      toast.error('Failed to duplicate content');
    }
  };

  const handleDelete = async () => {
    if (!content || !confirm('Are you sure you want to delete this content?')) return;

    try {
      await api.optisigns.deleteContent(contentId);
      toast.success('Content deleted successfully');
      router.push('/optisigns/content');
    } catch (error) {
      console.error('Error deleting content:', error);
      toast.error('Failed to delete content');
    }
  };

  const handlePreview = async () => {
    try {
      const response = await api.optisigns.previewContent(contentId, {
        variables: previewVariables
      });
      
      // For now, just show a success message. In a real implementation,
      // this would open a preview modal or new window
      toast.success('Preview generated successfully');
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('Failed to generate preview');
    }
  };

  const getElementIcon = (type: string) => {
    switch (type) {
      case 'text':
        return Type;
      case 'image':
        return Image;
      case 'video':
        return Video;
      case 'confetti':
        return Sparkles;
      default:
        return FileText;
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <div className="text-center py-8">Loading content...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!content) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Content Not Found</h3>
            <p className="text-gray-500 mb-4">The requested content could not be found.</p>
            <Button onClick={() => router.push('/optisigns/content')}>
              Back to Content
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/optisigns/content')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Content
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{content.name}</h1>
            <p className="text-gray-600">{content.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Actions
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/optisigns/content/${contentId}/edit`)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Content
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDuplicate}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePreview}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={handleSendToDisplays} disabled={selectedDisplays.length === 0}>
              <Send className="h-4 w-4 mr-2" />
              Send to Displays
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Content Info */}
            <Card>
              <CardHeader>
                <CardTitle>Content Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Type</label>
                    <div className="mt-1">
                      <Badge variant="outline">{content.contentType}</Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Category</label>
                    <div className="mt-1">
                      <Badge variant="outline">{content.templateCategory}</Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Duration</label>
                    <div className="mt-1 text-sm">{formatDuration(content.template.duration)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <div className="mt-1">
                      <Badge variant={content.isActive ? 'default' : 'secondary'}>
                        {content.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  {content.usageCount !== undefined && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Usage Count</label>
                      <div className="mt-1 text-sm">{content.usageCount} times</div>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-600">Created</label>
                    <div className="mt-1 text-sm">{new Date(content.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Template Structure */}
            <Card>
              <CardHeader>
                <CardTitle>Template Structure</CardTitle>
                <CardDescription>
                  Background, elements, and animations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="elements">
                  <TabsList>
                    <TabsTrigger value="elements">Elements</TabsTrigger>
                    <TabsTrigger value="background">Background</TabsTrigger>
                    {content.template.animations && content.template.animations.length > 0 && (
                      <TabsTrigger value="animations">Animations</TabsTrigger>
                    )}
                  </TabsList>
                  
                  <TabsContent value="elements" className="space-y-3">
                    {content.template.elements.map((element, index) => {
                      const ElementIcon = getElementIcon(element.type);
                      return (
                        <div key={index} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <ElementIcon className="h-4 w-4" />
                            <span className="font-medium capitalize">{element.type}</span>
                            <Badge variant="outline" className="ml-auto">#{index + 1}</Badge>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div><strong>Content:</strong> {element.content}</div>
                            <div>
                              <strong>Position:</strong> ({element.position.x}, {element.position.y})
                            </div>
                            {element.size && (
                              <div>
                                <strong>Size:</strong> {element.size.width} x {element.size.height}
                              </div>
                            )}
                            {element.style && Object.keys(element.style).length > 0 && (
                              <div>
                                <strong>Style:</strong> {Object.entries(element.style).map(([key, value]) => 
                                  `${key}: ${value}`
                                ).join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </TabsContent>
                  
                  <TabsContent value="background">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Type:</span>
                          <Badge variant="outline">{content.template.background.type}</Badge>
                        </div>
                        <div>
                          <span className="font-medium">Value:</span>
                          <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-sm">
                            {content.template.background.value}
                          </code>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  {content.template.animations && (
                    <TabsContent value="animations" className="space-y-3">
                      {content.template.animations.map((animation, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="h-4 w-4" />
                            <span className="font-medium">{animation.type}</span>
                            <Badge variant="outline" className="ml-auto">Element #{animation.element + 1}</Badge>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div><strong>Duration:</strong> {animation.duration}s</div>
                            {animation.delay && <div><strong>Delay:</strong> {animation.delay}s</div>}
                            {animation.easing && <div><strong>Easing:</strong> {animation.easing}</div>}
                          </div>
                        </div>
                      ))}
                    </TabsContent>
                  )}
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Variables */}
            {Object.keys(content.variables).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Variables</CardTitle>
                  <CardDescription>
                    Configure variable values for preview and sending
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(content.variables).map(([key, defaultValue]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium mb-1">{key}</label>
                      <input
                        type="text"
                        value={previewVariables[key] || defaultValue}
                        onChange={(e) => setPreviewVariables(prev => ({
                          ...prev,
                          [key]: e.target.value
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={`Default: ${defaultValue}`}
                      />
                    </div>
                  ))}
                  <Button onClick={handlePreview} variant="outline" size="sm" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    Update Preview
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Send to Displays */}
            <Card>
              <CardHeader>
                <CardTitle>Send to Displays</CardTitle>
                <CardDescription>
                  Select displays to send this content to
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {displays.length === 0 ? (
                  <div className="text-center py-4">
                    <Monitor className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No displays available</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {displays.map((display) => (
                        <div key={display.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={display.id}
                            checked={selectedDisplays.includes(display.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedDisplays(prev => [...prev, display.id]);
                              } else {
                                setSelectedDisplays(prev => prev.filter(id => id !== display.id));
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <label htmlFor={display.id} className="flex-1 text-sm">
                            <div className="font-medium">{display.name}</div>
                            <div className="text-gray-500">{display.location}</div>
                          </label>
                          <Badge 
                            variant={display.status === 'online' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {display.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    
                    <div className="pt-2 border-t">
                      <Button
                        onClick={() => {
                          // Select displays that are either online or active
                          const availableDisplays = displays.filter(d => d.status === 'online' || d.isActive);
                          setSelectedDisplays(availableDisplays.map(d => d.id));
                        }}
                        variant="outline"
                        size="sm"
                        className="w-full mb-2"
                      >
                        Select All Available
                      </Button>
                      <Button
                        onClick={handleSendToDisplays}
                        disabled={selectedDisplays.length === 0}
                        className="w-full"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Send to {selectedDisplays.length} Display(s)
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 