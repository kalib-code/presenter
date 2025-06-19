# Presenter App

A modern, open-source presentation application inspired by ProPresenter, built with modern web technologies. The app enables users to create, edit, and present setlists, songs, slides, and media, with a unified drag-and-drop editor and robust projection system.

## Tech Stack

- **Electron**: Multi-window architecture for presentation control
- **Vite + React**: Frontend framework
- **Tailwind + shadcn/ui**: UI styling and components
- **Zustand**: State management
- **LMDB**: Local, offline data storage
- **TypeScript**: Type safety and developer experience

## Features

### Core Features

- **Setlist Management**

  - Create, edit, delete, and reorder setlists
  - Local storage with LMDB
  - Setlist duplication

- **Unified Song & Slide Editor**

  - Drag-and-drop text/media boxes
  - Live slide preview
  - Text formatting options
  - Slide templates
  - Section grouping (verse, chorus, bridge)
  - Keyboard shortcuts

- **Media Management**

  - Image, video, and audio support
  - Media library
  - Real-time preview

- **Dual-Window Presentation System**
  - Control Window: Preview and management
  - Presentation Window: Full-screen output
  - Multi-display support
  - Quick controls (blackout, logo)

### Additional Features

- **Templates**

  - Built-in templates (scripture, announcements)
  - Custom template creation
  - Template management

- **Accessibility**
  - Keyboard navigation
  - Screen reader support
  - High contrast modes

## Development Status

### Completed

- [x] Project initialization with core dependencies
- [x] Basic Electron multi-window setup
- [x] Tailwind and shadcn/ui configuration
- [x] Sidebar component implementation
- [x] Zustand store setup
- [x] Basic LMDB integration

### In Progress

- [ ] IPC communication system
- [ ] Core data models
- [ ] Unified editor implementation
- [ ] Media integration
- [ ] Presentation system

## Getting Started

### Prerequisites

- Node.js (LTS version recommended)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone [repository-url]

# Install dependencies
npm install
# or
pnpm install
```

### Development

```bash
# Start development server
npm run dev
# or
pnpm dev
```

### Building

```bash
# For Windows
npm run build:win

# For macOS
npm run build:mac

# For Linux
npm run build:linux
```

## Project Structure

```
presenter/
├── src/
│   ├── main/           # Electron main process
│   ├── renderer/       # React frontend
│   │   └── src/
│   │       ├── components/  # UI components
│   │       ├── store/      # Zustand stores
│   │       └── lib/        # Utilities
│   └── preload/       # Electron preload scripts
├── resources/         # Application resources
└── build/            # Build configuration
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by ProPresenter
- Built with shadcn/ui components
- Uses LMDB for efficient local storage
