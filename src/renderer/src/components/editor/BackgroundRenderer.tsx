import React, { useState, useEffect } from 'react'
import { resolveMediaUrl, isMediaReference } from '@renderer/utils/mediaUtils'
import { resolutionManager, getCurrentProjectionResolution } from '@renderer/utils/resolutionManager'
import { Resolution } from '@renderer/types/resolution'

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
  useProjectionQuality?: boolean // When true, uses projection-optimized quality settings
  targetResolution?: Resolution // Optional target resolution for quality optimization
}

export const BackgroundRenderer: React.FC<BackgroundRendererProps> = ({
  background,
  className = '',
  style = {},
  preview = false,
  onLoad,
  onError,
  useProjectionQuality = false,
  targetResolution
}) => {
  const [resolvedUrl, setResolvedUrl] = useState<string>('')
  const [currentResolution, setCurrentResolution] = useState<Resolution | null>(null)
  const [recommendedQuality, setRecommendedQuality] = useState<'ultra' | 'high' | 'medium' | 'low'>('medium')
  const [backgroundKey, setBackgroundKey] = useState<string>('')

  // Initialize resolution awareness
  useEffect(() => {
    const initializeResolution = async (): Promise<void> => {
      try {
        const resolution = targetResolution || getCurrentProjectionResolution()
        setCurrentResolution(resolution)
        
        if (resolution && useProjectionQuality) {
          const quality = resolutionManager.getRecommendedBackgroundQuality()
          setRecommendedQuality(quality)
          
          console.log('🎨 [BACKGROUND_RENDERER] Resolution-aware quality:', {
            resolution: `${resolution.width}x${resolution.height}`,
            category: resolution.category,
            recommendedQuality: quality,
            useProjectionQuality
          })
        }
      } catch (error) {
        console.warn('🎨 [BACKGROUND_RENDERER] Failed to initialize resolution:', error)
      }
    }

    if (useProjectionQuality) {
      initializeResolution()
    }
  }, [useProjectionQuality, targetResolution])

  // Generate unique key for background changes and force re-render
  useEffect(() => {
    if (background) {
      // Create a unique key that includes all background properties
      const newKey = `${background.type}-${background.value}-${background.opacity || 1}-${background.size || 'cover'}-${background.position || 'center'}-${Date.now()}`
      setBackgroundKey(newKey)
      console.log('🔄 [BACKGROUND_RENDERER] Background changed, new key:', newKey)
    } else {
      setBackgroundKey('')
    }
  }, [background])

  // Resolve media URL when background changes
  useEffect(() => {
    const resolveBackground = async (): Promise<void> => {
      console.log('🎨 [BACKGROUND_RENDERER] Resolving background:', {
        hasBackground: !!background,
        type: background?.type,
        value: background?.value?.substring(0, 100) + '...',
        hasValue: !!background?.value,
        opacity: background?.opacity,
        size: background?.size,
        position: background?.position,
        preview,
        useProjectionQuality,
        currentResolution: currentResolution?.commonName,
        recommendedQuality,
        backgroundKey
      })

      // Clear previous URL first to force re-render
      setResolvedUrl('')

      if (!background?.value) {
        console.log('🎨 [BACKGROUND_RENDERER] No background value, keeping resolved URL empty')
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
  }, [background, onError, backgroundKey]) // Watch entire background object and key

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
    // Always use cover for background images to fill the area completely (default behavior)
    // Only allow other values if explicitly set and not undefined/null
    const objectFit = background.size === 'contain' ? 'contain' : 
                      background.size === 'fill' ? 'fill' : 
                      background.size === 'none' ? 'none' : 'cover'
    const objectPosition = background.position || 'center'

    console.log('🖼️ [BACKGROUND_RENDERER] Image background settings:', {
      objectFit,
      objectPosition,
      backgroundSize: background.size,
      originalSize: background.size,
      willFillArea: objectFit === 'cover'
    })

    return (
      <img
        key={backgroundKey || background.value} // Use unique key for proper re-rendering
        src={resolvedUrl}
        alt="Background"
        className={`absolute inset-0 w-full h-full ${className}`}
        style={{
          objectFit: objectFit,
          objectPosition: objectPosition,
          opacity: background.opacity || 1,
          zIndex: 0,
          ...style
        }}
        onLoad={() => {
          console.log('🖼️ [BACKGROUND_RENDERER] Image loaded with object-fit:', objectFit, 'key:', backgroundKey)
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
    // Always default to cover for video backgrounds to eliminate black bars
    // Only use other values if explicitly needed (rarely for video backgrounds)
    const objectFit =
      background.size === 'contain' ? 'cover' :  // Force cover even if contain is set
      background.size === 'fill' ? 'fill' :
      background.size === 'none' ? 'cover' : 'cover'  // Force cover for 'none' as well

    const objectPosition = background.position || 'center'

    console.log('🎬 [BACKGROUND_RENDERER] Video background settings:', {
      objectFit,
      objectPosition,
      backgroundSize: background.size,
      originalSize: background.size,
      forcedToCover: background.size === 'contain' || background.size === 'none',
      willFillArea: objectFit === 'cover',
      preview
    })

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
            key={backgroundKey || background.value} // Use unique key for proper re-rendering
            src={resolvedUrl}
            className="absolute inset-0 w-full h-full"
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
                console.log('🎬 [BACKGROUND_RENDERER] Video preview metadata loaded, seeking to 1s for preview, key:', backgroundKey)
              } catch (error) {
                console.error('🎬 [BACKGROUND_RENDERER] Error seeking video for preview:', error)
              }
            }}
          />
          
        </div>
      )
    }

    // In live mode, show playing video with resolution-aware quality
    console.log('🎬 [BACKGROUND_RENDERER] Rendering video in LIVE mode:', {
      url: background.value,
      useProjectionQuality,
      recommendedQuality,
      resolution: currentResolution?.commonName
    })
    
    // Get video-specific attributes based on quality level
    const getVideoAttributes = () => {
      const baseAttributes = {
        autoPlay: true,
        loop: true,
        muted: true,
        playsInline: true
      }

      if (useProjectionQuality && currentResolution) {
        // Add quality optimizations based on resolution category
        switch (recommendedQuality) {
          case 'ultra':
          case 'high':
            return {
              ...baseAttributes,
              preload: 'auto' as const,
              // Enable hardware acceleration hints
              style: { willChange: 'transform' }
            }
          case 'medium':
            return {
              ...baseAttributes,
              preload: 'metadata' as const
            }
          case 'low':
            return {
              ...baseAttributes,
              preload: 'none' as const
            }
        }
      }

      return baseAttributes
    }

    const videoAttributes = getVideoAttributes()

    return (
      <video
        key={backgroundKey || background.value} // Use unique key for proper re-rendering
        {...videoAttributes}
        className={`absolute inset-0 w-full h-full ${className}`}
        style={{
          objectFit: objectFit,
          objectPosition: objectPosition,
          opacity: background.opacity || 1,
          zIndex: 0,
          ...style,
          ...videoAttributes.style
        }}
        onLoadStart={() => console.log('🎬 [BACKGROUND_RENDERER] Video load started, key:', backgroundKey)}
        onCanPlay={() => {
          console.log('🎬 [BACKGROUND_RENDERER] Video can play:', background.value, 'key:', backgroundKey)
          onLoad?.()
        }}
        onError={(e) => {
          console.error('🎬 [BACKGROUND_RENDERER] Video error:', background.value, e)
          onError?.(new Error(`Video failed to load: ${background.value}`))
        }}
      >
        <source 
          key={backgroundKey || `${background.value}-source`} // Also key the source element
          src={resolvedUrl} 
          type="video/mp4" 
        />
      </video>
    )
  }

  // Unknown background type
  console.warn('🤔 [BACKGROUND_RENDERER] Unknown background type:', background.type)
  return null
}
