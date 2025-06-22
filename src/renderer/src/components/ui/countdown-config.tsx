import { useState, useEffect } from 'react'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Textarea } from './textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Separator } from './separator'
import { Badge } from './badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from './dialog'
import { Timer, Palette, Upload, Image, Video, X } from 'lucide-react'
import { MediaBrowser } from '@renderer/components/editor/MediaBrowser'
import { createMediaReference, saveFileToMedia } from '@renderer/utils/mediaUtils'
import type { SetlistItem, Media } from '@renderer/types/database'

interface CountdownConfigProps {
  isOpen: boolean
  onClose: () => void
  onSave: (config: NonNullable<SetlistItem['countdownConfig']>) => void
  initialConfig?: SetlistItem['countdownConfig']
}

export function CountdownConfig({
  isOpen,
  onClose,
  onSave,
  initialConfig
}: CountdownConfigProps): JSX.Element {
  const [config, setConfig] = useState<NonNullable<SetlistItem['countdownConfig']>>({
    title: initialConfig?.title || 'Service Starting Soon',
    message: initialConfig?.message || 'Please take your seats',
    duration: initialConfig?.duration || 300, // 5 minutes default
    styling: {
      counterSize: initialConfig?.styling?.counterSize || 'large',
      counterColor: initialConfig?.styling?.counterColor || '#FFFFFF',
      titleSize: initialConfig?.styling?.titleSize || 'medium',
      titleColor: initialConfig?.styling?.titleColor || '#FFFFFF',
      messageSize: initialConfig?.styling?.messageSize || 'medium',
      messageColor: initialConfig?.styling?.messageColor || '#FFFFFF',
      textShadow: initialConfig?.styling?.textShadow ?? true
    },
    background: {
      type: initialConfig?.background?.type || 'color',
      value: initialConfig?.background?.value || '#DC2626', // Red gradient default
      opacity: initialConfig?.background?.opacity || 1,
      size: initialConfig?.background?.size || 'cover',
      position: initialConfig?.background?.position || 'center'
    }
  })

  // Media browser state
  const [mediaBrowserOpen, setMediaBrowserOpen] = useState(false)
  const [mediaBrowserType, setMediaBrowserType] = useState<'image' | 'video'>('image')

  const [backgroundFile, setBackgroundFile] = useState<File | null>(null)
  const [resolvedBackgroundUrl, setResolvedBackgroundUrl] = useState<string>('')

  // Resolve media URL for preview
  useEffect(() => {
    const resolveMediaUrl = async (): Promise<void> => {
      if (config.background?.value?.startsWith('media://')) {
        try {
          const filename = config.background.value.replace('media://', '')
          const dataUrl = await window.electron?.invoke('get-media-data-url', filename)
          setResolvedBackgroundUrl(dataUrl || '')
        } catch (error) {
          console.error('Failed to resolve media URL for preview:', error)
          setResolvedBackgroundUrl('')
        }
      } else {
        setResolvedBackgroundUrl(config.background?.value || '')
      }
    }

    resolveMediaUrl()
  }, [config.background?.value])

  const handleDurationChange = (value: string): void => {
    const minutes = parseInt(value) || 0
    setConfig((prev) => ({
      ...prev,
      duration: minutes * 60
    }))
  }

  // Handle media selection from media browser
  const handleMediaSelect = async (file: Media): Promise<void> => {
    try {
      console.log('🎯 Countdown media selected:', file.name, file.type)

      // Create media reference for storage
      const mediaReference = createMediaReference(file.filename)

      setConfig((prev) => ({
        ...prev,
        background: {
          ...prev.background!,
          type: file.type as 'image' | 'video',
          value: mediaReference // Store media reference, not data URL
        }
      }))

      console.log('✅ Countdown background set with media reference:', mediaReference)
    } catch (error) {
      console.error('❌ Failed to set countdown background media:', error)
    }
  }

  // Open media browser for background selection
  const openMediaBrowser = (type: 'image' | 'video'): void => {
    console.log('🎯 Opening media browser for type:', type)
    setMediaBrowserType(type)
    setMediaBrowserOpen(true)
    console.log('🎯 Media browser state set to open')
  }

  // Handle background file selection - now saves to media folder
  const handleBackgroundFileSelect = async (file: File): Promise<void> => {
    setBackgroundFile(file)

    try {
      console.log('🎬 Uploading countdown background file:', file.name)

      // Save file to media folder and get media reference
      const mediaReference = await saveFileToMedia(file)
      console.log('📸 Background saved with reference:', mediaReference)

      setConfig((prev) => ({
        ...prev,
        background: {
          ...prev.background!,
          type: file.type.startsWith('video/') ? 'video' : 'image',
          value: mediaReference
        }
      }))

      console.log('✅ Countdown background set successfully')
    } catch (error) {
      console.error('❌ Failed to upload countdown background:', error)
    }
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getCounterSizeClass = (size: string): string => {
    switch (size) {
      case 'small':
        return 'text-4xl'
      case 'medium':
        return 'text-6xl'
      case 'large':
        return 'text-8xl'
      case 'extra-large':
        return 'text-9xl'
      default:
        return 'text-8xl'
    }
  }

  const getTitleSizeClass = (size: string): string => {
    switch (size) {
      case 'small':
        return 'text-lg'
      case 'medium':
        return 'text-2xl'
      case 'large':
        return 'text-4xl'
      default:
        return 'text-2xl'
    }
  }

  const getMessageSizeClass = (size: string): string => {
    switch (size) {
      case 'small':
        return 'text-sm'
      case 'medium':
        return 'text-lg'
      case 'large':
        return 'text-2xl'
      default:
        return 'text-lg'
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Timer className="w-5 h-5" />
              Countdown Timer Configuration
            </DialogTitle>
            <DialogDescription>
              Customize your countdown timer with title, message, styling, and background options.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Configuration */}
            <div className="space-y-6">
              {/* Basic Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Settings</h3>

                <div className="space-y-2">
                  <Label htmlFor="countdown-title">Title</Label>
                  <Input
                    id="countdown-title"
                    value={config.title}
                    onChange={(e) => setConfig((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Service Starting Soon"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="countdown-message">Message</Label>
                  <Textarea
                    id="countdown-message"
                    value={config.message}
                    onChange={(e) => setConfig((prev) => ({ ...prev, message: e.target.value }))}
                    placeholder="Please take your seats"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="countdown-duration">Duration (minutes)</Label>
                  <Input
                    id="countdown-duration"
                    type="number"
                    min="1"
                    max="60"
                    value={Math.floor(config.duration! / 60)}
                    onChange={(e) => handleDurationChange(e.target.value)}
                  />
                  <div className="text-sm text-muted-foreground">
                    Timer will count down from {formatDuration(config.duration!)}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Styling Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Text Styling
                </h3>

                {/* Counter Styling */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Counter Size</Label>
                    <Select
                      value={config.styling?.counterSize}
                      onValueChange={(value) =>
                        setConfig((prev) => ({
                          ...prev,
                          styling: {
                            ...prev.styling!,
                            counterSize: value as 'small' | 'medium' | 'large' | 'extra-large'
                          }
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                        <SelectItem value="extra-large">Extra Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Counter Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={config.styling?.counterColor}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            styling: { ...prev.styling!, counterColor: e.target.value }
                          }))
                        }
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={config.styling?.counterColor}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            styling: { ...prev.styling!, counterColor: e.target.value }
                          }))
                        }
                        placeholder="#FFFFFF"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Title Styling */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Title Size</Label>
                    <Select
                      value={config.styling?.titleSize}
                      onValueChange={(value) =>
                        setConfig((prev) => ({
                          ...prev,
                          styling: {
                            ...prev.styling!,
                            titleSize: value as 'small' | 'medium' | 'large'
                          }
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Title Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={config.styling?.titleColor}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            styling: { ...prev.styling!, titleColor: e.target.value }
                          }))
                        }
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={config.styling?.titleColor}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            styling: { ...prev.styling!, titleColor: e.target.value }
                          }))
                        }
                        placeholder="#FFFFFF"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Message Styling */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Message Size</Label>
                    <Select
                      value={config.styling?.messageSize}
                      onValueChange={(value) =>
                        setConfig((prev) => ({
                          ...prev,
                          styling: {
                            ...prev.styling!,
                            messageSize: value as 'small' | 'medium' | 'large'
                          }
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Message Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={config.styling?.messageColor}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            styling: { ...prev.styling!, messageColor: e.target.value }
                          }))
                        }
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={config.styling?.messageColor}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            styling: { ...prev.styling!, messageColor: e.target.value }
                          }))
                        }
                        placeholder="#FFFFFF"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="text-shadow"
                    checked={config.styling?.textShadow}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        styling: { ...prev.styling!, textShadow: e.target.checked }
                      }))
                    }
                    className="rounded"
                  />
                  <Label htmlFor="text-shadow">Apply text shadow for better readability</Label>
                </div>
              </div>

              <Separator />

              {/* Background Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Background</h3>

                <div className="space-y-2">
                  <Label>Background Type</Label>
                  <Select
                    value={config.background?.type}
                    onValueChange={(value) =>
                      setConfig((prev) => ({
                        ...prev,
                        background: {
                          ...prev.background!,
                          type: value as 'color' | 'image' | 'video'
                        }
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="color">Solid Color</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {config.background?.type === 'color' && (
                  <div className="space-y-2">
                    <Label>Background Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={config.background.value}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            background: { ...prev.background!, value: e.target.value }
                          }))
                        }
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={config.background.value}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            background: { ...prev.background!, value: e.target.value }
                          }))
                        }
                        placeholder="#DC2626"
                        className="flex-1"
                      />
                    </div>
                  </div>
                )}

                {(config.background?.type === 'image' || config.background?.type === 'video') && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>
                        Select {config.background.type === 'image' ? 'Image' : 'Video'} from Media
                        Library
                      </Label>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            openMediaBrowser(config.background?.type as 'image' | 'video')
                          }
                          className="flex items-center gap-2"
                        >
                          {config.background.type === 'image' ? (
                            <Image className="w-4 h-4" />
                          ) : (
                            <Video className="w-4 h-4" />
                          )}
                          Choose from Media Library
                        </Button>

                        {/* Legacy file upload fallback */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const input = document.createElement('input')
                            input.type = 'file'
                            input.accept =
                              config.background?.type === 'image' ? 'image/*' : 'video/*'
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0]
                              if (file) void handleBackgroundFileSelect(file)
                            }
                            input.click()
                          }}
                          className="flex items-center gap-2"
                        >
                          <Upload className="w-4 h-4" />
                          Upload File
                        </Button>

                        {backgroundFile && <Badge variant="secondary">{backgroundFile.name}</Badge>}

                        {/* Show current media selection */}
                        {config.background.value &&
                          config.background.value.startsWith('media://') && (
                            <Badge variant="default">
                              Media: {config.background.value.replace('media://', '')}
                            </Badge>
                          )}

                        {/* Remove background button */}
                        {config.background.value && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setConfig((prev) => ({
                                ...prev,
                                background: {
                                  ...prev.background!,
                                  type: 'color',
                                  value: 'linear-gradient(135deg, #DC2626, #EA580C)'
                                }
                              }))
                            }
                            className="flex items-center gap-2 text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Size</Label>
                        <Select
                          value={config.background.size}
                          onValueChange={(value) =>
                            setConfig((prev) => ({
                              ...prev,
                              background: {
                                ...prev.background!,
                                size: value as 'cover' | 'contain' | 'fill' | 'none'
                              }
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cover">Cover</SelectItem>
                            <SelectItem value="contain">Contain</SelectItem>
                            <SelectItem value="fill">Fill</SelectItem>
                            <SelectItem value="none">Original Size</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Position</Label>
                        <Select
                          value={config.background.position}
                          onValueChange={(value) =>
                            setConfig((prev) => ({
                              ...prev,
                              background: {
                                ...prev.background!,
                                position: value as 'center' | 'top' | 'bottom' | 'left' | 'right'
                              }
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="top">Top</SelectItem>
                            <SelectItem value="bottom">Bottom</SelectItem>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Opacity: {Math.round((config.background.opacity || 1) * 100)}%</Label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={config.background.opacity || 1}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            background: { ...prev.background!, opacity: parseFloat(e.target.value) }
                          }))
                        }
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Preview */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Live Preview</h3>

              <div className="aspect-video bg-black rounded-lg overflow-hidden relative border">
                {/* Background Layer */}
                {config.background?.type === 'color' && (
                  <div
                    className="absolute inset-0"
                    style={{
                      background: config.background.value,
                      opacity: config.background.opacity || 1
                    }}
                  />
                )}

                {config.background?.type === 'image' && resolvedBackgroundUrl && (
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${resolvedBackgroundUrl})`,
                      backgroundSize:
                        config.background.size === 'none' ? 'auto' : config.background.size,
                      backgroundPosition: config.background.position,
                      opacity: config.background.opacity || 1
                    }}
                  />
                )}

                {config.background?.type === 'video' && resolvedBackgroundUrl && (
                  <video
                    className="absolute inset-0 w-full h-full object-cover"
                    src={resolvedBackgroundUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    style={{
                      objectFit:
                        config.background.size === 'none'
                          ? 'none'
                          : (config.background.size as 'cover' | 'contain' | 'fill') || 'cover',
                      objectPosition: config.background.position,
                      opacity: config.background.opacity || 1
                    }}
                  />
                )}

                {/* Content Layer */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                  <h1
                    className={`font-bold mb-2 ${getTitleSizeClass(config.styling?.titleSize || 'medium')}`}
                    style={{
                      color: config.styling?.titleColor,
                      textShadow: config.styling?.textShadow
                        ? '2px 2px 4px rgba(0,0,0,0.8)'
                        : 'none'
                    }}
                  >
                    {config.title}
                  </h1>

                  <div
                    className={`font-bold font-mono mb-2 ${getCounterSizeClass(config.styling?.counterSize || 'large')}`}
                    style={{
                      color: config.styling?.counterColor,
                      textShadow: config.styling?.textShadow
                        ? '2px 2px 4px rgba(0,0,0,0.8)'
                        : 'none'
                    }}
                  >
                    {formatDuration(config.duration!)}
                  </div>

                  <div
                    className={`${getMessageSizeClass(config.styling?.messageSize || 'medium')}`}
                    style={{
                      color: config.styling?.messageColor,
                      textShadow: config.styling?.textShadow
                        ? '2px 2px 4px rgba(0,0,0,0.8)'
                        : 'none'
                    }}
                  >
                    {config.message}
                  </div>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                Preview shows how your countdown timer will appear on the projection screen.
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => onSave(config)}>Save Configuration</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Media Browser Modal - Outside Dialog to avoid z-index conflicts */}
      <MediaBrowser
        isOpen={mediaBrowserOpen}
        onClose={() => setMediaBrowserOpen(false)}
        onSelect={handleMediaSelect}
        mediaType={mediaBrowserType}
        title={`Select ${mediaBrowserType === 'image' ? 'Image' : 'Video'} for Countdown Background`}
      />
    </>
  )
}
