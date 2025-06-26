import React, { useState, useEffect } from 'react'
import { useSetlistStore } from '@renderer/store/setlist'
import { useSongStore } from '@renderer/store/song'
import { usePresentationStore } from '@renderer/store/presentation'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Textarea } from '@renderer/components/ui/textarea'
import { Separator } from '@renderer/components/ui/separator'
import { Badge } from '@renderer/components/ui/badge'
import { Checkbox } from '@renderer/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@renderer/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@renderer/components/ui/dropdown-menu'
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Play,
  Music,
  Presentation,
  FileImage,
  MessageSquare,
  Clock,
  Users,
  ArrowLeft,
  GripVertical,
  Save,
  X,
  Timer,
  Eye,
  Copy,
  CheckSquare,
  Square,
  Trash,
  Move,
  Video,
  Image,
  Volume2
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Setlist, SetlistItem } from '@renderer/types/database'
import { CountdownConfig } from '@renderer/components/ui/countdown-config'
import { TimeInput } from '@renderer/components/ui/time-input'
import { InlineEditableText, InlineEditableNumber } from '@renderer/components/ui/inline-editable'
import { MediaSelector } from '@renderer/components/ui/media-selector'
import {
  parseTimeToSeconds,
  formatTimeFromSeconds,
  formatTimeInput,
  formatTimeAuto
} from '@renderer/lib/time-utils'

// Sortable Item Component
interface SortableItemProps {
  item: SetlistItem
  setlist: Setlist
  onEdit: (item: SetlistItem) => void
  onDelete: (itemId: string) => void
  onUpdateDuration: (itemId: string, duration: number) => void
  onUpdateNotes: (itemId: string, notes: string) => void
  onUpdateTitle: (itemId: string, title: string) => void
  isSelectMode: boolean
  isSelected: boolean
  onToggleSelect: (itemId: string) => void
}

