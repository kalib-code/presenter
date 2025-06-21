import { create } from 'zustand'
import { db } from '@renderer/lib/database'
import type { Song } from '@renderer/types/database'

interface SongStore {
  songs: Song[]
  loading: boolean
  error: string | null

  // CRUD operations
  fetchSongs: () => Promise<void>
  createSong: (name: string) => Promise<Song>
  updateSong: (id: string, data: Partial<Song>) => Promise<Song>
  deleteSong: (id: string) => Promise<void>
  getSong: (id: string) => Promise<Song | null>

  // Search and filter
  searchSongs: (query: string) => Promise<Song[]>
  getSongsByArtist: (artist: string) => Promise<Song[]>
  getSongsByTag: (tag: string) => Promise<Song[]>

  // UI state
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

export const useSongStore = create<SongStore>((set, get) => ({
  songs: [],
  loading: false,
  error: null,

  fetchSongs: async () => {
    try {
      set({ loading: true, error: null })
      const result = await db.songs.list()
      set({ songs: result.data, loading: false })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch songs'
      set({ error: errorMessage, loading: false })
      console.error('Error fetching songs:', error)
    }
  },

  createSong: async (name: string) => {
    try {
      set({ loading: true, error: null })
      const song = await db.songs.create({
        name,
        lyrics: '',
        slides: [],
        tags: [],
        isPublic: true,
        createdBy: 'user'
      })

      // Update the local state
      const currentSongs = get().songs
      set({
        songs: [...currentSongs, song],
        loading: false
      })

      return song
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create song'
      set({ error: errorMessage, loading: false })
      console.error('Error creating song:', error)
      throw error
    }
  },

  updateSong: async (id: string, data: Partial<Song>) => {
    try {
      set({ loading: true, error: null })
      const updatedSong = await db.songs.update(id, data)

      // Update the local state
      const currentSongs = get().songs
      const updatedSongs = currentSongs.map((song) => (song.id === id ? updatedSong : song))
      set({
        songs: updatedSongs,
        loading: false
      })

      return updatedSong
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update song'
      set({ error: errorMessage, loading: false })
      console.error('Error updating song:', error)
      throw error
    }
  },

  deleteSong: async (id: string) => {
    try {
      set({ loading: true, error: null })
      await db.songs.delete(id)

      // Update the local state
      const currentSongs = get().songs
      const filteredSongs = currentSongs.filter((song) => song.id !== id)
      set({
        songs: filteredSongs,
        loading: false
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete song'
      set({ error: errorMessage, loading: false })
      console.error('Error deleting song:', error)
      throw error
    }
  },

  getSong: async (id: string) => {
    try {
      set({ error: null })
      return await db.songs.get(id)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get song'
      set({ error: errorMessage })
      console.error('Error getting song:', error)
      return null
    }
  },

  searchSongs: async (query: string) => {
    try {
      set({ error: null })
      const result = await db.songs.search(query)
      return result.data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to search songs'
      set({ error: errorMessage })
      console.error('Error searching songs:', error)
      return []
    }
  },

  getSongsByArtist: async (artist: string) => {
    try {
      set({ error: null })
      return await db.songs.getByArtist(artist)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get songs by artist'
      set({ error: errorMessage })
      console.error('Error getting songs by artist:', error)
      return []
    }
  },

  getSongsByTag: async (tag: string) => {
    try {
      set({ error: null })
      return await db.songs.getByTag(tag)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get songs by tag'
      set({ error: errorMessage })
      console.error('Error getting songs by tag:', error)
      return []
    }
  },

  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null })
}))
