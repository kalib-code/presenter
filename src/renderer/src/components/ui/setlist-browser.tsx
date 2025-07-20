import React from 'react'
import { Button } from '@renderer/components/ui/button'
import { Badge } from '@renderer/components/ui/badge'
import {
  Plus,
  Music,
  Presentation,
  Timer,
  Video,
  Image,
  Volume2,
  MessageSquare,
  GripVertical
} from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Setlist, SetlistItem } from '@renderer/types/database'

interface SortableBrowserItemProps {
  item: SetlistItem
  index: number
  isSelected: boolean
  onSelect: (item: SetlistItem) => void
}

function SortableBrowserItem({ item, index, isSelected, onSelect }: SortableBrowserItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'song':
        return <Music className="w-3 h-3 text-blue-600" />
      case 'presentation':
        return <Presentation className="w-3 h-3 text-green-600" />
      case 'video':
        return <Video className="w-3 h-3 text-red-600" />
      case 'image':
        return <Image className="w-3 h-3 text-yellow-600" />
      case 'audio':
        return <Volume2 className="w-3 h-3 text-purple-600" />
      case 'countdown':
        return <Timer className="w-3 h-3 text-red-600" />
      case 'announcement':
        return <MessageSquare className="w-3 h-3 text-orange-600" />
      default:
        return <Music className="w-3 h-3 text-muted-foreground" />
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2 p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors ${
        isSelected ? 'bg-primary/10 border border-primary/20' : ''
      }`}
      onClick={() => onSelect(item)}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="w-3 h-3 text-muted-foreground" />
      </div>

      {/* Item Number */}
      <div className="text-xs text-muted-foreground font-mono w-6 text-center flex-shrink-0">
        {index + 1}
      </div>

      {/* Item Icon */}
      <div className="flex-shrink-0">{getItemIcon(item.type)}</div>

      {/* Item Title */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{item.title}</div>
      </div>

      {/* Status Badge */}
      {item.isActive && (
        <Badge variant="secondary" className="text-xs">
          Live
        </Badge>
      )}
    </div>
  )
}

interface SetlistBrowserProps {
  setlist: Setlist
  selectedItem: SetlistItem | null
  onItemSelect: (item: SetlistItem) => void
  onAddItem: () => void
  onReorder: (items: SetlistItem[]) => Promise<void>
  className?: string
}

export function SetlistBrowser({
  setlist,
  selectedItem,
  onItemSelect,
  onAddItem,
  onReorder,
  className = ''
}: SetlistBrowserProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = setlist.items.findIndex((item) => item.id === active.id)
    const newIndex = setlist.items.findIndex((item) => item.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const newItems = [...setlist.items]
    const [reorderedItem] = newItems.splice(oldIndex, 1)
    newItems.splice(newIndex, 0, reorderedItem)

    // Update order property for all items
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      order: index
    }))

    await onReorder(updatedItems)
  }

  const sortedItems = [...setlist.items].sort((a, b) => a.order - b.order)

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="font-semibold text-sm">Setlist Items</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {setlist.items.length} items
        </p>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto p-2">
        {setlist.items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm mb-3">No items yet</p>
            <Button size="sm" onClick={onAddItem}>
              <Plus className="w-3 h-3 mr-1" />
              Add Item
            </Button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortedItems.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {sortedItems.map((item, index) => (
                  <SortableBrowserItem
                    key={item.id}
                    item={item}
                    index={index}
                    isSelected={selectedItem?.id === item.id}
                    onSelect={onItemSelect}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Add Item Button */}
      {setlist.items.length > 0 && (
        <div className="p-3 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={onAddItem}
            className="w-full"
          >
            <Plus className="w-3 h-3 mr-2" />
            Add Item
          </Button>
        </div>
      )}
    </div>
  )
}