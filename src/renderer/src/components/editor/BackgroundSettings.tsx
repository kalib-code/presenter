import React, { useCallback, useRef, useState } from 'react'
import { Button } from '@renderer/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@renderer/components/ui/popover'
import { Switch } from '@renderer/components/ui/switch'
import { Slider } from '@renderer/components/ui/slider'
import { Separator } from '@renderer/components/ui/separator'
import { 
  Image, 
  Video, 
  Trash2, 
  Globe, 
  Monitor, 
  Settings, 
  Palette
} from 'lucide-react'
import { useBackgroundStore } from '@renderer/store/editor-background'
import { MediaBrowser } from './MediaBrowser'
import type { Media } from '@renderer/types/database'

interface BackgroundSettingsProps {
  className?: string
}

export const BackgroundSettings: React.FC<BackgroundSettingsProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false)
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
    setBackgroundPosition
  } = useBackgroundStore()

  // Store selectors
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
  const handleMediaSelect = useCallback(async (file: Media & { mediaReference?: string }) => {
    try {
      const mediaReference = file.mediaReference || `media://${file.filename}`
      
      if (file.type === 'image' || file.type === 'video') {
        if (mediaBrowserIsGlobal) {
          setGlobalBackground(file.type, mediaReference)
        } else {
          setSlideBackground(file.type, mediaReference)
        }
      }
    } catch (error) {
      console.error('Failed to set media background:', error)
    }
  }, [mediaBrowserIsGlobal, setGlobalBackground, setSlideBackground])

  // Open media browser
  const openMediaBrowser = useCallback((type: 'image' | 'video', isGlobal: boolean) => {
    setMediaBrowserType(type)
    setMediaBrowserIsGlobal(isGlobal)
    setMediaBrowserOpen(true)
  }, [])


  // Check if any background is active
  const hasBackground = slideBackgroundType !== 'none' || globalBackgroundType !== 'none'

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`bg-orange-600 hover:bg-orange-700 text-white border-orange-600 ${className}`}
          >
            <Palette className="w-4 h-4 mr-2" />
            Background
            {hasBackground && (
              <div className="w-2 h-2 bg-green-400 rounded-full ml-1" />
            )}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-96 p-0" align="start">
          <div className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Background Settings
            </h3>

            {/* Current Slide Section */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Monitor className="w-4 h-4 text-blue-600" />
                <h4 className="font-medium text-sm">Current Slide</h4>
              </div>

              {/* Media Browser Actions */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <Button
                  onClick={() => openMediaBrowser('image', false)}
                  variant="outline"
                  size="sm"
                  className="text-xs h-8"
                >
                  <Image className="w-3 h-3 mr-1" />
                  Add Image
                </Button>
                <Button
                  onClick={() => openMediaBrowser('video', false)}
                  variant="outline"
                  size="sm"
                  className="text-xs h-8"
                >
                  <Video className="w-3 h-3 mr-1" />
                  Add Video
                </Button>
              </div>

              {/* Current Background Display */}
              {slideBackgroundType !== 'none' && (
                <div className="bg-muted rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium">
                      {slideBackgroundType === 'image' ? 'Image' : 'Video'} Active
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

                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-muted-foreground">
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

                    {slideBackgroundType === 'video' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Loop</span>
                          <Switch
                            checked={slideVideoLoop}
                            onCheckedChange={setVideoLoop}
                            className="scale-75"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Muted</span>
                          <Switch
                            checked={slideVideoMuted}
                            onCheckedChange={setVideoMuted}
                            className="scale-75"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">
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
                </div>
              )}
            </div>

            <Separator className="my-4" />

            {/* Global Background Section */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-4 h-4 text-green-600" />
                <h4 className="font-medium text-sm">All Slides</h4>
              </div>

              {/* Media Browser Actions */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <Button
                  onClick={() => openMediaBrowser('image', true)}
                  variant="outline"
                  size="sm"
                  className="text-xs h-8"
                >
                  <Image className="w-3 h-3 mr-1" />
                  Add Image
                </Button>
                <Button
                  onClick={() => openMediaBrowser('video', true)}
                  variant="outline"
                  size="sm"
                  className="text-xs h-8"
                >
                  <Video className="w-3 h-3 mr-1" />
                  Add Video
                </Button>
              </div>

              {/* Current Global Background Display */}
              {globalBackgroundType !== 'none' && (
                <div className="bg-muted rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium">
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

                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-muted-foreground">
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

                    {globalBackgroundType === 'video' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Loop</span>
                          <Switch
                            checked={globalVideoLoop}
                            onCheckedChange={setGlobalVideoLoop}
                            className="scale-75"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Muted</span>
                          <Switch
                            checked={globalVideoMuted}
                            onCheckedChange={setGlobalVideoMuted}
                            className="scale-75"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">
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
                </div>
              )}
            </div>

            <Separator className="my-4" />

            {/* Background Settings */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Settings className="w-4 h-4 text-purple-600" />
                <h4 className="font-medium text-sm">Settings</h4>
              </div>

              {/* Background Size */}
              <div className="mb-3">
                <label className="text-xs text-muted-foreground mb-2 block">Size</label>
                <div className="grid grid-cols-2 gap-1">
                  {(['cover', 'contain', 'fill', 'none'] as const).map((sizeOption) => (
                    <Button
                      key={sizeOption}
                      onClick={() => setBackgroundSize(sizeOption)}
                      variant={backgroundSize === sizeOption ? 'default' : 'outline'}
                      size="sm"
                      className="text-xs h-7"
                    >
                      {sizeOption.charAt(0).toUpperCase() + sizeOption.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Background Position */}
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Position</label>
                <div className="grid grid-cols-3 gap-1 mb-1">
                  {(['top', 'center', 'bottom'] as const).map((posOption) => (
                    <Button
                      key={posOption}
                      onClick={() => setBackgroundPosition(posOption)}
                      variant={backgroundPosition === posOption ? 'default' : 'outline'}
                      size="sm"
                      className="text-xs h-7"
                    >
                      {posOption.charAt(0).toUpperCase() + posOption.slice(1)}
                    </Button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {(['left', 'right'] as const).map((posOption) => (
                    <Button
                      key={posOption}
                      onClick={() => setBackgroundPosition(posOption)}
                      variant={backgroundPosition === posOption ? 'default' : 'outline'}
                      size="sm"
                      className="text-xs h-7"
                    >
                      {posOption.charAt(0).toUpperCase() + posOption.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Media Browser Modal */}
      <MediaBrowser
        isOpen={mediaBrowserOpen}
        onClose={() => setMediaBrowserOpen(false)}
        onSelect={handleMediaSelect}
        mediaType={mediaBrowserType}
        title={`Select ${mediaBrowserType === 'image' ? 'Image' : 'Video'} ${mediaBrowserIsGlobal ? 'for All Slides' : 'for Current Slide'}`}
      />
    </>
  )
}