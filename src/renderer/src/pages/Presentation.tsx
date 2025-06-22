import React, { useEffect, useState } from 'react'
import { SlideRenderer } from '@renderer/components/editor/SlideRenderer'

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
      <div className="w-full h-screen relative overflow-hidden" style={backgroundStyles}>
        {backgroundElement}
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

    let backgroundStyles: React.CSSProperties = {
      background: '#000'
    }

    let backgroundElement: JSX.Element | null = null

    if (background) {
      console.log('📺 [PRESENTATION] Creating background element:', {
        type: background.type,
        hasValue: !!background.value,
        valueLength: background.value?.length || 0,
        opacity: background.opacity,
        size: background.size,
        position: background.position
      })

      if (background.type === 'video' && background.value) {
        // Convert background size to object-fit CSS property
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

        // Convert background position to object-position CSS property
        const objectPosition = background.position || 'center'

        console.log('📺 [PRESENTATION] Creating video element with:', {
          objectFit,
          objectPosition,
          opacity: background.opacity || 1,
          valuePreview: background.value.substring(0, 50) + '...'
        })

        backgroundElement = (
          <video
            key={background.value} // Force re-render when video source changes
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
            onLoadStart={() => console.log('📺 [PRESENTATION] Video load started')}
            onCanPlay={(e) => {
              const video = e.target as HTMLVideoElement
              console.log('📺 [PRESENTATION] Video can play:', {
                videoWidth: video.videoWidth,
                videoHeight: video.videoHeight,
                windowWidth: window.innerWidth,
                windowHeight: window.innerHeight,
                objectFit,
                objectPosition,
                videoElement: video,
                computedStyle: window.getComputedStyle(video)
              })
            }}
            onError={(e) => console.error('📺 [PRESENTATION] Video error:', e)}
          >
            <source src={background.value} type="video/mp4" />
          </video>
        )
      } else if (background.type === 'image' && background.value) {
        // Convert background size and position from editor to CSS values
        const backgroundSize = background.size === 'none' ? 'auto' : background.size || 'cover'
        const backgroundPosition = background.position || 'center'

        // For image backgrounds, we'll create an img element instead of using backgroundImage
        // to ensure proper re-rendering when the image changes
        backgroundElement = (
          <img
            key={background.value} // Force re-render when image source changes
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
            onLoad={() => console.log('📺 [PRESENTATION] Image loaded')}
            onError={(e) => console.error('📺 [PRESENTATION] Image error:', e)}
          />
        )
      } else if (background.type === 'color' && background.value) {
        backgroundStyles = {
          background: background.value
        }
      }
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
      <div className="w-full h-screen flex items-center justify-center" style={backgroundStyles}>
        {backgroundElement}

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
            ) : currentData.type === 'countdown' ? (
              <CountdownDisplay content={currentData.content} />
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

// Countdown component
function CountdownDisplay({ content }: { content: string }): JSX.Element {
  const [durationStr, message] = content.split(' - ')
  const initialDuration = parseInt(durationStr) || 300
  const [timeLeft, setTimeLeft] = useState(initialDuration)

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

  return (
    <div className="bg-gradient-to-br from-red-600 to-orange-600 w-full h-screen flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-5xl font-bold mb-12 text-shadow-lg">{message || 'Countdown'}</h1>
        <div
          className={`text-9xl font-bold text-shadow-lg font-mono ${
            timeLeft <= 0 ? 'text-red-300 animate-pulse' : ''
          }`}
        >
          {timeLeft <= 0 ? 'TIME!' : `${minutes}:${seconds.toString().padStart(2, '0')}`}
        </div>
      </div>
    </div>
  )
}
