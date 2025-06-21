import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { useHistoryStore, createHistoryAction } from './editor-history'

interface BackgroundState {
  // Current slide background
  backgroundType: 'none' | 'image' | 'video'
  backgroundImage: string | null
  backgroundVideo: string | null
  backgroundVideoBlob: string | null
  backgroundOpacity: number
  videoPlaybackRate: number
  videoLoop: boolean
  videoMuted: boolean

  // Global background (applies to all slides)
  globalBackgroundType: 'none' | 'image' | 'video'
  globalBackgroundImage: string | null
  globalBackgroundVideo: string | null
  globalBackgroundVideoBlob: string | null
  globalBackgroundOpacity: number
  globalVideoPlaybackRate: number
  globalVideoLoop: boolean
  globalVideoMuted: boolean

  // Background positioning
  backgroundSize: 'cover' | 'contain' | 'fill' | 'none'
  backgroundPosition: 'center' | 'top' | 'bottom' | 'left' | 'right'

  // UI state
  isBackgroundPanelOpen: boolean
}

interface BackgroundActions {
  // Slide background management
  setSlideBackground: (type: 'image' | 'video', source: string, blob?: string) => void
  removeSlideBackground: () => void
  setBackgroundOpacity: (opacity: number) => void
  setVideoPlaybackRate: (rate: number) => void
  setVideoLoop: (loop: boolean) => void
  setVideoMuted: (muted: boolean) => void

  // Global background management
  setGlobalBackground: (type: 'image' | 'video', source: string, blob?: string) => void
  removeGlobalBackground: () => void
  setGlobalBackgroundOpacity: (opacity: number) => void
  setGlobalVideoPlaybackRate: (rate: number) => void
  setGlobalVideoLoop: (loop: boolean) => void
  setGlobalVideoMuted: (muted: boolean) => void

  // Background styling
  setBackgroundSize: (size: BackgroundState['backgroundSize']) => void
  setBackgroundPosition: (position: BackgroundState['backgroundPosition']) => void

  // UI actions
  toggleBackgroundPanel: () => void
  setBackgroundPanelOpen: (open: boolean) => void

  // Initialization and cleanup
  initialize: () => void
  cleanup: () => void
  reset: () => void
}

type BackgroundStore = BackgroundState & BackgroundActions

const initialState: BackgroundState = {
  backgroundType: 'none',
  backgroundImage: null,
  backgroundVideo: null,
  backgroundVideoBlob: null,
  backgroundOpacity: 1,
  videoPlaybackRate: 1,
  videoLoop: true,
  videoMuted: true,

  globalBackgroundType: 'none',
  globalBackgroundImage: null,
  globalBackgroundVideo: null,
  globalBackgroundVideoBlob: null,
  globalBackgroundOpacity: 1,
  globalVideoPlaybackRate: 1,
  globalVideoLoop: true,
  globalVideoMuted: true,

  backgroundSize: 'cover',
  backgroundPosition: 'center',

  isBackgroundPanelOpen: false
}

