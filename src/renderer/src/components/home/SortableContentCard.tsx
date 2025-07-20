/**
 * SortableContentCard Component
 * 
 * A draggable content card component that displays card information
 * and content preview with selection functionality.
 */

import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { Badge } from '@renderer/components/ui/badge'
import { SortableContentCardProps } from '@renderer/types/home'

/**
 * Function type for rendering card content
 */
export type RenderCardContentFunction = (
  card: any,
  selectedCardId?: string,
  globalAudioControls?: any,
  hasUserInteracted?: boolean
) => React.ReactNode

/**
 * Extended props that include the render function
 */
export interface SortableContentCardExtendedProps extends SortableContentCardProps {
  /** Function to render the card content */
  renderCardContent: RenderCardContentFunction
}

/**
 * Sortable content card component with drag and drop functionality
 * 
 * Displays card metadata, type badges, and renders content using the provided
 * render function. Supports selection states and drag handles.
 * 
 * @param props - Component props including card data and render function
 * @returns JSX element representing a sortable content card
 */
export function SortableContentCard({
  card,
  isSelected,
  onSelect,
  getCardStyling,
  selectedCardId,
  globalAudioControls,
  hasUserInteracted,
  renderCardContent
}: SortableContentCardExtendedProps): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  return (
    <div ref={setNodeRef} style={style} className={`relative group ${isDragging ? 'z-50' : ''}`}>
      <div
        className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-md cursor-pointer ${
          isSelected ? 'border-primary ring-2 ring-primary/20' : getCardStyling(card.type)
        }`}
        onClick={() => onSelect(card)}
      >
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 right-2 cursor-grab active:cursor-grabbing p-1 bg-black/10 hover:bg-black/20 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10"
          onClick={(e) => {
            e.stopPropagation()
          }}
        >
          <GripVertical className="w-3 h-3" />
        </div>

        {/* Card Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {card.title}
            </Badge>
            {(card.type === 'verse' || card.type === 'chorus' || card.type === 'bridge') && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                Lyrics
              </Badge>
            )}
          </div>
          {isSelected && <div className="w-2 h-2 bg-primary rounded-full"></div>}
        </div>

        {/* Content Preview */}
        <div className="relative">
          {renderCardContent(card, selectedCardId, globalAudioControls, hasUserInteracted)}
        </div>
      </div>
    </div>
  )
}

export default SortableContentCard