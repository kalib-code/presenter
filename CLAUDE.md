# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build and Development
```bash
# Start development server with hot reload
npm run dev

# Build the application
npm run build

# Type checking (run both for complete check)
npm run typecheck       # Runs both node and web checks
npm run typecheck:node  # TypeScript check for main process
npm run typecheck:web   # TypeScript check for renderer process

# Linting and formatting
npm run lint            # ESLint with caching
npm run format          # Prettier formatting

# Testing
npm run test            # Run Vitest in watch mode
npm run test:run        # Run tests once and exit
npm run test:ui         # Open Vitest UI

# Platform-specific builds
npm run build:win       # Build for Windows
npm run build:mac       # Build for macOS  
npm run build:linux     # Build for Linux
```

## Architecture Overview

### Multi-Process Electron Architecture
This is an Electron application with three distinct process contexts:

1. **Main Process** (`src/main/`)
   - Manages application lifecycle and windows
   - Handles IPC communication between processes
   - Manages LMDB database operations
   - Controls file system access and media operations
   - Entry point: `src/main/index.ts`

2. **Preload Scripts** (`src/preload/`)
   - Bridge between main and renderer processes
   - Exposes safe APIs to renderer via `window.electron` and `window.api`
   - Handles secure context isolation

3. **Renderer Process** (`src/renderer/`)
   - React application with TypeScript
   - Uses Zustand for state management
   - Tailwind CSS + shadcn/ui for styling
   - Multi-page routing with React Router

### State Management Architecture

The application uses Zustand stores with a modular architecture:

- **Editor Stores** (prefix: `editor-`)
  - `editor-slides.ts`: Slide management and navigation
  - `editor-canvas.ts`: Canvas elements and selection
  - `editor-history.ts`: Undo/redo functionality
  - `editor-background.ts`: Background settings
  - `editor-alignment.ts`: Element alignment tools
  - `editor-meta.ts`: Presentation metadata
  - `editor-persistence.ts`: Auto-save and loading
  - `editor-templates.ts`: Template management

- **Feature Stores**
  - `presentation.ts`: Active presentation state
  - `setlist.ts`: Setlist management
  - `media.ts`: Media library state
  - `settings.ts`: Application settings
  - `display.ts`: Display/projection settings
  - `countdown.ts`: Countdown timer state
  - `home.ts`: Home page state
  - `ui.ts`: UI preferences

### Database Layer

Uses LMDB for local persistent storage with typed entities:

- **Entities**: Song, Setlist, Presentation, Media, Template, Settings
- **IPC Channel Pattern**: `db:[entity]:[operation]` (e.g., `db:song:create`)
- **Operations**: create, read, update, delete, list
- **Location**: User data directory (`app.getPath('userData')`)

### Key Design Patterns

1. **IPC Communication**
   - Type-safe IPC handlers in main process
   - Preload script exposes safe APIs
   - Renderer uses `window.api` for database operations

2. **Canvas-Based Editor**
   - Drag-and-drop elements on slides
   - Real-time preview
   - Undo/redo with history tracking
   - Template system for reusable layouts

3. **Multi-Window Presentation**
   - Control window for editing/preview
   - Presentation window for output display
   - Synchronized state via IPC

## Project Structure

```
presenter/
├── src/
│   ├── main/           # Electron main process
│   │   ├── index.ts    # Main entry, IPC handlers, window management
│   │   └── types/      # Shared type definitions
│   ├── preload/        # Preload scripts
│   │   └── index.ts    # API exposure to renderer
│   └── renderer/       # React application
│       └── src/
│           ├── components/
│           │   ├── editor/     # Editor-specific components
│           │   ├── home/       # Home page components
│           │   └── ui/         # shadcn/ui components
│           ├── store/          # Zustand stores
│           ├── pages/          # Page components
│           ├── hooks/          # Custom React hooks
│           ├── lib/            # Utilities and helpers
│           └── types/          # TypeScript types
├── resources/          # Application assets
└── out/               # Build output
```

## Important Conventions

### File Naming
- Components: PascalCase (e.g., `EditorCanvas.tsx`)
- Stores: kebab-case with feature prefix (e.g., `editor-slides.ts`)
- Utilities: camelCase (e.g., `mediaUtils.ts`)

### Component Structure
- Use functional components with TypeScript
- Props interfaces named `[Component]Props`
- Prefer composition over inheritance
- Use shadcn/ui components as base

### State Management
- Zustand stores use `subscribeWithSelector` for fine-grained updates
- History actions wrapped with `createHistoryAction` for undo/redo
- Stores expose both state and actions interfaces

### Styling
- Tailwind CSS utility classes
- CSS variables for theming (defined in `base.css`)
- Dark mode support via `dark:` prefix
- Component variants using `class-variance-authority`

## Development Notes

### Path Aliases
- `@renderer`: Maps to `src/renderer/src`
- `@`: Also maps to `src/renderer/src`
- Use these in imports for cleaner paths

### Testing
- Vitest for unit testing
- React Testing Library for component tests
- Test files colocated or in `__tests__` directories
- Mock Electron APIs in tests using vitest mocks

### Auto-updater
- Configured to publish to GitHub releases
- Update checks handled in main process
- User notifications via IPC to renderer

### Performance Considerations
- Canvas operations optimized with React.memo
- Virtualization for long lists
- Debounced auto-save in editor
- Lazy loading for media previews