export const useBackgroundStore = create<BackgroundStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    setSlideBackground: (type, source, blob) => {
      const state = get()
      const oldState = {
        type: state.backgroundType,
        image: state.backgroundImage,
        video: state.backgroundVideo,
        blob: state.backgroundVideoBlob
      }

      // Clean up old blob URL if exists
      if (state.backgroundVideoBlob && state.backgroundVideoBlob !== blob) {
        URL.revokeObjectURL(state.backgroundVideoBlob)
      }

      const newState = {
        backgroundType: type,
        backgroundImage: type === 'image' ? source : null,
        backgroundVideo: type === 'video' ? source : null,
        backgroundVideoBlob: type === 'video' ? blob || null : null
      }

      // Update the current slide's background data
      // Import is done dynamically to avoid circular dependency
      import('./editor-slides')
        .then(({ useSlidesStore }) => {
          const slidesState = useSlidesStore.getState()
          const currentIndex = slidesState.currentSlideIndex
          const backgroundData = {
            type: type as 'color' | 'image' | 'video' | 'gradient',
            value: source,
            opacity: state.backgroundOpacity,
            playbackRate: state.videoPlaybackRate
          }
          slidesState.updateSlideBackground(currentIndex, backgroundData)
        })
        .catch(console.error)

      // Create history action
      const historyAction = createHistoryAction(
        'set-slide-background',
        `Set slide background (${type})`,
        () => {
          // Undo: restore old background
          set({
            backgroundType: oldState.type,
            backgroundImage: oldState.image,
            backgroundVideo: oldState.video,
            backgroundVideoBlob: oldState.blob
          })
        },
        () => {
          // Redo: apply new background
          set(newState)
        }
      )

      set(newState)
      useHistoryStore.getState().pushAction(historyAction)
    },

    removeSlideBackground: () => {
      const state = get()
      const oldState = {
        type: state.backgroundType,
        image: state.backgroundImage,
        video: state.backgroundVideo,
        blob: state.backgroundVideoBlob
      }

      // Clean up blob URL
      if (state.backgroundVideoBlob) {
        URL.revokeObjectURL(state.backgroundVideoBlob)
      }

      // Update the current slide's background data
      // Import is done dynamically to avoid circular dependency
      import('./editor-slides')
        .then(({ useSlidesStore }) => {
          const slidesState = useSlidesStore.getState()
          const currentIndex = slidesState.currentSlideIndex
          slidesState.updateSlideBackground(currentIndex, undefined)
        })
        .catch(console.error)

      // Create history action
      const historyAction = createHistoryAction(
        'remove-slide-background',
        'Remove slide background',
        () => {
          // Undo: restore background
          set({
            backgroundType: oldState.type,
            backgroundImage: oldState.image,
            backgroundVideo: oldState.video,
            backgroundVideoBlob: oldState.blob
          })
        },
        () => {
          // Redo: remove background
          set({
            backgroundType: 'none',
            backgroundImage: null,
            backgroundVideo: null,
            backgroundVideoBlob: null
          })
        }
      )

      set({
        backgroundType: 'none',
        backgroundImage: null,
        backgroundVideo: null,
        backgroundVideoBlob: null
      })

      useHistoryStore.getState().pushAction(historyAction)
    },

    setBackgroundOpacity: (opacity) => {
      const oldOpacity = get().backgroundOpacity

      // Create history action
      const historyAction = createHistoryAction(
        'set-background-opacity',
        `Set background opacity to ${Math.round(opacity * 100)}%`,
        () => set({ backgroundOpacity: oldOpacity }),
        () => set({ backgroundOpacity: opacity })
      )

      set({ backgroundOpacity: opacity })
      useHistoryStore.getState().pushAction(historyAction)
    },

    setVideoPlaybackRate: (rate) => {
      set({ videoPlaybackRate: rate })
    },

    setVideoLoop: (loop) => {
      set({ videoLoop: loop })
    },

    setVideoMuted: (muted) => {
      set({ videoMuted: muted })
    },

    setGlobalBackground: (type, source, blob) => {
      const state = get()
      const oldState = {
        type: state.globalBackgroundType,
        image: state.globalBackgroundImage,
        video: state.globalBackgroundVideo,
        blob: state.globalBackgroundVideoBlob
      }

      // Clean up old blob URL if exists
      if (state.globalBackgroundVideoBlob && state.globalBackgroundVideoBlob !== blob) {
        URL.revokeObjectURL(state.globalBackgroundVideoBlob)
      }

      const newState = {
        globalBackgroundType: type,
        globalBackgroundImage: type === 'image' ? source : null,
        globalBackgroundVideo: type === 'video' ? source : null,
        globalBackgroundVideoBlob: type === 'video' ? blob || null : null
      }

      // Create history action
      const historyAction = createHistoryAction(
        'set-global-background',
        `Set global background (${type})`,
        () => {
          // Undo: restore old background
          set({
            globalBackgroundType: oldState.type,
            globalBackgroundImage: oldState.image,
            globalBackgroundVideo: oldState.video,
            globalBackgroundVideoBlob: oldState.blob
          })
        },
        () => {
          // Redo: apply new background
          set(newState)
        }
      )

      set(newState)
      useHistoryStore.getState().pushAction(historyAction)
    },

    removeGlobalBackground: () => {
      const state = get()
      const oldState = {
        type: state.globalBackgroundType,
        image: state.globalBackgroundImage,
        video: state.globalBackgroundVideo,
        blob: state.globalBackgroundVideoBlob
      }

      // Clean up blob URL
      if (state.globalBackgroundVideoBlob) {
        URL.revokeObjectURL(state.globalBackgroundVideoBlob)
      }

      // Create history action
      const historyAction = createHistoryAction(
        'remove-global-background',
        'Remove global background',
        () => {
          // Undo: restore background
          set({
            globalBackgroundType: oldState.type,
            globalBackgroundImage: oldState.image,
            globalBackgroundVideo: oldState.video,
            globalBackgroundVideoBlob: oldState.blob
          })
        },
        () => {
          // Redo: remove background
          set({
            globalBackgroundType: 'none',
            globalBackgroundImage: null,
            globalBackgroundVideo: null,
            globalBackgroundVideoBlob: null
          })
        }
      )

      set({
        globalBackgroundType: 'none',
        globalBackgroundImage: null,
        globalBackgroundVideo: null,
        globalBackgroundVideoBlob: null
      })

      useHistoryStore.getState().pushAction(historyAction)
    },

    setGlobalBackgroundOpacity: (opacity) => {
      const oldOpacity = get().globalBackgroundOpacity

      // Create history action
      const historyAction = createHistoryAction(
        'set-global-background-opacity',
        `Set global background opacity to ${Math.round(opacity * 100)}%`,
        () => set({ globalBackgroundOpacity: oldOpacity }),
        () => set({ globalBackgroundOpacity: opacity })
      )

      set({ globalBackgroundOpacity: opacity })
      useHistoryStore.getState().pushAction(historyAction)
    },

    setGlobalVideoPlaybackRate: (rate) => {
      set({ globalVideoPlaybackRate: rate })
    },

    setGlobalVideoLoop: (loop) => {
      set({ globalVideoLoop: loop })
    },

    setGlobalVideoMuted: (muted) => {
      set({ globalVideoMuted: muted })
    },

    setBackgroundSize: (size) => {
      const oldSize = get().backgroundSize

      // Create history action
      const historyAction = createHistoryAction(
        'set-background-size',
        `Set background size to ${size}`,
        () => set({ backgroundSize: oldSize }),
        () => set({ backgroundSize: size })
      )

      set({ backgroundSize: size })
      useHistoryStore.getState().pushAction(historyAction)
    },

    setBackgroundPosition: (position) => {
      const oldPosition = get().backgroundPosition

      // Create history action
      const historyAction = createHistoryAction(
        'set-background-position',
        `Set background position to ${position}`,
        () => set({ backgroundPosition: oldPosition }),
        () => set({ backgroundPosition: position })
      )

      set({ backgroundPosition: position })
      useHistoryStore.getState().pushAction(historyAction)
    },

    toggleBackgroundPanel: () => {
      set((state) => ({ isBackgroundPanelOpen: !state.isBackgroundPanelOpen }))
    },

    setBackgroundPanelOpen: (open) => {
      set({ isBackgroundPanelOpen: open })
    },

    initialize: () => {
      // Reset to initial state
      set(initialState)
    },

    cleanup: () => {
      const state = get()

      // Clean up blob URLs
      if (state.backgroundVideoBlob) {
        URL.revokeObjectURL(state.backgroundVideoBlob)
      }
      if (state.globalBackgroundVideoBlob) {
        URL.revokeObjectURL(state.globalBackgroundVideoBlob)
      }
    },

    reset: () => {
      get().cleanup()
      set(initialState)
    }
  }))
)

