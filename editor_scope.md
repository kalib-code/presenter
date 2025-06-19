# Editor Scope

This document outlines the detailed specifications and requirements for the Presenter App's editor functionality.

## Core Editor Features

### 1. Layout & Interface

#### Canvas Editor

- Drag-and-drop interface for text and media elements
- Real-time preview of slides
- Grid snapping and alignment guides
- Zoom in/out capabilities
- Rulers and guidelines
- Multiple selection and group editing

#### Toolbars

- Format toolbar (text styling, alignment, etc.)
- Object toolbar (arrangement, grouping, etc.)
- Media toolbar (import, library access)
- View controls (zoom, grid, guides)

### 2. Text Editing

#### Text Boxes

- Multiple text boxes per slide
- Rich text formatting
  - Font family and size
  - Bold, italic, underline
  - Text color and highlight
  - Alignment (left, center, right, justify)
  - Line height and spacing
  - Bullet points and numbering
- Text overflow handling
- Auto-sizing options

#### Templates

- Text box templates
- Quick-access formatting presets
- Save custom text styles

### 3. Media Handling

#### Image Support

- Import multiple formats (PNG, JPEG, GIF, SVG)
- Basic image editing
  - Resize with aspect ratio lock
  - Crop
  - Rotate
  - Opacity adjustment
- Image filters and effects
- Background removal options

#### Video Support

- Multiple format support (MP4, WebM)
- Trim video clips
- Set in/out points
- Preview in editor
- Loop options
- Auto-play settings

#### Audio Support

- Background music
- Sound effects
- Volume control
- Fade in/out options
- Timing synchronization

### 4. Slide Management

#### Organization

- Thumbnail view of all slides
- Drag-and-drop slide reordering
- Duplicate slides
- Group slides into sections
- Slide transitions
- Timeline view

#### Templates

- Built-in slide templates
- Custom template creation
- Template categories
  - Song slides
  - Scripture slides
  - Announcement slides
  - Custom categories

### 5. Live Preview

#### Preview Window

- Real-time preview of current slide
- Next/previous slide preview
- Multi-screen preview
- Preview with transitions
- Stage display preview

### 6. Version Control

#### History

- Undo/redo support
- Edit history
- Slide versions
- Auto-save
- Backup options

## Technical Implementation

### 1. Data Structure

```typescript
interface EditorState {
  slides: Slide[];
  currentSlide: number;
  clipboard: EditorElement[];
  history: HistoryState[];
  settings: EditorSettings;
}

interface Slide {
  id: string;
  elements: EditorElement[];
  background: Background;
  transition: Transition;
  notes: string;
}

interface EditorElement {
  id: string;
  type: "text" | "image" | "video" | "audio" | "shape";
  position: Position;
  size: Size;
  style: ElementStyle;
  content: any;
}
```

### 2. State Management

- Use Zustand for global state
- Implement command pattern for undo/redo
- Maintain separate states for:
  - Editor canvas
  - Tool selection
  - Media library
  - Slide thumbnails

### 3. Performance Considerations

#### Optimization Strategies

- Virtual scrolling for slide thumbnails
- Lazy loading for media assets
- Debounced updates for real-time preview
- Web Workers for heavy computations
- Canvas-based rendering for complex slides

#### Memory Management

- Automatic cleanup of unused media
- Resource pooling for frequently used assets
- Efficient history stack management

## Integration Points

### 1. File System Integration

- Auto-save to local storage
- Export/Import presentations
- Media asset management
- Template storage

### 2. IPC Communication

- Preview window updates
- Stage display communication
- Media library synchronization
- Settings management

### 3. External Services

- Font loading
- Media processing
- Cloud backup (optional)
- Resource downloads

## Accessibility Features

### 1. Keyboard Navigation

- Full keyboard control
- Customizable shortcuts
- Focus management
- Tab order optimization

### 2. Screen Reader Support

- ARIA labels
- Role annotations
- Status announcements
- Alternative text management

### 3. Visual Accessibility

- High contrast mode
- Adjustable UI scaling
- Color blind friendly indicators
- Customizable focus indicators

## Development Phases

### Phase 1: Core Editor

- [ ] Basic canvas implementation
- [ ] Text editing capabilities
- [ ] Simple media import
- [ ] Slide management

### Phase 2: Enhanced Features

- [ ] Advanced text formatting
- [ ] Media editing tools
- [ ] Templates system
- [ ] Transitions

### Phase 3: Performance & Polish

- [ ] Optimization
- [ ] Accessibility implementation
- [ ] Advanced features
- [ ] Testing and refinement

## Testing Strategy

### 1. Unit Tests

- Editor operations
- State management
- Command handling
- Media processing

### 2. Integration Tests

- IPC communication
- File system operations
- Preview synchronization
- Multi-window interaction

### 3. Performance Tests

- Large presentation handling
- Media processing efficiency
- Memory usage monitoring
- Real-time preview performance

### 4. Accessibility Tests

- Screen reader compatibility
- Keyboard navigation
- Color contrast compliance
- Focus management
