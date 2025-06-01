export type TemplateType = 'sms' | 'email' | 'transfer' | 'script' | 'voicemail';

export interface Template {
  id: number;
  name: string;
  content: string;
  type: TemplateType;
  categoryId: number;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TemplateCategory {
  id: number;
  name: string;
  description: string;
  type: TemplateType;
}

export interface CreateTemplateData {
  name: string;
  content: string;
  categoryId: number;
  type: TemplateType;
  description?: string;
  isActive?: boolean;
}

export interface TemplateListResponse {
  templates: Template[];
  total: number;
  page: number;
  totalPages: number;
}

export interface TemplateCategoryListResponse {
  categories: TemplateCategory[];
  total: number;
  page: number;
  totalPages: number;
}

export interface TemplatePreviewData {
  variables: Record<string, string>;
  content: string;
} 