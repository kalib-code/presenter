import React, { useMemo } from 'react'
import {
  useGridEnabled,
  useGridVisible,
  useGridSize,
  useGridMode,
  useGridBoxesX,
  useGridBoxesY,
  useGridColor,
  useGridOpacity
} from '@renderer/store/editor-alignment'

interface GridOverlayProps {
  canvasWidth: number
  canvasHeight: number
  className?: string
}

export const GridOverlay: React.FC<GridOverlayProps> = ({
  canvasWidth,
  canvasHeight,
  className = ''
}) => {
  // Use primitive selectors to avoid object recreation
  const gridEnabled = useGridEnabled()
  const gridVisible = useGridVisible()
  const gridSize = useGridSize()
  const gridMode = useGridMode()
  const gridBoxesX = useGridBoxesX()
  const gridBoxesY = useGridBoxesY()
  const gridColor = useGridColor()
  const gridOpacity = useGridOpacity()

  // Generate grid lines using useMemo with primitive dependencies
  const gridLines = useMemo(() => {
    if (!gridEnabled || !gridVisible) {
      return { vertical: [], horizontal: [] }
    }

    const vertical: number[] = []
    const horizontal: number[] = []

    if (gridMode === 'boxes') {
      // Box-based grid: divide canvas into equal boxes
      const boxWidth = canvasWidth / gridBoxesX
      const boxHeight = canvasHeight / gridBoxesY

      // Generate vertical lines (excluding edges)
      for (let i = 1; i < gridBoxesX; i++) {
        vertical.push(i * boxWidth)
      }

      // Generate horizontal lines (excluding edges)
      for (let i = 1; i < gridBoxesY; i++) {
        horizontal.push(i * boxHeight)
      }
    } else {
      // Legacy pixel-based grid
      if (gridSize <= 0) {
        return { vertical: [], horizontal: [] }
      }

      // Generate vertical lines
      for (let x = gridSize; x < canvasWidth; x += gridSize) {
        vertical.push(x)
      }

      // Generate horizontal lines
      for (let y = gridSize; y < canvasHeight; y += gridSize) {
        horizontal.push(y)
      }
    }

    return { vertical, horizontal }
  }, [
    gridEnabled,
    gridVisible,
    gridMode,
    gridSize,
    gridBoxesX,
    gridBoxesY,
    canvasWidth,
    canvasHeight
  ])

  // Don't render anything if grid is disabled or not visible
  if (!gridEnabled || !gridVisible) {
    return null
  }

  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ opacity: gridOpacity }}
    >
      {/* Vertical grid lines */}
      {gridLines.vertical.map((x) => (
        <div
          key={`grid-v-${x}`}
          className="absolute h-full w-px"
          style={{
            left: x,
            backgroundColor: gridColor
          }}
        />
      ))}

      {/* Horizontal grid lines */}
      {gridLines.horizontal.map((y) => (
        <div
          key={`grid-h-${y}`}
          className="absolute w-full h-px"
          style={{
            top: y,
            backgroundColor: gridColor
          }}
        />
      ))}
    </div>
  )
}
