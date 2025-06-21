import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSongStore } from '@renderer/store/song'
import { usePresentationStore } from '@renderer/store/presentation'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Trash2, Plus, Search, Music, FileText, FileImage, Edit, Upload } from 'lucide-react'
import type { Media, Song, Presentation } from '@renderer/types/database'

type CollectionType = 'songs' | 'slides' | 'media'

// Type for slide data from legacy store
type SlideData = {
  id: string
  title: string
  content: string
  createdAt: string
}

// Simple media file type for file-based storage
type MediaFile = {
  id: string
  name: string
  filename: string
  type: 'image' | 'video' | 'audio'
  size: number
  createdAt: number
  path: string
}

// Union type for all possible data types in the collection
type CollectionData = Song | Media | SlideData | Presentation | MediaFile

const collectionTabs = [
  { key: 'songs', label: 'Songs', icon: Music },
  { key: 'slides', label: 'Presentations', icon: FileText },
  { key: 'media', label: 'Media', icon: FileImage }
] as const

export default function Collection(): JSX.Element {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<CollectionType>('songs')
  const [searchQuery, setSearchQuery] = useState('')

  // New database stores
  const { songs, loading: songsLoading, error: songsError, fetchSongs, deleteSong } = useSongStore()

  // Media state (file-based, not using media store)
  const [media, setMedia] = useState<
    Array<{
      id: string
      name: string
      filename: string
      type: 'image' | 'video' | 'audio'
      size: number
      createdAt: number
      path: string
    }>
  >([])
  const [mediaLoading, setMediaLoading] = useState(false)
  const [mediaError, setMediaError] = useState<string | null>(null)

  // Media functions
  const fetchMedia = useCallback(async (): Promise<void> => {
    try {
      setMediaLoading(true)
      setMediaError(null)
      const files = await window.electron.ipcRenderer.invoke('list-media-files')
      setMedia(files)
    } catch (error) {
      console.error('Failed to fetch media files:', error)
      setMediaError('Failed to load media files')
    } finally {
      setMediaLoading(false)
    }
  }, [])

  const deleteMedia = useCallback(
    async (filename: string): Promise<void> => {
      try {
        const success = await window.electron.ipcRenderer.invoke('delete-media-file', filename)
        if (success) {
          await fetchMedia() // Refresh the list
        }
      } catch (error) {
        console.error('Failed to delete media file:', error)
      }
    },
    [fetchMedia]
  )

  // Legacy slide store (keeping for potential future use)
  // const {
  //   slides,
  //   loading: slidesLoading,
  //   error: slidesError,
  //   fetchSlides,
  //   deleteSlide
  // } = useSlideStore()

  // New presentation store
  const {
    presentations,
    isLoading: presentationsLoading,
    error: presentationsError,
    loadPresentations,
    deletePresentation
  } = usePresentationStore()

  // Fetch data when tab changes
  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        console.log(`Fetching data for tab: ${activeTab}`)
        switch (activeTab) {
          case 'songs':
            await fetchSongs()
            console.log('Songs fetched:', songs.length)
            break
          case 'slides':
            await loadPresentations()
            console.log('Presentations fetched:', presentations.length)
            break
          case 'media':
            await fetchMedia()
            console.log('Media fetched:', media.length)
            break
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [activeTab, fetchSongs, loadPresentations, fetchMedia])

  // Get filtered data based on active tab and search
  const getFilteredData = (): CollectionData[] => {
    switch (activeTab) {
      case 'songs':
        return searchQuery
          ? songs.filter(
              (song) =>
                song.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                song.artist?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                song.lyrics.toLowerCase().includes(searchQuery.toLowerCase())
            )
          : songs
      case 'slides':
        return searchQuery
          ? presentations.filter(
              (presentation) =>
                presentation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                presentation.slides.some(
                  (slide) =>
                    slide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    slide.content.toLowerCase().includes(searchQuery.toLowerCase())
                )
            )
          : presentations
      case 'media':
        return searchQuery
          ? media.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
          : media
      default:
        return []
    }
  }

  const filteredData = getFilteredData()
  const loading = songsLoading || mediaLoading || presentationsLoading
  const error = songsError || mediaError || presentationsError

  // Helper functions
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Action handlers
  const handleCreateSong = (): void => {
    navigate('/editor-v2?mode=song&action=create')
  }

  const handleEditSong = (songId: string): void => {
    navigate(`/editor-v2?mode=song&action=edit&id=${songId}`)
  }

  const handleCreateSlide = (): void => {
    navigate('/editor-v2?mode=slide&action=create')
  }

  const handleEditPresentation = (presentationId: string): void => {
    navigate(`/editor-v2?mode=slide&action=edit&id=${presentationId}`)
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (!id || id.trim() === '') {
      console.error('Cannot delete item: ID is empty or undefined')
      return
    }

    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      switch (activeTab) {
        case 'songs':
          await deleteSong(id)
          break
        case 'slides':
          await deletePresentation(id)
          break
        case 'media':
          await deleteMedia(id)
          break
      }
    } catch (error) {
      console.error('Failed to delete item:', error)
    }
  }

  const getAddButtonText = (): string => {
    switch (activeTab) {
      case 'songs':
        return 'Add Song'
      case 'slides':
        return 'Add Presentation'
      case 'media':
        return 'Add Media'
      default:
        return 'Add Item'
    }
  }

  const handleAddMedia = useCallback((): void => {
    // Create a file input element to allow users to select files
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*,video/*,audio/*'
    input.multiple = true

    input.onchange = async (event) => {
      const files = (event.target as HTMLInputElement).files
      if (!files) return

      try {
        const fileData: { name: string; path: string; data: Uint8Array }[] = []

        for (const file of Array.from(files)) {
          // Read file as array buffer
          const arrayBuffer = await file.arrayBuffer()
          const data = new Uint8Array(arrayBuffer)

          fileData.push({
            name: file.name,
            path: file.name, // Not used in the simplified version
            data
          })
        }

        // Upload all files at once
        const results = await window.electron.ipcRenderer.invoke('upload-media-files', fileData)

        console.log(`✅ Successfully uploaded ${results.length} files`)

        // Refresh the media list
        await fetchMedia()
      } catch (error) {
        console.error('❌ Failed to upload files:', error)
      }
    }

    input.click()
  }, [fetchMedia])

  const handleAdd = (): void => {
    switch (activeTab) {
      case 'songs':
        handleCreateSong()
        break
      case 'slides':
        handleCreateSlide()
        break
      case 'media':
        handleAddMedia()
        break
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Collection</h1>
        <Button onClick={handleAdd} size="sm">
          {activeTab === 'media' ? (
            <Upload className="h-4 w-4 mr-2" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          {getAddButtonText()}
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        {collectionTabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={`Search ${activeTab}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Content */}
      <div className="border rounded-lg">
        {activeTab === 'songs' && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-muted text-foreground">
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">Artist</th>
                  <th className="px-4 py-3 text-left">Tags</th>
                  <th className="px-4 py-3 text-left">Created</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No songs found. Click &quot;Add Song&quot; to create one.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((song) => (
                    <tr key={song.id} className="border-t hover:bg-accent/20">
                      <td className="px-4 py-3 font-medium">{(song as Song).name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {(song as Song).artist || '—'}
                      </td>
                      <td className="px-4 py-3">
                        {(song as Song).tags?.length > 0 ? (
                          <div className="flex gap-1">
                            {(song as Song).tags.slice(0, 2).map((tag: string) => (
                              <span
                                key={tag}
                                className="bg-secondary text-secondary-foreground px-2 py-1 rounded-sm text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                            {(song as Song).tags.length > 2 && (
                              <span className="text-muted-foreground text-xs">
                                +{(song as Song).tags.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date((song as Song).createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditSong(song.id)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(song.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'slides' && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-muted text-foreground">
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">Speaker</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Slides</th>
                  <th className="px-4 py-3 text-left">Created</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No presentations found. Click &quot;Add Presentation&quot; to create one.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((presentation) => (
                    <tr key={presentation.id} className="border-t hover:bg-accent/20">
                      <td className="px-4 py-3 font-medium">
                        {(presentation as Presentation).name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {(presentation as Presentation).speaker || '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground capitalize">
                        {(presentation as Presentation).type}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {(presentation as Presentation).slides.length} slides
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date((presentation as Presentation).createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditPresentation(presentation.id)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(presentation.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'media' && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-muted text-foreground">
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">File</th>
                  <th className="px-4 py-3 text-left">Size</th>
                  <th className="px-4 py-3 text-left">Duration</th>
                  <th className="px-4 py-3 text-left">Created</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      No media found. Click &quot;Add Media&quot; to upload files.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.id} className="border-t hover:bg-accent/20">
                      <td className="px-4 py-3 font-medium">{(item as MediaFile).name}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground capitalize">
                          {(item as MediaFile).type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                        {(item as MediaFile).filename}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatFileSize((item as MediaFile).size)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">—</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date((item as MediaFile).createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMedia((item as MediaFile).filename)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer with stats */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredData.length} {activeTab}
        {searchQuery && ` matching "${searchQuery}"`}
      </div>
    </div>
  )
}
