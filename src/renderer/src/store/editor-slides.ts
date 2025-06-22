import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { useHistoryStore, createHistoryAction } from './editor-history'
import type { Slide } from '@renderer/types/database'
import { useCanvasStore } from './editor-canvas'
import { useEditorMetaStore } from './editor-meta'
import { useBackgroundStore } from './editor-background'

interface SlidesState {
  slides: Slide[]
  currentSlideIndex: number
  editingSlideTitle: number | null
  tempSlideTitle: string
}

interface SlidesActions {
  // Slide management
  setSlides: (slides: Slide[]) => void
  addSlide: () => void
  deleteSlide: (index: number) => void
  duplicateSlide: (index: number) => void
  moveSlide: (fromIndex: number, toIndex: number) => void

  // Navigation
  setCurrentSlide: (index: number) => void
  nextSlide: () => void
  previousSlide: () => void

  // Slide editing
  updateSlide: (index: number, updates: Partial<Slide>) => void
  updateSlideTitle: (index: number, title: string) => void
  updateSlideContent: (index: number, content: string) => void
  updateSlideNotes: (index: number, notes: string) => void
  updateSlideBackground: (
    index: number,
    background?: {
      type: 'color' | 'image' | 'video' | 'gradient'
      value: string
      opacity?: number
      playbackRate?: number
    }
  ) => void

  // Title editing UI state
  startEditingTitle: (index: number) => void
  finishEditingTitle: () => void
  cancelEditingTitle: () => void
  setTempTitle: (title: string) => void

  // Bulk operations
  autoNumberSlides: () => void
  clearAllSlides: () => void

  // Initialization
  initialize: (slides?: Slide[]) => void
  reset: () => void
}

type SlidesStore = SlidesState & SlidesActions

const initialState: SlidesState = {
  slides: [],
  currentSlideIndex: 0,
  editingSlideTitle: null,
  tempSlideTitle: ''
}

const generateSlideTitle = (slideNumber: number, mode: 'song' | 'slide' = 'song'): string => {
  if (mode === 'song') {
    const slideTypes = ['Verse', 'Chorus', 'Bridge', 'Intro', 'Outro']
    return slideNumber <= slideTypes.length
      ? `${slideTypes[slideNumber - 1]} ${Math.ceil(slideNumber / slideTypes.length)}`
      : `Verse ${slideNumber}`
  }
  return `Slide ${slideNumber}`
}

