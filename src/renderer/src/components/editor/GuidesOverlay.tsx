import React, { useCallback } from 'react'
import {
  useAlignmentStore,
  useGuides,
  useShowGuides,
  useGuideColor,
  useGuideOpacity,
  useSmartGuides,
  useShowSmartGuides
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
  const guideColor = useGuideColor()
  const guideOpacity = useGuideOpacity()
  const smartGuides = useSmartGuides()
  const showSmartGuides = useShowSmartGuides()
  const { removeGuide } = useAlignmentStore()

  const handleGuideDoubleClick = useCallback(
    (guideId: string) => {
      removeGuide(guideId)
    },
    [removeGuide]
  )

  if (!showGuides) {
    return null
  }

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {/* Static guides */}
      {guides.map((guide) => (
        <div
          key={guide.id}
          className={`absolute ${
            guide.type === 'vertical' ? 'h-full w-px cursor-ew-resize' : 'w-full h-px cursor-ns-resize'
          } pointer-events-auto hover:shadow-lg transition-shadow`}
          style={{
            [guide.type === 'vertical' ? 'left' : 'top']: guide.position,
            backgroundColor: guide.color,
            opacity: guideOpacity,
            boxShadow: `0 0 2px ${guide.color}40`
          }}
          onDoubleClick={() => handleGuideDoubleClick(guide.id)}
          title="Double-click to remove guide"
        />
      ))}
      
      {/* Smart guides (temporary guides during dragging) */}
      {showSmartGuides && smartGuides.map((guide) => (
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