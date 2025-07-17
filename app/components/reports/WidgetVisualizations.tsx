'use client';

import React from 'react';
import { 
  BarChart3, PieChart, LineChart, TrendingUp, TrendingDown, 
  Target, DollarSign, Users, Activity, MapPin, Clock, FileText,
  Calendar, Filter, Gauge, Table, Eye, Download, Share2
} from 'lucide-react';

interface WidgetVisualizationProps {
  widget: any;
  data?: any;
  theme?: any;
  isPreview?: boolean;
}

// Metric Widget Visualization
export function MetricVisualization({ widget, data, theme, isPreview }: WidgetVisualizationProps) {
  const { config, title } = widget;
  const value = data?.value || 15420;
  const previousValue = data?.previousValue || 13700;
  const change = ((value - previousValue) / previousValue) * 100;
  const isPositive = change >= 0;

  const formatValue = (val: number) => {
    switch (config?.format) {
      case 'currency':
        return `${config?.prefix || '$'}${val.toLocaleString()}`;
      case 'percent':
        return `${val.toFixed(config?.decimals || 0)}%`;
      case 'decimal':
        return val.toFixed(config?.decimals || 2);
      default:
        return val.toLocaleString();
    }
  };

  const getSizeClass = (size: string) => {
    switch (size) {
      case 'small': return 'text-2xl';
      case 'medium': return 'text-3xl';
      case 'large': return 'text-4xl';
      case 'xl': return 'text-5xl';
      default: return 'text-4xl';
    }
  };

  return (
    <div className="text-center p-4">
      <div className={`${getSizeClass(config?.size)} font-bold text-${theme?.primaryColor || 'blue'}-600 mb-2`}>
        {formatValue(value)}
      </div>
      <div className="text-sm text-gray-600 mb-2">{title}</div>
      
      {config?.comparison?.enabled && (
        <div className={`flex items-center justify-center text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
          {Math.abs(change).toFixed(1)}% vs last period
        </div>
      )}

      {config?.sparkline?.enabled && (
        <div className="mt-3 h-8 bg-gray-100 rounded flex items-center justify-center">
          <LineChart className="w-4 h-4 text-gray-400" />
        </div>
      )}
    </div>
  );
}

// Chart Widget Visualization
export function ChartVisualization({ widget, data, theme, isPreview }: WidgetVisualizationProps) {
  const { config, title } = widget;
  const chartData = data || [
    { name: 'Jan', value: 400 },
    { name: 'Feb', value: 300 },
    { name: 'Mar', value: 600 },
    { name: 'Apr', value: 800 },
    { name: 'May', value: 500 }
  ];

  const renderChart = () => {
    const maxValue = Math.max(...chartData.map((d: any) => d.value));
    const height = 120;
    const width = 200;
    const padding = 20;

    switch (config?.type) {
      case 'bar':
        return (
          <svg width={width} height={height} className="mx-auto">
            {chartData.map((d: any, i: number) => {
              const barHeight = (d.value / maxValue) * (height - 2 * padding);
              const barWidth = (width - 2 * padding) / chartData.length - 2;
              const x = padding + i * ((width - 2 * padding) / chartData.length);
              const y = height - padding - barHeight;
              
              return (
                <g key={i}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    fill={theme?.primaryColor || '#3B82F6'}
                    rx={2}
                  />
                  <text
                    x={x + barWidth / 2}
                    y={height - 5}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#666"
                  >
                    {d.name}
                  </text>
                </g>
              );
            })}
          </svg>
        );

      case 'line':
        return (
          <svg width={width} height={height} className="mx-auto">
            <path
              d={chartData.map((d: any, i: number) => {
                const x = padding + i * ((width - 2 * padding) / (chartData.length - 1));
                const y = height - padding - (d.value / maxValue) * (height - 2 * padding);
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ')}
              stroke={theme?.primaryColor || '#3B82F6'}
              strokeWidth={2}
              fill="none"
            />
            {chartData.map((d: any, i: number) => {
              const x = padding + i * ((width - 2 * padding) / (chartData.length - 1));
              const y = height - padding - (d.value / maxValue) * (height - 2 * padding);
              
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={3}
                  fill={theme?.primaryColor || '#3B82F6'}
                />
              );
            })}
          </svg>
        );

      case 'pie':
        return (
          <div className="flex items-center justify-center">
            <div className="relative w-24 h-24">
              <svg width="96" height="96" className="transform -rotate-90">
                {chartData.map((d: any, i: number) => {
                  const total = chartData.reduce((sum: number, item: any) => sum + item.value, 0);
                  const percentage = d.value / total;
                  const circumference = 2 * Math.PI * 36;
                  const strokeDasharray = circumference * percentage;
                  const strokeDashoffset = circumference * (1 - percentage);
                  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
                  
                  return (
                    <circle
                      key={i}
                      cx="48"
                      cy="48"
                      r="36"
                      stroke={colors[i % colors.length]}
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold">{chartData.length}</span>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="h-32 bg-gray-100 rounded flex items-center justify-center">
            <BarChart3 className="w-8 h-8 text-gray-400" />
            <span className="ml-2 text-sm text-gray-500">{config?.type || 'bar'} Chart</span>
          </div>
        );
    }
  };

  return (
    <div className="p-4">
      <div className="text-sm font-medium mb-3">{title}</div>
      {renderChart()}
      {config?.legend?.enabled && (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {chartData.slice(0, 3).map((d: any, i: number) => (
            <div key={i} className="flex items-center text-xs">
              <div 
                className="w-3 h-3 rounded mr-1"
                style={{ backgroundColor: ['#3B82F6', '#10B981', '#F59E0B'][i] }}
              />
              {d.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Table Widget Visualization
export function TableVisualization({ widget, data, theme, isPreview }: WidgetVisualizationProps) {
  const { config, title } = widget;
  const tableData = data || [
    { id: 1, name: 'John Doe', status: 'Active', revenue: 15000 },
    { id: 2, name: 'Jane Smith', status: 'Inactive', revenue: 12000 },
    { id: 3, name: 'Mike Johnson', status: 'Active', revenue: 18000 }
  ];

  return (
    <div className="p-4">
      <div className="text-sm font-medium mb-3">{title}</div>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-700">ID</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Name</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Status</th>
              <th className="px-3 py-2 text-right font-medium text-gray-700">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row: any, i: number) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-3 py-2 text-gray-900">{row.id}</td>
                <td className="px-3 py-2 text-gray-900">{row.name}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    row.status === 'Active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {row.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-right text-gray-900">
                  ${row.revenue.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {config?.showPagination && (
        <div className="mt-3 flex justify-between items-center text-xs text-gray-500">
          <span>Showing 1-3 of {tableData.length} results</span>
          <div className="flex space-x-1">
            <button className="px-2 py-1 border rounded disabled:opacity-50">Previous</button>
            <button className="px-2 py-1 border rounded bg-blue-500 text-white">1</button>
            <button className="px-2 py-1 border rounded disabled:opacity-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Gauge Widget Visualization
export function GaugeVisualization({ widget, data, theme, isPreview }: WidgetVisualizationProps) {
  const { config, title } = widget;
  const value = data?.value || 75;
  const min = config?.min || 0;
  const max = config?.max || 100;
  const target = config?.target;
  
  const percentage = ((value - min) / (max - min)) * 100;
  const circumference = 2 * Math.PI * 28;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference * (1 - percentage / 100);

  const getSegmentColor = (val: number) => {
    if (val < 50) return '#EF4444';
    if (val < 75) return '#F59E0B';
    return '#10B981';
  };

  return (
    <div className="text-center p-4">
      <div className="relative w-20 h-20 mx-auto mb-3">
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="40"
            cy="40"
            r="28"
            stroke="#E5E7EB"
            strokeWidth="6"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="40"
            cy="40"
            r="28"
            stroke={getSegmentColor(percentage)}
            strokeWidth="6"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
          {/* Target line */}
          {target && (
            <circle
              cx="40"
              cy="40"
              r="28"
              stroke="#EF4444"
              strokeWidth="2"
              fill="none"
              strokeDasharray="4"
              strokeDashoffset={circumference * (1 - ((target - min) / (max - min)))}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold">{value}%</span>
        </div>
      </div>
      <div className="text-sm text-gray-600 mb-1">{title}</div>
      {target && (
        <div className="text-xs text-gray-500">Target: {target}%</div>
      )}
    </div>
  );
}

// Text Widget Visualization
export function TextVisualization({ widget, data, theme, isPreview }: WidgetVisualizationProps) {
  const { config, title } = widget;
  const content = config?.content || '## Sample Report\n\nThis is a sample text widget with **markdown** support.\n\n- Point 1\n- Point 2\n- Point 3';

  const getFontSize = (size: string) => {
    switch (size) {
      case 'xs': return 'text-xs';
      case 'sm': return 'text-sm';
      case 'base': return 'text-base';
      case 'lg': return 'text-lg';
      case 'xl': return 'text-xl';
      default: return 'text-base';
    }
  };

  const getFontWeight = (weight: string) => {
    switch (weight) {
      case 'normal': return 'font-normal';
      case 'medium': return 'font-medium';
      case 'semibold': return 'font-semibold';
      case 'bold': return 'font-bold';
      default: return 'font-normal';
    }
  };

  const getTextAlign = (align: string) => {
    switch (align) {
      case 'left': return 'text-left';
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      case 'justify': return 'text-justify';
      default: return 'text-left';
    }
  };

  return (
    <div className="p-4">
      <div className={`text-sm font-medium mb-3 ${getTextAlign(config?.align)}`}>{title}</div>
      <div 
        className={`${getFontSize(config?.fontSize)} ${getFontWeight(config?.fontWeight)} ${getTextAlign(config?.align)} text-gray-700`}
        style={{ color: config?.color || theme?.textColor || '#1F2937' }}
      >
        {config?.markdown ? (
          <div className="prose prose-sm max-w-none">
            <h2 className="text-lg font-semibold mb-2">Sample Report</h2>
            <p className="mb-3">This is a sample text widget with <strong>markdown</strong> support.</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Point 1</li>
              <li>Point 2</li>
              <li>Point 3</li>
            </ul>
          </div>
        ) : (
          content
        )}
      </div>
    </div>
  );
}

// Filter Widget Visualization
export function FilterVisualization({ widget, data, theme, isPreview }: WidgetVisualizationProps) {
  const { config, title } = widget;
  const filters = config?.filters || [
    { id: 'dateRange', type: 'dateRange', label: 'Date Range', value: 'Last 30 Days' },
    { id: 'source', type: 'multiSelect', label: 'Lead Source', value: 'All Sources' },
    { id: 'status', type: 'select', label: 'Status', value: 'All Statuses' }
  ];

  return (
    <div className="p-4">
      <div className="text-sm font-medium mb-3">{title}</div>
      <div className={`flex ${config?.layout === 'vertical' ? 'flex-col' : 'flex-wrap'} gap-2`}>
        {filters.map((filter: any, i: number) => (
          <div key={i} className="flex items-center space-x-2">
            <label className="text-xs font-medium text-gray-700">{filter.label}:</label>
            <div className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded border">
              {filter.value}
            </div>
          </div>
        ))}
      </div>
      {config?.showApplyButton && (
        <button className="mt-3 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600">
          Apply Filters
        </button>
      )}
    </div>
  );
}

// Map Widget Visualization
export function MapVisualization({ widget, data, theme, isPreview }: WidgetVisualizationProps) {
  const { config, title } = widget;
  const mapData = data || [
    { lat: 40.7128, lng: -74.0060, name: 'New York', value: 150 },
    { lat: 34.0522, lng: -118.2437, name: 'Los Angeles', value: 120 },
    { lat: 41.8781, lng: -87.6298, name: 'Chicago', value: 90 }
  ];

  return (
    <div className="p-4">
      <div className="text-sm font-medium mb-3">{title}</div>
      <div className="relative h-32 bg-gray-100 rounded-lg overflow-hidden">
        {/* Simplified map representation */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <div className="absolute bottom-1/3 left-1/2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <MapPin className="w-6 h-6 text-gray-400" />
          <span className="ml-2 text-sm text-gray-500">Map View</span>
        </div>
      </div>
      <div className="mt-2 text-xs text-gray-500">
        {mapData.length} locations • {config?.mapType || 'markers'} view
      </div>
    </div>
  );
}

// Timeline Widget Visualization
export function TimelineVisualization({ widget, data, theme, isPreview }: WidgetVisualizationProps) {
  const { config, title } = widget;
  const timelineData = data || [
    { date: '2024-01-01', event: 'Lead Created', status: 'completed' },
    { date: '2024-01-03', event: 'First Contact', status: 'completed' },
    { date: '2024-01-07', event: 'Proposal Sent', status: 'pending' },
    { date: '2024-01-10', event: 'Deal Closed', status: 'pending' }
  ];

  return (
    <div className="p-4">
      <div className="text-sm font-medium mb-3">{title}</div>
      <div className="relative">
        {timelineData.map((item: any, i: number) => (
          <div key={i} className="flex items-start space-x-3 mb-3">
            <div className="flex-shrink-0">
              <div className={`w-3 h-3 rounded-full ${
                item.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
              }`} />
              {i < timelineData.length - 1 && (
                <div className="w-0.5 h-6 bg-gray-200 mx-auto mt-1" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-900">{item.event}</div>
              <div className="text-xs text-gray-500">{item.date}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Main Widget Visualization Component
export function WidgetVisualization({ widget, data, theme, isPreview }: WidgetVisualizationProps) {
  const { type } = widget;

  switch (type) {
    case 'metric':
      return <MetricVisualization widget={widget} data={data} theme={theme} isPreview={isPreview} />;
    case 'chart':
      return <ChartVisualization widget={widget} data={data} theme={theme} isPreview={isPreview} />;
    case 'table':
      return <TableVisualization widget={widget} data={data} theme={theme} isPreview={isPreview} />;
    case 'gauge':
      return <GaugeVisualization widget={widget} data={data} theme={theme} isPreview={isPreview} />;
    case 'text':
      return <TextVisualization widget={widget} data={data} theme={theme} isPreview={isPreview} />;
    case 'filter':
      return <FilterVisualization widget={widget} data={data} theme={theme} isPreview={isPreview} />;
    case 'map':
      return <MapVisualization widget={widget} data={data} theme={theme} isPreview={isPreview} />;
    case 'timeline':
      return <TimelineVisualization widget={widget} data={data} theme={theme} isPreview={isPreview} />;
    default:
      return (
        <div className="p-4 text-center text-gray-500">
          <div className="text-sm">Unknown widget type: {type}</div>
        </div>
      );
  }
} 