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
  Eye
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

// Sortable Item Component
interface SortableItemProps {
  item: SetlistItem
  setlist: Setlist
  onEdit: (item: SetlistItem) => void
  onDelete: (itemId: string) => void
  onUpdateDuration: (itemId: string, duration: number) => void
  onUpdateNotes: (itemId: string, notes: string) => void
}

// Helper functions for time format conversion
const formatTimeFromSeconds = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

const parseTimeToSeconds = (timeString: string): number => {
  const parts = timeString.split(':')
  if (parts.length !== 3) return 0

  const hours = parseInt(parts[0]) || 0
  const minutes = parseInt(parts[1]) || 0
  const seconds = parseInt(parts[2]) || 0

  return hours * 3600 + minutes * 60 + seconds
}

// Format time input as user types (auto-add colons)
const formatTimeInput = (value: string): string => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '')

  // Limit to 6 digits (HHMMSS)
  const limitedDigits = digits.slice(0, 6)

  // Add colons at appropriate positions
  if (limitedDigits.length <= 2) {
    return limitedDigits
  } else if (limitedDigits.length <= 4) {
    return `${limitedDigits.slice(0, 2)}:${limitedDigits.slice(2)}`
  } else {
    return `${limitedDigits.slice(0, 2)}:${limitedDigits.slice(2, 4)}:${limitedDigits.slice(4)}`
  }
}

function SortableItem({
  item,
  setlist,
  onEdit,
  onDelete,
  onUpdateDuration,
  onUpdateNotes
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
      className="flex items-center gap-3 p-4 bg-card border rounded-lg hover:shadow-sm transition-all"
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Item Info */}
      <div className="flex items-center gap-3 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground font-mono w-6 text-center">
            {item.order + 1}
          </span>
          {getItemIcon(item.type)}
        </div>

        <div className="flex-1">
          <div className="font-medium">{item.title}</div>
          <div className="text-sm text-muted-foreground">
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </div>
        </div>
      </div>

      {/* Duration */}
      <div className="flex items-center gap-2">
        <Clock className="w-3 h-3 text-muted-foreground" />
        <button
          onClick={() => onEdit(item)}
          className="text-sm font-mono hover:text-primary hover:underline cursor-pointer transition-colors"
          title="Click to edit duration"
        >
          {formatDuration(item.duration || 0)}
        </button>
      </div>

      {/* Notes */}
      <div className="flex items-center gap-2 min-w-0 max-w-[200px]">
        <button
          onClick={() => onEdit(item)}
          className="text-sm text-muted-foreground truncate hover:text-primary cursor-pointer transition-colors text-left"
          title="Click to edit notes"
        >
          {item.notes || 'Click to add notes'}
        </button>
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
    updateSetlist,
    deleteSetlist,
    startPresentation,
    addItem,
    removeItem,
    reorderItems,
    updateItem,
    loadSetlists
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
    type: 'song' | 'presentation' | 'media' | 'announcement' | 'countdown',
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
                Drag and drop to reorder • Click to edit inline
              </div>
            </div>

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
            <div className="flex flex-col space-y-4 py-4 min-h-0">
              {/* Search and Filter Controls */}
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search songs, presentations..."
                    value={addItemSearchTerm}
                    onChange={(e) => setAddItemSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={selectedItemType === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedItemType('all')}
                  >
                    All
                  </Button>
                  <Button
                    variant={selectedItemType === 'song' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedItemType('song')}
                  >
                    <Music className="w-4 h-4 mr-1" />
                    Songs
                  </Button>
                  <Button
                    variant={selectedItemType === 'presentation' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedItemType('presentation')}
                  >
                    <Presentation className="w-4 h-4 mr-1" />
                    Presentations
                  </Button>
                  <Button
                    variant={selectedItemType === 'countdown' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedItemType('countdown')}
                  >
                    <Timer className="w-4 h-4 mr-1" />
                    Countdown
                  </Button>
                  <Button
                    variant={selectedItemType === 'announcement' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedItemType('announcement')}
                  >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Announcements
                  </Button>
                </div>
              </div>

              {/* Items List */}
              <div className="flex-1 min-h-0 border rounded-lg">
                <div className="h-96 overflow-y-auto p-4">
                  <div className="space-y-2">
                    {/* Songs */}
                    {(selectedItemType === 'all' || selectedItemType === 'song') &&
                      songs
                        .filter(
                          (song) =>
                            song.name.toLowerCase().includes(addItemSearchTerm.toLowerCase()) ||
                            song.artist?.toLowerCase().includes(addItemSearchTerm.toLowerCase()) ||
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
                                  <div className="text-sm text-muted-foreground">{song.artist}</div>
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
                          onClick={() => handleAddItem('countdown', 'new', 'Countdown Timer')}
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
                          onClick={() => handleAddItem('announcement', 'new', 'New Announcement')}
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
                        presentation.name.toLowerCase().includes(addItemSearchTerm.toLowerCase())
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
                        <p className="text-sm">Create some content first to add to your setlist.</p>
                      </div>
                    )}
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
              <Label htmlFor="edit-duration">Duration (HH:MM:SS)</Label>
              <Input
                id="edit-duration"
                type="text"
                value={editItemDuration}
                onChange={(e) => setEditItemDuration(formatTimeInput(e.target.value))}
                placeholder="00:05:30"
                maxLength={8}
                className="font-mono"
              />
              <div className="text-xs text-muted-foreground">
                Enter duration in hours:minutes:seconds format (e.g., 00:05:30 for 5 minutes 30
                seconds)
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
    </>
  )
}
