'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Plus, Settings, Save, Play, Eye, Copy, Share2, Trash2, 
  BarChart3, PieChart, LineChart, Table, Gauge, Calendar,
  Filter, Database, Palette, Grid, Layout, Type, Image,
  Target, DollarSign, TrendingUp, TrendingDown, MapPin,
  Clock, FileText, Users, Activity, Zap, Download,
  PanelLeftOpen, PanelLeftClose, PanelRightOpen, PanelRightClose,
  Maximize2, Minimize2, Search, Magnet, Ruler, History, Layers,
  Scissors, Move, RotateCcw, RotateCw, Maximize, Minimize
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import { 
  createReportBuilder, 
  updateReportBuilder, 
  getAvailableDataSourcesForReports,
  executeReportBuilder 
} from '@/app/utils/api';
import { WidgetVisualization } from './WidgetVisualizations';
import toast from 'react-hot-toast';

interface Widget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'gauge' | 'calendar' | 'text' | 'filter' | 'map' | 'timeline';
  title: string;
  position: { x: number; y: number; w: number; h: number };
  dataSource: {
    sourceId: string;
    aggregation?: string;
    groupBy?: string[];
    field?: string;
    filters?: Record<string, any>;
    orderBy?: Array<{ field: string; direction: 'ASC' | 'DESC' }>;
    limit?: number;
    formula?: string; // Added for calculation widgets
  };
  config?: Record<string, any>;
}

interface DataSource {
  id: string;
  name: string;
  type: string;
  schema: Record<string, { type: string; label: string }>;
}

interface ReportBuilder {
  id?: string;
  name: string;
  description: string;
  layout: {
    type: 'grid';
    columns: number;
    rows?: string;
    gap?: number;
    responsive?: boolean;
    breakpoints?: {
      mobile?: number;
      tablet?: number;
      desktop?: number;
    };
  };
  theme?: {
    primaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    borderRadius?: number;
    shadow?: string;
    fontFamily?: string;
    fontSize?: Record<string, number>;
  };
  dataSources: DataSource[];
  widgets: Widget[];
  refreshInterval?: number;
  isPublic?: boolean;
  tags?: string[];
  filters?: {
    dateRange?: {
      enabled: boolean;
      default: string;
      options: string[];
    };
    sources?: {
      enabled: boolean;
      multiple: boolean;
      default: string[];
    };
  };
  exportFormats?: string[];
}

interface CustomReportBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  report?: ReportBuilder | null;
  onSave: () => void;
}

const WIDGET_TYPES = [
  { 
    type: 'metric', 
    label: 'Metric', 
    icon: Target, 
    description: 'Single value display with comparison',
    configSchema: {
      format: { type: 'select', options: ['number', 'currency', 'percent', 'decimal'], default: 'number' },
      decimals: { type: 'number', default: 2 },
      prefix: { type: 'text', default: '' },
      suffix: { type: 'text', default: '' },
      comparison: { type: 'object', default: { enabled: true, type: 'previous_period' } },
      icon: { type: 'text', default: 'trending-up' },
      size: { type: 'select', options: ['small', 'medium', 'large', 'xl'], default: 'large' },
      conditionalFormatting: { type: 'array', default: [] }
    }
  },
  { 
    type: 'chart', 
    label: 'Chart', 
    icon: BarChart3, 
    description: 'Bar, line, pie, or area charts',
    configSchema: {
      type: { type: 'select', options: ['line', 'bar', 'area', 'pie', 'donut', 'scatter', 'bubble'], default: 'bar' },
      xAxis: { type: 'object', default: { field: 'date', type: 'time' } },
      yAxis: { type: 'object', default: { field: 'value', type: 'linear' } },
      series: { type: 'array', default: [] },
      legend: { type: 'object', default: { enabled: true, position: 'top' } },
      tooltip: { type: 'object', default: { enabled: true } },
      interactions: { type: 'object', default: { zoom: true, pan: true } },
      animation: { type: 'object', default: { enabled: true, duration: 1000 } }
    }
  },
  { 
    type: 'table', 
    label: 'Table', 
    icon: Table, 
    description: 'Data table with sorting and filtering',
    configSchema: {
      columns: { type: 'array', default: [] },
      pageSize: { type: 'number', default: 25 },
      showPagination: { type: 'boolean', default: true },
      showSearch: { type: 'boolean', default: true },
      showFilters: { type: 'boolean', default: true },
      striped: { type: 'boolean', default: true },
      bordered: { type: 'boolean', default: true },
      hoverable: { type: 'boolean', default: true },
      rowSelection: { type: 'object', default: { enabled: false, multiple: true } }
    }
  },
  { 
    type: 'gauge', 
    label: 'Gauge', 
    icon: Gauge, 
    description: 'Circular or linear progress indicator',
    configSchema: {
      gaugeType: { type: 'select', options: ['circular', 'linear', 'bullet'], default: 'circular' },
      min: { type: 'number', default: 0 },
      max: { type: 'number', default: 100 },
      target: { type: 'number', default: null },
      segments: { type: 'array', default: [] },
      showValue: { type: 'boolean', default: true },
      showTarget: { type: 'boolean', default: true },
      thickness: { type: 'number', default: 20 },
      animation: { type: 'object', default: { enabled: true, duration: 1500 } }
    }
  },
  { 
    type: 'text', 
    label: 'Text', 
    icon: FileText, 
    description: 'Rich text with markdown support',
    configSchema: {
      content: { type: 'textarea', default: '' },
      markdown: { type: 'boolean', default: true },
      variables: { type: 'boolean', default: true },
      align: { type: 'select', options: ['left', 'center', 'right', 'justify'], default: 'left' },
      fontSize: { type: 'select', options: ['xs', 'sm', 'base', 'lg', 'xl'], default: 'base' },
      fontWeight: { type: 'select', options: ['normal', 'medium', 'semibold', 'bold'], default: 'normal' }
    }
  },
  { 
    type: 'filter', 
    label: 'Filter', 
    icon: Filter, 
    description: 'Interactive filters for other widgets',
    configSchema: {
      filters: { type: 'array', default: [] },
      layout: { type: 'select', options: ['horizontal', 'vertical'], default: 'horizontal' },
      showApplyButton: { type: 'boolean', default: false },
      collapsible: { type: 'boolean', default: true },
      defaultCollapsed: { type: 'boolean', default: false }
    }
  },
  { 
    type: 'map', 
    label: 'Map', 
    icon: MapPin, 
    description: 'Geographic data visualization',
    configSchema: {
      mapType: { type: 'select', options: ['markers', 'heatmap', 'choropleth'], default: 'markers' },
      center: { type: 'object', default: { lat: 39.8283, lng: -98.5795 } },
      zoom: { type: 'number', default: 4 },
      style: { type: 'select', options: ['streets', 'satellite', 'dark', 'light'], default: 'streets' },
      markers: { type: 'object', default: { clustering: true, popup: { enabled: true } } }
    }
  },
  { 
    type: 'timeline', 
    label: 'Timeline', 
    icon: Clock, 
    description: 'Temporal event visualization',
    configSchema: {
      orientation: { type: 'select', options: ['horizontal', 'vertical'], default: 'horizontal' },
      groupBy: { type: 'text', default: 'leadId' },
      events: { type: 'object', default: { startField: 'startDate', titleField: 'eventName' } },
      showToday: { type: 'boolean', default: true },
      timeAxis: { type: 'object', default: { scale: 'days', format: 'MMM DD' } },
      selectable: { type: 'boolean', default: true },
      zoomable: { type: 'boolean', default: true }
    }
  }
];

