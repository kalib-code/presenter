import React, { useState, useEffect } from 'react'
import { ScalingConfig, scaleTextSize, screenManager } from '@renderer/utils/screenScaling'
import { resolveMediaUrl, isMediaReference } from '@renderer/utils/mediaUtils'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@renderer/constants/canvas'
import { BackgroundRenderer } from './BackgroundRenderer'

// Helper function to generate placeholder for missing media
const generatePlaceholderForElement = (content: string): string => {
  const filename = content.replace('media://', '')
  const isVideo = filename.toLowerCase().match(/\.(mp4|webm|mov|avi)$/i)
  const isImage = filename.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i)

  let svg: string

  if (isVideo) {
    svg = `
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" fill="#333"/>
        <text x="200" y="130" text-anchor="middle" fill="white" font-family="Arial" font-size="14">
          Video Not Found
        </text>
        <text x="200" y="150" text-anchor="middle" fill="#ccc" font-family="Arial" font-size="12">
          ${filename}
        </text>
        <circle cx="200" cy="180" r="25" fill="white" opacity="0.7"/>
        <polygon points="190,170 190,190 210,180" fill="#333"/>
      </svg>
    `
  } else if (isImage) {
    svg = `
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" fill="#f0f0f0"/>
        <text x="200" y="130" text-anchor="middle" fill="#666" font-family="Arial" font-size="14">
          Image Not Found
        </text>
        <text x="200" y="150" text-anchor="middle" fill="#999" font-family="Arial" font-size="12">
          ${filename}
        </text>
        <rect x="170" y="170" width="60" height="40" fill="none" stroke="#999" stroke-width="2"/>
        <circle cx="180" cy="185" r="5" fill="#999"/>
        <polygon points="185,195 195,185 205,195 200,200 190,200" fill="#999"/>
      </svg>
    `
  } else {
    svg = `
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" fill="#444"/>
        <text x="200" y="130" text-anchor="middle" fill="white" font-family="Arial" font-size="14">
          Media Not Found
        </text>
        <text x="200" y="150" text-anchor="middle" fill="#ccc" font-family="Arial" font-size="12">
          ${filename}
        </text>
        <rect x="180" y="170" width="40" height="30" fill="none" stroke="white" stroke-width="2"/>
        <text x="200" y="187" text-anchor="middle" fill="white" font-family="Arial" font-size="10">?</text>
      </svg>
    `
  }

  return `data:image/svg+xml;base64,${btoa(svg)}`
}

interface SlideElement {
  id?: string // Optional to match existing data structure
  type: 'text' | 'image' | 'video'
  content: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  style: {
    fontSize?: number
    color?: string
    fontFamily?: string
    fontWeight?: string
    fontStyle?: string
    textAlign?: string
    textShadow?: string
    lineHeight?: number
    opacity?: number
  }
  zIndex?: number
}

interface Background {
  type: string // Use string to match existing data structure
  value: string
  opacity?: number
  playbackRate?: number
  size?: 'cover' | 'contain' | 'fill' | 'none'
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right'
}

interface SlideRendererProps {
  elements: SlideElement[]
  slideBackground?: Background
  globalBackground?: Background
  containerWidth: number
  containerHeight: number
  isPreview?: boolean // true for editor preview, false for live presentation
  showBlank?: boolean // hide text elements when true
  className?: string
  scalingConfig?: ScalingConfig // Optional scaling config for projection scaling
  useProjectionScaling?: boolean // Whether to use projection-aware scaling
}

// Canvas dimensions imported from constants

