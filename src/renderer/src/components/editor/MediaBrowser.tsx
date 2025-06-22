import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Search, Image, Video, X, Check } from 'lucide-react'
import type { Media } from '@renderer/types/database'

interface MediaBrowserProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (file: Media) => void
  mediaType?: 'image' | 'video' | 'all'
  title?: string
}

export const MediaBrowser: React.FC<MediaBrowserProps> = ({
  isOpen,
  onClose,
  onSelect,
  mediaType = 'all',
  title = 'Select Media'
}) => {
  const [media, setMedia] = useState<Media[]>([])
  const [filteredMedia, setFilteredMedia] = useState<Media[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<Media | null>(null)

  // Fetch media files
  const fetchMedia = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      console.log('🔍 Fetching media files...')
      const files = await window.electron?.invoke('list-media-files')
      console.log('📁 Media files fetched:', files)
      console.log('📊 Number of files:', files.length)
      setMedia(files)
    } catch (error) {
      console.error('❌ Failed to fetch media files:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Filter media based on type and search
  useEffect(() => {
    let filtered = media

    // Filter by media type
    if (mediaType !== 'all') {
      filtered = filtered.filter((file) => file.type === mediaType)
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((file) =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredMedia(filtered)
  }, [media, mediaType, searchQuery])

  // Fetch media when component opens
  useEffect(() => {
    if (isOpen) {
      fetchMedia()
      setSearchQuery('')
      setSelectedFile(null)
    }
  }, [isOpen, fetchMedia])

  // Get media URL for display
  const getMediaUrl = useCallback(async (filename: string): Promise<string> => {
    try {
      console.log('🖼️ Loading URL for file:', filename)

      // For Electron, we need to convert file URLs to data URLs for display
      const dataUrl = await window.electron?.invoke('get-media-data-url', filename)

      console.log('🔗 Generated data URL length:', dataUrl ? dataUrl.length : 0)
      return dataUrl || ''
    } catch (error) {
      console.error('❌ Failed to get media URL:', error)
      return ''
    }
  }, [])

  const handleSelect = useCallback(
    async (file: Media) => {
      if (onSelect) {
        // Convert to data URL for preview
        try {
          const dataUrl = await window.electron?.invoke('get-media-data-url', file.filename)
          const mediaWithDataUrl = {
            ...file,
            dataUrl: dataUrl || undefined
          }
          onSelect(mediaWithDataUrl)
        } catch (error) {
          console.error('Failed to get data URL for media:', file.filename, error)
          onSelect(file) // Fall back to original file without data URL
        }
      }
      onClose?.()
    },
    [onSelect, onClose]
  )

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg w-[800px] h-[600px] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-semibold text-card-foreground">{title}</h3>
          <Button onClick={onClose} variant="ghost" size="sm">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search media files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Media Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-muted-foreground">Loading media files...</div>
            </div>
          ) : filteredMedia.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <div className="mb-2">No media files found</div>
                {searchQuery && (
                  <div className="text-sm">
                    Try adjusting your search or upload some media files
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {filteredMedia.map((file) => (
                <MediaThumbnail
                  key={file.id}
                  file={file}
                  isSelected={selectedFile?.id === file.id}
                  onClick={() => setSelectedFile(file)}
                  getMediaUrl={getMediaUrl}
                  formatFileSize={formatFileSize}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedFile ? `Selected: ${selectedFile.name}` : 'Select a media file'}
          </div>
          <div className="flex gap-2">
            <Button onClick={onClose} variant="outline">
              Cancel
            </Button>
            <Button onClick={() => handleSelect(selectedFile as Media)} disabled={!selectedFile}>
              <Check className="w-4 h-4 mr-2" />
              Select
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Media thumbnail component
interface MediaThumbnailProps {
  file: Media
  isSelected: boolean
  onClick: () => void
  getMediaUrl: (filename: string) => Promise<string>
  formatFileSize: (bytes: number) => string
}

const MediaThumbnail: React.FC<MediaThumbnailProps> = ({
  file,
  isSelected,
  onClick,
  getMediaUrl,
  formatFileSize
}) => {
  const [mediaUrl, setMediaUrl] = useState<string>('')

  useEffect(() => {
    const loadUrl = async (): Promise<void> => {
      const url = await getMediaUrl(file.filename)
      setMediaUrl(url)
    }
    loadUrl()
  }, [file.filename, getMediaUrl])

  return (
    <div
      className={`relative border-2 rounded-lg p-2 cursor-pointer transition-all hover:border-primary/50 ${
        isSelected ? 'border-primary bg-primary/10' : 'border-border'
      }`}
      onClick={onClick}
    >
      <div className="aspect-square bg-muted rounded mb-2 overflow-hidden flex items-center justify-center">
        {file.type === 'image' && mediaUrl ? (
          <img
            src={mediaUrl}
            alt={file.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error('❌ Failed to load image:', file.filename, mediaUrl)
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              target.nextElementSibling?.classList.remove('hidden')
            }}
          />
        ) : file.type === 'video' && mediaUrl ? (
          <video
            src={mediaUrl}
            className="w-full h-full object-cover"
            muted
            onError={(e) => {
              const target = e.target as HTMLVideoElement
              target.style.display = 'none'
              target.nextElementSibling?.classList.remove('hidden')
            }}
          />
        ) : null}

        {/* Fallback icon */}
        <div className={`flex items-center justify-center ${mediaUrl ? 'hidden' : ''}`}>
          {file.type === 'image' ? (
            <Image className="w-8 h-8 text-muted-foreground" />
          ) : file.type === 'video' ? (
            <Video className="w-8 h-8 text-muted-foreground" />
          ) : null}
        </div>
      </div>

      <div className="text-xs">
        <div className="font-medium truncate" title={file.name}>
          {file.name}
        </div>
        <div className="text-muted-foreground">{formatFileSize(file.size)}</div>
        <div className="text-muted-foreground capitalize">{file.type}</div>
      </div>

      {isSelected && (
        <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
          <Check className="w-3 h-3" />
        </div>
      )}
    </div>
  )
}
