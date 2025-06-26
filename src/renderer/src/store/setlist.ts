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

  // Recent items tracking
  recentItems: Array<{
    type:
      | 'song'
      | 'presentation'
      | 'media'
      | 'announcement'
      | 'countdown'
      | 'video'
      | 'image'
      | 'audio'
    referenceId: string
    title: string
    usedAt: number
  }>

  // Actions
  loadSetlists: () => Promise<void>
  createSetlist: (
    data: Omit<Setlist, 'id' | 'createdAt' | 'updatedAt' | 'version'>
  ) => Promise<void>
  duplicateSetlist: (id: string, newName?: string) => Promise<void>
  updateSetlist: (id: string, data: Partial<Setlist>) => Promise<void>
  deleteSetlist: (id: string) => Promise<void>
  setCurrentSetlist: (setlist: Setlist | null) => void

  // Recent items
  addToRecentItems: (type: string, referenceId: string, title: string) => void
  getRecentItems: () => SetlistState['recentItems']

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

    // Recent items tracking
    recentItems: [],

    loadSetlists: async () => {
      try {
        set({ isLoading: true, error: null })
        console.log('📋 [STORE] Loading setlists...')
        const setlists = await window.electron?.invoke('list-setlists')
        console.log('📋 [STORE] Setlists loaded:', setlists?.length || 0)
        if (setlists) {
          setlists.forEach((setlist: Setlist) => {
            console.log(
              '📋 [STORE] Setlist:',
              setlist.name,
              'has',
              setlist.items?.length || 0,
              'items'
            )
            setlist.items?.forEach((item) => {
              console.log(
                '📋 [STORE]   - Item:',
                item.title,
                'type:',
                item.type,
                'refId:',
                item.referenceId
              )
            })
          })
        }
        set({ setlists: setlists || [], isLoading: false })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load setlists'
        console.error('📋 [STORE] Error loading setlists:', error)
        set({ error: errorMessage, isLoading: false })
      }
    },

    createSetlist: async (data) => {
      try {
        set({ isLoading: true, error: null })
        console.log('📋 [STORE] Creating setlist:', data.name)
        const setlists = await window.electron?.invoke('create-setlist', data)
        console.log('📋 [STORE] Setlist created, total setlists:', setlists?.length || 0)
        set({ setlists: setlists || [], isLoading: false })
        return setlists || []
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create setlist'
        console.error('📋 [STORE] Error creating setlist:', error)
        set({ error: errorMessage, isLoading: false })
        throw error
      }
    },

    duplicateSetlist: async (id, newName) => {
      try {
        set({ isLoading: true, error: null })
        const state = get()
        const originalSetlist = state.setlists.find((s) => s.id === id)

        if (!originalSetlist) {
          throw new Error('Setlist not found')
        }

        console.log('📋 [STORE] Duplicating setlist:', originalSetlist.name)

        const duplicateData = {
          name: newName || `Copy of ${originalSetlist.name}`,
          description: originalSetlist.description,
          items: originalSetlist.items.map((item) => ({
            ...item,
            id: Date.now().toString() + Math.random().toString(36).slice(2)
          })),
          tags: [...originalSetlist.tags],
          isPublic: originalSetlist.isPublic,
          estimatedDuration: originalSetlist.estimatedDuration,
          createdBy: 'user'
        }

        const setlists = await window.electron?.invoke('create-setlist', duplicateData)
        console.log('📋 [STORE] Setlist duplicated, total setlists:', setlists?.length || 0)
        set({ setlists: setlists || [], isLoading: false })
        return setlists || []
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to duplicate setlist'
        console.error('📋 [STORE] Error duplicating setlist:', error)
        set({ error: errorMessage, isLoading: false })
        throw error
      }
    },

    updateSetlist: async (id, data) => {
      try {
        set({ isLoading: true, error: null })
        console.log('📋 [STORE] Updating setlist:', id, 'with data keys:', Object.keys(data))
        if (data.items) {
          console.log('📋 [STORE] Updating', data.items.length, 'items')
          data.items.forEach((item) => {
            console.log(
              '📋 [STORE]   - Item:',
              item.title,
              'type:',
              item.type,
              'refId:',
              item.referenceId
            )
          })
        }
        const setlists = await window.electron?.invoke('update-setlist', id, data)
        console.log('📋 [STORE] Setlist updated, total setlists:', setlists?.length || 0)
        set({ setlists: setlists || [], isLoading: false })
        return setlists || []
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update setlist'
        console.error('📋 [STORE] Error updating setlist:', error)
        set({ error: errorMessage, isLoading: false })
        throw error
      }
    },

    deleteSetlist: async (id) => {
      try {
        set({ isLoading: true, error: null })
        console.log('📋 [STORE] Deleting setlist:', id)
        const setlists = await window.electron?.invoke('delete-setlist', id)
        console.log('📋 [STORE] Setlist deleted, remaining setlists:', setlists?.length || 0)
        set({ setlists: setlists || [], isLoading: false })
        return setlists || []
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete setlist'
        console.error('📋 [STORE] Error deleting setlist:', error)
        set({ error: errorMessage, isLoading: false })
        throw error
      }
    },

    setCurrentSetlist: (setlist) => {
      set({ currentSetlist: setlist })
      if (!setlist) {
        set({ isPresenting: false, currentItemIndex: 0 })
      }
    },

    // Recent items tracking
    addToRecentItems: (type, referenceId, title) => {
      const state = get()
      const newItem = {
        type: type as
          | 'song'
          | 'presentation'
          | 'media'
          | 'announcement'
          | 'countdown'
          | 'video'
          | 'image'
          | 'audio',
        referenceId,
        title,
        usedAt: Date.now()
      }

      // Remove existing entry if it exists
      const filteredItems = state.recentItems.filter(
        (item) => !(item.type === type && item.referenceId === referenceId)
      )

      // Add new item at the beginning and limit to 10 items
      const updatedItems = [newItem, ...filteredItems].slice(0, 10)

      set({ recentItems: updatedItems })
    },

    getRecentItems: () => {
      const state = get()
      return state.recentItems.sort((a, b) => b.usedAt - a.usedAt)
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

      // Track this item as recently used (but not for countdown/announcement items without refs)
      if (item.referenceId && item.referenceId !== 'new') {
        get().addToRecentItems(item.type, item.referenceId, item.title)
      }

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
