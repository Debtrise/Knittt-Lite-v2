# App-Wide Loading Animation System

A comprehensive loading animation system built with Framer Motion and Zustand that provides smooth, consistent loading experiences across the entire application.

## Features

- 🎨 **Beautiful Animation**: Uses the custom loading-icon.png with smooth animations
- 🚀 **Auto Route Loading**: Automatically shows loading on navigation with contextual messages
- 📊 **Progress Support**: Built-in progress bar support for uploads and batch operations
- 🎯 **Multiple Variants**: Fullscreen, overlay, and inline loading states
- 🔧 **Easy Integration**: Simple hooks and utilities for any use case
- ⚡ **Performance Optimized**: Prevents loading flash on fast operations
- 🛡️ **Type Safe**: Full TypeScript support

## Quick Start

The system is automatically set up in your app. Just import and use:

```tsx
import { useAppLoading } from '@/app/providers/LoadingProvider';

function MyComponent() {
  const { showSimpleLoading, hideLoading } = useAppLoading();
  
  const handleAction = () => {
    showSimpleLoading('Processing...');
    // Do something async
    setTimeout(() => hideLoading(), 2000);
  };
}
```

## Components

### LoadingAnimation

The main loading component with multiple variants and animations.

```tsx
<LoadingAnimation
  isVisible={true}
  message="Loading data..."
  progress={50}
  showProgress={true}
  size="lg"
  variant="fullscreen"
/>
```

**Props:**
- `isVisible`: Boolean to show/hide the loading
- `message`: Loading message text
- `progress`: Progress percentage (0-100)
- `showProgress`: Whether to show progress bar
- `size`: Icon size ('sm' | 'md' | 'lg' | 'xl')
- `variant`: Display variant ('fullscreen' | 'overlay' | 'inline')

### MiniLoadingAnimation

Compact loading animation for buttons and inline use.

```tsx
<MiniLoadingAnimation 
  size="sm" 
  message="Saving..." 
  className="mr-2" 
/>
```

## Store & State Management

The loading state is managed by Zustand with the following structure:

```typescript
interface LoadingState {
  isLoading: boolean;
  loadingMessage: string;
  loadingProgress?: number;
  showProgress: boolean;
  
  // Actions
  setLoading: (loading: boolean, message?: string, progress?: number) => void;
  setProgress: (progress: number) => void;
  setMessage: (message: string) => void;
  hideLoading: () => void;
  showLoadingWithProgress: (message?: string) => void;
  showLoadingSimple: (message?: string) => void;
}
```

## Hooks

### useAppLoading

Main hook for controlling app-wide loading state.

```tsx
const {
  showLoading,        // Set loading with message and optional progress
  updateProgress,     // Update progress percentage
  updateMessage,      // Update loading message
  hideLoading,        // Hide loading
  showProgressLoading, // Show with progress bar
  showSimpleLoading,  // Show simple loading
  isLoading          // Current loading state
} = useAppLoading();
```

### useComponentLoading

Component-level loading state management.

```tsx
const { isLoading, withLoading, show, hide } = useComponentLoading();

// Usage
await withLoading(
  () => fetchData(),
  'Loading data...'
);
```

## Utility Functions

### withApiLoading

Wrap API calls with automatic loading states.

```tsx
import { withApiLoading } from '@/app/utils/loadingHelpers';

const result = await withApiLoading(
  () => api.getData(),
  'Fetching data...',
  false // showProgress
);
```

### withUploadProgress

Handle file uploads with progress tracking.

```tsx
import { withUploadProgress } from '@/app/utils/loadingHelpers';

const result = await withUploadProgress(
  (onProgress) => uploadFile(file, onProgress),
  'Uploading file...'
);
```

### withFormLoading

Wrap form submissions with loading.

```tsx
import { withFormLoading } from '@/app/utils/loadingHelpers';

const handleSubmit = withFormLoading(async (data) => {
  await submitForm(data);
}, 'Submitting form...');
```

### withBatchProgress

Process multiple items with progress tracking.

```tsx
import { withBatchProgress } from '@/app/utils/loadingHelpers';

await withBatchProgress(
  items,
  async (item, index) => {
    await processItem(item);
  },
  'Processing items...'
);
```

## Auto Route Loading

The system automatically intercepts navigation and shows contextual loading messages:

- `/dashboard` → "Loading dashboard..."
- `/leads` → "Loading leads..."
- `/reports` → "Generating reports..."
- And more...

### Custom Route Messages

Add custom messages in `loadingHelpers.ts`:

```typescript
export const ROUTE_LOADING_MESSAGES = {
  '/my-page': 'Loading my custom page...',
  // ... existing routes
};
```

## Advanced Usage

### Higher-Order Component

Wrap components with automatic loading:

```tsx
import { withLoading } from '@/app/providers/LoadingProvider';

const MyComponent = withLoading(
  ({ data }) => <div>{data}</div>,
  'Loading component...'
);
```

### Custom Loading Router

Create navigation with loading:

```tsx
import { createLoadingRouter } from '@/app/utils/loadingHelpers';

const router = useRouter();
const loadingRouter = createLoadingRouter(router);

// Navigation with automatic loading
loadingRouter.push('/dashboard');
```

### Loading Fetcher Class

Singleton for consistent data fetching:

```tsx
import { LoadingFetcher } from '@/app/utils/loadingHelpers';

const fetcher = LoadingFetcher.getInstance();

const data = await fetcher.fetch(
  () => api.getData(),
  {
    message: 'Loading...',
    showProgress: false,
    minDuration: 300 // Prevent flash
  }
);
```

## Best Practices

### 1. Prevent Loading Flash
For fast operations, use minimum duration:

```tsx
const data = await fetcher.fetch(
  () => quickOperation(),
  { minDuration: 300 }
);
```

### 2. Contextual Messages
Use specific messages for better UX:

```tsx
showSimpleLoading('Saving your preferences...');
// Better than just "Loading..."
```

### 3. Progress for Long Operations
Show progress for operations > 3 seconds:

```tsx
showProgressLoading('Processing large dataset...');
```

### 4. Component-Level for Local State
Use component loading for local operations:

```tsx
const { withLoading } = useComponentLoading();
// Only affects this component
```

### 5. Cleanup on Unmount
Loading states auto-cleanup, but for safety:

```tsx
useEffect(() => {
  return () => hideLoading();
}, []);
```

## Styling

The loading animation uses Tailwind CSS classes and can be customized:

### Custom Styling
```tsx
<LoadingAnimation
  className="bg-blue-50/95 backdrop-blur-md"
  // Override default styles
/>
```

### Theme Integration
The animation respects your app's color scheme and uses:
- Blue/purple gradient for progress
- Smooth backdrop blur
- Drop shadows and transitions

## Performance

- Framer Motion animations are GPU accelerated
- Loading states use minimal re-renders
- Auto-cleanup prevents memory leaks
- Optimized bundle size with tree shaking

## Troubleshooting

### Loading Stuck
- Auto-cleanup after 15 seconds
- Check console for warnings
- Ensure `hideLoading()` is called

### Animation Not Smooth
- Ensure CSS animations are enabled
- Check GPU acceleration in browser
- Verify Framer Motion version compatibility

### Route Loading Not Working
- Check LoadingProvider is properly wrapped
- Verify router interception setup
- Test with manual navigation

## Migration from Existing Loading

Replace existing loading patterns:

```tsx
// Before
const [loading, setLoading] = useState(false);

// After
const { showSimpleLoading, hideLoading } = useAppLoading();
```

This provides a consistent experience and better animations across the entire app. 