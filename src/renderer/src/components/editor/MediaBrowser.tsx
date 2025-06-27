import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@renderer/components/ui/dialog'
import { Search, Image, Video, Check, Music, File } from 'lucide-react'
import type { Media } from '@renderer/types/database'

interface MediaBrowserProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (file: Media) => void
  mediaType?: 'image' | 'video' | 'audio' | 'all'
  title?: string
}

export const MediaBrowser: React.FC<MediaBrowserProps> = React.memo(
  ({ isOpen, onClose, onSelect, mediaType = 'all', title = 'Select Media' }) => {
    // Only log when actually open to reduce noise
    if (isOpen) {
      console.log('🎯 MediaBrowser render:', { isOpen, mediaType, title })
    }
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
        console.log('📊 Number of files:', (files as Media[])?.length || 0)
        setMedia((files as Media[]) || [])
      } catch (error) {
        console.error('❌ Failed to fetch media files:', error)
      } finally {
        setLoading(false)
      }
    }, [])

    // Filter media based on type and search
    useEffect(() => {
      let filtered = media

      console.log('🔍 [MEDIA_BROWSER] Filtering media:', {
        totalFiles: media.length,
        mediaType,
        searchQuery,
        fileTypes: media.map(f => f.type)
      })

      // Filter by media type
      if (mediaType !== 'all') {
        filtered = filtered.filter((file) => file.type === mediaType)
        console.log('🎯 [MEDIA_BROWSER] After type filter:', {
          mediaType,
          filteredCount: filtered.length,
          filteredTypes: filtered.map(f => f.type)
        })
      }

      // Filter by search query
      if (searchQuery) {
        filtered = filtered.filter((file) =>
          file.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        console.log('🔍 [MEDIA_BROWSER] After search filter:', {
          searchQuery,
          filteredCount: filtered.length
        })
      }

      setFilteredMedia(filtered)
      console.log('✅ [MEDIA_BROWSER] Final filtered media:', filtered.length, 'files')
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
        console.log('🖼️ [MEDIA_BROWSER] Loading URL for file:', filename)

        // First, check if we already have a URL for this file in our media array
        const existingMedia = media.find(m => m.filename === filename)
        if (existingMedia && existingMedia.url) {
          console.log('✅ [MEDIA_BROWSER] Using existing URL from media object:', existingMedia.url)
          return existingMedia.url
        }

        // Check if electron API is available
        if (!window.electron?.invoke) {
          console.error('❌ [MEDIA_BROWSER] Electron API not available')
          return ''
        }

        // For Electron, we need to convert file URLs to data URLs for display
        console.log('🔄 [MEDIA_BROWSER] Calling get-media-data-url for:', filename)
        const dataUrl = await window.electron.invoke('get-media-data-url', filename)

        if (!dataUrl) {
          console.warn('⚠️ [MEDIA_BROWSER] No data URL returned for:', filename)
          
          // Fallback: Try getting the file path and use it directly
          try {
            console.log('🔄 [MEDIA_BROWSER] Trying fallback file path for:', filename)
            const filePath = await window.electron.invoke('get-media-file-path', filename)
            if (filePath) {
              console.log('✅ [MEDIA_BROWSER] Using file path:', filePath)
              return `file://${filePath}`
            }
          } catch (pathError) {
            console.error('❌ [MEDIA_BROWSER] Fallback file path failed:', pathError)
          }
          
          return ''
        }

        const urlLength = (dataUrl as string)?.length || 0
        console.log('🔗 [MEDIA_BROWSER] Generated data URL length:', urlLength, 'for file:', filename)
        
        if (urlLength < 100) {
          console.warn('⚠️ [MEDIA_BROWSER] Data URL seems too short, might be invalid:', dataUrl)
        }

        return (dataUrl as string) || ''
      } catch (error) {
        console.error('❌ [MEDIA_BROWSER] Failed to get media URL for:', filename, error)
        return ''
      }
    }, [media])

    const handleSelect = useCallback(
      async (file: Media) => {
        if (onSelect) {
          // Return media reference instead of data URL
          const mediaWithReference = {
            ...file,
            mediaReference: `media://${file.filename}`
          }
          console.log(
            '🎯 [MEDIA_BROWSER] Selected media object:',
            {
              filename: file.filename,
              name: file.name,
              type: file.type,
              size: file.size,
              id: file.id,
              mediaReference: mediaWithReference.mediaReference
            }
          )
          onSelect(mediaWithReference)
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

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col h-[70vh] gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search media files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Media Grid */}
            <div className="flex-1 overflow-y-auto">
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
                    {/* Debug info */}
                    <div className="text-xs mt-4 p-2 bg-muted rounded">
                      <div>Total media files: {media.length}</div>
                      <div>Media type filter: {mediaType}</div>
                      <div>Search query: "{searchQuery}"</div>
                      {media.length > 0 && (
                        <div>Available types: {Array.from(new Set(media.map(f => f.type))).join(', ')}</div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-4 p-2">
                  {filteredMedia.map((file) => (
                    <MediaThumbnail
                      key={file.filename || file.id}
                      file={file}
                      isSelected={selectedFile?.filename === file.filename}
                      onClick={() => {
                        console.log('🎯 Media thumbnail clicked:', file.name, file.filename)
                        console.log('🎯 Current selectedFile?.filename:', selectedFile?.filename)
                        console.log('🎯 File.filename:', file.filename)
                        console.log('🎯 Filenames match:', selectedFile?.filename === file.filename)
                        setSelectedFile(file)
                        console.log('🎯 Selected file set to:', file)
                      }}
                      getMediaUrl={getMediaUrl}
                      formatFileSize={formatFileSize}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Selection Status */}
            <div className="text-sm text-muted-foreground border-t pt-3">
              {selectedFile ? `Selected: ${selectedFile.name}` : 'Select a media file'}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                console.log('🎯 Select button clicked', { selectedFile })
                if (selectedFile) {
                  handleSelect(selectedFile as Media)
                } else {
                  console.log('🎯 No file selected')
                }
              }}
              disabled={!selectedFile}
            >
              <Check className="w-4 h-4 mr-2" />
              Select
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }
)

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
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const loadUrl = async (): Promise<void> => {
      try {
        setIsLoading(true)
        setHasError(false)
        console.log('🔄 [MEDIA_THUMBNAIL] Loading URL for:', file.filename)
        
        const url = await getMediaUrl(file.filename)
        setMediaUrl(url)
        
        if (!url) {
          console.warn('⚠️ [MEDIA_THUMBNAIL] No URL received for:', file.filename)
          setHasError(true)
        } else {
          console.log('✅ [MEDIA_THUMBNAIL] URL loaded for:', file.filename, 'Length:', url.length)
        }
      } catch (error) {
        console.error('❌ [MEDIA_THUMBNAIL] Error loading URL for:', file.filename, error)
        setHasError(true)
      } finally {
        setIsLoading(false)
      }
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
      <div className="aspect-square bg-muted rounded mb-2 overflow-hidden flex items-center justify-center relative">
        {/* Loading indicator */}
        {isLoading && file.type !== 'audio' && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/80">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
          </div>
        )}

        {file.type === 'image' ? (
          mediaUrl && !hasError && !isLoading ? (
            <img
              src={mediaUrl}
              alt={file.name}
              className="w-full h-full object-cover"
              onLoad={() => {
                console.log('✅ [MEDIA_THUMBNAIL] Image loaded successfully:', file.filename)
              }}
              onError={() => {
                console.error('❌ [MEDIA_THUMBNAIL] Failed to load image:', file.filename, 'URL length:', mediaUrl?.length)
                setHasError(true)
              }}
            />
          ) : (
            <div className="flex items-center justify-center">
              <Image className="w-8 h-8 text-muted-foreground" />
              {hasError && <div className="absolute bottom-1 right-1 text-xs text-red-500">⚠️</div>}
            </div>
          )
        ) : file.type === 'video' ? (
          mediaUrl && !hasError && !isLoading ? (
            <video
              src={mediaUrl}
              className="w-full h-full object-cover"
              muted
              preload="metadata"
              onLoadedMetadata={() => {
                console.log('✅ [MEDIA_THUMBNAIL] Video metadata loaded successfully:', file.filename, 'URL:', mediaUrl.substring(0, 50) + '...')
              }}
              onError={() => {
                console.error('❌ [MEDIA_THUMBNAIL] Failed to load video:', file.filename, 'URL:', mediaUrl.substring(0, 100) + '...', 'URL length:', mediaUrl?.length)
                setHasError(true)
              }}
              onLoadStart={() => {
                console.log('🔄 [MEDIA_THUMBNAIL] Video load started:', file.filename)
              }}
            />
          ) : (
            <div className="flex items-center justify-center">
              <Video className="w-8 h-8 text-muted-foreground" />
              {hasError && <div className="absolute bottom-1 right-1 text-xs text-red-500">⚠️</div>}
            </div>
          )
        ) : null}

        {/* Audio files - always show icon since we can't preview audio visually */}
        {file.type === 'audio' && (
          <div className="flex flex-col items-center justify-center text-center p-2">
            <Music className="w-12 h-12 text-muted-foreground mb-2" />
            <div className="text-xs font-medium truncate max-w-full" title={file.name}>
              {file.name.length > 15 ? file.name.substring(0, 15) + '...' : file.name}
            </div>
            <div className="text-xs text-muted-foreground">Audio File</div>
          </div>
        )}

        {/* Fallback icons for unknown file types */}
        {!['image', 'video', 'audio'].includes(file.type) && (
          <div className="flex items-center justify-center">
            <File className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
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
