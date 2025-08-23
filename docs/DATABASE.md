# Database Documentation - Schema and Patterns

## Table of Contents
- [Overview](#overview)
- [Database Technology](#database-technology)
- [Entity Schemas](#entity-schemas)
- [Relationships](#relationships)
- [Data Access Patterns](#data-access-patterns)
- [Migration Strategy](#migration-strategy)
- [Performance Optimization](#performance-optimization)
- [Backup and Recovery](#backup-and-recovery)
- [Best Practices](#best-practices)

## Overview

The Presenter application uses LMDB (Lightning Memory-Mapped Database) for local data persistence. LMDB provides:
- ACID transactions
- Zero-copy reads
- Excellent performance
- Small footprint
- Crash resilience
- No separate server process

## Database Technology

### LMDB Configuration

```typescript
// Database initialization
import { open } from 'lmdb'

const db = open<EntityType>({
  path: join(app.getPath('userData'), 'database.lmdb'),
  compression: true,
  encoding: 'msgpack',
  maxDbs: 10,
  mapSize: 1024 * 1024 * 1024 // 1GB
})
```

### Database Files

Location: `~/Library/Application Support/presenter/` (macOS)
- `songs.lmdb`: Song data
- `setlists.lmdb`: Setlist data
- `presentations.lmdb`: Presentation data
- `media.lmdb`: Media metadata
- `templates.lmdb`: Template data
- `settings.lmdb`: Application settings

## Entity Schemas

### Base Entity

All entities inherit from BaseEntity:

```typescript
interface BaseEntity {
  id: string           // Unique identifier (timestamp + random)
  createdAt: number    // Unix timestamp
  updatedAt: number    // Unix timestamp
  createdBy: string    // User identifier
  version: number      // Schema version for migration
}
```

### Song Entity

```typescript
interface Song extends BaseEntity {
  // Basic Information
  name: string
  artist?: string
  album?: string
  year?: number
  genre?: string
  
  // Musical Information
  tempo?: number       // BPM
  key?: string        // Musical key
  duration?: number   // Seconds
  
  // Content
  lyrics: string      // Plain text lyrics
  slides: Slide[]     // Slide collection
  
  // Metadata
  tags: string[]
  isPublic: boolean
  globalBackground?: Background
}
```

#### Slide Sub-Entity

```typescript
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
```

#### SlideElement Sub-Entity

```typescript
interface SlideElement {
  id: string
  type: 'text' | 'image' | 'video' | 'audio' | 'shape'
  position: { x: number; y: number }
  size: { width: number; height: number }
  content: SlideElementContent
  style: ElementStyle
  zIndex: number
}

type SlideElementContent = 
  | { type: 'text'; text: string }
  | { type: 'image'; url: string; alt?: string }
  | { type: 'video'; url: string; autoplay?: boolean; loop?: boolean }
  | { type: 'audio'; url: string; autoplay?: boolean; loop?: boolean }
  | { type: 'shape'; shape: 'rectangle' | 'circle' | 'triangle'; fill?: string }
```

### Setlist Entity

```typescript
interface Setlist extends BaseEntity {
  name: string
  description?: string
  items: SetlistItem[]
  tags: string[]
  isPublic: boolean
  estimatedDuration: number  // Total duration in seconds
}
```

#### SetlistItem Sub-Entity

```typescript
interface SetlistItem {
  id: string
  type: 'song' | 'presentation' | 'media' | 'announcement' | 'countdown'
  referenceId: string      // ID of referenced entity
  title: string            // Display title
  duration?: number        // Override duration
  notes?: string
  order: number
  isActive: boolean
  
  // Countdown specific
  countdownConfig?: {
    title?: string
    message?: string
    duration?: number
    styling?: CountdownStyling
    background?: Background
  }
}
```

### Presentation Entity

```typescript
interface Presentation extends BaseEntity {
  name: string
  type: 'scripture' | 'announcement' | 'custom'
  slides: PresentationSlide[]
  background?: Background
  theme?: Theme
  isPublic: boolean
}
```

#### PresentationSlide Sub-Entity

```typescript
interface PresentationSlide {
  id: string
  title: string
  content: string
  elements: SlideElement[]
  background?: Background
  transition?: Transition
  order: number
  notes?: string
}
```

### Media Entity

```typescript
interface Media extends BaseEntity {
  // File Information
  name: string
  filename: string      // Stored filename
  path: string         // Relative path
  type: 'image' | 'video' | 'audio'
  mimeType: string
  size: number         // Bytes
  
  // Media Properties
  dimensions?: {
    width: number
    height: number
  }
  duration?: number    // Seconds (video/audio)
  thumbnail?: string   // Base64 or path
  
  // Metadata
  tags: string[]
  isPublic: boolean
  checksum: string     // File integrity
}
```

### Template Entity

```typescript
interface Template extends BaseEntity {
  name: string
  category: 'song' | 'scripture' | 'announcement' | 'custom'
  description?: string
  thumbnail?: string    // Preview image
  slides: TemplateSlide[]
  theme?: Theme
  isBuiltIn: boolean   // System vs user template
}
```

#### TemplateSlide Sub-Entity

```typescript
interface TemplateSlide {
  id: string
  title: string
  elements: TemplateElement[]
  background?: Background
  isDefault: boolean
}

interface TemplateElement {
  id: string
  type: 'text' | 'image' | 'placeholder'
  position: { x: number; y: number }
  size: { width: number; height: number }
  style: ElementStyle
  placeholder?: string  // Placeholder text
  required?: boolean
}
```

### Settings Entity

```typescript
interface Settings extends BaseEntity {
  value: unknown       // Flexible value type
  type: 'string' | 'number' | 'boolean' | 'object'
  category: 'app' | 'editor' | 'presentation' | 'media'
  description?: string
}
```

### Supporting Types

```typescript
interface Background {
  type: 'color' | 'image' | 'video' | 'gradient'
  value: string        // Color hex, URL, or gradient
  opacity?: number     // 0-1
  blur?: number       // Blur amount
  overlay?: string    // Overlay color
  playbackRate?: number  // Video speed
  size?: 'cover' | 'contain' | 'fill' | 'none'
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right'
}

interface Transition {
  type: 'fade' | 'slide' | 'zoom' | 'flip' | 'none'
  duration: number     // Milliseconds
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

## Relationships

### Entity Relationship Diagram

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│    Song     │     │   Setlist    │     │Presentation │
├─────────────┤     ├──────────────┤     ├─────────────┤
│ id          │     │ id           │     │ id          │
│ slides[]    │     │ items[]      │     │ slides[]    │
└─────────────┘     └──────┬───────┘     └─────────────┘
                           │
                           │ references
                           ▼
              ┌────────────────────────┐
              │    SetlistItem         │
              ├────────────────────────┤
              │ type                   │
              │ referenceId ───────────┼──> Song/Presentation/Media
              └────────────────────────┘

┌─────────────┐     ┌──────────────┐
│   Media     │     │   Template   │
├─────────────┤     ├──────────────┤
│ id          │     │ id           │
│ filename    │     │ slides[]     │
└─────────────┘     └──────────────┘
```

### Reference Patterns

1. **Direct Embedding**: Slides are embedded in Songs
2. **Foreign Key References**: SetlistItems reference other entities by ID
3. **Soft References**: Media URLs in slide elements
4. **No Cascading Deletes**: References must be cleaned manually

## Data Access Patterns

### CRUD Operations

#### Create Pattern
```typescript
async function createEntity<T extends BaseEntity>(
  db: Database<T>,
  data: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'version'>
): Promise<T> {
  const entity: T = {
    ...data,
    id: generateId(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: 1
  }
  
  await db.put(entity.id, entity)
  return entity
}
```

#### Read Pattern
```typescript
async function getEntity<T>(db: Database<T>, id: string): Promise<T | null> {
  try {
    return await db.get(id)
  } catch (error) {
    if (error.notFound) return null
    throw error
  }
}

async function listEntities<T>(db: Database<T>): Promise<T[]> {
  const entities: T[] = []
  for await (const { value } of db.getRange({})) {
    entities.push(value)
  }
  return entities
}
```

#### Update Pattern
```typescript
async function updateEntity<T extends BaseEntity>(
  db: Database<T>,
  id: string,
  updates: Partial<T>
): Promise<T> {
  const existing = await db.get(id)
  if (!existing) throw new Error('Entity not found')
  
  const updated: T = {
    ...existing,
    ...updates,
    id: existing.id,  // Preserve ID
    createdAt: existing.createdAt,  // Preserve creation time
    updatedAt: Date.now()
  }
  
  await db.put(id, updated)
  return updated
}
```

#### Delete Pattern
```typescript
async function deleteEntity<T>(db: Database<T>, id: string): Promise<boolean> {
  const exists = await db.doesExist(id)
  if (!exists) return false
  
  await db.remove(id)
  return true
}
```

### Query Patterns

#### Filtering
```typescript
async function findByTag(tag: string): Promise<Song[]> {
  const songs: Song[] = []
  for await (const { value } of songDb.getRange({})) {
    if (value.tags.includes(tag)) {
      songs.push(value)
    }
  }
  return songs
}
```

#### Sorting
```typescript
function sortByDate(entities: BaseEntity[]): BaseEntity[] {
  return entities.sort((a, b) => b.createdAt - a.createdAt)
}
```

#### Pagination
```typescript
async function paginate<T>(
  db: Database<T>,
  page: number,
  pageSize: number
): Promise<{ items: T[]; total: number }> {
  const items: T[] = []
  let total = 0
  let skip = (page - 1) * pageSize
  
  for await (const { value } of db.getRange({})) {
    total++
    if (skip > 0) {
      skip--
      continue
    }
    if (items.length < pageSize) {
      items.push(value)
    }
  }
  
  return { items, total }
}
```

### Transaction Patterns

```typescript
async function transferSetlistItem(
  fromSetlistId: string,
  toSetlistId: string,
  itemId: string
): Promise<void> {
  const transaction = db.transaction(async () => {
    const fromSetlist = await setlistDb.get(fromSetlistId)
    const toSetlist = await setlistDb.get(toSetlistId)
    
    const itemIndex = fromSetlist.items.findIndex(i => i.id === itemId)
    if (itemIndex === -1) throw new Error('Item not found')
    
    const [item] = fromSetlist.items.splice(itemIndex, 1)
    toSetlist.items.push(item)
    
    await setlistDb.put(fromSetlistId, fromSetlist)
    await setlistDb.put(toSetlistId, toSetlist)
  })
  
  await transaction
}
```

## Migration Strategy

### Version Management

```typescript
interface MigrationScript {
  version: number
  up: (data: any) => any
  down: (data: any) => any
}

const migrations: MigrationScript[] = [
  {
    version: 2,
    up: (song) => ({
      ...song,
      globalBackground: song.background || null,
      version: 2
    }),
    down: (song) => ({
      ...song,
      background: song.globalBackground,
      version: 1
    })
  }
]
```

### Migration Execution

```typescript
async function migrateEntity<T extends BaseEntity>(
  entity: T,
  targetVersion: number
): Promise<T> {
  let current = entity
  
  while (current.version < targetVersion) {
    const migration = migrations.find(m => m.version === current.version + 1)
    if (!migration) throw new Error(`No migration for version ${current.version + 1}`)
    
    current = migration.up(current)
  }
  
  return current
}
```

### Batch Migration

```typescript
async function migrateDatabase<T extends BaseEntity>(
  db: Database<T>,
  targetVersion: number
): Promise<void> {
  const batch = db.transaction(async () => {
    for await (const { key, value } of db.getRange({})) {
      if (value.version < targetVersion) {
        const migrated = await migrateEntity(value, targetVersion)
        await db.put(key, migrated)
      }
    }
  })
  
  await batch
}
```

## Performance Optimization

### Indexing Strategy

LMDB uses B+ tree indexing by default. Additional optimization:

```typescript
// Create secondary indices for common queries
const songsByArtist = new Map<string, Set<string>>()

async function indexSongs() {
  for await (const { value } of songDb.getRange({})) {
    if (value.artist) {
      if (!songsByArtist.has(value.artist)) {
        songsByArtist.set(value.artist, new Set())
      }
      songsByArtist.get(value.artist)!.add(value.id)
    }
  }
}
```

### Caching Strategy

```typescript
class EntityCache<T> {
  private cache = new Map<string, T>()
  private maxSize = 100
  
  get(id: string): T | undefined {
    return this.cache.get(id)
  }
  
  set(id: string, value: T): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    this.cache.set(id, value)
  }
  
  invalidate(id: string): void {
    this.cache.delete(id)
  }
  
  clear(): void {
    this.cache.clear()
  }
}
```

### Batch Operations

```typescript
async function batchCreate<T extends BaseEntity>(
  db: Database<T>,
  items: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'version'>[]
): Promise<T[]> {
  const entities: T[] = []
  
  const batch = db.transaction(async () => {
    for (const item of items) {
      const entity = {
        ...item,
        id: generateId(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1
      } as T
      
      await db.put(entity.id, entity)
      entities.push(entity)
    }
  })
  
  await batch
  return entities
}
```

### Query Optimization

```typescript
// Avoid full scans for existence checks
async function entityExists(db: Database<any>, id: string): Promise<boolean> {
  return db.doesExist(id)  // Direct key lookup
}

// Use range queries efficiently
async function getRecent<T extends BaseEntity>(
  db: Database<T>,
  limit: number
): Promise<T[]> {
  const items: T[] = []
  
  // Sort by ID (timestamp-based) for recent items
  for await (const { value } of db.getRange({ reverse: true, limit })) {
    items.push(value)
  }
  
  return items
}
```

## Backup and Recovery

### Backup Strategy

```typescript
async function backupDatabase(dbPath: string, backupPath: string): Promise<void> {
  const db = open({ path: dbPath, readonly: true })
  const backup = open({ path: backupPath })
  
  for await (const { key, value } of db.getRange({})) {
    await backup.put(key, value)
  }
  
  db.close()
  backup.close()
}
```

### Export/Import

```typescript
// Export to JSON
async function exportToJSON<T>(db: Database<T>, filepath: string): Promise<void> {
  const data: T[] = []
  
  for await (const { value } of db.getRange({})) {
    data.push(value)
  }
  
  await fs.writeFile(filepath, JSON.stringify(data, null, 2))
}

// Import from JSON
async function importFromJSON<T extends BaseEntity>(
  db: Database<T>,
  filepath: string
): Promise<void> {
  const data = JSON.parse(await fs.readFile(filepath, 'utf-8'))
  
  const batch = db.transaction(async () => {
    for (const item of data) {
      await db.put(item.id, item)
    }
  })
  
  await batch
}
```

### Recovery Procedures

```typescript
async function verifyDatabase<T extends BaseEntity>(db: Database<T>): Promise<{
  valid: number
  corrupted: string[]
}> {
  let valid = 0
  const corrupted: string[] = []
  
  for await (const { key, value } of db.getRange({})) {
    try {
      // Verify required fields
      if (!value.id || !value.createdAt) {
        corrupted.push(key)
      } else {
        valid++
      }
    } catch (error) {
      corrupted.push(key)
    }
  }
  
  return { valid, corrupted }
}
```

## Best Practices

### 1. ID Generation
```typescript
function generateId(): string {
  // Timestamp + random for sortable unique IDs
  return Date.now().toString() + Math.random().toString(36).slice(2)
}
```

### 2. Data Validation
```typescript
function validateSong(song: Partial<Song>): string[] {
  const errors: string[] = []
  
  if (!song.name || song.name.trim().length === 0) {
    errors.push('Song name is required')
  }
  
  if (song.tempo && (song.tempo < 20 || song.tempo > 300)) {
    errors.push('Tempo must be between 20 and 300 BPM')
  }
  
  if (song.slides && song.slides.length === 0) {
    errors.push('Song must have at least one slide')
  }
  
  return errors
}
```

### 3. Error Handling
```typescript
class DatabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public entity?: string,
    public operation?: string
  ) {
    super(message)
    this.name = 'DatabaseError'
  }
}

async function safeOperation<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    throw new DatabaseError(
      error.message,
      'DB_OPERATION_FAILED',
      context,
      operation.name
    )
  }
}
```

### 4. Consistency Maintenance
```typescript
// Ensure referential integrity
async function deleteSongSafely(songId: string): Promise<void> {
  // Check for references in setlists
  for await (const { value: setlist } of setlistDb.getRange({})) {
    const hasReference = setlist.items.some(
      item => item.type === 'song' && item.referenceId === songId
    )
    
    if (hasReference) {
      throw new Error(`Song is referenced in setlist: ${setlist.name}`)
    }
  }
  
  // Safe to delete
  await songDb.remove(songId)
}
```

### 5. Performance Monitoring
```typescript
async function measureOperation<T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> {
  const start = performance.now()
  
  try {
    const result = await operation()
    const duration = performance.now() - start
    
    if (duration > 100) {
      console.warn(`Slow database operation: ${name} took ${duration}ms`)
    }
    
    return result
  } catch (error) {
    const duration = performance.now() - start
    console.error(`Failed operation: ${name} after ${duration}ms`)
    throw error
  }
}
```

### 6. Data Sanitization
```typescript
function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '')  // Remove control characters
    .slice(0, 10000)  // Limit length
}
```

### 7. Atomic Operations
```typescript
async function swapSlideOrder(
  songId: string,
  index1: number,
  index2: number
): Promise<void> {
  const transaction = songDb.transaction(async () => {
    const song = await songDb.get(songId)
    if (!song) throw new Error('Song not found')
    
    if (index1 < 0 || index1 >= song.slides.length ||
        index2 < 0 || index2 >= song.slides.length) {
      throw new Error('Invalid slide indices')
    }
    
    // Swap slides
    [song.slides[index1], song.slides[index2]] = 
    [song.slides[index2], song.slides[index1]]
    
    // Update order properties
    song.slides[index1].order = index1
    song.slides[index2].order = index2
    
    song.updatedAt = Date.now()
    await songDb.put(songId, song)
  })
  
  await transaction
}
```