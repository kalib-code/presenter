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
  // Extended metadata
  copyright?: string
  publisher?: string
  language?: string
  notes?: string
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

  // New optimization fields
  backgroundOverride?: Partial<Background>
  useGlobalBackground?: boolean
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

  // New optimization fields (optional for backward compatibility)
  stylePreset?: string
  styleOverrides?: Partial<ElementStyle>
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
  size?: 'cover' | 'contain' | 'fill' | 'none'
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right'
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
  type:
    | 'song'
    | 'presentation'
    | 'media'
    | 'announcement'
    | 'countdown'
    | 'video'
    | 'image'
    | 'audio'
  referenceId: string
  title: string
  duration?: number
  notes?: string
  order: number
  isActive: boolean
  // Countdown-specific properties
  countdownDuration?: number // Duration in seconds for countdown timers
  countdownMessage?: string // Message to display during countdown
  // Media-specific properties
  mediaConfig?: {
    url?: string // File path or URL for media
    autoplay?: boolean // Whether to auto-play the media
    loop?: boolean // Whether to loop the media
    volume?: number // Volume level (0-1)
    startTime?: number // Start time in seconds
    endTime?: number // End time in seconds
    controls?: boolean // Show media controls
    muted?: boolean // Start muted
    thumbnail?: string // Thumbnail image for videos
    mediaType?: 'video' | 'image' | 'audio' // Specific media type
    aspectRatio?: '16:9' | '4:3' | '1:1' | 'auto' // Aspect ratio for display
    objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down' // How to fit media
    // Background audio support for images and videos
    backgroundAudio?: {
      url?: string // Audio file path or URL
      volume?: number // Background audio volume (0-1)
      loop?: boolean // Whether to loop background audio
      autoplay?: boolean // Whether to auto-play background audio
      fadeIn?: number // Fade in duration in seconds
      fadeOut?: number // Fade out duration in seconds
    }
  }
  // Enhanced countdown customization
  countdownConfig?: {
    title?: string // Custom title for the countdown
    message?: string // Custom message content
    duration?: number // Duration in seconds
    styling?: {
      counterSize?: 'small' | 'medium' | 'large' | 'extra-large' // Size of the countdown numbers
      counterColor?: string // Color of the countdown numbers
      titleSize?: 'small' | 'medium' | 'large' // Size of the title text
      titleColor?: string // Color of the title text
      messageSize?: 'small' | 'medium' | 'large' // Size of the message text
      messageColor?: string // Color of the message text
      textShadow?: boolean // Whether to apply text shadow
    }
    background?: {
      type: 'color' | 'image' | 'video'
      value: string // Color hex, image URL, or video URL
      opacity?: number // Background opacity (0-1)
      size?: 'cover' | 'contain' | 'fill' | 'none' // For images/videos
      position?: 'center' | 'top' | 'bottom' | 'left' | 'right' // For images/videos
    }
  }
}

// Presentation types
export interface Presentation extends BaseEntity {
  name: string
  type: 'scripture' | 'announcement' | 'custom' | 'sermon' | 'teaching' | 'testimony' | 'prayer'
  slides: PresentationSlide[]
  background?: Background
  theme?: Theme
  speaker?: string
  tags: string[]
  isPublic: boolean
  // Extended metadata
  serviceDate?: Date
  occasion?: string
  location?: string
  description?: string
  scripture?: string
  topic?: string
  estimatedDuration?: number
  audience?: string
  language?: string
  notes?: string
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

// Add style preset types
export interface StylePreset {
  id: string
  name: string
  description?: string
  style: ElementStyle
  category: 'text' | 'title' | 'subtitle' | 'custom'
  isBuiltIn: boolean
}
