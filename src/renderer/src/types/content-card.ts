/**
 * Content Card Types
 *
 * Type definitions for content cards used in the Home component.
 * Includes media configuration, styling, countdown configuration, and slide elements.
 */

// Union types for content card configuration
export type ContentCardType = 'verse' | 'chorus' | 'bridge' | 'slide' | 'announcement' | 'countdown'
export type MediaType = 'video' | 'image' | 'audio'
export type AspectRatio = '16:9' | '4:3' | '1:1' | 'auto'
export type ObjectFit = 'cover' | 'contain' | 'fill' | 'scale-down'
export type TextSize = 'small' | 'medium' | 'large' | 'extra-large'
export type BackgroundType = 'color' | 'image' | 'video'
export type BackgroundSize = 'cover' | 'contain' | 'fill' | 'none'
export type BackgroundPosition = 'center' | 'top' | 'bottom' | 'left' | 'right'

/**
 * Element styling configuration for content cards
 */
export interface ElementStyle {
  fontSize?: number
  color?: string
  fontFamily?: string
  fontWeight?: string
  fontStyle?: string
  textAlign?: string
  textShadow?: string
  lineHeight?: number
  left?: number
  top?: number
  width?: number
  height?: number
  transform?: string
  opacity?: number
}

/**
 * Background configuration for slides
 */
export interface BackgroundConfig {
  type: string
  value: string
  opacity?: number
}

/**
 * Position and size configuration for slide elements
 */
export interface ElementPosition {
  x: number
  y: number
}

export interface ElementSize {
  width: number
  height: number
}

/**
 * Style configuration for slide elements
 */
export interface SlideElementStyle {
  fontSize?: number
  color?: string
  fontFamily?: string
  fontWeight?: string
  fontStyle?: string
  textAlign?: string
  textShadow?: string
  lineHeight?: number
  opacity?: number
}

/**
 * Individual slide element configuration
 */
export interface SlideElement {
  id: string
  type: 'text' | 'image' | 'video'
  content: string
  position: ElementPosition
  size: ElementSize
  style: SlideElementStyle
  zIndex?: number
}

/**
 * Background audio configuration for media elements
 */
export interface BackgroundAudioConfig {
  url?: string
  volume?: number
  loop?: boolean
  autoplay?: boolean
  fadeIn?: number
  fadeOut?: number
}

/**
 * Media configuration for standalone media items
 */
export interface MediaConfig {
  url?: string
  autoplay?: boolean
  loop?: boolean
  volume?: number
  startTime?: number
  endTime?: number
  controls?: boolean
  muted?: boolean
  thumbnail?: string
  mediaType?: MediaType
  aspectRatio?: AspectRatio
  objectFit?: ObjectFit
  backgroundAudio?: BackgroundAudioConfig
}

/**
 * Styling configuration for countdown elements
 */
export interface CountdownStyling {
  counterSize?: TextSize
  counterColor?: string
  titleSize?: TextSize
  titleColor?: string
  messageSize?: TextSize
  messageColor?: string
  textShadow?: boolean
}

/**
 * Background configuration for countdown
 */
export interface CountdownBackground {
  type: BackgroundType
  value: string
  opacity?: number
  size?: BackgroundSize
  position?: BackgroundPosition
}

/**
 * Enhanced countdown configuration
 */
export interface CountdownConfig {
  title?: string
  message?: string
  duration?: number
  styling?: CountdownStyling
  background?: CountdownBackground
}

/**
 * Main content card interface
 *
 * Represents a single content item that can be displayed in presentations.
 * Supports various types including text content, media items, and countdowns.
 */
export interface ContentCard {
  /** Unique identifier for the card */
  id: string

  /** Display title of the card */
  title: string

  /** Main content/text of the card */
  content: string

  /** Type of content card */
  type: ContentCardType

  /** Display order in the list */
  order: number

  /** Legacy element styling (deprecated in favor of slideElements) */
  elementStyles?: ElementStyle

  /** Slide-specific background (overrides global background) */
  slideBackground?: BackgroundConfig

  /** Global background configuration */
  globalBackground?: BackgroundConfig

  /** Media configuration for standalone media items */
  mediaConfig?: MediaConfig

  /** Rich slide elements for advanced layouts */
  slideElements?: SlideElement[]

  /** Enhanced countdown configuration */
  countdownConfig?: CountdownConfig
}
