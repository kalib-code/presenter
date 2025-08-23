# API Documentation - IPC Communication Reference

## Table of Contents
- [Overview](#overview)
- [IPC Architecture](#ipc-architecture)
- [API Categories](#api-categories)
- [Core APIs](#core-apis)
- [Database APIs](#database-apis)
- [Media APIs](#media-apis)
- [Display APIs](#display-apis)
- [Projection APIs](#projection-apis)
- [System APIs](#system-apis)
- [Error Handling](#error-handling)
- [Type Definitions](#type-definitions)

## Overview

The Presenter application uses Electron's Inter-Process Communication (IPC) for secure communication between the main process and renderer processes. All system-level operations are handled in the main process and exposed to the renderer through a carefully controlled API.

## IPC Architecture

### Communication Flow

```
Renderer Process          Preload Script          Main Process
      │                        │                       │
      │  window.electron.      │                       │
      │    invoke()            │                       │
      ├───────────────────────>│                       │
      │                        │   ipcRenderer.        │
      │                        │     invoke()          │
      │                        ├──────────────────────>│
      │                        │                       │
      │                        │                       │ Handle Request
      │                        │                       │ Database/File Op
      │                        │                       │
      │                        │<──────────────────────┤
      │<───────────────────────┤                       │
      │     Promise<T>         │      Result          │
```

### API Access Pattern

```typescript
// Renderer Process
const result = await window.electron.invoke('channel-name', ...args)

// Main Process Handler
ipcMain.handle('channel-name', async (event, ...args) => {
  // Process and return result
  return result
})
```

## API Categories

1. **Core APIs**: Basic application functionality
2. **Database APIs**: CRUD operations for all entities
3. **Media APIs**: File upload, management, and retrieval
4. **Display APIs**: Screen detection and configuration
5. **Projection APIs**: Content projection and control
6. **System APIs**: Fonts, updates, and system integration

## Core APIs

### ping
Test IPC connection

**Channel**: `ping`  
**Parameters**: None  
**Returns**: `'pong'`  
**Example**:
```typescript
const response = await window.electron.invoke('ping')
console.log(response) // 'pong'
```

### clear-database
Clear all database contents (development only)

**Channel**: `clear-database`  
**Parameters**: None  
**Returns**: `string` - Success message  
**Example**:
```typescript
await window.electron.invoke('clear-database')
```

## Database APIs

### Songs

#### list-songs
Get all songs from the database

**Channel**: `list-songs`  
**Parameters**: None  
**Returns**: `Song[]`  
**Example**:
```typescript
const songs = await window.electron.invoke('list-songs')
```

#### create-song
Create a new song

**Channel**: `create-song`  
**Parameters**: 
- `name: string` - Song name

**Returns**: `Song[]` - Updated song list  
**Example**:
```typescript
const songs = await window.electron.invoke('create-song', 'Amazing Grace')
```

#### get-song
Get a specific song by ID

**Channel**: `get-song`  
**Parameters**: 
- `id: string` - Song ID

**Returns**: `Song | null`  
**Example**:
```typescript
const song = await window.electron.invoke('get-song', 'song-123')
```

#### update-song
Update an existing song

**Channel**: `update-song`  
**Parameters**: 
- `id: string` - Song ID
- `data: Partial<Song>` - Update data

**Returns**: `Song[]` - Updated song list  
**Example**:
```typescript
const songs = await window.electron.invoke('update-song', 'song-123', {
  name: 'Updated Name',
  artist: 'John Doe'
})
```

#### delete-song
Delete a song

**Channel**: `delete-song`  
**Parameters**: 
- `id: string` - Song ID

**Returns**: `Song[]` - Updated song list  
**Example**:
```typescript
const songs = await window.electron.invoke('delete-song', 'song-123')
```

### Setlists

#### list-setlists
Get all setlists

**Channel**: `list-setlists`  
**Parameters**: None  
**Returns**: `Setlist[]`

#### create-setlist
Create a new setlist

**Channel**: `create-setlist`  
**Parameters**: 
- `data: Omit<Setlist, 'id' | 'createdAt' | 'updatedAt' | 'version'>`

**Returns**: `Setlist[]`

#### get-setlist
Get a specific setlist

**Channel**: `get-setlist`  
**Parameters**: 
- `id: string`

**Returns**: `Setlist | null`

#### update-setlist
Update a setlist

**Channel**: `update-setlist`  
**Parameters**: 
- `id: string`
- `data: Partial<Setlist>`

**Returns**: `Setlist[]`

#### delete-setlist
Delete a setlist

**Channel**: `delete-setlist`  
**Parameters**: 
- `id: string`

**Returns**: `Setlist[]`

### Presentations

#### list-presentations
Get all presentations

**Channel**: `list-presentations`  
**Parameters**: None  
**Returns**: `Presentation[]`

#### create-presentation
Create a new presentation

**Channel**: `create-presentation`  
**Parameters**: 
- `data: Omit<Presentation, 'id' | 'createdAt' | 'updatedAt' | 'version'>`

**Returns**: `Presentation[]`

#### get-presentation
Get a specific presentation

**Channel**: `get-presentation`  
**Parameters**: 
- `id: string`

**Returns**: `Presentation | null`

#### update-presentation
Update a presentation

**Channel**: `update-presentation`  
**Parameters**: 
- `id: string`
- `data: Partial<Presentation>`

**Returns**: `Presentation[]`

#### delete-presentation
Delete a presentation

**Channel**: `delete-presentation`  
**Parameters**: 
- `id: string`

**Returns**: `Presentation[]`

### Media Library

#### list-media
Get all media items

**Channel**: `list-media`  
**Parameters**: None  
**Returns**: `Media[]`

#### create-media
Add media to library

**Channel**: `create-media`  
**Parameters**: 
- `data: Omit<Media, 'id' | 'createdAt' | 'updatedAt' | 'version'>`

**Returns**: `Media[]`

#### get-media
Get specific media item

**Channel**: `get-media`  
**Parameters**: 
- `id: string`

**Returns**: `Media | null`

#### update-media
Update media metadata

**Channel**: `update-media`  
**Parameters**: 
- `id: string`
- `data: Partial<Media>`

**Returns**: `Media[]`

#### delete-media
Remove media from library

**Channel**: `delete-media`  
**Parameters**: 
- `id: string`

**Returns**: `Media[]`

### Settings

#### list-settings
Get all settings

**Channel**: `list-settings`  
**Parameters**: None  
**Returns**: `Settings[]`

#### create-setting
Create a setting

**Channel**: `create-setting`  
**Parameters**: 
- `data: Omit<Settings, 'createdAt' | 'updatedAt' | 'version'>`

**Returns**: `Settings[]`

#### get-setting
Get a specific setting

**Channel**: `get-setting`  
**Parameters**: 
- `id: string`

**Returns**: `Settings | null`

#### update-setting
Update a setting

**Channel**: `update-setting`  
**Parameters**: 
- `id: string`
- `data: Partial<Settings>`

**Returns**: `Settings[]`

#### delete-setting
Delete a setting

**Channel**: `delete-setting`  
**Parameters**: 
- `id: string`

**Returns**: `Settings[]`

## Media APIs

### File Management

#### upload-media
Upload media file to application storage

**Channel**: `upload-media`  
**Parameters**: 
- `filePath: string` - Source file path

**Returns**: 
```typescript
{
  success: boolean
  filename?: string
  error?: string
}
```

#### list-media-files
List all media files in storage

**Channel**: `list-media-files`  
**Parameters**: None  
**Returns**: 
```typescript
Array<{
  name: string
  size: number
  type: string
  createdAt: string
}>
```

#### delete-media-file
Delete a media file

**Channel**: `delete-media-file`  
**Parameters**: 
- `filename: string`

**Returns**: `boolean`

### File Access

#### get-media-file-url
Get file:// URL for media

**Channel**: `get-media-file-url`  
**Parameters**: 
- `filename: string`

**Returns**: `string | null` - File URL

#### get-media-data-url
Get base64 data URL for media

**Channel**: `get-media-data-url`  
**Parameters**: 
- `filename: string`

**Returns**: `string | null` - Data URL

#### get-media-file-path
Get absolute file path

**Channel**: `get-media-file-path`  
**Parameters**: 
- `filename: string`

**Returns**: `string | null` - File path

#### media-file-exists
Check if media file exists

**Channel**: `media-file-exists`  
**Parameters**: 
- `filename: string`

**Returns**: `boolean`

#### save-media-file
Save media data to file

**Channel**: `save-media-file`  
**Parameters**:
```typescript
{
  filename: string
  data: string  // base64 or file path
  type: 'base64' | 'file'
}
```

**Returns**:
```typescript
{
  success: boolean
  filename?: string
  error?: string
}
```

#### find-media-by-checksum
Find media file by checksum

**Channel**: `find-media-by-checksum`  
**Parameters**: 
- `checksum: string`

**Returns**: `string | null` - Filename

## Display APIs

### get-displays
Get all available displays

**Channel**: `get-displays`  
**Parameters**: None  
**Returns**:
```typescript
Array<{
  id: number
  label: string
  bounds: {
    x: number
    y: number
    width: number
    height: number
  }
  workArea: {
    x: number
    y: number
    width: number
    height: number
  }
  scaleFactor: number
  rotation: number
  internal: boolean
  primary?: boolean
}>
```

### get-projection-display
Get current projection display

**Channel**: `get-projection-display`  
**Parameters**: None  
**Returns**: Display object or null

### set-projection-display
Set projection display

**Channel**: `set-projection-display`  
**Parameters**: 
- `displayId: number`

**Returns**: `void`

## Projection APIs

### project-content
Project content to display (Event-based)

**Channel**: `project-content`  
**Type**: `ipcMain.on`  
**Parameters**:
```typescript
{
  title: string
  content: string
  type: string
  slideData?: any
}
```

### toggle-blank
Toggle blank screen

**Channel**: `toggle-blank`  
**Type**: `ipcMain.on`  
**Parameters**: 
- `isBlank: boolean`

### toggle-logo
Toggle logo display

**Channel**: `toggle-logo`  
**Type**: `ipcMain.on`  
**Parameters**: 
- `showLogo: boolean`

### stop-projection
Stop projection window

**Channel**: `stop-projection`  
**Type**: `ipcMain.on`  
**Parameters**: None

### Media Control

#### media-play
Play media

**Channel**: `media-play`  
**Type**: `ipcMain.on`  
**Parameters**: 
- `mediaId?: string`

#### media-pause
Pause media

**Channel**: `media-pause`  
**Type**: `ipcMain.on`  
**Parameters**: 
- `mediaId?: string`

#### media-stop
Stop media

**Channel**: `media-stop`  
**Type**: `ipcMain.on`  
**Parameters**: 
- `mediaId?: string`

#### media-volume
Set media volume

**Channel**: `media-volume`  
**Type**: `ipcMain.on`  
**Parameters**: 
- `volume: number` (0-1)
- `mediaId?: string`

#### media-mute
Toggle media mute

**Channel**: `media-mute`  
**Type**: `ipcMain.on`  
**Parameters**: 
- `muted: boolean`
- `mediaId?: string`

## System APIs

### Auto-Updater

#### check-for-updates
Check for application updates

**Channel**: `check-for-updates`  
**Parameters**: None  
**Returns**: Update info or null

#### quit-and-install
Quit and install update

**Channel**: `quit-and-install`  
**Parameters**: None  
**Returns**: `void`

### Font Management

#### get-system-fonts
Get available system fonts

**Channel**: `get-system-fonts`  
**Parameters**: None  
**Returns**: `string[]` - Font family names

#### upload-custom-font
Upload custom font file

**Channel**: `upload-custom-font`  
**Parameters**: None (opens file dialog)  
**Returns**:
```typescript
{
  success: boolean
  fonts?: Array<{
    id: string
    family: string
    style: string
    weight: string
    filename: string
  }>
  error?: string
}
```

#### get-custom-fonts
Get all custom fonts

**Channel**: `get-custom-fonts`  
**Parameters**: None  
**Returns**: Custom font array

#### delete-custom-font
Delete custom font

**Channel**: `delete-custom-font`  
**Parameters**: 
- `fontId: string`

**Returns**:
```typescript
{
  success: boolean
  message?: string
}
```

#### get-font-url
Get font file URL

**Channel**: `get-font-url`  
**Parameters**: 
- `fontId: string`

**Returns**: `string | null`

## Error Handling

### Standard Error Response
```typescript
{
  success: false,
  error: string,
  code?: string,
  details?: any
}
```

### Error Codes
- `ENTITY_NOT_FOUND`: Requested entity doesn't exist
- `INVALID_INPUT`: Invalid parameters provided
- `FILE_NOT_FOUND`: File doesn't exist
- `PERMISSION_DENIED`: Insufficient permissions
- `STORAGE_ERROR`: Database operation failed
- `NETWORK_ERROR`: Network operation failed

### Error Handling Example
```typescript
try {
  const result = await window.electron.invoke('get-song', songId)
  if (!result) {
    throw new Error('Song not found')
  }
  // Use result
} catch (error) {
  console.error('Failed to get song:', error)
  // Handle error appropriately
}
```

## Type Definitions

### Core Types

```typescript
interface BaseEntity {
  id: string
  createdAt: number
  updatedAt: number
  createdBy: string
  version: number
}

interface Song extends BaseEntity {
  name: string
  artist?: string
  album?: string
  year?: number
  genre?: string
  tempo?: number
  key?: string
  duration?: number
  lyrics: string
  slides: Slide[]
  tags: string[]
  isPublic: boolean
  globalBackground?: Background
}

interface Slide {
  id: string
  type: 'verse' | 'chorus' | 'bridge' | 'intro' | 'outro' | 'custom'
  title: string
  content: string
  elements: SlideElement[]
  background?: Background
  transition?: Transition
  order: number
  notes?: string
}

interface SlideElement {
  id: string
  type: 'text' | 'image' | 'video' | 'audio' | 'shape'
  position: { x: number; y: number }
  size: { width: number; height: number }
  content: SlideElementContent
  style: ElementStyle
  zIndex: number
}

interface Setlist extends BaseEntity {
  name: string
  description?: string
  items: SetlistItem[]
  tags: string[]
  isPublic: boolean
  estimatedDuration: number
}

interface SetlistItem {
  id: string
  type: 'song' | 'presentation' | 'media' | 'announcement' | 'countdown'
  referenceId: string
  title: string
  duration?: number
  notes?: string
  order: number
  isActive: boolean
  countdownConfig?: CountdownConfig
}

interface Presentation extends BaseEntity {
  name: string
  type: 'scripture' | 'announcement' | 'custom'
  slides: PresentationSlide[]
  background?: Background
  theme?: Theme
  isPublic: boolean
}

interface Media extends BaseEntity {
  name: string
  filename: string
  path: string
  type: 'image' | 'video' | 'audio'
  mimeType: string
  size: number
  dimensions?: {
    width: number
    height: number
  }
  duration?: number
  thumbnail?: string
  tags: string[]
  isPublic: boolean
  checksum: string
}

interface Settings extends BaseEntity {
  value: unknown
  type: 'string' | 'number' | 'boolean' | 'object'
  category: 'app' | 'editor' | 'presentation' | 'media'
  description?: string
}
```

### Supporting Types

```typescript
interface Background {
  type: 'color' | 'image' | 'video' | 'gradient'
  value: string
  opacity?: number
  blur?: number
  overlay?: string
  playbackRate?: number
  size?: 'cover' | 'contain' | 'fill' | 'none'
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right'
}

interface Transition {
  type: 'fade' | 'slide' | 'zoom' | 'flip' | 'none'
  duration: number
  direction?: 'left' | 'right' | 'up' | 'down'
  easing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear'
}

interface ElementStyle {
  fontFamily?: string
  fontSize?: number
  fontWeight?: string | number
  fontStyle?: 'normal' | 'italic'
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  color?: string
  backgroundColor?: string
  padding?: number
  margin?: number
  borderRadius?: number
  border?: string
  opacity?: number
  shadow?: string
}

interface Theme {
  id: string
  name: string
  colors: {
    primary: string
    secondary: string
    background: string
    text: string
    accent: string
  }
  fonts: {
    primary: string
    secondary: string
    heading: string
  }
  spacing: {
    small: number
    medium: number
    large: number
  }
}
```

## Usage Examples

### Complete CRUD Example
```typescript
// Create a new song
const songs = await window.electron.invoke('create-song', 'New Song')
const newSong = songs[songs.length - 1]

// Update the song
await window.electron.invoke('update-song', newSong.id, {
  artist: 'Artist Name',
  slides: [
    {
      id: 'slide-1',
      type: 'verse',
      title: 'Verse 1',
      content: 'First verse lyrics',
      elements: [],
      order: 0
    }
  ]
})

// Get the updated song
const updatedSong = await window.electron.invoke('get-song', newSong.id)

// Delete the song
await window.electron.invoke('delete-song', newSong.id)
```

### Media Upload Example
```typescript
// Upload media file
const uploadResult = await window.electron.invoke('upload-media', '/path/to/file.jpg')

if (uploadResult.success) {
  // Create media library entry
  await window.electron.invoke('create-media', {
    name: 'My Image',
    filename: uploadResult.filename,
    path: uploadResult.filename,
    type: 'image',
    mimeType: 'image/jpeg',
    size: 1024000,
    dimensions: { width: 1920, height: 1080 },
    tags: ['background'],
    isPublic: true,
    checksum: 'abc123',
    createdBy: 'user-1'
  })
  
  // Get media URL for display
  const mediaUrl = await window.electron.invoke('get-media-file-url', uploadResult.filename)
}
```

### Projection Control Example
```typescript
// Get available displays
const displays = await window.electron.invoke('get-displays')

// Set projection display
if (displays.length > 1) {
  await window.electron.invoke('set-projection-display', displays[1].id)
}

// Project content
window.electron.ipcRenderer.send('project-content', {
  title: 'Slide Title',
  content: 'Slide content',
  type: 'slide',
  slideData: { /* slide data */ }
})

// Control projection
window.electron.ipcRenderer.send('toggle-blank', true)  // Blank screen
window.electron.ipcRenderer.send('toggle-logo', true)   // Show logo
window.electron.ipcRenderer.send('stop-projection')      // Stop projection
```