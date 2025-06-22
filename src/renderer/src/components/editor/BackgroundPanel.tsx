import React, { useRef, useState } from 'react'
import { Button } from '@renderer/components/ui/button'
import { Switch } from '@renderer/components/ui/switch'
import { Slider } from '@renderer/components/ui/slider'
import { Image, Video, Trash2, Globe, Monitor, X, Settings, FolderOpen } from 'lucide-react'
import { useBackgroundStore } from '@renderer/store/editor-background'
import { MediaBrowser } from './MediaBrowser'
import type { Media } from '@renderer/types/database'

interface BackgroundPanelProps {
  className?: string
}

export const BackgroundPanel: React.FC<BackgroundPanelProps> = ({ className = '' }) => {
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const globalImageInputRef = useRef<HTMLInputElement>(null)
  const globalVideoInputRef = useRef<HTMLInputElement>(null)

  // Media browser state
  const [mediaBrowserOpen, setMediaBrowserOpen] = useState(false)
  const [mediaBrowserType, setMediaBrowserType] = useState<'image' | 'video'>('image')
  const [mediaBrowserIsGlobal, setMediaBrowserIsGlobal] = useState(false)

  const {
    setSlideBackground,
    removeSlideBackground,
    setBackgroundOpacity,
    setVideoPlaybackRate,
    setVideoLoop,
    setVideoMuted,
    setGlobalBackground,
    removeGlobalBackground,
    setGlobalBackgroundOpacity,
    setGlobalVideoPlaybackRate,
    setGlobalVideoLoop,
    setGlobalVideoMuted,
    setBackgroundSize,
    setBackgroundPosition,
    setBackgroundPanelOpen
  } = useBackgroundStore()

  // Use direct store access to avoid selector issues
  const slideBackgroundType = useBackgroundStore((state) => state.backgroundType)
  const slideBackgroundOpacity = useBackgroundStore((state) => state.backgroundOpacity)
  const slideVideoLoop = useBackgroundStore((state) => state.videoLoop)
  const slideVideoMuted = useBackgroundStore((state) => state.videoMuted)
  const slideVideoPlaybackRate = useBackgroundStore((state) => state.videoPlaybackRate)

  const globalBackgroundType = useBackgroundStore((state) => state.globalBackgroundType)
  const globalBackgroundOpacity = useBackgroundStore((state) => state.globalBackgroundOpacity)
  const globalVideoLoop = useBackgroundStore((state) => state.globalVideoLoop)
  const globalVideoMuted = useBackgroundStore((state) => state.globalVideoMuted)
  const globalVideoPlaybackRate = useBackgroundStore((state) => state.globalVideoPlaybackRate)

  const backgroundSize = useBackgroundStore((state) => state.backgroundSize)
  const backgroundPosition = useBackgroundStore((state) => state.backgroundPosition)

  // Handle media selection from browser
  const handleMediaSelect = async (file: Media) => {
    try {
      console.log('🎯 Media selected:', file.name, file.type, file.filename)
      const mediaUrl = await window.electron?.invoke('get-media-data-url', file.filename)
      console.log('📸 Media URL generated, length:', mediaUrl ? mediaUrl.length : 0)

      // Only handle image and video types for backgrounds
      if (file.type === 'image' || file.type === 'video') {
        console.log(`🖼️ Setting ${file.type} background, isGlobal:`, mediaBrowserIsGlobal)

        if (mediaBrowserIsGlobal) {
          console.log('🌍 Setting global background')
          if (file.type === 'image') {
            setGlobalBackground(file.type, mediaUrl) // No blob for images
          } else {
            setGlobalBackground(file.type, mediaUrl, mediaUrl) // Blob for videos
          }
        } else {
          console.log('📄 Setting slide background')
          if (file.type === 'image') {
            setSlideBackground(file.type, mediaUrl) // No blob for images
          } else {
            setSlideBackground(file.type, mediaUrl, mediaUrl) // Blob for videos
          }
        }

        console.log('✅ Background set successfully')
      } else {
        console.warn('⚠️ Unsupported file type for background:', file.type)
      }
    } catch (error) {
      console.error('❌ Failed to load media file:', error)
    }
  }

  // Open media browser
  const openMediaBrowser = (type: 'image' | 'video', isGlobal: boolean) => {
    setMediaBrowserType(type)
    setMediaBrowserIsGlobal(isGlobal)
    setMediaBrowserOpen(true)
  }

  const handleImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    isGlobal = false
  ): void => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        if (isGlobal) {
          setGlobalBackground('image', result)
        } else {
          setSlideBackground('image', result)
        }
      }
      reader.readAsDataURL(file)
    }
    event.target.value = ''
  }

  const handleVideoUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    isGlobal = false
  ): void => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('video/')) {
      const reader = new FileReader()
      const blobUrl = URL.createObjectURL(file)

      reader.onload = (e) => {
        const result = e.target?.result as string
        if (isGlobal) {
          setGlobalBackground('video', result, blobUrl)
        } else {
          setSlideBackground('video', result, blobUrl)
        }
      }
      reader.readAsDataURL(file)
    }
    event.target.value = ''
  }

  return (
    <div className={`bg-card border-l border-border w-80 flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="text-lg font-semibold text-card-foreground">Backgrounds</h3>
        <Button onClick={() => setBackgroundPanelOpen(false)} variant="ghost" size="sm">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Slide Background Section */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-3">
            <Monitor className="w-4 h-4 text-primary" />
            <h4 className="font-medium text-card-foreground">Current Slide</h4>
          </div>

          {/* Upload Buttons */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <Button
              onClick={() => imageInputRef.current?.click()}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Image className="w-4 h-4" />
              Upload Image
            </Button>
            <Button
              onClick={() => videoInputRef.current?.click()}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Video className="w-4 h-4" />
              Upload Video
            </Button>
          </div>

          {/* Media Library Buttons */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Button
              onClick={() => openMediaBrowser('image', false)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-xs"
            >
              <FolderOpen className="w-3 h-3" />
              Browse Images
            </Button>
            <Button
              onClick={() => openMediaBrowser('video', false)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-xs"
            >
              <FolderOpen className="w-3 h-3" />
              Browse Videos
            </Button>
          </div>

          {/* Current Background Display */}
          {slideBackgroundType !== 'none' && (
            <div className="bg-muted rounded p-3 mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  {slideBackgroundType === 'image' ? 'Image' : 'Video'} Background
                </span>
                <Button
                  onClick={removeSlideBackground}
                  variant="ghost"
                  size="sm"
                  className="w-6 h-6 p-0 hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>

              {/* Opacity Control */}
              <div className="mb-3">
                <label className="text-xs text-muted-foreground mb-1 block">
                  Opacity: {Math.round(slideBackgroundOpacity * 100)}%
                </label>
                <Slider
                  value={[slideBackgroundOpacity]}
                  onValueChange={(value) => setBackgroundOpacity(value[0])}
                  max={1}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
              </div>

              {/* Video Controls */}
              {slideBackgroundType === 'video' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Loop</span>
                    <Switch checked={slideVideoLoop} onCheckedChange={setVideoLoop} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Muted</span>
                    <Switch checked={slideVideoMuted} onCheckedChange={setVideoMuted} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Speed: {slideVideoPlaybackRate}x
                    </label>
                    <Slider
                      value={[slideVideoPlaybackRate]}
                      onValueChange={(value) => setVideoPlaybackRate(value[0])}
                      max={2}
                      min={0.25}
                      step={0.25}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Hidden File Inputs */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e, false)}
            className="hidden"
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            onChange={(e) => handleVideoUpload(e, false)}
            className="hidden"
          />
        </div>

        {/* Global Background Section */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-green-600" />
            <h4 className="font-medium text-card-foreground">All Slides</h4>
          </div>

          {/* Upload Buttons */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <Button
              onClick={() => globalImageInputRef.current?.click()}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Image className="w-4 h-4" />
              Upload Image
            </Button>
            <Button
              onClick={() => globalVideoInputRef.current?.click()}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Video className="w-4 h-4" />
              Upload Video
            </Button>
          </div>

          {/* Media Library Buttons */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Button
              onClick={() => openMediaBrowser('image', true)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-xs"
            >
              <FolderOpen className="w-3 h-3" />
              Browse Images
            </Button>
            <Button
              onClick={() => openMediaBrowser('video', true)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-xs"
            >
              <FolderOpen className="w-3 h-3" />
              Browse Videos
            </Button>
          </div>

          {/* Current Global Background Display */}
          {globalBackgroundType !== 'none' && (
            <div className="bg-muted rounded p-3 mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  Global {globalBackgroundType === 'image' ? 'Image' : 'Video'}
                </span>
                <Button
                  onClick={removeGlobalBackground}
                  variant="ghost"
                  size="sm"
                  className="w-6 h-6 p-0 hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>

              {/* Opacity Control */}
              <div className="mb-3">
                <label className="text-xs text-muted-foreground mb-1 block">
                  Opacity: {Math.round(globalBackgroundOpacity * 100)}%
                </label>
                <Slider
                  value={[globalBackgroundOpacity]}
                  onValueChange={(value) => setGlobalBackgroundOpacity(value[0])}
                  max={1}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
              </div>

              {/* Video Controls */}
              {globalBackgroundType === 'video' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Loop</span>
                    <Switch checked={globalVideoLoop} onCheckedChange={setGlobalVideoLoop} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Muted</span>
                    <Switch checked={globalVideoMuted} onCheckedChange={setGlobalVideoMuted} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Speed: {globalVideoPlaybackRate}x
                    </label>
                    <Slider
                      value={[globalVideoPlaybackRate]}
                      onValueChange={(value) => setGlobalVideoPlaybackRate(value[0])}
                      max={2}
                      min={0.25}
                      step={0.25}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Hidden File Inputs */}
          <input
            ref={globalImageInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e, true)}
            className="hidden"
          />
          <input
            ref={globalVideoInputRef}
            type="file"
            accept="video/*"
            onChange={(e) => handleVideoUpload(e, true)}
            className="hidden"
          />
        </div>

        {/* Background Settings */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Settings className="w-4 h-4 text-purple-600" />
            <h4 className="font-medium text-card-foreground">Settings</h4>
          </div>

          {/* Background Size */}
          <div className="mb-3">
            <label className="text-xs text-muted-foreground mb-2 block">Background Size</label>
            <div className="grid grid-cols-2 gap-1">
              {(['cover', 'contain', 'fill', 'none'] as const).map((sizeOption) => (
                <Button
                  key={sizeOption}
                  onClick={() => setBackgroundSize(sizeOption)}
                  variant={backgroundSize === sizeOption ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs"
                >
                  {sizeOption.charAt(0).toUpperCase() + sizeOption.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Background Position */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Background Position</label>
            <div className="grid grid-cols-3 gap-1">
              {(['top', 'center', 'bottom'] as const).map((posOption) => (
                <Button
                  key={posOption}
                  onClick={() => setBackgroundPosition(posOption)}
                  variant={backgroundPosition === posOption ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs"
                >
                  {posOption.charAt(0).toUpperCase() + posOption.slice(1)}
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-1 mt-1">
              {(['left', 'right'] as const).map((posOption) => (
                <Button
                  key={posOption}
                  onClick={() => setBackgroundPosition(posOption)}
                  variant={backgroundPosition === posOption ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs"
                >
                  {posOption.charAt(0).toUpperCase() + posOption.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Media Browser Modal */}
      <MediaBrowser
        isOpen={mediaBrowserOpen}
        onClose={() => setMediaBrowserOpen(false)}
        onSelect={handleMediaSelect}
        mediaType={mediaBrowserType}
        title={`Select ${mediaBrowserType === 'image' ? 'Image' : 'Video'} ${mediaBrowserIsGlobal ? 'for All Slides' : 'for Current Slide'}`}
      />
    </div>
  )
}