// Individual selectors to avoid object creation issues
export const useSlideBackgroundType = () => useBackgroundStore((state) => state.backgroundType)
export const useSlideBackgroundImage = () => useBackgroundStore((state) => state.backgroundImage)
export const useSlideBackgroundVideo = () => useBackgroundStore((state) => state.backgroundVideo)
export const useSlideBackgroundVideoBlob = () =>
  useBackgroundStore((state) => state.backgroundVideoBlob)
export const useSlideBackgroundOpacity = () =>
  useBackgroundStore((state) => state.backgroundOpacity)
export const useSlideVideoPlaybackRate = () =>
  useBackgroundStore((state) => state.videoPlaybackRate)
export const useSlideVideoLoop = () => useBackgroundStore((state) => state.videoLoop)
export const useSlideVideoMuted = () => useBackgroundStore((state) => state.videoMuted)

export const useGlobalBackgroundType = () =>
  useBackgroundStore((state) => state.globalBackgroundType)
export const useGlobalBackgroundImage = () =>
  useBackgroundStore((state) => state.globalBackgroundImage)
export const useGlobalBackgroundVideo = () =>
  useBackgroundStore((state) => state.globalBackgroundVideo)
export const useGlobalBackgroundVideoBlob = () =>
  useBackgroundStore((state) => state.globalBackgroundVideoBlob)
export const useGlobalBackgroundOpacity = () =>
  useBackgroundStore((state) => state.globalBackgroundOpacity)
export const useGlobalVideoPlaybackRate = () =>
  useBackgroundStore((state) => state.globalVideoPlaybackRate)
export const useGlobalVideoLoop = () => useBackgroundStore((state) => state.globalVideoLoop)
export const useGlobalVideoMuted = () => useBackgroundStore((state) => state.globalVideoMuted)

export const useBackgroundSize = () => useBackgroundStore((state) => state.backgroundSize)
export const useBackgroundPosition = () => useBackgroundStore((state) => state.backgroundPosition)
export const useBackgroundPanelOpen = () =>
  useBackgroundStore((state) => state.isBackgroundPanelOpen)
