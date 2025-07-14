# Content Creator Template Management API

Frontend template management system for reusable layouts and designs in the content creator.

## Overview

The Content Creator Template Management system provides a comprehensive frontend interface for creating, managing, and using templates. This system integrates with the existing `/api/content/templates` backend endpoints to provide a seamless template workflow.

## Components

### 1. TemplateManager (`app/components/content-creator/TemplateManager.tsx`)

Main template management component with full CRUD operations.

**Features:**
- **Grid/List View**: Toggle between grid and list display modes
- **Advanced Filtering**: Filter by category, public/private, favorites
- **Search**: Search templates by name, description, tags
- **Sorting**: Sort by date, usage, name, favorites
- **Template Operations**: Create, edit, delete, duplicate, favorite
- **Template Sharing**: Share templates (future feature)

**Props:**
```typescript
interface TemplateManagerProps {
  compact?: boolean;              // Compact view for panels
  onTemplateSelect?: (template: ContentTemplate) => void;
  showCreateButton?: boolean;     // Show template creation button
}
```

**Usage:**
```typescript
import { TemplateManager } from '@/app/components/content-creator/TemplateManager';

<TemplateManager 
  onTemplateSelect={(template) => {
    // Handle template selection
    router.push(`/content-creator?template=${template.id}`);
  }}
/>
```

### 2. TemplateBrowser (`app/components/content-creator/TemplateBrowser.tsx`)

Lightweight template browser for quick template selection within panels.

**Features:**
- **Compact Mode**: Optimized for sidebar panels
- **Quick Search**: Fast template searching
- **Template Preview**: Preview templates before use
- **Favorites Support**: Mark and filter favorite templates

**Props:**
```typescript
interface TemplateBrowserProps {
  onTemplateSelect?: (template: ContentTemplate) => void;
  onTemplatePreview?: (template: ContentTemplate) => void;
  mode?: 'panel' | 'modal';
  showFavorites?: boolean;
  compact?: boolean;
}
```

**Usage:**
```typescript
import { TemplateBrowser } from '@/app/components/content-creator/TemplateBrowser';

<TemplateBrowser 
  compact
  onTemplateSelect={(template) => {
    window.location.href = `/content-creator?template=${template.id}`;
  }}
/>
```

## API Integration

### Template Data Structure

```typescript
interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  canvasSize: {
    width: number;
    height: number;
  };
  templateData?: {
    elements: any[];
    canvasBackground: any;
  };
  variables?: Record<string, any>;
  previewImage?: string;
  usageCount: number;
  isPublic: boolean;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  author?: string;
}
```

### Supported Template Categories

```typescript
const CATEGORIES = [
  'welcome_screen',  // Welcome messages for new employees
  'announcement',    // General company announcements  
  'celebration',     // Deal celebrations, achievements
  'promotion',       // Sales promotions, offers
  'informational',   // Company information, updates
  'emergency',       // Emergency notifications
  'seasonal',        // Holiday and seasonal content
  'custom'          // Custom user-created categories
];
```

### Canvas Size Presets

```typescript
const CANVAS_PRESETS = [
  { name: '1920x1080 (Full HD)', width: 1920, height: 1080 },
  { name: '1366x768 (HD)', width: 1366, height: 768 },
  { name: '1280x720 (HD Ready)', width: 1280, height: 720 },
  { name: '1080x1920 (Portrait)', width: 1080, height: 1920 },
  { name: 'Custom', width: 0, height: 0 }
];
```

## Frontend API Calls

### 1. List Templates
```typescript
// GET /api/content/templates
const response = await fetch('/api/content/templates', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  }
});
const data = await response.json();
```

### 2. Get Single Template
```typescript
// GET /api/content/templates/:templateId
const response = await fetch(`/api/content/templates/${templateId}`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  }
});
const data = await response.json();
```

### 3. Create Template
```typescript
// POST /api/content/templates
const response = await fetch('/api/content/templates', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'My Template',
    description: 'Template description',
    category: 'announcement',
    canvasSize: { width: 1920, height: 1080 },
    isPublic: false,
    tags: ['announcement', 'company'],
    templateData: {
      elements: [...],
      canvasBackground: { type: 'solid', color: '#ffffff' }
    },
    variables: {}
  }),
});
```

