import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { useSongStore } from './song'
import { usePresentationStore } from './presentation'
import { useEditorMetaStore } from './editor-meta'
import { useSlidesStore } from './editor-slides'
import { useCanvasStore } from './editor-canvas'
import { useHistoryStore } from './editor-history'
import { useBackgroundStore } from './editor-background'
import { useSettingsStore } from './settings'
import type { Song, Presentation, Background } from '@renderer/types/database'
import { migrateSong, migratePresentation, validateMigration } from '@renderer/utils/migration'

interface PersistenceState {
  autoSaveEnabled: boolean
  autoSaveInterval: number // in milliseconds
  lastAutoSave?: Date
  isSaving: boolean
  saveError?: string
  migrationEnabled: boolean
  useLegacyFormat: boolean
}

interface PersistenceActions {
  // Auto-save management
  enableAutoSave: (interval?: number) => void
  disableAutoSave: () => void

  // Manual save/load
  saveEditor: () => Promise<void>
  loadEditor: (itemId: string) => Promise<void>

  // State management
  setSaving: (saving: boolean) => void
  setSaveError: (error?: string) => void

  // Migration management
  enableMigration: () => void
  disableMigration: () => void
  setLegacyFormat: (useLegacy: boolean) => void

  // Initialization
  initialize: () => void
  cleanup: () => void
}

type PersistenceStore = PersistenceState &
  PersistenceActions & {
    _unsubscribers?: Array<() => void>
  }

