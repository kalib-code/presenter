# Database Schema

This document outlines the NoSQL database schema design for the Presenter App using LMDB (Lightning Memory-Mapped Database).

## Overview

The application uses LMDB for local, offline storage with the following characteristics:

- **Key-Value Store**: LMDB is a key-value database
- **ACID Compliance**: Full ACID transactions
- **Memory-Mapped**: High performance with memory mapping
- **Single Writer**: Concurrent reads, single writer
- **Compression**: Built-in compression support

## Database Structure

### Database Files

```
userData/
├── songs.lmdb          # Song data and metadata
├── setlists.lmdb       # Setlist collections
├── presentations.lmdb  # Presentation data
├── media.lmdb         # Media asset metadata
├── templates.lmdb     # Template definitions
└── settings.lmdb      # Application settings
```

## Core Data Models

### 1. Songs Database (`songs.lmdb`)

#### Song Record

```typescript
interface Song {
  id: string; // Unique identifier
  name: string; // Song title
  artist?: string; // Artist name
  album?: string; // Album name
  year?: number; // Release year
  genre?: string; // Music genre
  tempo?: number; // BPM
  key?: string; // Musical key
  duration?: number; // Duration in seconds
  lyrics: string; // Full lyrics text
  slides: Slide[]; // Slide definitions
  tags: string[]; // Searchable tags
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
  createdBy: string; // User ID
  isPublic: boolean; // Public/private flag
  version: number; // Version for sync
}

interface Slide {
  id: string;
  type: "verse" | "chorus" | "bridge" | "intro" | "outro" | "custom";
  title: string;
  content: string;
  elements: SlideElement[];
  background?: Background;
  transition?: Transition;
  order: number;
}

interface SlideElement {
  id: string;
  type: "text" | "image" | "video" | "audio" | "shape";
  position: { x: number; y: number };
  size: { width: number; height: number };
  content: any;
  style: ElementStyle;
  zIndex: number;
}
```

#### Key Structure

```
songs/
├── by-id/{songId}              # Song by ID
├── by-name/{songName}          # Song by name (index)
├── by-artist/{artistName}      # Songs by artist (index)
├── by-tag/{tagName}            # Songs by tag (index)
├── by-date/{timestamp}         # Songs by creation date (index)
└── metadata/
    ├── total-count             # Total song count
    ├── last-updated            # Last update timestamp
    └── version                 # Database version
```

### 2. Setlists Database (`setlists.lmdb`)

#### Setlist Record

```typescript
interface Setlist {
  id: string; // Unique identifier
  name: string; // Setlist name
  description?: string; // Description
  items: SetlistItem[]; // Ordered items
  tags: string[]; // Searchable tags
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
  createdBy: string; // User ID
  isPublic: boolean; // Public/private flag
  version: number; // Version for sync
  estimatedDuration: number; // Estimated duration in minutes
}

interface SetlistItem {
  id: string;
  type: "song" | "presentation" | "media" | "announcement";
  referenceId: string; // ID of referenced item
  title: string; // Display title
  duration?: number; // Expected duration
  notes?: string; // Presenter notes
  order: number; // Position in setlist
  isActive: boolean; // Active/inactive flag
}
```

#### Key Structure

```
setlists/
├── by-id/{setlistId}           # Setlist by ID
├── by-name/{setlistName}       # Setlist by name (index)
├── by-tag/{tagName}            # Setlists by tag (index)
├── by-date/{timestamp}         # Setlists by creation date (index)
└── metadata/
    ├── total-count             # Total setlist count
    ├── last-updated            # Last update timestamp
    └── version                 # Database version
```

### 3. Presentations Database (`presentations.lmdb`)

#### Presentation Record

```typescript
interface Presentation {
  id: string; // Unique identifier
  name: string; // Presentation name
  type: "scripture" | "announcement" | "custom";
  slides: PresentationSlide[]; // Slide definitions
  background?: Background; // Default background
  theme?: Theme; // Visual theme
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
  createdBy: string; // User ID
  isPublic: boolean; // Public/private flag
  version: number; // Version for sync
}

interface PresentationSlide {
  id: string;
  title: string;
  content: string;
  elements: SlideElement[];
  background?: Background;
  transition?: Transition;
  order: number;
  notes?: string;
}
```

#### Key Structure

```
presentations/
├── by-id/{presentationId}      # Presentation by ID
├── by-name/{presentationName}  # Presentation by name (index)
├── by-type/{type}              # Presentations by type (index)
├── by-date/{timestamp}         # Presentations by creation date (index)
└── metadata/
    ├── total-count             # Total presentation count
    ├── last-updated            # Last update timestamp
    └── version                 # Database version
```

### 4. Media Database (`media.lmdb`)

#### Media Record

```typescript
interface Media {
  id: string; // Unique identifier
  name: string; // Display name
  filename: string; // Original filename
  path: string; // File path
  type: "image" | "video" | "audio";
  mimeType: string; // MIME type
  size: number; // File size in bytes
  dimensions?: {
    // For images/videos
    width: number;
    height: number;
  };
  duration?: number; // For videos/audio (seconds)
  thumbnail?: string; // Thumbnail path
  tags: string[]; // Searchable tags
  createdAt: number; // Unix timestamp
  createdBy: string; // User ID
  isPublic: boolean; // Public/private flag
  version: number; // Version for sync
  checksum: string; // File integrity check
}
```

