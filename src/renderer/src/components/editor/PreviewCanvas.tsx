import React from 'react'
import { useCanvasStore } from '@renderer/store/editor-canvas'
import { useBackgroundStore } from '@renderer/store/editor-background'
import { SlideRenderer } from './SlideRenderer'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@renderer/constants/canvas'

interface PreviewCanvasProps {
  className?: string
  width?: number
  height?: number
}

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  className = '',
  width = CANVAS_WIDTH,
  height = CANVAS_HEIGHT
}) => {
  const elements = useCanvasStore((state) => state.elements)

  // Background stores
  const slideBackgroundType = useBackgroundStore((state) => state.backgroundType)
  const slideBackgroundImage = useBackgroundStore((state) => state.backgroundImage)
  const slideBackgroundVideo = useBackgroundStore((state) => state.backgroundVideo)
  const slideBackgroundVideoBlob = useBackgroundStore((state) => state.backgroundVideoBlob)
  const slideBackgroundOpacity = useBackgroundStore((state) => state.backgroundOpacity)
  const backgroundSize = useBackgroundStore((state) => state.backgroundSize)
  const backgroundPosition = useBackgroundStore((state) => state.backgroundPosition)

  const globalBackgroundType = useBackgroundStore((state) => state.globalBackgroundType)
  const globalBackgroundImage = useBackgroundStore((state) => state.globalBackgroundImage)
  const globalBackgroundVideo = useBackgroundStore((state) => state.globalBackgroundVideo)
  const globalBackgroundVideoBlob = useBackgroundStore((state) => state.globalBackgroundVideoBlob)
  const globalBackgroundOpacity = useBackgroundStore((state) => state.globalBackgroundOpacity)

  // Convert elements to SlideRenderer format
  const slideElements = elements.map((element) => ({
    id: element.id,
    type: element.type,
    content: element.content,
    position: element.position,
    size: element.size,
    style: element.style,
    zIndex: element.zIndex
  }))

  // Convert backgrounds to SlideRenderer format
  let slideBackground = undefined
  let globalBackground = undefined

  if (slideBackgroundType !== 'none') {
    slideBackground = {
      type: slideBackgroundType,
      value: slideBackgroundVideoBlob || slideBackgroundVideo || slideBackgroundImage || '',
      opacity: slideBackgroundOpacity,
      size: backgroundSize,
      position: backgroundPosition
    }
  } else if (globalBackgroundType !== 'none') {
    globalBackground = {
      type: globalBackgroundType,
      value: globalBackgroundVideoBlob || globalBackgroundVideo || globalBackgroundImage || '',
      opacity: globalBackgroundOpacity,
      size: backgroundSize,
      position: backgroundPosition
    }
  }

  return (
    <div className={`relative ${className}`}>
      <SlideRenderer
        elements={slideElements}
        slideBackground={slideBackground}
        globalBackground={globalBackground}
        containerWidth={width}
        containerHeight={height}
        isPreview={true}
        showBlank={false}
        className="border border-border rounded-lg shadow-2xl"
      />
    </div>
  )
}
