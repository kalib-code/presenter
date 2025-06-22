import React from 'react'
import { ScalingConfig, scaleTextSize, screenManager } from '@renderer/utils/screenScaling'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@renderer/constants/canvas'

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

  // Background styles
  let backgroundStyles: React.CSSProperties = {
    background: '#000'
  }

  let backgroundElement: JSX.Element | null = null

  if (background) {
    if (background.type === 'video' && background.value) {
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

      backgroundElement = (
        <video
          key={background.value}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full"
          style={{
            objectFit: objectFit,
            objectPosition: objectPosition,
            opacity: background.opacity || 1,
            zIndex: 1
          }}
        >
          <source src={background.value} type="video/mp4" />
        </video>
      )
    } else if (background.type === 'image' && background.value) {
      const backgroundSize = background.size === 'none' ? 'auto' : background.size || 'cover'
      const backgroundPosition = background.position || 'center'

      backgroundElement = (
        <img
          key={background.value}
          src={background.value}
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            objectFit:
              backgroundSize === 'auto'
                ? 'none'
                : (backgroundSize as 'cover' | 'contain' | 'fill') || 'cover',
            objectPosition: backgroundPosition,
            opacity: background.opacity || 1,
            zIndex: 1
          }}
        />
      )
    } else if (background.type === 'color' && background.value) {
      backgroundStyles = {
        background: background.value
      }
    }
  }

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        width: containerWidth,
        height: containerHeight,
        ...backgroundStyles
      }}
    >
      {backgroundElement}

      {/* Render text elements (hidden when showBlank is true) */}
      {!showBlank &&
        elements.map((element, index) => {
          if (element.type === 'text') {
            const style = element.style || {}

            // Scale position and size from canvas coordinates to container coordinates
            const scaledLeft = element.position.x * scale + offsetX
            const scaledTop = element.position.y * scale + offsetY
            const scaledWidth = element.size.width * scale
            const scaledHeight = element.size.height * scale

            // Use projection-aware text scaling if available
            let scaledFontSize = (style.fontSize || 48) * scale
            if (projectionConfig && useProjectionScaling) {
              scaledFontSize = scaleTextSize(style.fontSize || 48, projectionConfig)
            }

            return (
              <div
                key={element.id || `element-${index}`}
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
