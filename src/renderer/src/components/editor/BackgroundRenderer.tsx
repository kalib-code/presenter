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
  onLoad?: () => void
  onError?: (error: any) => void
}

export const BackgroundRenderer: React.FC<BackgroundRendererProps> = ({
  background,
  className = '',
  style = {},
  onLoad,
  onError
}) => {
  const [resolvedUrl, setResolvedUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)

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

      setIsLoading(true)

      try {
        if (isMediaReference(background.value)) {
          console.log('🎨 [BACKGROUND_RENDERER] Resolving media reference:', background.value)
          const resolved = await resolveMediaUrl(background.value)
          setResolvedUrl(resolved)
          console.log('✅ [BACKGROUND_RENDERER] Media resolved successfully:', resolved?.substring(0, 100) + '...')
        } else if (background.value.startsWith('data:')) {
          // Base64 data URL - use as-is for now (legacy support)
          // In the future, this could be enhanced to convert base64 to file URLs
          console.log('📋 [BACKGROUND_RENDERER] Using legacy base64 data URL')
          setResolvedUrl(background.value)
        } else {
          // Direct URL (http/https)
          setResolvedUrl(background.value)
          console.log('🎨 [BACKGROUND_RENDERER] Using direct URL:', background.value?.substring(0, 100) + '...')
        }
      } catch (error) {
        console.error('❌ [BACKGROUND_RENDERER] Failed to resolve background:', error)
        setResolvedUrl('')
        onError?.(error)
      } finally {
        setIsLoading(false)
      }
    }

    resolveBackground()
  }, [background?.value, onError])

  // Don't render anything if no background or no resolved URL
  if (!background || !resolvedUrl) {
    return null
  }

  // Handle color backgrounds
  if (background.type === 'color') {
    return (
      <div
        className={`absolute inset-0 ${className}`}
        style={{
          background: background.value,
          opacity: background.opacity || 1,
          zIndex: 1,
          ...style
        }}
      />
    )
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
          zIndex: 1,
          ...style
        }}
        onLoad={() => {
          console.log('🖼️ [BACKGROUND_RENDERER] Image loaded:', background.value)
          onLoad?.()
        }}
        onError={(e) => {
          console.error('🖼️ [BACKGROUND_RENDERER] Image error:', background.value, e)
          onError?.(e)
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
          zIndex: 1,
          ...style
        }}
        onLoadStart={() => console.log('🎬 [BACKGROUND_RENDERER] Video load started')}
        onCanPlay={() => {
          console.log('🎬 [BACKGROUND_RENDERER] Video can play:', background.value)
          onLoad?.()
        }}
        onError={(e) => {
          console.error('🎬 [BACKGROUND_RENDERER] Video error:', background.value, e)
          onError?.(e)
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
