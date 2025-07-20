/**
 * Home Component Types
 *
 * Type definitions for the main Home component including projection state
 * and component prop interfaces.
 */

import { ContentCard } from './content-card'
import { SetlistItem } from './database'
import { GlobalAudioControls } from './media-config'

/**
 * Projection state management interface
 *
 * Manages the current state of the projection system including
 * blank state, logo display, and current content.
 */
export interface ProjectionState {
  /** Whether projection is currently active */
  isProjecting: boolean

  /** Whether the projection is showing a blank screen */
  isBlank: boolean

  /** Whether the projection is showing the logo */
  showLogo: boolean

  /** Currently projected content */
  currentContent: string

  /** Title of currently projected content */
  currentTitle: string
}

/**
 * Props for SortableSetlistItem component
 */
export interface SortableSetlistItemProps {
  /** Setlist item to render */
  item: SetlistItem

  /** Index position in the list */
  index: number

  /** Whether this item is currently selected */
  isSelected: boolean

  /** Callback when item is selected */
  onSelect: (item: SetlistItem) => void

  /** Function to get icon for item type */
  getItemIcon: (type: string) => JSX.Element
}

/**
 * Props for SortableContentCard component
 */
export interface SortableContentCardProps {
  /** Content card to render */
  card: ContentCard

  /** Whether this card is currently selected */
  isSelected: boolean

  /** Callback when card is selected */
  onSelect: (card: ContentCard) => void

  /** Function to get styling class for card type */
  getCardStyling: (type: string) => string

  /** ID of currently selected card */
  selectedCardId?: string

  /** Global audio controls instance */
  globalAudioControls?: GlobalAudioControls

  /** Whether user has interacted with the page */
  hasUserInteracted?: boolean
}

/**
 * Props for ImagePreview component
 */
export interface ImagePreviewProps {
  /** Slide element to render */
  element: {
    id: string
    type: 'text' | 'image' | 'video'
    content: string
    style?: {
      opacity?: number
    }
    zIndex?: number
  }

  /** Whether the parent card is selected */
  isSelectedCard: boolean

  /** Parent card reference */
  card: ContentCard

  /** Scaled position for the element */
  scaledPosition: { x: number; y: number }

  /** Scaled size for the element */
  scaledSize: { width: number; height: number }

  /** Global audio controls instance */
  globalAudioControls: GlobalAudioControls
}