// Component for handling media element rendering with URL resolution
const MediaElement: React.FC<{
  element: SlideElement
  scaledLeft: number
  scaledTop: number
  scaledWidth: number
  scaledHeight: number
  isPreview: boolean
  index: number
}> = ({ element, scaledLeft, scaledTop, scaledWidth, scaledHeight, isPreview, index }) => {
  const [resolvedUrl, setResolvedUrl] = useState<string>(element.content)
  const [isPlaceholder, setIsPlaceholder] = useState<boolean>(false)

  useEffect(() => {
    const loadUrl = async (): Promise<void> => {
      if (isMediaReference(element.content)) {
        console.log('🔍 [SLIDE_RENDERER] Resolving media reference:', element.content)
        try {
          const resolved = await resolveMediaUrl(element.content)
          console.log('🔍 [SLIDE_RENDERER] Raw resolved result:', {
            original: element.content,
            resolved,
            type: typeof resolved
          })

          // Check if the resolved URL is a placeholder (SVG data URL)
          const isPlaceholderUrl = resolved.startsWith('data:image/svg+xml;base64,')

          // Update both states together to avoid race conditions
          setResolvedUrl(resolved)
          setIsPlaceholder(isPlaceholderUrl)

          if (isPlaceholderUrl) {
            console.log('📋 [SLIDE_RENDERER] Using placeholder for missing media:', element.content)
          } else {
            console.log(
              '✅ [SLIDE_RENDERER] Successfully resolved media:',
              element.content,
              'URL length:',
              resolved.length
            )
          }
        } catch (error) {
          console.error('❌ [SLIDE_RENDERER] Failed to resolve media:', element.content, error)
          // Fallback to placeholder on error
          const placeholder = await resolveMediaUrl(element.content) // This should return a placeholder
          setResolvedUrl(placeholder)
          setIsPlaceholder(true)
        }
      } else {
        setResolvedUrl(element.content)
        setIsPlaceholder(false)
      }
    }

    loadUrl()
  }, [element.content])

  // Common styles for positioning
  const commonStyles = {
    left: scaledLeft,
    top: scaledTop,
    width: scaledWidth,
    height: scaledHeight,
    opacity: element.style?.opacity || 1,
    zIndex: element.zIndex || 10,
    pointerEvents: isPreview ? 'auto' : 'none'
  } as const

  if (element.type === 'image') {
    return (
      <img
        key={element.id || `image-element-${index}`}
        src={resolvedUrl}
        alt="Slide image"
        className="absolute object-cover"
        style={commonStyles}
        onLoad={(): void =>
          console.log('🖼️ [SLIDE_RENDERER] Image loaded successfully:', element.content)
        }
        onError={(e): void => {
          console.error('🖼️ [SLIDE_RENDERER] Image failed to load:', {
            originalContent: element.content,
            resolvedUrl: resolvedUrl,
            isPlaceholder: isPlaceholder,
            error: e.nativeEvent
          })

          // If it fails and it's still a media:// URL, force regenerate placeholder
          if (resolvedUrl.startsWith('media://')) {
            console.warn(
              '🔄 [SLIDE_RENDERER] Forcing placeholder for failed media URL:',
              resolvedUrl
            )
            // This will trigger a re-render with placeholder
            setResolvedUrl(generatePlaceholderForElement(element.content))
            setIsPlaceholder(true)
          }
        }}
      />
    )
  } else if (element.type === 'video') {
    // If it's a placeholder, render as an image instead of trying to play as video
    if (isPlaceholder) {
      return (
        <img
          key={element.id || `video-placeholder-${index}`}
          src={resolvedUrl}
          alt="Video placeholder"
          className="absolute object-cover"
          style={commonStyles}
          onLoad={(): void =>
            console.log('📋 [SLIDE_RENDERER] Video placeholder loaded:', element.content)
          }
          onError={(e): void => {
            console.error('📋 [SLIDE_RENDERER] Video placeholder failed to load:', {
              originalContent: element.content,
              resolvedUrl: resolvedUrl,
              error: e.nativeEvent
            })
          }}
        />
      )
    }

    // Regular video rendering for actual video files
    return (
      <video
        key={element.id || `video-element-${index}`}
        src={resolvedUrl}
        autoPlay
        loop
        muted
        playsInline
        className="absolute object-cover"
        style={commonStyles}
        onLoadStart={(): void =>
          console.log('🎬 [SLIDE_RENDERER] Video load started:', element.content)
        }
        onCanPlay={(): void => console.log('🎬 [SLIDE_RENDERER] Video can play:', element.content)}
        onError={(e): void => {
          console.error('🎬 [SLIDE_RENDERER] Video failed to load:', {
            originalContent: element.content,
            resolvedUrl: resolvedUrl,
            isPlaceholder: isPlaceholder,
            error: e.nativeEvent
          })
        }}
      >
        <source src={resolvedUrl} type="video/mp4" />
      </video>
    )
  }

  return null
}

