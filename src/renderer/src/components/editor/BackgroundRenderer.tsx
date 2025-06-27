import React, { useState, useEffect } from 'react'
import { resolveMediaUrl, isMediaReference } from '@renderer/utils/mediaUtils'

interface Background {
  type: string
  value: string
  opacity?: number
  playbackRate?: number
  size?: 'cover' | 'contain' | 'fill' | 'none'
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right'
}

interface BackgroundRendererProps {
  background?: Background
  className?: string
  style?: React.CSSProperties
  preview?: boolean // When true, shows static preview for videos instead of playing
  onLoad?: () => void
  onError?: (error: Error) => void
}

export const BackgroundRenderer: React.FC<BackgroundRendererProps> = ({
  background,
  className = '',
  style = {},
  preview = false,
  onLoad,
  onError
}) => {
  const [resolvedUrl, setResolvedUrl] = useState<string>('')

  // Resolve media URL when background changes
  useEffect(() => {
    const resolveBackground = async (): Promise<void> => {
      console.log('🎨 [BACKGROUND_RENDERER] Received background:', {
        hasBackground: !!background,
        type: background?.type,
        value: background?.value?.substring(0, 100) + '...',
        hasValue: !!background?.value,
        opacity: background?.opacity,
        size: background?.size,
        position: background?.position
      })

      if (!background?.value) {
        console.log('🎨 [BACKGROUND_RENDERER] No background value, clearing resolved URL')
        setResolvedUrl('')
        return
      }

      // Skip URL resolution for color/gradient backgrounds
      if (background.type === 'color' || background.type === 'gradient') {
        console.log('🎨 [BACKGROUND_RENDERER] Color/gradient background, no URL resolution needed')
        setResolvedUrl('')
        return
      }

      // Loading state removed for simplicity

      try {
        if (isMediaReference(background.value)) {
          console.log('🎨 [BACKGROUND_RENDERER] Resolving media reference:', background.value)
          const resolved = await resolveMediaUrl(background.value)
          setResolvedUrl(resolved)
          console.log(
            '✅ [BACKGROUND_RENDERER] Media resolved successfully:',
            resolved?.substring(0, 100) + '...'
          )
        } else if (background.value.startsWith('data:')) {
          // Base64 data URL - use as-is for now (legacy support)
          // In the future, this could be enhanced to convert base64 to file URLs
          console.log('📋 [BACKGROUND_RENDERER] Using legacy base64 data URL')
          setResolvedUrl(background.value)
        } else {
          // Direct URL (http/https)
          setResolvedUrl(background.value)
          console.log(
            '🎨 [BACKGROUND_RENDERER] Using direct URL:',
            background.value?.substring(0, 100) + '...'
          )
        }
      } catch (error) {
        console.error('❌ [BACKGROUND_RENDERER] Failed to resolve background:', error)
        setResolvedUrl('')
        onError?.(error instanceof Error ? error : new Error(String(error)))
      }
    }

    resolveBackground()
  }, [background?.value, onError])

  // Don't render anything if no background
  if (!background) {
    return null
  }

  // Handle color and gradient backgrounds (don't need resolved URL)
  if (background.type === 'color' || background.type === 'gradient') {
    return (
      <div
        className={`absolute inset-0 ${className}`}
        style={{
          background: background.value,
          opacity: background.opacity || 1,
          zIndex: 0,
          ...style
        }}
      />
    )
  }

  // For media backgrounds, we need a resolved URL
  if (!resolvedUrl) {
    return null
  }

  // Handle image backgrounds
  if (background.type === 'image') {
    const backgroundSize = background.size === 'none' ? 'auto' : background.size || 'cover'
    const backgroundPosition = background.position || 'center'

    return (
      <img
        key={background.value} // Force re-render when background changes
        src={resolvedUrl}
        alt="Background"
        className={`absolute inset-0 w-full h-full object-cover ${className}`}
        style={{
          objectFit:
            backgroundSize === 'auto'
              ? 'none'
              : (backgroundSize as 'cover' | 'contain' | 'fill') || 'cover',
          objectPosition: backgroundPosition,
          opacity: background.opacity || 1,
          zIndex: 0,
          ...style
        }}
        onLoad={() => {
          console.log('🖼️ [BACKGROUND_RENDERER] Image loaded:', background.value)
          onLoad?.()
        }}
        onError={(e) => {
          console.error('🖼️ [BACKGROUND_RENDERER] Image error:', background.value, e)
          onError?.(new Error(`Image failed to load: ${background.value}`))
        }}
      />
    )
  }

  // Handle video backgrounds
  if (background.type === 'video') {
    const objectFit =
      background.size === 'cover'
        ? 'cover'
        : background.size === 'contain'
          ? 'contain'
          : background.size === 'fill'
            ? 'fill'
            : background.size === 'none'
              ? 'none'
              : 'cover'

    const objectPosition = background.position || 'center'

    // In preview mode, show static video thumbnail
    if (preview) {
      console.log('🎬 [BACKGROUND_RENDERER] Rendering video in PREVIEW mode:', background.value)
      return (
        <div
          className={`absolute inset-0 w-full h-full ${className}`}
          style={{
            backgroundColor: '#1a1a1a',
            opacity: background.opacity || 1,
            zIndex: 0,
            ...style
          }}
        >
          {/* Video thumbnail preview */}
          <video
            src={resolvedUrl}
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              objectFit: objectFit,
              objectPosition: objectPosition,
            }}
            muted
            preload="metadata"
            onLoadedMetadata={(e) => {
              try {
                // Seek to 1 second to get a preview frame
                const video = e.target as HTMLVideoElement
                video.currentTime = 1
                console.log('🎬 [BACKGROUND_RENDERER] Video metadata loaded, seeking to 1s for preview')
              } catch (error) {
                console.error('🎬 [BACKGROUND_RENDERER] Error seeking video for preview:', error)
              }
            }}
          />
          
        </div>
      )
    }

    // In live mode, show playing video
    console.log('🎬 [BACKGROUND_RENDERER] Rendering video in LIVE mode:', background.value)
    return (
      <video
        key={background.value} // Force re-render when background changes
        autoPlay
        loop
        muted
        playsInline
        className={`absolute inset-0 w-full h-full ${className}`}
        style={{
          objectFit: objectFit,
          objectPosition: objectPosition,
          opacity: background.opacity || 1,
          zIndex: 0,
          ...style
        }}
        onLoadStart={() => console.log('🎬 [BACKGROUND_RENDERER] Video load started')}
        onCanPlay={() => {
          console.log('🎬 [BACKGROUND_RENDERER] Video can play:', background.value)
          onLoad?.()
        }}
        onError={(e) => {
          console.error('🎬 [BACKGROUND_RENDERER] Video error:', background.value, e)
          onError?.(new Error(`Video failed to load: ${background.value}`))
        }}
      >
        <source src={resolvedUrl} type="video/mp4" />
      </video>
    )
  }

  // Unknown background type
  console.warn('🤔 [BACKGROUND_RENDERER] Unknown background type:', background.type)
  return null
}