#### Key Structure

```
media/
├── by-id/{mediaId}             # Media by ID
├── by-name/{mediaName}         # Media by name (index)
├── by-type/{mediaType}         # Media by type (index)
├── by-tag/{tagName}            # Media by tag (index)
├── by-date/{timestamp}         # Media by creation date (index)
└── metadata/
    ├── total-count             # Total media count
    ├── total-size              # Total storage used
    ├── last-updated            # Last update timestamp
    └── version                 # Database version
```

### 5. Templates Database (`templates.lmdb`)

#### Template Record

```typescript
interface Template {
  id: string; // Unique identifier
  name: string; // Template name
  category: "song" | "scripture" | "announcement" | "custom";
  description?: string; // Template description
  thumbnail?: string; // Preview thumbnail
  slides: TemplateSlide[]; // Default slide structure
  theme?: Theme; // Default theme
  isBuiltIn: boolean; // Built-in vs custom
  createdAt: number; // Unix timestamp
  createdBy: string; // User ID
  version: number; // Version for sync
}

interface TemplateSlide {
  id: string;
  title: string;
  elements: TemplateElement[];
  background?: Background;
  isDefault: boolean; // Default slide for category
}
```

#### Key Structure

```
templates/
├── by-id/{templateId}          # Template by ID
├── by-name/{templateName}      # Template by name (index)
├── by-category/{category}      # Templates by category (index)
├── built-in/                   # Built-in templates
└── metadata/
    ├── total-count             # Total template count
    ├── last-updated            # Last update timestamp
    └── version                 # Database version
```

### 6. Settings Database (`settings.lmdb`)

#### Settings Record

```typescript
interface Settings {
  id: string; // Setting key
  value: any; // Setting value
  type: "string" | "number" | "boolean" | "object";
  category: "app" | "editor" | "presentation" | "media";
  description?: string; // Setting description
  updatedAt: number; // Unix timestamp
  updatedBy: string; // User ID
}

interface AppSettings {
  theme: "light" | "dark" | "system";
  language: string;
  autoSave: boolean;
  autoSaveInterval: number;
  defaultTemplate: string;
  mediaLibraryPath: string;
}

interface EditorSettings {
  defaultFont: string;
  defaultFontSize: number;
  gridSnap: boolean;
  gridSize: number;
  showRulers: boolean;
  showGuides: boolean;
  zoomLevel: number;
}

interface PresentationSettings {
  defaultTransition: string;
  defaultDuration: number;
  autoAdvance: boolean;
  showNotes: boolean;
  stageDisplay: boolean;
}
```

#### Key Structure

```
settings/
├── app/                        # Application settings
├── editor/                     # Editor settings
├── presentation/               # Presentation settings
├── media/                      # Media settings
└── metadata/
    ├── last-updated            # Last update timestamp
    └── version                 # Database version
```

## Indexing Strategy

### Primary Indexes

- **ID-based**: Direct access by unique identifier
- **Name-based**: Search by name with fuzzy matching
- **Type-based**: Filter by content type
- **Date-based**: Time-based queries and sorting
- **Tag-based**: Tag-based search and filtering

### Secondary Indexes

- **Artist/Author**: For songs and presentations
- **Category**: For templates and presentations
- **Size**: For media files
- **Duration**: For songs and media
- **Status**: Active/inactive items

## Data Relationships

### 1. Song Relationships

```
Song → Slides → Elements
Song → Media (backgrounds, audio)
Song → Templates (creation)
```

### 2. Setlist Relationships

```
Setlist → Songs (references)
Setlist → Presentations (references)
Setlist → Media (references)
```

### 3. Presentation Relationships

```
Presentation → Slides → Elements
Presentation → Templates (based on)
Presentation → Media (backgrounds, media)
```

### 4. Media Relationships

```
Media → Songs (used in)
Media → Presentations (used in)
Media → Templates (used in)
```

## Storage Optimization

### 1. Compression

- Enable LMDB compression for all databases
- Use appropriate compression algorithms per data type
- Compress large text fields (lyrics, content)

### 2. Deduplication

- Media files: Store once, reference by ID
- Templates: Share common elements
- Styles: Reuse common style definitions

### 3. Caching

- Frequently accessed data in memory
- Thumbnail generation and caching
- Search index caching

## Migration Strategy

### Version Management

- Each database has a version field
- Migration scripts for schema updates
- Backward compatibility support
- Data validation on migration

### Backup Strategy

- Regular database snapshots
- Incremental backups
- Export/import functionality
- Cloud backup integration (optional)

## Performance Considerations

### 1. Read Performance

- Memory-mapped access for fast reads
- Indexed queries for common patterns
- Cached frequently accessed data

### 2. Write Performance

- Batch operations for bulk updates
- Transaction batching
- Optimistic locking for concurrent access

### 3. Storage Efficiency

- Compressed storage
- Efficient data serialization
- Garbage collection for deleted items

## Security Considerations

### 1. Data Integrity

- Checksums for media files
- Transaction rollback on errors
- Data validation on input

### 2. Access Control

- User-based permissions
- Public/private content flags
- Audit trails for changes

### 3. Privacy

- Local storage only (no cloud sync by default)
- Encrypted sensitive data
- Secure deletion of removed content