// Mock data for visualization
const MOCK_DATA = {
  revenue: [
    { date: '2024-01-01', value: 15000, target: 12000 },
    { date: '2024-01-02', value: 18000, target: 12000 },
    { date: '2024-01-03', value: 22000, target: 12000 },
    { date: '2024-01-04', value: 19000, target: 12000 },
    { date: '2024-01-05', value: 25000, target: 12000 }
  ],
  leads: [
    { source: 'Google Ads', count: 150, conversions: 45 },
    { source: 'Facebook', count: 120, conversions: 38 },
    { source: 'Direct', count: 80, conversions: 25 },
    { source: 'Email', count: 60, conversions: 18 }
  ],
  agents: [
    { name: 'John Doe', calls: 150, conversions: 25, satisfaction: 4.8 },
    { name: 'Jane Smith', calls: 140, conversions: 22, satisfaction: 4.6 },
    { name: 'Mike Johnson', calls: 130, conversions: 20, satisfaction: 4.7 }
  ]
};

export default function CustomReportBuilder({ isOpen, onClose, report, onSave }: CustomReportBuilderProps) {
  const [formData, setFormData] = useState<ReportBuilder>({
    name: '',
    description: '',
    layout: {
      type: 'grid',
      columns: 12,
      rows: 'auto',
      gap: 16,
      responsive: true,
      breakpoints: {
        mobile: 768,
        tablet: 1024,
        desktop: 1440
      }
    },
    theme: {
      primaryColor: '#3B82F6',
      backgroundColor: '#FFFFFF',
      textColor: '#1F2937',
      borderRadius: 8,
      shadow: 'sm',
      fontFamily: 'Inter, sans-serif',
      fontSize: {
        xs: 12,
        sm: 14,
        base: 16,
        lg: 18,
        xl: 20
      }
    },
    dataSources: [],
    widgets: [],
    refreshInterval: 300,
    isPublic: false,
    tags: [],
    filters: {
      dateRange: {
        enabled: true,
        default: 'last_30_days',
        options: ['today', 'yesterday', 'last_7_days', 'last_30_days', 'custom']
      },
      sources: {
        enabled: true,
        multiple: true,
        default: ['all']
      }
    },
    exportFormats: ['pdf', 'excel', 'csv']
  });

  const [availableDataSources, setAvailableDataSources] = useState<DataSource[]>([]);
  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'canvas' | 'properties' | 'data' | 'theme'>('canvas');
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [draggingWidgetId, setDraggingWidgetId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{x: number, y: number} | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // New UI state for full-screen experience
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showRulers, setShowRulers] = useState(true);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  
  // Advanced UI state
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    widgetId: string | null;
  }>({ visible: false, x: 0, y: 0, widgetId: null });
  
  const [multiSelect, setMultiSelect] = useState<string[]>([]);
  const [selectionBox, setSelectionBox] = useState<{
    start: { x: number; y: number } | null;
    end: { x: number; y: number } | null;
  }>({ start: null, end: null });
  
  const [showSnapLines, setShowSnapLines] = useState(false);
  const [snapLines, setSnapLines] = useState<{
    vertical: number[];
    horizontal: number[];
  }>({ vertical: [], horizontal: [] });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Helper for grid size
  const gridSize = 40; // px per grid cell

  // Enhanced drag handlers for smooth movement
  const handleWidgetMouseDown = (e: React.MouseEvent, widget: Widget) => {
    e.stopPropagation();
    setDraggingWidgetId(widget.id);
    setDragOffset({
      x: e.clientX - (widget.position.x * gridSize),
      y: e.clientY - (widget.position.y * gridSize)
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingWidgetId || !dragOffset) return;
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    let x = e.clientX - rect.left - dragOffset.x;
    let y = e.clientY - rect.top - dragOffset.y;
    
    // Constrain to canvas bounds
    x = Math.max(0, x);
    y = Math.max(0, y);
    
    let newX = x / gridSize;
    let newY = y / gridSize;
    
    if (snapToGrid && snapEnabled) {
      newX = Math.round(newX);
      newY = Math.round(newY);
    }
    
    // Update widget position smoothly
    setFormData(prev => ({
      ...prev,
      widgets: prev.widgets.map(w => w.id === draggingWidgetId ? {
        ...w,
        position: { ...w.position, x: newX, y: newY }
      } : w)
    }));
    
    setHasUnsavedChanges(true);
  }, [draggingWidgetId, dragOffset, snapToGrid, snapEnabled]);

  useEffect(() => {
    if (draggingWidgetId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', () => {
        setDraggingWidgetId(null);
        setDragOffset(null);
      }, { once: true });
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
      };
    }
  }, [draggingWidgetId, handleMouseMove]);

  useEffect(() => {
    if (report) {
      setFormData(report);
    } else {
      setFormData({
        name: '',
        description: '',
        layout: {
          type: 'grid',
          columns: 12,
          rows: 'auto',
          gap: 16,
          responsive: true,
          breakpoints: {
            mobile: 768,
            tablet: 1024,
            desktop: 1440
          }
        },
        theme: {
          primaryColor: '#3B82F6',
          backgroundColor: '#FFFFFF',
          textColor: '#1F2937',
          borderRadius: 8,
          shadow: 'sm',
          fontFamily: 'Inter, sans-serif',
          fontSize: {
            xs: 12,
            sm: 14,
            base: 16,
            lg: 18,
            xl: 20
          }
        },
        dataSources: [],
        widgets: [],
        refreshInterval: 300,
        isPublic: false,
        tags: [],
        filters: {
          dateRange: {
            enabled: true,
            default: 'last_30_days',
            options: ['today', 'yesterday', 'last_7_days', 'last_30_days', 'custom']
          },
          sources: {
            enabled: true,
            multiple: true,
            default: ['all']
          }
        },
        exportFormats: ['pdf', 'excel', 'csv']
      });
    }
    fetchDataSources();
  }, [report]);

  const fetchDataSources = async () => {
    try {
      const sources = await getAvailableDataSourcesForReports();
      setAvailableDataSources(sources);
    } catch (error) {
      console.error('Error fetching data sources:', error);
      toast.error('Failed to load data sources');
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a report name');
      return;
    }

    setIsLoading(true);
    try {
      if (report?.id) {
        await updateReportBuilder(report.id, formData);
        toast.success('Report updated successfully');
      } else {
        await createReportBuilder(formData);
        toast.success('Report created successfully');
      }
      setHasUnsavedChanges(false);
      setLastAutoSave(new Date());
      onSave();
    } catch (error) {
      console.error('Error saving report:', error);
      toast.error('Failed to save report');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !hasUnsavedChanges) return;

    const autoSaveTimer = setTimeout(() => {
      if (formData.name.trim()) {
        handleSave();
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearTimeout(autoSaveTimer);
  }, [hasUnsavedChanges, autoSave, formData.name]);

  const handleExecute = async () => {
    if (!report?.id) {
      toast.error('Please save the report first');
      return;
    }

    setIsExecuting(true);
    try {
      const result = await executeReportBuilder(report.id, {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      });
      setExecutionResult(result);
      setShowPreview(true);
      toast.success('Report executed successfully');
    } catch (error) {
      console.error('Error executing report:', error);
      toast.error('Failed to execute report');
    } finally {
      setIsExecuting(false);
    }
  };

  const handlePreview = () => {
    if (formData.widgets.length === 0) {
      toast.error('Please add at least one widget to preview');
      return;
    }
    setShowPreview(true);
  };

  const addWidget = (widgetType: string) => {
    const widgetConfig = WIDGET_TYPES.find(w => w.type === widgetType);
    const newWidget: Widget = {
      id: `widget-${Date.now()}`,
      type: widgetType as any,
      title: `New ${widgetType.charAt(0).toUpperCase() + widgetType.slice(1)}`,
      position: { x: 0, y: 0, w: 6, h: 4 },
      dataSource: {
        sourceId: availableDataSources[0]?.id || '',
        aggregation: 'count'
      },
      config: widgetConfig ? Object.fromEntries(
        Object.entries(widgetConfig.configSchema).map(([key, schema]) => [
          key, 
          (schema as any).default
        ])
      ) : {}
    };

    setFormData(prev => ({
      ...prev,
      widgets: [...prev.widgets, newWidget]
    }));
    setSelectedWidget(newWidget);
  };

  const updateWidget = (widgetId: string, updates: Partial<Widget>) => {
    setFormData(prev => ({
      ...prev,
      widgets: prev.widgets.map(widget => 
        widget.id === widgetId ? { ...widget, ...updates } : widget
      )
    }));

    if (selectedWidget?.id === widgetId) {
      setSelectedWidget(prev => prev ? { ...prev, ...updates } : null);
    }
    
    setHasUnsavedChanges(true);
  };

  // Sync function for backend updates
  const syncWidgetToBackend = async (widgetId: string) => {
    try {
      const widget = formData.widgets.find(w => w.id === widgetId);
      if (widget && report?.id) {
        await updateReportBuilder(report.id, formData);
      }
    } catch (error) {
      console.error('Error syncing widget to backend:', error);
    }
  };

  const deleteWidget = (widgetId: string) => {
    setFormData(prev => ({
      ...prev,
      widgets: prev.widgets.filter(widget => widget.id !== widgetId)
    }));

    if (selectedWidget?.id === widgetId) {
      setSelectedWidget(null);
    }
    setHasUnsavedChanges(true);
  };

  // Advanced widget operations
  const handleDeleteWidgets = (widgetIds: string[]) => {
    setFormData(prev => ({
      ...prev,
      widgets: prev.widgets.filter(widget => !widgetIds.includes(widget.id))
    }));
    setMultiSelect([]);
    setHasUnsavedChanges(true);
  };

  const handleCopyWidgets = (widgetIds: string[]) => {
    const widgetsToCopy = formData.widgets.filter(widget => widgetIds.includes(widget.id));
    localStorage.setItem('copiedWidgets', JSON.stringify(widgetsToCopy));
  };

  const handleCutWidgets = (widgetIds: string[]) => {
    handleCopyWidgets(widgetIds);
    handleDeleteWidgets(widgetIds);
  };

  const handlePasteWidgets = () => {
    const copiedWidgets = localStorage.getItem('copiedWidgets');
    if (copiedWidgets) {
      const widgets = JSON.parse(copiedWidgets);
      const newWidgets = widgets.map((widget: Widget) => ({
        ...widget,
        id: `${widget.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        position: {
          ...widget.position,
          x: widget.position.x + 1,
          y: widget.position.y + 1
        }
      }));
      
      setFormData(prev => ({
        ...prev,
        widgets: [...prev.widgets, ...newWidgets]
      }));
      setHasUnsavedChanges(true);
    }
  };

  // Context menu handlers
  const handleContextMenu = (e: React.MouseEvent, widgetId: string) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      widgetId
    });
  };

  const handleWidgetClick = (e: React.MouseEvent, widgetId: string) => {
    if (e.ctrlKey || e.metaKey) {
      // Multi-select
      setMultiSelect(prev => 
        prev.includes(widgetId) 
          ? prev.filter(id => id !== widgetId)
          : [...prev, widgetId]
      );
    } else {
      // Single select
      setMultiSelect([widgetId]);
      setSelectedWidget(formData.widgets.find(w => w.id === widgetId) || null);
    }
  };

  const generateMockData = (widget: Widget) => {
    const { type, config } = widget;
    
    switch (type) {
      case 'metric':
        return {
          value: 15420,
          previousValue: 13700,
          change: 12.5,
          isPositive: true
        };

      case 'chart':
        const chartData = [
          { name: 'Jan', value: 400, target: 350 },
          { name: 'Feb', value: 300, target: 350 },
          { name: 'Mar', value: 600, target: 350 },
          { name: 'Apr', value: 800, target: 350 },
          { name: 'May', value: 500, target: 350 },
          { name: 'Jun', value: 700, target: 350 }
        ];
        
        if (config?.type === 'pie' || config?.type === 'donut') {
          return [
            { name: 'Google Ads', value: 150 },
            { name: 'Facebook', value: 120 },
            { name: 'Direct', value: 80 },
            { name: 'Email', value: 60 },
            { name: 'Referral', value: 40 }
          ];
        }
        
        return chartData;

      case 'table':
        return [
          { id: 1, name: 'John Doe', status: 'Active', revenue: 15000, source: 'Google Ads', createdAt: '2024-01-15' },
          { id: 2, name: 'Jane Smith', status: 'Inactive', revenue: 12000, source: 'Facebook', createdAt: '2024-01-14' },
          { id: 3, name: 'Mike Johnson', status: 'Active', revenue: 18000, source: 'Direct', createdAt: '2024-01-13' },
          { id: 4, name: 'Sarah Wilson', status: 'Active', revenue: 22000, source: 'Email', createdAt: '2024-01-12' },
          { id: 5, name: 'David Brown', status: 'Inactive', revenue: 9000, source: 'Referral', createdAt: '2024-01-11' }
        ];

      case 'gauge':
        return {
          value: 75,
          target: 80,
          min: 0,
          max: 100
        };

      case 'text':
        return {
          content: config?.content || '## Sample Report\n\nThis is a sample text widget with **markdown** support.\n\n- Point 1\n- Point 2\n- Point 3'
        };

      case 'filter':
        return {
          filters: [
            { id: 'dateRange', type: 'dateRange', label: 'Date Range', value: 'Last 30 Days' },
            { id: 'source', type: 'multiSelect', label: 'Lead Source', value: 'All Sources' },
            { id: 'status', type: 'select', label: 'Status', value: 'All Statuses' }
          ]
        };

      case 'map':
        return [
          { lat: 40.7128, lng: -74.0060, name: 'New York', value: 150, status: 'Active' },
          { lat: 34.0522, lng: -118.2437, name: 'Los Angeles', value: 120, status: 'Active' },
          { lat: 41.8781, lng: -87.6298, name: 'Chicago', value: 90, status: 'Inactive' },
          { lat: 29.7604, lng: -95.3698, name: 'Houston', value: 80, status: 'Active' },
          { lat: 33.7490, lng: -84.3880, name: 'Atlanta', value: 70, status: 'Active' }
        ];

      case 'timeline':
        return [
          { date: '2024-01-01', event: 'Lead Created', status: 'completed', leadId: 'L001' },
          { date: '2024-01-03', event: 'First Contact', status: 'completed', leadId: 'L001' },
          { date: '2024-01-07', event: 'Proposal Sent', status: 'completed', leadId: 'L001' },
          { date: '2024-01-10', event: 'Deal Closed', status: 'completed', leadId: 'L001' },
          { date: '2024-01-02', event: 'Lead Created', status: 'completed', leadId: 'L002' },
          { date: '2024-01-05', event: 'First Contact', status: 'pending', leadId: 'L002' }
        ];

      default:
        return null;
    }
  };

  const renderWidgetPreview = (widget: Widget) => {
    return (
      <WidgetVisualization 
        widget={widget} 
        theme={formData.theme} 
        isPreview={true}
      />
    );
  };

  const renderWidgetProperties = () => {
    if (!selectedWidget) return null;

    const widgetConfig = WIDGET_TYPES.find(w => w.type === selectedWidget.type);
    
    return (
      <div className="space-y-6">
        {/* Basic Properties */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Basic Properties</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={selectedWidget.title}
                onChange={(e) => updateWidget(selectedWidget.id, { title: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Source
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={selectedWidget.dataSource.sourceId}
                onChange={(e) => updateWidget(selectedWidget.id, {
                  dataSource: { ...selectedWidget.dataSource, sourceId: e.target.value }
                })}
              >
                <option value="">Select data source</option>
                {availableDataSources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Aggregation
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={selectedWidget.dataSource.aggregation || 'count'}
                onChange={(e) => updateWidget(selectedWidget.id, {
                  dataSource: { ...selectedWidget.dataSource, aggregation: e.target.value }
                })}
              >
                <option value="count">Count</option>
                <option value="sum">Sum</option>
                <option value="avg">Average</option>
                <option value="min">Minimum</option>
                <option value="max">Maximum</option>
              </select>
            </div>
          </div>
        </div>

        {/* Position & Size */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Position & Size</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">X</label>
              <input
                type="number"
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                value={selectedWidget.position.x}
                onChange={(e) => updateWidget(selectedWidget.id, {
                  position: { ...selectedWidget.position, x: parseInt(e.target.value) || 0 }
                })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Y</label>
              <input
                type="number"
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                value={selectedWidget.position.y}
                onChange={(e) => updateWidget(selectedWidget.id, {
                  position: { ...selectedWidget.position, y: parseInt(e.target.value) || 0 }
                })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Width</label>
              <input
                type="number"
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                value={selectedWidget.position.w}
                onChange={(e) => updateWidget(selectedWidget.id, {
                  position: { ...selectedWidget.position, w: parseInt(e.target.value) || 1 }
                })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Height</label>
              <input
                type="number"
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                value={selectedWidget.position.h}
                onChange={(e) => updateWidget(selectedWidget.id, {
                  position: { ...selectedWidget.position, h: parseInt(e.target.value) || 1 }
                })}
              />
            </div>
          </div>
        </div>

        {/* Widget-specific Configuration */}
        {widgetConfig && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Configuration</h4>
            <div className="space-y-3">
              {Object.entries(widgetConfig.configSchema).map(([key, schema]) => {
                const schemaConfig = schema as any;
                const value = selectedWidget.config?.[key] ?? schemaConfig.default;

                switch (schemaConfig.type) {
                  case 'select':
                    return (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          value={value}
                          onChange={(e) => updateWidget(selectedWidget.id, {
                            config: { ...selectedWidget.config, [key]: e.target.value }
                          })}
                        >
                          {schemaConfig.options.map((option: string) => (
                            <option key={option} value={option}>
                              {option.charAt(0).toUpperCase() + option.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                    );

                  case 'number':
                    return (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          value={value}
                          onChange={(e) => updateWidget(selectedWidget.id, {
                            config: { ...selectedWidget.config, [key]: parseFloat(e.target.value) || 0 }
                          })}
                        />
                      </div>
                    );

                  case 'boolean':
                    return (
                      <div key={key} className="flex items-center">
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={value}
                          onChange={(e) => updateWidget(selectedWidget.id, {
                            config: { ...selectedWidget.config, [key]: e.target.checked }
                          })}
                        />
                        <label className="text-sm font-medium text-gray-700">
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </label>
                      </div>
                    );

                  case 'text':
                  case 'textarea':
                    return (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </label>
                        {schemaConfig.type === 'textarea' ? (
                          <textarea
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            rows={3}
                            value={value}
                            onChange={(e) => updateWidget(selectedWidget.id, {
                              config: { ...selectedWidget.config, [key]: e.target.value }
                            })}
                          />
                        ) : (
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            value={value}
                            onChange={(e) => updateWidget(selectedWidget.id, {
                              config: { ...selectedWidget.config, [key]: e.target.value }
                            })}
                          />
                        )}
                      </div>
                    );

                  default:
                    return null;
                }
              })}
            </div>
          </div>
        )}
        {selectedWidget && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Calculation (Advanced)</h4>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Source Type</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={selectedWidget.dataSource.sourceId === 'calculation' ? 'calculation' : 'data'}
                onChange={e => {
                  if (e.target.value === 'calculation') {
                    updateWidget(selectedWidget.id, {
                      dataSource: { ...selectedWidget.dataSource, sourceId: 'calculation', formula: '' }
                    });
                  } else {
                    updateWidget(selectedWidget.id, {
                      dataSource: { ...selectedWidget.dataSource, sourceId: availableDataSources[0]?.id || '' }
                    });
                  }
                }}
              >
                <option value="data">Data Source</option>
                <option value="calculation">Calculation</option>
              </select>
              {selectedWidget.dataSource.sourceId === 'calculation' && (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Formula</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    value={selectedWidget.dataSource.formula || ''}
                    onChange={e => updateWidget(selectedWidget.id, {
                      dataSource: { ...selectedWidget.dataSource, formula: e.target.value }
                    })}
                    placeholder="e.g. widgetA.value + widgetB.value"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Reference other widgets by their title or ID. Example: <code>widget-123.value + widget-456.value</code>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Enhanced keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputField = target instanceof HTMLInputElement || 
                          target instanceof HTMLTextAreaElement ||
                          target.isContentEditable ||
                          target.tagName === 'INPUT' ||
                          target.tagName === 'TEXTAREA';
      
      if (isInputField) return;

      // Toggle fullscreen (F11)
      if (e.key === 'F11') {
        e.preventDefault();
        setIsFullscreen(!isFullscreen);
      }

      // Toggle snap to grid (Ctrl+G)
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        setSnapToGrid(!snapToGrid);
      }

      // Toggle rulers (Ctrl+R)
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        setShowRulers(!showRulers);
      }

      // Delete selected widgets
      if (e.key === 'Delete' && multiSelect.length > 0) {
        e.preventDefault();
        handleDeleteWidgets(multiSelect);
      }

      // Copy/Cut/Paste
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'c') {
          e.preventDefault();
          handleCopyWidgets(multiSelect);
        }
        if (e.key === 'v') {
          e.preventDefault();
          handlePasteWidgets();
        }
        if (e.key === 'x') {
          e.preventDefault();
          handleCutWidgets(multiSelect);
        }
        if (e.key === 'a') {
          e.preventDefault();
          setMultiSelect(formData.widgets.map(w => w.id));
        }
        if (e.key === 'z') {
          e.preventDefault();
          // TODO: Implement undo
        }
        if (e.key === 'y') {
          e.preventDefault();
          // TODO: Implement redo
        }
      }

      // Escape to close
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
        setContextMenu({ visible: false, x: 0, y: 0, widgetId: null });
        setMultiSelect([]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen, snapToGrid, showRulers, onClose, multiSelect]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu({ visible: false, x: 0, y: 0, widgetId: null });
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  return (
    <div 
      className={`h-screen w-full flex flex-col bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
      style={{ 
        touchAction: 'manipulation',
        userSelect: 'none',
        overflow: 'hidden'
      }}
    >
      <style jsx>{`
        .dragging {
          transform: scale(1.02) rotate(1deg);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        
        .drop-animation {
          animation: dropIn 0.3s ease-out;
        }
        
        @keyframes dropIn {
          0% {
            transform: scale(1.1) translateY(-10px);
            opacity: 0.8;
          }
          100% {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }
        
        .resize-handle:hover {
          background-color: #3B82F6 !important;
          transform: scale(1.2);
        }
        
        .widget-enter {
          animation: widgetEnter 0.3s ease-out;
        }
        
        @keyframes widgetEnter {
          from {
            opacity: 0;
            transform: scale(0.8) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
      {/* Enhanced Top Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          {/* Left Section - Project Info & Controls */}
          <div className="flex items-center space-x-2 min-w-0">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="flex items-center space-x-2">
                <div className="flex flex-col space-y-1">
                  <div className="relative">
                    <Input
                      value={formData.name}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, name: e.target.value }));
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="Enter report name..."
                      className={`h-8 px-2 text-lg font-semibold border-0 bg-transparent hover:bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 min-w-[200px] max-w-[300px] ${!formData.name ? 'border-l-4 border-l-orange-400 bg-orange-50' : ''}`}
                      onFocus={(e) => e.target.select()}
                      maxLength={100}
                    />
                    {!formData.name && (
                      <div className="absolute -top-6 left-0 text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                        Report name is required
                      </div>
                    )}
                    <div className="absolute -bottom-6 right-0 text-xs text-gray-400">
                      {formData.name.length}/100
                    </div>
                  </div>
                  <div className="relative">
                    <Input
                      value={formData.description}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, description: e.target.value }));
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="Enter report description..."
                      className="h-6 px-2 text-sm text-gray-600 border-0 bg-transparent hover:bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-300 min-w-[200px] max-w-[300px]"
                      maxLength={200}
                    />
                    <div className="absolute -bottom-6 right-0 text-xs text-gray-400">
                      {formData.description.length}/200
                    </div>
                  </div>
                  <Input
                    value={formData.tags?.join(', ') || ''}
                    onChange={(e) => {
                      const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
                      setFormData(prev => ({ ...prev, tags }));
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Enter tags (comma separated)..."
                    className="h-6 px-2 text-xs text-gray-500 border-0 bg-transparent hover:bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-300 min-w-[200px] max-w-[300px]"
                  />
                </div>
                {hasUnsavedChanges && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs flex-shrink-0">
                    Unsaved
                  </Badge>
                )}
                {!hasUnsavedChanges && lastAutoSave && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs flex-shrink-0">
                    Saved
                  </Badge>
                )}
              </div>
            </div>
            
            <Separator orientation="vertical" className="h-5 hidden md:block" />
            
            {/* Quick Actions */}
            <div className="hidden lg:flex items-center space-x-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handlePreview}
                className="h-8 px-3"
              >
                <Eye className="w-4 h-4 mr-1" />
                Preview
              </Button>
              {report?.id && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExecute}
                  disabled={isExecuting}
                  className="h-8 px-3"
                >
                  <Play className="w-4 h-4 mr-1" />
                  {isExecuting ? 'Executing...' : 'Execute'}
                </Button>
              )}
            </div>
          </div>

          {/* Center Section - Search */}
          <div className="flex-1 max-w-xs mx-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search widgets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center space-x-1 flex-shrink-0">
                         {/* Auto-save indicator */}
             {autoSave && lastAutoSave && (
               <div className="text-xs text-gray-500 mr-1 hidden xl:block">
                 Auto-saved {new Date(lastAutoSave).toLocaleTimeString()}
               </div>
             )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSnapToGrid(!snapToGrid)}
              className={`h-9 px-3 ${snapToGrid ? 'bg-blue-50 text-blue-700' : ''}`}
            >
              <Grid className="w-4 h-4 mr-1" />
              <span className="hidden md:inline">Grid</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRulers(!showRulers)}
              className={`h-9 px-3 ${showRulers ? 'bg-blue-50 text-blue-700' : ''}`}
            >
              <Ruler className="w-4 h-4 mr-1" />
              <span className="hidden md:inline">Rulers</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSnapEnabled(!snapEnabled)}
              className={`h-9 px-3 ${snapEnabled ? 'bg-blue-50 text-blue-700' : ''}`}
            >
              <Magnet className="w-4 h-4 mr-1" />
              <span className="hidden md:inline">Snap</span>
            </Button>
            
            <Button variant="outline" size="sm" onClick={handlePreview} className="h-9">
              <Eye className="w-4 h-4 mr-1" />
              <span className="hidden md:inline">Preview</span>
            </Button>
            
            <Button 
              onClick={() => handleSave()} 
              size="sm" 
              disabled={isLoading || !formData.name.trim()}
              className={`h-9 ${isLoading || !formData.name.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={!formData.name.trim() ? 'Please enter a report name to save' : ''}
            >
              {isLoading ? (
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-1" />
              ) : (
                <Save className="w-4 h-4 mr-1" />
              )}
              <span className="hidden md:inline">Save</span>
            </Button>
            
            <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(!isFullscreen)} className="h-9 w-9 p-0">
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
            
            <Button variant="ghost" size="sm" onClick={onClose} className="h-9 px-3">
              Close
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden min-h-0 w-full">
        {/* Enhanced Left Sidebar */}
        <div className={`${leftPanelCollapsed ? 'w-12' : 'w-64'} bg-white border-r border-gray-200 flex flex-col transition-all duration-200 flex-shrink-0`}>
          <div className="flex items-center justify-between p-3 border-b bg-gray-50">
            {!leftPanelCollapsed && (
              <h2 className="font-medium text-gray-900 text-sm">Widgets & Data</h2>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
              className="h-8 w-8 p-0"
            >
              {leftPanelCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </Button>
          </div>

          {!leftPanelCollapsed && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-4 space-y-6">
                {/* Widgets Section */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Widgets</h3>
                  <div className="space-y-2">
                    {WIDGET_TYPES.map((widget) => (
                      <button
                        key={widget.type}
                        onClick={() => addWidget(widget.type)}
                        className="w-full p-3 text-left bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <widget.icon className="w-5 h-5 text-gray-600" />
                          <div>
                            <div className="font-medium text-sm text-gray-900">{widget.label}</div>
                            <div className="text-xs text-gray-500">{widget.description}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Data Sources Section */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Data Sources</h3>
                  <div className="space-y-2">
                    {availableDataSources.map((source) => (
                      <div
                        key={source.id}
                        className="p-3 bg-white border border-gray-200 rounded-lg"
                      >
                        <div className="font-medium text-sm text-gray-900">{source.name}</div>
                        <div className="text-xs text-gray-500">{source.type}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Canvas Area */}
        <div className="flex-1 flex flex-col min-h-0 bg-gray-100 w-0 overflow-hidden">
          <div className="flex-1 bg-gray-100 p-4 overflow-auto">
            <div
              ref={canvasRef}
              className="bg-white rounded-lg shadow-sm min-h-full relative mx-auto"
              style={{
                background: formData.theme?.backgroundColor || '#FFFFFF',
                color: formData.theme?.textColor || '#1F2937',
                minHeight: 600,
                minWidth: 800,
                maxWidth: '100%'
              }}
            >
              {/* Grid lines overlay */}
              {showRulers && (
                <svg
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                  width="100%" height="100%"
                  style={{ zIndex: 1 }}
                >
                  {Array.from({ length: formData.layout.columns + 1 }).map((_, i) => (
                    <line
                      key={`v-${i}`}
                      x1={i * gridSize}
                      y1={0}
                      x2={i * gridSize}
                      y2={10000}
                      stroke="#e5e7eb"
                      strokeWidth={1}
                    />
                  ))}
                  {Array.from({ length: 30 }).map((_, i) => (
                    <line
                      key={`h-${i}`}
                      x1={0}
                      y1={i * gridSize}
                      x2={10000}
                      y2={i * gridSize}
                      stroke="#e5e7eb"
                      strokeWidth={1}
                    />
                  ))}
                </svg>
              )}
              
              {/* Widgets */}
              {formData.widgets.map((widget) => (
                <div
                  key={widget.id}
                  data-widget-id={widget.id}
                  className={`border-2 rounded-lg cursor-move transition-all absolute bg-white group ${
                    selectedWidget?.id === widget.id 
                      ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200' 
                      : multiSelect.includes(widget.id)
                      ? 'border-purple-500 bg-purple-50 shadow-lg ring-2 ring-purple-200'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${
                    draggingWidgetId === widget.id ? 'z-50' : 'z-10'
                  }`}
                  style={{
                    left: widget.position.x * gridSize,
                    top: widget.position.y * gridSize,
                    width: widget.position.w * gridSize,
                    height: widget.position.h * gridSize,
                  }}
                  onMouseDown={(e) => handleWidgetMouseDown(e, widget)}
                  onClick={(e) => handleWidgetClick(e, widget.id)}
                  onContextMenu={(e) => handleContextMenu(e, widget.id)}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setSelectedWidget(widget);
                  }}
                >
                  {/* Widget Header */}
                  <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg border-b border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-between px-2">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full cursor-nw-resize resize-handle" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full cursor-ne-resize resize-handle" />
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedWidget(widget);
                        }}
                        className="p-1 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-800 transition-colors"
                        title="Properties"
                      >
                        <Settings className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyWidgets([widget.id]);
                        }}
                        className="p-1 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-800 transition-colors"
                        title="Copy"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteWidget(widget.id);
                        }}
                        className="p-1 hover:bg-red-100 rounded text-gray-600 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Widget Content */}
                  <div className="p-2 pt-10 h-full">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm truncate">{widget.title}</h4>
                      <div className="flex items-center space-x-1">
                        {multiSelect.includes(widget.id) && (
                          <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {multiSelect.indexOf(widget.id) + 1}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      {renderWidgetPreview(widget)}
                    </div>
                  </div>

                  {/* Resize Handles */}
                  <div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="w-full h-full bg-blue-500 rounded-bl-lg" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Enhanced Right Sidebar - Properties Panel */}
        <div className={`${rightPanelCollapsed ? 'w-12' : 'w-80'} bg-white border-l border-gray-200 flex flex-col transition-all duration-200 flex-shrink-0`}>
          <div className="flex items-center justify-between p-3 border-b bg-gray-50">
            {!rightPanelCollapsed && (
              <h2 className="font-medium text-gray-900 text-sm">Properties</h2>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
              className="h-8 w-8 p-0"
            >
              {rightPanelCollapsed ? <PanelRightOpen className="w-4 h-4" /> : <PanelRightClose className="w-4 h-4" />}
            </Button>
          </div>

          {!rightPanelCollapsed && (
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="flex space-x-2 mb-4">
                <button
                  onClick={() => setActiveTab('canvas')}
                  className={`px-3 py-1 text-sm rounded ${
                    activeTab === 'canvas' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'
                  }`}
                >
                  Canvas
                </button>
                <button
                  onClick={() => setActiveTab('properties')}
                  className={`px-3 py-1 text-sm rounded ${
                    activeTab === 'properties' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'
                  }`}
                >
                  Properties
                </button>
                <button
                  onClick={() => setActiveTab('data')}
                  className={`px-3 py-1 text-sm rounded ${
                    activeTab === 'data' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'
                  }`}
                >
                  Data
                </button>
                <button
                  onClick={() => setActiveTab('theme')}
                  className={`px-3 py-1 text-sm rounded ${
                    activeTab === 'theme' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'
                  }`}
                >
                  Theme
                </button>
              </div>

              {activeTab === 'canvas' && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Canvas Settings</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Grid Columns
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        value={formData.layout.columns}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          layout: { ...prev.layout, columns: parseInt(e.target.value) || 12 }
                        }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gap (px)
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        value={formData.layout.gap}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          layout: { ...prev.layout, gap: parseInt(e.target.value) || 16 }
                        }))}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={snapToGrid}
                        onChange={() => setSnapToGrid(v => !v)}
                        id="snap-to-grid-toggle"
                      />
                      <label htmlFor="snap-to-grid-toggle" className="text-sm">Snap to Grid</label>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'properties' && renderWidgetProperties()}

              {activeTab === 'data' && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Data Sources</h3>
                  <div className="space-y-3">
                    {availableDataSources.map((source) => (
                      <div key={source.id} className="p-3 bg-white border border-gray-200 rounded-lg">
                        <div className="font-medium text-sm text-gray-900">{source.name}</div>
                        <div className="text-xs text-gray-500">{source.type}</div>
                        <div className="mt-2 text-xs text-gray-600">
                          Fields: {Object.keys(source.schema).join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'theme' && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">Theme Settings</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Primary Color
                      </label>
                      <input
                        type="color"
                        className="w-full h-10 border border-gray-300 rounded-md"
                        value={formData.theme?.primaryColor || '#3B82F6'}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          theme: { ...prev.theme, primaryColor: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Background Color
                      </label>
                      <input
                        type="color"
                        className="w-full h-10 border border-gray-300 rounded-md"
                        value={formData.theme?.backgroundColor || '#FFFFFF'}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          theme: { ...prev.theme, backgroundColor: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Text Color
                      </label>
                      <input
                        type="color"
                        className="w-full h-10 border border-gray-300 rounded-md"
                        value={formData.theme?.textColor || '#1F2937'}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          theme: { ...prev.theme, textColor: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Border Radius
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        value={formData.theme?.borderRadius || 8}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          theme: { ...prev.theme, borderRadius: parseInt(e.target.value) || 8 }
                        }))}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-[90vh] mx-4 flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold">Report Preview - {formData.name}</h3>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>
                  Close
                </Button>
              </div>
            </div>
            <div className="flex-1 p-6 overflow-auto">
              {/* Report Header */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{formData.name}</h1>
                <p className="text-gray-600">{formData.description}</p>
                <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                  <span>Generated: {new Date().toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{formData.widgets.length} widgets</span>
                  <span>•</span>
                  <span>Last updated: {new Date().toLocaleDateString()}</span>
                  {executionResult && (
                    <>
                      <span>•</span>
                      <span className="text-green-600 font-medium">Live Data</span>
                    </>
                  )}
                </div>
                
                {/* Data Source Info */}
                {formData.dataSources.length > 0 && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Data Sources</h4>
                    <div className="flex flex-wrap gap-2">
                      {formData.dataSources.map((source) => (
                        <span key={source.id} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {source.name} ({source.type})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Report Content */}
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: `repeat(${formData.layout.columns}, 1fr)`,
                  gap: `${formData.layout.gap}px`
                }}
              >
                {formData.widgets.map((widget) => {
                  // Use execution result data if available, otherwise use mock data
                  const widgetData = executionResult?.widgets?.[widget.id] || generateMockData(widget);
                  
                  return (
                    <div
                      key={widget.id}
                      className="border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
                      style={{
                        gridColumn: `span ${widget.position.w}`,
                        gridRow: `span ${widget.position.h}`,
                        transform: `translate(${widget.position.x * 10}px, ${widget.position.y * 10}px)`
                      }}
                    >
                      <div className="flex justify-between items-center p-3 border-b border-gray-100">
                        <h4 className="font-medium text-sm text-gray-900">{widget.title}</h4>
                        <div className="flex space-x-1">
                          {executionResult?.widgets?.[widget.id] && (
                            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                              Live Data
                            </span>
                          )}
                          <button className="text-gray-400 hover:text-gray-600 p-1">
                            <Eye className="w-3 h-3" />
                          </button>
                          <button className="text-gray-400 hover:text-gray-600 p-1">
                            <Settings className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <div className="flex-1">
                        <WidgetVisualization 
                          widget={widget} 
                          data={widgetData}
                          theme={formData.theme} 
                          isPreview={false}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Report Footer */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>Knittt Reporting System</span>
                  <span>Page 1 of 1</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button for Quick Widget Creation */}
      {!isFullscreen && (
        <div className="fixed bottom-6 right-6 z-40">
          <div className="flex flex-col space-y-2">
            <Button 
              size="lg" 
              className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              onClick={() => addWidget('metric')}
              title="Add Metric Widget"
            >
              <Target className="w-6 h-6" />
            </Button>
            <Button 
              size="lg" 
              className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
              onClick={() => addWidget('chart')}
              title="Add Chart Widget"
            >
              <BarChart3 className="w-6 h-6" />
            </Button>
            <Button 
              size="lg" 
              className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
              onClick={() => addWidget('table')}
              title="Add Table Widget"
            >
              <Table className="w-6 h-6" />
            </Button>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu.visible && (
        <div 
          className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[200px]"
          style={{ 
            left: contextMenu.x, 
            top: contextMenu.y,
            transform: 'translate(-50%, -100%) translateY(-10px)'
          }}
        >
          <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
            Widget Actions
          </div>
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
            onClick={() => {
              if (contextMenu.widgetId) {
                setSelectedWidget(formData.widgets.find(w => w.id === contextMenu.widgetId) || null);
              }
              setContextMenu({ visible: false, x: 0, y: 0, widgetId: null });
            }}
          >
            <Settings className="w-4 h-4 mr-2" />
            Properties
          </button>
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
            onClick={() => {
              if (contextMenu.widgetId) {
                handleCopyWidgets([contextMenu.widgetId]);
              }
              setContextMenu({ visible: false, x: 0, y: 0, widgetId: null });
            }}
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </button>
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
            onClick={() => {
              if (contextMenu.widgetId) {
                handleCutWidgets([contextMenu.widgetId]);
              }
              setContextMenu({ visible: false, x: 0, y: 0, widgetId: null });
            }}
          >
            <Scissors className="w-4 h-4 mr-2" />
            Cut
          </button>
          <div className="border-t border-gray-100 my-1"></div>
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center"
            onClick={() => {
              if (contextMenu.widgetId) {
                deleteWidget(contextMenu.widgetId);
              }
              setContextMenu({ visible: false, x: 0, y: 0, widgetId: null });
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </button>
        </div>
      )}

      {/* Selection Box */}
      {selectionBox.start && selectionBox.end && (
        <div
          className="absolute border-2 border-blue-500 bg-blue-50 bg-opacity-20 pointer-events-none z-10"
          style={{
            left: Math.min(selectionBox.start.x, selectionBox.end.x),
            top: Math.min(selectionBox.start.y, selectionBox.end.y),
            width: Math.abs(selectionBox.end.x - selectionBox.start.x),
            height: Math.abs(selectionBox.end.y - selectionBox.start.y),
          }}
        />
      )}

      {/* Snap Lines */}
      {showSnapLines && (
        <>
          {snapLines.vertical.map((x, index) => (
            <div
              key={`v-${index}`}
              className="absolute top-0 bottom-0 w-px bg-blue-500 pointer-events-none z-10"
              style={{ left: x }}
            />
          ))}
          {snapLines.horizontal.map((y, index) => (
            <div
              key={`h-${index}`}
              className="absolute left-0 right-0 h-px bg-blue-500 pointer-events-none z-10"
              style={{ top: y }}
            />
          ))}
        </>
      )}
    </div>
  );
} 