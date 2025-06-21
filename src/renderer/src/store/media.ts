import { create } from 'zustand'
import { db } from '@renderer/lib/database'
import type { Media } from '@renderer/types/database'

// Slide store (legacy - will be migrated to presentations)
interface SlideStore {
  slides: LegacySlide[]
  loading: boolean
  error: string | null
  fetchSlides: () => Promise<void>
  createSlide: (title: string, content: string) => Promise<void>
  deleteSlide: (id: string) => Promise<void>
}

interface LegacySlide {
  id: string
  title: string
  content: string
  createdAt: string
}

export const useSlideStore = create<SlideStore>((set) => ({
  slides: [],
  loading: false,
  error: null,

  fetchSlides: async () => {
    try {
      set({ loading: true, error: null })
      const slides: LegacySlide[] = await window.electron.invoke('list-slides')
      set({ slides, loading: false })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch slides'
      set({ error: errorMessage, loading: false })
      console.error('Error fetching slides:', error)
    }
  },

  createSlide: async (title: string, content: string) => {
    try {
      set({ loading: true, error: null })
      const slides: LegacySlide[] = await window.electron.invoke('create-slide', title, content)
      set({ slides, loading: false })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create slide'
      set({ error: errorMessage, loading: false })
      console.error('Error creating slide:', error)
    }
  },

  deleteSlide: async (id: string) => {
    try {
      set({ loading: true, error: null })
      const slides: LegacySlide[] = await window.electron.invoke('delete-slide', id)
      set({ slides, loading: false })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete slide'
      set({ error: errorMessage, loading: false })
      console.error('Error deleting slide:', error)
    }
  }
}))

// Media store using new database layer
interface MediaStore {
  media: Media[]
  loading: boolean
  error: string | null

