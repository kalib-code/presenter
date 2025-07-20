/**
 * Media Store
 *
 * Zustand store for managing media playback state, audio controls,
 * and audio registry for the application.
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import {
  GlobalAudioState,
  MediaState,
  AudioRegistryEntry,
  GlobalAudioControls
} from '@renderer/types/media-config'

/**
 * Media store state interface
 */
export interface MediaStoreState {
  // Audio state
  globalAudioState: GlobalAudioState
  mediaState: MediaState
  hasUserInteracted: boolean

  // Audio registry
  audioRegistry: Map<string, AudioRegistryEntry>
  primaryAudioId: string | null
  activeAudioRef: HTMLAudioElement | null

  // Actions
  setGlobalAudioState: (updates: Partial<GlobalAudioState>) => void
  setMediaState: (updates: Partial<MediaState>) => void
  setHasUserInteracted: (value: boolean) => void
  setPrimaryAudioId: (id: string | null) => void
  setActiveAudioRef: (ref: HTMLAudioElement | null) => void

  // Audio registry management
  registerAudio: (
    audioElement: HTMLAudioElement,
    id: string,
    type?: 'main' | 'background',
    name?: string
  ) => void
  unregisterAudio: (id: string) => void
  getAudioElement: (id: string) => HTMLAudioElement | null
  clearAudioRegistry: () => void

  // Audio control methods
  play: () => void
  pause: () => void
  stop: () => void
  setVolume: (volume: number) => void
  setMuted: (muted: boolean) => void
  seek: (time: number) => void

  // Helper methods
  findActiveAudio: () => HTMLAudioElement | null
  findPrimaryAudio: () => HTMLAudioElement | null
  stopAllAudio: () => void
  getAudioControls: () => GlobalAudioControls
}

/**
 * Initial global audio state
 */
const initialGlobalAudioState: GlobalAudioState = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  muted: false,
  currentTrack: null
}

/**
 * Initial media state
 */
const initialMediaState: MediaState = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  muted: false
}

/**
 * Media store implementation
 */
