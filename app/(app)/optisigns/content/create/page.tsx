'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import DashboardLayout from '@/app/components/layout/Dashboard';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/Input';
import { Label } from '@/app/components/ui/label';
import { Switch } from '@/app/components/ui/switch';
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
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Type,
  Image,
  Video,
  Sparkles,
  Eye,
  Palette
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/app/lib/api';

interface ElementFormData {
  type: 'text' | 'image' | 'video' | 'confetti';
  content: string;
  position: {
    x: number;
    y: number;
  };
  size?: {
    width: number;
    height: number;
  };
  style?: {
    fontSize?: string;
    color?: string;
    fontFamily?: string;
  };
}

interface AnimationFormData {
  element: number;
  type: 'fadeIn' | 'slideIn' | 'bounce' | 'pulse' | 'zoom';
  duration: number;
  delay?: number;
  easing?: 'ease-in' | 'ease-out' | 'ease-in-out';
}

interface ContentFormData {
  name: string;
  description: string;
  contentType: 'template' | 'custom' | 'webhook_generated';
  templateCategory: string;
  isTemplate: boolean;
  isActive: boolean;
  template: {
    background: {
      type: 'color' | 'image' | 'video';
      value: string;
    };
    elements: ElementFormData[];
    animations: AnimationFormData[];
    duration: number;
  };
  variables: Record<string, string>;
}

