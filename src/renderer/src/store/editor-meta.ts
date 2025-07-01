import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

export type EditorMode = 'song' | 'slide'
export type EditorAction = 'create' | 'edit'
export type PresentationType =
  | 'scripture'
  | 'announcement'
  | 'custom'
  | 'sermon'
  | 'teaching'
  | 'testimony'
  | 'prayer'

// Extended metadata interfaces
interface SongMetadata {
  // Extended Song Information
  album?: string
  year?: number
  genre?: string

  // Musical Information
  tempo?: number
  key?: string
  duration?: number

  // Additional Metadata
  copyright?: string
  publisher?: string
  language?: string

  // Performance Notes
  notes?: string
}

interface PresentationMetadata {
  // Presentation specific fields
  type: PresentationType
  speaker?: string

  // Event Context
  serviceDate?: Date
  occasion?: string
  location?: string

  // Content Information
  description?: string
  scripture?: string
  topic?: string

  // Duration and Timing
  estimatedDuration?: number

  // Additional Metadata
  audience?: string
  language?: string

  // Preparation Notes
  notes?: string
}

interface EditorMetaState {
  // Core editor metadata
  mode: EditorMode
  action: EditorAction
  itemId?: string
  title: string
  artist: string // Used as "artist" for songs, "speaker" for slides
  tags: string[]

  // Extended metadata
  songMetadata: SongMetadata
  presentationMetadata: PresentationMetadata

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
  setTags: (tags: string[]) => void
  addTag: (tag: string) => void
  removeTag: (tag: string) => void

  // Extended metadata setters
  updateSongMetadata: (updates: Partial<SongMetadata>) => void
  updatePresentationMetadata: (updates: Partial<PresentationMetadata>) => void

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

const initialSongMetadata: SongMetadata = {
  album: undefined,
  year: undefined,
  genre: undefined,
  tempo: undefined,
  key: undefined,
  duration: undefined,
  copyright: undefined,
  publisher: undefined,
  language: undefined,
  notes: undefined
}

const initialPresentationMetadata: PresentationMetadata = {
  type: 'custom',
  speaker: undefined,
  serviceDate: undefined,
  occasion: undefined,
  location: undefined,
  description: undefined,
  scripture: undefined,
  topic: undefined,
  estimatedDuration: undefined,
  audience: undefined,
  language: undefined,
  notes: undefined
}

const initialState: EditorMetaState = {
  mode: 'song',
  action: 'create',
  itemId: undefined,
  title: '',
  artist: '',
  tags: [],
  songMetadata: initialSongMetadata,
  presentationMetadata: initialPresentationMetadata,
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

    setTags: (tags) => {
      set({ tags })
      get().markUnsaved()
    },

    addTag: (tag) => {
      const state = get()
      if (!state.tags.includes(tag) && tag.trim()) {
        set({ tags: [...state.tags, tag.trim()] })
        get().markUnsaved()
      }
    },

    removeTag: (tag) => {
      const state = get()
      set({ tags: state.tags.filter((t) => t !== tag) })
      get().markUnsaved()
    },

    updateSongMetadata: (updates) => {
      const state = get()
      set({
        songMetadata: { ...state.songMetadata, ...updates }
      })
      get().markUnsaved()
    },

    updatePresentationMetadata: (updates) => {
      const state = get()
      set({
        presentationMetadata: { ...state.presentationMetadata, ...updates }
      })
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
        tags: [],
        songMetadata: initialSongMetadata,
        presentationMetadata: initialPresentationMetadata,
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
    artist: state.artist,
    tags: state.tags,
    songMetadata: state.songMetadata,
    presentationMetadata: state.presentationMetadata
  }))

export const useEditorStatus = () =>
  useEditorMetaStore((state) => ({
    isLoading: state.isLoading,
    isSaving: state.isSaving,
    hasUnsavedChanges: state.hasUnsavedChanges,
    lastSaved: state.lastSaved
  }))

// Helper selectors for UI labels - cached to prevent infinite loops
const labelsCache = new Map<
  EditorMode,
  {
    titleLabel: string
    artistLabel: string
    titlePlaceholder: string
    artistPlaceholder: string
  }
>()

export const useEditorLabels = () => {
  return useEditorMetaStore((state) => {
    const cacheKey = state.mode

    if (!labelsCache.has(cacheKey)) {
      labelsCache.set(cacheKey, {
        titleLabel: state.mode === 'song' ? 'Song Title' : 'Presentation Title',
        artistLabel: state.mode === 'song' ? 'Artist' : 'Speaker',
        titlePlaceholder:
          state.mode === 'song' ? 'Enter song title...' : 'Enter presentation title...',
        artistPlaceholder: state.mode === 'song' ? 'Enter artist name...' : 'Enter speaker name...'
      })
    }

    return labelsCache.get(cacheKey)!
  })
}
