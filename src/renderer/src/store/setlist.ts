import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { Setlist, SetlistItem } from '@renderer/types/database'

interface SetlistState {
  setlists: Setlist[]
  currentSetlist: Setlist | null
  isLoading: boolean
  error: string | null

  // Live presentation state
  isPresenting: boolean
  currentItemIndex: number
  countdownTime: number // in seconds
  countdownActive: boolean

  // Actions
  loadSetlists: () => Promise<void>
  createSetlist: (
    data: Omit<Setlist, 'id' | 'createdAt' | 'updatedAt' | 'version'>
  ) => Promise<void>
  updateSetlist: (id: string, data: Partial<Setlist>) => Promise<void>
  deleteSetlist: (id: string) => Promise<void>
  setCurrentSetlist: (setlist: Setlist | null) => void

  // Item management
  addItem: (setlistId: string, item: Omit<SetlistItem, 'id' | 'order'>) => Promise<void>
  removeItem: (setlistId: string, itemId: string) => Promise<void>
  reorderItems: (setlistId: string, items: SetlistItem[]) => Promise<void>
  updateItem: (setlistId: string, itemId: string, data: Partial<SetlistItem>) => Promise<void>

  // Live presentation
  startPresentation: (setlist: Setlist) => void
  stopPresentation: () => void
  goToItem: (index: number) => void
  nextItem: () => void
  previousItem: () => void

  // Countdown timer
  startCountdown: (seconds: number) => void
  pauseCountdown: () => void
  stopCountdown: () => void
  setCountdownTime: (seconds: number) => void
}

