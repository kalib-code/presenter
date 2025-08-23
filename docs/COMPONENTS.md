# Component Documentation - UI Components Reference

## Table of Contents
- [Overview](#overview)
- [Component Architecture](#component-architecture)
- [Page Components](#page-components)
- [Editor Components](#editor-components)
- [UI Components](#ui-components)
- [Layout Components](#layout-components)
- [Home Components](#home-components)
- [Component Patterns](#component-patterns)
- [Props Interfaces](#props-interfaces)
- [Usage Examples](#usage-examples)

## Overview

The Presenter application uses a component-based architecture built with React and TypeScript. Components are organized into logical groups based on their functionality and use shadcn/ui as the foundation for the design system.

## Component Architecture

### Component Hierarchy

```
App
├── Router (HashRouter)
│   ├── Presentation Route
│   ├── Presenter Routes
│   └── Main App Routes
│       └── Layout
│           ├── AppSidebar
│           └── Page Components
│               ├── Home
│               ├── Settings
│               ├── Collection
│               ├── Setlist
│               └── Editor (v1/v2)
```

### Component Categories

1. **Page Components**: Full-page views (`/pages`)
2. **Editor Components**: Canvas and editing tools (`/components/editor`)
3. **UI Components**: Reusable UI elements (`/components/ui`)
4. **Layout Components**: Application structure (`/components`)
5. **Home Components**: Home page specific (`/components/home`)

## Page Components

### Home
**Path**: `/src/renderer/src/pages/Home.tsx`  
**Route**: `/`  
**Purpose**: Main presentation interface

**Key Features**:
- Content card management
- Display selection
- Live projection
- Background rendering
- Setlist integration

**State Management**:
- `useHomeStore()`: Content cards, backgrounds
- `useDisplayStore()`: Display configuration
- `usePresentationStore()`: Projection state

### EditorV2
**Path**: `/src/renderer/src/pages/EditorV2.tsx`  
**Route**: `/editor-v2`  
**Purpose**: Modern slide/song editor

**Key Features**:
- Multi-slide management
- Canvas-based editing
- Real-time preview
- Auto-save functionality
- Template support

**Props Interface**:
```typescript
interface EditorV2Props {
  initialSongId?: string
  mode?: 'song' | 'presentation'
}
```

### Settings
**Path**: `/src/renderer/src/pages/Settings.tsx`  
**Route**: `/settings`  
**Purpose**: Application configuration

**Sections**:
- General settings
- Display configuration
- Editor preferences
- Media settings
- Advanced options

### Collection
**Path**: `/src/renderer/src/pages/Collection.tsx`  
**Route**: `/collection`  
**Purpose**: Media and content library

**Sub-routes**:
- `/collection/songs`
- `/collection/slides`
- `/collection/images`
- `/collection/videos`
- `/collection/audio`

### Setlist
**Path**: `/src/renderer/src/pages/Setlist.tsx`  
**Route**: `/setlist`  
**Purpose**: Setlist creation and management

**Features**:
- Drag-and-drop reordering
- Item addition/removal
- Duration calculation
- Export/import

### Presentation
**Path**: `/src/renderer/src/pages/Presentation.tsx`  
**Route**: `/presentation`  
**Purpose**: Full-screen presentation view

**Features**:
- Full-screen rendering
- Media playback
- Transition effects
- Remote control support

## Editor Components

### Canvas
**Path**: `/src/renderer/src/components/editor/Canvas.tsx`

**Purpose**: Main canvas for element positioning

**Props**:
```typescript
interface CanvasProps {
  width?: number
  height?: number
  zoom?: number
  showGrid?: boolean
  showRulers?: boolean
  showSafeArea?: boolean
  readonly?: boolean
  onElementSelect?: (id: string) => void
  onElementUpdate?: (id: string, updates: Partial<CanvasElement>) => void
}
```

**Key Methods**:
- `handleDragStart()`: Initialize drag operation
- `handleDragMove()`: Update element position
- `handleResize()`: Resize elements
- `handleSelection()`: Multi-select logic

### CanvasElement
**Path**: `/src/renderer/src/components/editor/CanvasElement.tsx`

**Purpose**: Individual canvas element wrapper

**Props**:
```typescript
interface CanvasElementProps {
  element: SlideElement
  selected: boolean
  readonly?: boolean
  onSelect: (id: string) => void
  onUpdate: (updates: Partial<SlideElement>) => void
  onDelete: (id: string) => void
}
```

**Element Types**:
- Text
- Image
- Video
- Audio
- Shape

### ElementToolbar
**Path**: `/src/renderer/src/components/editor/ElementToolbar.tsx`

**Purpose**: Toolbar for adding elements

**Features**:
```typescript
interface ToolbarAction {
  icon: React.ComponentType
  label: string
  action: () => void
  shortcut?: string
}
```

**Actions**:
- Add Text (`Ctrl+T`)
- Add Image (`Ctrl+I`)
- Add Video (`Ctrl+V`)
- Select Template
- Background Settings
- Clear All

### PropertiesPanel
**Path**: `/src/renderer/src/components/editor/PropertiesPanel.tsx`

**Purpose**: Element property editor

**Sections**:
- **Text Properties**: Font, size, color, alignment
- **Transform**: Position, size, rotation
- **Style**: Background, border, shadow
- **Media**: Playback settings

### BackgroundPanel
**Path**: `/src/renderer/src/components/editor/BackgroundPanel.tsx`

**Purpose**: Background configuration

**Props**:
```typescript
interface BackgroundPanelProps {
  background?: Background
  onChange: (background: Background) => void
  showGlobalOption?: boolean
}
```

**Background Types**:
- Solid color
- Gradient
- Image
- Video

### SlideRenderer
**Path**: `/src/renderer/src/components/editor/SlideRenderer.tsx`

**Purpose**: Render slide content

**Props**:
```typescript
interface SlideRendererProps {
  slide: Slide
  width: number
  height: number
  scale?: number
  interactive?: boolean
}
```

### MediaBrowser
**Path**: `/src/renderer/src/components/editor/MediaBrowser.tsx`

**Purpose**: Media selection dialog

**Props**:
```typescript
interface MediaBrowserProps {
  open: boolean
  onClose: () => void
  onSelect: (media: Media) => void
  type?: 'image' | 'video' | 'audio' | 'all'
}
```

## UI Components

### Button
**Path**: `/src/renderer/src/components/ui/button.tsx`

**Variants**:
- `default`: Primary button
- `destructive`: Danger actions
- `outline`: Secondary actions
- `secondary`: Alternative style
- `ghost`: Minimal style
- `link`: Text link style

**Sizes**: `sm`, `default`, `lg`

**Example**:
```tsx
<Button variant="default" size="lg" onClick={handleClick}>
  Click Me
</Button>
```

### Card
**Path**: `/src/renderer/src/components/ui/card.tsx`

**Components**:
- `Card`: Container
- `CardHeader`: Header section
- `CardTitle`: Title text
- `CardDescription`: Description text
- `CardContent`: Main content
- `CardFooter`: Footer section

**Example**:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>Content here</CardContent>
  <CardFooter>Footer content</CardFooter>
</Card>
```

### Dialog
**Path**: `/src/renderer/src/components/ui/dialog.tsx`

**Components**:
- `Dialog`: Root component
- `DialogTrigger`: Trigger element
- `DialogContent`: Modal content
- `DialogHeader`: Header section
- `DialogTitle`: Title
- `DialogDescription`: Description
- `DialogFooter`: Footer actions

### Sheet
**Path**: `/src/renderer/src/components/ui/sheet.tsx`

**Purpose**: Slide-out panel

**Sides**: `top`, `right`, `bottom`, `left`

**Example**:
```tsx
<Sheet>
  <SheetTrigger asChild>
    <Button>Open Sheet</Button>
  </SheetTrigger>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Sheet Title</SheetTitle>
    </SheetHeader>
    {/* Content */}
  </SheetContent>
</Sheet>
```

### Custom Components

#### MediaPlayer
**Path**: `/src/renderer/src/components/ui/media-player.tsx`

**Props**:
```typescript
interface MediaPlayerProps {
  src: string
  type: 'video' | 'audio'
  autoplay?: boolean
  controls?: boolean
  loop?: boolean
  onTimeUpdate?: (time: number) => void
  onEnded?: () => void
}
```

#### SetlistBrowser
**Path**: `/src/renderer/src/components/ui/setlist-browser.tsx`

**Props**:
```typescript
interface SetlistBrowserProps {
  setlists: Setlist[]
  selectedId?: string
  onSelect: (setlist: Setlist) => void
  onEdit?: (setlist: Setlist) => void
  onDelete?: (id: string) => void
}
```

#### CountdownConfig
**Path**: `/src/renderer/src/components/ui/countdown-config.tsx`

**Props**:
```typescript
interface CountdownConfigProps {
  config: CountdownConfiguration
  onChange: (config: CountdownConfiguration) => void
}
```

#### CustomFontManager
**Path**: `/src/renderer/src/components/ui/custom-font-manager.tsx`

**Features**:
- Upload custom fonts
- Font preview
- Font deletion
- Font application

## Layout Components

### Layout
**Path**: `/src/renderer/src/components/Layout.tsx`

**Purpose**: Main application layout wrapper

**Props**:
```typescript
interface LayoutProps {
  children: React.ReactNode
  showSidebar?: boolean
  showHeader?: boolean
}
```

**Features**:
- Sidebar integration
- Breadcrumb navigation
- Responsive design
- Context-aware display

### AppSidebar
**Path**: `/src/renderer/src/components/app-sidebar.tsx`

**Structure**:
```typescript
interface SidebarSection {
  title: string
  items: SidebarItem[]
}

interface SidebarItem {
  icon: React.ComponentType
  label: string
  path: string
  badge?: string | number
}
```

**Sections**:
1. **Main Navigation**
   - Home
   - Setlist
   - Collection

2. **Collection Submenu**
   - Songs
   - Slides
   - Images
   - Videos
   - Audio

## Home Components

### SortableContentCard
**Path**: `/src/renderer/src/components/home/SortableContentCard.tsx`

**Purpose**: Draggable content card

**Props**:
```typescript
interface SortableContentCardProps {
  card: ContentCard
  index: number
  onSelect: (card: ContentCard) => void
  onDelete: (id: string) => void
  onDuplicate: (card: ContentCard) => void
}
```

### ImagePreview
**Path**: `/src/renderer/src/components/home/ImagePreview.tsx`

**Props**:
```typescript
interface ImagePreviewProps {
  src: string
  alt?: string
  className?: string
  onClick?: () => void
}
```

### VideoPreview
**Path**: `/src/renderer/src/components/home/VideoPreview.tsx`

**Props**:
```typescript
interface VideoPreviewProps {
  src: string
  poster?: string
  autoplay?: boolean
  muted?: boolean
  className?: string
}
```

## Component Patterns

### Composition Pattern
```tsx
// Parent component provides context
<EditorProvider>
  <EditorToolbar />
  <EditorCanvas />
  <PropertiesPanel />
</EditorProvider>
```

### Render Props Pattern
```tsx
<MediaBrowser
  render={(media) => (
    <MediaItem
      media={media}
      onSelect={handleSelect}
    />
  )}
/>
```

### Custom Hooks Pattern
```tsx
function MyComponent() {
  const { slides, addSlide, updateSlide } = useSlidesStore()
  const { canUndo, canRedo, undo, redo } = useHistory()
  
  // Component logic
}
```

### Controlled Component Pattern
```tsx
function ControlledInput() {
  const [value, setValue] = useState('')
  
  return (
    <Input
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  )
}
```

## Props Interfaces

### Common Props
```typescript
// Base props for all components
interface BaseComponentProps {
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
}

// Interactive component props
interface InteractiveProps extends BaseComponentProps {
  onClick?: (e: React.MouseEvent) => void
  onFocus?: (e: React.FocusEvent) => void
  onBlur?: (e: React.FocusEvent) => void
  disabled?: boolean
}

// Form component props
interface FormComponentProps<T> extends InteractiveProps {
  value: T
  onChange: (value: T) => void
  error?: string
  required?: boolean
}
```

### Complex Component Props
```typescript
// Canvas element props
interface CanvasElementProps {
  element: {
    id: string
    type: ElementType
    position: Position
    size: Size
    content: ElementContent
    style: ElementStyle
  }
  selected: boolean
  readonly?: boolean
  zoom: number
  onSelect: (id: string) => void
  onUpdate: (id: string, updates: Partial<Element>) => void
  onDelete: (id: string) => void
}

// Media browser props
interface MediaBrowserProps {
  open: boolean
  onClose: () => void
  onSelect: (media: Media) => void
  filter?: MediaFilter
  multiple?: boolean
  maxSize?: number
}
```

## Usage Examples

### Creating a Custom Component
```tsx
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface CustomButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
}

const CustomButton = forwardRef<HTMLButtonElement, CustomButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium',
          {
            'bg-primary text-white': variant === 'primary',
            'bg-secondary text-black': variant === 'secondary',
            'px-2 py-1 text-sm': size === 'sm',
            'px-4 py-2': size === 'md',
            'px-6 py-3 text-lg': size === 'lg',
          },
          className
        )}
        {...props}
      />
    )
  }
)

CustomButton.displayName = 'CustomButton'
```

### Using Store with Component
```tsx
function SlideEditor() {
  const {
    slides,
    currentSlideIndex,
    addSlide,
    updateSlide,
    deleteSlide
  } = useSlidesStore()
  
  const currentSlide = slides[currentSlideIndex]
  
  return (
    <div className="slide-editor">
      <ElementToolbar onAddElement={handleAddElement} />
      <Canvas>
        {currentSlide?.elements.map(element => (
          <CanvasElement
            key={element.id}
            element={element}
            onUpdate={(updates) => updateSlide(currentSlideIndex, updates)}
          />
        ))}
      </Canvas>
      <PropertiesPanel
        element={selectedElement}
        onChange={handlePropertyChange}
      />
    </div>
  )
}
```

### Implementing Drag and Drop
```tsx
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove } from '@dnd-kit/sortable'

function SortableList({ items, onReorder }) {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (active.id !== over.id) {
      const oldIndex = items.findIndex(i => i.id === active.id)
      const newIndex = items.findIndex(i => i.id === over.id)
      onReorder(arrayMove(items, oldIndex, newIndex))
    }
  }
  
  return (
    <DndContext onDragEnd={handleDragEnd}>
      <SortableContext items={items}>
        {items.map(item => (
          <SortableItem key={item.id} item={item} />
        ))}
      </SortableContext>
    </DndContext>
  )
}
```

### Modal Dialog Pattern
```tsx
function DeleteConfirmDialog({ open, onConfirm, onCancel }) {
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogDescription>
            This action cannot be undone. Are you sure?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### Responsive Component
```tsx
function ResponsiveGrid({ children }) {
  const isMobile = useMediaQuery('(max-width: 768px)')
  
  return (
    <div
      className={cn(
        'grid gap-4',
        isMobile ? 'grid-cols-1' : 'grid-cols-3'
      )}
    >
      {children}
    </div>
  )
}
```