import React, { useCallback, useState } from 'react'
import {
  useAlignmentStore,
  useGuides,
  useShowGuides,
  useGuideOpacity,
  useSmartGuides,
  useShowSmartGuides,
  AlignmentGuide
} from '@renderer/store/editor-alignment'

interface GuidesOverlayProps {
  canvasWidth: number
  canvasHeight: number
  className?: string
}

export const GuidesOverlay: React.FC<GuidesOverlayProps> = ({
  canvasWidth,
  canvasHeight,
  className = ''
}) => {
  const guides = useGuides()
  const showGuides = useShowGuides()
  const guideOpacity = useGuideOpacity()
  const smartGuides = useSmartGuides()
  const showSmartGuides = useShowSmartGuides()
  const { removeGuide, updateGuide } = useAlignmentStore()

  // Drag state
  const [dragState, setDragState] = useState<{
    isDragging: boolean
    guideId: string | null
    startPosition: number
    startMousePosition: number
  }>({
    isDragging: false,
    guideId: null,
    startPosition: 0,
    startMousePosition: 0
  })

  const handleGuideDoubleClick = useCallback(
    (guideId: string) => {
      removeGuide(guideId)
    },
    [removeGuide]
  )

  const handleGuideMouseDown = useCallback((e: React.MouseEvent, guide: AlignmentGuide) => {
    e.preventDefault()
    e.stopPropagation()

    const startMousePosition = guide.type === 'vertical' ? e.clientX : e.clientY

    setDragState({
      isDragging: true,
      guideId: guide.id,
      startPosition: guide.position,
      startMousePosition
    })
  }, [])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragState.isDragging || !dragState.guideId) return

      const currentGuide = guides.find((g) => g.id === dragState.guideId)
      if (!currentGuide) return

      const currentMousePosition = currentGuide.type === 'vertical' ? e.clientX : e.clientY
      const deltaPosition = currentMousePosition - dragState.startMousePosition
      let newPosition = dragState.startPosition + deltaPosition

      // Constrain to canvas bounds
      if (currentGuide.type === 'vertical') {
        newPosition = Math.max(0, Math.min(canvasWidth, newPosition))
      } else {
        newPosition = Math.max(0, Math.min(canvasHeight, newPosition))
      }

      updateGuide(dragState.guideId, newPosition)
    },
    [dragState, guides, canvasWidth, canvasHeight, updateGuide]
  )

  const handleMouseUp = useCallback(() => {
    if (dragState.isDragging) {
      setDragState({
        isDragging: false,
        guideId: null,
        startPosition: 0,
        startMousePosition: 0
      })
    }
  }, [dragState])

  // Add global mouse event listeners when dragging
  React.useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp])

  if (!showGuides) {
    return null
  }

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {/* Static guides */}
      {guides.map((guide) => {
        const isDragging = dragState.isDragging && dragState.guideId === guide.id

        return (
          <div
            key={guide.id}
            className={`absolute ${
              guide.type === 'vertical' ? 'h-full cursor-ew-resize' : 'w-full cursor-ns-resize'
            } pointer-events-auto hover:shadow-lg transition-all duration-150 ${
              isDragging ? 'shadow-xl scale-105 z-50' : ''
            }`}
            style={{
              [guide.type === 'vertical' ? 'left' : 'top']: guide.position,
              [guide.type === 'vertical' ? 'width' : 'height']: isDragging ? '3px' : '1px',
              backgroundColor: guide.color,
              opacity: isDragging ? 1 : guideOpacity,
              boxShadow: isDragging
                ? `0 0 8px ${guide.color}80, 0 0 16px ${guide.color}40`
                : `0 0 2px ${guide.color}40`,
              transform: isDragging ? 'translateZ(0)' : 'none'
            }}
            onMouseDown={(e) => handleGuideMouseDown(e, guide)}
            onDoubleClick={() => handleGuideDoubleClick(guide.id)}
            title={isDragging ? 'Dragging guide...' : 'Drag to move, double-click to remove'}
          />
        )
      })}

      {/* Smart guides (temporary guides during dragging) */}
      {showSmartGuides &&
        smartGuides.map((guide) => (
          <div
            key={guide.id}
            className={`absolute ${
              guide.type === 'vertical' ? 'h-full w-px' : 'w-full h-px'
            } pointer-events-none`}
            style={{
              [guide.type === 'vertical' ? 'left' : 'top']: guide.position,
              backgroundColor: guide.color,
              opacity: 0.8,
              boxShadow: `0 0 4px ${guide.color}`,
              animation: 'pulse 1s infinite'
            }}
          />
        ))}
    </div>
  )
}
