import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { useSongStore } from './song'
import { useEditorMetaStore } from './editor-meta'
import { useSlidesStore } from './editor-slides'
import { useCanvasStore } from './editor-canvas'
import { useHistoryStore } from './editor-history'
import { useBackgroundStore } from './editor-background'
import type { Song } from '@renderer/types/database'

interface PersistenceState {
  autoSaveEnabled: boolean
  autoSaveInterval: number // in milliseconds
  lastAutoSave?: Date
  isSaving: boolean
  saveError?: string
}

interface PersistenceActions {
  // Auto-save management
  enableAutoSave: (interval?: number) => void
  disableAutoSave: () => void

  // Manual save/load
  saveEditor: () => Promise<void>
  loadEditor: (songId: string) => Promise<void>

  // State management
  setSaving: (saving: boolean) => void
  setSaveError: (error?: string) => void

  // Initialization
  initialize: () => void
  cleanup: () => void
}

type PersistenceStore = PersistenceState &
  PersistenceActions & {
    _unsubscribers?: Array<() => void>
  }

const initialState: PersistenceState = {
  autoSaveEnabled: true,
  autoSaveInterval: 30000, // 30 seconds
  lastAutoSave: undefined,
  isSaving: false,
  saveError: undefined
}

let autoSaveTimer: NodeJS.Timeout | null = null

