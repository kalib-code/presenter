/**
 * VideoPreview Component
 *
 * A component for rendering video elements with background audio support
 * and interactive controls in preview mode. Handles URL resolution and
 * audio management.
 */

import React, { useState, useEffect, useRef } from 'react'
import { resolveMediaUrl } from '@renderer/utils/mediaUtils'
import { MediaPlayer } from '@renderer/components/ui/media-player'
import type { SetlistItem } from '@renderer/types/database'

/**
 * Props for VideoPreview component
 */
interface VideoPreviewProps {
  /** The video element to render */
  element: any
  /** Whether the parent card is selected */
  isSelectedCard: boolean
  /** Parent card reference for audio configuration */
  card: any
  /** Scaled position for the element */
  scaledPosition: any
  /** Scaled size for the element */
  scaledSize: any
  /** Global audio controls instance */
  globalAudioControls: any
  /** Whether the user has interacted with the video */
  hasUserInteracted: boolean
}

/**
 * VideoPreview component for rendering videos with optional background audio
 *
 * Handles URL resolution for media references, background audio setup,
 * interactive video controls, and provides visual indicators for playback status.
 *
 * @param props - Component props including element data and audio controls
 * @returns JSX element representing a video with optional audio and controls
 */
export const VideoPreview: React.FC<VideoPreviewProps> = ({
  element,
  isSelectedCard,
  card,
  scaledPosition,
  scaledSize,
  globalAudioControls,
  hasUserInteracted
}) => {
  const [resolvedVideoUrl, setResolvedVideoUrl] = useState<string>('')
  const [resolvedBackgroundAudioUrl, setResolvedBackgroundAudioUrl] = useState<string>('')
  const [backgroundAudioPlaying, setBackgroundAudioPlaying] = useState(false)
  const backgroundAudioRef = useRef<HTMLAudioElement>(null)

  // Video URL resolution effect
  useEffect(() => {
    const resolveVideo = async () => {
      try {
        if (element.content) {
          if (element.content.startsWith('media://')) {
            const resolved = await resolveMediaUrl(element.content)
            setResolvedVideoUrl(resolved)
            console.log('🎬 [PREVIEW] Video URL resolved:', {
              original: element.content,
              resolved: resolved?.substring(0, 100) + '...'
            })
          } else {
            setResolvedVideoUrl(element.content)
          }
        }
      } catch (error) {
        console.error('🎬 [PREVIEW] Failed to resolve video URL:', error)
      }
    }
    resolveVideo()
  }, [element.content])

  // Background audio URL resolution effect
  useEffect(() => {
    const resolveBackgroundAudio = async () => {
      try {
        if (card.mediaConfig?.backgroundAudio?.url) {
          console.log(
            '🎵 [PREVIEW] Resolving background audio URL:',
            card.mediaConfig.backgroundAudio.url
          )
          if (card.mediaConfig.backgroundAudio.url.startsWith('media://')) {
            const resolved = await resolveMediaUrl(card.mediaConfig.backgroundAudio.url)
            setResolvedBackgroundAudioUrl(resolved)
            console.log('🎵 [PREVIEW] Background audio URL resolved:', {
              original: card.mediaConfig.backgroundAudio.url,
              resolved: resolved?.substring(0, 100) + '...'
            })
          } else {
            setResolvedBackgroundAudioUrl(card.mediaConfig.backgroundAudio.url)
          }
        }
      } catch (error) {
        console.error('🎵 [PREVIEW] Failed to resolve background audio URL:', error)
      }
    }
    resolveBackgroundAudio()
  }, [card.mediaConfig?.backgroundAudio?.url])

  // Background audio setup effect
  useEffect(() => {
    const backgroundAudio = backgroundAudioRef.current
    if (backgroundAudio && resolvedBackgroundAudioUrl) {
      console.log('🎵 [PREVIEW] Setting up background audio:', {
        hasAutoplay: !!card.mediaConfig?.backgroundAudio?.autoplay,
        volume: card.mediaConfig?.backgroundAudio?.volume,
        loop: card.mediaConfig?.backgroundAudio?.loop
      })

      backgroundAudio.src = resolvedBackgroundAudioUrl
      backgroundAudio.volume = card.mediaConfig?.backgroundAudio?.volume || 0.5
      backgroundAudio.loop = card.mediaConfig?.backgroundAudio?.loop || false

      console.log('🎵 [PREVIEW] Background audio setup complete, ready for slide projection')
    }
  }, [
    resolvedBackgroundAudioUrl,
    card.mediaConfig?.backgroundAudio?.autoplay,
    card.mediaConfig?.backgroundAudio?.volume,
    card.mediaConfig?.backgroundAudio?.loop
  ])

  // Background audio management for selected card
  useEffect(() => {
    const backgroundAudio = backgroundAudioRef.current

    if (
      isSelectedCard &&
      backgroundAudio &&
      resolvedBackgroundAudioUrl &&
      card.mediaConfig?.backgroundAudio?.url
    ) {
      console.log(
        '🎵 [PREVIEW] Registering background audio for selected video item (no auto-play)'
      )

      // Register with global audio manager but don't auto-play
      globalAudioControls?.registerAudio(backgroundAudio, `bg-${card.id}`, 'background')
      console.log('🎵 [PREVIEW] Background audio ready - will only play when slide is projected')
    } else if (!isSelectedCard && backgroundAudio && backgroundAudioPlaying) {
      // Stop audio when this item is no longer selected
      console.log('🎵 [PREVIEW] Stopping background audio for deselected video item')
      backgroundAudio.pause()
      backgroundAudio.currentTime = 0
      setBackgroundAudioPlaying(false)
      globalAudioControls?.unregisterAudio(`bg-${card.id}`)
    }
  }, [isSelectedCard, resolvedBackgroundAudioUrl, backgroundAudioPlaying])

  // Show loading state while video URL is being resolved
  if (!resolvedVideoUrl) {
    return (
      <div
        className="absolute flex items-center justify-center bg-gray-800 text-white text-xs"
        style={{
          left: scaledPosition.x,
          top: scaledPosition.y,
          width: scaledSize.width,
          height: scaledSize.height,
          zIndex: element.zIndex || 1
        }}
      >
        Loading video...
      </div>
    )
  }

  // Convert card data to SetlistItem format for MediaPlayer
  const setlistItem: SetlistItem = {
    id: card.id,
    title: card.title,
    type: 'video',
    referenceId: card.id,
    order: 0,
    isActive: isSelectedCard,
    mediaConfig: {
      url: element.content,
      mediaType: 'video',
      autoplay: false,
      loop: false,
      volume: 1,
      controls: isSelectedCard,
      muted: !isSelectedCard,
      aspectRatio: '16:9',
      objectFit: 'cover',
      backgroundAudio: card.mediaConfig?.backgroundAudio
    }
  }

  return (
    <div className="relative">
      {/* Use MediaPlayer for video with compact controls when selected */}
      <div
        className="absolute"
        style={{
          left: scaledPosition.x,
          top: scaledPosition.y,
          width: scaledSize.width,
          height: scaledSize.height,
          zIndex: element.zIndex || 1
        }}
      >
        <MediaPlayer
          item={setlistItem}
          autoplay={false}
          compact={isSelectedCard}
          showTitle={false}
          className="w-full h-full"
        />
      </div>

      {/* Background Audio Element - kept for backward compatibility */}
      {card.mediaConfig?.backgroundAudio?.url && (
        <audio
          ref={backgroundAudioRef}
          data-audio-type="background"
          data-audio-id={`bg-${card.id}`}
          onPlay={() => {
            setBackgroundAudioPlaying(true)
            console.log('🎵 [PREVIEW] Background audio started')
          }}
          onPause={() => {
            setBackgroundAudioPlaying(false)
            console.log('🎵 [PREVIEW] Background audio paused')
          }}
          onError={(e) => {
            console.error('🎵 [PREVIEW] Background audio failed to load:', e.nativeEvent)
          }}
        />
      )}
    </div>
  )
}

export default VideoPreview
