// Base types
export interface BaseEntity {
  id: string
  createdAt: number
  updatedAt: number
  createdBy: string
  version: number
}

// Song types
export interface Song extends BaseEntity {
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

export interface Slide {
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

export interface SlideElement {
  id: string
  type: 'text' | 'image' | 'video' | 'audio' | 'shape'
  position: { x: number; y: number }
  size: { width: number; height: number }
  content:
    | string
    | {
        url: string
        alt?: string
      }
    | {
        url: string
        autoplay?: boolean
      }
    | {
        url: string
        autoplay?: boolean
      }
    | {
        type: 'rectangle' | 'circle' | 'line'
        color: string
      }
  style: ElementStyle
  zIndex: number
}

export interface ElementStyle {
  fontFamily?: string
  fontSize?: number
  fontWeight?:
    | 'normal'
    | 'bold'
    | '100'
    | '200'
    | '300'
    | '400'
    | '500'
    | '600'
    | '700'
    | '800'
    | '900'
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
  lineHeight?: number
  textShadow?: string
}

export interface Background {
  type: 'color' | 'image' | 'video' | 'gradient'
  value: string
  opacity?: number
  blur?: number
  overlay?: string
  playbackRate?: number
}

export interface Transition {
  type: 'fade' | 'slide' | 'zoom' | 'flip' | 'none'
  duration: number
  direction?: 'left' | 'right' | 'up' | 'down'
  easing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear'
}

// Setlist types
export interface Setlist extends BaseEntity {
  name: string
  description?: string
  items: SetlistItem[]
  tags: string[]
  isPublic: boolean
  estimatedDuration: number
}

export interface SetlistItem {
  id: string
  type: 'song' | 'presentation' | 'media' | 'announcement'
  referenceId: string
  title: string
  duration?: number
  notes?: string
  order: number
  isActive: boolean
}

// Presentation types
export interface Presentation extends BaseEntity {
  name: string
  type: 'scripture' | 'announcement' | 'custom'
  slides: PresentationSlide[]
  background?: Background
  theme?: Theme
  isPublic: boolean
}

export interface PresentationSlide {
  id: string
  title: string
  content: string
  elements: SlideElement[]
  background?: Background
  transition?: Transition
  order: number
  notes?: string
}

export interface Theme {
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

// Media types
export interface Media extends BaseEntity {
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

// Template types
export interface Template extends BaseEntity {
  name: string
  category: 'song' | 'scripture' | 'announcement' | 'custom'
  description?: string
  thumbnail?: string
  slides: TemplateSlide[]
  theme?: Theme
  isBuiltIn: boolean
}

export interface TemplateSlide {
  id: string
  title: string
  elements: TemplateElement[]
  background?: Background
  isDefault: boolean
}

export interface TemplateElement {
  id: string
  type: 'text' | 'image' | 'placeholder'
  position: { x: number; y: number }
  size: { width: number; height: number }
  style: ElementStyle
  placeholder?: string
  required?: boolean
}

// Settings types
export interface Settings extends BaseEntity {
  value: unknown
  type: 'string' | 'number' | 'boolean' | 'object'
  category: 'app' | 'editor' | 'presentation' | 'media'
  description?: string
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  language: string
  autoSave: boolean
  autoSaveInterval: number
  defaultTemplate: string
  mediaLibraryPath: string
}

export interface EditorSettings {
  defaultFont: string
  defaultFontSize: number
  gridSnap: boolean
  gridSize: number
  showRulers: boolean
  showGuides: boolean
  zoomLevel: number
}

export interface PresentationSettings {
  defaultTransition: string
  defaultDuration: number
  autoAdvance: boolean
  showNotes: boolean
  stageDisplay: boolean
}

// Query types
export interface QueryOptions {
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filter?: Record<string, unknown>
}

export interface QueryResult<T> {
  data: T[]
  total: number
  hasMore: boolean
}

// Database operation types
export type DatabaseOperation = 'create' | 'read' | 'update' | 'delete' | 'list'

export interface DatabaseError {
  code: string
  message: string
  operation: DatabaseOperation
  entity: string
  details?: Record<string, unknown>
}
