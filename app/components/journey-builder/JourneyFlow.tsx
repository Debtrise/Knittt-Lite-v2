'use client';

import React, { useState, useCallback } from 'react';
import { Plus, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Journey, JourneyStep } from '@/app/types/journey';

interface JourneyFlowProps {
  journey: Journey;
  onJourneyUpdated: () => void;
  onSelectStep: (step: JourneyStep) => void;
  selectedStep: JourneyStep | null;
}

export default function JourneyFlow({ 
  journey, 
  onJourneyUpdated, 
  onSelectStep,
  selectedStep 
}: JourneyFlowProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartStep, setDragStartStep] = useState<JourneyStep | null>(null);
  
  const handleStepClick = useCallback((step: JourneyStep) => {
    onSelectStep(step);
  }, [onSelectStep]);
  
  const handleDragStart = useCallback((step: JourneyStep) => {
    setIsDragging(true);
    setDragStartStep(step);
  }, []);
  
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDragStartStep(null);
  }, []);
  
  const handleDrop = useCallback((targetStep: JourneyStep) => {
    if (!dragStartStep || !isDragging) return;
    
    // Prevent connecting a step to itself
    if (dragStartStep.id === targetStep.id) {
      handleDragEnd();
      return;
    }
    
    // TODO: Implement step connection logic
    // This would typically involve an API call to update the journey flow
    
    handleDragEnd();
  }, [dragStartStep, isDragging, handleDragEnd]);
  
  const getStepStatusColor = (step: JourneyStep) => {
    switch (step.type) {
      case 'sms':
        return 'bg-blue-100 text-blue-800';
      case 'call':
        return 'bg-green-100 text-green-800';
      case 'delay':
        return 'bg-yellow-100 text-yellow-800';
      case 'condition':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="relative min-h-[400px] bg-gray-50 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">Journey Flow</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            // TODO: Implement add step logic
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Step
        </Button>
      </div>
      
      <div className="space-y-6">
        {journey.steps?.map((step, index) => (
          <div key={step.id} className="relative">
            <div
              className={`
                flex items-center justify-between p-4 rounded-lg border-2
                ${selectedStep?.id === step.id ? 'border-brand' : 'border-gray-200'}
                ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
                bg-white shadow-sm hover:shadow-md transition-shadow
              `}
              onClick={() => handleStepClick(step)}
              draggable
              onDragStart={() => handleDragStart(step)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(step)}
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <Badge variant="outline" className={getStepStatusColor(step)}>
                    {step.type.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{step.name}</h4>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: Implement delete step logic
                  }}
                >
                  <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                </Button>
              </div>
            </div>
            
            {index < (journey.steps?.length || 0) - 1 && (
              <div className="flex justify-center my-2">
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </div>
            )}
          </div>
        ))}
        
        {(!journey.steps || journey.steps.length === 0) && (
          <div className="text-center py-12">
            <p className="text-gray-500">No steps added yet</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                // TODO: Implement add step logic
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Step
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 