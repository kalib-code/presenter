import React, { useCallback, useMemo } from 'react'
import {
  useAlignmentStore,
  useShowRulers,
  useRulerColor,
  useRulerUnit
} from '@renderer/store/editor-alignment'

interface RulersProps {
  canvasWidth: number
  canvasHeight: number
  className?: string
}

export const Rulers: React.FC<RulersProps> = ({ canvasWidth, canvasHeight, className = '' }) => {
  const showRulers = useShowRulers()
  const rulerColor = useRulerColor()
  const rulerUnit = useRulerUnit()
  const { addGuide } = useAlignmentStore()

  // Generate ruler marks
  const rulerMarks = useMemo(() => {
    if (!showRulers) return { horizontal: [], vertical: [] }

    let step = 10 // Default step in pixels

    if (rulerUnit === 'cm') step = 37.8 // 1cm ≈ 37.8px at 96dpi
    if (rulerUnit === 'in') step = 96 // 1in = 96px at 96dpi

    const horizontal: { position: number; label: string; major: boolean }[] = []
    const vertical: { position: number; label: string; major: boolean }[] = []

    // Horizontal ruler marks
    for (let x = 0; x <= canvasWidth; x += step) {
      const major = x % (step * 5) === 0
      let label = ''

      if (major) {
        if (rulerUnit === 'px') label = x.toString()
        else if (rulerUnit === 'cm') label = (x / 37.8).toFixed(1)
        else if (rulerUnit === 'in') label = (x / 96).toFixed(1)
      }

      horizontal.push({ position: x, label, major })
    }

    // Vertical ruler marks
    for (let y = 0; y <= canvasHeight; y += step) {
      const major = y % (step * 5) === 0
      let label = ''

      if (major) {
        if (rulerUnit === 'px') label = y.toString()
        else if (rulerUnit === 'cm') label = (y / 37.8).toFixed(1)
        else if (rulerUnit === 'in') label = (y / 96).toFixed(1)
      }

      vertical.push({ position: y, label, major })
    }

    return { horizontal, vertical }
  }, [showRulers, rulerUnit, canvasWidth, canvasHeight])

  const handleHorizontalRulerClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left // X position where clicked

      addGuide('vertical', x) // Top ruler creates vertical guides
    },
    [addGuide]
  )

  const handleVerticalRulerClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const rect = e.currentTarget.getBoundingClientRect()
      const y = e.clientY - rect.top // Y position where clicked

      addGuide('horizontal', y) // Side ruler creates horizontal guides
    },
    [addGuide]
  )

  if (!showRulers) {
    return null
  }

  return (
    <div className={className}>
      {/* Horizontal Ruler */}
      <div
        className="absolute top-0 left-8 bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-600 cursor-crosshair z-10"
        style={{
          width: canvasWidth,
          height: 32,
          color: rulerColor
        }}
        onClick={handleHorizontalRulerClick}
        title="Click to add horizontal guide"
      >
        {rulerMarks.horizontal.map((mark) => (
          <div
            key={`h-mark-${mark.position}`}
            className="absolute flex items-end justify-center pointer-events-none"
            style={{
              left: mark.position,
              height: mark.major ? '100%' : '50%',
              transform: 'translateX(-50%)'
            }}
          >
            <div className="w-px bg-current" style={{ height: mark.major ? '100%' : '50%' }} />
            {mark.major && mark.label && (
              <span className="absolute text-xs font-mono" style={{ bottom: 2, fontSize: '10px' }}>
                {mark.label}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Vertical Ruler */}
      <div
        className="absolute top-8 left-0 bg-gray-100 dark:bg-gray-800 border-r border-gray-300 dark:border-gray-600 cursor-crosshair z-10"
        style={{
          width: 32,
          height: canvasHeight,
          color: rulerColor
        }}
        onClick={handleVerticalRulerClick}
        title="Click to add vertical guide"
      >
        {rulerMarks.vertical.map((mark) => (
          <div
            key={`v-mark-${mark.position}`}
            className="absolute flex items-center justify-end pointer-events-none"
            style={{
              top: mark.position,
              width: mark.major ? '100%' : '50%',
              transform: 'translateY(-50%)'
            }}
          >
            <div className="h-px bg-current" style={{ width: mark.major ? '100%' : '50%' }} />
            {mark.major && mark.label && (
              <span
                className="absolute text-xs font-mono transform -rotate-90"
                style={{ right: 2, fontSize: '10px', transformOrigin: 'center' }}
              >
                {mark.label}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Ruler Corner */}
      <div
        className="absolute top-0 left-0 bg-gray-200 dark:bg-gray-700 border-b border-r border-gray-300 dark:border-gray-600 z-10"
        style={{ width: 32, height: 32 }}
      />
    </div>
  )
}
