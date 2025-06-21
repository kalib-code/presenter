import React, { useEffect, useCallback, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Separator } from '@renderer/components/ui/separator'
import { TagsInput } from '@renderer/components/ui/tags-input'
import { useToast } from '@renderer/hooks/use-toast'
import { Toaster } from '@renderer/components/ui/toaster'
import {
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Undo,
  Redo,
  SkipBack,
  SkipForward,
  Image,
  GripVertical,
  Eye,
  Edit
} from 'lucide-react'

// New store-based imports
import { useEditorMetaStore, useEditorLabels } from '@renderer/store/editor-meta'
import { useSlidesStore } from '@renderer/store/editor-slides'
import { useCanvasStore } from '@renderer/store/editor-canvas'
import { useHistoryStore } from '@renderer/store/editor-history'
import { usePersistenceStore, useSaveStatus } from '@renderer/store/editor-persistence'
import { useBackgroundStore } from '@renderer/store/editor-background'

// New components
import { Canvas } from '@renderer/components/editor/Canvas'
import { PreviewCanvas } from '@renderer/components/editor/PreviewCanvas'
import { ElementToolbar } from '@renderer/components/editor/ElementToolbar'
import { BackgroundPanel } from '@renderer/components/editor/BackgroundPanel'
import { SlideTitle } from '@renderer/components/editor/SlideTitle'
import { PropertiesPanel } from '@renderer/components/editor/PropertiesPanel'

type EditorMode = 'song' | 'slide'
type EditorAction = 'create' | 'edit'

