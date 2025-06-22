# CLAUDE.md - Presenter Application

## Project Overview

**Presenter** is a modern, open-source presentation application inspired by ProPresenter, built with Electron and React. It enables users to create, edit, and present setlists, songs, slides, and media with a unified drag-and-drop editor and robust projection system.

## Project Type & Architecture

- **Type**: Cross-platform desktop application (Electron)
- **Architecture**: Multi-window Electron app with main process, renderer process, and preload scripts
- **Frontend**: React with TypeScript
- **Build Tool**: Vite with electron-vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: Zustand
- **Database**: LMDB (Lightning Memory-Mapped Database) for local storage
- **Packaging**: Electron Builder

## Tech Stack

### Core Technologies
- **Electron** v34.2.0 - Cross-platform desktop app framework
- **React** v18.3.1 - Frontend UI library
- **TypeScript** v5.7.3 - Type-safe JavaScript
- **Vite** v6.1.0 - Build tool and dev server
- **electron-vite** v3.0.0 - Vite-based build tooling for Electron

### UI & Styling
- **Tailwind CSS** v3.4.1 - Utility-first CSS framework
- **shadcn/ui** - Pre-built React components
- **Radix UI** - Accessible, unstyled UI primitives
- **Lucide React** - Icon library
- **tailwindcss-animate** - CSS animations

### State & Data Management
- **Zustand** v5.0.3 - Lightweight state management
- **LMDB** v3.2.6 - High-performance embedded database
- **electron-router-dom** - Routing for Electron apps

### Development & Build Tools
- **ESLint** - Code linting with Electron-specific configs
- **Prettier** - Code formatting
- **Vitest** - Unit testing framework
- **@testing-library/react** - React testing utilities
- **electron-builder** - Application packaging and distribution

### Additional Libraries
- **@dnd-kit** - Drag and drop functionality
- **@editorjs/editorjs** - Rich text editor
- **electron-updater** - Auto-update functionality
- **react-router-dom** - Client-side routing
- **date-fns** - Date utility library

## Directory Structure

```
presenter/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── index.ts            # Main process entry point
│   │   └── types/              # Shared type definitions
│   │       └── database.ts     # Database type definitions
│   ├── renderer/               # React frontend
│   │   ├── index.html          # Renderer HTML template
│   │   └── src/
│   │       ├── App.tsx         # Main React component
│   │       ├── main.tsx        # Renderer entry point
│   │       ├── components/     # React components
│   │       │   ├── ui/         # shadcn/ui components
│   │       │   ├── editor/     # Editor-specific components
│   │       │   └── ...         # Other components
│   │       ├── pages/          # Route components
│   │       ├── store/          # Zustand stores
│   │       ├── types/          # Frontend type definitions
│   │       ├── lib/            # Utility functions
│   │       ├── hooks/          # Custom React hooks
│   │       └── assets/         # Static assets
│   └── preload/                # Electron preload scripts
│       ├── index.ts            # Preload entry point
│       └── index.d.ts          # Preload type definitions
├── resources/                  # Application resources (icons, etc.)
├── build/                     # Build output directory
├── out/                       # Electron build output
└── [config files]            # Various configuration files
```

## Key npm Scripts

### Development
- `npm run dev` - Start development server with hot reload
- `npm run start` - Start Electron in preview mode
- `npm run typecheck` - Run TypeScript type checking
- `npm run typecheck:node` - Type check main process
- `npm run typecheck:web` - Type check renderer process

### Testing
- `npm run test` - Run tests in watch mode
- `npm run test:ui` - Run tests with UI interface
- `npm run test:run` - Run tests once

### Code Quality
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Building & Distribution
- `npm run build` - Build for production
- `npm run build:unpack` - Build without packaging (for testing)
- `npm run build:win` - Build Windows executable
- `npm run build:mac` - Build macOS application
- `npm run build:linux` - Build Linux application
- `npm run postinstall` - Install app dependencies (runs after npm install)

## Configuration Files

### TypeScript Configuration
- `tsconfig.json` - Main TypeScript configuration (references node and web configs)
- `tsconfig.node.json` - Configuration for main process
- `tsconfig.web.json` - Configuration for renderer process

### Build Configuration
- `electron.vite.config.ts` - Vite configuration for Electron
- `electron-builder.yml` - Electron Builder configuration
- `vite.config.js` - Vite configuration

### Code Quality
- `eslint.config.mjs` - ESLint configuration with React and TypeScript rules
- `prettier.config.js` - Prettier configuration
- `tailwind.config.js` - Tailwind CSS configuration

### Other Configuration
- `postcss.config.js` - PostCSS configuration
- `components.json` - shadcn/ui components configuration

## Development Workflow

1. **Setup**: Run `npm install` to install dependencies
2. **Development**: Use `npm run dev` for hot-reload development
3. **Type Checking**: Run `npm run typecheck` to verify TypeScript types
4. **Testing**: Use `npm run test` for unit tests
5. **Linting**: Run `npm run lint` to check code quality
6. **Building**: Use `npm run build` to create production build
7. **Packaging**: Use platform-specific build commands for distribution

## Key Features (Current Implementation)

### Completed Features
- Multi-window Electron architecture
- Basic UI with shadcn/ui components
- Sidebar navigation
- LMDB database integration
- Zustand state management
- Song and setlist management
- Basic editor components
- Media browser functionality
- Auto-update system

### Core Application Features
- **Setlist Management**: Create, edit, delete, and reorder setlists
- **Unified Editor**: Drag-and-drop slide editor with text and media support
- **Media Management**: Support for images, videos, and audio
- **Presentation System**: Dual-window architecture for control and presentation
- **Templates**: Built-in and custom templates
- **Local Storage**: Offline-first with LMDB

## Database Schema

The application uses LMDB with the following main entities:
- **Songs**: Song metadata, lyrics, and slide content
- **Setlists**: Collections of songs and presentations
- **Presentations**: Slide decks with media and formatting
- **Media**: Images, videos, and audio files
- **Templates**: Reusable slide templates

## Special Development Considerations

1. **Electron Security**: Uses context isolation and secure preload scripts
2. **Multi-Window Management**: Separate control and presentation windows
3. **IPC Communication**: Inter-process communication between main and renderer
4. **Media Handling**: Support for various media formats and real-time preview
5. **Performance**: Optimized for smooth slide transitions and media playback
6. **Cross-Platform**: Supports Windows, macOS, and Linux

## Testing Approach

- **Unit Tests**: Vitest with React Testing Library
- **Component Tests**: Testing individual React components
- **Store Tests**: Testing Zustand state management
- **Type Safety**: TypeScript for compile-time error checking
- **Linting**: ESLint for code quality and consistency

## Build & Deployment

- **Development Build**: `npm run dev` - Local development with hot reload
- **Production Build**: `npm run build` - Optimized production build
- **Distribution**: Platform-specific executables via Electron Builder
- **Auto-Updates**: Integrated electron-updater for seamless updates
- **CI/CD**: GitHub Actions workflows for automated builds and releases

## Documentation Files

The project includes several documentation files:
- `README.md` - Main project documentation
- `scope.md` - Project scope and development plan
- `TODO.md` - Task list and development roadmap
- `DATABASE_IMPLEMENTATION.md` - Database schema and implementation details
- `EDITOR_ROADMAP.md` - Editor development roadmap
- `SETLIST_ROADMAP.md` - Setlist feature roadmap
- `editor_scope.md` - Editor scope and requirements
- `schema.md` - Database schema documentation

This application is designed to be a professional-grade presentation tool with a focus on performance, usability, and cross-platform compatibility.