  // CRUD operations
  fetchMedia: () => Promise<void>
  createMedia: (data: Omit<Media, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => Promise<Media>
  updateMedia: (id: string, data: Partial<Media>) => Promise<Media>
  deleteMedia: (id: string) => Promise<void>
  getMedia: (id: string) => Promise<Media | null>

  // Type-specific operations
  getImages: () => Promise<Media[]>
  getVideos: () => Promise<Media[]>
  getAudio: () => Promise<Media[]>
  getByType: (type: Media['type']) => Promise<Media[]>

  // Search and filter
  searchMedia: (query: string) => Promise<Media[]>
  getMediaByTag: (tag: string) => Promise<Media[]>

  // UI state
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

export const useMediaStore = create<MediaStore>((set, get) => ({
  media: [],
  loading: false,
  error: null,

  fetchMedia: async () => {
    try {
      set({ loading: true, error: null })
      const result = await db.media.list()
      set({ media: result.data, loading: false })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch media'
      set({ error: errorMessage, loading: false })
      console.error('Error fetching media:', error)
    }
  },

  createMedia: async (data: Omit<Media, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => {
    try {
      set({ loading: true, error: null })
      const media = await db.media.create(data)

      // Update the local state
      const currentMedia = get().media
      set({
        media: [...currentMedia, media],
        loading: false
      })

      return media
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create media'
      set({ error: errorMessage, loading: false })
      console.error('Error creating media:', error)
      throw error
    }
  },

  updateMedia: async (id: string, data: Partial<Media>) => {
    try {
      set({ loading: true, error: null })
      const updatedMedia = await db.media.update(id, data)

      // Update the local state
      const currentMedia = get().media
      const updatedMediaList = currentMedia.map((item) => (item.id === id ? updatedMedia : item))
      set({
        media: updatedMediaList,
        loading: false
      })

      return updatedMedia
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update media'
      set({ error: errorMessage, loading: false })
      console.error('Error updating media:', error)
      throw error
    }
  },

  deleteMedia: async (id: string) => {
    try {
      set({ loading: true, error: null })
      await db.media.delete(id)

      // Update the local state
      const currentMedia = get().media
      const filteredMedia = currentMedia.filter((item) => item.id !== id)
      set({
        media: filteredMedia,
        loading: false
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete media'
      set({ error: errorMessage, loading: false })
      console.error('Error deleting media:', error)
      throw error
    }
  },

  getMedia: async (id: string) => {
    try {
      set({ error: null })
      return await db.media.get(id)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get media'
      set({ error: errorMessage })
      console.error('Error getting media:', error)
      return null
    }
  },

  getImages: async () => {
    try {
      set({ error: null })
      return await db.media.getImages()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get images'
      set({ error: errorMessage })
      console.error('Error getting images:', error)
      return []
    }
  },

  getVideos: async () => {
    try {
      set({ error: null })
      return await db.media.getVideos()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get videos'
      set({ error: errorMessage })
      console.error('Error getting videos:', error)
      return []
    }
  },

  getAudio: async () => {
    try {
      set({ error: null })
      return await db.media.getAudio()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get audio'
      set({ error: errorMessage })
      console.error('Error getting audio:', error)
      return []
    }
  },

  getByType: async (type: Media['type']) => {
    try {
      set({ error: null })
      return await db.media.getByType(type)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to get ${type} media`
      set({ error: errorMessage })
      console.error(`Error getting ${type} media:`, error)
      return []
    }
  },

  searchMedia: async (query: string) => {
    try {
      set({ error: null })
      const result = await db.media.search(query)
      return result.data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to search media'
      set({ error: errorMessage })
      console.error('Error searching media:', error)
      return []
    }
  },

  getMediaByTag: async (tag: string) => {
    try {
      set({ error: null })
      const allMedia = await db.media.list()
      return allMedia.data.filter((item) => item.tags.includes(tag))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get media by tag'
      set({ error: errorMessage })
      console.error('Error getting media by tag:', error)
      return []
    }
  },

  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null })
}))

// Legacy stores for backward compatibility (will be removed)
interface LegacyImageStore {
  images: LegacyImage[]
  fetchImages: () => Promise<void>
  deleteImage: (id: string) => Promise<void>
}

interface LegacyImage {
  id: string
  name: string
  filePath: string
  size: number
  createdAt: string
}

export const useImageStore = create<LegacyImageStore>((set) => ({
  images: [],
  fetchImages: async () => {
    try {
      const images: LegacyImage[] = await window.electron.invoke('list-images')
      set({ images })
    } catch (error) {
      console.error('Error fetching images:', error)
    }
  },
  deleteImage: async (id: string) => {
    try {
      const images: LegacyImage[] = await window.electron.invoke('delete-image', id)
      set({ images })
    } catch (error) {
      console.error('Error deleting image:', error)
    }
  }
}))

interface LegacyVideoStore {
  videos: LegacyVideo[]
  fetchVideos: () => Promise<void>
  deleteVideo: (id: string) => Promise<void>
}

interface LegacyVideo {
  id: string
  name: string
  filePath: string
  duration: number
  size: number
  createdAt: string
}

export const useVideoStore = create<LegacyVideoStore>((set) => ({
  videos: [],
  fetchVideos: async () => {
    try {
      const videos: LegacyVideo[] = await window.electron.invoke('list-videos')
      set({ videos })
    } catch (error) {
      console.error('Error fetching videos:', error)
    }
  },
  deleteVideo: async (id: string) => {
    try {
      const videos: LegacyVideo[] = await window.electron.invoke('delete-video', id)
      set({ videos })
    } catch (error) {
      console.error('Error deleting video:', error)
    }
  }
}))

interface LegacyAudioStore {
  audio: LegacyAudio[]
  fetchAudio: () => Promise<void>
  deleteAudio: (id: string) => Promise<void>
}

interface LegacyAudio {
  id: string
  name: string
  filePath: string
  duration: number
  size: number
  createdAt: string
}

export const useAudioStore = create<LegacyAudioStore>((set) => ({
  audio: [],
  fetchAudio: async () => {
    try {
      const audio: LegacyAudio[] = await window.electron.invoke('list-audio')
      set({ audio })
    } catch (error) {
      console.error('Error fetching audio:', error)
    }
  },
  deleteAudio: async (id: string) => {
    try {
      const audio: LegacyAudio[] = await window.electron.invoke('delete-audio', id)
      set({ audio })
    } catch (error) {
      console.error('Error deleting audio:', error)
    }
  }
}))