export default function EditorV2(): JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()

  // Parse URL parameters
  const searchParams = new URLSearchParams(location.search)
  const mode = (searchParams.get('mode') as EditorMode) || 'song'
  const action = (searchParams.get('action') as EditorAction) || 'create'
  const itemId = searchParams.get('id') || undefined

  // Store hooks - using specific selectors to prevent unnecessary re-renders
  const title = useEditorMetaStore((state) => state.title)
  const artist = useEditorMetaStore((state) => state.artist)
  const tags = useEditorMetaStore((state) => state.tags)
  const hasUnsavedChanges = useEditorMetaStore((state) => state.hasUnsavedChanges)
  const setTitle = useEditorMetaStore((state) => state.setTitle)
  const setArtist = useEditorMetaStore((state) => state.setArtist)
  const setTags = useEditorMetaStore((state) => state.setTags)

  const { titleLabel, artistLabel, titlePlaceholder, artistPlaceholder } = useEditorLabels()

  const slides = useSlidesStore((state) => state.slides)
  const currentSlideIndex = useSlidesStore((state) => state.currentSlideIndex)
  const addSlide = useSlidesStore((state) => state.addSlide)
  const deleteSlide = useSlidesStore((state) => state.deleteSlide)
  const setCurrentSlide = useSlidesStore((state) => state.setCurrentSlide)
  const duplicateSlide = useSlidesStore((state) => state.duplicateSlide)
  const moveSlide = useSlidesStore((state) => state.moveSlide)

  const elements = useCanvasStore((state) => state.elements)

  const canUndo = useHistoryStore((state) => state.canUndo)
  const canRedo = useHistoryStore((state) => state.canRedo)
  const undo = useHistoryStore((state) => state.undo)
  const redo = useHistoryStore((state) => state.redo)

  const { autoSaveEnabled } = useSaveStatus()

  // Drag and drop state
  const [draggedSlideIndex, setDraggedSlideIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // Preview mode state
  const [isPreviewMode, setIsPreviewMode] = useState(false)

  // Background store - using direct access to avoid selector issues
  const toggleBackgroundPanel = useBackgroundStore((state) => state.toggleBackgroundPanel)
  const isPanelOpen = useBackgroundStore((state) => state.isBackgroundPanelOpen)

  // Initialize editor
  useEffect(() => {
    console.log('🎛️ [EDITOR] Initializing editor with:', { mode, action, itemId })

    // Initialize stores
    useEditorMetaStore.getState().initialize({
      mode,
      action,
      itemId
    })

    // Clear all stores when creating new content or switching between items
    console.log('🎛️ [EDITOR] Clearing all stores...')
    useCanvasStore.getState().initialize([])
    useBackgroundStore.getState().initialize()
    useSlidesStore.getState().reset() // Clear slides completely
    useHistoryStore.getState().clear() // Clear undo/redo history
    usePersistenceStore.getState().initialize() // Initialize change detection

    // Load existing item if editing
    if (action === 'edit' && itemId) {
      console.log('🎛️ [EDITOR] Loading existing item:', itemId)
      usePersistenceStore
        .getState()
        .loadEditor(itemId)
        .catch((error) => {
          console.error(`Failed to load ${mode}:`, error)
          toast({
            title: 'Error',
            description: `Failed to load ${mode === 'song' ? 'song' : 'presentation'}`,
            variant: 'destructive'
          })
          // Navigate back to collection on load failure
          navigate('/collection')
        })
    } else {
      // Create new content - initialize with empty slides store and add first slide
      console.log('🎛️ [EDITOR] Creating new content, adding initial slide...')
      useSlidesStore.getState().initialize([]) // This will create an initial slide
    }
  }, [mode, action, itemId, toast, navigate])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      usePersistenceStore.getState().cleanup()
    }
  }, [])

  // Handle save
  const handleSave = useCallback(async () => {
    try {
      await usePersistenceStore.getState().saveEditor()
      toast({
        title: 'Success',
        description: `${mode === 'song' ? 'Song' : 'Presentation'} saved successfully`,
        variant: 'default'
      })
    } catch (error) {
      console.error('Save failed:', error)
      toast({
        title: 'Error',
        description: `Failed to save ${mode === 'song' ? 'song' : 'presentation'}`,
        variant: 'destructive'
      })
    }
  }, [toast, mode])

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (hasUnsavedChanges) {
      const shouldLeave = confirm('You have unsaved changes. Are you sure you want to leave?')
      if (!shouldLeave) return
    }
    navigate('/collection')
  }, [hasUnsavedChanges, navigate])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault()
            handleSave()
            break
          case 'z':
            e.preventDefault()
            if (e.shiftKey) {
              redo()
            } else {
              undo()
            }
            break
          case 'n':
            e.preventDefault()
            addSlide()
            break
          case 'p':
            e.preventDefault()
            setIsPreviewMode(!isPreviewMode)
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleSave, undo, redo, addSlide])

  // Drag and drop handlers - optimized to prevent infinite loops
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedSlideIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index.toString())
  }, [])

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      if (dragOverIndex !== index) {
        setDragOverIndex(index)
      }
    },
    [dragOverIndex]
  )

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear drag over if we're actually leaving the slide area
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverIndex(null)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault()
      e.stopPropagation()

      if (draggedSlideIndex !== null && draggedSlideIndex !== dropIndex) {
        moveSlide(draggedSlideIndex, dropIndex)

        // Update current slide index if needed
        if (currentSlideIndex === draggedSlideIndex) {
          setCurrentSlide(dropIndex)
        } else if (currentSlideIndex > draggedSlideIndex && currentSlideIndex <= dropIndex) {
          setCurrentSlide(currentSlideIndex - 1)
        } else if (currentSlideIndex < draggedSlideIndex && currentSlideIndex >= dropIndex) {
          setCurrentSlide(currentSlideIndex + 1)
        }
      }
      setDraggedSlideIndex(null)
      setDragOverIndex(null)
    },
    [draggedSlideIndex, currentSlideIndex, moveSlide, setCurrentSlide]
  )

  const handleDragEnd = useCallback(() => {
    setDraggedSlideIndex(null)
    setDragOverIndex(null)
  }, [])

  const currentSlide = slides[currentSlideIndex]

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <div className="bg-card border-b border-border shadow-sm">
        {/* Top row - Navigation and controls */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Button onClick={handleBack} variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* Undo/Redo */}
            <Button onClick={undo} disabled={!canUndo} variant="ghost" size="sm">
              <Undo className="w-4 h-4" />
            </Button>
            <Button onClick={redo} disabled={!canRedo} variant="ghost" size="sm">
              <Redo className="w-4 h-4" />
            </Button>

            <Separator orientation="vertical" className="h-6" />

            {/* Save status */}
            <div className="text-sm text-muted-foreground">
              {autoSaveEnabled ? (
                hasUnsavedChanges ? (
                  <span className="text-destructive">Unsaved changes</span>
                ) : (
                  <span className="text-green-600">Saved</span>
                )
              ) : (
                'Auto-save off'
              )}
            </div>

            <Button
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              variant={isPreviewMode ? 'default' : 'outline'}
              size="sm"
              className="mr-2"
            >
              {isPreviewMode ? (
                <>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Mode
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </>
              )}
            </Button>

            <Button
              onClick={toggleBackgroundPanel}
              variant={isPanelOpen ? 'default' : 'outline'}
              size="sm"
              className="mr-2"
            >
              <Image className="w-4 h-4 mr-2" />
              Backgrounds
            </Button>

            <Button onClick={handleSave} variant="default" size="sm">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>

        {/* Content metadata section */}
        <div className="px-4 pb-4 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {titleLabel}
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={titlePlaceholder}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {artistLabel}
              </label>
              <Input
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder={artistPlaceholder}
                className="h-9"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Tags
            </label>
            <TagsInput
              tags={tags}
              onTagsChange={setTags}
              placeholder="Add tags (press Enter to add)"
              className="min-h-[36px]"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Slide Panel */}
        <div className="w-80 bg-sidebar border-r border-sidebar-border flex flex-col">
          {/* Slide Controls */}
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Slides</h3>
              <Button onClick={() => addSlide()} size="sm" variant="default">
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>

            {/* Slide Navigation */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setCurrentSlide(Math.max(0, currentSlideIndex - 1))}
                disabled={currentSlideIndex === 0}
                variant="ghost"
                size="sm"
              >
                <SkipBack className="w-4 h-4" />
              </Button>

              <span className="text-sm text-muted-foreground px-2">
                {currentSlideIndex + 1} of {slides.length}
              </span>

              <Button
                onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlideIndex + 1))}
                disabled={currentSlideIndex === slides.length - 1}
                variant="ghost"
                size="sm"
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Slide List */}
          <div className="flex-1 overflow-y-auto p-2">
            {slides.map((slide, index) => (
              <React.Fragment key={slide.id}>
                {/* Drop zone indicator */}
                {dragOverIndex === index &&
                  draggedSlideIndex !== null &&
                  draggedSlideIndex !== index && (
                    <div className="h-1 bg-primary rounded-full mb-2 animate-pulse" />
                  )}

                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`p-3 mb-2 rounded cursor-pointer transition-all duration-200 ${
                    index === currentSlideIndex
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'bg-sidebar-primary/10 hover:bg-sidebar-accent/50 text-sidebar-foreground'
                  } ${draggedSlideIndex === index ? 'opacity-50 scale-95' : ''} ${
                    dragOverIndex === index && draggedSlideIndex !== index
                      ? 'border-2 border-primary border-dashed'
                      : 'border-2 border-transparent'
                  }`}
                  onClick={() => setCurrentSlide(index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-3 h-3 text-muted-foreground/50 cursor-grab active:cursor-grabbing flex-shrink-0" />
                        <SlideTitle slideIndex={index} className="font-medium text-sm" />
                      </div>
                      <div className="text-xs opacity-75 mt-1 ml-5">
                        {slide.elements?.length || 0} element
                        {(slide.elements?.length || 0) !== 1 ? 's' : ''}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          duplicateSlide(index)
                        }}
                        variant="ghost"
                        size="sm"
                        className="w-6 h-6 p-0"
                      >
                        📋
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (slides.length > 1) {
                            deleteSlide(index)
                          }
                        }}
                        disabled={slides.length <= 1}
                        variant="ghost"
                        size="sm"
                        className="w-6 h-6 p-0 hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col">
          {/* Element Toolbar - Only show in edit mode */}
          {!isPreviewMode && <ElementToolbar />}

          {/* Canvas Area */}
          <div className="flex-1 p-6 overflow-auto bg-muted/30">
            <div className="flex justify-center">
              <div className="relative">
                {currentSlide && (
                  <div className="mb-4 text-center">
                    <h2 className="text-xl font-semibold text-foreground">{currentSlide.title}</h2>
                    {isPreviewMode && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Live Preview - This is exactly how it will appear on the presentation screen
                      </p>
                    )}
                  </div>
                )}
                {isPreviewMode ? (
                  <PreviewCanvas className="shadow-2xl" />
                ) : (
                  <Canvas className="shadow-2xl" />
                )}
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="p-3 bg-card border-t border-border text-sm text-muted-foreground">
            <div className="flex justify-between items-center">
              <span>
                {isPreviewMode ? (
                  <>
                    Preview Mode - Slide {currentSlideIndex + 1} of {slides.length}
                  </>
                ) : (
                  <>
                    {elements.length} element{elements.length !== 1 ? 's' : ''} on slide{' '}
                    {currentSlideIndex + 1}
                  </>
                )}
              </span>
              <span>
                {isPreviewMode
                  ? 'Click "Edit Mode" to make changes'
                  : 'Ctrl+S: Save • Ctrl+Z/Y: Undo/Redo • Ctrl+N: New Slide • Ctrl+P: Preview'}
              </span>
            </div>
          </div>
        </div>

        {/* Background Panel */}
        {isPanelOpen && <BackgroundPanel />}

        {/* Properties Panel */}
        <PropertiesPanel />
      </div>

      <Toaster />
    </div>
  )
}