const initialState: PersistenceState = {
  autoSaveEnabled: true, // Default value, will be synced from settings store later
  autoSaveInterval: 30000, // Default value, will be synced from settings store later
  lastAutoSave: undefined,
  isSaving: false,
  saveError: undefined,
  migrationEnabled: true, // Enable by default for gradual migration
  useLegacyFormat: false // Use optimized format by default
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
      console.log('🎛️ [PERSISTENCE] AutoSave enabled in persistence store with interval:', interval)

      // Update settings store
      useSettingsStore.getState().setAutoSave(true)
      if (interval !== useSettingsStore.getState().app.autoSaveInterval) {
        useSettingsStore.getState().setAutoSaveInterval(interval)
      }
    },

    disableAutoSave: () => {
      if (autoSaveTimer) {
        clearInterval(autoSaveTimer)
        autoSaveTimer = null
      }
      set({ autoSaveEnabled: false })
      console.log('🎛️ [PERSISTENCE] AutoSave disabled in persistence store')

      // Update settings store
      useSettingsStore.getState().setAutoSave(false)
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

        // Prepare global background from background store
        const globalBackground: Background | undefined =
          backgroundState.globalBackgroundType !== 'none'
            ? {
                type: backgroundState.globalBackgroundType as
                  | 'color'
                  | 'image'
                  | 'video'
                  | 'gradient',
                value:
                  backgroundState.globalBackgroundImage ||
                  backgroundState.globalBackgroundVideo ||
                  '',
                opacity: backgroundState.globalBackgroundOpacity,
                playbackRate:
                  backgroundState.globalBackgroundType === 'video'
                    ? backgroundState.globalVideoPlaybackRate
                    : undefined,
                size: backgroundState.backgroundSize,
                position: backgroundState.backgroundPosition
              }
            : undefined

        if (metaState.mode === 'song') {
          // Save as song
          const songData: Partial<Song> = {
            name: metaState.title || 'Untitled Song',
            artist: metaState.artist || '',
            slides: updatedSlidesState.slides.map((slide, index) => {
              // For the current slide, use the background store state
              // For other slides, preserve their existing backgrounds
              const isCurrentSlide = index === updatedSlidesState.currentSlideIndex
              const slideBackground: Background | undefined = isCurrentSlide
                ? backgroundState.backgroundType !== 'none'
                  ? {
                      type: backgroundState.backgroundType as
                        | 'color'
                        | 'image'
                        | 'video'
                        | 'gradient',
                      value:
                        backgroundState.backgroundImage || backgroundState.backgroundVideo || '',
                      opacity: backgroundState.backgroundOpacity,
                      playbackRate:
                        backgroundState.backgroundType === 'video'
                          ? backgroundState.videoPlaybackRate
                          : undefined,
                      size: backgroundState.backgroundSize,
                      position: backgroundState.backgroundPosition
                    }
                  : undefined
                : slide.background // Keep existing background for other slides

              return {
                ...slide,
                elements: slide.elements || [],
                background: slideBackground
              }
            }),
            lyrics: updatedSlidesState.slides.map((slide) => slide.content).join('\n\n'),
            tags: metaState.tags, // Only user tags, no background data
            globalBackground: globalBackground,
            isPublic: true,
            createdBy: 'user',
            // Extended song metadata
            album: metaState.songMetadata.album,
            year: metaState.songMetadata.year,
            genre: metaState.songMetadata.genre,
            tempo: metaState.songMetadata.tempo,
            key: metaState.songMetadata.key,
            duration: metaState.songMetadata.duration,
            copyright: metaState.songMetadata.copyright,
            publisher: metaState.songMetadata.publisher,
            language: metaState.songMetadata.language,
            notes: metaState.songMetadata.notes
          }

          // Apply migration if enabled
          let finalSongData = songData as Song
          if (state.migrationEnabled && !state.useLegacyFormat) {
            const migratedSong = migrateSong(finalSongData)
            if (validateMigration(finalSongData, migratedSong)) {
              finalSongData = migratedSong
              console.log('✅ Song migration applied successfully')
            } else {
              console.warn('⚠️ Song migration validation failed, using original data')
            }
          }

          const songStore = useSongStore.getState()

          if (metaState.action === 'create') {
            // Create new song
            const newSong = await songStore.createSong(finalSongData.name!)
            await songStore.updateSong(newSong.id, finalSongData)

            // Update meta store with new song ID
            useEditorMetaStore.getState().setItemId(newSong.id)
            useEditorMetaStore.getState().setAction('edit')
          } else if (metaState.itemId) {
            // Update existing song
            await songStore.updateSong(metaState.itemId, finalSongData)
          }
        } else {
          // Save as presentation
          const presentationData: Partial<Presentation> = {
            name: metaState.title || 'Untitled Presentation',
            type: metaState.presentationMetadata.type,
            speaker: metaState.presentationMetadata.speaker || metaState.artist || '',
            tags: metaState.tags, // Only user tags, no background data
            background: globalBackground, // Store global background in presentation
            slides: updatedSlidesState.slides.map((slide, index) => {
              // For the current slide, use the background store state
              // For other slides, preserve their existing backgrounds
              const isCurrentSlide = index === updatedSlidesState.currentSlideIndex
              const slideBackground: Background | undefined = isCurrentSlide
                ? backgroundState.backgroundType !== 'none'
                  ? {
                      type: backgroundState.backgroundType as
                        | 'color'
                        | 'image'
                        | 'video'
                        | 'gradient',
                      value:
                        backgroundState.backgroundImage || backgroundState.backgroundVideo || '',
                      opacity: backgroundState.backgroundOpacity,
                      playbackRate:
                        backgroundState.backgroundType === 'video'
                          ? backgroundState.videoPlaybackRate
                          : undefined,
                      size: backgroundState.backgroundSize,
                      position: backgroundState.backgroundPosition
                    }
                  : undefined
                : slide.background // Keep existing background for other slides

              return {
                id: slide.id,
                title: slide.title,
                content: slide.content,
                elements: slide.elements || [],
                background: slideBackground,
                order: index
              }
            }),
            isPublic: true,
            createdBy: 'user',
            // Extended presentation metadata
            serviceDate: metaState.presentationMetadata.serviceDate,
            occasion: metaState.presentationMetadata.occasion,
            location: metaState.presentationMetadata.location,
            description: metaState.presentationMetadata.description,
            scripture: metaState.presentationMetadata.scripture,
            topic: metaState.presentationMetadata.topic,
            estimatedDuration: metaState.presentationMetadata.estimatedDuration,
            audience: metaState.presentationMetadata.audience,
            language: metaState.presentationMetadata.language,
            notes: metaState.presentationMetadata.notes
          }

          // Apply migration if enabled
          let finalPresentationData = presentationData as Presentation
          if (state.migrationEnabled && !state.useLegacyFormat) {
            const migratedPresentation = migratePresentation(finalPresentationData)
            finalPresentationData = migratedPresentation
            console.log('✅ Presentation migration applied successfully')
          }

          const presentationStore = usePresentationStore.getState()

          if (metaState.action === 'create') {
            // Create new presentation
            const newPresentation = await presentationStore.createPresentation(
              finalPresentationData.name!,
              'custom'
            )
            await presentationStore.updatePresentation(newPresentation.id, finalPresentationData)

            // Update meta store with new presentation ID
            useEditorMetaStore.getState().setItemId(newPresentation.id)
            useEditorMetaStore.getState().setAction('edit')
          } else if (metaState.itemId) {
            // Update existing presentation
            await presentationStore.updatePresentation(metaState.itemId, finalPresentationData)
          }
        }

        // Mark as saved
        useEditorMetaStore.getState().markSaved()
        set({ lastAutoSave: new Date() })

        console.log('✅ Editor saved successfully:', {
          itemId: metaState.itemId,
          title: metaState.title,
          mode: metaState.mode,
          slidesCount: slidesState.slides.length,
          elementsCount: canvasState.elements.length,
          hasGlobalBackground: backgroundState.globalBackgroundType !== 'none',
          hasSlideBackground: backgroundState.backgroundType !== 'none'
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

    loadEditor: async (itemId: string) => {
      try {
        set({ isSaving: true, saveError: undefined })

        const metaState = useEditorMetaStore.getState()

        if (metaState.mode === 'song') {
          // Load song
          const songStore = useSongStore.getState()
          const song = await songStore.getSong(itemId)

          if (!song) {
            throw new Error('Song not found')
          }

          // Update meta store
          const metaStore = useEditorMetaStore.getState()
          metaStore.setTitle(song.name)
          metaStore.setArtist(song.artist || '')

          // Load user tags (now clean, no background data mixed in)
          metaStore.setTags(song.tags || [])

          // Load extended song metadata
          metaStore.updateSongMetadata({
            album: song.album,
            year: song.year,
            genre: song.genre,
            tempo: song.tempo,
            key: song.key,
            duration: song.duration,
            copyright: song.copyright,
            publisher: song.publisher,
            language: song.language,
            notes: song.notes
          })

          // Update slides store
          const slidesStore = useSlidesStore.getState()
          slidesStore.initialize(song.slides || [])

          // Load background settings from proper Song properties
          const backgroundStore = useBackgroundStore.getState()

          // Load global background from song.globalBackground
          if (song.globalBackground && song.globalBackground.type !== 'none') {
            backgroundStore.setGlobalBackground(
              song.globalBackground.type as 'image' | 'video',
              song.globalBackground.value
            )
            backgroundStore.setGlobalBackgroundOpacity(song.globalBackground.opacity || 1)
            if (song.globalBackground.playbackRate) {
              backgroundStore.setGlobalVideoPlaybackRate(song.globalBackground.playbackRate)
            }
            // Load background size and position
            if (song.globalBackground.size) {
              backgroundStore.setBackgroundSize(song.globalBackground.size)
            }
            if (song.globalBackground.position) {
              backgroundStore.setBackgroundPosition(song.globalBackground.position)
            }
          }

          // Load current slide background from the current slide
          const currentSlideIndex = slidesStore.currentSlideIndex
          const currentSlide = song.slides?.[currentSlideIndex]
          if (currentSlide?.background && currentSlide.background.type !== 'none') {
            backgroundStore.setSlideBackground(
              currentSlide.background.type as 'image' | 'video',
              currentSlide.background.value
            )
            backgroundStore.setBackgroundOpacity(currentSlide.background.opacity || 1)
            if (currentSlide.background.playbackRate) {
              backgroundStore.setVideoPlaybackRate(currentSlide.background.playbackRate)
            }
            // Load background size and position for slide
            if (currentSlide.background.size) {
              backgroundStore.setBackgroundSize(currentSlide.background.size)
            }
            if (currentSlide.background.position) {
              backgroundStore.setBackgroundPosition(currentSlide.background.position)
            }
          }

          // Handle legacy background data from tags (for backward compatibility)
          const backgroundTag = song.tags?.find((tag) => tag.startsWith('bg:'))
          if (backgroundTag && !song.globalBackground) {
            try {
              const backgroundData = JSON.parse(backgroundTag.substring(3))

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
              console.warn('Failed to parse legacy background settings:', error)
            }
          }

          // Load canvas elements for current slide
          const songCurrentSlide = song.slides?.[0]
          if (songCurrentSlide?.elements) {
            const canvasElements = songCurrentSlide.elements
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

          console.log('✅ Song loaded successfully:', {
            songId: song.id,
            title: song.name,
            artist: song.artist,
            slidesCount: song.slides?.length || 0,
            hasGlobalBackground: !!song.globalBackground,
            hasSlideBackgrounds: song.slides?.some((slide) => !!slide.background) || false
          })
        } else {
          // Load presentation
          const presentationStore = usePresentationStore.getState()
          const presentation = await presentationStore.getPresentation(itemId)

          if (!presentation) {
            throw new Error('Presentation not found')
          }

          // Update meta store
          const metaStore = useEditorMetaStore.getState()
          metaStore.setTitle(presentation.name)
          metaStore.setArtist(presentation.speaker || '')

          // Load user tags (now clean, no background data mixed in)
          metaStore.setTags(presentation.tags || [])

          // Load extended presentation metadata
          metaStore.updatePresentationMetadata({
            type: presentation.type as
              | 'scripture'
              | 'announcement'
              | 'custom'
              | 'sermon'
              | 'teaching'
              | 'testimony'
              | 'prayer',
            speaker: presentation.speaker,
            serviceDate: presentation.serviceDate,
            occasion: presentation.occasion,
            location: presentation.location,
            description: presentation.description,
            scripture: presentation.scripture,
            topic: presentation.topic,
            estimatedDuration: presentation.estimatedDuration,
            audience: presentation.audience,
            language: presentation.language,
            notes: presentation.notes
          })

          // Load background settings from proper Presentation properties
          const backgroundStore = useBackgroundStore.getState()

          // Load global background from presentation.background
          if (presentation.background && presentation.background.type !== 'none') {
            backgroundStore.setGlobalBackground(
              presentation.background.type as 'image' | 'video',
              presentation.background.value
            )
            backgroundStore.setGlobalBackgroundOpacity(presentation.background.opacity || 1)
            if (presentation.background.playbackRate) {
              backgroundStore.setGlobalVideoPlaybackRate(presentation.background.playbackRate)
            }
          }

          // Load current slide background from the current slide
          const presentationSlidesStore = useSlidesStore.getState()
          const currentSlideIndex = presentationSlidesStore.currentSlideIndex
          const presentationCurrentSlide = presentation.slides?.[currentSlideIndex]
          if (
            presentationCurrentSlide?.background &&
            presentationCurrentSlide.background.type !== 'none'
          ) {
            backgroundStore.setSlideBackground(
              presentationCurrentSlide.background.type as 'image' | 'video',
              presentationCurrentSlide.background.value
            )
            backgroundStore.setBackgroundOpacity(presentationCurrentSlide.background.opacity || 1)
            if (presentationCurrentSlide.background.playbackRate) {
              backgroundStore.setVideoPlaybackRate(presentationCurrentSlide.background.playbackRate)
            }
          }

          // Handle legacy background data from tags (for backward compatibility)
          const backgroundTag = presentation.tags?.find((tag) => tag.startsWith('bg:'))
          if (backgroundTag && !presentation.background) {
            try {
              const backgroundData = JSON.parse(backgroundTag.substring(3))

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
              console.warn('Failed to parse legacy background settings:', error)
            }
          }

          // Convert presentation slides to editor slides format
          const editorSlides = presentation.slides.map((slide) => ({
            id: slide.id,
            type: 'custom' as const,
            title: slide.title,
            content: slide.content,
            elements: slide.elements || [],
            order: slide.order,
            notes: slide.notes || ''
          }))

          // Update slides store
          const editorSlidesStore = useSlidesStore.getState()
          editorSlidesStore.initialize(editorSlides)

          // Load canvas elements for first slide
          const firstEditorSlide = editorSlides[0]
          if (firstEditorSlide?.elements) {
            const canvasElements = firstEditorSlide.elements
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
                zIndex: el.zIndex || 0
              }))

            useCanvasStore.getState().initialize(canvasElements)
          } else {
            useCanvasStore.getState().initialize([])
          }

          console.log('✅ Presentation loaded successfully:', {
            presentationId: presentation.id,
            title: presentation.name,
            speaker: presentation.speaker,
            type: presentation.type,
            slidesCount: presentation.slides?.length || 0,
            tagsCount: presentation.tags?.length || 0,
            hasGlobalBackground: !!presentation.background,
            hasSlideBackgrounds: presentation.slides?.some((slide) => !!slide.background) || false
          })
        }

        // Clear history since we're loading fresh
        useHistoryStore.getState().clear()

        // Mark as saved (no unsaved changes)
        useEditorMetaStore.getState().markSaved()
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

    // Migration management
    enableMigration: () => set({ migrationEnabled: true }),
    disableMigration: () => set({ migrationEnabled: false }),
    setLegacyFormat: (useLegacy: boolean) => set({ useLegacyFormat: useLegacy }),

    initialize: () => {
      console.log('🎛️ [PERSISTENCE] Initializing persistence store...')

      // Sync with settings store first
      const settingsState = useSettingsStore.getState()
      console.log('🎛️ [PERSISTENCE] Settings state when initializing:', {
        autoSave: settingsState.app.autoSave,
        autoSaveInterval: settingsState.app.autoSaveInterval,
        isLoaded: settingsState.isLoaded
      })

      // Wait for settings to be loaded if they haven't been loaded yet
      const waitForSettingsAndSync = () => {
        const currentSettingsState = useSettingsStore.getState()
        if (currentSettingsState.isLoaded) {
          console.log('🎛️ [PERSISTENCE] Settings are loaded, syncing...')
          set({
            autoSaveEnabled: currentSettingsState.app.autoSave,
            autoSaveInterval: currentSettingsState.app.autoSaveInterval
          })

          // Set up auto-save if enabled
          const state = get()
          console.log('🎛️ [PERSISTENCE] After sync - autoSaveEnabled:', state.autoSaveEnabled)
          if (state.autoSaveEnabled) {
            console.log(
              '🎛️ [PERSISTENCE] Enabling auto-save with interval:',
              state.autoSaveInterval
            )
            get().enableAutoSave(state.autoSaveInterval)
          } else {
            console.log('🎛️ [PERSISTENCE] Auto-save is disabled, not starting timer')
          }
        } else {
          console.log('🎛️ [PERSISTENCE] Settings not loaded yet, waiting...')
          // Wait a bit and try again
          setTimeout(waitForSettingsAndSync, 100)
        }
      }

      waitForSettingsAndSync()

      // Subscribe to changes that should trigger unsaved state
      const unsubscribeMeta = useEditorMetaStore.subscribe(
        (state) =>
          state.title +
          state.artist +
          state.tags.join(',') +
          JSON.stringify(state.songMetadata) +
          JSON.stringify(state.presentationMetadata),
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
  const isSaving = usePersistenceStore((state) => state.isSaving)
  const lastAutoSave = usePersistenceStore((state) => state.lastAutoSave)
  const saveError = usePersistenceStore((state) => state.saveError)
  const autoSaveEnabled = usePersistenceStore((state) => state.autoSaveEnabled)
  const hasUnsavedChanges = useEditorMetaStore((state) => state.hasUnsavedChanges)
  const lastSaved = useEditorMetaStore((state) => state.lastSaved)

  return {
    isSaving,
    hasUnsavedChanges,
    lastSaved: lastSaved || lastAutoSave,
    saveError,
    autoSaveEnabled
  }
}
