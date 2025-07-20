/**
 * SortableSetlistItem Component
 * 
 * A draggable setlist item component with selection functionality.
 * Displays item information including title, duration, and type icon.
 */

import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { SortableSetlistItemProps } from '@renderer/types/home'

/**
 * Sortable setlist item component that can be dragged and selected
 * 
 * @param props - Component props including item data and event handlers
 * @returns JSX element representing a sortable setlist item
 */
export function SortableSetlistItem({
  item,
  index,
  isSelected,
  onSelect,
  getItemIcon
}: SortableSetlistItemProps): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`w-full p-3 rounded-lg text-left transition-colors border ${
        isSelected
          ? 'bg-primary text-primary-foreground border-primary'
          : 'hover:bg-accent border-border'
      } ${isDragging ? 'z-50' : ''}`}
    >
      <div className="flex items-center gap-3">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="w-3 h-3" />
        </div>

        {/* Item Content */}
        <button onClick={() => onSelect(item)} className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-xs font-mono w-6">{index + 1}</span>
          {getItemIcon(item.type)}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="font-medium truncate">{item.title}</div>
              {item.duration && (
                <span className="text-xs text-muted-foreground font-mono shrink-0">
                  {Math.floor(item.duration / 60)}m
                </span>
              )}
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}

export default SortableSetlistItem