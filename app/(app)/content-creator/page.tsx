'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { ContentCreatorWrapper } from '../../components/content-creator/ContentCreatorWrapper';

export default function ContentCreatorPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');
  const templateId = searchParams.get('template');

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-50">
      <ContentCreatorWrapper 
        projectId={projectId || undefined} 
        templateId={templateId || undefined} 
      />
    </div>
  );
} 