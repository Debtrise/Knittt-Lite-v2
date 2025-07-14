import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Keyboard, Zap, Save, Copy, Eye, Grid3X3, Ruler } from 'lucide-react';

interface QuickShortcutsProps {
  className?: string;
}

export function QuickShortcuts({ className = '' }: QuickShortcutsProps) {
  const shortcuts = [
    { key: '1', action: 'Gradient Text', icon: <span className="text-blue-500">✨</span> },
    { key: '2', action: 'Image Hotspot', icon: <span className="text-green-500">🎯</span> },
    { key: '3', action: 'Pie Chart', icon: <span className="text-purple-500">📊</span> },
    { key: '4', action: 'Matrix Rain', icon: <span className="text-green-500">🔢</span> },
    { key: '5', action: 'Floating Hearts', icon: <span className="text-pink-500">💕</span> },
    { key: 'Ctrl+S', action: 'Save project', icon: <Save className="w-3 h-3" /> },
    { key: 'Ctrl+D', action: 'Smart duplicate', icon: <Copy className="w-3 h-3" /> },
    { key: 'Space', action: 'Quick preview', icon: <Eye className="w-3 h-3" /> },
    { key: 'G', action: 'Toggle grid', icon: <Grid3X3 className="w-3 h-3" /> },
    { key: 'Q', action: 'Quick actions', icon: <Zap className="w-3 h-3" /> },
  ];

  return (
    <Card className={`p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 ${className}`}>
      <div className="flex items-center space-x-2 mb-3">
        <Keyboard className="w-4 h-4 text-blue-600" />
        <h4 className="text-sm font-medium text-blue-900">Keyboard Shortcuts</h4>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {shortcuts.map((shortcut, index) => (
          <div key={index} className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              {shortcut.icon}
              <span className="text-gray-700">{shortcut.action}</span>
            </div>
            <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-white">
              {shortcut.key}
            </Badge>
          </div>
        ))}
      </div>
      
      <div className="mt-3 pt-3 border-t border-blue-200">
        <p className="text-xs text-blue-600 text-center">
          💡 Hover over elements for more tips!
        </p>
      </div>
    </Card>
  );
} 