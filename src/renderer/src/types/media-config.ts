/**
 * Media Configuration Types
 *
 * Type definitions for media handling, audio management, and video configurations
 * used throughout the application.
 */

/**
 * Audio registry entry for tracking audio elements
 */
export interface AudioRegistryEntry {
  /** Unique identifier for the audio element */
  id: string

  /** Reference to the audio element */
  element: HTMLAudioElement

  /** Type of audio (main content vs background) */
  type: 'main' | 'background'

  /** Display name for the audio */
  name: string

  /** Whether this audio has priority for global controls */
  isPrimary?: boolean

  /** Cleanup function to remove event listeners */
  cleanup?: () => void
}

/**
 * Global audio state management
 */
export interface GlobalAudioState {
  /** Whether audio is currently playing */
  isPlaying: boolean

  /** Current playback time in seconds */
  currentTime: number

  /** Total duration in seconds */
  duration: number

  /** Current audio volume (0-1) */
  volume: number

  /** Whether audio is muted */
  muted: boolean

  /** Currently playing track name */
  currentTrack: string | null
}

/**
 * Media playback state
 */
export interface MediaState {
  /** Whether media is currently playing */
  isPlaying: boolean

  /** Current playback time */
  currentTime: number

  /** Total media duration */
  duration: number

  /** Current volume level */
  volume: number

  /** Whether media is muted */
  muted: boolean
}

/**
 * Audio control actions for IPC communication
 */
export type AudioControlAction = 'play' | 'pause' | 'stop' | 'setVolume' | 'setMuted' | 'seek'

/**
 * Audio control command interface
 */
export interface AudioControlCommand {
  /** Action to perform */
  action: AudioControlAction

  /** Value for actions that require it (volume, seek position) */
  value?: number
}

/**
 * Global audio controls interface
 */
export interface GlobalAudioControls {
  /** Register an audio element for global control */
  registerAudio: (
    audioElement: HTMLAudioElement,
    id: string,
    type?: 'main' | 'background',
    name?: string
  ) => void

  /** Unregister an audio element */
  unregisterAudio: (id: string) => void

  /** Play audio */
  play: () => void

  /** Pause audio */
  pause: () => void

  /** Stop audio and reset position */
  stop: () => void

  /** Set volume (0-1) */
  setVolume: (volume: number) => void

  /** Set muted state */
  setMuted: (muted: boolean) => void

  /** Seek to specific time */
  seek: (time: number) => void
}

/**
 * Video element properties for preview components
 */
export interface VideoElementProps {
  /** Source URL for the video */
  src: string

  /** Whether video should autoplay */
  autoplay?: boolean

  /** Whether video should loop */
  loop?: boolean

  /** Whether video is muted */
  muted?: boolean

  /** Whether to show video controls */
  controls?: boolean

  /** Video poster image */
  poster?: string

  /** CSS object-fit property */
  objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down'

  /** Callback when video is loaded */
  onLoad?: () => void

  /** Callback when video fails to load */
  onError?: (error: any) => void

  /** Callback when video starts playing */
  onPlay?: () => void

  /** Callback when video is paused */
  onPause?: () => void
}

/**
 * Audio element properties for preview components
 */
export interface AudioElementProps {
  /** Source URL for the audio */
  src: string

  /** Whether audio should autoplay */
  autoplay?: boolean

  /** Whether audio should loop */
  loop?: boolean

  /** Audio volume (0-1) */
  volume?: number

  /** Whether audio is muted */
  muted?: boolean

  /** Whether to show audio controls */
  controls?: boolean

  /** Callback when audio is loaded */
  onLoad?: () => void

  /** Callback when audio fails to load */
  onError?: (error: any) => void

  /** Callback when audio starts playing */
  onPlay?: () => void

  /** Callback when audio is paused */
  onPause?: () => void

  /** Callback for time updates */
  onTimeUpdate?: (currentTime: number) => void
}

/**
 * Media URL resolution result
 */
export interface MediaUrlResolution {
  /** Original media reference */
  original: string

  /** Resolved URL or placeholder */
  resolved: string

  /** Whether the result is a placeholder */
  isPlaceholder: boolean

  /** Error message if resolution failed */
  error?: string
}
