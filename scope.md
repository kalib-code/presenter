# Presenter App — Project Scope & Development Plan

## Overview

A modern, open-source presentation app inspired by ProPresenter, built with Electron, Vite, React, Tailwind, shadcn/ui, Zustand, and lmdbjs. The app enables users to create, edit, and present setlists, songs, slides, and media, with a unified drag-and-drop editor and robust projection system.

---

## Core Features

### 1. Setlist Management

- Create, edit, delete, and reorder setlists
- Save/load setlists locally (lmdbjs)
- Duplicate setlists

### 2. Song & Slide Editor (Unified)

- Import/paste lyrics, drag lines/sections onto slides
- Drag-and-drop text/media boxes on slide canvas
- Add images, videos, and audio to individual slides
- Double-click to edit text boxes
- Resize/reposition boxes
- Slide templates (built-in and user-defined)
- Text formatting (font, size, color, bold, italic, alignment)
- Live preview of current slide
- Slide navigation sidebar (thumbnails)
- Group slides by song section (verse, chorus, bridge)
- Keyboard shortcuts for main actions

### 3. Media Management

- Add images, videos, and audio to slides
- Media library for quick access

### 4. Projection/Presenting System

- Dual-window architecture: Control Window & Presentation Window
- Presentation Window: always full-screen, borderless, on user-selected display
- Control Window: live preview, next slide preview, slide navigation
- Blackout and logo buttons for quick control
- Real-time updates via IPC

### 5. Templates

- Built-in templates (scripture, announcement, etc.)
- User-defined templates (save/apply)

### 6. Accessibility

- Keyboard shortcuts for navigation, blackout, logo, etc.

### 7. Data Management

- Offline-first, local storage with lmdbjs
- No user accounts

### 8. Future Features (Not in MVP)

- Chord charts and advanced lyric features
- Export/import (PDF, images, PowerPoint, etc.)
- Cloud sync
- Remote control (mobile/web)

---

## Technical Architecture

- **Electron**: Multi-window management (Control & Presentation)
- **Vite + React**: Frontend framework
- **Tailwind + shadcn/ui**: UI styling and components
- **Zustand**: State management
- **lmdbjs**: Local, offline data storage
- **IPC**: Real-time communication between windows

---

## Development Phases & Day-by-Day Plan

### Phase 1: Project Setup & Boilerplate (Day 1) — **In Progress**

- [x] Initialize project with Electron, Vite, React, Tailwind, shadcn/ui, Zustand, lmdbjs
- [x] Set up basic Electron multi-window structure (Control & Presentation)
- [x] Configure Tailwind and shadcn/ui
- [x] created sidebar component using shadcn/ui 
- [x] Set up Zustand store
- [ ] Set up IPC communication skeleton

### Phase 2: Core Data Models & Persistence (Day 2)

- Define data models for setlists, songs, slides, media
- Implement lmdbjs storage and CRUD operations
- Basic UI for setlist/song/slide management (list, add, delete)

### Phase 3: Unified Slide & Lyrics Editor (Days 3–5)

- Implement drag-and-drop slide editor canvas
- Add text/media box creation, editing, resizing, repositioning
- Lyrics import/paste panel, drag lines to slides
- Live preview of current slide
- Slide navigation sidebar (thumbnails)
- Keyboard shortcuts for editor actions

### Phase 4: Media & Audio Integration (Day 6)

- Add support for images, videos, and audio on slides
- Media library UI
- Audio controls per slide

### Phase 5: Templates & Formatting (Day 7)

- Implement built-in templates (scripture, announcement, etc.)
- Allow users to create/save/apply custom templates
- Text formatting options (font, size, color, etc.)

### Phase 6: Projection/Presenting System (Days 8–9)

- Presentation Window: full-screen, borderless, display selection
- Control Window: live preview, next slide preview
- Blackout and logo buttons
- Real-time slide updates via IPC

### Phase 7: Polish & Accessibility (Day 10)

- Refine UI/UX
- Add keyboard shortcuts for all main actions
- Test on multiple displays
- Bug fixes and performance improvements

### Phase 8: Documentation & Release Prep (Day 11)

- Write user documentation
- Add onboarding/help screens
- Prepare for open-source release

---

## Notes

- Each phase includes testing and code review.
- Future features will be planned after MVP release.
- Timeline is flexible and can be adjusted as needed.
