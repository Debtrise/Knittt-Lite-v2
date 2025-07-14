import React from 'react';
import { 
  Phone, Mail, MessageSquare, Tag, FileText, ExternalLink, Clock, 
  AlertCircle, ArrowRightCircle, Users, Database, RefreshCw 
} from 'lucide-react';

interface StepType {
  id: string;
  name: string;
  description: string;
  actionType: string;
  category: string;
}

const stepTypes: StepType[] = [
  {
    id: 'call',
    name: 'Call',
    description: 'Make outbound calls to leads',
    actionType: 'call',
    category: 'communication'
  },
  {
    id: 'sms',
    name: 'SMS',
    description: 'Send SMS messages automatically',
    actionType: 'sms',
    category: 'communication'
  },
  {
    id: 'email',
    name: 'Email',
    description: 'Send automated emails',
    actionType: 'email',
    category: 'communication'
  },
  {
    id: 'status_change',
    name: 'Status Change',
    description: 'Update lead status',
    actionType: 'status_change',
    category: 'data'
  },
  {
    id: 'tag_update',
    name: 'Tag Update',
    description: 'Add or remove lead tags',
    actionType: 'tag_update',
    category: 'data'
  },
  {
    id: 'webhook',
    name: 'Webhook',
    description: 'Call external API endpoints',
    actionType: 'webhook',
    category: 'integration'
  },
  {
    id: 'delay',
    name: 'Delay',
    description: 'Add timing delays between steps',
    actionType: 'delay',
    category: 'flow'
  }
];

const categoryColors = {
  communication: 'bg-blue-100 border-blue-500 text-blue-700',
  data: 'bg-green-100 border-green-500 text-green-700',
  flow: 'bg-purple-100 border-purple-500 text-purple-700',
  integration: 'bg-orange-100 border-orange-500 text-orange-700',
  management: 'bg-teal-100 border-teal-500 text-teal-700',
};

const categoryIcons = {
  communication: '💬',
  data: '📊',
  flow: '🔄',
  integration: '🔗',
  management: '👥',
};

const getStepIcon = (actionType: string) => {
  switch (actionType) {
    case 'call':
      return <Phone className="h-4 w-4" />;
    case 'sms':
      return <MessageSquare className="h-4 w-4" />;
    case 'email':
      return <Mail className="h-4 w-4" />;
    case 'status_change':
      return <FileText className="h-4 w-4" />;
    case 'tag_update':
      return <Tag className="h-4 w-4" />;
    case 'webhook':
      return <ExternalLink className="h-4 w-4" />;
    case 'delay':
      return <Clock className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
};

export default function JourneyNodePalette() {
  // Group step types by category
  const categoryGroups = stepTypes.reduce((acc, stepType) => {
    const category = stepType.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(stepType);
    return acc;
  }, {} as Record<string, StepType[]>);

  const onDragStart = (event: React.DragEvent, stepType: StepType) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(stepType));
    event.dataTransfer.effectAllowed = 'move';
  };

  const sortedCategories = Object.keys(categoryGroups).sort((a, b) => {
    // Custom sort order
    const order = ['communication', 'data', 'flow', 'integration', 'management'];
    return order.indexOf(a) - order.indexOf(b);
  });

  return (
    <div className="w-64">
      <h3 className="text-sm font-medium mb-3 px-2">Journey Step Types</h3>
      {sortedCategories.map(category => (
        <div key={category} className="mb-4">
          <h4 className="text-xs font-semibold uppercase text-gray-600 mb-2 px-2">
            {categoryIcons[category as keyof typeof categoryIcons]} {category}
          </h4>
          <div className="flex flex-col gap-1">
            {categoryGroups[category].map(stepType => (
              <div
                key={stepType.id}
                className={`border px-3 py-2 rounded text-sm cursor-grab hover:shadow-md transition-shadow ${
                  categoryColors[stepType.category as keyof typeof categoryColors] || 'bg-gray-100 border-gray-300'
                }`}
                draggable
                onDragStart={(event) => onDragStart(event, stepType)}
                title={stepType.description}
              >
                <div className="flex items-center gap-2">
                  {getStepIcon(stepType.actionType)}
                  <div>
                    <div className="font-medium">{stepType.name}</div>
                    <div className="text-xs opacity-75 truncate max-w-[180px]">
                      {stepType.description}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="text-xs text-gray-500 mt-4 p-3 bg-gray-50 rounded border border-gray-200">
        <div className="font-medium mb-1">How to use:</div>
        <div className="space-y-1">
          <div>• Drag step types onto the canvas</div>
          <div>• First drop creates the Start node</div>
          <div>• Second drop auto-generates End node</div>
          <div>• Additional drops insert before End</div>
        </div>
      </div>
    </div>
  );
} 