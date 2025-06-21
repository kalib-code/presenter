import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

export type EditorMode = 'song' | 'slide'
export type EditorAction = 'create' | 'edit'

interface EditorMetaState {
  // Core editor metadata
  mode: EditorMode
  action: EditorAction
  itemId?: string
  title: string
  artist: string

  // Loading states
  isLoading: boolean
  isSaving: boolean
  lastSaved?: Date
  hasUnsavedChanges: boolean
}

interface EditorMetaActions {
  // Setters
  setMode: (mode: EditorMode) => void
  setAction: (action: EditorAction) => void
  setItemId: (itemId: string | undefined) => void
  setTitle: (title: string) => void
  setArtist: (artist: string) => void

  // State management
  setLoading: (loading: boolean) => void
  setSaving: (saving: boolean) => void
  markSaved: () => void
  markUnsaved: () => void

  // Initialization
  initialize: (params: { mode?: EditorMode; action?: EditorAction; itemId?: string }) => void
  reset: () => void
}

type EditorMetaStore = EditorMetaState & EditorMetaActions

const initialState: EditorMetaState = {
  mode: 'song',
  action: 'create',
  itemId: undefined,
  title: '',
  artist: '',
  isLoading: false,
  isSaving: false,
  lastSaved: undefined,
  hasUnsavedChanges: false
}

export const useEditorMetaStore = create<EditorMetaStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    setMode: (mode) => {
      set({ mode })
      get().markUnsaved()
    },

    setAction: (action) => {
      set({ action })
    },

    setItemId: (itemId) => {
      set({ itemId })
    },

    setTitle: (title) => {
      set({ title })
      get().markUnsaved()
    },

    setArtist: (artist) => {
      set({ artist })
      get().markUnsaved()
    },

    setLoading: (isLoading) => {
      set({ isLoading })
    },

    setSaving: (isSaving) => {
      set({ isSaving })
    },

    markSaved: () => {
      set({
        lastSaved: new Date(),
        hasUnsavedChanges: false,
        isSaving: false
      })
    },

    markUnsaved: () => {
      set({ hasUnsavedChanges: true })
    },

    initialize: ({ mode = 'song', action = 'create', itemId }) => {
      set({
        mode,
        action,
        itemId,
        title: '',
        artist: '',
        isLoading: false,
        isSaving: false,
        hasUnsavedChanges: false,
        lastSaved: undefined
      })
    },

    reset: () => {
      set(initialState)
    }
  }))
)

// Selectors for performance optimization
export const useEditorMeta = () =>
  useEditorMetaStore((state) => ({
    mode: state.mode,
    action: state.action,
    itemId: state.itemId,
    title: state.title,
    artist: state.artist
  }))

export const useEditorStatus = () =>
  useEditorMetaStore((state) => ({
    isLoading: state.isLoading,
    isSaving: state.isSaving,
    hasUnsavedChanges: state.hasUnsavedChanges,
    lastSaved: state.lastSaved
  }))
