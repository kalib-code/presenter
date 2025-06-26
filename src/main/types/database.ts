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

export type SlideElementContent = 
  | { type: 'text'; text: string }
  | { type: 'image'; url: string; alt?: string }
  | { type: 'video'; url: string; autoplay?: boolean; loop?: boolean }
  | { type: 'audio'; url: string; autoplay?: boolean; loop?: boolean }
  | { type: 'shape'; shape: 'rectangle' | 'circle' | 'triangle'; fill?: string }

export interface SlideElement {
  id: string
  type: 'text' | 'image' | 'video' | 'audio' | 'shape'
  position: { x: number; y: number }
  size: { width: number; height: number }
  content: SlideElementContent
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
  type: 'song' | 'presentation' | 'media' | 'announcement' | 'countdown'
  referenceId: string
  title: string
  duration?: number
  notes?: string
  order: number
  isActive: boolean
  // Countdown-specific properties
  countdownDuration?: number // Duration in seconds for countdown timers
  countdownMessage?: string // Message to display during countdown
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
