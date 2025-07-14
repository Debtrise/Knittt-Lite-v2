# Content Creation System

A comprehensive drag-and-drop content creation system built with React, TypeScript, and Tailwind CSS. This system allows users to create dynamic digital signage content with support for videos, animations, photos, and variable-driven content.

## Features

### 🎨 Drag-and-Drop Interface
- **Element Panel**: Draggable elements including text, images, videos, shapes, animations, and more
- **Canvas**: Interactive workspace with zoom, pan, grid, and rulers
- **Visual Feedback**: Real-time visual feedback during drag operations
- **Snap to Grid**: Optional grid snapping for precise element placement

### 📱 Element Types Supported
- **Text**: Dynamic text with variable support and rich formatting
- **Images**: Photo upload and management with thumbnails
- **Videos**: Video content with playback controls
- **Shapes**: Rectangles, circles, triangles with customizable styles
- **Animations**: Built-in animation effects and confetti
- **Interactive Elements**: Buttons, QR codes, timers, weather widgets
- **Data Visualization**: Charts and graphs

### 🔧 Advanced Features
- **Variable System**: Dynamic content with lead, call, and system variables
- **Asset Library**: Centralized media management with upload and organization
- **Preview System**: Real-time preview with variable resolution
- **Responsive Design**: Multiple canvas sizes and device previews
- **Properties Panel**: Comprehensive element editing with style controls
- **Layer Management**: Z-index control and element ordering

### 🎯 Canvas Tools
- **Zoom Controls**: Zoom in/out, fit to screen, reset view
- **Grid & Rulers**: Visual alignment aids
- **Background Controls**: Solid colors, gradients, and images
- **Selection Tools**: Multi-element selection and manipulation
- **Keyboard Shortcuts**: Arrow keys for precise positioning

## Architecture

### Component Structure
```
ContentCreator (Main Container)
├── ProjectToolbar (Save, Preview, Assets)
├── ElementPanel (Draggable Elements)
├── Canvas (Main Workspace)
│   ├── CanvasToolbar (Grid, Rulers, Size)
│   ├── CanvasElement (Individual Elements)
│   │   ├── ElementRenderer (Content Rendering)
│   │   └── ResizeHandles (Resize Controls)
│   ├── GridLines (Alignment Grid)
│   ├── Ruler (Measurement Rulers)
│   └── ZoomControls (Zoom Interface)
├── Sidebar Panels
│   ├── AssetLibrary (Media Management)
│   ├── VariablePanel (Dynamic Variables)
│   └── PropertiesPanel (Element Settings)
└── PreviewModal (Preview Interface)
```

### State Management
- **Zustand Store**: Centralized state management for projects, elements, assets, and variables
- **Real-time Updates**: Immediate visual feedback for all changes
- **Persistence**: Auto-save functionality with API integration

## API Integration

The system integrates with the Content Creation API documented in `content_creation_api_docs.md`:

### Key Endpoints Used
- `GET/POST /content/projects` - Project management
- `GET/POST /content/assets/upload` - Asset management
- `GET /content/variables` - Variable system
- `POST /content/projects/:id/preview` - Preview generation
- `POST /content/projects/:id/publish` - OptiSigns publishing

### Variable System
Dynamic content support with variables like:
- `{lead.name}` - Customer name
- `{lead.phone}` - Phone number
- `{current.date}` - Current date
- `{company.name}` - Company name
- `{call.status}` - Call status

## Usage

### Getting Started
1. Navigate to `/content-creator`
2. Start with a blank canvas or select a template
3. Drag elements from the left panel to the canvas
4. Customize elements using the properties panel
5. Preview your content with real data
6. Save and publish to digital displays

### Creating Content
1. **Add Elements**: Drag from element panel or click to add to center
2. **Position Elements**: Drag to move, use arrow keys for precision
3. **Resize Elements**: Use corner/edge handles or properties panel
4. **Style Elements**: Use the style tab in properties panel
5. **Add Variables**: Use `{variable.name}` syntax in text elements

### Asset Management
1. **Upload Assets**: Drag files to upload area or browse
2. **Organize**: Use tags and categories
3. **Use Assets**: Drag from asset library to canvas
4. **Manage**: View usage, delete unused assets

### Preview & Testing
1. **Real-time Preview**: See changes instantly on canvas
2. **Variable Testing**: Use preview modal to test with real data
3. **Device Preview**: Test on desktop, tablet, and mobile sizes
4. **Export Options**: Download or publish to displays

## Technical Implementation

### Key Technologies
- **React 19**: Modern React with hooks and concurrent features
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **React DND**: Drag and drop functionality
- **Zustand**: State management
- **Radix UI**: Accessible UI components

### Performance Optimizations
- **Virtualization**: Large asset libraries with virtual scrolling
- **Debounced Updates**: Smooth real-time editing
- **Lazy Loading**: Assets loaded on demand
- **Memoization**: Optimized re-renders

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Customization

### Adding New Element Types
1. Add element type to `ContentElement` interface
2. Create renderer in `ElementRenderer`
3. Add to `ElementPanel` with icon and properties
4. Implement properties in `PropertiesPanel`

### Custom Variables
1. Define in API backend
2. Add to variable panel display
3. Implement resolution in preview system

### Styling Customization
- Modify Tailwind configuration
- Update component styles
- Add custom CSS for specific needs

## Deployment

### Environment Variables
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Build Process
```bash
npm run build
npm run start
```

### Integration with OptiSigns
The system integrates with OptiSigns for digital signage deployment:
1. Content created in the system
2. Published via API to OptiSigns
3. Displayed on digital signage screens
4. Real-time updates and scheduling

## Future Enhancements

### Planned Features
- **Collaboration**: Real-time multi-user editing
- **Templates**: Pre-built template marketplace
- **Advanced Animations**: Timeline-based animation editor
- **Data Connectors**: Integration with external data sources
- **A/B Testing**: Content variation testing
- **Analytics**: Content performance tracking

### API Enhancements
- **Versioning**: Content version control
- **Scheduling**: Advanced content scheduling
- **Approvals**: Content approval workflows
- **Permissions**: Role-based access control

## Support

For technical support or feature requests:
1. Check the API documentation
2. Review component source code
3. Test with the preview system
4. Validate API integration

The Content Creation System provides a powerful, user-friendly interface for creating dynamic digital signage content with professional-grade features and seamless API integration. 