export const useSetlistStore = create<SetlistState>()(
  subscribeWithSelector((set, get) => ({
    setlists: [],
    currentSetlist: null,
    isLoading: false,
    error: null,

    // Live presentation state
    isPresenting: false,
    currentItemIndex: 0,
    countdownTime: 0,
    countdownActive: false,

    loadSetlists: async () => {
      set({ isLoading: true, error: null })
      try {
        const setlists = await window.electron.ipcRenderer.invoke('list-setlists')
        console.log('✅ Setlists loaded:', setlists.length)
        set({ setlists, isLoading: false })
      } catch (error) {
        console.error('❌ Failed to load setlists:', error)
        set({
          error: error instanceof Error ? error.message : 'Failed to load setlists',
          isLoading: false
        })
      }
    },

    createSetlist: async (data) => {
      set({ isLoading: true, error: null })
      try {
        const setlists = await window.electron.ipcRenderer.invoke('create-setlist', data)
        console.log('✅ Setlist created:', data.name)
        set({ setlists, isLoading: false })
      } catch (error) {
        console.error('❌ Failed to create setlist:', error)
        set({
          error: error instanceof Error ? error.message : 'Failed to create setlist',
          isLoading: false
        })
      }
    },

    updateSetlist: async (id, data) => {
      set({ isLoading: true, error: null })
      try {
        const setlists = await window.electron.ipcRenderer.invoke('update-setlist', id, data)
        console.log('✅ Setlist updated:', id)
        set({ setlists, isLoading: false })

        // Update current setlist if it's the one being updated
        const state = get()
        if (state.currentSetlist?.id === id) {
          const updatedSetlist = setlists.find((s) => s.id === id)
          if (updatedSetlist) {
            set({ currentSetlist: updatedSetlist })
          }
        }
      } catch (error) {
        console.error('❌ Failed to update setlist:', error)
        set({
          error: error instanceof Error ? error.message : 'Failed to update setlist',
          isLoading: false
        })
      }
    },

    deleteSetlist: async (id) => {
      set({ isLoading: true, error: null })
      try {
        const setlists = await window.electron.ipcRenderer.invoke('delete-setlist', id)
        console.log('✅ Setlist deleted:', id)
        set({ setlists, isLoading: false })

        // Clear current setlist if it was deleted
        const state = get()
        if (state.currentSetlist?.id === id) {
          set({ currentSetlist: null, isPresenting: false })
        }
      } catch (error) {
        console.error('❌ Failed to delete setlist:', error)
        set({
          error: error instanceof Error ? error.message : 'Failed to delete setlist',
          isLoading: false
        })
      }
    },

    setCurrentSetlist: (setlist) => {
      set({ currentSetlist: setlist })
      if (!setlist) {
        set({ isPresenting: false, currentItemIndex: 0 })
      }
    },

    // Item management
    addItem: async (setlistId, item) => {
      console.log('🔧 AddItem called with:', { setlistId, item })

      const state = get()
      const setlist = state.setlists.find((s) => s.id === setlistId)

      if (!setlist) {
        console.error('❌ Setlist not found:', setlistId)
        return
      }

      // Ensure items array exists
      if (!setlist.items) {
        console.log('⚠️ Setlist items array is undefined, initializing as empty array')
        setlist.items = []
      }

      console.log('📋 Current setlist items before adding:', setlist.items.length, setlist.items)

      const newItem: SetlistItem = {
        ...item,
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        order: setlist.items.length
      }

      console.log('✨ Created new item:', newItem)

      const updatedItems = [...setlist.items, newItem]
      console.log('📝 Updated items array:', updatedItems.length, updatedItems)

      console.log('➕ Adding item to setlist')
      await get().updateSetlist(setlistId, { items: updatedItems })
      console.log('✅ Setlist updated')

      // Refresh setlist data to ensure UI shows the new item
      await get().loadSetlists()
      console.log('✅ Setlist refreshed after adding item')

      // Check the state after update
      const updatedState = get()
      const updatedSetlist = updatedState.setlists.find((s) => s.id === setlistId)
      console.log(
        '✅ Setlist refreshed after adding item, new count:',
        updatedSetlist?.items?.length || 0
      )
    },

    removeItem: async (setlistId, itemId) => {
      const state = get()
      const setlist = state.setlists.find((s) => s.id === setlistId)
      if (!setlist || !setlist.items) return

      const updatedItems = setlist.items
        .filter((item) => item.id !== itemId)
        .map((item, index) => ({ ...item, order: index }))

      await get().updateSetlist(setlistId, { items: updatedItems })
    },

    reorderItems: async (setlistId, items) => {
      const reorderedItems = items.map((item, index) => ({ ...item, order: index }))
      await get().updateSetlist(setlistId, { items: reorderedItems })
    },

    updateItem: async (setlistId, itemId, data) => {
      const state = get()
      const setlist = state.setlists.find((s) => s.id === setlistId)
      if (!setlist || !setlist.items) return

      const updatedItems = setlist.items.map((item) =>
        item.id === itemId ? { ...item, ...data } : item
      )

      await get().updateSetlist(setlistId, { items: updatedItems })
    },

    // Live presentation
    startPresentation: (setlist) => {
      set({
        currentSetlist: setlist,
        isPresenting: true,
        currentItemIndex: 0
      })
      console.log('🎬 Started presentation:', setlist.name)
      // Navigate to presenter view
      window.location.hash = '#/setlist-presenter'
    },

    stopPresentation: () => {
      set({
        isPresenting: false,
        currentItemIndex: 0,
        countdownActive: false,
        countdownTime: 0
      })
      console.log('⏹️ Stopped presentation')
    },

    goToItem: (index) => {
      const state = get()
      if (state.currentSetlist && index >= 0 && index < state.currentSetlist.items.length) {
        set({ currentItemIndex: index })
        console.log('📍 Went to item:', index)
      }
    },

    nextItem: () => {
      const state = get()
      if (state.currentSetlist && state.currentItemIndex < state.currentSetlist.items.length - 1) {
        set({ currentItemIndex: state.currentItemIndex + 1 })
        console.log('⏭️ Next item:', state.currentItemIndex + 1)
      }
    },

    previousItem: () => {
      const state = get()
      if (state.currentItemIndex > 0) {
        set({ currentItemIndex: state.currentItemIndex - 1 })
        console.log('⏮️ Previous item:', state.currentItemIndex - 1)
      }
    },

    // Countdown timer
    startCountdown: (seconds) => {
      set({ countdownTime: seconds, countdownActive: true })
      console.log('⏰ Started countdown:', seconds, 'seconds')

      const interval = setInterval(() => {
        const state = get()
        if (!state.countdownActive) {
          clearInterval(interval)
          return
        }

        if (state.countdownTime <= 0) {
          clearInterval(interval)
          set({ countdownActive: false, countdownTime: 0 })
          console.log('⏰ Countdown finished')
          return
        }

        set({ countdownTime: state.countdownTime - 1 })
      }, 1000)
    },

    pauseCountdown: () => {
      set({ countdownActive: false })
      console.log('⏸️ Countdown paused')
    },

    stopCountdown: () => {
      set({ countdownActive: false, countdownTime: 0 })
      console.log('⏹️ Countdown stopped')
    },

    setCountdownTime: (seconds) => {
      set({ countdownTime: seconds })
    }
  }))
)

// Auto-load setlists on store initialization
useSetlistStore.getState().loadSetlists()
