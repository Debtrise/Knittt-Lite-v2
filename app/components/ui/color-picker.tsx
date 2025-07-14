'use client';

import React, { useState } from 'react';
import { Button } from './button';
import { Input } from './Input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './popover';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  className?: string;
}

const PRESET_COLORS = [
  '#000000', '#ffffff', '#f3f4f6', '#9ca3af', '#6b7280', '#374151',
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6',
  '#a855f7', '#d946ef', '#ec4899', '#f43f5e'
];

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  const handleColorSelect = (color: string) => {
    onChange(color);
    setInputValue(color);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    if (newValue.match(/^#[0-9A-Fa-f]{6}$/)) {
      onChange(newValue);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-10 h-10 p-0 border-2 ${className}`}
          style={{ backgroundColor: value }}
        >
          <span className="sr-only">Pick a color</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3">
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Color</label>
            <div className="flex space-x-2 mt-1">
              <Input
                value={inputValue}
                onChange={handleInputChange}
                placeholder="#000000"
                className="font-mono text-sm"
              />
              <input
                type="color"
                value={value}
                onChange={(e) => handleColorSelect(e.target.value)}
                className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Presets</label>
            <div className="grid grid-cols-6 gap-2 mt-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorSelect(color)}
                  className={`w-8 h-8 rounded border-2 transition-all hover:scale-110 ${
                    value === color ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
} 