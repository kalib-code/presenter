import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { db } from '@renderer/lib/database'
import type { Presentation, PresentationSlide } from '@renderer/types/database'

interface PresentationState {
  presentations: Presentation[]
  currentPresentation: Presentation | null
  isLoading: boolean
  error: string | null
}

interface PresentationActions {
  // CRUD operations
  createPresentation: (name: string, type?: Presentation['type']) => Promise<Presentation>
  updatePresentation: (id: string, data: Partial<Presentation>) => Promise<void>
  deletePresentation: (id: string) => Promise<void>
  getPresentation: (id: string) => Promise<Presentation | null>

  // List operations
  loadPresentations: () => Promise<void>
  searchPresentations: (query: string) => Promise<void>

  // State management
  setCurrentPresentation: (presentation: Presentation | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // Presentation-specific operations
  addSlideToPresentation: (
    presentationId: string,
    slide: Omit<PresentationSlide, 'id'>
  ) => Promise<void>
  updateSlideInPresentation: (
    presentationId: string,
    slideId: string,
    slide: Partial<PresentationSlide>
  ) => Promise<void>
  deleteSlideFromPresentation: (presentationId: string, slideId: string) => Promise<void>
}

type PresentationStore = PresentationState & PresentationActions

export const usePresentationStore = create<PresentationStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    presentations: [],
    currentPresentation: null,
    isLoading: false,
    error: null,

    // CRUD operations
    createPresentation: async (name: string, type: Presentation['type'] = 'custom') => {
      try {
        set({ isLoading: true, error: null })

        const presentationData = {
          name,
          type,
          slides: [],
          tags: [],
          isPublic: true,
          createdBy: 'user'
        }

        const newPresentation = await db.presentations.create(presentationData)

        set((state) => ({
          presentations: [...state.presentations, newPresentation],
          isLoading: false
        }))

        return newPresentation
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to create presentation'
        set({ error: errorMessage, isLoading: false })
        console.error('Error creating presentation:', error)
        throw error
      }
    },

    updatePresentation: async (id: string, data: Partial<Presentation>) => {
      try {
        set({ isLoading: true, error: null })

        const updatedPresentation = await db.presentations.update(id, data)

        set((state) => ({
          presentations: state.presentations.map((p) => (p.id === id ? updatedPresentation : p)),
          currentPresentation:
            state.currentPresentation?.id === id ? updatedPresentation : state.currentPresentation,
          isLoading: false
        }))

        console.log('✅ Presentation updated successfully:', { id, name: data.name })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to update presentation'
        set({ error: errorMessage, isLoading: false })
        console.error('Error updating presentation:', error)
        throw error
      }
    },

    deletePresentation: async (id: string) => {
      try {
        set({ isLoading: true, error: null })

        await db.presentations.delete(id)

        set((state) => ({
          presentations: state.presentations.filter((p) => p.id !== id),
          currentPresentation:
            state.currentPresentation?.id === id ? null : state.currentPresentation,
          isLoading: false
        }))

        console.log('✅ Presentation deleted successfully:', { id })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to delete presentation'
        set({ error: errorMessage, isLoading: false })
        console.error('Error deleting presentation:', error)
        throw error
      }
    },

    getPresentation: async (id: string) => {
      try {
        set({ isLoading: true, error: null })

        const presentation = await db.presentations.get(id)

        set({ isLoading: false })
        return presentation
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to get presentation'
        set({ error: errorMessage, isLoading: false })
        console.error('Error getting presentation:', error)
        throw error
      }
    },

    // List operations
    loadPresentations: async () => {
      try {
        set({ isLoading: true, error: null })

        const result = await db.presentations.list()

        set({
          presentations: result.data,
          isLoading: false
        })

        console.log('✅ Presentations loaded:', result.data.length)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load presentations'
        set({ error: errorMessage, isLoading: false })
        console.error('Error loading presentations:', error)
        throw error
      }
    },

    searchPresentations: async (query: string) => {
      try {
        set({ isLoading: true, error: null })

        const result = await db.presentations.search(query)

        set({
          presentations: result.data,
          isLoading: false
        })

        console.log('✅ Presentations searched:', { query, count: result.data.length })
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to search presentations'
        set({ error: errorMessage, isLoading: false })
        console.error('Error searching presentations:', error)
        throw error
      }
    },

    // State management
    setCurrentPresentation: (presentation) => {
      set({ currentPresentation: presentation })
    },

    setLoading: (loading) => {
      set({ isLoading: loading })
    },

    setError: (error) => {
      set({ error })
    },

    // Presentation-specific operations
    addSlideToPresentation: async (
      presentationId: string,
      slide: Omit<PresentationSlide, 'id'>
    ) => {
      try {
        const presentation = await get().getPresentation(presentationId)
        if (!presentation) throw new Error('Presentation not found')

        const newSlide: PresentationSlide = {
          ...slide,
          id: `slide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }

        const updatedSlides = [...presentation.slides, newSlide]
        await get().updatePresentation(presentationId, { slides: updatedSlides })
      } catch (error) {
        console.error('Error adding slide to presentation:', error)
        throw error
      }
    },

    updateSlideInPresentation: async (
      presentationId: string,
      slideId: string,
      slideData: Partial<PresentationSlide>
    ) => {
      try {
        const presentation = await get().getPresentation(presentationId)
        if (!presentation) throw new Error('Presentation not found')

        const updatedSlides = presentation.slides.map((slide) =>
          slide.id === slideId ? { ...slide, ...slideData } : slide
        )

        await get().updatePresentation(presentationId, { slides: updatedSlides })
      } catch (error) {
        console.error('Error updating slide in presentation:', error)
        throw error
      }
    },

    deleteSlideFromPresentation: async (presentationId: string, slideId: string) => {
      try {
        const presentation = await get().getPresentation(presentationId)
        if (!presentation) throw new Error('Presentation not found')

        const updatedSlides = presentation.slides.filter((slide) => slide.id !== slideId)
        await get().updatePresentation(presentationId, { slides: updatedSlides })
      } catch (error) {
        console.error('Error deleting slide from presentation:', error)
        throw error
      }
    }
  }))
)

// Selectors for performance optimization
export const usePresentationList = () =>
  usePresentationStore((state) => ({
    presentations: state.presentations,
    isLoading: state.isLoading,
    error: state.error
  }))

export const useCurrentPresentation = () =>
  usePresentationStore((state) => state.currentPresentation)
