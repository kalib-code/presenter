import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSongStore } from '@renderer/store/song'
import { useMediaStore, useSlideStore } from '@renderer/store/media'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import {
  Trash2,
  Plus,
  Search,
  Music,
  FileText,
  FileImage,
  Video,
  Headphones,
  Edit
} from 'lucide-react'
import type { Media, Song } from '@renderer/types/database'

type CollectionType = 'songs' | 'slides' | 'images' | 'video' | 'audio'

// Type for slide data from legacy store
type SlideData = {
  id: string
  title: string
  content: string
  createdAt: string
}

// Union type for all possible data types in the collection
type CollectionData = Song | Media | SlideData

const collectionTabs = [
  { key: 'songs', label: 'Songs', icon: Music },
  { key: 'slides', label: 'Slides', icon: FileText },
  { key: 'images', label: 'Images', icon: FileImage },
  { key: 'video', label: 'Video', icon: Video },
  { key: 'audio', label: 'Audio', icon: Headphones }
] as const

export default function Collection(): JSX.Element {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<CollectionType>('songs')
  const [searchQuery, setSearchQuery] = useState('')

  // New database stores
  const { songs, loading: songsLoading, error: songsError, fetchSongs, deleteSong } = useSongStore()

  const {
    media,
    loading: mediaLoading,
    error: mediaError,
    fetchMedia,
    createMedia,
    deleteMedia
  } = useMediaStore()

  // Legacy slide store (will be migrated later)
  const {
    slides,
    loading: slidesLoading,
    error: slidesError,
    fetchSlides,
    deleteSlide
  } = useSlideStore()

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
            await fetchSlides()
            console.log('Slides fetched:', slides.length)
            break
          case 'images':
          case 'video':
          case 'audio':
            await fetchMedia()
            console.log('Media fetched:', media.length)
            break
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [activeTab, fetchSongs, fetchSlides, fetchMedia])

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
          ? slides.filter(
              (slide) =>
                slide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                slide.content.toLowerCase().includes(searchQuery.toLowerCase())
            )
          : slides
      case 'images':
        return searchQuery
          ? media.filter(
              (item) =>
                item.type === 'image' && item.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
          : media.filter((item) => item.type === 'image')
      case 'video':
        return searchQuery
          ? media.filter(
              (item) =>
                item.type === 'video' && item.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
          : media.filter((item) => item.type === 'video')
      case 'audio':
        return searchQuery
          ? media.filter(
              (item) =>
                item.type === 'audio' && item.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
          : media.filter((item) => item.type === 'audio')
      default:
        return []
    }
  }

  const filteredData = getFilteredData()
  const loading = songsLoading || mediaLoading || slidesLoading
  const error = songsError || mediaError || slidesError

  // Helper functions
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Action handlers
  const handleCreateSong = (): void => {
    navigate('/editor?mode=song&action=create')
  }

  const handleEditSong = (songId: string): void => {
    navigate(`/editor?mode=song&action=edit&id=${songId}`)
  }

  const handleCreateSlide = (): void => {
    navigate('/editor?mode=slide&action=create')
  }

  const handleEditSlide = (slideId: string): void => {
    navigate(`/editor?mode=slide&action=edit&id=${slideId}`)
  }

  const handleAddMedia = async (type: Media['type']): Promise<void> => {
    const name = prompt(`Enter ${type} name:`)
    if (name) {
      try {
        await createMedia({
          name,
          filename: `${name.toLowerCase().replace(/\s+/g, '-')}.${type === 'image' ? 'jpg' : type === 'video' ? 'mp4' : 'mp3'}`,
          path: `/media/${name}`,
          type,
          mimeType: type === 'image' ? 'image/jpeg' : type === 'video' ? 'video/mp4' : 'audio/mpeg',
          size: 0,
          tags: [],
          isPublic: true,
          checksum: 'placeholder',
          createdBy: 'user'
        })
      } catch (error) {
        console.error(`Failed to create ${type}:`, error)
      }
    }
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
          await deleteSlide(id)
          break
        case 'images':
        case 'video':
        case 'audio':
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
        return 'Add Slide'
      case 'images':
        return 'Add Image'
      case 'video':
        return 'Add Video'
      case 'audio':
        return 'Add Audio'
      default:
        return 'Add Item'
    }
  }

  const handleAdd = (): void => {
    switch (activeTab) {
      case 'songs':
        handleCreateSong()
        break
      case 'slides':
        handleCreateSlide()
        break
      case 'images':
        handleAddMedia('image')
        break
      case 'video':
        handleAddMedia('video')
        break
      case 'audio':
        handleAddMedia('audio')
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
          <Plus className="h-4 w-4 mr-2" />
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
                  <th className="px-4 py-3 text-left">Content</th>
                  <th className="px-4 py-3 text-left">Created</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      No slides found. Click &quot;Add Slide&quot; to create one.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((slide) => (
                    <tr key={slide.id} className="border-t hover:bg-accent/20">
                      <td className="px-4 py-3 font-medium">{(slide as SlideData).title}</td>
                      <td className="px-4 py-3 max-w-xs truncate">
                        {(slide as SlideData).content}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date((slide as SlideData).createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditSlide(slide.id)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(slide.id)}
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

        {(activeTab === 'images' || activeTab === 'video' || activeTab === 'audio') && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-muted text-foreground">
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">File</th>
                  <th className="px-4 py-3 text-left">Size</th>
                  {activeTab === 'video' || activeTab === 'audio' ? (
                    <th className="px-4 py-3 text-left">Duration</th>
                  ) : null}
                  <th className="px-4 py-3 text-left">Created</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={activeTab === 'images' ? 5 : 6}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      No {activeTab} found. Click &quot;Add{' '}
                      {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}&quot; to create one.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.id} className="border-t hover:bg-accent/20">
                      <td className="px-4 py-3 font-medium">{(item as Media).name}</td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                        {(item as Media).filename}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatFileSize((item as Media).size)}
                      </td>
                      {(activeTab === 'video' || activeTab === 'audio') &&
                        (item as Media).duration && (
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatDuration((item as Media).duration!)}
                          </td>
                        )}
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date((item as Media).createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
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
