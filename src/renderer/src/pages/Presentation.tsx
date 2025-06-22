import { useEffect, useState } from 'react'
import { SlideRenderer } from '@renderer/components/editor/SlideRenderer'
import { BackgroundRenderer } from '@renderer/components/editor/BackgroundRenderer'

// Direct IPC access (nodeIntegration enabled for presentation window)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ipcRenderer: any = null

// Try to get ipcRenderer, but handle cases where it's not available (like during HMR)
try {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof window !== 'undefined' && (window as any).require) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ipcRenderer = (window as any).require('electron').ipcRenderer
  }
} catch (error) {
  console.warn('IPC renderer not available:', error)
}

interface ProjectionData {
  title: string
  content: string
  type: 'verse' | 'chorus' | 'bridge' | 'slide' | 'announcement' | 'countdown'
  slideData?: {
    elements: Array<{
      id?: string
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
    globalBackground?: {
      type: string
      value: string
      opacity?: number
      playbackRate?: number
      size?: 'cover' | 'contain' | 'fill' | 'none'
      position?: 'center' | 'top' | 'bottom' | 'left' | 'right'
    }
    slideBackground?: {
      type: string
      value: string
      opacity?: number
      playbackRate?: number
      size?: 'cover' | 'contain' | 'fill' | 'none'
      position?: 'center' | 'top' | 'bottom' | 'left' | 'right'
    }
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
}

interface PresentationState {
  isBlank: boolean
  showLogo: boolean
  currentData: ProjectionData | null
}

export default function Presentation(): JSX.Element {
  const [presentationState, setPresentationState] = useState<PresentationState>({
    isBlank: false,
    showLogo: false,
    currentData: null
  })

  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  })

  // Listen for projection updates from main process
  useEffect(() => {
    const handleProjectionUpdate = (_event: unknown, data: ProjectionData): void => {
      console.log(
        '📺 [PRESENTATION] Received projection data (full):',
        JSON.stringify(data, null, 2)
      )
      console.log('📺 [PRESENTATION] Projection data summary:', {
        title: data.title,
        type: data.type,
        contentLength: data.content?.length || 0,
        hasSlideData: !!data.slideData,
        elementsCount: data.slideData?.elements?.length || 0,
        elements:
          data.slideData?.elements?.map((el) => ({
            type: el.type,
            contentLength: el.content?.length || 0,
            contentPreview: el.content?.substring(0, 50) + '...',
            hasPosition: !!el.position,
            hasSize: !!el.size,
            hasStyle: !!el.style
          })) || [],
        hasGlobalBackground: !!data.slideData?.globalBackground,
        globalBackground: data.slideData?.globalBackground,
        hasSlideBackground: !!data.slideData?.slideBackground,
        slideBackground: data.slideData?.slideBackground
      })
      setPresentationState((prev) => ({
        ...prev,
        currentData: data,
        isBlank: false,
        showLogo: false
      }))
    }

    const handleBlankToggle = (_event: unknown, isBlank: boolean): void => {
      console.log('📺 [PRESENTATION] Toggle blank:', isBlank)
      setPresentationState((prev) => {
        const newState = {
          ...prev,
          isBlank
        }
        console.log('📺 [PRESENTATION] Updated presentation state:', newState)
        return newState
      })
    }

    const handleLogoToggle = (_event: unknown, showLogo: boolean): void => {
      console.log('📺 [PRESENTATION] Toggle logo:', showLogo)
      setPresentationState((prev) => ({
        ...prev,
        showLogo
      }))
    }

    const handleStopProjection = (): void => {
      console.log('📺 [PRESENTATION] Stop projection')
      setPresentationState({
        isBlank: false,
        showLogo: false,
        currentData: null
      })
    }

    // Register IPC listeners only if ipcRenderer is available
    if (ipcRenderer) {
      ipcRenderer.on('projection-update', handleProjectionUpdate)
      ipcRenderer.on('projection-blank', handleBlankToggle)
      ipcRenderer.on('projection-logo', handleLogoToggle)
      ipcRenderer.on('projection-stop', handleStopProjection)
    }

    return () => {
      // Cleanup listeners only if ipcRenderer is available
      if (ipcRenderer) {
        ipcRenderer.removeAllListeners('projection-update')
        ipcRenderer.removeAllListeners('projection-blank')
        ipcRenderer.removeAllListeners('projection-logo')
        ipcRenderer.removeAllListeners('projection-stop')
      }
    }
  }, [])

