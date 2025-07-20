/**
 * ImagePreview Component
 *
 * A component for rendering image elements with background audio support
 * in preview mode. Handles URL resolution and audio management.
 */

import React, { useState, useEffect, useRef } from 'react'
import { resolveMediaUrl } from '@renderer/utils/mediaUtils'
import { ImagePreviewProps } from '@renderer/types/home'
import { MediaPlayer } from '@renderer/components/ui/media-player'
import type { SetlistItem } from '@renderer/types/database'

/**
 * ImagePreview component for rendering images with optional background audio
 *
 * Handles URL resolution for media references, background audio setup,
 * and provides visual indicators for audio status.
 *
 * @param props - Component props including element data and audio controls
 * @returns JSX element representing an image with optional audio
 */
export const ImagePreview: React.FC<ImagePreviewProps> = ({
  element,
  isSelectedCard,
  card,
  scaledPosition,
  scaledSize,
  globalAudioControls
}) => {
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string>('')
  const [resolvedBackgroundAudioUrl, setResolvedBackgroundAudioUrl] = useState<string>('')
  const [backgroundAudioPlaying, setBackgroundAudioPlaying] = useState(false)
  const backgroundAudioRef = useRef<HTMLAudioElement>(null)

  // Resolve image URL
  useEffect(() => {
    const resolveImage = async (): Promise<void> => {
      try {
        if (element.content) {
          if (element.content.startsWith('media://')) {
            const resolved = await resolveMediaUrl(element.content)
            setResolvedImageUrl(resolved)
            console.log('🖼️ [PREVIEW] Image URL resolved:', {
              original: element.content,
              resolved: resolved?.substring(0, 100) + '...'
            })
          } else {
            setResolvedImageUrl(element.content)
          }
        }
      } catch (error) {
        console.error('🖼️ [PREVIEW] Failed to resolve image URL:', error)
      }
    }
    resolveImage()
  }, [element.content])

  // Handle background audio URL resolution
  useEffect(() => {
    const resolveBackgroundAudio = async (): Promise<void> => {
      try {
        if (card.mediaConfig?.backgroundAudio?.url) {
          console.log(
            '🎵 [PREVIEW] Resolving background audio URL for image:',
            card.mediaConfig.backgroundAudio.url
          )
          if (card.mediaConfig.backgroundAudio.url.startsWith('media://')) {
            const resolved = await resolveMediaUrl(card.mediaConfig.backgroundAudio.url)
            setResolvedBackgroundAudioUrl(resolved)
            console.log('🎵 [PREVIEW] Background audio URL resolved for image:', {
              original: card.mediaConfig.backgroundAudio.url,
              resolved: resolved?.substring(0, 100) + '...'
            })
          } else {
            setResolvedBackgroundAudioUrl(card.mediaConfig.backgroundAudio.url)
          }
        }
      } catch (error) {
        console.error('🎵 [PREVIEW] Failed to resolve background audio URL for image:', error)
      }
    }
    resolveBackgroundAudio()
  }, [card.mediaConfig?.backgroundAudio?.url])

  // Handle background audio setup and autoplay for images
  useEffect(() => {
    const backgroundAudio = backgroundAudioRef.current
    if (backgroundAudio && resolvedBackgroundAudioUrl) {
      console.log('🎵 [PREVIEW] Setting up background audio for image:', {
        hasAutoplay: !!card.mediaConfig?.backgroundAudio?.autoplay,
        volume: card.mediaConfig?.backgroundAudio?.volume,
        loop: card.mediaConfig?.backgroundAudio?.loop
      })

      backgroundAudio.src = resolvedBackgroundAudioUrl
      backgroundAudio.volume = card.mediaConfig?.backgroundAudio?.volume || 0.5
      backgroundAudio.loop = card.mediaConfig?.backgroundAudio?.loop || false

      // Don't auto-play on item selection - only play when slide is actually projected
      console.log(
        '🎵 [PREVIEW] Background audio setup complete for image, ready for slide projection'
      )
    }
  }, [
    resolvedBackgroundAudioUrl,
    card.mediaConfig?.backgroundAudio?.autoplay,
    card.mediaConfig?.backgroundAudio?.volume,
    card.mediaConfig?.backgroundAudio?.loop
  ])

  // Setup background audio when this image becomes the selected card (no auto-play)
  useEffect(() => {
    const backgroundAudio = backgroundAudioRef.current

    if (
      isSelectedCard &&
      backgroundAudio &&
      resolvedBackgroundAudioUrl &&
      card.mediaConfig?.backgroundAudio?.url
    ) {
      console.log(
        '🎵 [PREVIEW] Registering background audio for selected image item (no auto-play)'
      )

      // Register with global audio manager but don't auto-play
      globalAudioControls?.registerAudio(
        backgroundAudio,
        `bg-${card.id}`,
        'background',
        `Background Audio: ${card.title}`
      )
      console.log('🎵 [PREVIEW] Background audio ready - will only play when slide is projected')
    } else if (!isSelectedCard && backgroundAudio && backgroundAudioPlaying) {
      // Stop audio when this item is no longer selected
      console.log('🎵 [PREVIEW] Stopping background audio for deselected image item')
      backgroundAudio.pause()
      backgroundAudio.currentTime = 0
      setBackgroundAudioPlaying(false)
      globalAudioControls?.unregisterAudio(`bg-${card.id}`)
    }
  }, [isSelectedCard, resolvedBackgroundAudioUrl, backgroundAudioPlaying])

  // Show loading state while image URL is being resolved
  if (!resolvedImageUrl) {
    return (
      <div
        className="absolute flex items-center justify-center bg-gray-200 text-gray-600 text-xs"
        style={{
          left: scaledPosition.x,
          top: scaledPosition.y,
          width: scaledSize.width,
          height: scaledSize.height,
          zIndex: element.zIndex || 1
        }}
      >
        Loading image...
      </div>
    )
  }

  // Convert card data to SetlistItem format for MediaPlayer when background audio is present
  const hasBackgroundAudio = Boolean(card.mediaConfig?.backgroundAudio?.url)
  if (hasBackgroundAudio && isSelectedCard) {
    const setlistItem: SetlistItem = {
      id: card.id,
      title: card.title,
      type: 'image',
      referenceId: card.id,
      order: 0,
      isActive: isSelectedCard,
      mediaConfig: {
        url: element.content,
        mediaType: 'image',
        autoplay: false,
        loop: false,
        volume: 1,
        controls: true,
        aspectRatio: '16:9',
        objectFit: 'cover',
        backgroundAudio: card.mediaConfig?.backgroundAudio
      }
    }

    return (
      <div className="relative">
        {/* Use MediaPlayer for image with background audio controls when selected */}
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
            compact={true}
            showTitle={false}
            className="w-full h-full"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Main Image Element - fallback for images without audio or non-selected cards */}
      <img
        key={`${element.id}-${resolvedImageUrl}`}
        src={resolvedImageUrl}
        alt="Slide element"
        className="absolute object-cover"
        style={{
          left: scaledPosition.x,
          top: scaledPosition.y,
          width: scaledSize.width,
          height: scaledSize.height,
          opacity: element.style?.opacity || 1,
          zIndex: element.zIndex || 1
        }}
        onError={(e) => {
          console.error('🖼️ [PREVIEW] Image failed to load:', {
            src: resolvedImageUrl,
            original: element.content,
            error: e,
            cardTitle: card.title
          })
        }}
        onLoad={() => {
          console.log(
            '🖼️ [PREVIEW] Image loaded successfully:',
            resolvedImageUrl?.substring(0, 50) + '...'
          )
        }}
      />

      {/* Background Audio Element - kept for backward compatibility */}
      {hasBackgroundAudio && (
        <audio
          ref={backgroundAudioRef}
          data-audio-type="background"
          data-audio-id={`bg-image-${card.id}`}
          onPlay={() => {
            setBackgroundAudioPlaying(true)
            console.log('🎵 [PREVIEW] Background audio started for image')
          }}
          onPause={() => {
            setBackgroundAudioPlaying(false)
            console.log('🎵 [PREVIEW] Background audio paused for image')
          }}
          onError={(e) => {
            console.error('🎵 [PREVIEW] Background audio failed to load for image:', e.nativeEvent)
          }}
        />
      )}

      {/* Background Audio Indicator - only show when not using MediaPlayer */}
      {hasBackgroundAudio && !isSelectedCard && (
        <div
          className="absolute top-1 right-1 bg-black/80 text-white text-xs px-2 py-1 rounded"
          style={{ zIndex: (element.zIndex || 1) + 1 }}
        >
          🎵 {backgroundAudioPlaying ? 'Playing' : 'Ready'}
        </div>
      )}
    </div>
  )
}

export default ImagePreview
