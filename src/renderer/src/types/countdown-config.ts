/**
 * Countdown Configuration Types
 * 
 * Type definitions for countdown functionality including styling,
 * timing, and display configurations.
 */

/**
 * Text size options for countdown elements
 */
export type CountdownTextSize = 'small' | 'medium' | 'large' | 'extra-large'

/**
 * Background types for countdown display
 */
export type CountdownBackgroundType = 'color' | 'image' | 'video'

/**
 * Background sizing options
 */
export type CountdownBackgroundSize = 'cover' | 'contain' | 'fill' | 'none'

/**
 * Background positioning options
 */
export type CountdownBackgroundPosition = 'center' | 'top' | 'bottom' | 'left' | 'right'

/**
 * Countdown styling configuration
 * 
 * Defines the visual appearance of countdown elements including
 * sizes, colors, and text effects.
 */
export interface CountdownStyling {
  /** Size of the main countdown timer */
  counterSize?: CountdownTextSize
  
  /** Color of the countdown timer text */
  counterColor?: string
  
  /** Size of the countdown title */
  titleSize?: CountdownTextSize
  
  /** Color of the title text */
  titleColor?: string
  
  /** Size of the countdown message */
  messageSize?: CountdownTextSize
  
  /** Color of the message text */
  messageColor?: string
  
  /** Whether to apply text shadow effects */
  textShadow?: boolean
}

/**
 * Background configuration for countdown display
 */
export interface CountdownBackground {
  /** Type of background (color, image, or video) */
  type: CountdownBackgroundType
  
  /** Background value (color code, image URL, or video URL) */
  value: string
  
  /** Background opacity (0-1) */
  opacity?: number
  
  /** How the background should be sized */
  size?: CountdownBackgroundSize
  
  /** Background positioning */
  position?: CountdownBackgroundPosition
}

/**
 * Main countdown configuration interface
 * 
 * Comprehensive configuration for countdown displays including
 * content, timing, styling, and background options.
 */
export interface CountdownConfig {
  /** Optional title displayed above the countdown */
  title?: string
  
  /** Message displayed with the countdown */
  message?: string
  
  /** Countdown duration in seconds */
  duration?: number
  
  /** Visual styling configuration */
  styling?: CountdownStyling
  
  /** Background configuration */
  background?: CountdownBackground
}

/**
 * Runtime countdown state
 * 
 * Tracks the current state of an active countdown timer.
 */
export interface CountdownState {
  /** Whether the countdown is currently running */
  isRunning: boolean
  
  /** Remaining time in seconds */
  timeLeft: number
  
  /** Original duration in seconds */
  originalDuration: number
  
  /** Whether the countdown has finished */
  isFinished: boolean
  
  /** Timer ID for cleanup */
  timerId?: NodeJS.Timeout
}

/**
 * Countdown display format options
 */
export interface CountdownDisplayFormat {
  /** Whether to show hours */
  showHours: boolean
  
  /** Whether to show minutes */
  showMinutes: boolean
  
  /** Whether to show seconds */
  showSeconds: boolean
  
  /** Separator character between time units */
  separator: string
  
  /** Whether to pad numbers with zeros */
  padWithZeros: boolean
}

/**
 * Countdown event handlers
 */
export interface CountdownEventHandlers {
  /** Called when countdown starts */
  onStart?: () => void
  
  /** Called when countdown is paused */
  onPause?: () => void
  
  /** Called when countdown is resumed */
  onResume?: () => void
  
  /** Called when countdown finishes */
  onFinish?: () => void
  
  /** Called when countdown is reset */
  onReset?: () => void
  
  /** Called on each second tick */
  onTick?: (timeLeft: number) => void
}