  // Listen for window resize events
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

  // Render blank screen (background only, no text)
  if (presentationState.isBlank && presentationState.currentData) {
    console.log('📺 [PRESENTATION] Rendering BLANK screen (background only)')
    const { currentData } = presentationState

    // Determine background (same logic as normal rendering)
    const background =
      currentData.slideData?.slideBackground || currentData.slideData?.globalBackground

    return (
      <div className="w-full h-screen relative overflow-hidden bg-black">
        <BackgroundRenderer background={background} />
        {/* No text elements - just background */}
      </div>
    )
  }

  // Render blank screen (completely black) if no current data
  if (presentationState.isBlank) {
    console.log('📺 [PRESENTATION] Rendering BLANK screen (no data)')
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        {/* Completely blank - no text or background */}
      </div>
    )
  }

  // Render logo
  if (presentationState.showLogo) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-white text-8xl font-bold">LOGO</div>
      </div>
    )
  }

  // Render projection content
  if (presentationState.currentData) {
    console.log('📺 [PRESENTATION] Rendering projection content, state:', {
      isBlank: presentationState.isBlank,
      showLogo: presentationState.showLogo,
      hasCurrentData: !!presentationState.currentData
    })
    const { currentData } = presentationState

    // Determine background
    const background =
      currentData.slideData?.slideBackground || currentData.slideData?.globalBackground

    console.log('📺 [PRESENTATION] Determined background:', {
      hasSlideBackground: !!currentData.slideData?.slideBackground,
      slideBackground: currentData.slideData?.slideBackground,
      hasGlobalBackground: !!currentData.slideData?.globalBackground,
      globalBackground: currentData.slideData?.globalBackground,
      finalBackground: background
    })

    // Handle countdown type first, regardless of slideData elements
    if (currentData.type === 'countdown') {
      console.log('📺 [PRESENTATION] Rendering countdown with CountdownDisplay')
      return (
        <div className="w-full h-screen flex items-center justify-center bg-black">
          <BackgroundRenderer background={background} />
          {!presentationState.isBlank && (
            <div className="relative z-10 w-full h-full">
              <CountdownDisplay content={currentData.content} slideData={currentData.slideData} />
            </div>
          )}
        </div>
      )
    }

    // Render rich slide content if available
    if (currentData.slideData?.elements && currentData.slideData.elements.length > 0) {
      console.log('📺 [PRESENTATION] Rendering with SlideRenderer:', {
        elementsCount: currentData.slideData.elements.length,
        elements: currentData.slideData.elements.map((el, i) => ({
          index: i,
          type: el.type,
          contentLength: el.content?.length || 0,
          contentPreview: el.content?.substring(0, 50) + '...',
          position: el.position,
          size: el.size,
          hasStyle: !!el.style
        })),
        containerSize: `${windowDimensions.width}x${windowDimensions.height}`,
        hasSlideBackground: !!currentData.slideData.slideBackground,
        hasGlobalBackground: !!currentData.slideData.globalBackground
      })

      return (
        <SlideRenderer
          elements={currentData.slideData.elements}
          slideBackground={currentData.slideData.slideBackground}
          globalBackground={currentData.slideData.globalBackground}
          containerWidth={windowDimensions.width}
          containerHeight={windowDimensions.height}
          isPreview={false}
          showBlank={presentationState.isBlank}
          className="w-full h-screen"
          useProjectionScaling={true}
        />
      )
    }

    // Fallback to simple text rendering
    console.log('📺 [PRESENTATION] Using fallback text rendering:', {
      hasSlideData: !!currentData.slideData,
      elementsCount: currentData.slideData?.elements?.length || 0,
      content: currentData.content,
      type: currentData.type
    })

    return (
      <div className="w-full h-screen flex items-center justify-center bg-black">
        <BackgroundRenderer background={background} />

        {/* Only render text content if not in blank mode */}
        {!presentationState.isBlank && (
          <div className="relative z-10 text-center max-w-4xl mx-auto px-8">
            {currentData.type === 'announcement' ? (
              <div className="bg-black bg-opacity-30 rounded-2xl p-16">
                <h1 className="text-6xl font-bold mb-8 text-white text-shadow-lg">Announcement</h1>
                <div className="text-4xl leading-relaxed text-white text-shadow-md">
                  {currentData.content}
                </div>
              </div>
            ) : (
              <div className="text-5xl leading-relaxed text-white text-shadow-lg font-bold whitespace-pre-line">
                {currentData.content}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Default state - waiting for content
  return (
    <div className="w-full h-screen bg-black flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-6xl font-bold mb-8 opacity-80">Projection Ready</h1>
        <p className="text-2xl opacity-60">Waiting for content...</p>
      </div>
    </div>
  )
}

// Enhanced Countdown component
interface CountdownSlideData {
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
  [key: string]: unknown // Allow other properties
}

function CountdownDisplay({
  content,
  slideData
}: {
  content: string
  slideData?: CountdownSlideData
}): JSX.Element {
  // Try to get enhanced config from slideData first, fallback to legacy format
  const countdownConfig = slideData?.countdownConfig

  // Legacy fallback parsing
  const [durationStr, message] = content.split(' - ')
  const fallbackDuration = parseInt(durationStr) || 300
  const fallbackMessage = message || 'Countdown'

  // Use enhanced config or fallback values
  const initialDuration = countdownConfig?.duration || fallbackDuration
  const title = countdownConfig?.title || fallbackMessage
  const displayMessage = countdownConfig?.message || fallbackMessage
  const styling = countdownConfig?.styling
  const background = countdownConfig?.background

  const [timeLeft, setTimeLeft] = useState(initialDuration)

  console.log('🎯 [COUNTDOWN] Rendering countdown with config:', {
    hasCountdownConfig: !!countdownConfig,
    title,
    displayMessage,
    initialDuration,
    hasBackground: !!background,
    backgroundType: background?.type,
    backgroundValue: background?.value
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  // Size classes for responsive design
  const getCounterSizeClass = (size?: string): string => {
    switch (size) {
      case 'small':
        return 'text-6xl'
      case 'medium':
        return 'text-8xl'
      case 'large':
        return 'text-9xl'
      case 'extra-large':
        return 'text-[12rem]'
      default:
        return 'text-9xl'
    }
  }

  const getTitleSizeClass = (size?: string): string => {
    switch (size) {
      case 'small':
        return 'text-3xl'
      case 'medium':
        return 'text-5xl'
      case 'large':
        return 'text-7xl'
      default:
        return 'text-5xl'
    }
  }

  const getMessageSizeClass = (size?: string): string => {
    switch (size) {
      case 'small':
        return 'text-xl'
      case 'medium':
        return 'text-3xl'
      case 'large':
        return 'text-5xl'
      default:
        return 'text-3xl'
    }
  }

  // Default background for countdown if none specified
  const defaultBackground = background || {
    type: 'color',
    value: 'linear-gradient(135deg, #DC2626, #EA580C)',
    opacity: 1
  }

  return (
    <div className="w-full h-screen flex items-center justify-center relative bg-black">
      <BackgroundRenderer background={defaultBackground} />

      <div className="relative z-10 text-center max-w-4xl mx-auto px-8">
        <h1
          className={`font-bold mb-12 ${getTitleSizeClass(styling?.titleSize)}`}
          style={{
            color: styling?.titleColor || '#FFFFFF',
            textShadow: styling?.textShadow !== false ? '2px 2px 4px rgba(0,0,0,0.8)' : 'none'
          }}
        >
          {title}
        </h1>

        <div
          className={`font-bold font-mono mb-8 ${getCounterSizeClass(styling?.counterSize)} ${
            timeLeft <= 0 ? 'animate-pulse' : ''
          }`}
          style={{
            color: timeLeft <= 0 ? '#FCA5A5' : styling?.counterColor || '#FFFFFF',
            textShadow: styling?.textShadow !== false ? '2px 2px 4px rgba(0,0,0,0.8)' : 'none'
          }}
        >
          {timeLeft <= 0 ? 'TIME!' : `${minutes}:${seconds.toString().padStart(2, '0')}`}
        </div>

        <div
          className={`${getMessageSizeClass(styling?.messageSize)}`}
          style={{
            color: styling?.messageColor || '#FFFFFF',
            textShadow: styling?.textShadow !== false ? '2px 2px 4px rgba(0,0,0,0.8)' : 'none'
          }}
        >
          {displayMessage}
        </div>
      </div>
    </div>
  )
}