export const usePersistenceStore = create<PersistenceStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    enableAutoSave: (interval = 30000) => {
      // Clear existing timer
      if (autoSaveTimer) {
        clearInterval(autoSaveTimer)
      }

      // Set up new timer
      autoSaveTimer = setInterval(async () => {
        const metaState = useEditorMetaStore.getState()
        const currentState = get()
        if (metaState.hasUnsavedChanges && !currentState.isSaving) {
          console.log('Auto-saving editor...')
          try {
            await get().saveEditor()
          } catch (error) {
            console.error('Auto-save failed:', error)
          }
        }
      }, interval)

      set({ autoSaveEnabled: true, autoSaveInterval: interval })
    },

    disableAutoSave: () => {
      if (autoSaveTimer) {
        clearInterval(autoSaveTimer)
        autoSaveTimer = null
      }
      set({ autoSaveEnabled: false })
    },

    saveEditor: async () => {
      const state = get()
      if (state.isSaving) return

      try {
        set({ isSaving: true, saveError: undefined })

        const metaState = useEditorMetaStore.getState()
        const slidesState = useSlidesStore.getState()
        const canvasState = useCanvasStore.getState()
        const backgroundState = useBackgroundStore.getState()

        // Ensure current canvas elements are synced to the current slide before saving
        if (canvasState.elements.length > 0) {
          const currentSlide = slidesState.slides[slidesState.currentSlideIndex]
          if (currentSlide) {
            const updatedSlides = slidesState.slides.map((slide, i) =>
              i === slidesState.currentSlideIndex
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
            // Update the slides store with synced elements
            useSlidesStore.getState().setSlides(updatedSlides)
          }
        }

        // Get the updated slides state
        const updatedSlidesState = useSlidesStore.getState()

        // Prepare song data
        const songData: Partial<Song> = {
          name: metaState.title || 'Untitled Song',
          artist: metaState.artist || '',
          slides: updatedSlidesState.slides.map((slide) => ({
            ...slide,
            elements: slide.elements || []
          })),
          lyrics: updatedSlidesState.slides.map((slide) => slide.content).join('\n\n'),
          tags: [
            // Store background settings as a special tag for now
            `bg:${JSON.stringify({
              slide: {
                type: backgroundState.backgroundType,
                image: backgroundState.backgroundImage,
                video: backgroundState.backgroundVideo,
                opacity: backgroundState.backgroundOpacity,
                videoSettings: {
                  playbackRate: backgroundState.videoPlaybackRate,
                  loop: backgroundState.videoLoop,
                  muted: backgroundState.videoMuted
                }
              },
              global: {
                type: backgroundState.globalBackgroundType,
                image: backgroundState.globalBackgroundImage,
                video: backgroundState.globalBackgroundVideo,
                opacity: backgroundState.globalBackgroundOpacity,
                videoSettings: {
                  playbackRate: backgroundState.globalVideoPlaybackRate,
                  loop: backgroundState.globalVideoLoop,
                  muted: backgroundState.globalVideoMuted
                }
              },
              styling: {
                size: backgroundState.backgroundSize,
                position: backgroundState.backgroundPosition
              }
            })}`
          ],
          isPublic: true,
          createdBy: 'user'
        }

        const songStore = useSongStore.getState()

        if (metaState.action === 'create') {
          // Create new song
          const newSong = await songStore.createSong(songData.name!)
          await songStore.updateSong(newSong.id, songData)

          // Update meta store with new song ID
          useEditorMetaStore.getState().setItemId(newSong.id)
          useEditorMetaStore.getState().setAction('edit')
        } else if (metaState.itemId) {
          // Update existing song
          await songStore.updateSong(metaState.itemId, songData)
        }

        // Mark as saved
        useEditorMetaStore.getState().markSaved()
        set({ lastAutoSave: new Date() })

        console.log('✅ Editor saved successfully:', {
          songId: metaState.itemId,
          title: songData.name,
          slidesCount: slidesState.slides.length,
          elementsCount: canvasState.elements.length,
          hasBackground:
            backgroundState.backgroundType !== 'none' ||
            backgroundState.globalBackgroundType !== 'none'
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to save'
        set({ saveError: errorMessage })
        console.error('Save failed:', error)
        throw error
      } finally {
        set({ isSaving: false })
      }
    },

    loadEditor: async (songId: string) => {
      try {
        set({ isSaving: true, saveError: undefined })

        const songStore = useSongStore.getState()
        const song = await songStore.getSong(songId)

        if (!song) {
          throw new Error('Song not found')
        }

        // Update meta store
        const metaStore = useEditorMetaStore.getState()
        metaStore.initialize({
          mode: 'song',
          action: 'edit',
          itemId: songId
        })
        metaStore.setTitle(song.name)
        metaStore.setArtist(song.artist || '')

        // Update slides store
        const slidesStore = useSlidesStore.getState()
        slidesStore.initialize(song.slides || [])

        // Load background settings
        const backgroundTag = song.tags?.find((tag) => tag.startsWith('bg:'))
        if (backgroundTag) {
          try {
            const backgroundData = JSON.parse(backgroundTag.substring(3))
            const backgroundStore = useBackgroundStore.getState()

            // Restore slide background
            if (backgroundData.slide && backgroundData.slide.type !== 'none') {
              const source = backgroundData.slide.image || backgroundData.slide.video
              if (source) {
                backgroundStore.setSlideBackground(backgroundData.slide.type, source)
                backgroundStore.setBackgroundOpacity(backgroundData.slide.opacity || 1)
                if (backgroundData.slide.videoSettings) {
                  backgroundStore.setVideoPlaybackRate(
                    backgroundData.slide.videoSettings.playbackRate || 1
                  )
                  backgroundStore.setVideoLoop(backgroundData.slide.videoSettings.loop ?? true)
                  backgroundStore.setVideoMuted(backgroundData.slide.videoSettings.muted ?? true)
                }
              }
            }

            // Restore global background
            if (backgroundData.global && backgroundData.global.type !== 'none') {
              const source = backgroundData.global.image || backgroundData.global.video
              if (source) {
                backgroundStore.setGlobalBackground(backgroundData.global.type, source)
                backgroundStore.setGlobalBackgroundOpacity(backgroundData.global.opacity || 1)
                if (backgroundData.global.videoSettings) {
                  backgroundStore.setGlobalVideoPlaybackRate(
                    backgroundData.global.videoSettings.playbackRate || 1
                  )
                  backgroundStore.setGlobalVideoLoop(
                    backgroundData.global.videoSettings.loop ?? true
                  )
                  backgroundStore.setGlobalVideoMuted(
                    backgroundData.global.videoSettings.muted ?? true
                  )
                }
              }
            }

            // Restore styling
            if (backgroundData.styling) {
              backgroundStore.setBackgroundSize(backgroundData.styling.size || 'cover')
              backgroundStore.setBackgroundPosition(backgroundData.styling.position || 'center')
            }
          } catch (error) {
            console.warn('Failed to parse background settings:', error)
          }
        }

        // Load canvas elements for current slide
        const currentSlide = song.slides?.[0]
        if (currentSlide?.elements) {
          const canvasElements = currentSlide.elements
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

        // Clear history since we're loading fresh
        useHistoryStore.getState().clear()

        // Mark as saved (no unsaved changes)
        metaStore.markSaved()

        console.log('✅ Editor loaded successfully:', {
          songId: song.id,
          title: song.name,
          artist: song.artist,
          slidesCount: song.slides?.length || 0,
          hasBackgroundSettings: song.tags?.some((tag) => tag.startsWith('bg:')) || false
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load'
        set({ saveError: errorMessage })
        console.error('Load failed:', error)
        throw error
      } finally {
        set({ isSaving: false })
      }
    },

    setSaving: (isSaving) => {
      set({ isSaving })
    },

    setSaveError: (saveError) => {
      set({ saveError })
    },

    initialize: () => {
      // Set up auto-save if enabled
      const state = get()
      if (state.autoSaveEnabled) {
        get().enableAutoSave(state.autoSaveInterval)
      }

      // Subscribe to changes that should trigger unsaved state
      const unsubscribeMeta = useEditorMetaStore.subscribe(
        (state) => state.title + state.artist,
        () => {
          useEditorMetaStore.getState().markUnsaved()
        }
      )

      const unsubscribeSlides = useSlidesStore.subscribe(
        (state) => state.slides,
        () => {
          useEditorMetaStore.getState().markUnsaved()
        }
      )

      const unsubscribeCanvas = useCanvasStore.subscribe(
        (state) => state.elements,
        () => {
          useEditorMetaStore.getState().markUnsaved()
        }
      )

      const unsubscribeBackground = useBackgroundStore.subscribe(
        (state) => ({
          slideType: state.backgroundType,
          slideImage: state.backgroundImage,
          slideVideo: state.backgroundVideo,
          slideOpacity: state.backgroundOpacity,
          globalType: state.globalBackgroundType,
          globalImage: state.globalBackgroundImage,
          globalVideo: state.globalBackgroundVideo,
          globalOpacity: state.globalBackgroundOpacity,
          size: state.backgroundSize,
          position: state.backgroundPosition
        }),
        () => {
          useEditorMetaStore.getState().markUnsaved()
        }
      )

      // Store unsubscribe functions for cleanup
      ;(get() as PersistenceStore)._unsubscribers = [
        unsubscribeMeta,
        unsubscribeSlides,
        unsubscribeCanvas,
        unsubscribeBackground
      ]
    },

    cleanup: () => {
      // Disable auto-save
      get().disableAutoSave()

      // Clean up subscriptions
      const unsubscribers = (get() as PersistenceStore)._unsubscribers || []
      unsubscribers.forEach((unsubscribe: () => void) => unsubscribe())
    }
  }))
)

// Utility hook for save status
export const useSaveStatus = (): {
  isSaving: boolean
  hasUnsavedChanges: boolean
  lastSaved?: Date
  saveError?: string
  autoSaveEnabled: boolean
} => {
  const { isSaving, lastAutoSave, saveError, autoSaveEnabled } = usePersistenceStore()
  const { hasUnsavedChanges, lastSaved } = useEditorMetaStore()

  return {
    isSaving,
    hasUnsavedChanges,
    lastSaved: lastSaved || lastAutoSave,
    saveError,
    autoSaveEnabled
  }
}