export const SlideRenderer: React.FC<SlideRendererProps> = ({
  elements,
  slideBackground,
  globalBackground,
  containerWidth,
  containerHeight,
  isPreview = false,
  showBlank = false,
  className = '',
  scalingConfig,
  useProjectionScaling = false
}) => {
  // Get projection scaling config if requested
  const projectionConfig =
    useProjectionScaling && !scalingConfig ? screenManager.getCurrentScalingConfig() : scalingConfig

  // Calculate scaling factors to adapt from canvas coordinates to container size
  let scaleX = containerWidth / CANVAS_WIDTH
  let scaleY = containerHeight / CANVAS_HEIGHT
  let scale = Math.min(scaleX, scaleY) // Use smaller scale to maintain aspect ratio

  // Override with projection scaling if available
  if (projectionConfig && useProjectionScaling) {
    // For projection, use the projection config's scaling
    scaleX = projectionConfig.scaleX
    scaleY = projectionConfig.scaleY
    scale = projectionConfig.uniformScale
  }

  // Calculate offsets to center the scaled canvas
  const scaledCanvasWidth = CANVAS_WIDTH * scale
  const scaledCanvasHeight = CANVAS_HEIGHT * scale
  const offsetX = (containerWidth - scaledCanvasWidth) / 2
  const offsetY = (containerHeight - scaledCanvasHeight) / 2

  // Debug logging for preview mode
  if (isPreview) {
    console.log('🎨 [SLIDE_RENDERER] Scaling calculation:', {
      containerSize: `${containerWidth}x${containerHeight}`,
      canvasSize: `${CANVAS_WIDTH}x${CANVAS_HEIGHT}`,
      scaleFactors: {
        scaleX: scaleX.toFixed(3),
        scaleY: scaleY.toFixed(3),
        finalScale: scale.toFixed(3)
      },
      scaledCanvas: `${scaledCanvasWidth.toFixed(0)}x${scaledCanvasHeight.toFixed(0)}`,
      offsets: { x: offsetX.toFixed(0), y: offsetY.toFixed(0) },
      elementsCount: elements.length
    })
  }

  // Determine which background to use (slide background takes precedence)
  const background = slideBackground || globalBackground

  return (
    <div
      className={`relative overflow-hidden bg-black ${className}`}
      style={{
        width: containerWidth,
        height: containerHeight
      }}
    >
      <BackgroundRenderer background={background} />

      {/* Render all elements (hidden when showBlank is true) */}
      {!showBlank &&
        elements.map((element, index) => {
          // Scale position and size from canvas coordinates to container coordinates
          const scaledLeft = element.position.x * scale + offsetX
          const scaledTop = element.position.y * scale + offsetY
          const scaledWidth = element.size.width * scale
          const scaledHeight = element.size.height * scale

          if (element.type === 'text') {
            const style = element.style || {}

            // Use projection-aware text scaling if available
            let scaledFontSize = (style.fontSize || 48) * scale
            if (projectionConfig && useProjectionScaling) {
              scaledFontSize = scaleTextSize(style.fontSize || 48, projectionConfig)
            }

            return (
              <div
                key={element.id || `text-element-${index}`}
                className="absolute flex items-center"
                style={{
                  left: scaledLeft,
                  top: scaledTop,
                  width: scaledWidth,
                  height: scaledHeight,
                  color: style.color || '#FFFFFF',
                  fontFamily: style.fontFamily || 'Arial, sans-serif',
                  fontSize: `${scaledFontSize}px`,
                  fontWeight: style.fontWeight || 'bold',
                  fontStyle: style.fontStyle || 'normal',
                  textAlign: (style.textAlign as 'left' | 'center' | 'right') || 'center',
                  lineHeight: style.lineHeight || 1.2,
                  textShadow: style.textShadow || '2px 2px 4px rgba(0,0,0,0.8)',
                  opacity: style.opacity || 1,
                  zIndex: element.zIndex || 10,
                  justifyContent:
                    style.textAlign === 'left'
                      ? 'flex-start'
                      : style.textAlign === 'right'
                        ? 'flex-end'
                        : 'center',
                  whiteSpace: 'pre-line',
                  // Add pointer events for editor preview mode
                  pointerEvents: isPreview ? 'auto' : 'none'
                }}
              >
                {element.content}
              </div>
            )
          } else if (element.type === 'image' || element.type === 'video') {
            return (
              <MediaElement
                key={element.id || `media-element-${index}`}
                element={element}
                scaledLeft={scaledLeft}
                scaledTop={scaledTop}
                scaledWidth={scaledWidth}
                scaledHeight={scaledHeight}
                isPreview={isPreview}
                index={index}
              />
            )
          }
          return null
        })}

      {/* Show canvas dimensions for preview mode */}
      {isPreview && (
        <div className="absolute bottom-2 right-2 text-xs text-slate-400 bg-slate-800/80 px-2 py-1 rounded">
          {CANVAS_WIDTH} × {CANVAS_HEIGHT} (scaled {(scale * 100).toFixed(0)}%)
        </div>
      )}
    </div>
  )
}

// Constants are now exported from @renderer/constants/canvas