function SortableItem({
  item,
  setlist,
  onEdit,
  onDelete,
  onUpdateDuration,
  onUpdateNotes,
  onUpdateTitle,
  isSelectMode,
  isSelected,
  onToggleSelect
}: SortableItemProps) {
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
        return <Music className="w-4 h-4 text-blue-600" />
      case 'presentation':
        return <Presentation className="w-4 h-4 text-green-600" />
      case 'media':
        return <FileImage className="w-4 h-4 text-purple-600" />
      case 'video':
        return <Video className="w-4 h-4 text-purple-600" />
      case 'image':
        return <Image className="w-4 h-4 text-purple-600" />
      case 'audio':
        return <Volume2 className="w-4 h-4 text-purple-600" />
      case 'announcement':
        return <MessageSquare className="w-4 h-4 text-orange-600" />
      case 'countdown':
        return <Timer className="w-4 h-4 text-red-600" />
      default:
        return <Music className="w-4 h-4" />
    }
  }

  const formatDuration = (seconds: number) => {
    return formatTimeFromSeconds(seconds)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-4 bg-card border rounded-lg hover:shadow-sm transition-all ${
        isSelected ? 'ring-2 ring-primary/50 bg-primary/5' : ''
      }`}
    >
      {/* Selection Checkbox */}
      {isSelectMode && (
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(item.id)}
          className="flex-shrink-0"
        />
      )}

      {/* Drag Handle */}
      {!isSelectMode && (
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="w-4 h-4" />
        </div>
      )}

      {/* Item Info */}
      <div className="flex items-center gap-3 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground font-mono w-6 text-center">
            {item.order + 1}
          </span>
          {getItemIcon(item.type)}
        </div>

        <div className="flex-1">
          <InlineEditableText
            value={item.title}
            onSave={(title) => onUpdateTitle(item.id, title)}
            className="font-medium"
            placeholder="Item title..."
            showEditIcon={true}
          />
          <div className="text-sm text-muted-foreground">
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </div>
        </div>
      </div>

      {/* Duration */}
      <div className="flex items-center gap-2">
        <Clock className="w-3 h-3 text-muted-foreground" />
        <InlineEditableNumber
          value={item.duration || 0}
          onSave={(duration) => onUpdateDuration(item.id, duration)}
          formatter={formatDuration}
          parser={parseTimeToSeconds}
          className="text-sm"
          placeholder="0:00:00"
          min={0}
        />
      </div>

      {/* Notes */}
      <div className="flex items-center gap-2 min-w-0 max-w-[200px]">
        <InlineEditableText
          value={item.notes || ''}
          onSave={(notes) => onUpdateNotes(item.id, notes)}
          className="text-sm text-muted-foreground truncate"
          emptyText="Click to add notes"
          placeholder="Add notes..."
          maxLength={200}
        />
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreVertical className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(item)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onDelete(item.id)} className="text-red-600">
            <Trash2 className="w-4 h-4 mr-2" />
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default function Setlist(): JSX.Element {
  const {
    setlists,
    isLoading,
    error,
    createSetlist,
    duplicateSetlist,
    updateSetlist,
    deleteSetlist,
    startPresentation,
    addItem,
    removeItem,
    reorderItems,
    updateItem,
    loadSetlists,
    getRecentItems
  } = useSetlistStore()

  const { songs, fetchSongs } = useSongStore()
  const { presentations, loadPresentations } = usePresentationStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSetlist, setSelectedSetlist] = useState<Setlist | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false)
  const [newSetlistName, setNewSetlistName] = useState('')
  const [newSetlistDescription, setNewSetlistDescription] = useState('')
  const [addItemSearchTerm, setAddItemSearchTerm] = useState('')
  const [selectedItemType, setSelectedItemType] = useState<
    'all' | 'song' | 'presentation' | 'media' | 'announcement' | 'countdown'
  >('all')
  const [isEditItemModalOpen, setIsEditItemModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<SetlistItem | null>(null)
  const [editItemDuration, setEditItemDuration] = useState('')
  const [editItemNotes, setEditItemNotes] = useState('')

  // Countdown configuration modal state
  const [isCountdownConfigOpen, setIsCountdownConfigOpen] = useState(false)
  const [pendingCountdownTitle, setPendingCountdownTitle] = useState('')

  // Media selector modal state
  const [isMediaSelectorOpen, setIsMediaSelectorOpen] = useState(false)
  const [mediaSelectorType, setMediaSelectorType] = useState<'video' | 'image' | 'audio' | 'any'>(
    'any'
  )

  // Bulk selection state
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set())
  const [isSelectMode, setIsSelectMode] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  useEffect(() => {
    console.log('🚀 Setlist component mounted, loading data...')
    fetchSongs()
    loadPresentations()
    loadSetlists()
  }, [fetchSongs, loadPresentations, loadSetlists])

  // Debug data loading
  useEffect(() => {
    console.log('📊 Data status:', {
      songs: songs.length,
      presentations: presentations.length,
      setlists: setlists.length
    })
    console.log('🎬 Modal should be', isAddItemModalOpen ? 'OPEN' : 'CLOSED', 'now')
  }, [songs, presentations, setlists, isAddItemModalOpen])

  // Filter setlists based on search term
  const filteredSetlists = setlists.filter(
    (setlist) =>
      setlist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      setlist.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateSetlist = async (): Promise<void> => {
    if (!newSetlistName.trim()) return

    await createSetlist({
      name: newSetlistName,
      description: newSetlistDescription,
      items: [],
      tags: [],
      isPublic: true,
      createdBy: 'user',
      estimatedDuration: 0
    })

    setNewSetlistName('')
    setNewSetlistDescription('')
    setIsCreateModalOpen(false)
  }

  const handleEditSetlist = async (): Promise<void> => {
    if (!selectedSetlist || !newSetlistName.trim()) return

    await updateSetlist(selectedSetlist.id, {
      name: newSetlistName,
      description: newSetlistDescription
    })

    setIsEditModalOpen(false)
    setSelectedSetlist(null)
    setNewSetlistName('')
    setNewSetlistDescription('')
  }

  const handleDeleteSetlist = async (setlist: Setlist): Promise<void> => {
    if (confirm(`Are you sure you want to delete "${setlist.name}"?`)) {
      await deleteSetlist(setlist.id)
      if (selectedSetlist?.id === setlist.id) {
        setSelectedSetlist(null)
        setViewMode('list')
      }
    }
  }

  const handleDuplicateSetlist = async (setlist: Setlist): Promise<void> => {
    await duplicateSetlist(setlist.id)
  }

  const handleViewSetlist = (setlist: Setlist): void => {
    setSelectedSetlist(setlist)
    setViewMode('detail')
    console.log('🔍 Selected setlist for detail view:', setlist.name, setlist.id)
  }

  const handleBackToList = (): void => {
    setSelectedSetlist(null)
    setViewMode('list')
    console.log('⬅️ Returned to list view')
  }

  const handleAddItem = async (
    type:
      | 'song'
      | 'presentation'
      | 'media'
      | 'announcement'
      | 'countdown'
      | 'video'
      | 'image'
      | 'audio',
    itemId: string,
    title: string
  ): Promise<void> => {
    if (!selectedSetlist) {
      console.error('❌ No selected setlist when trying to add item')
      return
    }

    console.log('➕ Adding item to setlist:', {
      type,
      itemId,
      title,
      setlistId: selectedSetlist.id
    })
    console.log(
      '📊 Before adding - Selected setlist items count:',
      selectedSetlist.items?.length || 0
    )

    const newItem: Omit<SetlistItem, 'id' | 'order'> = {
      type,
      referenceId: itemId,
      title,
      duration: type === 'countdown' ? 0 : 0, // Duration will be set separately for countdown
      notes: '',
      isActive: true,
      // Add countdown-specific properties
      ...(type === 'countdown' && {
        countdownDuration: 300, // Default 5 minutes
        countdownMessage: 'Service Starting Soon!'
      })
    }

    console.log('🛠️ Created item object:', newItem)

    // Wait for the addItem operation to complete (includes loadSetlists())
    await addItem(selectedSetlist.id, newItem)
    setIsAddItemModalOpen(false)

    // Get the fresh state directly from the store
    const freshSetlists = useSetlistStore.getState().setlists
    console.log('📊 After adding - Fresh setlists from store:', freshSetlists.length)

    // Get the updated setlist from the fresh store state
    const updatedSetlist = freshSetlists.find((s) => s.id === selectedSetlist.id)
    if (updatedSetlist) {
      console.log('🔄 Found updated setlist, items count:', updatedSetlist.items?.length || 0)
      console.log('🔄 Updated setlist items:', updatedSetlist.items)
      setSelectedSetlist(updatedSetlist)
      console.log(
        '✅ Setlist refreshed after adding item, new count:',
        updatedSetlist.items?.length || 0
      )
    } else {
      console.error('❌ Could not find updated setlist with id:', selectedSetlist.id)
      console.log(
        '📊 Available setlist IDs:',
        freshSetlists.map((s) => s.id)
      )
      // Force reload setlists if we can't find the updated one
      await loadSetlists()
      const retryFreshSetlists = useSetlistStore.getState().setlists
      const retryUpdatedSetlist = retryFreshSetlists.find((s) => s.id === selectedSetlist.id)
      if (retryUpdatedSetlist) {
        setSelectedSetlist(retryUpdatedSetlist)
        console.log(
          '✅ Setlist found after retry, items count:',
          retryUpdatedSetlist.items?.length || 0
        )
      }
    }
  }

  const handleRemoveItem = async (itemId: string): Promise<void> => {
    if (!selectedSetlist) return

    if (confirm('Are you sure you want to remove this item?')) {
      await removeItem(selectedSetlist.id, itemId)

      // Get the fresh state directly from the store
      const freshSetlists = useSetlistStore.getState().setlists
      const updatedSetlist = freshSetlists.find((s) => s.id === selectedSetlist.id)
      if (updatedSetlist) {
        setSelectedSetlist(updatedSetlist)
      }
    }
  }

  const handleUpdateItemDuration = async (itemId: string, duration: number): Promise<void> => {
    if (!selectedSetlist) return

    await updateItem(selectedSetlist.id, itemId, { duration })

    // Get the fresh state directly from the store
    const freshSetlists = useSetlistStore.getState().setlists
    const updatedSetlist = freshSetlists.find((s) => s.id === selectedSetlist.id)
    if (updatedSetlist) {
      setSelectedSetlist(updatedSetlist)
    }
  }

  const handleUpdateItemNotes = async (itemId: string, notes: string): Promise<void> => {
    if (!selectedSetlist) return

    await updateItem(selectedSetlist.id, itemId, { notes })

    // Get the fresh state directly from the store
    const freshSetlists = useSetlistStore.getState().setlists
    const updatedSetlist = freshSetlists.find((s) => s.id === selectedSetlist.id)
    if (updatedSetlist) {
      setSelectedSetlist(updatedSetlist)
    }
  }

  const handleUpdateItemTitle = async (itemId: string, title: string): Promise<void> => {
    if (!selectedSetlist) return

    await updateItem(selectedSetlist.id, itemId, { title })

    // Get the fresh state directly from the store
    const freshSetlists = useSetlistStore.getState().setlists
    const updatedSetlist = freshSetlists.find((s) => s.id === selectedSetlist.id)
    if (updatedSetlist) {
      setSelectedSetlist(updatedSetlist)
    }
  }

  // Bulk selection handlers
  const handleToggleSelectMode = () => {
    setIsSelectMode(!isSelectMode)
    setSelectedItemIds(new Set())
  }

  const handleToggleSelectItem = (itemId: string) => {
    const newSelection = new Set(selectedItemIds)
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId)
    } else {
      newSelection.add(itemId)
    }
    setSelectedItemIds(newSelection)
  }

  const handleSelectAll = () => {
    if (!selectedSetlist) return
    setSelectedItemIds(new Set(selectedSetlist.items.map((item) => item.id)))
  }

  const handleDeselectAll = () => {
    setSelectedItemIds(new Set())
  }

  const handleBulkDelete = async () => {
    if (!selectedSetlist || selectedItemIds.size === 0) return

    if (confirm(`Are you sure you want to delete ${selectedItemIds.size} selected items?`)) {
      const updatedItems = selectedSetlist.items
        .filter((item) => !selectedItemIds.has(item.id))
        .map((item, index) => ({ ...item, order: index }))

      await updateSetlist(selectedSetlist.id, { items: updatedItems })

      // Get the fresh state directly from the store
      const freshSetlists = useSetlistStore.getState().setlists
      const updatedSetlist = freshSetlists.find((s) => s.id === selectedSetlist.id)
      if (updatedSetlist) {
        setSelectedSetlist(updatedSetlist)
      }

      setSelectedItemIds(new Set())
      setIsSelectMode(false)
    }
  }

  const handleDragEnd = async (event: DragEndEvent): Promise<void> => {
    const { active, over } = event

    if (!selectedSetlist || !over || active.id === over.id) return

    const oldIndex = selectedSetlist.items.findIndex((item) => item.id === active.id)
    const newIndex = selectedSetlist.items.findIndex((item) => item.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const newItems = arrayMove(selectedSetlist.items, oldIndex, newIndex)

    // Update the setlist with reordered items
    await reorderItems(selectedSetlist.id, newItems)

    // Get the fresh state directly from the store
    const freshSetlists = useSetlistStore.getState().setlists
    const updatedSetlist = freshSetlists.find((s) => s.id === selectedSetlist.id)
    if (updatedSetlist) {
      setSelectedSetlist(updatedSetlist)
    }
  }

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'song':
        return <Music className="w-4 h-4" />
      case 'presentation':
        return <Presentation className="w-4 h-4" />
      case 'media':
        return <FileImage className="w-4 h-4" />
      case 'video':
        return <Video className="w-4 h-4" />
      case 'image':
        return <Image className="w-4 h-4" />
      case 'audio':
        return <Volume2 className="w-4 h-4" />
      case 'announcement':
        return <MessageSquare className="w-4 h-4" />
      case 'countdown':
        return <Timer className="w-4 h-4" />
      default:
        return <Music className="w-4 h-4" />
    }
  }

  const formatDuration = (seconds: number) => {
    return formatTimeFromSeconds(seconds)
  }

  const getTotalDuration = (items: SetlistItem[]) => {
    return items.reduce((total, item) => total + (item.duration || 0), 0)
  }

  const handleOpenAddItemModal = (): void => {
    console.log(
      '🎯 Opening Add Item Modal for setlist:',
      selectedSetlist?.name || 'No setlist selected'
    )
    console.log('📋 Current songs available:', songs.length)
    console.log('📋 Current presentations available:', presentations.length)
    setIsAddItemModalOpen(true)
  }

  const handleOpenEditItemModal = (item: SetlistItem): void => {
    setEditingItem(item)
    setEditItemDuration(formatTimeFromSeconds(item.duration || 0))
    setEditItemNotes(item.notes || '')
    setIsEditItemModalOpen(true)
  }

  const handleSaveItemEdit = async (): Promise<void> => {
    if (!editingItem || !selectedSetlist) return

    const duration = parseTimeToSeconds(editItemDuration)
    await updateItem(selectedSetlist.id, editingItem.id, {
      duration,
      notes: editItemNotes
    })

    // Get the fresh state directly from the store
    const freshSetlists = useSetlistStore.getState().setlists
    const updatedSetlist = freshSetlists.find((s) => s.id === selectedSetlist.id)
    if (updatedSetlist) {
      setSelectedSetlist(updatedSetlist)
    }

    setIsEditItemModalOpen(false)
    setEditingItem(null)
    setEditItemDuration('')
    setEditItemNotes('')
  }

  const handleSaveCountdownConfig = async (
    config: NonNullable<SetlistItem['countdownConfig']>
  ): Promise<void> => {
    if (!selectedSetlist) {
      console.error('❌ No selected setlist when trying to add countdown')
      return
    }

    console.log('➕ Adding enhanced countdown to setlist:', {
      config,
      title: pendingCountdownTitle,
      setlistId: selectedSetlist.id
    })

    const newItem: Omit<SetlistItem, 'id' | 'order'> = {
      type: 'countdown',
      referenceId: 'new',
      title: config.title || pendingCountdownTitle,
      duration: config.duration || 300,
      notes: '',
      isActive: true,
      // Legacy properties for backward compatibility
      countdownDuration: config.duration,
      countdownMessage: config.message,
      // Enhanced configuration
      countdownConfig: config
    }

    console.log('🛠️ Created enhanced countdown item:', newItem)

    // Wait for the addItem operation to complete
    await addItem(selectedSetlist.id, newItem)
    setIsCountdownConfigOpen(false)
    setPendingCountdownTitle('')

    // Get the fresh state directly from the store
    const freshSetlists = useSetlistStore.getState().setlists
    const updatedSetlist = freshSetlists.find((s) => s.id === selectedSetlist.id)
    if (updatedSetlist) {
      setSelectedSetlist(updatedSetlist)
      console.log('📊 After adding countdown - Updated setlist items:', updatedSetlist.items.length)
    }
  }

  const handleAddMediaItem = async (
    mediaItem: Omit<SetlistItem, 'id' | 'order'>
  ): Promise<void> => {
    if (!selectedSetlist) {
      console.error('❌ No selected setlist when trying to add media')
      return
    }

    console.log('➕ Adding media item to setlist:', {
      mediaItem,
      setlistId: selectedSetlist.id
    })

    // Wait for the addItem operation to complete
    await addItem(selectedSetlist.id, mediaItem)
    setIsMediaSelectorOpen(false)

    // Get the fresh state directly from the store
    const freshSetlists = useSetlistStore.getState().setlists
    const updatedSetlist = freshSetlists.find((s) => s.id === selectedSetlist.id)
    if (updatedSetlist) {
      setSelectedSetlist(updatedSetlist)
      console.log('📊 After adding media - Updated setlist items:', updatedSetlist.items.length)
    }
  }

  const handleOpenMediaSelector = (mediaType: 'video' | 'image' | 'audio' | 'any' = 'any') => {
    setMediaSelectorType(mediaType)
    setIsMediaSelectorOpen(true)
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading setlists...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 mb-4">Error: {error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  return (
    <>
      {/* MAIN CONTENT */}
      {viewMode === 'detail' && selectedSetlist ? (
        <div className="p-6 max-w-7xl mx-auto">
          {/* Navigation */}
          <div className="mb-6">
            <Button variant="ghost" onClick={handleBackToList} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Setlists
            </Button>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-2">{selectedSetlist.name}</h1>
                {selectedSetlist.description && (
                  <p className="text-lg text-muted-foreground max-w-2xl">
                    {selectedSetlist.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 ml-6">
                <Button variant="outline" onClick={handleOpenAddItemModal}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
                <Button
                  variant={isSelectMode ? 'default' : 'outline'}
                  onClick={handleToggleSelectMode}
                >
                  {isSelectMode ? (
                    <CheckSquare className="w-4 h-4 mr-2" />
                  ) : (
                    <Square className="w-4 h-4 mr-2" />
                  )}
                  {isSelectMode ? 'Exit Select' : 'Select Items'}
                </Button>
                <Button onClick={() => startPresentation(selectedSetlist)}>
                  <Play className="w-4 h-4 mr-2" />
                  Start Presentation
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setNewSetlistName(selectedSetlist.name)
                        setNewSetlistDescription(selectedSetlist.description || '')
                        setIsEditModalOpen(true)
                      }}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Setlist
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicateSetlist(selectedSetlist)}>
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate Setlist
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDeleteSetlist(selectedSetlist)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Setlist
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-card p-4 rounded-lg border">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Items</span>
              </div>
              <div className="text-2xl font-bold">{selectedSetlist.items.length}</div>
            </div>
            <div className="bg-card p-4 rounded-lg border">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total Duration</span>
              </div>
              <div className="text-2xl font-bold font-mono">
                {formatDuration(getTotalDuration(selectedSetlist.items))}
              </div>
            </div>
            <div className="bg-card p-4 rounded-lg border">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Songs</span>
              </div>
              <div className="text-2xl font-bold">
                {selectedSetlist.items.filter((item) => item.type === 'song').length}
              </div>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <h2 className="text-xl font-semibold">Items</h2>
              <div className="text-sm text-muted-foreground">
                {isSelectMode
                  ? 'Select items for bulk operations'
                  : 'Drag and drop to reorder • Click to edit inline'}
              </div>
            </div>

            {/* Bulk Actions Bar */}
            {isSelectMode && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg border">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">{selectedItemIds.size} selected</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    disabled={selectedItemIds.size === selectedSetlist.items.length}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeselectAll}
                    disabled={selectedItemIds.size === 0}
                  >
                    Deselect All
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={selectedItemIds.size === 0}
                  >
                    <Trash className="w-4 h-4 mr-2" />
                    Delete ({selectedItemIds.size})
                  </Button>
                </div>
              </div>
            )}

            {selectedSetlist.items.length === 0 ? (
              <div className="border rounded-lg border-dashed">
                <div className="text-center py-12">
                  <Music className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-4">No items in this setlist yet.</p>
                  <Button onClick={handleOpenAddItemModal}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Item
                  </Button>
                </div>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={selectedSetlist.items.map((item) => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {selectedSetlist.items
                      .sort((a, b) => a.order - b.order)
                      .map((item) => (
                        <SortableItem
                          key={item.id}
                          item={item}
                          setlist={selectedSetlist}
                          onEdit={handleOpenEditItemModal}
                          onDelete={handleRemoveItem}
                          onUpdateDuration={handleUpdateItemDuration}
                          onUpdateNotes={handleUpdateItemNotes}
                          onUpdateTitle={handleUpdateItemTitle}
                          isSelectMode={isSelectMode}
                          isSelected={selectedItemIds.has(item.id)}
                          onToggleSelect={handleToggleSelectItem}
                        />
                      ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      ) : (
        // List View
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Setlists</h1>
              <p className="text-muted-foreground mt-1">
                Manage your service setlists and presentations
              </p>
            </div>

            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Setlist
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Setlist</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={newSetlistName}
                      onChange={(e) => setNewSetlistName(e.target.value)}
                      placeholder="Sunday Morning Service"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={newSetlistDescription}
                      onChange={(e) => setNewSetlistDescription(e.target.value)}
                      placeholder="Optional description"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateSetlist} disabled={!newSetlistName.trim()}>
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search setlists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Setlist Table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Name</th>
                  <th className="text-left p-4 font-medium">Description</th>
                  <th className="text-center p-4 font-medium">Items</th>
                  <th className="text-center p-4 font-medium">Duration</th>
                  <th className="text-center p-4 font-medium">Created</th>
                  <th className="text-center p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSetlists.map((setlist) => (
                  <tr key={setlist.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold">{setlist.name}</div>
                      {setlist.items.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                          {setlist.items.slice(0, 3).map((item, index) => (
                            <span key={item.id} className="flex items-center gap-1">
                              {getItemIcon(item.type)}
                              <span className="truncate max-w-[100px]">{item.title}</span>
                              {index < Math.min(setlist.items.length, 3) - 1 && <span>•</span>}
                            </span>
                          ))}
                          {setlist.items.length > 3 && (
                            <span className="text-muted-foreground">
                              +{setlist.items.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {setlist.description || '—'}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center">
                        <Users className="w-4 h-4 mr-1 text-muted-foreground" />
                        <span className="font-medium">{setlist.items.length}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center">
                        <Clock className="w-4 h-4 mr-1 text-muted-foreground" />
                        <span className="font-mono text-sm">
                          {formatDuration(getTotalDuration(setlist.items))}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="text-sm text-muted-foreground">
                        {new Date(setlist.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewSetlist(setlist)}
                          className="h-8"
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => startPresentation(setlist)}
                          className="h-8"
                        >
                          <Play className="w-3 h-3" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewSetlist(setlist)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => startPresentation(setlist)}>
                              <Play className="w-4 h-4 mr-2" />
                              Start Presentation
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedSetlist(setlist)
                                setNewSetlistName(setlist.name)
                                setNewSetlistDescription(setlist.description || '')
                                setIsEditModalOpen(true)
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicateSetlist(setlist)}>
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteSetlist(setlist)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredSetlists.length === 0 && (
            <div className="border rounded-lg">
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? 'No setlists match your search.' : 'No setlists created yet.'}
                </p>
                {!searchTerm && (
                  <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Setlist
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Edit Setlist Modal */}
          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Setlist</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={newSetlistName}
                    onChange={(e) => setNewSetlistName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Input
                    id="edit-description"
                    value={newSetlistDescription}
                    onChange={(e) => setNewSetlistDescription(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditSetlist} disabled={!newSetlistName.trim()}>
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* ADD ITEM MODAL - Always rendered at the top level */}
      <Dialog open={isAddItemModalOpen} onOpenChange={setIsAddItemModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Add Item to Setlist</DialogTitle>
            <div className="text-sm text-muted-foreground">
              {selectedSetlist?.name || 'No setlist selected'}
            </div>
          </DialogHeader>

          {!selectedSetlist ? (
            <div className="text-center py-12">
              <p className="text-red-500 mb-4">Error: No setlist selected</p>
              <Button onClick={() => setIsAddItemModalOpen(false)}>Close</Button>
            </div>
          ) : (
            <div className="flex h-[60vh] gap-6">
              {/* Left Sidebar - Categories */}
              <div className="w-64 flex flex-col space-y-2">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search all content..."
                    value={addItemSearchTerm}
                    onChange={(e) => setAddItemSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Category Cards */}
                <div className="space-y-2">
                  <Button
                    variant={selectedItemType === 'all' ? 'default' : 'ghost'}
                    className="w-full justify-start h-auto p-3"
                    onClick={() => setSelectedItemType('all')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">All</span>
                      </div>
                      <div className="text-left">
                        <div className="font-medium">All Items</div>
                        <div className="text-xs text-muted-foreground">Show everything</div>
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant={selectedItemType === 'song' ? 'default' : 'ghost'}
                    className="w-full justify-start h-auto p-3"
                    onClick={() => setSelectedItemType('song')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <Music className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Songs</div>
                        <div className="text-xs text-muted-foreground">
                          {songs.length} available
                        </div>
                      </div>
                    </div>
                  </Button>

                  <Button
                    variant={selectedItemType === 'presentation' ? 'default' : 'ghost'}
                    className="w-full justify-start h-auto p-3"
                    onClick={() => setSelectedItemType('presentation')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                        <Presentation className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">Presentations</div>
                        <div className="text-xs text-muted-foreground">
                          {presentations.length} available
                        </div>
                      </div>
                    </div>
                  </Button>

                  <div className="border-t pt-2 mt-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-2 px-3">MEDIA</p>

                    <Button
                      variant="ghost"
                      className="w-full justify-start h-auto p-3"
                      onClick={() => handleOpenMediaSelector('video')}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                          <Video className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">Video</div>
                          <div className="text-xs text-muted-foreground">Add from library</div>
                        </div>
                      </div>
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full justify-start h-auto p-3"
                      onClick={() => handleOpenMediaSelector('image')}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
                          <Image className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">Image</div>
                          <div className="text-xs text-muted-foreground">Add from library</div>
                        </div>
                      </div>
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full justify-start h-auto p-3"
                      onClick={() => handleOpenMediaSelector('audio')}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                          <Volume2 className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">Audio</div>
                          <div className="text-xs text-muted-foreground">Add from library</div>
                        </div>
                      </div>
                    </Button>
                  </div>

                  <div className="border-t pt-2 mt-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-2 px-3">
                      UTILITIES
                    </p>

                    <Button
                      variant={selectedItemType === 'countdown' ? 'default' : 'ghost'}
                      className="w-full justify-start h-auto p-3"
                      onClick={() => setSelectedItemType('countdown')}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
                          <Timer className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">Countdown</div>
                          <div className="text-xs text-muted-foreground">Timer & events</div>
                        </div>
                      </div>
                    </Button>

                    <Button
                      variant={selectedItemType === 'announcement' ? 'default' : 'ghost'}
                      className="w-full justify-start h-auto p-3"
                      onClick={() => setSelectedItemType('announcement')}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                          <MessageSquare className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">Announcement</div>
                          <div className="text-xs text-muted-foreground">Custom messages</div>
                        </div>
                      </div>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Right Content Area */}
              <div className="flex-1 flex flex-col min-h-0">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {selectedItemType === 'all'
                        ? 'All Items'
                        : selectedItemType === 'song'
                          ? 'Songs'
                          : selectedItemType === 'presentation'
                            ? 'Presentations'
                            : selectedItemType === 'countdown'
                              ? 'Countdown Timers'
                              : selectedItemType === 'announcement'
                                ? 'Announcements'
                                : 'Items'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedItemType === 'all'
                        ? 'Browse all available content'
                        : selectedItemType === 'song'
                          ? 'Select a song to add to your setlist'
                          : selectedItemType === 'presentation'
                            ? 'Choose a presentation to include'
                            : selectedItemType === 'countdown'
                              ? 'Add timer elements for transitions'
                              : selectedItemType === 'announcement'
                                ? 'Create custom announcements'
                                : 'Available items'}
                    </p>
                  </div>
                </div>

                {/* Content Grid */}
                <div className="flex-1 overflow-y-auto">
                  <div className="space-y-6">
                    <div className="space-y-4">
                      {/* Recent Items Section */}
                      {getRecentItems().length > 0 &&
                        (selectedItemType === 'all' ||
                          getRecentItems().some((item) => item.type === selectedItemType)) && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Recently Used
                              </h4>
                              <div className="flex-1 h-px bg-border"></div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {getRecentItems()
                                .filter(
                                  (item) =>
                                    selectedItemType === 'all' || item.type === selectedItemType
                                )
                                .slice(0, 4)
                                .map((recentItem, index) => (
                                  <div
                                    key={`recent-${recentItem.type}-${recentItem.referenceId}-${index}`}
                                    className="group relative overflow-hidden rounded-xl border bg-card p-4 hover:shadow-md transition-all duration-200 cursor-pointer hover:border-primary/50"
                                    onClick={() =>
                                      handleAddItem(
                                        recentItem.type,
                                        recentItem.referenceId,
                                        recentItem.title
                                      )
                                    }
                                  >
                                    <div className="flex items-start gap-3">
                                      <div
                                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                          recentItem.type === 'song'
                                            ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                                            : recentItem.type === 'presentation'
                                              ? 'bg-gradient-to-br from-green-500 to-green-600'
                                              : recentItem.type === 'countdown'
                                                ? 'bg-gradient-to-br from-red-500 to-pink-600'
                                                : recentItem.type === 'video'
                                                  ? 'bg-gradient-to-br from-red-500 to-red-600'
                                                  : recentItem.type === 'image'
                                                    ? 'bg-gradient-to-br from-yellow-500 to-orange-600'
                                                    : recentItem.type === 'audio'
                                                      ? 'bg-gradient-to-br from-purple-500 to-purple-600'
                                                      : 'bg-gradient-to-br from-orange-500 to-amber-600'
                                        }`}
                                      >
                                        <span className="text-white">
                                          {getItemIcon(recentItem.type)}
                                        </span>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h5 className="font-medium truncate">{recentItem.title}</h5>
                                        <p className="text-xs text-muted-foreground capitalize mt-1">
                                          {recentItem.type}
                                        </p>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <Plus className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                      <div className="space-y-2">
                        {/* Songs */}
                        {(selectedItemType === 'all' || selectedItemType === 'song') &&
                          songs
                            .filter(
                              (song) =>
                                song.name.toLowerCase().includes(addItemSearchTerm.toLowerCase()) ||
                                song.artist
                                  ?.toLowerCase()
                                  .includes(addItemSearchTerm.toLowerCase()) ||
                                song.tags.some((tag) =>
                                  tag.toLowerCase().includes(addItemSearchTerm.toLowerCase())
                                )
                            )
                            .map((song) => (
                              <div
                                key={`song-${song.id}`}
                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                                onClick={() => handleAddItem('song', song.id, song.name)}
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded">
                                    <Music className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                  </div>
                                  <div>
                                    <div className="font-medium">{song.name}</div>
                                    {song.artist && (
                                      <div className="text-sm text-muted-foreground">
                                        {song.artist}
                                      </div>
                                    )}
                                    {song.tags.length > 0 && (
                                      <div className="flex gap-1 mt-1">
                                        {song.tags.slice(0, 3).map((tag) => (
                                          <span
                                            key={tag}
                                            className="text-xs bg-secondary px-2 py-1 rounded"
                                          >
                                            {tag}
                                          </span>
                                        ))}
                                        {song.tags.length > 3 && (
                                          <span className="text-xs text-muted-foreground">
                                            +{song.tags.length - 3} more
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <Button size="sm" variant="ghost">
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}

                        {/* Presentations */}
                        {(selectedItemType === 'all' || selectedItemType === 'presentation') &&
                          presentations
                            .filter(
                              (presentation) =>
                                presentation.name
                                  .toLowerCase()
                                  .includes(addItemSearchTerm.toLowerCase()) ||
                                presentation.tags.some((tag) =>
                                  tag.toLowerCase().includes(addItemSearchTerm.toLowerCase())
                                )
                            )
                            .map((presentation) => (
                              <div
                                key={`presentation-${presentation.id}`}
                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                                onClick={() =>
                                  handleAddItem('presentation', presentation.id, presentation.name)
                                }
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded">
                                    <Presentation className="w-4 h-4 text-green-600 dark:text-green-400" />
                                  </div>
                                  <div>
                                    <div className="font-medium">{presentation.name}</div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {presentation.slides.length} slides • {presentation.type}
                                    </div>
                                  </div>
                                </div>
                                <Button size="sm" variant="ghost">
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}

                        {/* Countdown Timer Option */}
                        {(selectedItemType === 'all' || selectedItemType === 'countdown') &&
                          (!addItemSearchTerm ||
                            'countdown'.includes(addItemSearchTerm.toLowerCase()) ||
                            'timer'.includes(addItemSearchTerm.toLowerCase()) ||
                            'countdown timer'.includes(addItemSearchTerm.toLowerCase())) && (
                            <div
                              className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors border-dashed"
                              onClick={() => {
                                setPendingCountdownTitle('Countdown Timer')
                                setIsCountdownConfigOpen(true)
                              }}
                            >
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-red-100 dark:bg-red-900 rounded">
                                  <Timer className="w-4 h-4 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                  <div className="font-medium">Countdown Timer</div>
                                  <div className="text-sm text-muted-foreground">
                                    Add a countdown timer for events or transitions
                                  </div>
                                </div>
                              </div>
                              <Button size="sm" variant="ghost">
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          )}

                        {/* Announcement Option */}
                        {(selectedItemType === 'all' || selectedItemType === 'announcement') &&
                          (!addItemSearchTerm ||
                            'announcement'.includes(addItemSearchTerm.toLowerCase()) ||
                            'new announcement'.includes(addItemSearchTerm.toLowerCase())) && (
                            <div
                              className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors border-dashed"
                              onClick={() =>
                                handleAddItem('announcement', 'new', 'New Announcement')
                              }
                            >
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded">
                                  <MessageSquare className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                  <div className="font-medium">New Announcement</div>
                                  <div className="text-sm text-muted-foreground">
                                    Add a custom announcement or message
                                  </div>
                                </div>
                              </div>
                              <Button size="sm" variant="ghost">
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          )}

                        {/* No Results */}
                        {addItemSearchTerm &&
                          songs.filter((song) =>
                            song.name.toLowerCase().includes(addItemSearchTerm.toLowerCase())
                          ).length === 0 &&
                          presentations.filter((presentation) =>
                            presentation.name
                              .toLowerCase()
                              .includes(addItemSearchTerm.toLowerCase())
                          ).length === 0 &&
                          !'announcement'.includes(addItemSearchTerm.toLowerCase()) && (
                            <div className="text-center py-8 text-muted-foreground">
                              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p>No items match your search.</p>
                              <p className="text-sm">Try different keywords or clear the search.</p>
                            </div>
                          )}

                        {/* Empty State */}
                        {!addItemSearchTerm && songs.length === 0 && presentations.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>No songs or presentations available.</p>
                            <p className="text-sm">
                              Create some content first to add to your setlist.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex justify-between text-sm text-muted-foreground pt-2 border-t">
                <span>{songs.length} songs available</span>
                <span>{presentations.length} presentations available</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddItemModalOpen(false)
                setAddItemSearchTerm('')
                setSelectedItemType('all')
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT ITEM MODAL */}
      <Dialog open={isEditItemModalOpen} onOpenChange={setIsEditItemModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <div className="text-sm text-muted-foreground">
              {editingItem?.title || 'Unknown Item'}
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Item Info */}
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                {editingItem && (
                  <>
                    {editingItem.type === 'song' && <Music className="w-5 h-5 text-blue-600" />}
                    {editingItem.type === 'presentation' && (
                      <Presentation className="w-5 h-5 text-green-600" />
                    )}
                    {editingItem.type === 'media' && (
                      <FileImage className="w-5 h-5 text-purple-600" />
                    )}
                    {editingItem.type === 'announcement' && (
                      <MessageSquare className="w-5 h-5 text-orange-600" />
                    )}
                    {editingItem.type === 'countdown' && <Timer className="w-5 h-5 text-red-600" />}
                  </>
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium">{editingItem?.title}</div>
                <div className="text-sm text-muted-foreground capitalize">{editingItem?.type}</div>
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="edit-duration">Duration</Label>
              <TimeInput
                id="edit-duration"
                value={editingItem?.duration || 0}
                onChange={(seconds) => setEditItemDuration(formatTimeFromSeconds(seconds))}
                placeholder="e.g., 5min, 3:30, 1h30m"
              />
              <div className="text-xs text-muted-foreground">
                Enter duration in flexible formats: 5min, 3:30, 1h30m, or 00:05:30
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={editItemNotes}
                onChange={(e) => setEditItemNotes(e.target.value)}
                placeholder="Add notes about this item..."
                rows={4}
                className="resize-none"
              />
              <div className="text-xs text-muted-foreground">
                Add any special instructions, cues, or reminders for this item
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditItemModalOpen(false)
                setEditingItem(null)
                setEditItemDuration('')
                setEditItemNotes('')
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveItemEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Countdown Configuration Modal */}
      <CountdownConfig
        isOpen={isCountdownConfigOpen}
        onClose={() => {
          setIsCountdownConfigOpen(false)
          setPendingCountdownTitle('')
        }}
        onSave={handleSaveCountdownConfig}
      />

      {/* Media Selector Modal */}
      <MediaSelector
        isOpen={isMediaSelectorOpen}
        onClose={() => setIsMediaSelectorOpen(false)}
        onAddMedia={handleAddMediaItem}
        mediaType={mediaSelectorType}
      />
    </>
  )
}