### 4. Update Template
```typescript
// PUT /api/content/templates/:templateId
const response = await fetch(`/api/content/templates/${templateId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Updated Template Name',
    isFavorite: true,
    // ... other fields to update
  }),
});
```

### 5. Delete Template
```typescript
// DELETE /api/content/templates/:templateId
const response = await fetch(`/api/content/templates/${templateId}`, {
  method: 'DELETE',
  headers: {
    'Content-Type': 'application/json',
  }
});
```

### 6. Duplicate Template
```typescript
// POST /api/content/templates/:templateId/duplicate
const response = await fetch(`/api/content/templates/${templateId}/duplicate`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Template Copy'
  }),
});
```

## Content Creator Integration

### 1. Template Tab in Sidebar

The template browser is integrated as a tab in the content creator's left sidebar:

```typescript
<TabsTrigger value="templates" className="text-xs p-1.5" title="Templates (3)">
  <FileImage className="w-3.5 h-3.5" />
</TabsTrigger>
```

### 2. Template Selection Workflow

1. **Browse Templates**: Users can browse templates in the sidebar tab
2. **Search & Filter**: Find specific templates using search and filters
3. **Preview**: Preview templates before use
4. **Select Template**: Click to load template into current project
5. **Customize**: Edit the loaded template as needed

### 3. Template Creation Workflow

1. **Create Design**: Build a design in the content creator
2. **Save as Template**: Use "Save as Template" dialog
3. **Set Metadata**: Add name, description, category, tags
4. **Choose Visibility**: Set as public or private
5. **Save**: Template is saved and available for reuse

## State Management

Templates are managed through the `useContentStore` Zustand store:

```typescript
// Load templates
const { templates, loadTemplates, isLoading } = useContentStore();

// Load template data
useEffect(() => {
  loadTemplates().catch(console.error);
}, [loadTemplates]);

// Template operations
await loadTemplates();              // Refresh template list
const template = await loadTemplate(templateId);  // Load specific template
```

## Error Handling

All template operations include comprehensive error handling:

```typescript
try {
  const response = await fetch('/api/content/templates', { ... });
  
  if (!response.ok) {
    throw new Error('Failed to create template');
  }
  
  const result = await response.json();
  toast.success('Template created successfully');
  
} catch (error) {
  console.error('Error creating template:', error);
  toast.error('Failed to create template');
}
```

## User Experience Features

### 1. Responsive Design
- **Grid View**: Responsive card layout for larger screens
- **List View**: Compact list for smaller screens or panels
- **Compact Mode**: Minimal UI for sidebar integration

### 2. Visual Feedback
- **Loading States**: Spinner indicators during operations
- **Toast Notifications**: Success/error feedback
- **Hover Effects**: Interactive element highlighting
- **Selection States**: Clear visual selection indicators

### 3. Keyboard Shortcuts
- **Search**: Focus search with `/` key
- **Navigation**: Arrow keys for template selection
- **Actions**: Enter to select, Escape to close modals

### 4. Accessibility
- **ARIA Labels**: Screen reader support
- **Keyboard Navigation**: Full keyboard accessibility
- **Color Contrast**: WCAG compliant color schemes
- **Focus Management**: Proper focus handling in modals

## Performance Optimizations

### 1. Lazy Loading
- **Image Loading**: Template previews load on demand
- **Component Splitting**: Code splitting for better performance
- **Virtual Scrolling**: For large template lists (future enhancement)

### 2. Caching
- **Template List**: Cached in Zustand store
- **Image Previews**: Browser caching for preview images
- **Search Results**: Debounced search queries

### 3. Memory Management
- **Component Cleanup**: Proper cleanup on unmount
- **Event Listeners**: Cleanup of event listeners
- **State Reset**: Reset form states when modals close

## Future Enhancements

### 1. Template Sharing
- **Public Marketplace**: Community template sharing
- **Team Templates**: Organization-level template sharing
- **Template Ratings**: User ratings and reviews

### 2. Advanced Features
- **Version Control**: Template versioning and history
- **Collaborative Editing**: Real-time template collaboration
- **AI Suggestions**: AI-powered template recommendations
- **Bulk Operations**: Select and operate on multiple templates

### 3. Import/Export
- **Template Export**: Export templates as files
- **Template Import**: Import templates from files
- **Batch Import**: Import multiple templates at once
- **Format Support**: Support for various design file formats

## Testing

### 1. Unit Tests
- Component rendering tests
- State management tests
- API integration tests
- Error handling tests

### 2. Integration Tests
- Full template workflow tests
- Cross-component interaction tests
- API endpoint integration tests

### 3. E2E Tests
- Complete user journey tests
- Template creation and usage flows
- Error scenario testing

## Deployment

### 1. Build Process
```bash
npm run build      # Build the application
npm run test       # Run tests
npm run lint       # Code quality checks
```

### 2. Environment Variables
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 3. Production Considerations
- **CDN**: Template preview images served via CDN
- **Caching**: Appropriate cache headers for templates
- **Monitoring**: Error tracking and performance monitoring
- **Backup**: Regular template data backups

This frontend template management system provides a comprehensive solution for template creation, management, and usage within the content creator, ensuring a smooth and efficient user experience. 