export const useMediaStore = create<MediaStoreState>()(
  devtools(
    (set, get) => ({
      // Initial state
      globalAudioState: initialGlobalAudioState,
      mediaState: initialMediaState,
      hasUserInteracted: false,
      audioRegistry: new Map(),
      primaryAudioId: null,
      activeAudioRef: null,

      // Basic setters
      setGlobalAudioState: (updates) =>
        set(
          (state) => ({
            globalAudioState: { ...state.globalAudioState, ...updates }
          }),
          false,
          'setGlobalAudioState'
        ),

      setMediaState: (updates) =>
        set(
          (state) => ({
            mediaState: { ...state.mediaState, ...updates }
          }),
          false,
          'setMediaState'
        ),

      setHasUserInteracted: (value) =>
        set({ hasUserInteracted: value }, false, 'setHasUserInteracted'),

      setPrimaryAudioId: (id) => set({ primaryAudioId: id }, false, 'setPrimaryAudioId'),

      setActiveAudioRef: (ref) => set({ activeAudioRef: ref }, false, 'setActiveAudioRef'),

      // Audio registry management
      registerAudio: (audioElement, id, type = 'main', name) => {
        const { audioRegistry, primaryAudioId, setGlobalAudioState } = get()
        const newRegistry = new Map(audioRegistry)

        const entry: AudioRegistryEntry = {
          id,
          element: audioElement,
          type,
          name: name || `${type} audio`,
          isPrimary: type === 'main' && !primaryAudioId
        }

        newRegistry.set(id, entry)

        console.log(`🎵 [MEDIA_STORE] Registering audio: ${id} (${type})`)

        // Add event listeners to sync state automatically
        const updateGlobalState = (): void => {
          if (audioElement) {
            const isPlaying = !audioElement.paused && !audioElement.ended
            console.log(`🎵 [MEDIA_STORE] Audio state changed for ${id}:`, {
              isPlaying,
              currentTime: audioElement.currentTime,
              duration: audioElement.duration,
              volume: audioElement.volume,
              muted: audioElement.muted
            })

            setGlobalAudioState({
              isPlaying,
              currentTime: audioElement.currentTime || 0,
              duration: audioElement.duration || 0,
              volume: audioElement.volume || 0.5,
              muted: audioElement.muted || false,
              currentTrack: entry.name
            })
          }
        }

        // Add event listeners
        audioElement.addEventListener('play', updateGlobalState)
        audioElement.addEventListener('pause', updateGlobalState)
        audioElement.addEventListener('ended', updateGlobalState)
        audioElement.addEventListener('timeupdate', updateGlobalState)
        audioElement.addEventListener('loadedmetadata', updateGlobalState)
        audioElement.addEventListener('volumechange', updateGlobalState)
        audioElement.addEventListener('durationchange', updateGlobalState)

        // Store cleanup function
        const cleanup = (): void => {
          audioElement.removeEventListener('play', updateGlobalState)
          audioElement.removeEventListener('pause', updateGlobalState)
          audioElement.removeEventListener('ended', updateGlobalState)
          audioElement.removeEventListener('timeupdate', updateGlobalState)
          audioElement.removeEventListener('loadedmetadata', updateGlobalState)
          audioElement.removeEventListener('volumechange', updateGlobalState)
          audioElement.removeEventListener('durationchange', updateGlobalState)
        }

        // Store cleanup function with the entry
        entry.cleanup = cleanup

        set(
          (state) => ({
            audioRegistry: newRegistry,
            primaryAudioId: entry.isPrimary ? id : state.primaryAudioId,
            activeAudioRef: entry.isPrimary ? audioElement : state.activeAudioRef
          }),
          false,
          'registerAudio'
        )
      },

      unregisterAudio: (id) => {
        const { audioRegistry, primaryAudioId, activeAudioRef } = get()
        const newRegistry = new Map(audioRegistry)
        const entry = newRegistry.get(id)

        if (entry) {
          // Clean up event listeners
          if (entry.cleanup) {
            entry.cleanup()
          }

          newRegistry.delete(id)
          console.log(`🎵 [MEDIA_STORE] Unregistering audio: ${id}`)

          set(
            (state) => ({
              audioRegistry: newRegistry,
              primaryAudioId: primaryAudioId === id ? null : state.primaryAudioId,
              activeAudioRef: activeAudioRef === entry.element ? null : state.activeAudioRef
            }),
            false,
            'unregisterAudio'
          )
        }
      },

      getAudioElement: (id) => {
        const { audioRegistry } = get()
        return audioRegistry.get(id)?.element || null
      },

      clearAudioRegistry: () =>
        set(
          {
            audioRegistry: new Map(),
            primaryAudioId: null,
            activeAudioRef: null
          },
          false,
          'clearAudioRegistry'
        ),

      // Audio control methods
      play: () => {
        const { findActiveAudio, setGlobalAudioState } = get()
        const audio = findActiveAudio()

        if (audio) {
          console.log('🎵 [MEDIA_STORE] Playing audio')
          audio
            .play()
            .then(() => {
              setGlobalAudioState({ isPlaying: true })
            })
            .catch(console.error)
        } else {
          console.log('🎵 [MEDIA_STORE] No audio to play, sending IPC command')
          window.electron?.ipcRenderer.send('audio-control', { action: 'play' })
          setGlobalAudioState({ isPlaying: true })
        }
      },

      pause: () => {
        const { findActiveAudio, setGlobalAudioState } = get()
        const audio = findActiveAudio()

        if (audio) {
          console.log('🎵 [MEDIA_STORE] Pausing audio')
          audio.pause()
          setGlobalAudioState({ isPlaying: false })
        } else {
          console.log('🎵 [MEDIA_STORE] No audio to pause, sending IPC command')
          window.electron?.ipcRenderer.send('audio-control', { action: 'pause' })
          setGlobalAudioState({ isPlaying: false })
        }
      },

      stop: () => {
        const { audioRegistry, setGlobalAudioState, setActiveAudioRef, setPrimaryAudioId } = get()

        console.log('🎵 [MEDIA_STORE] Stopping all audio')

        // Stop all registered audio
        audioRegistry.forEach((entry) => {
          entry.element.pause()
          entry.element.currentTime = 0
        })

        // Clear active references
        setActiveAudioRef(null)
        setPrimaryAudioId(null)

        // Reset global audio state completely
        setGlobalAudioState({
          isPlaying: false,
          currentTime: 0,
          duration: 0,
          volume: 0.5,
          muted: false,
          currentTrack: null
        })

        // Send IPC command for external audio
        window.electron?.ipcRenderer.send('audio-control', { action: 'stop' })
      },

      setVolume: (volume) => {
        const { findActiveAudio, setGlobalAudioState } = get()
        const audio = findActiveAudio()

        if (audio) {
          audio.volume = volume
          console.log('🎵 [MEDIA_STORE] Set volume to', volume)
        }

        setGlobalAudioState({ volume })
        window.electron?.ipcRenderer.send('audio-control', { action: 'setVolume', value: volume })
      },

      setMuted: (muted) => {
        const { findActiveAudio, setGlobalAudioState } = get()
        const audio = findActiveAudio()

        if (audio) {
          audio.muted = muted
          console.log('🎵 [MEDIA_STORE] Set muted to', muted)
        }

        setGlobalAudioState({ muted })
        window.electron?.ipcRenderer.send('audio-control', { action: 'setMuted', value: muted })
      },

      seek: (time) => {
        const { findActiveAudio, setGlobalAudioState } = get()
        const audio = findActiveAudio()

        if (audio) {
          audio.currentTime = time
          console.log('🎵 [MEDIA_STORE] Seek to', time)
        }

        setGlobalAudioState({ currentTime: time })
        window.electron?.ipcRenderer.send('audio-control', { action: 'seek', value: time })
      },

      // Helper methods
      findActiveAudio: () => {
        const { activeAudioRef, primaryAudioId, audioRegistry } = get()

        // Try active ref first
        if (activeAudioRef && !activeAudioRef.paused) {
          return activeAudioRef
        }

        // Try primary audio
        if (primaryAudioId) {
          const primaryEntry = audioRegistry.get(primaryAudioId)
          if (primaryEntry && primaryEntry.element.readyState >= 2) {
            return primaryEntry.element
          }
        }

        // Find any main audio that's ready
        for (const entry of audioRegistry.values()) {
          if (entry.type === 'main' && entry.element.readyState >= 2) {
            return entry.element
          }
        }

        // Find any background audio that's ready
        for (const entry of audioRegistry.values()) {
          if (entry.type === 'background' && entry.element.readyState >= 2) {
            return entry.element
          }
        }

        return null
      },

      findPrimaryAudio: () => {
        const { primaryAudioId, audioRegistry } = get()
        if (primaryAudioId) {
          return audioRegistry.get(primaryAudioId)?.element || null
        }
        return null
      },

      stopAllAudio: () => {
        const { audioRegistry } = get()
        audioRegistry.forEach((entry) => {
          entry.element.pause()
          entry.element.currentTime = 0
        })
        console.log('🎵 [MEDIA_STORE] Stopped all audio elements')
      },

      getAudioControls: (): GlobalAudioControls => {
        const store = get()
        return {
          registerAudio: store.registerAudio,
          unregisterAudio: store.unregisterAudio,
          play: store.play,
          pause: store.pause,
          stop: store.stop,
          setVolume: store.setVolume,
          setMuted: store.setMuted,
          seek: store.seek
        }
      }
    }),
    {
      name: 'media-store',
      serialize: {
        options: {
          map: true
        }
      }
    }
  )
)
