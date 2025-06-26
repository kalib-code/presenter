import { useRef, useEffect, useState } from 'react'
import { Button } from './button'
import { Slider } from './slider'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Maximize,
  Minimize,
  RotateCcw
} from 'lucide-react'
import type { SetlistItem } from '@renderer/types/database'

interface MediaPlayerProps {
  item: SetlistItem
  autoplay?: boolean
  className?: string
  onEnded?: () => void
  onTimeUpdate?: (currentTime: number, duration: number) => void
}

export function MediaPlayer({
  item,
  autoplay = false,
  className = '',
  onEnded,
  onTimeUpdate
}: MediaPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const backgroundAudioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(item.mediaConfig?.muted || false)
  const [volume, setVolume] = useState(item.mediaConfig?.volume || 1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null)

  // Background audio state
  const [backgroundAudioPlaying, setBackgroundAudioPlaying] = useState(false)
  const [backgroundAudioVolume, setBackgroundAudioVolume] = useState(
    item.mediaConfig?.backgroundAudio?.volume || 0.5
  )

  const mediaRef = item.type === 'video' ? videoRef : audioRef
  const mediaConfig = item.mediaConfig

  useEffect(() => {
    const media = mediaRef.current
    if (!media || !mediaConfig?.url) return

    media.src = mediaConfig.url
    media.volume = volume
    media.muted = isMuted
    media.loop = mediaConfig.loop || false

    if (mediaConfig.startTime) {
      media.currentTime = mediaConfig.startTime
    }

    const handleLoadedMetadata = () => {
      setDuration(media.duration)
      if (autoplay || mediaConfig.autoplay) {
        media.play()
        setIsPlaying(true)
      }
    }

    const handleTimeUpdate = () => {
      const current = media.currentTime
      setCurrentTime(current)
      onTimeUpdate?.(current, media.duration)

      // Auto-stop at end time if specified
      if (mediaConfig.endTime && current >= mediaConfig.endTime) {
        media.pause()
        setIsPlaying(false)
        onEnded?.()
      }
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => {
      setIsPlaying(false)
      onEnded?.()
    }

    media.addEventListener('loadedmetadata', handleLoadedMetadata)
    media.addEventListener('timeupdate', handleTimeUpdate)
    media.addEventListener('play', handlePlay)
    media.addEventListener('pause', handlePause)
    media.addEventListener('ended', handleEnded)

    return () => {
      media.removeEventListener('loadedmetadata', handleLoadedMetadata)
      media.removeEventListener('timeupdate', handleTimeUpdate)
      media.removeEventListener('play', handlePlay)
      media.removeEventListener('pause', handlePause)
      media.removeEventListener('ended', handleEnded)
    }
  }, [mediaConfig, autoplay, volume, isMuted, onEnded, onTimeUpdate, mediaRef])

  // Background audio effect
  useEffect(() => {
    const backgroundAudio = backgroundAudioRef.current
    const backgroundConfig = mediaConfig?.backgroundAudio

    if (!backgroundAudio || !backgroundConfig?.url) return

    backgroundAudio.src = backgroundConfig.url
    backgroundAudio.volume = backgroundAudioVolume
    backgroundAudio.loop = backgroundConfig.loop || false

    const handleBackgroundAudioPlay = () => setBackgroundAudioPlaying(true)
    const handleBackgroundAudioPause = () => setBackgroundAudioPlaying(false)
    const handleBackgroundAudioEnded = () => setBackgroundAudioPlaying(false)

    backgroundAudio.addEventListener('play', handleBackgroundAudioPlay)
    backgroundAudio.addEventListener('pause', handleBackgroundAudioPause)
    backgroundAudio.addEventListener('ended', handleBackgroundAudioEnded)

    // Auto-play background audio if configured
    if (backgroundConfig.autoplay && (autoplay || mediaConfig?.autoplay)) {
      const startBackgroundAudio = async () => {
        try {
          if (backgroundConfig.fadeIn && backgroundConfig.fadeIn > 0) {
            // Fade in effect
            backgroundAudio.volume = 0
            await backgroundAudio.play()
            const fadeStep = backgroundAudioVolume / (backgroundConfig.fadeIn * 10)
            const fadeInterval = setInterval(() => {
              if (backgroundAudio.volume < backgroundAudioVolume) {
                backgroundAudio.volume = Math.min(
                  backgroundAudio.volume + fadeStep,
                  backgroundAudioVolume
                )
              } else {
                clearInterval(fadeInterval)
              }
            }, 100)
          } else {
            await backgroundAudio.play()
          }
        } catch (error) {
          console.warn('Background audio autoplay failed:', error)
        }
      }

      startBackgroundAudio()
    }

    return () => {
      backgroundAudio.removeEventListener('play', handleBackgroundAudioPlay)
      backgroundAudio.removeEventListener('pause', handleBackgroundAudioPause)
      backgroundAudio.removeEventListener('ended', handleBackgroundAudioEnded)
    }
  }, [mediaConfig?.backgroundAudio, backgroundAudioVolume, autoplay])

  const togglePlayPause = () => {
    const media = mediaRef.current
    const backgroundAudio = backgroundAudioRef.current

    if (!media) return

    if (isPlaying) {
      media.pause()
      // Pause background audio if it's playing
      if (backgroundAudio && backgroundAudioPlaying) {
        backgroundAudio.pause()
      }
    } else {
      media.play()
      // Resume background audio if it should be playing
      if (backgroundAudio && mediaConfig?.backgroundAudio?.autoplay) {
        backgroundAudio.play()
      }
    }
  }

  const toggleBackgroundAudio = () => {
    const backgroundAudio = backgroundAudioRef.current
    if (!backgroundAudio) return

    if (backgroundAudioPlaying) {
      backgroundAudio.pause()
    } else {
      backgroundAudio.play()
    }
  }

  const handleBackgroundAudioVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setBackgroundAudioVolume(newVolume)
    const backgroundAudio = backgroundAudioRef.current
    if (backgroundAudio) {
      backgroundAudio.volume = newVolume
    }
  }

  const toggleMute = () => {
    const media = mediaRef.current
    if (!media) return

    const newMuted = !isMuted
    setIsMuted(newMuted)
    media.muted = newMuted
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    const media = mediaRef.current
    if (media) {
      media.volume = newVolume
    }
  }

  const handleSeek = (value: number[]) => {
    const newTime = value[0]
    setCurrentTime(newTime)
    const media = mediaRef.current
    if (media) {
      media.currentTime = newTime
    }
  }

  const skipBack = () => {
    const media = mediaRef.current
    if (media) {
      media.currentTime = Math.max(0, media.currentTime - 10)
    }
  }

  const skipForward = () => {
    const media = mediaRef.current
    if (media) {
      media.currentTime = Math.min(duration, media.currentTime + 10)
    }
  }

  const toggleFullscreen = () => {
    const media = mediaRef.current
    if (!media) return

    if (!document.fullscreenElement) {
      media.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const restart = () => {
    const media = mediaRef.current
    if (media) {
      media.currentTime = mediaConfig?.startTime || 0
      if (!isPlaying) {
        media.play()
      }
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const showControlsTemporarily = () => {
    setShowControls(true)
    if (controlsTimeout) {
      clearTimeout(controlsTimeout)
    }
    const timeout = setTimeout(() => {
      setShowControls(false)
    }, 3000)
    setControlsTimeout(timeout)
  }

  const handleMouseMove = () => {
    if (item.type === 'video') {
      showControlsTemporarily()
    }
  }

  if (item.type === 'image') {
    return (
      <div className={`relative ${className}`}>
        <img
          src={mediaConfig?.url}
          alt={item.title}
          className="w-full h-full object-contain"
          style={{
            objectFit: mediaConfig?.objectFit || 'contain',
            aspectRatio: mediaConfig?.aspectRatio === 'auto' ? 'auto' : mediaConfig?.aspectRatio
          }}
        />

        {/* Background Audio Element */}
        {mediaConfig?.backgroundAudio?.url && <audio ref={backgroundAudioRef} />}

        {/* Image Controls (including background audio) */}
        {mediaConfig?.backgroundAudio?.url && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleBackgroundAudio}
                  className="text-white hover:bg-white/20"
                >
                  {backgroundAudioPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
                <span className="text-white text-sm">Background Audio</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const backgroundAudio = backgroundAudioRef.current
                    if (backgroundAudio) {
                      backgroundAudio.muted = !backgroundAudio.muted
                    }
                  }}
                  className="text-white hover:bg-white/20"
                >
                  <Volume2 className="w-4 h-4" />
                </Button>
                <Slider
                  value={[backgroundAudioVolume]}
                  onValueChange={handleBackgroundAudioVolumeChange}
                  max={1}
                  step={0.1}
                  className="w-20"
                />
              </div>
            </div>
          </div>
        )}

        <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded">
          {item.title}
        </div>
      </div>
    )
  }

  return (
    <div className={`relative bg-black ${className}`} onMouseMove={handleMouseMove}>
      {item.type === 'video' ? (
        <>
          <video
            ref={videoRef}
            className="w-full h-full"
            style={{
              objectFit: mediaConfig?.objectFit || 'contain',
              aspectRatio: mediaConfig?.aspectRatio === 'auto' ? 'auto' : mediaConfig?.aspectRatio
            }}
            poster={mediaConfig?.thumbnail}
            playsInline
          />
          {/* Background Audio Element for Video */}
          {mediaConfig?.backgroundAudio?.url && <audio ref={backgroundAudioRef} />}
        </>
      ) : (
        <div className="flex items-center justify-center min-h-[200px] bg-gradient-to-br from-gray-800 to-gray-900">
          <audio ref={audioRef} />
          <div className="text-center text-white">
            <Volume2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
            <p className="text-gray-300">Audio Playback</p>
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      {mediaConfig?.controls !== false && (
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${
            item.type === 'video' && !showControls ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {/* Main Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            {/* Progress Bar */}
            <div className="mb-4">
              <Slider
                value={[currentTime]}
                onValueChange={handleSeek}
                max={duration}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-white/70 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipBack}
                  className="text-white hover:bg-white/20"
                >
                  <SkipBack className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePlayPause}
                  className="text-white hover:bg-white/20"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={skipForward}
                  className="text-white hover:bg-white/20"
                >
                  <SkipForward className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={restart}
                  className="text-white hover:bg-white/20"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                {/* Volume Control */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMute}
                    className="text-white hover:bg-white/20"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                  <Slider
                    value={[volume]}
                    onValueChange={handleVolumeChange}
                    max={1}
                    step={0.1}
                    className="w-20"
                  />
                </div>

                {/* Background Audio Controls */}
                {mediaConfig?.backgroundAudio?.url && (
                  <div className="flex items-center gap-2 px-2 border-l border-white/20">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleBackgroundAudio}
                      className="text-white hover:bg-white/20"
                      title="Background Audio"
                    >
                      {backgroundAudioPlaying ? (
                        <Pause className="w-3 h-3" />
                      ) : (
                        <Play className="w-3 h-3" />
                      )}
                    </Button>
                    <Slider
                      value={[backgroundAudioVolume]}
                      onValueChange={handleBackgroundAudioVolumeChange}
                      max={1}
                      step={0.1}
                      className="w-16"
                    />
                    <span className="text-xs text-white/70">BG</span>
                  </div>
                )}

                {/* Fullscreen (Video only) */}
                {item.type === 'video' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleFullscreen}
                    className="text-white hover:bg-white/20"
                  >
                    {isFullscreen ? (
                      <Minimize className="w-4 h-4" />
                    ) : (
                      <Maximize className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Title Overlay */}
          <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded">
            {item.title}
          </div>
        </div>
      )}
    </div>
  )
}
