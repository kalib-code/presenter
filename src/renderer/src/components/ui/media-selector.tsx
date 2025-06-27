import React, { useState, useRef, useEffect } from 'react'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Checkbox } from './checkbox'
import { Slider } from './slider'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { File, Play, Pause, Volume2, VolumeX, FolderOpen } from 'lucide-react'
import type { SetlistItem, Media } from '@renderer/types/database'
import { MediaBrowser } from '../editor/MediaBrowser'
import { resolveMediaUrl } from '@renderer/utils/mediaUtils'

interface MediaSelectorProps {
  isOpen: boolean
  onClose: () => void
  onAddMedia: (mediaItem: Omit<SetlistItem, 'id' | 'order'>) => void
  mediaType?: 'video' | 'image' | 'audio' | 'any'
}

export function MediaSelector({
  isOpen,
  onClose,
  onAddMedia,
  mediaType = 'any'
}: MediaSelectorProps) {
  // Log when component opens/closes
  React.useEffect(() => {
    if (isOpen) {
      console.log('🎯 [MEDIA_SELECTOR] Component opened with mediaType:', mediaType)
    } else {
      console.log('🔄 [MEDIA_SELECTOR] Component closed')
    }
  }, [isOpen, mediaType])
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null)
  const [title, setTitle] = useState('')
  const [duration, setDuration] = useState<number>(0)
  const [autoplay, setAutoplay] = useState(false)
  const [loop, setLoop] = useState(false)
  const [controls, setControls] = useState(true)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '4:3' | '1:1' | 'auto'>('16:9')
  const [objectFit, setObjectFit] = useState<'cover' | 'contain' | 'fill' | 'scale-down'>('contain')
  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(0)
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false)

  // Background audio state (for video and image items)
  const [backgroundAudioMedia, setBackgroundAudioMedia] = useState<Media | null>(null)
  const [backgroundAudioVolume, setBackgroundAudioVolume] = useState(0.5)
  const [backgroundAudioLoop, setBackgroundAudioLoop] = useState(false)
  const [backgroundAudioAutoplay, setBackgroundAudioAutoplay] = useState(false)
  const [backgroundAudioFadeIn, setBackgroundAudioFadeIn] = useState(0)
  const [backgroundAudioFadeOut, setBackgroundAudioFadeOut] = useState(0)

  // Media browser state
  const [isMediaBrowserOpen, setIsMediaBrowserOpen] = useState(false)
  const [isBackgroundAudioBrowserOpen, setIsBackgroundAudioBrowserOpen] = useState(false)

  // Preview URL resolution state
  const [resolvedPreviewUrl, setResolvedPreviewUrl] = useState<string>('')
  const [isResolvingPreviewUrl, setIsResolvingPreviewUrl] = useState(false)

  const previewRef = useRef<HTMLVideoElement | HTMLAudioElement>(null)

  // Resolve preview URL when selected media changes
  useEffect(() => {
    const resolvePreviewUrl = async () => {
      if (!selectedMedia?.filename) {
        setResolvedPreviewUrl('')
        return
      }

      console.log('🎬 [MEDIA_SELECTOR] Resolving preview URL for:', selectedMedia.filename)
      setIsResolvingPreviewUrl(true)

      try {
        const mediaUrl = `media://${selectedMedia.filename}`
        const resolved = await resolveMediaUrl(mediaUrl)
        console.log('🎬 [MEDIA_SELECTOR] Preview URL resolved:', {
          original: mediaUrl,
          resolved: resolved,
          type: selectedMedia.type
        })
        setResolvedPreviewUrl(resolved)
      } catch (error) {
        console.error('❌ [MEDIA_SELECTOR] Failed to resolve preview URL:', error)
        setResolvedPreviewUrl('')
      } finally {
        setIsResolvingPreviewUrl(false)
      }
    }

    resolvePreviewUrl()
  }, [selectedMedia?.filename, selectedMedia?.type])

  const getMediaBrowserType = (): 'image' | 'video' | 'audio' | 'all' => {
    switch (mediaType) {
      case 'video':
        return 'video'
      case 'image':
        return 'image'
      case 'audio':
        return 'audio'
      default:
        return 'all'
    }
  }

  const handleMediaSelect = (media: Media) => {
    try {
      console.log('🎯 [MEDIA_SELECTOR] Media selected:', media)
      
      // Validate media object
      if (!media) {
        console.error('❌ [MEDIA_SELECTOR] No media object provided')
        return
      }

      if (!media.name && !media.filename) {
        console.error('❌ [MEDIA_SELECTOR] Media object missing name and filename:', media)
        return
      }

      // Fix missing name and id fields
      if (!media.name && media.filename) {
        media.name = media.filename
        console.log('🔧 [MEDIA_SELECTOR] Fixed missing name field using filename')
      }
      
      if (!media.id && media.filename) {
        media.id = media.filename
        console.log('🔧 [MEDIA_SELECTOR] Fixed missing id field using filename')
      }

      setSelectedMedia(media)
      
      // Use name or filename, and safely remove file extension
      const displayName = media.name || media.filename || 'Untitled'
      const titleWithoutExtension = displayName ? displayName.replace(/\.[^/.]+$/, '') : 'Untitled'
      setTitle(titleWithoutExtension)
      
      console.log('🎯 [MEDIA_SELECTOR] Set title to:', titleWithoutExtension)
      setIsMediaBrowserOpen(false)

      // Get duration for video/audio files
      if (media.type === 'video' || media.type === 'audio') {
        // For media library files, we'll set a default duration and let the player determine the actual duration
        setDuration(0) // Will be updated when the media loads
        setEndTime(0)
      }
      console.log('✅ [MEDIA_SELECTOR] Media selection completed successfully')
    } catch (error) {
      console.error('❌ [MEDIA_SELECTOR] Error selecting media:', error)
    }
  }

  const handleBackgroundAudioSelect = (media: Media) => {
    try {
      console.log('🎯 [MEDIA_SELECTOR] Background audio selected:', media)
      if (media.type === 'audio') {
        setBackgroundAudioMedia(media)
        setIsBackgroundAudioBrowserOpen(false)
        console.log('✅ [MEDIA_SELECTOR] Background audio selection completed')
      } else {
        console.warn('⚠️ [MEDIA_SELECTOR] Selected media is not audio type:', media.type)
      }
    } catch (error) {
      console.error('❌ [MEDIA_SELECTOR] Error selecting background audio:', error)
    }
  }

  const handlePreviewToggle = () => {
    if (previewRef.current) {
      if (isPreviewPlaying) {
        previewRef.current.pause()
      } else {
        previewRef.current.play()
      }
      setIsPreviewPlaying(!isPreviewPlaying)
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    if (previewRef.current) {
      previewRef.current.volume = newVolume
    }
  }

  const handleBackgroundAudioVolumeChange = (value: number[]) => {
    setBackgroundAudioVolume(value[0])
  }

  const handleAddMedia = () => {
    try {
      if (!selectedMedia) {
        console.error('❌ [MEDIA_SELECTOR] No media selected')
        return
      }

      if (!title.trim()) {
        console.error('❌ [MEDIA_SELECTOR] No title provided')
        return
      }

      console.log('🎯 [MEDIA_SELECTOR] Creating media item:', {
        selectedMedia,
        title,
        duration,
        backgroundAudioMedia
      })

      const mediaItem: Omit<SetlistItem, 'id' | 'order'> = {
        type: selectedMedia.type,
        referenceId: selectedMedia.id || selectedMedia.filename || 'unknown',
        title: title || selectedMedia.name || selectedMedia.filename || 'Untitled',
        duration: duration,
        notes: '',
        isActive: true,
        mediaConfig: {
          url: `media://${selectedMedia.filename}`,
          autoplay,
          loop,
          volume,
          startTime,
          endTime: endTime || duration,
          controls,
          muted,
          mediaType: selectedMedia.type,
          aspectRatio,
          objectFit,
          // Include background audio if it's a video or image with background audio
          ...(backgroundAudioMedia &&
            (selectedMedia.type === 'video' || selectedMedia.type === 'image') && {
              backgroundAudio: {
                url: `media://${backgroundAudioMedia.filename}`,
                volume: backgroundAudioVolume,
                loop: backgroundAudioLoop,
                autoplay: backgroundAudioAutoplay,
                fadeIn: backgroundAudioFadeIn,
                fadeOut: backgroundAudioFadeOut
              }
            })
        }
      }

      console.log('✅ [MEDIA_SELECTOR] Media item created:', mediaItem)
      console.log('🚀 [MEDIA_SELECTOR] Calling onAddMedia...')
      
      onAddMedia(mediaItem)
      handleClose()
      
      console.log('✅ [MEDIA_SELECTOR] Media addition completed')
    } catch (error) {
      console.error('❌ [MEDIA_SELECTOR] Error adding media:', error)
    }
  }

  const handleClose = () => {
    try {
      console.log('🔄 [MEDIA_SELECTOR] Closing and resetting state')
      
      // Reset main media state
      setSelectedMedia(null)
      setTitle('')
      setDuration(0)
      setAutoplay(false)
      setLoop(false)
      setControls(true)
      setMuted(false)
      setVolume(1)
      setAspectRatio('16:9')
      setObjectFit('contain')
      setStartTime(0)
      setEndTime(0)
      setIsPreviewPlaying(false)
      
      // Reset preview URL state
      setResolvedPreviewUrl('')
      setIsResolvingPreviewUrl(false)
      
      // Reset background audio state
      setBackgroundAudioMedia(null)
      setBackgroundAudioVolume(0.5)
      setBackgroundAudioLoop(false)
      setBackgroundAudioAutoplay(false)
      setBackgroundAudioFadeIn(0)
      setBackgroundAudioFadeOut(0)
      
      // Reset browser state
      setIsMediaBrowserOpen(false)
      setIsBackgroundAudioBrowserOpen(false)
      
      console.log('✅ [MEDIA_SELECTOR] State reset completed')
      onClose()
    } catch (error) {
      console.error('❌ [MEDIA_SELECTOR] Error during close:', error)
      // Still try to close even if there's an error
      onClose()
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const renderPreview = () => {
    if (!selectedMedia) return null

    // Show loading state while resolving URL
    if (isResolvingPreviewUrl) {
      return (
        <div className="w-full max-h-48 flex items-center justify-center bg-muted rounded-lg">
          <div className="text-muted-foreground">Loading preview...</div>
        </div>
      )
    }

    // Show error state if URL couldn't be resolved
    if (!resolvedPreviewUrl) {
      return (
        <div className="w-full max-h-48 flex items-center justify-center bg-muted rounded-lg">
          <div className="text-muted-foreground">Preview not available</div>
        </div>
      )
    }

    switch (selectedMedia.type) {
      case 'video':
        return (
          <video
            ref={previewRef as React.RefObject<HTMLVideoElement>}
            src={resolvedPreviewUrl}
            className="w-full max-h-48 rounded-lg"
            controls={false}
            muted={muted}
            onPlay={() => setIsPreviewPlaying(true)}
            onPause={() => setIsPreviewPlaying(false)}
            onEnded={() => setIsPreviewPlaying(false)}
            onLoadStart={() => console.log('🎬 [MEDIA_SELECTOR] Video preview load started')}
            onCanPlay={() => console.log('🎬 [MEDIA_SELECTOR] Video preview can play')}
            onError={(e) => console.error('❌ [MEDIA_SELECTOR] Video preview failed to load:', e.nativeEvent)}
            style={{ objectFit }}
          />
        )
      case 'image':
        return (
          <img
            src={resolvedPreviewUrl}
            alt="Preview"
            className="w-full max-h-48 rounded-lg object-contain"
            onLoad={() => console.log('🖼️ [MEDIA_SELECTOR] Image preview loaded successfully')}
            onError={(e) => console.error('❌ [MEDIA_SELECTOR] Image preview failed to load:', e.nativeEvent)}
            style={{ objectFit }}
          />
        )
      case 'audio':
        return (
          <div className="flex items-center justify-center p-8 bg-muted rounded-lg">
            <audio
              ref={previewRef as React.RefObject<HTMLAudioElement>}
              src={resolvedPreviewUrl}
              onPlay={() => setIsPreviewPlaying(true)}
              onPause={() => setIsPreviewPlaying(false)}
              onEnded={() => setIsPreviewPlaying(false)}
              onLoadStart={() => console.log('🎵 [MEDIA_SELECTOR] Audio preview load started')}
              onCanPlay={() => console.log('🎵 [MEDIA_SELECTOR] Audio preview can play')}
              onError={(e) => console.error('❌ [MEDIA_SELECTOR] Audio preview failed to load:', e.nativeEvent)}
            />
            <div className="text-center">
              <File className="w-16 h-16 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">{selectedMedia.name}</p>
              <p className="text-xs text-muted-foreground">Audio File</p>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  const showVideoControls = selectedMedia && selectedMedia.type === 'video'
  const showAudioControls =
    selectedMedia && (selectedMedia.type === 'video' || selectedMedia.type === 'audio')

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Media to Setlist</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* File Selection */}
            <div className="space-y-4">
              <div>
                <Label>Select Media File</Label>
                <Button
                  variant="outline"
                  onClick={() => setIsMediaBrowserOpen(true)}
                  className="w-full mt-2"
                >
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Browse Media Library
                </Button>
                {selectedMedia && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Selected: {selectedMedia.name} ({(selectedMedia.size / 1024 / 1024).toFixed(2)}{' '}
                    MB)
                  </p>
                )}
              </div>

              {/* Title */}
              <div>
                <Label htmlFor="media-title">Title</Label>
                <Input
                  id="media-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Media title..."
                />
              </div>
            </div>

            {/* Preview */}
            {selectedMedia && (
              <div className="space-y-4">
                <Label>Preview</Label>
                <div className="relative">
                  {renderPreview()}

                  {/* Preview Controls */}
                  {showAudioControls && (
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <Button variant="outline" size="sm" onClick={handlePreviewToggle}>
                        {isPreviewPlaying ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                      <div className="flex items-center gap-2">
                        {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        <Slider
                          value={[volume]}
                          onValueChange={handleVolumeChange}
                          max={1}
                          step={0.1}
                          className="w-20"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Media Configuration */}
            {selectedMedia && (
              <div className="space-y-4">
                <Label>Media Settings</Label>

                {/* Basic Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="autoplay"
                      checked={autoplay}
                      onCheckedChange={(checked) => setAutoplay(!!checked)}
                    />
                    <Label htmlFor="autoplay">Auto-play</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="loop"
                      checked={loop}
                      onCheckedChange={(checked) => setLoop(!!checked)}
                    />
                    <Label htmlFor="loop">Loop</Label>
                  </div>

                  {showAudioControls && (
                    <>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="controls"
                          checked={controls}
                          onCheckedChange={(checked) => setControls(!!checked)}
                        />
                        <Label htmlFor="controls">Show Controls</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="muted"
                          checked={muted}
                          onCheckedChange={(checked) => setMuted(!!checked)}
                        />
                        <Label htmlFor="muted">Start Muted</Label>
                      </div>
                    </>
                  )}
                </div>

                {/* Video-specific settings */}
                {showVideoControls && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Aspect Ratio</Label>
                      <Select
                        value={aspectRatio}
                        onValueChange={(value: string) =>
                          setAspectRatio(value as '16:9' | '4:3' | '1:1' | 'auto')
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
                          <SelectItem value="4:3">4:3 (Standard)</SelectItem>
                          <SelectItem value="1:1">1:1 (Square)</SelectItem>
                          <SelectItem value="auto">Auto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Object Fit</Label>
                      <Select
                        value={objectFit}
                        onValueChange={(value: string) =>
                          setObjectFit(value as 'contain' | 'cover' | 'fill' | 'scale-down')
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="contain">Contain</SelectItem>
                          <SelectItem value="cover">Cover</SelectItem>
                          <SelectItem value="fill">Fill</SelectItem>
                          <SelectItem value="scale-down">Scale Down</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Timing Controls for Video/Audio */}
                {showAudioControls && duration > 0 && (
                  <div className="space-y-3">
                    <Label>Playback Timing</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="start-time">Start Time (seconds)</Label>
                        <Input
                          id="start-time"
                          type="number"
                          min="0"
                          max={duration}
                          value={startTime}
                          onChange={(e) => setStartTime(parseInt(e.target.value) || 0)}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTime(startTime)}
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="end-time">End Time (seconds)</Label>
                        <Input
                          id="end-time"
                          type="number"
                          min={startTime}
                          max={duration}
                          value={endTime}
                          onChange={(e) => setEndTime(parseInt(e.target.value) || duration)}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTime(endTime)} / {formatTime(duration)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Background Audio Section (for video and image items) */}
            {selectedMedia &&
              (selectedMedia.type === 'video' || selectedMedia.type === 'image') && (
                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Background Audio (Optional)</Label>
                    <p className="text-xs text-muted-foreground">Add background music or audio</p>
                  </div>

                  <div className="space-y-4">
                    {/* Background Audio File Selection */}
                    <div>
                      <Label>Audio File</Label>
                      <Button
                        variant="outline"
                        onClick={() => setIsBackgroundAudioBrowserOpen(true)}
                        className="w-full mt-2"
                      >
                        <FolderOpen className="w-4 h-4 mr-2" />
                        {backgroundAudioMedia ? 'Change Audio' : 'Choose Audio File'}
                      </Button>
                      {backgroundAudioMedia && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Selected: {backgroundAudioMedia.name} (
                          {(backgroundAudioMedia.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      )}
                    </div>

                    {/* Background Audio Settings */}
                    {backgroundAudioMedia && (
                      <div className="space-y-4 bg-muted/50 p-4 rounded-lg">
                        <div className="space-y-2">
                          <Label>
                            Background Audio Volume: {Math.round(backgroundAudioVolume * 100)}%
                          </Label>
                          <Slider
                            value={[backgroundAudioVolume]}
                            onValueChange={handleBackgroundAudioVolumeChange}
                            max={1}
                            step={0.1}
                            className="w-full"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="bg-audio-autoplay"
                              checked={backgroundAudioAutoplay}
                              onCheckedChange={(checked) => setBackgroundAudioAutoplay(!!checked)}
                            />
                            <Label htmlFor="bg-audio-autoplay">Auto-play</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="bg-audio-loop"
                              checked={backgroundAudioLoop}
                              onCheckedChange={(checked) => setBackgroundAudioLoop(!!checked)}
                            />
                            <Label htmlFor="bg-audio-loop">Loop</Label>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="fade-in">Fade In (seconds)</Label>
                            <Input
                              id="fade-in"
                              type="number"
                              min="0"
                              max="10"
                              step="0.5"
                              value={backgroundAudioFadeIn}
                              onChange={(e) =>
                                setBackgroundAudioFadeIn(parseFloat(e.target.value) || 0)
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="fade-out">Fade Out (seconds)</Label>
                            <Input
                              id="fade-out"
                              type="number"
                              min="0"
                              max="10"
                              step="0.5"
                              value={backgroundAudioFadeOut}
                              onChange={(e) =>
                                setBackgroundAudioFadeOut(parseFloat(e.target.value) || 0)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleAddMedia} disabled={!selectedMedia || !title.trim()}>
              Add to Setlist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Media Browser for main media selection */}
      <MediaBrowser
        isOpen={isMediaBrowserOpen}
        onClose={() => setIsMediaBrowserOpen(false)}
        onSelect={handleMediaSelect}
        mediaType={getMediaBrowserType()}
        title="Select Media File"
      />

      {/* Media Browser for background audio selection */}
      <MediaBrowser
        isOpen={isBackgroundAudioBrowserOpen}
        onClose={() => setIsBackgroundAudioBrowserOpen(false)}
        onSelect={handleBackgroundAudioSelect}
        mediaType="audio"
        title="Select Background Audio"
      />
    </>
  )
}
