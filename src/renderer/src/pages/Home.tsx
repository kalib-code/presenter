import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSetlistStore } from '@renderer/store/setlist'
import { useSongStore } from '@renderer/store/song'
import { usePresentationStore } from '@renderer/store/presentation'
import { screenManager, DisplayInfo, scaleTextSizeEnhanced } from '@renderer/utils/screenScaling'
import { resolveMediaUrl, isMediaReference } from '@renderer/utils/mediaUtils'
import { CANVAS_WIDTH, CANVAS_HEIGHT, getPreviewCanvasDimensions } from '@renderer/constants/canvas'
import { BackgroundRenderer } from '@renderer/components/editor/BackgroundRenderer'
import { resolutionManager, getCurrentProjectionResolution } from '@renderer/utils/resolutionManager'
import { Button } from '@renderer/components/ui/button'
import { Badge } from '@renderer/components/ui/badge'
import { Separator } from '@renderer/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Square,
  ChevronLeft,
  ChevronRight,
  Monitor,
  MonitorOff,
  Image,
  Music,
  Presentation,
  MessageSquare,
  Timer,
  Eye,
  EyeOff,
  ChevronDown,
  List,
  GripVertical,
  Clock,
  Plus,
  ChevronUp,
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward
} from 'lucide-react'
import type { Setlist, SetlistItem } from '@renderer/types/database'
import { defaultTemplates, applyTemplateVariables, type SetlistTemplate } from '@renderer/lib/setlist-templates'

interface ContentCard {
  id: string
  title: string
  content: string
  type: 'verse' | 'chorus' | 'bridge' | 'slide' | 'announcement' | 'countdown'
  order: number
  elementStyles?: {
    fontSize?: number
    color?: string
    fontFamily?: string
    fontWeight?: string
    fontStyle?: string
    textAlign?: string
    textShadow?: string
    lineHeight?: number
    left?: number
    top?: number
    width?: number
    height?: number
    transform?: string
    opacity?: number
  }
  slideBackground?: {
    type: string
    value: string
    opacity?: number
  }
  globalBackground?: {
    type: string
    value: string
    opacity?: number
  }
  // Media configuration for standalone media items
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
  }
  slideElements?: Array<{
    id: string
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
  }>
  // Enhanced countdown configuration
  countdownConfig?: {
    title?: string
    message?: string
    duration?: number
    styling?: {
      counterSize?: 'small' | 'medium' | 'large' | 'extra-large'
      counterColor?: string
      titleSize?: 'small' | 'medium' | 'large'
      titleColor?: string
      messageSize?: 'small' | 'medium' | 'large'
      messageColor?: string
      textShadow?: boolean
    }
    background?: {
      type: 'color' | 'image' | 'video'
      value: string
      opacity?: number
      size?: 'cover' | 'contain' | 'fill' | 'none'
      position?: 'center' | 'top' | 'bottom' | 'left' | 'right'
    }
  }
}

interface ProjectionState {
  isProjecting: boolean
  isBlank: boolean
  showLogo: boolean
  currentContent: string
  currentTitle: string
}

// Sortable setlist item component
interface SortableSetlistItemProps {
  item: SetlistItem
  index: number
  isSelected: boolean
  onSelect: (item: SetlistItem) => void
  getItemIcon: (type: string) => JSX.Element
}

// Sortable content card component
interface SortableContentCardProps {
  card: ContentCard
  isSelected: boolean
  onSelect: (card: ContentCard) => void
  getCardStyling: (type: string) => string
  selectedCardId?: string
  globalAudioControls?: any
  hasUserInteracted?: boolean
}

function SortableSetlistItem({
  item,
  index,
  isSelected,
  onSelect,
  getItemIcon
}: SortableSetlistItemProps): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`w-full p-3 rounded-lg text-left transition-colors border ${
        isSelected
          ? 'bg-primary text-primary-foreground border-primary'
          : 'hover:bg-accent border-border'
      } ${isDragging ? 'z-50' : ''}`}
    >
      <div className="flex items-center gap-3">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="w-3 h-3" />
        </div>

        {/* Item Content */}
        <button onClick={() => onSelect(item)} className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-xs font-mono w-6">{index + 1}</span>
          {getItemIcon(item.type)}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="font-medium truncate">{item.title}</div>
              {item.duration && (
                <span className="text-xs text-muted-foreground font-mono shrink-0">
                  {Math.floor(item.duration / 60)}m
                </span>
              )}
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}

// Component for rendering media elements in preview with URL resolution
// Extracted PreviewMediaElement component to prevent re-mounting on every render
interface PreviewMediaElementProps {
  element: {
    id: string
    type: 'text' | 'image' | 'video'
    content: string
    style: {
      opacity?: number
    }
  }
  scaledLeft: number
  scaledTop: number
  scaledWidth: number
  scaledHeight: number
}

const PreviewMediaElement: React.FC<PreviewMediaElementProps> = ({
  element,
  scaledLeft,
  scaledTop,
  scaledWidth,
  scaledHeight
}) => {
  const [resolvedUrl, setResolvedUrl] = useState<string>(element.content)

  useEffect(() => {
    const loadUrl = async (): Promise<void> => {
      if (isMediaReference(element.content)) {
        try {
          const resolved = await resolveMediaUrl(element.content)
          setResolvedUrl(resolved)
          console.log(
            '🔍 [PREVIEW] Resolved media URL:',
            element.content,
            '→',
            resolved.substring(0, 50) + '...'
          )
        } catch (error) {
          console.error('❌ [PREVIEW] Failed to resolve media URL:', element.content, error)
          setResolvedUrl(element.content) // Fallback to original
        }
      } else {
        setResolvedUrl(element.content)
      }
    }

    loadUrl()
  }, [element.content])

  const commonStyles = {
    left: `${scaledLeft}px`,
    top: `${scaledTop}px`,
    width: `${scaledWidth}px`,
    height: `${scaledHeight}px`,
    opacity: element.style.opacity || 1
  }

  if (element.type === 'image') {
    return (
      <img
        src={resolvedUrl}
        alt="Slide element"
        className="absolute object-cover"
        style={commonStyles}
        onError={() => {
          console.error('🖼️ [PREVIEW] Image failed to load:', element.content, resolvedUrl)
        }}
      />
    )
  } else if (element.type === 'video') {
    return (
      <video
        src={resolvedUrl}
        className="absolute object-cover"
        style={commonStyles}
        muted
        loop
        autoPlay
        playsInline
        onError={() => {
          console.error('🎬 [PREVIEW] Video failed to load:', element.content, resolvedUrl)
        }}
      />
    )
  }

  return null
}

// Helper function to calculate optimal preview text size based on current projection resolution
function getOptimalPreviewTextSize(): string {
  try {
    // Get current projection resolution
    const projectionResolution = getCurrentProjectionResolution()
    
    if (projectionResolution) {
      // Base text size for preview cards (smaller than projection)
      const baseSize = 48 // Base size for 1080p projection
      
      // Calculate optimal size for current resolution with preview context
      const optimalSize = scaleTextSizeEnhanced(
        baseSize, 
        projectionResolution, 
        1, // DPI scale (will be handled by screenManager)
        'preview'
      )
      
      // Scale down for preview card size (cards are much smaller than full screen)
      const previewScale = 0.3 // Preview cards are roughly 30% of full screen
      const finalSize = Math.max(optimalSize * previewScale, 10) // Minimum 10px
      
      console.log('🎯 [PREVIEW-TEXT] Calculated optimal text size:', {
        projectionResolution: `${projectionResolution.width}x${projectionResolution.height}`,
        category: projectionResolution.category,
        baseSize,
        optimalSize,
        finalSize: Math.round(finalSize)
      })
      
      return `${Math.round(finalSize)}px`
    }
  } catch (error) {
    console.warn('🎯 [PREVIEW-TEXT] Failed to calculate optimal text size, using fallback:', error)
  }
  
  // Fallback to responsive size based on screen manager
  try {
    const fallbackSize = screenManager.getOptimalTextSize(48, 'preview')
    const scaledSize = Math.max(fallbackSize * 0.3, 10)
    return `${Math.round(scaledSize)}px`
  } catch (error) {
    console.warn('🎯 [PREVIEW-TEXT] Screen manager fallback failed, using fixed size:', error)
  }
  
  // Final fallback
  return '15px'
}