export default function CreateContentPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [currentTab, setCurrentTab] = useState('basic');
  
  const { register, handleSubmit, watch, setValue, getValues, formState: { errors } } = useForm<ContentFormData>({
    defaultValues: {
      name: '',
      description: '',
      contentType: 'custom',
      templateCategory: 'general',
      isTemplate: false,
      isActive: true,
      template: {
        background: {
          type: 'color',
          value: '#ffffff'
        },
        elements: [],
        animations: [],
        duration: 30
      },
      variables: {}
    }
  });

  const [elements, setElements] = useState<ElementFormData[]>([]);
  const [animations, setAnimations] = useState<AnimationFormData[]>([]);
  const [variables, setVariables] = useState<Record<string, string>>({});

  const addElement = () => {
    const newElement: ElementFormData = {
      type: 'text',
      content: 'Sample text',
      position: { x: 100, y: 100 },
      size: { width: 200, height: 50 },
      style: { fontSize: '24px', color: '#000000' }
    };
    setElements(prev => [...prev, newElement]);
  };

  const updateElement = (index: number, field: string, value: any) => {
    setElements(prev => prev.map((el, i) => 
      i === index ? { ...el, [field]: value } : el
    ));
  };

  const removeElement = (index: number) => {
    setElements(prev => prev.filter((_, i) => i !== index));
    // Remove animations for this element
    setAnimations(prev => prev.filter(anim => anim.element !== index));
  };

  const addAnimation = () => {
    if (elements.length === 0) {
      toast.error('Add elements first before adding animations');
      return;
    }
    
    const newAnimation: AnimationFormData = {
      element: 0,
      type: 'fadeIn',
      duration: 1,
      delay: 0,
      easing: 'ease-in-out'
    };
    setAnimations(prev => [...prev, newAnimation]);
  };

  const updateAnimation = (index: number, field: string, value: any) => {
    setAnimations(prev => prev.map((anim, i) => 
      i === index ? { ...anim, [field]: value } : anim
    ));
  };

  const removeAnimation = (index: number) => {
    setAnimations(prev => prev.filter((_, i) => i !== index));
  };

  const addVariable = () => {
    const key = prompt('Enter variable name:');
    if (key && !variables[key]) {
      setVariables(prev => ({ ...prev, [key]: '' }));
    }
  };

  const updateVariable = (key: string, value: string) => {
    setVariables(prev => ({ ...prev, [key]: value }));
  };

  const removeVariable = (key: string) => {
    setVariables(prev => {
      const newVars = { ...prev };
      delete newVars[key];
      return newVars;
    });
  };

  const onSubmit = async (data: ContentFormData) => {
    try {
      setSaving(true);
      
      const contentData = {
        ...data,
        template: {
          ...data.template,
          elements,
          animations,
        },
        variables
      };

      const response = await api.optisigns.createContent(contentData);
      toast.success('Content created successfully');
      router.push(`/optisigns/content/${response.data.id}`);
    } catch (error) {
      console.error('Error creating content:', error);
      toast.error('Failed to create content');
    } finally {
      setSaving(false);
    }
  };

  const getElementIcon = (type: string) => {
    switch (type) {
      case 'text': return Type;
      case 'image': return Image;
      case 'video': return Video;
      case 'confetti': return Sparkles;
      default: return Type;
    }
  };

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
            <h1 className="text-2xl font-bold">Create Content</h1>
            <p className="text-gray-600">Design a new content template for your displays</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                // Preview functionality - would open a preview modal
                toast.info('Preview functionality coming soon');
              }}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={saving}
            >
              {saving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Content
                </>
              )}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="background">Background</TabsTrigger>
              <TabsTrigger value="elements">Elements</TabsTrigger>
              <TabsTrigger value="animations">Animations</TabsTrigger>
              <TabsTrigger value="variables">Variables</TabsTrigger>
            </TabsList>

            {/* Basic Information */}
            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>
                    Set the name, description, and basic properties
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Content Name</Label>
                      <Input
                        id="name"
                        {...register('name', { required: 'Name is required' })}
                        placeholder="Enter content name"
                      />
                      {errors.name && (
                        <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="templateCategory">Category</Label>
                      <select
                        id="templateCategory"
                        {...register('templateCategory')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="general">General</option>
                        <option value="welcome">Welcome</option>
                        <option value="greeting">Greeting</option>
                        <option value="announcement">Announcement</option>
                        <option value="celebration">Celebration</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <textarea
                      id="description"
                      {...register('description')}
                      placeholder="Describe this content template"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="contentType">Content Type</Label>
                      <select
                        id="contentType"
                        {...register('contentType')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="custom">Custom</option>
                        <option value="template">Template</option>
                        <option value="webhook_generated">Webhook Generated</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="duration">Duration (seconds)</Label>
                      <Input
                        id="duration"
                        type="number"
                        min="1"
                        max="300"
                        {...register('template.duration', { 
                          required: 'Duration is required',
                          min: { value: 1, message: 'Minimum duration is 1 second' },
                          max: { value: 300, message: 'Maximum duration is 300 seconds' }
                        })}
                        placeholder="30"
                      />
                      {errors.template?.duration && (
                        <p className="text-sm text-red-600 mt-1">{errors.template.duration.message}</p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isTemplate"
                          {...register('isTemplate')}
                        />
                        <Label htmlFor="isTemplate">Is Template</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isActive"
                          {...register('isActive')}
                        />
                        <Label htmlFor="isActive">Active</Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Background */}
            <TabsContent value="background" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Background</CardTitle>
                  <CardDescription>
                    Configure the background color, image, or video
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="backgroundType">Background Type</Label>
                      <select
                        id="backgroundType"
                        {...register('template.background.type')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="color">Solid Color</option>
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="backgroundValue">
                        {watch('template.background.type') === 'color' ? 'Color' :
                         watch('template.background.type') === 'image' ? 'Image URL' : 'Video URL'}
                      </Label>
                      {watch('template.background.type') === 'color' ? (
                        <Input
                          id="backgroundValue"
                          type="color"
                          {...register('template.background.value')}
                        />
                      ) : (
                        <Input
                          id="backgroundValue"
                          type="url"
                          {...register('template.background.value')}
                          placeholder={`Enter ${watch('template.background.type')} URL`}
                        />
                      )}
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <h4 className="font-medium mb-2">Preview</h4>
                    <div 
                      className="w-full h-32 border border-gray-300 rounded flex items-center justify-center"
                      style={{
                        backgroundColor: watch('template.background.type') === 'color' 
                          ? watch('template.background.value') 
                          : '#f3f4f6'
                      }}
                    >
                      {watch('template.background.type') === 'color' ? (
                        <span className="text-sm text-gray-600">Background Color</span>
                      ) : (
                        <span className="text-sm text-gray-600">
                          {watch('template.background.type')} Background
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Elements */}
            <TabsContent value="elements" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Content Elements</CardTitle>
                      <CardDescription>
                        Add text, images, videos, and special effects
                      </CardDescription>
                    </div>
                    <Button type="button" onClick={addElement}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Element
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {elements.length === 0 ? (
                    <div className="text-center py-8">
                      <Type className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Elements Added</h3>
                      <p className="text-gray-500 mb-4">Add your first element to start building your content</p>
                      <Button type="button" onClick={addElement} variant="outline">
                        Add Element
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {elements.map((element, index) => {
                        const ElementIcon = getElementIcon(element.type);
                        return (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <ElementIcon className="h-4 w-4" />
                                <span className="font-medium">Element #{index + 1}</span>
                                <Badge variant="outline">{element.type}</Badge>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeElement(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                              <div>
                                <Label>Type</Label>
                                <select
                                  value={element.type}
                                  onChange={(e) => updateElement(index, 'type', e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="text">Text</option>
                                  <option value="image">Image</option>
                                  <option value="video">Video</option>
                                  <option value="confetti">Confetti</option>
                                </select>
                              </div>
                              
                              <div>
                                <Label>Content</Label>
                                <Input
                                  value={element.content}
                                  onChange={(e) => updateElement(index, 'content', e.target.value)}
                                  placeholder="Enter content"
                                  className="text-sm"
                                />
                              </div>
                              
                              <div>
                                <Label>Position (X, Y)</Label>
                                <div className="flex gap-1">
                                  <Input
                                    type="number"
                                    value={element.position.x}
                                    onChange={(e) => updateElement(index, 'position', {
                                      ...element.position,
                                      x: parseInt(e.target.value) || 0
                                    })}
                                    placeholder="X"
                                    className="text-sm"
                                  />
                                  <Input
                                    type="number"
                                    value={element.position.y}
                                    onChange={(e) => updateElement(index, 'position', {
                                      ...element.position,
                                      y: parseInt(e.target.value) || 0
                                    })}
                                    placeholder="Y"
                                    className="text-sm"
                                  />
                                </div>
                              </div>
                              
                              {element.type === 'text' && (
                                <div>
                                  <Label>Font Size</Label>
                                  <Input
                                    value={element.style?.fontSize || '24px'}
                                    onChange={(e) => updateElement(index, 'style', {
                                      ...element.style,
                                      fontSize: e.target.value
                                    })}
                                    placeholder="24px"
                                    className="text-sm"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Animations */}
            <TabsContent value="animations" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Animations</CardTitle>
                      <CardDescription>
                        Add entrance and transition animations to elements
                      </CardDescription>
                    </div>
                    <Button type="button" onClick={addAnimation} disabled={elements.length === 0}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Animation
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {animations.length === 0 ? (
                    <div className="text-center py-8">
                      <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Animations Added</h3>
                      <p className="text-gray-500 mb-4">
                        {elements.length === 0 
                          ? 'Add elements first, then you can add animations'
                          : 'Add animations to bring your content to life'
                        }
                      </p>
                      <Button 
                        type="button" 
                        onClick={addAnimation} 
                        variant="outline"
                        disabled={elements.length === 0}
                      >
                        Add Animation
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {animations.map((animation, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-4 w-4" />
                              <span className="font-medium">Animation #{index + 1}</span>
                              <Badge variant="outline">{animation.type}</Badge>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAnimation(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                            <div>
                              <Label>Target Element</Label>
                              <select
                                value={animation.element}
                                onChange={(e) => updateAnimation(index, 'element', parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                {elements.map((_, elemIndex) => (
                                  <option key={elemIndex} value={elemIndex}>
                                    Element #{elemIndex + 1}
                                  </option>
                                ))}
                              </select>
                            </div>
                            
                            <div>
                              <Label>Animation Type</Label>
                              <select
                                value={animation.type}
                                onChange={(e) => updateAnimation(index, 'type', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="fadeIn">Fade In</option>
                                <option value="slideIn">Slide In</option>
                                <option value="bounce">Bounce</option>
                                <option value="pulse">Pulse</option>
                                <option value="zoom">Zoom</option>
                              </select>
                            </div>
                            
                            <div>
                              <Label>Duration (s)</Label>
                              <Input
                                type="number"
                                min="0.1"
                                max="10"
                                step="0.1"
                                value={animation.duration}
                                onChange={(e) => updateAnimation(index, 'duration', parseFloat(e.target.value) || 1)}
                                className="text-sm"
                              />
                            </div>
                            
                            <div>
                              <Label>Delay (s)</Label>
                              <Input
                                type="number"
                                min="0"
                                max="10"
                                step="0.1"
                                value={animation.delay || 0}
                                onChange={(e) => updateAnimation(index, 'delay', parseFloat(e.target.value) || 0)}
                                className="text-sm"
                              />
                            </div>
                            
                            <div>
                              <Label>Easing</Label>
                              <select
                                value={animation.easing || 'ease-in-out'}
                                onChange={(e) => updateAnimation(index, 'easing', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="ease-in">Ease In</option>
                                <option value="ease-out">Ease Out</option>
                                <option value="ease-in-out">Ease In Out</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Variables */}
            <TabsContent value="variables" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Template Variables</CardTitle>
                      <CardDescription>
                        Define variables that can be customized when using this content
                      </CardDescription>
                    </div>
                    <Button type="button" onClick={addVariable}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Variable
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {Object.keys(variables).length === 0 ? (
                    <div className="text-center py-8">
                      <Type className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Variables Defined</h3>
                      <p className="text-gray-500 mb-4">
                        Add variables to make your content template dynamic and reusable
                      </p>
                      <Button type="button" onClick={addVariable} variant="outline">
                        Add Variable
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(variables).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                          <div className="flex-1">
                            <Label className="text-sm font-medium">{key}</Label>
                            <Input
                              value={value}
                              onChange={(e) => updateVariable(key, e.target.value)}
                              placeholder="Default value"
                              className="mt-1"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeVariable(key)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </div>
    </DashboardLayout>
  );
} 