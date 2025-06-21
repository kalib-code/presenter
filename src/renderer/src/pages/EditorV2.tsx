import { useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Separator } from '@renderer/components/ui/separator'
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
  Image
} from 'lucide-react'

// New store-based imports
import { useEditorMetaStore } from '@renderer/store/editor-meta'
import { useSlidesStore } from '@renderer/store/editor-slides'
import { useCanvasStore } from '@renderer/store/editor-canvas'
import { useHistoryStore } from '@renderer/store/editor-history'
import { usePersistenceStore, useSaveStatus } from '@renderer/store/editor-persistence'
import { useBackgroundStore } from '@renderer/store/editor-background'

// New components
import { Canvas } from '@renderer/components/editor/Canvas'
import { ElementToolbar } from '@renderer/components/editor/ElementToolbar'
import { BackgroundPanel } from '@renderer/components/editor/BackgroundPanel'
import { SlideTitle } from '@renderer/components/editor/SlideTitle'
// import { SlideTitle } from '@renderer/components/editor/SlideTitle'

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

  // Store hooks
  const { title, artist, setTitle, setArtist, hasUnsavedChanges } = useEditorMetaStore()

  const { slides, currentSlideIndex, addSlide, deleteSlide, setCurrentSlide, duplicateSlide } =
    useSlidesStore()

  const { elements } = useCanvasStore()

  const { canUndo, canRedo, undo, redo } = useHistoryStore()

  const { autoSaveEnabled } = useSaveStatus()

  // Background store - using direct access to avoid selector issues
  const toggleBackgroundPanel = useBackgroundStore((state) => state.toggleBackgroundPanel)
  const isPanelOpen = useBackgroundStore((state) => state.isBackgroundPanelOpen)

  // Initialize editor
  useEffect(() => {
    // Initialize stores
    useEditorMetaStore.getState().initialize({
      mode,
      action,
      itemId
    })

    useCanvasStore.getState().initialize([])
    useBackgroundStore.getState().initialize()
    usePersistenceStore.getState().initialize() // Initialize change detection

    // Load existing song if editing
    if (action === 'edit' && itemId) {
      usePersistenceStore
        .getState()
        .loadEditor(itemId)
        .catch((error) => {
          console.error('Failed to load song:', error)
          toast({
            title: 'Error',
            description: 'Failed to load song',
            variant: 'destructive'
          })
        })
    } else {
      // Create initial slide for new content
      const currentSlides = useSlidesStore.getState().slides
      if (currentSlides.length === 0) {
        useSlidesStore.getState().addSlide()
      }
    }
  }, [mode, action, itemId, toast])

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
        description: 'Song saved successfully',
        variant: 'default'
      })
    } catch (error) {
      console.error('Save failed:', error)
      toast({
        title: 'Error',
        description: 'Failed to save song',
        variant: 'destructive'
      })
    }
  }, [toast])

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
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleSave, undo, redo, addSlide])

  const currentSlide = slides[currentSlideIndex]

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-card border-b border-border shadow-sm">
        <div className="flex items-center gap-4">
          <Button onClick={handleBack} variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex items-center gap-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Song Title"
              className="w-64"
            />
            <Input
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Artist"
              className="w-48"
            />
          </div>
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
              <div
                key={slide.id}
                className={`p-3 mb-2 rounded cursor-pointer transition-colors ${
                  index === currentSlideIndex
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'bg-sidebar-primary/10 hover:bg-sidebar-accent/50 text-sidebar-foreground'
                }`}
                onClick={() => setCurrentSlide(index)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <SlideTitle slideIndex={index} className="font-medium text-sm" />
                    <div className="text-xs opacity-75 mt-1">
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
            ))}
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col">
          {/* Element Toolbar */}
          <ElementToolbar />

          {/* Canvas Area */}
          <div className="flex-1 p-6 overflow-auto bg-muted/30">
            <div className="flex justify-center">
              <div className="relative">
                {currentSlide && (
                  <div className="mb-4 text-center">
                    <h2 className="text-xl font-semibold text-foreground">{currentSlide.title}</h2>
                  </div>
                )}
                <Canvas className="shadow-2xl" />
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="p-3 bg-card border-t border-border text-sm text-muted-foreground">
            <div className="flex justify-between items-center">
              <span>
                {elements.length} element{elements.length !== 1 ? 's' : ''} on slide{' '}
                {currentSlideIndex + 1}
              </span>
              <span>Ctrl+S: Save • Ctrl+Z/Y: Undo/Redo • Ctrl+N: New Slide</span>
            </div>
          </div>
        </div>

        {/* Background Panel */}
        {isPanelOpen && <BackgroundPanel />}
      </div>

      <Toaster />
    </div>
  )
}