// Function to render card content as projection preview (16:9 aspect ratio)
function renderCardContent(card: ContentCard, selectedCardId?: string, globalAudioControls?: any, hasUserInteracted: boolean = false): JSX.Element {
  console.log(
    'Rendering card:',
    card.title,
    'Type:',
    card.type,
    'Content length:',
    card.content.length,
    'Has slideElements:',
    !!card.slideElements,
    'Elements count:',
    card.slideElements?.length || 0
  )

  // Render countdown content specially
  if (card.type === 'countdown') {
    // Use enhanced config if available, fallback to legacy parsing
    const countdownConfig = card.countdownConfig
    const countdownMatch =
      card.content.match(/(\d+)s - (.+)/) || card.content.match(/(\d+)s - (.+)/)

    const duration =
      countdownConfig?.duration || (countdownMatch ? parseInt(countdownMatch[1]) : 300)
    const title = countdownConfig?.title || 'Countdown'
    const message = countdownConfig?.message || (countdownMatch ? countdownMatch[2] : card.content)
    const styling = countdownConfig?.styling
    const background = countdownConfig?.background || card.slideBackground || card.globalBackground

    // Size classes for preview
    const getCounterSizeClass = (size?: string): string => {
      switch (size) {
        case 'small':
          return 'text-2xl'
        case 'medium':
          return 'text-3xl'
        case 'large':
          return 'text-4xl'
        case 'extra-large':
          return 'text-5xl'
        default:
          return 'text-4xl'
      }
    }

    const getTitleSizeClass = (size?: string): string => {
      switch (size) {
        case 'small':
          return 'text-sm'
        case 'medium':
          return 'text-lg'
        case 'large':
          return 'text-xl'
        default:
          return 'text-lg'
      }
    }

    const getMessageSizeClass = (size?: string): string => {
      switch (size) {
        case 'small':
          return 'text-xs'
        case 'medium':
          return 'text-sm'
        case 'large':
          return 'text-lg'
        default:
          return 'text-sm'
      }
    }

    return (
      <div className="w-full aspect-video bg-black rounded border border-gray-300 relative overflow-hidden">
        {/* Background Layer - Use BackgroundRenderer for consistency */}
        <BackgroundRenderer
          background={
            background || {
              type: 'gradient',
              value: 'linear-gradient(135deg, #DC2626, #EA580C)',
              opacity: 1
            }
          }
          preview={true}
          key={`countdown-${background?.type || 'gradient'}-${background?.value || 'default'}`}
        />

        {/* Content overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center" style={{ zIndex: 10 }}>
          <div
            className={`font-bold mb-2 ${getTitleSizeClass(styling?.titleSize)}`}
            style={{
              color: styling?.titleColor || '#FFFFFF',
              textShadow: styling?.textShadow !== false ? '1px 1px 2px rgba(0,0,0,0.8)' : 'none'
            }}
          >
            {title}
          </div>

          <div
            className={`font-bold font-mono mb-2 ${getCounterSizeClass(styling?.counterSize)}`}
            style={{
              color: styling?.counterColor || '#FFFFFF',
              textShadow: styling?.textShadow !== false ? '1px 1px 2px rgba(0,0,0,0.8)' : 'none'
            }}
          >
            {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
          </div>

          <div
            className={`${getMessageSizeClass(styling?.messageSize)}`}
            style={{
              color: styling?.messageColor || '#FFFFFF',
              textShadow: styling?.textShadow !== false ? '1px 1px 2px rgba(0,0,0,0.8)' : 'none'
            }}
          >
            {message}
          </div>
        </div>
      </div>
    )
  }

  // Regular content rendering - simplified with just centered text
  return (
    <div className="w-full aspect-video bg-black rounded border border-gray-300 relative overflow-hidden">
      {/* Background Layer - Render all background types for regular content */}
      {(() => {
        const background = card.slideBackground || card.globalBackground

        // Render all background types (image, video, color, gradient)
        if (background) {
          console.log('🎨 [CARD_CONTENT] Rendering background:', {
            type: background.type,
            value: background.value?.substring(0, 100) + '...',
            cardTitle: card.title
          })
          return <BackgroundRenderer 
            background={background} 
            preview={true} 
            key={`${card.id}-${background.type}-${background.value}`}
          />
        }

        return null
      })()}

      {/* Content Layer - Handle slideElements if present, otherwise show text */}
      {card.slideElements && card.slideElements.length > 0 ? (
        <div className="absolute inset-0" style={{ zIndex: 10 }}>
          {/* Render slide elements with proper positioning and scaling */}
          {card.slideElements
            .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
            .map((element, index) => {
              // Calculate preview scale (assuming preview is 400x225 for 16:9 aspect ratio)
              const previewWidth = 400 // Approximate preview width
              const previewHeight = 225 // Approximate preview height
              const scaleX = previewWidth / 1920 // Canvas width from constants
              const scaleY = previewHeight / 1080 // Canvas height from constants
              const scale = Math.min(scaleX, scaleY)

              const scaledPosition = {
                x: element.position.x * scale,
                y: element.position.y * scale
              }
              const scaledSize = {
                width: element.size.width * scale,
                height: element.size.height * scale
              }

              console.log('🎬 [PREVIEW] Rendering slide element:', {
                type: element.type,
                id: element.id,
                contentLength: element.content?.length || 0,
                originalPosition: element.position,
                scaledPosition,
                originalSize: element.size,
                scaledSize,
                scale
              })

              switch (element.type) {
                case 'text':
                  return (
                    <div
                      key={element.id}
                      className="absolute overflow-hidden"
                      style={{
                        left: scaledPosition.x,
                        top: scaledPosition.y,
                        width: scaledSize.width,
                        height: scaledSize.height,
                        fontSize: `${(element.style?.fontSize || 24) * scale}px`,
                        color: element.style?.color || '#FFFFFF',
                        fontFamily: element.style?.fontFamily || 'Arial, sans-serif',
                        fontWeight: element.style?.fontWeight || 'bold',
                        fontStyle: element.style?.fontStyle || 'normal',
                        textAlign: element.style?.textAlign as any || 'center',
                        textShadow: element.style?.textShadow || '2px 2px 4px rgba(0,0,0,0.8)',
                        lineHeight: element.style?.lineHeight || 1.2,
                        opacity: element.style?.opacity || 1,
                        zIndex: element.zIndex || 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {element.content}
                    </div>
                  )

                case 'image':
                  return (
                    <ImagePreview 
                      element={element} 
                      isSelectedCard={selectedCardId === card.id} 
                      card={card}
                      scaledPosition={scaledPosition}
                      scaledSize={scaledSize}
                      globalAudioControls={globalAudioControls}
                      hasUserInteracted={hasUserInteracted}
                    />
                  )

                case 'video':
                  console.log('🎬 [PREVIEW] Rendering video element:', {
                    elementId: element.id,
                    videoSrc: element.content,
                    hasContent: !!element.content,
                    cardTitle: card.title,
                    cardHasMediaConfig: !!card.mediaConfig,
                    cardMediaUrl: card.mediaConfig?.url,
                    cardHasBackgroundAudio: !!(card.mediaConfig?.backgroundAudio?.url),
                    backgroundAudioUrl: card.mediaConfig?.backgroundAudio?.url,
                    scaledPosition,
                    scaledSize,
                    elementStyle: element.style
                  })
                  
                  // For preview, we need to handle media URL resolution
                  const VideoPreview = ({ element, isSelectedCard }: { element: any; isSelectedCard: boolean }) => {
                    const [resolvedVideoUrl, setResolvedVideoUrl] = useState<string>('')
                    const [resolvedBackgroundAudioUrl, setResolvedBackgroundAudioUrl] = useState<string>('')
                    const [backgroundAudioPlaying, setBackgroundAudioPlaying] = useState(false)
                    const backgroundAudioRef = useRef<HTMLAudioElement>(null)
                    
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

                    // Handle background audio URL resolution
                    useEffect(() => {
                      const resolveBackgroundAudio = async () => {
                        try {
                          if (card.mediaConfig?.backgroundAudio?.url) {
                            console.log('🎵 [PREVIEW] Resolving background audio URL:', card.mediaConfig.backgroundAudio.url)
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

                    // Handle background audio setup and autoplay
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
                        
                        // Don't auto-play on item selection - only play when slide is actually projected
                        console.log('🎵 [PREVIEW] Background audio setup complete, ready for slide projection')
                      }
                    }, [resolvedBackgroundAudioUrl, card.mediaConfig?.backgroundAudio?.autoplay, card.mediaConfig?.backgroundAudio?.volume, card.mediaConfig?.backgroundAudio?.loop])

                    // Setup background audio when this video becomes the selected card (no auto-play)
                    useEffect(() => {
                      const backgroundAudio = backgroundAudioRef.current
                      
                      if (isSelectedCard && backgroundAudio && resolvedBackgroundAudioUrl && card.mediaConfig?.backgroundAudio?.url) {
                        console.log('🎵 [PREVIEW] Registering background audio for selected video item (no auto-play)')
                        
                        // Register with global audio manager but don't auto-play
                        globalAudioControls?.registerAudio(backgroundAudio, `Video: ${card.title}`)
                        console.log('🎵 [PREVIEW] Background audio ready - will only play when slide is projected')
                      } else if (!isSelectedCard && backgroundAudio && backgroundAudioPlaying) {
                        // Stop audio when this item is no longer selected
                        console.log('🎵 [PREVIEW] Stopping background audio for deselected video item')
                        backgroundAudio.pause()
                        backgroundAudio.currentTime = 0
                        setBackgroundAudioPlaying(false)
                      }
                    }, [isSelectedCard, resolvedBackgroundAudioUrl, backgroundAudioPlaying])
                    
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
                    
                    return (
                      <div className="relative">
                        <video
                          key={`${element.id}-${resolvedVideoUrl}`}
                          src={resolvedVideoUrl}
                          className="absolute object-cover"
                          style={{
                            left: scaledPosition.x,
                            top: scaledPosition.y,
                            width: scaledSize.width,
                            height: scaledSize.height,
                            opacity: element.style?.opacity || 1,
                            zIndex: element.zIndex || 1,
                            backgroundColor: '#000' // Add black background for debugging
                          }}
                          muted
                          preload="metadata"
                          onError={(e) => {
                            console.error('🎬 [PREVIEW] Video failed to load:', {
                              src: element.content,
                              error: e,
                              cardTitle: card.title,
                              hasBackgroundAudio: !!(card.mediaConfig?.backgroundAudio?.url)
                            })
                          }}
                          onLoadStart={() => {
                            console.log('🎬 [PREVIEW] Video load started:', element.content?.substring(0, 50) + '...')
                          }}
                          onLoadedMetadata={(e) => {
                            try {
                              // Seek to 1 second for preview thumbnail
                              const video = e.target as HTMLVideoElement
                              console.log('🎬 [PREVIEW] Video metadata loaded:', {
                                duration: video.duration,
                                videoWidth: video.videoWidth,
                                videoHeight: video.videoHeight,
                                readyState: video.readyState
                              })
                              video.currentTime = 1
                              console.log('🎬 [PREVIEW] Video seeking to 1s for preview')
                            } catch (error) {
                              console.error('🎬 [PREVIEW] Error seeking video for preview:', error)
                            }
                          }}
                          onCanPlay={() => {
                            console.log('🎬 [PREVIEW] Video can play:', resolvedVideoUrl?.substring(0, 50) + '...')
                          }}
                        />
                        
                        {/* Background Audio Element */}
                        {card.mediaConfig?.backgroundAudio?.url && (
                          <audio 
                            ref={backgroundAudioRef}
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
                        
                        {/* Background Audio Indicator */}
                        {card.mediaConfig?.backgroundAudio?.url && (
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
                
                return <VideoPreview element={element} isSelectedCard={selectedCardId === card.id} />

                default:
                  return null
              }
            })}
        </div>
      ) : (
        /* Fallback to text-only rendering when no slideElements */
        <div className="absolute inset-0 flex items-center justify-center p-4" style={{ zIndex: 10 }}>
          <div
            className="text-center drop-shadow-lg whitespace-pre-line overflow-hidden w-full"
            style={{
              fontSize: getOptimalPreviewTextSize(),
              color: '#FFFFFF',
              fontFamily: 'Arial, sans-serif',
              fontWeight: 'bold',
              textAlign: 'center',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              lineHeight: 1.3,
              opacity: 1
            }}
          >
            {card.content || `[No content for ${card.title}]`}
          </div>
        </div>
      )}
    </div>
  )
}

function SortableContentCard({
  card,
  isSelected,
  onSelect,
  getCardStyling,
  selectedCardId,
  globalAudioControls,
  hasUserInteracted
}: SortableContentCardProps): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  return (
    <div ref={setNodeRef} style={style} className={`relative group ${isDragging ? 'z-50' : ''}`}>
      <div
        className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-md cursor-pointer ${
          isSelected ? 'border-primary ring-2 ring-primary/20' : getCardStyling(card.type)
        }`}
        onClick={() => onSelect(card)}
      >
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 right-2 cursor-grab active:cursor-grabbing p-1 bg-black/10 hover:bg-black/20 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10"
          onClick={(e) => {
            e.stopPropagation()
          }}
        >
          <GripVertical className="w-3 h-3" />
        </div>

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {card.title}
            </Badge>
            {(card.type === 'verse' || card.type === 'chorus' || card.type === 'bridge') && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                Lyrics
              </Badge>
            )}
          </div>
          {isSelected && <div className="w-2 h-2 bg-primary rounded-full"></div>}
        </div>

        {/* Content Preview */}
        <div className="relative">{renderCardContent(card, selectedCardId, globalAudioControls, hasUserInteracted)}</div>
      </div>
    </div>
  )
}

// ImagePreview component extracted to prevent re-mounting issues
interface ImagePreviewProps {
  element: any
  isSelectedCard: boolean
  card: any
  scaledPosition: any
  scaledSize: any
  globalAudioControls: any
  hasUserInteracted: boolean
}

const ImagePreview = ({ element, isSelectedCard, card, scaledPosition, scaledSize, globalAudioControls, hasUserInteracted }: ImagePreviewProps) => {
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string>('')
  const [resolvedBackgroundAudioUrl, setResolvedBackgroundAudioUrl] = useState<string>('')
  const [backgroundAudioPlaying, setBackgroundAudioPlaying] = useState(false)
  const backgroundAudioRef = useRef<HTMLAudioElement>(null)
  
  useEffect(() => {
    const resolveImage = async () => {
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
    const resolveBackgroundAudio = async () => {
      try {
        if (card.mediaConfig?.backgroundAudio?.url) {
          console.log('🎵 [PREVIEW] Resolving background audio URL for image:', card.mediaConfig.backgroundAudio.url)
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
      console.log('🎵 [PREVIEW] Background audio setup complete for image, ready for slide projection')
    }
  }, [resolvedBackgroundAudioUrl, card.mediaConfig?.backgroundAudio?.autoplay, card.mediaConfig?.backgroundAudio?.volume, card.mediaConfig?.backgroundAudio?.loop])

  // Setup background audio when this image becomes the selected card (no auto-play)
  useEffect(() => {
    const backgroundAudio = backgroundAudioRef.current
    
    if (isSelectedCard && backgroundAudio && resolvedBackgroundAudioUrl && card.mediaConfig?.backgroundAudio?.url) {
      console.log('🎵 [PREVIEW] Registering background audio for selected image item (no auto-play)')
      
      // Register with global audio manager but don't auto-play
      globalAudioControls?.registerAudio(backgroundAudio, `Image: ${card.title}`)
      console.log('🎵 [PREVIEW] Background audio ready - will only play when slide is projected')
    } else if (!isSelectedCard && backgroundAudio && backgroundAudioPlaying) {
      // Stop audio when this item is no longer selected
      console.log('🎵 [PREVIEW] Stopping background audio for deselected image item')
      backgroundAudio.pause()
      backgroundAudio.currentTime = 0
      setBackgroundAudioPlaying(false)
    }
  }, [isSelectedCard, resolvedBackgroundAudioUrl, backgroundAudioPlaying])
  
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
  
  return (
    <div className="relative">
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
          console.log('🖼️ [PREVIEW] Image loaded successfully:', resolvedImageUrl?.substring(0, 50) + '...')
        }}
      />
      
      {/* Background Audio Element for Image */}
      {card.mediaConfig?.backgroundAudio?.url && (
        <audio 
          ref={backgroundAudioRef}
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
      
      {/* Background Audio Indicator */}
      {card.mediaConfig?.backgroundAudio?.url && (
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

export default function Home(): JSX.Element {
  const { setlists, loadSetlists, updateSetlist, currentSetlist, isPresenting, getRecentItems, addItem, createSetlist } = useSetlistStore()
  const { songs, fetchSongs } = useSongStore()
  const { presentations, loadPresentations } = usePresentationStore()

  // State management
  const [selectedSetlist, setSelectedSetlist] = useState<Setlist | null>(null)
  const [selectedItem, setSelectedItem] = useState<SetlistItem | null>(null)
  const [contentCards, setContentCards] = useState<ContentCard[]>([])
  const [selectedCard, setSelectedCard] = useState<ContentCard | null>(null)
  const [showRecentItems, setShowRecentItems] = useState(false)
  const [liveCountdown, setLiveCountdown] = useState<{ time: number; active: boolean; config?: ContentCard['countdownConfig'] } | null>(null)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [mediaState, setMediaState] = useState<{ isPlaying: boolean; volume: number; currentTime: number; duration: number; muted: boolean }>({
    isPlaying: false,
    volume: 0.8,
    currentTime: 0,
    duration: 0,
    muted: false
  })
  
  // Global audio control state
  const [globalAudioState, setGlobalAudioState] = useState<{
    isPlaying: boolean
    currentTime: number
    duration: number
    volume: number
    muted: boolean
    currentTrack: string | null
  }>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.5,
    muted: false,
    currentTrack: null
  })

  // Ref to track the currently active audio element
  const activeAudioRef = useRef<HTMLAudioElement | null>(null)
  
  // Track user interaction for autoplay permissions
  const [hasUserInteracted, setHasUserInteracted] = useState(false)
  
  // Enable autoplay after first user interaction
  useEffect(() => {
    const enableAutoplay = () => {
      if (!hasUserInteracted) {
        setHasUserInteracted(true)
        console.log('🎵 [GLOBAL] User interaction detected - audio autoplay now available')
      }
    }

    // Listen for any user interaction events
    const events = ['click', 'keydown', 'touchstart']
    events.forEach(event => {
      document.addEventListener(event, enableAutoplay, { once: true })
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, enableAutoplay)
      })
    }
  }, [hasUserInteracted])

  // Global audio manager to prevent audio stacking and provide controls
  useEffect(() => {
    // Stop all background audio when selectedCard changes
    const stopAllBackgroundAudio = () => {
      const allAudioElements = document.querySelectorAll('audio')
      allAudioElements.forEach((audio) => {
        if (!audio.paused) {
          console.log('🎵 [GLOBAL] Stopping background audio element')
          audio.pause()
          audio.currentTime = 0
        }
      })
      activeAudioRef.current = null
      setGlobalAudioState(prev => ({ ...prev, isPlaying: false, currentTime: 0, duration: 0, currentTrack: null }))
    }
    
    stopAllBackgroundAudio()
  }, [selectedCard?.id])

  // Global audio control functions
  const globalAudioControls = {
    play: () => {
      // Try to find any audio element that's currently active
      const findAndControlAudio = () => {
        // First try the activeAudioRef
        if (activeAudioRef.current && !activeAudioRef.current.paused) {
          console.log('🎵 [GLOBAL] Found audio in activeAudioRef, resuming...')
          activeAudioRef.current.play()
          return true
        }
        
        // Search for any audio elements in the current document
        const audioElements = document.querySelectorAll('audio')
        console.log('🎵 [GLOBAL] Searching for active audio elements, found:', audioElements.length)
        
        for (const audio of audioElements) {
          if (audio.src && !audio.paused) {
            console.log('🎵 [GLOBAL] Found playing audio element, controlling it')
            audio.play()
            return true
          }
        }
        
        // Try to find paused audio that we can resume
        for (const audio of audioElements) {
          if (audio.src && audio.readyState >= 2) { // HAVE_CURRENT_DATA
            console.log('🎵 [GLOBAL] Found paused audio element, attempting to play')
            audio.play().then(() => {
              setGlobalAudioState(prev => ({ ...prev, isPlaying: true }))
              // Update activeAudioRef to this audio
              activeAudioRef.current = audio
            }).catch(console.error)
            return true
          }
        }
        
        return false
      }
      
      if (findAndControlAudio()) {
        setGlobalAudioState(prev => ({ ...prev, isPlaying: true }))
        console.log('🎵 [GLOBAL] Audio playback started via global controls')
      } else {
        // Send IPC command to control projection window audio as fallback
        window.electron?.ipcRenderer.send('audio-control', { action: 'play' })
        setGlobalAudioState(prev => ({ ...prev, isPlaying: true }))
        console.log('🎵 [GLOBAL] No local audio found, sent play command to projection window')
      }
    },
    pause: () => {
      // Find and pause any playing audio
      const audioElements = document.querySelectorAll('audio')
      let foundAudio = false
      
      for (const audio of audioElements) {
        if (audio.src && !audio.paused) {
          console.log('🎵 [GLOBAL] Found playing audio, pausing it')
          audio.pause()
          foundAudio = true
          // Update activeAudioRef to track this audio
          activeAudioRef.current = audio
        }
      }
      
      if (foundAudio) {
        setGlobalAudioState(prev => ({ ...prev, isPlaying: false }))
        console.log('🎵 [GLOBAL] Audio paused via global controls')
      } else {
        // Send IPC command to control projection window audio
        window.electron?.ipcRenderer.send('audio-control', { action: 'pause' })
        setGlobalAudioState(prev => ({ ...prev, isPlaying: false }))
        console.log('🎵 [GLOBAL] No local audio found, sent pause command to projection window')
      }
    },
    stop: () => {
      // Find and stop any audio
      const audioElements = document.querySelectorAll('audio')
      let foundAudio = false
      
      for (const audio of audioElements) {
        if (audio.src) {
          console.log('🎵 [GLOBAL] Found audio element, stopping it')
          audio.pause()
          audio.currentTime = 0
          foundAudio = true
          activeAudioRef.current = audio
        }
      }
      
      if (foundAudio) {
        setGlobalAudioState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }))
        console.log('🎵 [GLOBAL] Audio stopped via global controls')
      } else {
        // Send IPC command to control projection window audio
        window.electron?.ipcRenderer.send('audio-control', { action: 'stop' })
        setGlobalAudioState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }))
        console.log('🎵 [GLOBAL] No local audio found, sent stop command to projection window')
      }
    },
    setVolume: (volume: number) => {
      // Find and set volume for any audio
      const audioElements = document.querySelectorAll('audio')
      let foundAudio = false
      
      for (const audio of audioElements) {
        if (audio.src) {
          console.log('🎵 [GLOBAL] Found audio element, setting volume to', volume)
          audio.volume = volume
          foundAudio = true
          activeAudioRef.current = audio
        }
      }
      
      if (foundAudio) {
        setGlobalAudioState(prev => ({ ...prev, volume }))
        console.log('🎵 [GLOBAL] Volume set via global controls')
      } else {
        // Send IPC command to control projection window audio
        window.electron?.ipcRenderer.send('audio-control', { action: 'setVolume', value: volume })
        setGlobalAudioState(prev => ({ ...prev, volume }))
        console.log('🎵 [GLOBAL] No local audio found, sent volume command to projection window')
      }
    },
    setMuted: (muted: boolean) => {
      // Find and set muted for any audio
      const audioElements = document.querySelectorAll('audio')
      let foundAudio = false
      
      for (const audio of audioElements) {
        if (audio.src) {
          console.log('🎵 [GLOBAL] Found audio element, setting muted to', muted)
          audio.muted = muted
          foundAudio = true
          activeAudioRef.current = audio
        }
      }
      
      if (foundAudio) {
        setGlobalAudioState(prev => ({ ...prev, muted }))
        console.log('🎵 [GLOBAL] Muted state set via global controls')
      } else {
        // Send IPC command to control projection window audio
        window.electron?.ipcRenderer.send('audio-control', { action: 'setMuted', value: muted })
        setGlobalAudioState(prev => ({ ...prev, muted }))
        console.log('🎵 [GLOBAL] No local audio found, sent muted command to projection window')
      }
    },
    seek: (time: number) => {
      // Find and seek any audio
      const audioElements = document.querySelectorAll('audio')
      let foundAudio = false
      
      for (const audio of audioElements) {
        if (audio.src && audio.readyState >= 2) {
          console.log('🎵 [GLOBAL] Found audio element, seeking to', time)
          audio.currentTime = time
          foundAudio = true
          activeAudioRef.current = audio
        }
      }
      
      if (foundAudio) {
        setGlobalAudioState(prev => ({ ...prev, currentTime: time }))
        console.log('🎵 [GLOBAL] Seek completed via global controls')
      } else {
        // Send IPC command to control projection window audio
        window.electron?.ipcRenderer.send('audio-control', { action: 'seek', value: time })
        setGlobalAudioState(prev => ({ ...prev, currentTime: time }))
        console.log('🎵 [GLOBAL] No local audio found, sent seek command to projection window')
      }
    },
    registerAudio: (audio: HTMLAudioElement, trackName: string) => {
      // Stop any previously playing audio before registering new one
      if (activeAudioRef.current && activeAudioRef.current !== audio) {
        console.log('🎵 [GLOBAL] Stopping previous audio before registering new one')
        if (!activeAudioRef.current.paused) {
          activeAudioRef.current.pause()
          activeAudioRef.current.currentTime = 0
        }
      }
      
      activeAudioRef.current = audio
      setGlobalAudioState(prev => ({ 
        ...prev, 
        currentTrack: trackName,
        duration: audio.duration || 0,
        currentTime: audio.currentTime || 0,
        volume: audio.volume || 0.5,
        muted: audio.muted || false,
        isPlaying: !audio.paused
      }))
      console.log('🎵 [GLOBAL] Registered audio:', trackName)
    }
  }

  // Update audio state timer - now searches for any active audio
  useEffect(() => {
    const updateAudioState = () => {
      // Try activeAudioRef first
      let targetAudio = activeAudioRef.current
      
      // If no activeAudioRef or it's paused, search for any playing audio
      if (!targetAudio || targetAudio.paused) {
        const audioElements = document.querySelectorAll('audio')
        for (const audio of audioElements) {
          if (audio.src && !audio.paused) {
            targetAudio = audio
            // Update activeAudioRef to track this audio
            activeAudioRef.current = audio
            break
          }
        }
      }
      
      if (targetAudio && !targetAudio.paused) {
        const currentTime = targetAudio.currentTime || 0
        const duration = targetAudio.duration || 0
        const isPlaying = !targetAudio.paused
        const volume = targetAudio.volume || 0.5
        const muted = targetAudio.muted || false
        
        // Only update state if values have meaningfully changed (avoid unnecessary re-renders)
        setGlobalAudioState(prev => {
          const timeDiff = Math.abs(prev.currentTime - currentTime)
          const durationDiff = Math.abs(prev.duration - duration)
          const volumeDiff = Math.abs(prev.volume - volume)
          
          if (timeDiff > 0.5 || durationDiff > 0.1 || prev.isPlaying !== isPlaying || volumeDiff > 0.01 || prev.muted !== muted) {
            return {
              ...prev,
              currentTime,
              duration,
              isPlaying,
              volume,
              muted
            }
          }
          return prev // No change needed
        })
      } else {
        // No audio playing, update state to reflect that
        setGlobalAudioState(prev => {
          if (prev.isPlaying) {
            return { ...prev, isPlaying: false }
          }
          return prev
        })
      }
    }

    // Reduced frequency from 100ms to 500ms to minimize backend load
    const interval = setInterval(updateAudioState, 500) // Update every 500ms - still smooth but 5x fewer requests
    return () => clearInterval(interval)
  }, [])

  // Cleanup audio when selectedItem changes or component unmounts
  useEffect(() => {
    return () => {
      // Stop any playing audio when selectedItem changes
      if (activeAudioRef.current && !activeAudioRef.current.paused) {
        console.log('🎵 [GLOBAL] Stopping audio due to item change')
        activeAudioRef.current.pause()
        activeAudioRef.current.currentTime = 0
        setGlobalAudioState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }))
      }
    }
  }, [selectedItem?.id])

  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  const [projectionState, setProjectionState] = useState<ProjectionState>({
    isProjecting: false,
    isBlank: false,
    showLogo: false,
    currentContent: '',
    currentTitle: ''
  })

  // Screen detection state
  const [currentProjectionDisplay, setCurrentProjectionDisplay] = useState<DisplayInfo | null>(null)
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  })

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  // Load data on mount
  useEffect(() => {
    loadSetlists()
    fetchSongs()
    loadPresentations()

    // Set up IPC listeners for audio state sync from projection window
    const handleAudioStateUpdate = (event: any, audioState: any) => {
      console.log('🎵 [GLOBAL] Received audio state update from projection window:', audioState)
      setGlobalAudioState(prev => ({
        ...prev,
        ...audioState
      }))
    }

    window.electron?.ipcRenderer.on('audio-state-update', handleAudioStateUpdate)

    // Initialize screen manager and resolution manager
    const initializeScreens = async (): Promise<void> => {
      // Initialize both managers
      await Promise.all([
        screenManager.initialize(),
        resolutionManager.initialize()
      ])
      
      const displays = screenManager.getDisplays()
      const projectionDisplay = screenManager.getCurrentProjectionDisplay()
      const resolutionState = resolutionManager.getState()

      setCurrentProjectionDisplay(projectionDisplay)

      if (projectionDisplay) {
        console.log('📺 [HOME] Initialized screens and resolution support:', {
          displaysCount: displays.length,
          currentDisplay: projectionDisplay.id,
          resolutionCategory: resolutionState.currentProjectionDisplay?.resolution.category,
          textScale: resolutionState.currentProjectionDisplay?.scalingConfig.textScale
        })
      }
    }

    initializeScreens().catch(console.error)

    // Listen for display changes
    const unsubscribe = screenManager.onDisplaysChanged((displays) => {
      console.log('📺 [HOME] Displays changed:', displays.length)
      const currentDisplay = screenManager.getCurrentProjectionDisplay()
      if (currentDisplay) {
        setCurrentProjectionDisplay(currentDisplay)
      }
    })

    return () => {
      // Cleanup IPC listener
      window.electron?.ipcRenderer.removeListener('audio-state-update', handleAudioStateUpdate)
      // Cleanup display listener
      unsubscribe()
    }
  }, [loadSetlists, fetchSongs, loadPresentations])

  // Auto-load setlist when presentation is started
  useEffect(() => {
    if (isPresenting && currentSetlist && currentSetlist !== selectedSetlist) {
      console.log('🎬 [HOME] Auto-loading setlist for presentation:', currentSetlist.name)
      setSelectedSetlist(currentSetlist)
      setSelectedItem(null) // Clear selected item when changing setlist
      setContentCards([])
      setSelectedCard(null)
    }
  }, [isPresenting, currentSetlist, selectedSetlist])

  // Listen for window resize events to update preview dimensions
  useEffect(() => {
    const handleResize = (): void => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Refresh data when window gains focus (to pick up changes made in editor)
  useEffect(() => {
    const handleFocus = (): void => {
      console.log('🎯 [HOME] Window focused, refreshing song data...')
      fetchSongs() // Refresh songs to get updated background data
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [fetchSongs])

  // Auto-select first setlist if available
  useEffect(() => {
    if (setlists.length > 0 && !selectedSetlist) {
      setSelectedSetlist(setlists[0])
    }
  }, [setlists, selectedSetlist])

  // Generate content cards when item is selected
  useEffect(() => {
    if (!selectedItem) {
      setContentCards([])
      return
    }

    const cards: ContentCard[] = []

    switch (selectedItem.type) {
      case 'song': {
        console.log('Selected song item:', selectedItem)
        console.log(
          'Available songs:',
          songs.length,
          songs.map((s) => ({ id: s.id, name: s.name }))
        )
        console.log('Looking for song with referenceId:', selectedItem.referenceId)

        const song = songs.find((s) => s.id === selectedItem.referenceId)
        console.log('Found song:', song)

        if (song) {
          console.log(
            'Processing song:',
            song.name,
            'Lyrics length:',
            song.lyrics?.length,
            'Slides count:',
            song.slides?.length
          )

          // Extract content from slides with proper background and styling data
          if (song.slides && song.slides.length > 0) {
            console.log('🎵 Extracting lyrics from slides...')
            song.slides.forEach((slide, slideIndex) => {
              console.log(`🎵 Slide ${slideIndex}:`, {
                title: slide.title,
                type: slide.type,
                elementsCount: slide.elements?.length || 0,
                hasBackground: !!slide.background,
                backgroundType: slide.background?.type
              })

              // Determine card type and title
              let cardType: 'verse' | 'chorus' | 'bridge' = 'verse'
              let cardTitle = slide.title || `Slide ${slideIndex + 1}`

              if (slide.type === 'chorus' || slide.title?.toLowerCase().includes('chorus')) {
                cardType = 'chorus'
                cardTitle = slide.title || 'Chorus'
              } else if (slide.type === 'bridge' || slide.title?.toLowerCase().includes('bridge')) {
                cardType = 'bridge'
                cardTitle = slide.title || 'Bridge'
              } else if (slide.type === 'verse' || slide.title?.toLowerCase().includes('verse')) {
                cardType = 'verse'
                cardTitle = slide.title || `Verse ${slideIndex + 1}`
              }

              if (slide.elements && slide.elements.length > 0) {
                // ✅ NEW APPROACH: Collect all elements for this slide
                const slideElements: Array<{
                  id: string
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
                }> = []

                let slideContentPreview = '' // For card preview

                slide.elements.forEach((element, elementIndex) => {
                  if (
                    (element.type === 'text' ||
                      element.type === 'image' ||
                      element.type === 'video') &&
                    element.content
                  ) {
                    // Extract content based on element type
                    let elementContent = ''
                    if (element.type === 'text' && typeof element.content === 'string') {
                      elementContent = element.content
                      // Use text content for preview
                      if (!slideContentPreview && elementContent.trim()) {
                        slideContentPreview = elementContent
                      }
                    } else if (
                      element.type === 'image' &&
                      typeof element.content === 'object' &&
                      element.content !== null &&
                      'url' in element.content
                    ) {
                      elementContent = (element.content as { url: string }).url
                    } else if (
                      element.type === 'video' &&
                      typeof element.content === 'object' &&
                      element.content !== null &&
                      'url' in element.content
                    ) {
                      elementContent = (element.content as { url: string }).url
                    } else if (typeof element.content === 'string') {
                      elementContent = element.content
                      // Use text content for preview if it's text
                      if (
                        element.type === 'text' &&
                        !slideContentPreview &&
                        elementContent.trim()
                      ) {
                        slideContentPreview = elementContent
                      }
                    }

                    console.log(`🎵   Element ${elementIndex}:`, {
                      type: element.type,
                      contentLength: elementContent.length,
                      contentPreview: elementContent.substring(0, 100) + '...',
                      hasStyle: !!element.style,
                      hasPosition: !!element.position,
                      hasSize: !!element.size
                    })

                    // Add element to slide elements array
                    slideElements.push({
                      id: element.id || `element-${slideIndex}-${elementIndex}`,
                      type: element.type as 'text' | 'image' | 'video',
                      content: elementContent,
                      position: element.position || { x: 96, y: 139 },
                      size: element.size || { width: 779, height: 197 },
                      style: {
                        fontSize: element.style?.fontSize || 48,
                        color: element.style?.color || '#FFFFFF',
                        fontFamily: element.style?.fontFamily || 'Arial, sans-serif',
                        fontWeight: element.style?.fontWeight || 'bold',
                        fontStyle: element.style?.fontStyle || 'normal',
                        textAlign: element.style?.textAlign || 'center',
                        textShadow: element.style?.textShadow || '2px 2px 4px rgba(0,0,0,0.8)',
                        lineHeight: element.style?.lineHeight || 1.2,
                        opacity: element.style?.opacity || 1
                      },
                      zIndex: element.zIndex || elementIndex
                    })
                  }
                })

                // Create one card per slide with all elements
                if (slideElements.length > 0) {
                  cards.push({
                    id: `${selectedItem.id}-slide-${slideIndex}`,
                    title: cardTitle,
                    content: slideContentPreview || `Slide ${slideIndex + 1}`, // Use text content for preview
                    type: cardType,
                    order: slideIndex,
                    slideElements: slideElements, // ✅ Store all elements for this slide
                    slideBackground: slide.background,
                    globalBackground: song.globalBackground
                  })

                  console.log(`🎵 Created slide card with ${slideElements.length} elements:`, {
                    slideIndex,
                    title: cardTitle,
                    elementsCount: slideElements.length,
                    elementTypes: slideElements.map((el) => el.type)
                  })
                }
              } else {
                // Handle slides without elements - create default text element
                console.log(`🎵 Slide ${slideIndex} has no elements, creating default text element`)

                const content = slide.content || slide.title || `Slide ${slideIndex + 1}`

                // Create default element
                const defaultElement = {
                  id: `default-element-${slideIndex}`,
                  type: 'text' as const,
                  content: content,
                  position: { x: 96, y: 139 },
                  size: { width: 779, height: 197 },
                  style: {
                    fontSize: 48,
                    color: '#FFFFFF',
                    fontFamily: 'Arial, sans-serif',
                    fontWeight: 'bold',
                    fontStyle: 'normal',
                    textAlign: 'center',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                    lineHeight: 1.2,
                    opacity: 1
                  },
                  zIndex: 0
                }

                cards.push({
                  id: `${selectedItem.id}-slide-${slideIndex}`,
                  title: cardTitle,
                  content: content,
                  type: cardType,
                  order: slideIndex,
                  slideElements: [defaultElement], // Single default element
                  slideBackground: slide.background,
                  globalBackground: song.globalBackground
                })
              }
            })
          }

          // Fallback to legacy lyrics field if no slides found
          if (cards.length === 0) {
            console.log('🎵 No slides found, checking legacy lyrics field...')
            if (!song.lyrics || song.lyrics.trim() === '') {
              console.warn('🎵 Song has no lyrics in either slides or lyrics field')
              cards.push({
                id: selectedItem.id,
                title: 'No Lyrics Available',
                content: `The song "${song.name || 'Unknown'}" doesn't have any lyrics yet.`,
                type: 'verse',
                order: 0
              })
            } else {
              console.log('🎵 Processing legacy lyrics format...')
              // Parse song structure (verses, chorus, bridge)
              const verses = song.lyrics.split('\n\n')
              verses.forEach((verse, index) => {
                if (!verse.trim()) return // Skip empty verses

                const lines = verse.trim().split('\n')
                const firstLine = lines[0]?.toLowerCase() || ''

                let type: 'verse' | 'chorus' | 'bridge' = 'verse'
                let title = `Verse ${index + 1}`
                let content = verse.trim()

                // Check if first line is a section header and remove it from content
                if (firstLine.includes('chorus')) {
                  type = 'chorus'
                  title = 'Chorus'
                  // Remove the header line if it's just a label
                  if (firstLine.trim() === 'chorus' || firstLine.trim() === 'chorus:') {
                    content = lines.slice(1).join('\n').trim()
                  }
                } else if (firstLine.includes('bridge')) {
                  type = 'bridge'
                  title = 'Bridge'
                  // Remove the header line if it's just a label
                  if (firstLine.trim() === 'bridge' || firstLine.trim() === 'bridge:') {
                    content = lines.slice(1).join('\n').trim()
                  }
                } else if (firstLine.includes('verse')) {
                  type = 'verse'
                  // Extract verse number if present
                  const verseMatch = firstLine.match(/verse\s*(\d+)/i)
                  if (verseMatch) {
                    title = `Verse ${verseMatch[1]}`
                  }
                  // Remove the header line if it's just a label
                  if (firstLine.match(/^verse\s*\d*:?\s*$/i)) {
                    content = lines.slice(1).join('\n').trim()
                  }
                }

                if (content) {
                  // Only add if there's actual content
                  cards.push({
                    id: `${selectedItem.id}-${index}`,
                    title,
                    content,
                    type,
                    order: index
                  })
                }
              })
            }
          }

          console.log('🎵 Total content cards created:', cards.length)
          cards.forEach((card, index) => {
            console.log(`🎵 Card ${index}:`, {
              title: card.title,
              type: card.type,
              contentLength: card.content.length,
              contentPreview: card.content.substring(0, 50) + '...'
            })
          })
        } else {
          console.error(
            'Song not found! Available songs:',
            songs.map((s) => ({ id: s.id, name: s.name }))
          )
          // Add a placeholder card to show the issue
          cards.push({
            id: selectedItem.id,
            title: 'Song Not Found',
            content: `Could not find song with ID: ${selectedItem.referenceId}`,
            type: 'verse',
            order: 0
          })
        }
        break
      }

      case 'presentation': {
        const presentation = presentations.find((p) => p.id === selectedItem.referenceId)
        if (presentation) {
          console.log(
            '🎨 Processing presentation:',
            presentation.name,
            'Slides count:',
            presentation.slides.length
          )

          presentation.slides.forEach((slide, slideIndex) => {
            console.log(`🎨 Slide ${slideIndex}:`, {
              title: slide.title,
              contentLength: slide.content?.length || 0,
              elementsCount: slide.elements?.length || 0,
              hasBackground: !!slide.background,
              backgroundType: slide.background?.type
            })

            // Process presentation slide elements similar to song slides
            if (slide.elements && slide.elements.length > 0) {
              // ✅ NEW APPROACH: Collect all elements for this slide
              const slideElements: Array<{
                id: string
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
              }> = []

              let slideContentPreview = '' // For card preview

              slide.elements.forEach((element, elementIndex) => {
                if (
                  (element.type === 'text' ||
                    element.type === 'image' ||
                    element.type === 'video') &&
                  element.content
                ) {
                  // Extract content based on element type
                  let elementContent = ''
                  if (element.type === 'text' && typeof element.content === 'string') {
                    elementContent = element.content
                    // Use text content for preview
                    if (!slideContentPreview && elementContent.trim()) {
                      slideContentPreview = elementContent
                    }
                  } else if (
                    element.type === 'image' &&
                    typeof element.content === 'object' &&
                    element.content !== null &&
                    'url' in element.content
                  ) {
                    elementContent = (element.content as { url: string }).url
                  } else if (
                    element.type === 'video' &&
                    typeof element.content === 'object' &&
                    element.content !== null &&
                    'url' in element.content
                  ) {
                    elementContent = (element.content as { url: string }).url
                  } else if (typeof element.content === 'string') {
                    elementContent = element.content
                    // Use text content for preview if it's text
                    if (element.type === 'text' && !slideContentPreview && elementContent.trim()) {
                      slideContentPreview = elementContent
                    }
                  }

                  console.log(`🎨   Element ${elementIndex}:`, {
                    type: element.type,
                    contentLength: elementContent.length,
                    contentPreview: elementContent.substring(0, 100) + '...',
                    hasStyle: !!element.style,
                    hasPosition: !!element.position,
                    hasSize: !!element.size
                  })

                  // Add element to slide elements array
                  slideElements.push({
                    id: element.id || `element-${slideIndex}-${elementIndex}`,
                    type: element.type as 'text' | 'image' | 'video',
                    content: elementContent,
                    position: element.position || { x: 96, y: 139 },
                    size: element.size || { width: 779, height: 197 },
                    style: {
                      fontSize: element.style?.fontSize || 48,
                      color: element.style?.color || '#FFFFFF',
                      fontFamily: element.style?.fontFamily || 'Arial, sans-serif',
                      fontWeight: element.style?.fontWeight || 'bold',
                      fontStyle: element.style?.fontStyle || 'normal',
                      textAlign: element.style?.textAlign || 'center',
                      textShadow: element.style?.textShadow || '2px 2px 4px rgba(0,0,0,0.8)',
                      lineHeight: element.style?.lineHeight || 1.2,
                      opacity: element.style?.opacity || 1
                    },
                    zIndex: element.zIndex || elementIndex
                  })
                }
              })

              // Create one card per slide with all elements
              if (slideElements.length > 0) {
                cards.push({
                  id: `${selectedItem.id}-slide-${slideIndex}`,
                  title: slide.title || `Slide ${slideIndex + 1}`,
                  content: slideContentPreview || `Slide ${slideIndex + 1}`, // Use text content for preview
                  type: 'slide',
                  order: slideIndex,
                  slideElements: slideElements, // ✅ Store all elements for this slide
                  slideBackground: slide.background,
                  globalBackground: presentation.background
                })

                console.log(`🎨 Created slide card with ${slideElements.length} elements:`, {
                  slideIndex,
                  title: slide.title || `Slide ${slideIndex + 1}`,
                  elementsCount: slideElements.length,
                  elementTypes: slideElements.map((el) => el.type)
                })
              }
            } else {
              // Handle slides without elements - create default text element
              console.log(`🎨 Slide ${slideIndex} has no elements, creating default text element`)

              const content = slide.content || slide.title || `Slide ${slideIndex + 1}`

              // Create default element
              const defaultElement = {
                id: `default-element-${slideIndex}`,
                type: 'text' as const,
                content: content,
                position: { x: 96, y: 139 },
                size: { width: 779, height: 197 },
                style: {
                  fontSize: 48,
                  color: '#FFFFFF',
                  fontFamily: 'Arial, sans-serif',
                  fontWeight: 'bold',
                  fontStyle: 'normal',
                  textAlign: 'center',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                  lineHeight: 1.2,
                  opacity: 1
                },
                zIndex: 0
              }

              cards.push({
                id: `${selectedItem.id}-slide-${slideIndex}`,
                title: slide.title || `Slide ${slideIndex + 1}`,
                content: content,
                type: 'slide',
                order: slideIndex,
                slideElements: [defaultElement], // Single default element
                slideBackground: slide.background,
                globalBackground: presentation.background
              })
            }
          })

          console.log('🎨 Total presentation cards created:', cards.length)
          cards.forEach((card, index) => {
            console.log(`🎨 Card ${index}:`, {
              title: card.title,
              type: card.type,
              contentLength: card.content.length,
              hasElementStyles: !!card.elementStyles,
              hasSlideBackground: !!card.slideBackground,
              hasGlobalBackground: !!card.globalBackground
            })
          })
        } else {
          console.error(
            'Presentation not found! Available presentations:',
            presentations.map((p) => ({ id: p.id, name: p.name }))
          )
          // Add a placeholder card to show the issue
          cards.push({
            id: selectedItem.id,
            title: 'Presentation Not Found',
            content: `Could not find presentation with ID: ${selectedItem.referenceId}`,
            type: 'slide',
            order: 0
          })
        }
        break
      }

      case 'announcement':
        cards.push({
          id: selectedItem.id,
          title: 'Announcement',
          content: selectedItem.title,
          type: 'announcement',
          order: 0
        })
        break

      case 'countdown': {
        // Use enhanced countdown config if available, fallback to legacy format
        const countdownConfig = selectedItem.countdownConfig
        const duration = countdownConfig?.duration || selectedItem.countdownDuration || 300
        const message =
          countdownConfig?.message || selectedItem.countdownMessage || 'Service Starting Soon!'
        const title = countdownConfig?.title || 'Countdown Timer'

        console.log('🎯 [HOME] Creating countdown card with config:', {
          hasCountdownConfig: !!countdownConfig,
          countdownConfig,
          duration,
          title,
          message
        })

        cards.push({
          id: selectedItem.id,
          title: title,
          content: `${duration}s - ${message}`,
          type: 'countdown',
          order: 0,
          // Pass the enhanced config for preview rendering
          countdownConfig: countdownConfig
        })
        break
      }

      case 'video':
      case 'image':
      case 'audio':
      case 'media': {
        console.log('🎬 [HOME] Processing standalone media item:', {
          type: selectedItem.type,
          title: selectedItem.title,
          hasMediaConfig: !!selectedItem.mediaConfig,
          mediaUrl: selectedItem.mediaConfig?.url?.substring(0, 100) + '...',
          hasBackgroundAudio: !!selectedItem.mediaConfig?.backgroundAudio?.url,
          backgroundAudioUrl: selectedItem.mediaConfig?.backgroundAudio?.url?.substring(0, 100) + '...'
        })

        // Create content description based on media type and settings
        let contentDescription = selectedItem.title
        if (selectedItem.mediaConfig?.url) {
          const mediaType = selectedItem.mediaConfig.mediaType || selectedItem.type
          contentDescription = `${mediaType.toUpperCase()}: ${selectedItem.mediaConfig.url.split('/').pop() || selectedItem.mediaConfig.url}`
          
          // Add background audio info if present
          if (selectedItem.mediaConfig.backgroundAudio?.url) {
            const audioFile = selectedItem.mediaConfig.backgroundAudio.url.split('/').pop() || 'audio'
            contentDescription += ` + Audio: ${audioFile}`
          }
        }

        cards.push({
          id: selectedItem.id,
          title: selectedItem.title,
          content: contentDescription,
          type: selectedItem.type as 'verse' | 'chorus' | 'bridge' | 'slide' | 'announcement' | 'countdown',
          order: 0,
          // Store media configuration for preview and projection
          mediaConfig: selectedItem.mediaConfig,
          // Create slide elements that represent the media content (only for visual media)
          slideElements: selectedItem.mediaConfig?.url && (selectedItem.type === 'video' || selectedItem.type === 'image' || selectedItem.mediaConfig.mediaType === 'video' || selectedItem.mediaConfig.mediaType === 'image') ? [{
            id: `media-element-${selectedItem.id}`,
            type: (selectedItem.mediaConfig.mediaType || selectedItem.type) as 'text' | 'image' | 'video',
            content: selectedItem.mediaConfig.url,
            position: { x: 0, y: 0 },
            size: { 
              // Full screen coverage for media items
              width: 1920, // Full canvas width
              height: 1080 // Full canvas height
            },
            style: {
              opacity: selectedItem.mediaConfig.volume !== undefined ? selectedItem.mediaConfig.volume : 1
            },
            zIndex: 1
          }] : undefined
        })

        console.log('🎬 [HOME] Created media card:', {
          id: selectedItem.id,
          title: selectedItem.title,
          contentDescription,
          hasSlideElements: !!(selectedItem.mediaConfig?.url && (selectedItem.type === 'video' || selectedItem.type === 'image' || selectedItem.mediaConfig.mediaType === 'video' || selectedItem.mediaConfig.mediaType === 'image')),
          mediaType: selectedItem.mediaConfig?.mediaType || selectedItem.type,
          isVisualMedia: selectedItem.type === 'video' || selectedItem.type === 'image' || selectedItem.mediaConfig?.mediaType === 'video' || selectedItem.mediaConfig?.mediaType === 'image'
        })
        break
      }
    }

    setContentCards(cards)
    setSelectedCard(cards[0] || null)
  }, [selectedItem, songs, presentations])

  // Project content to second display
  const projectContent = useCallback(
    async (card: ContentCard) => {
      // Stop any currently playing audio before projecting new content
      if (activeAudioRef.current && !activeAudioRef.current.paused) {
        console.log('🎯 [PROJECTION] Stopping active audio before projecting new content')
        activeAudioRef.current.pause()
        activeAudioRef.current.currentTime = 0
        setGlobalAudioState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }))
      }
      
      // Refresh data to ensure we have the latest background information
      console.log('🎯 [PROJECTION] Refreshing data before projection...')
      await fetchSongs()
      await loadPresentations()

      // Handle song data updates
      if (selectedItem?.type === 'song') {
        const currentSongs = useSongStore.getState().songs
        const updatedSong = currentSongs.find((s) => s.id === selectedItem?.referenceId)

        if (updatedSong) {
          // Find the corresponding slide for this card
          const slideIndex = parseInt(card.id.split('-slide-')[1]?.split('-')[0] || '0')
          const slide = updatedSong.slides?.[slideIndex]

          console.log('🎯 [PROJECTION] Song slide index parsing:', {
            cardId: card.id,
            parsedSlideIndex: slideIndex,
            totalSlides: updatedSong.slides?.length || 0,
            foundSlide: !!slide,
            slideBackground: slide?.background,
            originalCardSlideBackground: card.slideBackground
          })

          if (slide) {
            // Update the card with fresh background data
            card = {
              ...card,
              slideBackground: slide.background,
              globalBackground: updatedSong.globalBackground
            }

            console.log('🎯 [PROJECTION] Updated song card with fresh background data:', {
              hasSlideBackground: !!card.slideBackground,
              slideBackground: card.slideBackground,
              hasGlobalBackground: !!card.globalBackground,
              globalBackground: card.globalBackground
            })
          } else {
            console.warn(
              '🎯 [PROJECTION] Could not find slide for index:',
              slideIndex,
              'in song:',
              updatedSong.name
            )
          }
        }
      }

      // Handle presentation data updates
      if (selectedItem?.type === 'presentation') {
        const currentPresentations = usePresentationStore.getState().presentations
        const updatedPresentation = currentPresentations.find(
          (p) => p.id === selectedItem?.referenceId
        )

        if (updatedPresentation) {
          // Find the corresponding slide for this card
          const slideIndex = parseInt(card.id.split('-slide-')[1]?.split('-')[0] || '0')
          const slide = updatedPresentation.slides?.[slideIndex]

          console.log('🎯 [PROJECTION] Presentation slide index parsing:', {
            cardId: card.id,
            parsedSlideIndex: slideIndex,
            totalSlides: updatedPresentation.slides?.length || 0,
            foundSlide: !!slide,
            slideBackground: slide?.background,
            originalCardSlideBackground: card.slideBackground
          })

          if (slide) {
            // Update the card with fresh background data
            card = {
              ...card,
              slideBackground: slide.background,
              globalBackground: updatedPresentation.background
            }

            console.log('🎯 [PROJECTION] Updated presentation card with fresh background data:', {
              hasSlideBackground: !!card.slideBackground,
              slideBackground: card.slideBackground,
              hasGlobalBackground: !!card.globalBackground,
              globalBackground: card.globalBackground
            })
          } else {
            console.warn(
              '🎯 [PROJECTION] Could not find slide for index:',
              slideIndex,
              'in presentation:',
              updatedPresentation.name
            )
          }
        }
      }

      console.log('🎯 [PROJECTION] Projecting card:', {
        title: card.title,
        type: card.type,
        hasElementStyles: !!card.elementStyles,
        elementStyles: card.elementStyles,
        hasSlideBackground: !!card.slideBackground,
        slideBackground: card.slideBackground,
        hasGlobalBackground: !!card.globalBackground,
        globalBackground: card.globalBackground,
        hasMediaConfig: !!card.mediaConfig,
        mediaConfig: card.mediaConfig,
        hasSlideElements: !!(card.slideElements && card.slideElements.length > 0),
        slideElementsCount: card.slideElements?.length || 0
      })

      setSelectedCard(card)
      setProjectionState((prev) => ({
        ...prev,
        isProjecting: true,
        currentContent: card.content,
        currentTitle: card.title
      }))

      // Prepare slide data with background and element information
      const slideData = {
        // For countdown cards, don't create elements - let CountdownDisplay handle rendering
        elements:
          card.type === 'countdown'
            ? []
            : card.slideElements ||
              (card.elementStyles
                ? [
                    {
                      type: 'text',
                      content: card.content,
                      position: {
                        x: card.elementStyles.left || 96,
                        y: card.elementStyles.top || 139
                      },
                      size: {
                        width: card.elementStyles.width || 779,
                        height: card.elementStyles.height || 197
                      },
                      style: card.elementStyles
                    }
                  ]
                : [
                    {
                      type: 'text',
                      content: card.content,
                      position: { x: 96, y: 139 },
                      size: { width: 779, height: 197 },
                      style: {
                        fontSize: 48,
                        color: '#FFFFFF',
                        fontFamily: 'Arial, sans-serif',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                        lineHeight: 1.2
                      }
                    }
                  ]),
        globalBackground: card.globalBackground,
        slideBackground: card.slideBackground,
        // Include countdown configuration for countdown cards
        ...(card.type === 'countdown' &&
          card.countdownConfig && { countdownConfig: card.countdownConfig }),
        // Include media configuration for standalone media items
        ...(card.mediaConfig && { mediaConfig: card.mediaConfig })
      }

      console.log('🎯 [PROJECTION] Generated slideData:', {
        elementsCount: slideData.elements.length,
        elementTypes: slideData.elements.map((el) => el.type),
        elements: slideData.elements.map((el, i) => ({
          index: i,
          type: el.type,
          contentLength: el.content?.length || 0,
          contentPreview: el.content?.substring(0, 50) + '...',
          position: el.position,
          size: el.size,
          hasStyle: !!el.style
        })),
        hasGlobalBackground: !!slideData.globalBackground,
        globalBackground: slideData.globalBackground,
        hasSlideBackground: !!slideData.slideBackground,
        slideBackground: slideData.slideBackground,
        hasCountdownConfig: !!slideData.countdownConfig,
        countdownConfig: slideData.countdownConfig,
        hasMediaConfig: !!slideData.mediaConfig,
        mediaConfig: slideData.mediaConfig
      })

      console.log('🎯 [PROJECTION] Selected card slideElements:', {
        hasSlideElements: !!card.slideElements,
        slideElementsCount: card.slideElements?.length || 0,
        slideElements: card.slideElements?.map((el, i) => ({
          index: i,
          type: el.type,
          contentLength: el.content?.length || 0,
          contentPreview: el.content?.substring(0, 50) + '...',
          position: el.position,
          size: el.size
        }))
      })

      // Send rich content data to electron main process for second display
      window.electron?.ipcRenderer.send('project-content', {
        title: card.title,
        content: card.content,
        type: card.type,
        slideData: slideData
      })
    },
    [fetchSongs, loadPresentations]
  )

  // Navigation functions
  const goToNextCard = useCallback(async () => {
    if (!selectedCard || contentCards.length === 0) return

    const currentIndex = contentCards.findIndex((card) => card.id === selectedCard.id)
    const nextIndex = (currentIndex + 1) % contentCards.length
    await projectContent(contentCards[nextIndex])
  }, [selectedCard, contentCards, projectContent])

  const goToPrevCard = useCallback(async () => {
    if (!selectedCard || contentCards.length === 0) return

    const currentIndex = contentCards.findIndex((card) => card.id === selectedCard.id)
    const prevIndex = currentIndex === 0 ? contentCards.length - 1 : currentIndex - 1
    await projectContent(contentCards[prevIndex])
  }, [selectedCard, contentCards, projectContent])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent): void => {
      switch (event.code) {
        case 'Space':
          event.preventDefault()
          goToNextCard()
          break
        case 'ArrowRight':
          event.preventDefault()
          goToNextCard()
          break
        case 'ArrowLeft':
          event.preventDefault()
          goToPrevCard()
          break
        case 'KeyB':
          event.preventDefault()
          toggleBlank()
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [goToNextCard, goToPrevCard])

  // Projection controls
  const toggleBlank = (): void => {
    setProjectionState((prev) => ({ ...prev, isBlank: !prev.isBlank }))
    window.electron?.ipcRenderer.send('toggle-blank', !projectionState.isBlank)
  }

  const toggleLogo = (): void => {
    setProjectionState((prev) => ({ ...prev, showLogo: !prev.showLogo }))
    window.electron?.ipcRenderer.send('toggle-logo', !projectionState.showLogo)
  }

  const stopProjection = (): void => {
    setProjectionState((prev) => ({ ...prev, isProjecting: false, isBlank: false }))
    window.electron?.ipcRenderer.send('stop-projection')
  }

  // Handle setlist change
  const handleSetlistChange = (setlist: Setlist): void => {
    setSelectedSetlist(setlist)
    setSelectedItem(null) // Clear selected item when changing setlist
    setContentCards([])
    setSelectedCard(null)
  }

  // Handle adding recent item to current setlist
  const handleAddRecentItem = async (recentItem: { type: string; referenceId: string; title: string }): Promise<void> => {
    if (!selectedSetlist) {
      console.warn('No setlist selected to add recent item to')
      return
    }

    try {
      console.log('Adding recent item to setlist:', recentItem)
      await addItem(selectedSetlist.id, {
        type: recentItem.type as SetlistItem['type'],
        title: recentItem.title,
        referenceId: recentItem.referenceId,
        isActive: true
      })
      
      // Refresh setlists to update UI
      await loadSetlists()
      console.log('Recent item added successfully')
    } catch (error) {
      console.error('Failed to add recent item to setlist:', error)
    }
  }

  // Countdown control functions
  const startLiveCountdown = (config?: ContentCard['countdownConfig']): void => {
    const duration = config?.duration || 300
    setLiveCountdown({ time: duration, active: true, config })
    
    const interval = setInterval(() => {
      setLiveCountdown(prev => {
        if (!prev || !prev.active || prev.time <= 0) {
          clearInterval(interval)
          return prev && prev.time <= 0 ? { ...prev, active: false, time: 0 } : null
        }
        return { ...prev, time: prev.time - 1 }
      })
    }, 1000)
  }

  const pauseLiveCountdown = (): void => {
    setLiveCountdown(prev => prev ? { ...prev, active: false } : null)
  }

  const stopLiveCountdown = (): void => {
    setLiveCountdown(null)
  }

  const resetLiveCountdown = (): void => {
    setLiveCountdown(prev => {
      if (!prev?.config) return null
      const duration = prev.config.duration || 300
      return { ...prev, time: duration, active: false }
    })
  }

  // Template functions
  const createSetlistFromTemplate = async (template: SetlistTemplate): Promise<void> => {
    try {
      console.log('Creating setlist from template:', template.name)
      
      // Apply variables with defaults
      const variables: Record<string, string> = {}
      template.variables?.forEach(variable => {
        if (variable.key === 'service_date') {
          variables[variable.key] = new Date().toLocaleDateString()
        } else {
          variables[variable.key] = variable.defaultValue
        }
      })
      
      const processedTemplate = applyTemplateVariables(template, variables)
      
      // Convert template items to setlist items
      const items: Omit<SetlistItem, 'id' | 'order'>[] = processedTemplate.items.map((item) => ({
        type: item.type as SetlistItem['type'],
        title: item.title,
        referenceId: 'new', // Will be replaced when user selects actual content
        duration: item.duration,
        notes: item.notes,
        isActive: item.isActive
      }))

      // Create the setlist
      await createSetlist({
        name: processedTemplate.name,
        description: processedTemplate.description,
        items: items as SetlistItem[], // Type assertion since we know these will get IDs assigned
        tags: processedTemplate.tags,
        isPublic: false,
        estimatedDuration: processedTemplate.estimatedDuration,
        createdBy: 'user'
      })
      
      // Refresh setlists and select the new one
      await loadSetlists()
      const updatedSetlists = setlists
      const newSetlist = updatedSetlists[updatedSetlists.length - 1] // Assuming new setlist is last
      if (newSetlist) {
        setSelectedSetlist(newSetlist)
      }
      
      setShowTemplateDialog(false)
      console.log('Setlist created from template successfully')
    } catch (error) {
      console.error('Failed to create setlist from template:', error)
    }
  }

  // Media control functions
  const toggleMediaPlayback = (): void => {
    setMediaState(prev => ({ ...prev, isPlaying: !prev.isPlaying }))
  }

  const setMediaVolume = (volume: number): void => {
    setMediaState(prev => ({ ...prev, volume, muted: volume === 0 }))
  }

  const toggleMediaMute = (): void => {
    setMediaState(prev => ({ ...prev, muted: !prev.muted }))
  }

  // Note: seekMedia and updateMediaState functions removed as they were unused
  // They can be added back when implementing more advanced media controls

  // Format time for media display
  const formatMediaTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  // Memoized recent items to avoid unnecessary re-renders
  const recentItems = useMemo(() => {
    return getRecentItems().slice(0, 5)
  }, [getRecentItems])

  // Memoized sorted content cards with performance optimization
  const sortedContentCards = useMemo(() => {
    return [...contentCards].sort((a, b) => a.order - b.order)
  }, [contentCards])

  // Performance optimization: Only show first 20 cards initially for large setlists
  const displayedCards = useMemo(() => {
    if (sortedContentCards.length <= 20) {
      return sortedContentCards
    }
    return sortedContentCards.slice(0, 20)
  }, [sortedContentCards])

  const hasMoreCards = sortedContentCards.length > 20

  // Memoized media elements to avoid recalculation
  const mediaElements = useMemo(() => {
    if (!selectedCard?.slideElements) return []
    return selectedCard.slideElements.filter(element => 
      element.type === 'video' || element.type === 'image'
    )
  }, [selectedCard?.slideElements])

  // Check if current content has media elements (memoized)
  const hasMediaContent = useMemo((): boolean => {
    return mediaElements.length > 0
  }, [mediaElements])

  // Handle drag end for setlist items
  const handleSetlistDragEnd = async (event: DragEndEvent): Promise<void> => {
    const { active, over } = event

    if (!selectedSetlist || !over || active.id === over.id) return

    const oldIndex = selectedSetlist.items.findIndex((item) => item.id === active.id)
    const newIndex = selectedSetlist.items.findIndex((item) => item.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const newItems = arrayMove(selectedSetlist.items, oldIndex, newIndex)

    // Update the setlist with reordered items
    const updatedSetlist = {
      ...selectedSetlist,
      items: newItems.map((item, index) => ({ ...item, order: index }))
    }

    // Update local state immediately for smooth UX
    setSelectedSetlist(updatedSetlist)

    // Update in database
    await updateSetlist(selectedSetlist.id, { items: updatedSetlist.items })
  }

  // Handle drag end for content cards
  const handleCardDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = contentCards.findIndex((card) => card.id === active.id)
    const newIndex = contentCards.findIndex((card) => card.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const newCards = arrayMove(contentCards, oldIndex, newIndex)
    const reorderedCards = newCards.map((card, index) => ({ ...card, order: index }))

    setContentCards(reorderedCards)
  }

  // Get icon for item type
  const getItemIcon = (type: string): JSX.Element => {
    switch (type) {
      case 'song':
        return <Music className="w-4 h-4 text-blue-600" />
      case 'presentation':
        return <Presentation className="w-4 h-4 text-green-600" />
      case 'announcement':
        return <MessageSquare className="w-4 h-4 text-orange-600" />
      case 'countdown':
        return <Timer className="w-4 h-4 text-red-600" />
      default:
        return <Music className="w-4 h-4" />
    }
  }

  // Get card type styling
  const getCardStyling = (type: string): string => {
    switch (type) {
      case 'verse':
        return 'border-blue-200 bg-blue-50 dark:bg-blue-950'
      case 'chorus':
        return 'border-green-200 bg-green-50 dark:bg-green-950'
      case 'bridge':
        return 'border-purple-200 bg-purple-50 dark:bg-purple-950'
      case 'slide':
        return 'border-gray-200 bg-gray-50 dark:bg-gray-950'
      case 'announcement':
        return 'border-orange-200 bg-orange-50 dark:bg-orange-950'
      case 'countdown':
        return 'border-red-200 bg-red-50 dark:bg-red-950'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Left Sidebar - Setlist */}
        <div className="w-80 border-r bg-card">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">Current Setlist</h2>
              <div className="flex items-center gap-2">
                <DropdownMenu open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Templates
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <div className="p-2">
                      <div className="text-sm font-medium mb-3">Quick Start Templates</div>
                      <div className="space-y-1">
                        {defaultTemplates.map((template) => (
                          <DropdownMenuItem
                            key={template.id}
                            onClick={() => createSetlistFromTemplate(template)}
                            className="flex-col items-start p-3 cursor-pointer"
                          >
                            <div className="flex items-center justify-between w-full">
                              <div className="font-medium">{template.name}</div>
                              <Badge variant="secondary" className="text-xs capitalize">
                                {template.category}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {template.description}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {template.items.length} items • {Math.floor(template.estimatedDuration / 60)} min
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <List className="w-4 h-4 mr-2" />
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  {setlists.map((setlist) => (
                    <DropdownMenuItem
                      key={setlist.id}
                      onClick={() => handleSetlistChange(setlist)}
                      className={selectedSetlist?.id === setlist.id ? 'bg-accent' : ''}
                    >
                      <div className="flex-1">
                        <div className="font-medium">{setlist.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {setlist.items.length} items • {setlist.description || 'No description'}
                        </div>
                      </div>
                      {selectedSetlist?.id === setlist.id && (
                        <div className="w-2 h-2 bg-primary rounded-full ml-2"></div>
                      )}
                    </DropdownMenuItem>
                  ))}
                  {setlists.length === 0 && (
                    <DropdownMenuItem disabled>
                      <div className="text-center text-muted-foreground">No setlists available</div>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              </div>
            </div>
            {selectedSetlist && (
              <div className="mt-2">
                <p className="text-sm font-medium">{selectedSetlist.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedSetlist.items.length} items
                  {selectedSetlist.description && ` • ${selectedSetlist.description}`}
                </p>
              </div>
            )}
          </div>

          {/* Recent Items Panel */}
          <div className="border-b">
            <button
              onClick={() => setShowRecentItems(!showRecentItems)}
              className="w-full p-3 text-left hover:bg-accent transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Recent Items</span>
                <span className="text-xs text-muted-foreground">
                  ({recentItems.length})
                </span>
              </div>
              {showRecentItems ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            
            {showRecentItems && (
              <div className="p-2 bg-muted/30 max-h-32 overflow-y-auto">
                {recentItems.length > 0 ? (
                  <div className="space-y-1">
                    {recentItems.map((item) => (
                      <div
                        key={`${item.type}-${item.referenceId}`}
                        className="flex items-center justify-between p-2 rounded hover:bg-background transition-colors"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {getItemIcon(item.type)}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{item.title}</div>
                            <div className="text-xs text-muted-foreground capitalize">
                              {item.type} • {new Date(item.usedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAddRecentItem(item)}
                          disabled={!selectedSetlist}
                          className="shrink-0"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Clock className="w-6 h-6 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recent items</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-2 overflow-y-auto h-full">
            {selectedSetlist?.items && selectedSetlist.items.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleSetlistDragEnd}
              >
                <SortableContext
                  items={selectedSetlist.items}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-1">
                    {selectedSetlist.items.map((item, index) => (
                      <SortableSetlistItem
                        key={item.id}
                        item={item}
                        index={index}
                        isSelected={selectedItem?.id === item.id}
                        onSelect={setSelectedItem}
                        getItemIcon={getItemIcon}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <List className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No items in setlist</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center - Content Cards */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-lg">
                  {selectedItem ? selectedItem.title : 'Select an item'}
                </h2>
                {selectedItem && (
                  <p className="text-sm text-muted-foreground capitalize">
                    {selectedItem.type === 'song' ? 'Song Lyrics' : selectedItem.type} •{' '}
                    {contentCards.length} {contentCards.length === 1 ? 'card' : 'cards'}
                  </p>
                )}
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center gap-2">
                {/* Slide Navigation */}
                <Button variant="outline" size="sm" onClick={goToPrevCard} disabled={!selectedCard}>
                  <ChevronLeft className="w-4 h-4" />
                  Prev Slide
                </Button>
                <Button variant="outline" size="sm" onClick={goToNextCard} disabled={!selectedCard}>
                  Next Slide
                  <ChevronRight className="w-4 h-4" />
                </Button>
                
                <Separator orientation="vertical" className="h-6" />
                
                {/* Item Navigation */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    if (selectedSetlist && selectedSetlist.items.length > 0) {
                      const currentItemIndex = selectedSetlist.items.findIndex(item => item.id === selectedItem?.id)
                      if (currentItemIndex > 0) {
                        setSelectedItem(selectedSetlist.items[currentItemIndex - 1])
                      }
                    }
                  }}
                  disabled={!selectedSetlist || !selectedItem || selectedSetlist.items.findIndex(item => item.id === selectedItem?.id) <= 0}
                >
                  <SkipBack className="w-4 h-4" />
                  Prev Item
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    if (selectedSetlist && selectedSetlist.items.length > 0) {
                      const currentItemIndex = selectedSetlist.items.findIndex(item => item.id === selectedItem?.id)
                      if (currentItemIndex >= 0 && currentItemIndex < selectedSetlist.items.length - 1) {
                        setSelectedItem(selectedSetlist.items[currentItemIndex + 1])
                      }
                    }
                  }}
                  disabled={!selectedSetlist || !selectedItem || selectedSetlist.items.findIndex(item => item.id === selectedItem?.id) >= (selectedSetlist?.items.length || 0) - 1}
                >
                  Next Item
                  <SkipForward className="w-4 h-4" />
                </Button>

                <Separator orientation="vertical" className="h-6" />

                {/* Jump to Slide */}
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Slide:</span>
                  <input
                    type="number"
                    min="1"
                    max={contentCards.length}
                    value={selectedCard ? (contentCards.findIndex(c => c.id === selectedCard.id) + 1) : 1}
                    onChange={(e) => {
                      const slideNumber = parseInt(e.target.value) - 1
                      if (slideNumber >= 0 && slideNumber < contentCards.length) {
                        projectContent(contentCards[slideNumber]).catch(console.error)
                      }
                    }}
                    className="w-12 h-8 text-xs border rounded px-1 text-center"
                    disabled={contentCards.length === 0}
                  />
                  <span className="text-xs text-muted-foreground">/ {contentCards.length}</span>
                </div>
                
                <Separator orientation="vertical" className="h-6" />
                
                <Button
                  variant={projectionState.isBlank ? 'default' : 'outline'}
                  size="sm"
                  onClick={toggleBlank}
                >
                  {projectionState.isBlank ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                  {projectionState.isBlank ? 'Show' : 'Blank'}
                </Button>
              </div>
            </div>
          </div>

          {/* Content Cards Grid */}
          <div className="flex-1 p-4 overflow-y-auto">
            {contentCards.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleCardDragEnd}
              >
                <SortableContext items={sortedContentCards} strategy={rectSortingStrategy}>
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {displayedCards.map((card) => (
                      <SortableContentCard
                        key={card.id}
                        card={card}
                        isSelected={selectedCard?.id === card.id}
                        onSelect={(card) => {
                          projectContent(card).catch(console.error)
                        }}
                        getCardStyling={getCardStyling}
                        selectedCardId={selectedCard?.id}
                        globalAudioControls={globalAudioControls}
                        hasUserInteracted={hasUserInteracted}
                      />
                    ))}
                  </div>
                  
                  {/* Show More Cards Button for Performance */}
                  {hasMoreCards && (
                    <div className="flex justify-center mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Simple implementation: just show all cards when clicked
                          // In a more advanced implementation, this could use actual virtualization
                          console.log('Show more cards - would implement virtualization here')
                        }}
                      >
                        Show {sortedContentCards.length - 20} More Cards
                      </Button>
                    </div>
                  )}
                </SortableContext>
              </DndContext>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <Monitor className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">No content selected</p>
                  <p className="text-sm">Choose an item from the setlist to see content cards</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Preview */}
        <div className="w-80 border-l bg-card">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-lg">Live Preview</h2>
            <p className="text-sm text-muted-foreground">What&apos;s being projected</p>
          </div>

          {/* Preview Area */}
          <div className="p-4">
            {(() => {
              // Calculate live preview dimensions based on current projection display and window size
              const availableWidth = Math.min(300, windowDimensions.width * 0.2) // 20% of window width, max 300px
              const maxHeight = Math.min(200, windowDimensions.height * 0.25) // 25% of window height, max 200px

              // Use dynamic aspect ratio if available, fallback to 16:9
              const targetAspectRatio = currentProjectionDisplay
                ? currentProjectionDisplay.workArea.width / currentProjectionDisplay.workArea.height
                : 16 / 9

              // Calculate preview dimensions maintaining target aspect ratio
              let previewWidth = availableWidth
              let previewHeight = previewWidth / targetAspectRatio

              // If height exceeds max, scale down
              if (previewHeight > maxHeight) {
                previewHeight = maxHeight
                previewWidth = previewHeight * targetAspectRatio
              }

              return (
                <div
                  className="bg-black rounded-lg border-2 border-dashed border-gray-300 relative overflow-hidden mb-4 mx-auto"
                  style={{
                    width: previewWidth,
                    height: previewHeight
                  }}
                >
                  {/* Render the actual projected content */}
                  {projectionState.isProjecting && !projectionState.isBlank && selectedCard ? (
                    // Show the same content that's being projected
                    <div className="absolute inset-0">
                      {/* Background Layer */}
                      {(() => {
                        const background =
                          selectedCard.slideBackground || selectedCard.globalBackground

                        console.log('🎨 [HOME_PREVIEW] Background for preview:', {
                          hasSlideBackground: !!selectedCard.slideBackground,
                          hasGlobalBackground: !!selectedCard.globalBackground,
                          selectedBackground: background,
                          backgroundType: background?.type,
                          backgroundValue: background?.value,
                          cardTitle: selectedCard.title,
                          previewMode: false
                        })

                        return <BackgroundRenderer 
                          background={background} 
                          preview={false} 
                          key={`live-preview-${background?.type || 'none'}-${background?.value || 'none'}-${selectedCard.id}`}
                        />
                      })()}

                      {/* Content Layer */}
                      {selectedCard.type === 'countdown' && selectedCard.countdownConfig ? (
                        // Render countdown with enhanced config
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center" style={{ zIndex: 10 }}>
                          <div
                            className="font-bold mb-1 text-xs"
                            style={{
                              color: selectedCard.countdownConfig.styling?.titleColor || '#FFFFFF',
                              textShadow:
                                selectedCard.countdownConfig.styling?.textShadow !== false
                                  ? '1px 1px 2px rgba(0,0,0,0.8)'
                                  : 'none'
                            }}
                          >
                            {selectedCard.countdownConfig.title || 'Countdown'}
                          </div>

                          <div
                            className="font-bold font-mono mb-1 text-lg"
                            style={{
                              color:
                                selectedCard.countdownConfig.styling?.counterColor || '#FFFFFF',
                              textShadow:
                                selectedCard.countdownConfig.styling?.textShadow !== false
                                  ? '1px 1px 2px rgba(0,0,0,0.8)'
                                  : 'none'
                            }}
                          >
                            {(() => {
                              // Use live countdown time if active, otherwise use config duration
                              const timeToShow = liveCountdown?.active && selectedCard.type === 'countdown'
                                ? liveCountdown.time
                                : (selectedCard.countdownConfig.duration || 300)
                              return `${Math.floor(timeToShow / 60)}:${(timeToShow % 60).toString().padStart(2, '0')}`
                            })()}
                          </div>

                          <div
                            className="text-xs"
                            style={{
                              color:
                                selectedCard.countdownConfig.styling?.messageColor || '#FFFFFF',
                              textShadow:
                                selectedCard.countdownConfig.styling?.textShadow !== false
                                  ? '1px 1px 2px rgba(0,0,0,0.8)'
                                  : 'none'
                            }}
                          >
                            {selectedCard.countdownConfig.message || 'Starting Soon'}
                          </div>
                        </div>
                      ) : selectedCard.slideElements && selectedCard.slideElements.length > 0 ? (
                        // Render multiple slide elements
                        <>
                          {selectedCard.slideElements
                            .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
                            .map((element, index) => {
                              const key = element.id || `preview-element-${index}`

                              // Calculate proper scale factor based on preview container vs canvas size
                              const scaleX = previewWidth / CANVAS_WIDTH
                              const scaleY = previewHeight / CANVAS_HEIGHT
                              const scale = Math.min(scaleX, scaleY) // Use the smaller scale to maintain aspect ratio

                              const scaledLeft = element.position.x * scale
                              const scaledTop = element.position.y * scale
                              const scaledWidth = element.size.width * scale
                              const scaledHeight = element.size.height * scale
                              const scaledFontSize = (element.style.fontSize || 48) * scale
                              const elementZIndex = (element.zIndex || 0) + 10 // Ensure elements are above background

                              if (element.type === 'text') {
                                return (
                                  <div
                                    key={key}
                                    className="absolute whitespace-pre-line overflow-hidden flex items-center"
                                    style={{
                                      left: `${scaledLeft}px`,
                                      top: `${scaledTop}px`,
                                      width: `${scaledWidth}px`,
                                      height: `${scaledHeight}px`,
                                      fontSize: `${Math.max(6, scaledFontSize)}px`,
                                      color: element.style.color || '#FFFFFF',
                                      fontFamily: element.style.fontFamily || 'Arial, sans-serif',
                                      fontWeight: element.style.fontWeight || 'bold',
                                      fontStyle: element.style.fontStyle || 'normal',
                                      textShadow:
                                        element.style.textShadow || '1px 1px 2px rgba(0,0,0,0.8)',
                                      lineHeight: element.style.lineHeight || 1.3,
                                      opacity: element.style.opacity || 1,
                                      zIndex: elementZIndex,
                                      justifyContent:
                                        element.style.textAlign === 'left'
                                          ? 'flex-start'
                                          : element.style.textAlign === 'right'
                                            ? 'flex-end'
                                            : 'center'
                                    }}
                                  >
                                    <div
                                      style={{
                                        textAlign:
                                          (element.style.textAlign as
                                            | 'center'
                                            | 'left'
                                            | 'right'
                                            | 'justify') || 'center',
                                        width: '100%'
                                      }}
                                    >
                                      {element.content}
                                    </div>
                                  </div>
                                )
                              } else if (element.type === 'image') {
                                return (
                                  <PreviewMediaElement
                                    key={key}
                                    element={element}
                                    scaledLeft={scaledLeft}
                                    scaledTop={scaledTop}
                                    scaledWidth={scaledWidth}
                                    scaledHeight={scaledHeight}
                                  />
                                )
                              } else if (element.type === 'video') {
                                return (
                                  <PreviewMediaElement
                                    key={key}
                                    element={element}
                                    scaledLeft={scaledLeft}
                                    scaledTop={scaledTop}
                                    scaledWidth={scaledWidth}
                                    scaledHeight={scaledHeight}
                                  />
                                )
                              }

                              return null
                            })}
                        </>
                      ) : (
                        // Fallback: Render simple text content
                        <div className="absolute inset-0 flex items-center justify-center p-2" style={{ zIndex: 10 }}>
                          <div className="text-white text-center text-xs font-bold drop-shadow-lg max-w-full overflow-hidden whitespace-pre-wrap">
                            {selectedCard.content}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : projectionState.isBlank ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-gray-500 text-center">
                        <MonitorOff className="w-8 h-8 mx-auto mb-2" />
                        <div className="text-sm">Screen Blanked</div>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-gray-500 text-center">
                        <Monitor className="w-8 h-8 mx-auto mb-2" />
                        <div className="text-sm">No Content</div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Projection Controls */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Projection Status</span>
                <Badge variant={projectionState.isProjecting ? 'default' : 'secondary'}>
                  {projectionState.isProjecting ? 'Live' : 'Offline'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={projectionState.isBlank ? 'default' : 'outline'}
                  size="sm"
                  onClick={toggleBlank}
                  className="w-full"
                >
                  {projectionState.isBlank ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant={projectionState.showLogo ? 'default' : 'outline'}
                  size="sm"
                  onClick={toggleLogo}
                  className="w-full"
                >
                  <Image className="w-4 h-4" />
                </Button>
              </div>

              <Button
                variant="destructive"
                size="sm"
                onClick={stopProjection}
                className="w-full"
                disabled={!projectionState.isProjecting}
              >
                <Square className="w-4 h-4 mr-2" />
                Stop Projection
              </Button>
            </div>

            {/* Countdown Controls */}
            {selectedCard?.type === 'countdown' && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Countdown Timer</span>
                  <Badge variant={liveCountdown?.active ? 'default' : 'secondary'}>
                    {liveCountdown?.active ? 'Running' : 'Stopped'}
                  </Badge>
                </div>

                {liveCountdown && (
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-mono font-bold mb-1">
                      {Math.floor(liveCountdown.time / 60)}:{(liveCountdown.time % 60).toString().padStart(2, '0')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {liveCountdown.config?.title || 'Countdown Timer'}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant={liveCountdown?.active ? 'secondary' : 'default'}
                    onClick={() => {
                      if (liveCountdown?.active) {
                        pauseLiveCountdown()
                      } else {
                        startLiveCountdown(selectedCard.countdownConfig)
                      }
                    }}
                    className="w-full"
                  >
                    {liveCountdown?.active ? 'Pause' : 'Start'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={resetLiveCountdown}
                    disabled={!liveCountdown}
                    className="w-full"
                  >
                    Reset
                  </Button>
                </div>

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={stopLiveCountdown}
                  disabled={!liveCountdown}
                  className="w-full"
                >
                  Stop Timer
                </Button>
              </div>
            )}

            {/* Media Controls */}
            {hasMediaContent && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Media Controls</span>
                  <Badge variant={mediaState.isPlaying ? 'default' : 'secondary'}>
                    {mediaState.isPlaying ? 'Playing' : 'Stopped'}
                  </Badge>
                </div>

                {/* Media Elements List */}
                <div className="space-y-2">
                  {mediaElements.map((element, index) => (
                    <div key={element.id || index} className="p-2 bg-muted rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        {element.type === 'video' ? (
                          <div className="w-4 h-4 bg-blue-500 rounded flex items-center justify-center">
                            <Play className="w-3 h-3 text-white" />
                          </div>
                        ) : (
                          <Image className="w-4 h-4 text-green-600" />
                        )}
                        <span className="text-xs font-medium truncate">
                          {element.type === 'video' ? 'Video' : 'Image'} {index + 1}
                        </span>
                      </div>
                      
                      {element.type === 'video' && (
                        <>
                          {/* Playback Controls */}
                          <div className="flex items-center gap-2 mb-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={toggleMediaPlayback}
                              className="flex-shrink-0"
                            >
                              {mediaState.isPlaying ? (
                                <Pause className="w-3 h-3" />
                              ) : (
                                <Play className="w-3 h-3" />
                              )}
                            </Button>
                            
                            <div className="text-xs text-muted-foreground">
                              {formatMediaTime(mediaState.currentTime)} / {formatMediaTime(mediaState.duration)}
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full bg-muted-foreground/20 rounded-full h-1 mb-2">
                            <div 
                              className="bg-primary h-1 rounded-full transition-all duration-300"
                              style={{ 
                                width: mediaState.duration > 0 
                                  ? `${(mediaState.currentTime / mediaState.duration) * 100}%` 
                                  : '0%' 
                              }}
                            />
                          </div>

                          {/* Volume Control */}
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={toggleMediaMute}
                              className="p-1"
                            >
                              {mediaState.muted ? (
                                <VolumeX className="w-3 h-3" />
                              ) : (
                                <Volume2 className="w-3 h-3" />
                              )}
                            </Button>
                            
                            <div className="flex-1">
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={mediaState.muted ? 0 : mediaState.volume}
                                onChange={(e) => setMediaVolume(parseFloat(e.target.value))}
                                className="w-full h-1 bg-muted-foreground/20 rounded-lg appearance-none cursor-pointer"
                              />
                            </div>
                            
                            <span className="text-xs text-muted-foreground w-8 text-right">
                              {Math.round((mediaState.muted ? 0 : mediaState.volume) * 100)}%
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Keyboard Shortcuts Help */}
            <div className="mt-6 p-3 bg-muted rounded-lg">
              <div className="text-xs font-medium mb-2">Keyboard Shortcuts</div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div>Space / → : Next slide</div>
                <div>← : Previous slide</div>
                <div>B : Toggle blank</div>
              </div>
            </div>

            {/* Notes Section */}
            {selectedItem?.notes && (
              <div className="mt-4">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-amber-800">Notes</span>
                  </div>
                  <div className="text-sm text-amber-700 whitespace-pre-wrap leading-relaxed">
                    {selectedItem.notes}
                  </div>
                </div>
              </div>
            )}

            {/* Global Audio Controls */}
            {globalAudioState.currentTrack && (
              <div className="mt-4">
                <div className="p-4 bg-slate-900 border border-slate-700 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Volume2 className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-white">Audio Control</span>
                    <div className="flex-1 text-xs text-slate-400 truncate ml-2">
                      {globalAudioState.currentTrack}
                    </div>
                  </div>
                  
                  {/* Timeline */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                      <span>{formatTime(globalAudioState.currentTime)}</span>
                      <div className="flex-1">
                        <input
                          type="range"
                          min="0"
                          max={globalAudioState.duration || 100}
                          value={globalAudioState.currentTime}
                          onChange={(e) => globalAudioControls.seek(Number(e.target.value))}
                          className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                          style={{
                            background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${(globalAudioState.currentTime / (globalAudioState.duration || 1)) * 100}%, #374151 ${(globalAudioState.currentTime / (globalAudioState.duration || 1)) * 100}%, #374151 100%)`
                          }}
                        />
                      </div>
                      <span>{formatTime(globalAudioState.duration)}</span>
                    </div>
                  </div>

                  {/* Control Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={globalAudioControls.play}
                        disabled={globalAudioState.isPlaying}
                        className="text-white hover:bg-slate-800 disabled:opacity-50"
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={globalAudioControls.pause}
                        disabled={!globalAudioState.isPlaying}
                        className="text-white hover:bg-slate-800 disabled:opacity-50"
                      >
                        <Pause className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={globalAudioControls.stop}
                        className="text-white hover:bg-slate-800"
                      >
                        <SkipBack className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Volume Control */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => globalAudioControls.setMuted(!globalAudioState.muted)}
                        className="text-white hover:bg-slate-800"
                      >
                        {globalAudioState.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </Button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={globalAudioState.muted ? 0 : globalAudioState.volume}
                        onChange={(e) => {
                          const volume = Number(e.target.value)
                          globalAudioControls.setVolume(volume)
                          if (volume > 0 && globalAudioState.muted) {
                            globalAudioControls.setMuted(false)
                          }
                        }}
                        className="w-20 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${(globalAudioState.muted ? 0 : globalAudioState.volume) * 100}%, #374151 ${(globalAudioState.muted ? 0 : globalAudioState.volume) * 100}%, #374151 100%)`
                        }}
                      />
                    </div>
                  </div>

                  {/* Status */}
                  <div className="mt-2 text-xs text-slate-400 flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${globalAudioState.isPlaying ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`}></div>
                    {globalAudioState.isPlaying ? 'Playing' : 'Paused'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
