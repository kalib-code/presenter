import React, { useState, useEffect } from 'react'
import { ScalingConfig, scaleTextSize, scaleTextSizeEnhanced, screenManager } from '@renderer/utils/screenScaling'
import { resolveMediaUrl, isMediaReference } from '@renderer/utils/mediaUtils'
import { CANVAS_WIDTH, CANVAS_HEIGHT, BASE_CANVAS_WIDTH, BASE_CANVAS_HEIGHT, getCanvasDimensionsForResolution, getProjectionCanvasDimensions } from '@renderer/constants/canvas'
import { BackgroundRenderer } from './BackgroundRenderer'
import { resolutionManager, getCurrentProjectionResolution } from '@renderer/utils/resolutionManager'
import { Resolution } from '@renderer/types/resolution'

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
  globalAudioControls?: any // Global audio controls for registering live projection audio
  mediaConfig?: {
    url?: string
    autoplay?: boolean
    loop?: boolean
    volume?: number
    startTime?: number
    endTime?: number
    controls?: boolean
    muted?: boolean
    thumbnail?: string
    mediaType?: 'video' | 'image' | 'audio'
    aspectRatio?: '16:9' | '4:3' | '1:1' | 'auto'
    objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down'
    backgroundAudio?: {
      url?: string
      volume?: number
      loop?: boolean
      autoplay?: boolean
      fadeIn?: number
      fadeOut?: number
    }
  } // Media configuration for background audio support
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
  mediaConfig?: SlideRendererProps['mediaConfig']
  globalAudioControls?: any
}> = ({ element, scaledLeft, scaledTop, scaledWidth, scaledHeight, isPreview, index, mediaConfig, globalAudioControls }) => {
  const [resolvedUrl, setResolvedUrl] = useState<string>(element.content)
  const [isPlaceholder, setIsPlaceholder] = useState<boolean>(false)
  const [resolvedBackgroundAudioUrl, setResolvedBackgroundAudioUrl] = useState<string>('')
  const [backgroundAudioPlaying, setBackgroundAudioPlaying] = useState<boolean>(false)
  const backgroundAudioRef = React.useRef<HTMLAudioElement>(null)

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

  // Handle background audio URL resolution for video and image elements
  useEffect(() => {
    const loadBackgroundAudio = async (): Promise<void> => {
      if ((element.type === 'video' || element.type === 'image') && mediaConfig?.backgroundAudio?.url) {
        console.log(`🎵 [SLIDE_RENDERER] Resolving background audio URL for ${element.type}:`, mediaConfig.backgroundAudio.url)
        try {
          if (isMediaReference(mediaConfig.backgroundAudio.url)) {
            const resolved = await resolveMediaUrl(mediaConfig.backgroundAudio.url)
            setResolvedBackgroundAudioUrl(resolved)
            console.log(`🎵 [SLIDE_RENDERER] Background audio URL resolved for ${element.type}:`, {
              original: mediaConfig.backgroundAudio.url,
              resolved: resolved?.substring(0, 100) + '...'
            })
          } else {
            setResolvedBackgroundAudioUrl(mediaConfig.backgroundAudio.url)
          }
        } catch (error) {
          console.error(`🎵 [SLIDE_RENDERER] Failed to resolve background audio URL for ${element.type}:`, error)
        }
      }
    }

    loadBackgroundAudio()
  }, [element.type, mediaConfig?.backgroundAudio?.url])

  // Handle background audio setup and autoplay for video and image elements
  useEffect(() => {
    const backgroundAudio = backgroundAudioRef.current
    if (
      (element.type === 'video' || element.type === 'image') && 
      backgroundAudio && 
      resolvedBackgroundAudioUrl &&
      !isPreview // Only handle in live mode, not preview
    ) {
      console.log(`🎵 [SLIDE_RENDERER] Setting up background audio for ${element.type}:`, {
        hasAutoplay: !!mediaConfig?.backgroundAudio?.autoplay,
        volume: mediaConfig?.backgroundAudio?.volume,
        loop: mediaConfig?.backgroundAudio?.loop
      })
      
      backgroundAudio.src = resolvedBackgroundAudioUrl
      backgroundAudio.volume = mediaConfig?.backgroundAudio?.volume || 0.5
      backgroundAudio.loop = mediaConfig?.backgroundAudio?.loop || false
      
      // Register with global audio controls in live presentation mode
      if (globalAudioControls) {
        console.log(`🎵 [SLIDE_RENDERER] Registering background audio with global controls for ${element.type}`)
        globalAudioControls.registerAudio(backgroundAudio, `Live: ${element.type} Background Audio`)
      }
      
      // Send audio state to main window via IPC
      const sendAudioStateUpdate = () => {
        if (window.electron?.ipcRenderer) {
          const audioState = {
            currentTrack: `Live: ${element.type} Background Audio`,
            duration: backgroundAudio.duration || 0,
            currentTime: backgroundAudio.currentTime || 0,
            volume: backgroundAudio.volume || 0.5,
            muted: backgroundAudio.muted || false,
            isPlaying: !backgroundAudio.paused
          }
          window.electron.ipcRenderer.send('audio-state-sync', audioState)
          console.log(`🎵 [SLIDE_RENDERER] Sent audio state to main window:`, audioState)
        }
      }
      
      // Set up audio event listeners for state sync
      const handlePlay = () => {
        setBackgroundAudioPlaying(true)
        sendAudioStateUpdate()
        console.log(`🎵 [SLIDE_RENDERER] Background audio started playing for ${element.type} in live mode`)
      }
      
      const handlePause = () => {
        setBackgroundAudioPlaying(false)
        sendAudioStateUpdate()
        console.log(`🎵 [SLIDE_RENDERER] Background audio paused for ${element.type}`)
      }
      
      const handleTimeUpdate = () => {
        sendAudioStateUpdate()
      }
      
      backgroundAudio.addEventListener('play', handlePlay)
      backgroundAudio.addEventListener('pause', handlePause)
      backgroundAudio.addEventListener('timeupdate', handleTimeUpdate)
      
      // Auto-play background audio in live presentation mode
      console.log(`🎵 [SLIDE_RENDERER] Starting background audio for ${element.type} in live presentation`)
      
      // Check if audio element is still in the DOM before playing
      if (backgroundAudioRef.current && backgroundAudioRef.current.isConnected) {
        backgroundAudio.play().then(() => {
          handlePlay()
        }).catch((error) => {
          if (error.name === 'AbortError') {
            console.log(`🎵 [SLIDE_RENDERER] Background audio autoplay aborted for ${element.type} (component unmounted)`)
          } else {
            console.error(`🎵 [SLIDE_RENDERER] Background audio autoplay failed for ${element.type} in live mode:`, error)
          }
        })
      } else {
        console.log(`🎵 [SLIDE_RENDERER] Background audio element not available for ${element.type}`)
      }
      
      // Cleanup function
      return () => {
        backgroundAudio.removeEventListener('play', handlePlay)
        backgroundAudio.removeEventListener('pause', handlePause)
        backgroundAudio.removeEventListener('timeupdate', handleTimeUpdate)
      }
    }
  }, [resolvedBackgroundAudioUrl, element.type, isPreview, mediaConfig?.backgroundAudio?.volume, mediaConfig?.backgroundAudio?.loop])

  // Listen for audio control commands from main window (only in live mode)
  useEffect(() => {
    if (!isPreview && backgroundAudioRef.current && window.electron?.ipcRenderer) {
      const handleAudioControl = (event: any, command: any) => {
        const audio = backgroundAudioRef.current
        if (!audio) return
        
        console.log(`🎵 [SLIDE_RENDERER] Received audio control command:`, command)
        
        switch (command.action) {
          case 'play':
            audio.play().catch(console.error)
            break
          case 'pause':
            audio.pause()
            break
          case 'stop':
            audio.pause()
            audio.currentTime = 0
            break
          case 'setVolume':
            audio.volume = command.value
            break
          case 'setMuted':
            audio.muted = command.value
            break
          case 'seek':
            audio.currentTime = command.value
            break
        }
      }
      
      window.electron.ipcRenderer.on('audio-control', handleAudioControl)
      
      return () => {
        window.electron?.ipcRenderer.removeListener('audio-control', handleAudioControl)
      }
    }
  }, [isPreview, backgroundAudioRef.current])

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
      <div className="relative">
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
        
        {/* Background Audio Element for Image */}
        {element.type === 'image' && mediaConfig?.backgroundAudio?.url && (
          <audio 
            ref={backgroundAudioRef}
            onPlay={() => {
              setBackgroundAudioPlaying(true)
              console.log('🎵 [SLIDE_RENDERER] Background audio started for image')
            }}
            onPause={() => {
              setBackgroundAudioPlaying(false)
              console.log('🎵 [SLIDE_RENDERER] Background audio paused for image')
            }}
            onError={(e) => {
              console.error('🎵 [SLIDE_RENDERER] Background audio failed to load for image:', e.nativeEvent)
            }}
          />
        )}
        
        {/* Background Audio Indicator (only in preview mode) */}
        {element.type === 'image' && mediaConfig?.backgroundAudio?.url && isPreview && (
          <div 
            className="absolute top-1 right-1 bg-black/80 text-white text-xs px-2 py-1 rounded"
            style={{ 
              left: scaledLeft + scaledWidth - 80,
              top: scaledTop + 4,
              zIndex: (element.zIndex || 10) + 1 
            }}
          >
            🎵 {backgroundAudioPlaying ? 'Playing' : 'Ready'}
          </div>
        )}
      </div>
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
      <div className="relative">
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
        
        {/* Background Audio Element for Video */}
        {element.type === 'video' && mediaConfig?.backgroundAudio?.url && (
          <audio 
            ref={backgroundAudioRef}
            onPlay={() => {
              setBackgroundAudioPlaying(true)
              console.log('🎵 [SLIDE_RENDERER] Background audio started')
            }}
            onPause={() => {
              setBackgroundAudioPlaying(false)
              console.log('🎵 [SLIDE_RENDERER] Background audio paused')
            }}
            onError={(e) => {
              console.error('🎵 [SLIDE_RENDERER] Background audio failed to load:', e.nativeEvent)
            }}
          />
        )}
        
        {/* Background Audio Indicator (only in preview mode) */}
        {element.type === 'video' && mediaConfig?.backgroundAudio?.url && isPreview && (
          <div 
            className="absolute top-1 right-1 bg-black/80 text-white text-xs px-2 py-1 rounded"
            style={{ 
              left: scaledLeft + scaledWidth - 80,
              top: scaledTop + 4,
              zIndex: (element.zIndex || 10) + 1 
            }}
          >
            🎵 {backgroundAudioPlaying ? 'Playing' : 'Ready'}
          </div>
        )}
      </div>
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
  useProjectionScaling = false,
  globalAudioControls,
  mediaConfig
}) => {
  // Get enhanced projection scaling config with multi-resolution support
  const projectionConfig =
    useProjectionScaling && !scalingConfig ? screenManager.getCurrentScalingConfig() : scalingConfig

  // Get current projection resolution for enhanced scaling
  const currentResolution = useProjectionScaling ? getCurrentProjectionResolution() : null
  
  // Determine canvas dimensions based on resolution and context
  let canvasWidth = CANVAS_WIDTH   // Legacy fallback
  let canvasHeight = CANVAS_HEIGHT  // Legacy fallback
  
  if (useProjectionScaling && currentResolution) {
    // Use resolution-aware canvas dimensions for projection
    const projectionCanvas = getProjectionCanvasDimensions(containerWidth, containerHeight)
    canvasWidth = projectionCanvas.width
    canvasHeight = projectionCanvas.height
    
    console.log('🎨 [SLIDE_RENDERER] Using projection canvas dimensions:', {
      resolution: `${currentResolution.width}x${currentResolution.height}`,
      category: currentResolution.category,
      canvasSize: `${canvasWidth}x${canvasHeight}`,
      containerSize: `${containerWidth}x${containerHeight}`
    })
  } else if (isPreview) {
    // Use legacy canvas dimensions for preview
    canvasWidth = CANVAS_WIDTH
    canvasHeight = CANVAS_HEIGHT
  }

  // Calculate scaling factors to adapt from canvas coordinates to container size
  let scaleX = containerWidth / canvasWidth
  let scaleY = containerHeight / canvasHeight
  let scale = Math.min(scaleX, scaleY) // Use smaller scale to maintain aspect ratio

  // Override with projection scaling if available and using projection mode
  if (projectionConfig && useProjectionScaling) {
    // For projection, use the enhanced projection config's scaling
    scaleX = projectionConfig.scaleX
    scaleY = projectionConfig.scaleY
    scale = projectionConfig.uniformScale
  }

  // Calculate offsets to center the scaled canvas
  const scaledCanvasWidth = canvasWidth * scale
  const scaledCanvasHeight = canvasHeight * scale
  const offsetX = (containerWidth - scaledCanvasWidth) / 2
  const offsetY = (containerHeight - scaledCanvasHeight) / 2

  // Enhanced debug logging
  if (isPreview || useProjectionScaling) {
    console.log('🎨 [SLIDE_RENDERER] Enhanced scaling calculation:', {
      containerSize: `${containerWidth}x${containerHeight}`,
      canvasSize: `${canvasWidth}x${canvasHeight}`,
      scaleFactors: {
        scaleX: scaleX.toFixed(3),
        scaleY: scaleY.toFixed(3),
        finalScale: scale.toFixed(3)
      },
      scaledCanvas: `${scaledCanvasWidth.toFixed(0)}x${scaledCanvasHeight.toFixed(0)}`,
      offsets: { x: offsetX.toFixed(0), y: offsetY.toFixed(0) },
      elementsCount: elements.length,
      projectionMode: useProjectionScaling,
      currentResolution: currentResolution?.commonName,
      resolutionCategory: currentResolution?.category,
      isPreview
    })
  }

  // Determine which background to use (slide background takes precedence)
  const background = slideBackground || globalBackground

  // Debug background selection in SlideRenderer
  console.log('🎨 [SLIDE_RENDERER] Background selection:', {
    hasSlideBackground: !!slideBackground,
    slideBackground: slideBackground,
    hasGlobalBackground: !!globalBackground,
    globalBackground: globalBackground,
    finalBackground: background,
    isPreview: isPreview,
    useProjectionScaling: useProjectionScaling
  })

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

            // Use enhanced resolution-aware text scaling
            let scaledFontSize = (style.fontSize || 48) * scale
            
            if (useProjectionScaling && currentResolution) {
              // Use enhanced multi-resolution text scaling
              const context = isPreview ? 'preview' : 'projection'
              scaledFontSize = scaleTextSizeEnhanced(
                style.fontSize || 48, 
                currentResolution, 
                1, // DPI will be handled by resolution manager
                context
              )
              
              console.log('🔤 [SLIDE_RENDERER] Enhanced text scaling:', {
                originalSize: style.fontSize || 48,
                scaledSize: scaledFontSize,
                resolution: currentResolution.category,
                context
              })
            } else if (projectionConfig && useProjectionScaling) {
              // Fallback to legacy scaling
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
                mediaConfig={mediaConfig}
                globalAudioControls={globalAudioControls}
              />
            )
          }
          return null
        })}

      {/* Show canvas dimensions for preview mode with enhanced info */}
      {isPreview && (
        <div className="absolute bottom-2 right-2 text-xs text-slate-400 bg-slate-800/80 px-2 py-1 rounded">
          <div>{canvasWidth} × {canvasHeight} (scaled {(scale * 100).toFixed(0)}%)</div>
          {currentResolution && (
            <div className="text-[10px] opacity-75">
              Target: {currentResolution.commonName} ({currentResolution.category})
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Constants are now exported from @renderer/constants/canvas