export const useSlidesStore = create<SlidesStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    setSlides: (slides) => {
      set({ slides, currentSlideIndex: Math.min(get().currentSlideIndex, slides.length - 1) })
    },

    addSlide: () => {
      const state = get()
      const newSlideIndex = state.slides.length
      const currentMode = useEditorMetaStore.getState().mode
      const newSlide: Slide = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'custom',
        title: generateSlideTitle(newSlideIndex + 1, currentMode),
        content: '',
        elements: [],
        order: newSlideIndex,
        notes: ''
      }

      const newSlides = [...state.slides, newSlide]

      // Create history action
      const historyAction = createHistoryAction(
        'add-slide',
        `Add slide "${newSlide.title}"`,
        () => {
          // Undo: remove the slide
          const currentSlides = get().slides
          const undoSlides = currentSlides.slice(0, -1)
          set({ slides: undoSlides })
          // Switch back to previous slide
          const newCurrentIndex = Math.min(get().currentSlideIndex, undoSlides.length - 1)
          if (newCurrentIndex !== get().currentSlideIndex) {
            get().setCurrentSlide(newCurrentIndex)
          }
        },
        () => {
          // Redo: add the slide back and switch to it
          set({ slides: newSlides })
          get().setCurrentSlide(newSlideIndex)
        }
      )

      // Add the slide first
      set({ slides: newSlides })

      // Then switch to the new slide (this will clear canvas and load empty elements)
      get().setCurrentSlide(newSlideIndex)

      useHistoryStore.getState().pushAction(historyAction)
    },

    deleteSlide: (index) => {
      const state = get()
      if (index < 0 || index >= state.slides.length || state.slides.length <= 1) return

      const deletedSlide = state.slides[index]
      const newSlides = state.slides.filter((_, i) => i !== index)
      const newCurrentIndex = index >= newSlides.length ? newSlides.length - 1 : index

      // Create history action
      const historyAction = createHistoryAction(
        'delete-slide',
        `Delete slide "${deletedSlide.title}"`,
        () => {
          // Undo: restore the slide
          const currentSlides = get().slides
          const restoredSlides = [
            ...currentSlides.slice(0, index),
            deletedSlide,
            ...currentSlides.slice(index)
          ]
          set({ slides: restoredSlides })
          get().setCurrentSlide(index)
        },
        () => {
          // Redo: delete the slide again
          set({ slides: newSlides })
          get().setCurrentSlide(newCurrentIndex)
        }
      )

      // Update slides first
      set({ slides: newSlides })

      // Then switch to the appropriate slide (this will load its elements properly)
      if (newCurrentIndex !== state.currentSlideIndex) {
        get().setCurrentSlide(newCurrentIndex)
      }

      useHistoryStore.getState().pushAction(historyAction)
    },

    duplicateSlide: (index) => {
      const state = get()
      if (index < 0 || index >= state.slides.length) return

      const originalSlide = state.slides[index]
      const duplicatedSlide: Slide = {
        ...originalSlide,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: `${originalSlide.title} (Copy)`,
        order: index + 1
      }

      const newSlides = [
        ...state.slides.slice(0, index + 1),
        duplicatedSlide,
        ...state.slides.slice(index + 1)
      ]

      // Create history action
      const historyAction = createHistoryAction(
        'duplicate-slide',
        `Duplicate slide "${originalSlide.title}"`,
        () => {
          // Undo: remove the duplicated slide
          const currentSlides = get().slides
          const undoSlides = [
            ...currentSlides.slice(0, index + 1),
            ...currentSlides.slice(index + 2)
          ]
          set({ slides: undoSlides })
        },
        () => {
          // Redo: add the duplicated slide back
          set({ slides: newSlides })
          get().setCurrentSlide(index + 1)
        }
      )

      // Add the duplicated slide first
      set({ slides: newSlides })

      // Then switch to the duplicated slide (this will load its elements properly)
      get().setCurrentSlide(index + 1)

      useHistoryStore.getState().pushAction(historyAction)
    },

    moveSlide: (fromIndex, toIndex) => {
      const state = get()
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= state.slides.length ||
        toIndex >= state.slides.length
      )
        return

      const newSlides = [...state.slides]
      const [movedSlide] = newSlides.splice(fromIndex, 1)
      newSlides.splice(toIndex, 0, movedSlide)

      // Create history action
      const historyAction = createHistoryAction(
        'move-slide',
        `Move slide "${movedSlide.title}" from position ${fromIndex + 1} to ${toIndex + 1}`,
        () => {
          // Undo: move back to original position
          const currentSlides = [...get().slides]
          const [slide] = currentSlides.splice(toIndex, 1)
          currentSlides.splice(fromIndex, 0, slide)
          set({ slides: currentSlides })
        },
        () => {
          // Redo: move to new position
          set({ slides: newSlides })
        }
      )

      set({ slides: newSlides })
      useHistoryStore.getState().pushAction(historyAction)
    },

    setCurrentSlide: (index) => {
      const state = get()
      if (index >= 0 && index < state.slides.length && index !== state.currentSlideIndex) {
        // Save current background to the current slide before switching
        const backgroundState = useBackgroundStore.getState()
        let updatedSlides = state.slides

        // Save current slide's background
        const currentSlide = state.slides[state.currentSlideIndex]
        if (currentSlide) {
          const slideBackground =
            backgroundState.backgroundType !== 'none'
              ? {
                  type: backgroundState.backgroundType as 'color' | 'image' | 'video' | 'gradient',
                  value: backgroundState.backgroundImage || backgroundState.backgroundVideo || '',
                  opacity: backgroundState.backgroundOpacity,
                  playbackRate: backgroundState.videoPlaybackRate
                }
              : undefined

          updatedSlides = state.slides.map((slide, i) =>
            i === state.currentSlideIndex ? { ...slide, background: slideBackground } : slide
          )
        }

        // Save current canvas elements to the current slide before switching
        const canvasState = useCanvasStore.getState()

        if (canvasState.elements.length > 0) {
          const currentSlide = updatedSlides[state.currentSlideIndex]
          if (currentSlide) {
            updatedSlides = updatedSlides.map((slide, i) =>
              i === state.currentSlideIndex
                ? {
                    ...slide,
                    elements: canvasState.elements.map((element, elIndex) => ({
                      id: element.id,
                      type: element.type as 'text' | 'image' | 'video' | 'audio' | 'shape',
                      content: element.content,
                      position: element.position,
                      size: element.size,
                      style: {
                        fontFamily: element.style.fontFamily,
                        fontSize: element.style.fontSize,
                        fontWeight: element.style.fontWeight,
                        fontStyle: element.style.fontStyle,
                        textAlign: element.style.textAlign,
                        color: element.style.color,
                        backgroundColor: element.style.backgroundColor,
                        opacity: element.opacity,
                        lineHeight: element.style.lineHeight,
                        textShadow: element.style.textShadow
                      },
                      zIndex: element.zIndex || elIndex
                    }))
                  }
                : slide
            )
          }
        }

        // Update slides and switch to new slide
        set({
          slides: updatedSlides,
          currentSlideIndex: index
        })

        // Load background for the new slide
        const newSlide = updatedSlides[index]
        if (newSlide?.background) {
          const { type, value, opacity, playbackRate } = newSlide.background
          if (type === 'image') {
            backgroundState.setSlideBackground('image', value)
          } else if (type === 'video') {
            backgroundState.setSlideBackground('video', value, value)
          }
          if (opacity !== undefined) {
            backgroundState.setBackgroundOpacity(opacity)
          }
          if (playbackRate !== undefined) {
            backgroundState.setVideoPlaybackRate(playbackRate)
          }
        } else {
          // Clear slide background if new slide has no background
          backgroundState.removeSlideBackground()
        }

        // Load canvas elements for the new slide (use updated slides)
        if (newSlide?.elements) {
          const canvasElements = newSlide.elements
            .filter((el) => el.type === 'text' || el.type === 'image' || el.type === 'video')
            .map((el) => ({
              id: el.id,
              type: el.type as 'text' | 'image' | 'video',
              position: el.position,
              size: el.size,
              content:
                typeof el.content === 'string'
                  ? el.content
                  : typeof el.content === 'object' && 'url' in el.content
                    ? el.content.url
                    : '',
              style: {
                fontSize: el.style?.fontSize || 32,
                fontFamily: el.style?.fontFamily || 'Arial',
                color: el.style?.color || '#FFFFFF',
                backgroundColor: el.style?.backgroundColor || 'transparent',
                textAlign: (el.style?.textAlign as 'left' | 'center' | 'right') || 'center',
                fontWeight: (el.style?.fontWeight as 'normal' | 'bold') || 'bold',
                fontStyle: (el.style?.fontStyle as 'normal' | 'italic') || 'normal',
                textShadow: el.style?.textShadow || '2px 2px 4px rgba(0,0,0,0.8)',
                lineHeight: el.style?.lineHeight || 1.2
              },
              opacity: el.style?.opacity || 1,
              rotation: 0,
              zIndex: el.zIndex
            }))

          useCanvasStore.getState().initialize(canvasElements)
        } else {
          useCanvasStore.getState().initialize([])
        }
      }
    },

    nextSlide: () => {
      const state = get()
      if (state.currentSlideIndex < state.slides.length - 1) {
        get().setCurrentSlide(state.currentSlideIndex + 1)
      }
    },

    previousSlide: () => {
      const state = get()
      if (state.currentSlideIndex > 0) {
        get().setCurrentSlide(state.currentSlideIndex - 1)
      }
    },

    updateSlide: (index, updates) => {
      const state = get()
      if (index < 0 || index >= state.slides.length) return

      const oldSlide = state.slides[index]
      const newSlide = { ...oldSlide, ...updates }
      const newSlides = state.slides.map((slide, i) => (i === index ? newSlide : slide))

      // Create history action
      const historyAction = createHistoryAction(
        'update-slide',
        `Update slide "${oldSlide.title}"`,
        () => {
          // Undo: restore old slide
          const currentSlides = get().slides.map((slide, i) =>
            i === index ? oldSlide : slide
          )
          set({ slides: currentSlides })
        },
        () => {
          // Redo: apply new slide
          set({ slides: newSlides })
        }
      )

      set({ slides: newSlides })
      useHistoryStore.getState().pushAction(historyAction)
    },

    updateSlideTitle: (index, title) => {
      const state = get()
      if (index < 0 || index >= state.slides.length) return

      const oldTitle = state.slides[index].title
      const newSlides = state.slides.map((slide, i) => (i === index ? { ...slide, title } : slide))

      // Create history action
      const historyAction = createHistoryAction(
        'update-slide-title',
        `Change slide title from "${oldTitle}" to "${title}"`,
        () => {
          // Undo: restore old title
          const currentSlides = get().slides.map((slide, i) =>
            i === index ? { ...slide, title: oldTitle } : slide
          )
          set({ slides: currentSlides })
        },
        () => {
          // Redo: apply new title
          set({ slides: newSlides })
        }
      )

      set({ slides: newSlides })
      useHistoryStore.getState().pushAction(historyAction)
    },

    updateSlideContent: (index, content) => {
      const state = get()
      if (index < 0 || index >= state.slides.length) return

      const oldContent = state.slides[index].content
      const newSlides = state.slides.map((slide, i) =>
        i === index ? { ...slide, content } : slide
      )

      // Create history action
      const historyAction = createHistoryAction(
        'update-slide-content',
        `Update slide content`,
        () => {
          // Undo: restore old content
          const currentSlides = get().slides.map((slide, i) =>
            i === index ? { ...slide, content: oldContent } : slide
          )
          set({ slides: currentSlides })
        },
        () => {
          // Redo: apply new content
          set({ slides: newSlides })
        }
      )

      set({ slides: newSlides })
      useHistoryStore.getState().pushAction(historyAction)
    },

    updateSlideNotes: (index, notes) => {
      const state = get()
      if (index < 0 || index >= state.slides.length) return

      const newSlides = state.slides.map((slide, i) => (i === index ? { ...slide, notes } : slide))

      set({ slides: newSlides })
      // Note: Not adding to history for notes as they're often temporary
    },

    updateSlideBackground: (index, background) => {
      const state = get()
      if (index < 0 || index >= state.slides.length) return

      const oldBackground = state.slides[index].background
      const newSlides = state.slides.map((slide, i) =>
        i === index ? { ...slide, background } : slide
      )

      // Create history action
      const historyAction = createHistoryAction(
        'update-slide-background',
        `Update slide background`,
        () => {
          // Undo: restore old background
          const currentSlides = get().slides.map((slide, i) =>
            i === index ? { ...slide, background: oldBackground } : slide
          )
          set({ slides: currentSlides })
        },
        () => {
          // Redo: apply new background
          set({ slides: newSlides })
        }
      )

      set({ slides: newSlides })
      useHistoryStore.getState().pushAction(historyAction)
    },

    startEditingTitle: (index) => {
      const state = get()
      if (index >= 0 && index < state.slides.length) {
        set({
          editingSlideTitle: index,
          tempSlideTitle: state.slides[index].title
        })
      }
    },

    finishEditingTitle: () => {
      const state = get()
      if (state.editingSlideTitle !== null) {
        get().updateSlideTitle(state.editingSlideTitle, state.tempSlideTitle)
        set({
          editingSlideTitle: null,
          tempSlideTitle: ''
        })
      }
    },

    cancelEditingTitle: () => {
      set({
        editingSlideTitle: null,
        tempSlideTitle: ''
      })
    },

    setTempTitle: (tempSlideTitle) => {
      set({ tempSlideTitle })
    },

    autoNumberSlides: () => {
      const state = get()
      const currentMode = useEditorMetaStore.getState().mode
      const oldSlides = [...state.slides]
      const newSlides = state.slides.map((slide, index) => ({
        ...slide,
        title: generateSlideTitle(index + 1, currentMode)
      }))

      // Create history action
      const historyAction = createHistoryAction(
        'auto-number-slides',
        'Auto-number all slides',
        () => {
          // Undo: restore old titles
          set({ slides: oldSlides })
        },
        () => {
          // Redo: apply auto-numbering
          set({ slides: newSlides })
        }
      )

      set({ slides: newSlides })
      useHistoryStore.getState().pushAction(historyAction)
    },

    clearAllSlides: () => {
      const state = get()
      const oldSlides = [...state.slides]

      // Create history action
      const historyAction = createHistoryAction(
        'clear-all-slides',
        'Clear all slides',
        () => {
          // Undo: restore all slides
          set({ slides: oldSlides })
        },
        () => {
          // Redo: clear slides
          set({ slides: [], currentSlideIndex: 0 })
        }
      )

      set({ slides: [], currentSlideIndex: 0 })
      useHistoryStore.getState().pushAction(historyAction)
    },

    initialize: (slides = []) => {
      if (slides.length === 0) {
        // Create initial slide
        const currentMode = useEditorMetaStore.getState().mode
        const initialSlide: Slide = {
          id: Date.now().toString(),
          type: 'custom',
          title: generateSlideTitle(1, currentMode),
          content: '',
          elements: [],
          order: 0,
          notes: ''
        }
        slides = [initialSlide]
      }

      set({
        slides,
        currentSlideIndex: 0,
        editingSlideTitle: null,
        tempSlideTitle: ''
      })
    },

    reset: () => {
      set(initialState)
    }
  }))
)

// Selectors for performance optimization
export const useCurrentSlide = (): Slide | null =>
  useSlidesStore((state) => state.slides[state.currentSlideIndex] || null)

export const useSlidesInfo = (): {
  totalSlides: number
  currentIndex: number
  hasNext: boolean
  hasPrevious: boolean
} =>
  useSlidesStore((state) => ({
    totalSlides: state.slides.length,
    currentIndex: state.currentSlideIndex,
    hasNext: state.currentSlideIndex < state.slides.length - 1,
    hasPrevious: state.currentSlideIndex > 0
  }))

export const useSlideEditingState = (): {
  editingSlideTitle: number | null
  tempSlideTitle: string
} =>
  useSlidesStore((state) => ({
    editingSlideTitle: state.editingSlideTitle,
    tempSlideTitle: state.tempSlideTitle
  }))
