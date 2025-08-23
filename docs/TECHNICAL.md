# Technical Documentation - Presenter Application

## Table of Contents
- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Application Structure](#application-structure)
- [Process Architecture](#process-architecture)
- [State Management](#state-management)
- [Data Flow](#data-flow)
- [Security Model](#security-model)
- [Performance Considerations](#performance-considerations)
- [Build & Deployment](#build--deployment)

## Overview

The Presenter application is a modern, open-source presentation software built with Electron, React, and TypeScript. It provides a comprehensive solution for creating, managing, and presenting multimedia content with features comparable to professional presentation software like ProPresenter.

### Key Features
- Multi-window presentation system
- Canvas-based slide editor with drag-and-drop
- Real-time preview and projection
- Setlist management
- Media library (images, videos, audio)
- Template system
- Offline-first with local database

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Electron Application                      │
├───────────────────────────┬─────────────────────────────────┤
│      Main Process         │       Renderer Processes         │
├───────────────────────────┼─────────────────────────────────┤
│  • Window Management      │  • React Application            │
│  • IPC Handlers          │  • UI Components                │
│  • Database (LMDB)       │  • State Management (Zustand)   │
│  • File System Access    │  • Canvas Rendering             │
│  • Media Management      │  • User Interactions            │
└───────────────────────────┴─────────────────────────────────┘
                    │                    │
                    └────────────────────┘
                         IPC Bridge
                    (Preload Scripts)
```

### Multi-Process Model

The application follows Electron's multi-process architecture:

1. **Main Process**: Single process managing application lifecycle
2. **Renderer Processes**: Multiple processes for UI windows
3. **Preload Scripts**: Secure bridge between main and renderer

## Technology Stack

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Electron** | ^34.2.0 | Desktop application framework |
| **React** | ^18.3.1 | UI framework |
| **TypeScript** | ^5.7.3 | Type safety and developer experience |
| **Vite** | ^6.1.0 | Build tool and dev server |
| **Zustand** | ^5.0.3 | State management |
| **LMDB** | ^3.2.6 | Local database |
| **Tailwind CSS** | ^3.4.1 | Utility-first CSS |
| **shadcn/ui** | ^0.9.4 | Component library |

### Key Libraries

- **React Router DOM**: ^6.30.1 - Routing
- **@dnd-kit**: Drag and drop functionality
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **Electron Updater**: Auto-update functionality

## Application Structure

### Directory Layout

```
presenter/
├── src/
│   ├── main/                 # Electron main process
│   │   ├── index.ts          # Main entry point
│   │   └── types/            # Shared type definitions
│   │       └── database.ts   # Database models
│   │
│   ├── preload/              # Preload scripts
│   │   ├── index.ts         # API exposure
│   │   └── index.d.ts       # Type definitions
│   │
│   └── renderer/            # React application
│       └── src/
│           ├── components/  # UI components
│           │   ├── editor/  # Editor components
│           │   ├── home/    # Home page components
│           │   └── ui/      # Base UI components
│           ├── pages/       # Page components
│           ├── store/       # Zustand stores
│           ├── lib/         # Utilities
│           ├── hooks/       # React hooks
│           └── types/       # TypeScript types
│
├── resources/               # Application assets
├── out/                    # Build output
└── build/                  # Build configuration
```

## Process Architecture

### Main Process Responsibilities

1. **Window Management**
   - Create and manage BrowserWindows
   - Handle window state and positioning
   - Multi-display detection and management

2. **IPC Communication**
   - Handle secure IPC messages from renderers
   - Coordinate between multiple windows
   - Broadcast events to relevant windows

3. **Database Operations**
   - LMDB database initialization
   - CRUD operations for all entities
   - Data persistence and retrieval

4. **File System Operations**
   - Media file management
   - Custom font handling
   - Import/export functionality

5. **System Integration**
   - Auto-updater management
   - Native dialog integration
   - System font enumeration

### Renderer Process Architecture

```
┌──────────────────────────────────────────┐
│            React Application              │
├──────────────────────────────────────────┤
│              Router Layer                 │
├──────────────────────────────────────────┤
│              Page Components              │
├──────────────────────────────────────────┤
│           Feature Components              │
├──────────────────────────────────────────┤
│         Zustand State Stores              │
├──────────────────────────────────────────┤
│            IPC API Layer                  │
└──────────────────────────────────────────┘
```

### IPC Communication Pattern

```typescript
// Renderer → Main (Request)
window.electron.invoke('channel-name', ...args)

// Main Process Handler
ipcMain.handle('channel-name', async (event, ...args) => {
  // Process request
  return result
})

// Main → Renderer (Push)
window.webContents.send('event-name', data)

// Renderer Listener
ipcRenderer.on('event-name', (event, data) => {
  // Handle event
})
```

## State Management

### Zustand Store Architecture

The application uses a modular Zustand store architecture:

#### Editor Stores
- **editor-slides**: Slide management and navigation
- **editor-canvas**: Canvas elements and selection
- **editor-history**: Undo/redo functionality
- **editor-background**: Background settings
- **editor-alignment**: Grid and alignment tools
- **editor-meta**: Presentation metadata
- **editor-persistence**: Auto-save functionality
- **editor-templates**: Template management

#### Feature Stores
- **presentation**: Active presentation state
- **setlist**: Setlist management
- **media**: Media library state
- **settings**: Application settings
- **display**: Display configuration
- **countdown**: Timer functionality
- **home**: Home page state
- **ui**: UI preferences

### State Flow Example

```typescript
// Store Definition
interface SlidesState {
  slides: Slide[]
  currentSlideIndex: number
}

interface SlidesActions {
  addSlide: () => void
  updateSlide: (index: number, updates: Partial<Slide>) => void
  setCurrentSlide: (index: number) => void
}

// Store Creation
const useSlidesStore = create<SlidesState & SlidesActions>()(
  subscribeWithSelector((set, get) => ({
    slides: [],
    currentSlideIndex: 0,
    
    addSlide: () => {
      const newSlide = createSlide()
      set(state => ({
        slides: [...state.slides, newSlide]
      }))
    },
    // ... other actions
  }))
)
```

## Data Flow

### Application Data Flow

```
User Action → Component → Store Action → State Update
                ↓                           ↓
           IPC Request                 Component Re-render
                ↓                           ↓
           Main Process                UI Update
                ↓
           Database Update
```

### Canvas Editor Data Flow

```
Mouse/Keyboard Event
        ↓
    Canvas Component
        ↓
    Store Action (with history)
        ↓
    State Update
        ↓
    Canvas Re-render
        ↓
    Auto-save (debounced)
        ↓
    IPC to Main Process
        ↓
    Database Persistence
```

## Security Model

### Context Isolation
- Renderer processes run with context isolation enabled
- No direct access to Node.js APIs from renderer
- All system access through preload script

### IPC Security
- Whitelist approach for IPC channels
- Input validation in main process handlers
- No execution of arbitrary code from renderer

### File Access
- Sandboxed file system access
- User-initiated file operations through dialogs
- Media files stored in application data directory

## Performance Considerations

### Rendering Optimization
1. **React.memo** for expensive components
2. **Virtual scrolling** for long lists
3. **Debounced auto-save** in editor
4. **Lazy loading** for media previews
5. **Canvas optimization** with requestAnimationFrame

### State Management
1. **Selective subscriptions** with Zustand
2. **Atomic state updates**
3. **Computed values** with selectors
4. **State normalization** for relationships

### Database Performance
1. **LMDB compression** enabled
2. **Batch operations** where possible
3. **Indexed queries** for large datasets
4. **Lazy loading** for media metadata

## Build & Deployment

### Development Build
```bash
npm run dev          # Start development server
npm run typecheck    # Type checking
npm run lint         # Linting
npm run test         # Run tests
```

### Production Build
```bash
npm run build        # Build all platforms
npm run build:win    # Windows build
npm run build:mac    # macOS build
npm run build:linux  # Linux build
```

### Build Configuration

#### Electron Builder Config (`electron-builder.yml`)
- Application ID: `com.electron.app`
- Product Name: `presenter`
- Auto-updater: GitHub releases
- Code signing: Platform-specific

#### Vite Config (`electron.vite.config.ts`)
- Main process: Externalized dependencies
- Renderer: React with path aliases
- Preload: Externalized dependencies

### Deployment Pipeline
1. **Version bump** in package.json
2. **Build** for target platforms
3. **Code signing** (platform-specific)
4. **Upload** to GitHub releases
5. **Auto-updater** notification to users

### Platform-Specific Considerations

#### Windows
- NSIS installer
- Auto-launch capability
- Windows Store distribution (optional)

#### macOS
- DMG distribution
- Code signing required
- Notarization for Gatekeeper
- Mac App Store (optional)

#### Linux
- AppImage format
- Snap package (optional)
- System tray support varies

## Monitoring & Debugging

### Development Tools
- Chrome DevTools in renderer
- Electron DevTools Extension
- React Developer Tools
- Zustand DevTools

### Logging
- Console logging in development
- File-based logging in production
- Error reporting integration (optional)

### Performance Monitoring
- React Profiler for component performance
- Chrome Performance tab for rendering
- Memory profiling for leaks
- Network tab for IPC communication

## Future Considerations

### Scalability
- Plugin architecture for extensibility
- Cloud sync capabilities
- Multi-user collaboration
- Real-time synchronization

### Performance
- WebAssembly for intensive operations
- Worker threads for background tasks
- GPU acceleration for effects
- Streaming for large media files

### Features
- AI-powered content generation
- Advanced animation system
- Live streaming integration
- Mobile companion apps