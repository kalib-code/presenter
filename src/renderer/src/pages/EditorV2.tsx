import React, { useEffect, useCallback, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Separator } from '@renderer/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@renderer/components/ui/dialog'
import { useToast } from '@renderer/hooks/use-toast'

import {
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Undo,
  Redo,
  SkipBack,
  SkipForward,
  GripVertical,
  Eye,
  Edit,
  Settings
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

import { SlideTitle } from '@renderer/components/editor/SlideTitle'
import { PropertiesPanel } from '@renderer/components/editor/PropertiesPanel'
import { MetadataPanel } from '@renderer/components/editor/MetadataPanel'
import { AlignmentSettings } from '@renderer/components/editor/AlignmentSettings'

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
  const hasUnsavedChanges = useEditorMetaStore((state) => state.hasUnsavedChanges)
  const setTitle = useEditorMetaStore((state) => state.setTitle)

  const { titleLabel, titlePlaceholder } = useEditorLabels()

  const slides = useSlidesStore((state) => state.slides)
  const currentSlideIndex = useSlidesStore((state) => state.currentSlideIndex)
  const addSlide = useSlidesStore((state) => state.addSlide)
  const deleteSlide = useSlidesStore((state) => state.deleteSlide)
  const setCurrentSlide = useSlidesStore((state) => state.setCurrentSlide)
  const duplicateSlide = useSlidesStore((state) => state.duplicateSlide)
  const moveSlide = useSlidesStore((state) => state.moveSlide)

  const elements = useCanvasStore((state) => state.elements)
  const selectedElementId = useCanvasStore((state) => state.selectedElementId)
  const deleteSelectedElements = useCanvasStore((state) => state.deleteSelectedElements)

  const canUndo = useHistoryStore((state) => state.canUndo)
  const canRedo = useHistoryStore((state) => state.canRedo)
  const undo = useHistoryStore((state) => state.undo)
  const redo = useHistoryStore((state) => state.redo)

  const { autoSaveEnabled } = useSaveStatus()

  // Debug autosave status
  useEffect(() => {
    console.log('🎛️ [EDITOR] AutoSave status changed:', { autoSaveEnabled })
  }, [autoSaveEnabled])

  // Drag and drop state
  const [draggedSlideIndex, setDraggedSlideIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // Preview mode state
  const [isPreviewMode, setIsPreviewMode] = useState(false)

  // Background store - using direct access to avoid selector issues

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
    // Note: Don't reinitialize persistence store here - it should only be initialized once at app startup

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

  // Note: Removed persistence store cleanup as it's now global and should persist across editor instances

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
      // Handle Delete/Backspace key (without modifiers)
      if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey &&
        !e.altKey
      ) {
        console.log('🗑️ Delete key pressed:', {
          selectedElementId,
          targetType: e.target?.constructor.name,
          isInput: e.target instanceof HTMLInputElement,
          isTextarea: e.target instanceof HTMLTextAreaElement
        })

        // Only delete if an element is selected and we're not in a text input
        if (
          selectedElementId &&
          !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
        ) {
          console.log('🗑️ Deleting selected element:', selectedElementId)
          e.preventDefault()
          deleteSelectedElements()
        } else {
          console.log('🗑️ Delete prevented:', {
            noSelection: !selectedElementId,
            inTextInput:
              e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement
          })
        }
        return
      }

      // Handle modifier key shortcuts
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
  }, [
    handleSave,
    undo,
    redo,
    addSlide,
    selectedElementId,
    deleteSelectedElements,
    isPreviewMode,
    setIsPreviewMode
  ])

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
                <span>Auto-save off</span>
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

            <Button onClick={handleSave} variant="default" size="sm">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>

        {/* Content title and metadata section */}
        <div className="px-4 pb-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="space-y-1 flex-1 max-w-md">
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

            <div className="flex gap-2">
              <AlignmentSettings className="mt-6" />

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="mt-6">
                    <Settings className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{mode === 'song' ? 'Song' : 'Presentation'} Metadata</DialogTitle>
                  </DialogHeader>
                  <MetadataPanel className="space-y-4" />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Slide Panel */}
        <div className="w-72 bg-sidebar border-r border-sidebar-border flex flex-col">
          {/* Slide Controls */}
          <div className="p-3 border-b border-sidebar-border">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Slides ({slides.length})
              </h3>
              <Button onClick={() => addSlide()} size="sm" variant="default" className="h-7 px-2">
                <Plus className="w-3 h-3 mr-1" />
                Add
              </Button>
            </div>

            {/* Compact Navigation */}
            <div className="flex items-center justify-between bg-muted/50 rounded-lg p-2">
              <Button
                onClick={() => setCurrentSlide(Math.max(0, currentSlideIndex - 1))}
                disabled={currentSlideIndex === 0}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                <SkipBack className="w-3 h-3" />
              </Button>

              <div className="text-xs font-medium px-2 bg-background rounded px-3 py-1">
                {currentSlideIndex + 1} / {slides.length}
              </div>

              <Button
                onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlideIndex + 1))}
                disabled={currentSlideIndex === slides.length - 1}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                <SkipForward className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Slide List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {slides.map((slide, index) => (
              <React.Fragment key={slide.id}>
                {/* Drop zone indicator */}
                {dragOverIndex === index &&
                  draggedSlideIndex !== null &&
                  draggedSlideIndex !== index && (
                    <div className="h-0.5 bg-primary rounded-full mb-1 animate-pulse mx-2" />
                  )}

                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`group relative p-2 rounded-lg cursor-pointer transition-all duration-200 border ${
                    index === currentSlideIndex
                      ? 'bg-primary/10 border-primary/50 shadow-sm'
                      : 'bg-sidebar-primary/5 hover:bg-sidebar-accent/30 border-transparent hover:border-sidebar-accent/50'
                  } ${draggedSlideIndex === index ? 'opacity-50 scale-98' : ''} ${
                    dragOverIndex === index && draggedSlideIndex !== index
                      ? 'border-primary border-dashed bg-primary/5'
                      : ''
                  }`}
                  onClick={() => setCurrentSlide(index)}
                >
                  {/* Current slide indicator */}
                  {index === currentSlideIndex && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                  )}

                  <div className="flex items-start gap-2">
                    {/* Drag handle */}
                    <div className="flex flex-col items-center justify-center pt-1">
                      <GripVertical className="w-3 h-3 text-muted-foreground/40 cursor-grab active:cursor-grabbing" />
                      <div
                        className={`text-xs font-medium mt-1 w-6 h-6 rounded flex items-center justify-center ${
                          index === currentSlideIndex
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted/60 text-muted-foreground'
                        }`}
                      >
                        {index + 1}
                      </div>
                    </div>

                    {/* Slide preview thumbnail */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <SlideTitle
                          slideIndex={index}
                          className={`font-medium text-xs truncate flex-1 ${
                            index === currentSlideIndex
                              ? 'text-foreground'
                              : 'text-muted-foreground'
                          }`}
                        />

                        {/* Quick action buttons - show on hover */}
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              duplicateSlide(index)
                            }}
                            variant="ghost"
                            size="sm"
                            className="w-5 h-5 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
                            title="Duplicate slide"
                          >
                            <div className="w-3 h-3 text-xs">📋</div>
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
                            className="w-5 h-5 p-0 hover:bg-red-100 dark:hover:bg-red-900 hover:text-red-600"
                            title="Delete slide"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Slide info */}
                      <div className="flex items-center justify-between text-xs">
                        <span
                          className={`${
                            index === currentSlideIndex
                              ? 'text-muted-foreground'
                              : 'text-muted-foreground/70'
                          }`}
                        >
                          {slide.elements?.length || 0} element
                          {(slide.elements?.length || 0) !== 1 ? 's' : ''}
                        </span>

                        {/* Status indicators */}
                        <div className="flex items-center gap-1">
                          {slide.background && (
                            <div
                              className="w-2 h-2 bg-orange-400 rounded-full"
                              title="Has background"
                            />
                          )}
                          {(slide.elements?.length || 0) > 0 && (
                            <div
                              className="w-2 h-2 bg-green-400 rounded-full"
                              title="Has content"
                            />
                          )}
                        </div>
                      </div>

                      {/* Mini canvas preview */}
                      {/* <div className="mt-1.5 w-full h-8 bg-muted/30 rounded border overflow-hidden relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-xs text-muted-foreground/50">
                            {slide.elements?.length ? '📄' : '📋'}
                          </div>
                        </div> */}
                      {/* Could add actual mini preview here later */}
                      {/* </div> */}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            ))}

            {/* Add slide hint when empty */}
            {slides.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-2xl mb-2">📋</div>
                <p className="text-xs">No slides yet</p>
                <Button
                  onClick={() => addSlide()}
                  size="sm"
                  variant="outline"
                  className="mt-2 h-7 text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add First Slide
                </Button>
              </div>
            )}
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
                    <div className="group inline-flex items-center gap-2">
                      <SlideTitle
                        slideIndex={currentSlideIndex}
                        className="text-xl font-semibold text-foreground"
                      />
                    </div>
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

        {/* Properties Panel */}
        <PropertiesPanel />
      </div>
    </div>
  )
}
