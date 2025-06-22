import React, { useCallback, useRef, useEffect, useState } from 'react'
import { useCanvasStore } from '@renderer/store/editor-canvas'
import { useBackgroundStore } from '@renderer/store/editor-background'
import { useAlignmentStore, useShowRulers } from '@renderer/store/editor-alignment'
import { CanvasElement } from './CanvasElement'
import { GridOverlay } from './GridOverlay'
import { Rulers } from './Rulers'
import { GuidesOverlay } from './GuidesOverlay'
import { resolveMediaUrl } from '@renderer/utils/mediaUtils'

interface CanvasProps {
  className?: string
}

export const Canvas: React.FC<CanvasProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const dragStartPos = useRef<{ x: number; y: number } | null>(null)
  
  // State for resolved media URLs
  const [resolvedSlideImageUrl, setResolvedSlideImageUrl] = useState<string | null>(null)
  const [resolvedSlideVideoUrl, setResolvedSlideVideoUrl] = useState<string | null>(null)
  const [resolvedGlobalImageUrl, setResolvedGlobalImageUrl] = useState<string | null>(null)
  const [resolvedGlobalVideoUrl, setResolvedGlobalVideoUrl] = useState<string | null>(null)

  const {
    elements,
    selectedElementId,
    isDragging,
    isResizing,
    draggedElementId,
    resizeHandle,
    dragOffset,
    selectElement,
    moveElement,
    resizeElement,
    setDragState,
    setResizeState,
    canvasSize,
    safeArea
  } = useCanvasStore()


  // Background stores - use direct store access to avoid infinite loops
  const slideBackgroundType = useBackgroundStore((state) => state.backgroundType)
  const slideBackgroundImage = useBackgroundStore((state) => state.backgroundImage)
  const slideBackgroundVideo = useBackgroundStore((state) => state.backgroundVideo)
  const slideBackgroundVideoBlob = useBackgroundStore((state) => state.backgroundVideoBlob)
  const slideBackgroundOpacity = useBackgroundStore((state) => state.backgroundOpacity)
  const slideVideoLoop = useBackgroundStore((state) => state.videoLoop)
  const slideVideoMuted = useBackgroundStore((state) => state.videoMuted)

  const globalBackgroundType = useBackgroundStore((state) => state.globalBackgroundType)
  const globalBackgroundImage = useBackgroundStore((state) => state.globalBackgroundImage)
  const globalBackgroundVideo = useBackgroundStore((state) => state.globalBackgroundVideo)
  const globalBackgroundVideoBlob = useBackgroundStore((state) => state.globalBackgroundVideoBlob)
  const globalBackgroundOpacity = useBackgroundStore((state) => state.globalBackgroundOpacity)
  const globalVideoLoop = useBackgroundStore((state) => state.globalVideoLoop)
  const globalVideoMuted = useBackgroundStore((state) => state.globalVideoMuted)

  const backgroundSize = useBackgroundStore((state) => state.backgroundSize)
  const backgroundPosition = useBackgroundStore((state) => state.backgroundPosition)
  
  // Alignment settings
  const showRulers = useShowRulers()

  // Resolve slide background image URL
  useEffect(() => {
    if (slideBackgroundImage) {
      resolveMediaUrl(slideBackgroundImage)
        .then(setResolvedSlideImageUrl)
        .catch(() => setResolvedSlideImageUrl(null))
    } else {
      setResolvedSlideImageUrl(null)
    }
  }, [slideBackgroundImage])

  // Resolve slide background video URL
  useEffect(() => {
    if (slideBackgroundVideo) {
      resolveMediaUrl(slideBackgroundVideo)
        .then(setResolvedSlideVideoUrl)
        .catch(() => setResolvedSlideVideoUrl(null))
    } else {
      setResolvedSlideVideoUrl(null)
    }
  }, [slideBackgroundVideo])

  // Resolve global background image URL
  useEffect(() => {
    if (globalBackgroundImage) {
      resolveMediaUrl(globalBackgroundImage)
        .then(setResolvedGlobalImageUrl)
        .catch(() => setResolvedGlobalImageUrl(null))
    } else {
      setResolvedGlobalImageUrl(null)
    }
  }, [globalBackgroundImage])

  // Resolve global background video URL
  useEffect(() => {
    if (globalBackgroundVideo) {
      resolveMediaUrl(globalBackgroundVideo)
        .then(setResolvedGlobalVideoUrl)
        .catch(() => setResolvedGlobalVideoUrl(null))
    } else {
      setResolvedGlobalVideoUrl(null)
    }
  }, [globalBackgroundVideo])

  // Get selected element
  const selectedElement = selectedElementId
    ? elements.find((el) => el.id === selectedElementId) || null
    : null

  // Handle canvas click (deselect elements)
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        selectElement(null)
      }
    },
    [selectElement]
  )

  // Handle element drag start
  const handleElementMouseDown = useCallback(
    (e: React.MouseEvent, elementId: string) => {
      if (e.button !== 0) return // Only left mouse button

      e.preventDefault()
      e.stopPropagation()

      const element = elements.find((el) => el.id === elementId)
      if (!element) return

      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return

      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      const offset = {
        x: mouseX - element.position.x,
        y: mouseY - element.position.y
      }

      setDragState(true, elementId, offset)
      selectElement(elementId)

      dragStartPos.current = { x: mouseX, y: mouseY }
    },
    [elements, setDragState, selectElement]
  )

  // Handle resize start
  const handleResizeStart = useCallback(
    (e: React.MouseEvent, handle: string, elementId: string) => {
      e.preventDefault()
      e.stopPropagation()

      setResizeState(true, handle)
      selectElement(elementId)

      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return

      dragStartPos.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }
    },
    [setResizeState, selectElement]
  )

  // Handle mouse move for dragging and resizing
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return

      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      if (isDragging && draggedElementId && dragOffset) {
        const draggedElement = elements.find(el => el.id === draggedElementId)
        if (!draggedElement) return

        let newX = mouseX - dragOffset.x
        let newY = mouseY - dragOffset.y

        // Apply snap-to-grid if enabled
        const snapped = useAlignmentStore.getState().snapPosition(
          { x: newX, y: newY },
          canvasSize,
          elements.filter(el => el.id !== draggedElementId)
        )
        newX = snapped.x
        newY = snapped.y

        // Constrain to safe area with proper element size consideration
        newX = Math.max(
          safeArea.left,
          Math.min(canvasSize.width - safeArea.right - draggedElement.size.width, newX)
        )
        newY = Math.max(
          safeArea.top,
          Math.min(canvasSize.height - safeArea.bottom - draggedElement.size.height, newY)
        )

        moveElement(draggedElementId, { x: newX, y: newY })
      }

      if (isResizing && selectedElement && resizeHandle && dragStartPos.current) {
        const deltaX = mouseX - dragStartPos.current.x
        const deltaY = mouseY - dragStartPos.current.y

        let newWidth = selectedElement.size.width
        let newHeight = selectedElement.size.height
        let newX = selectedElement.position.x
        let newY = selectedElement.position.y

        switch (resizeHandle) {
          case 'se':
            newWidth = Math.max(50, selectedElement.size.width + deltaX)
            newHeight = Math.max(30, selectedElement.size.height + deltaY)
            break
          case 'sw':
            newWidth = Math.max(50, selectedElement.size.width - deltaX)
            newHeight = Math.max(30, selectedElement.size.height + deltaY)
            newX = selectedElement.position.x + deltaX
            break
          case 'ne':
            newWidth = Math.max(50, selectedElement.size.width + deltaX)
            newHeight = Math.max(30, selectedElement.size.height - deltaY)
            newY = selectedElement.position.y + deltaY
            break
          case 'nw':
            newWidth = Math.max(50, selectedElement.size.width - deltaX)
            newHeight = Math.max(30, selectedElement.size.height - deltaY)
            newX = selectedElement.position.x + deltaX
            newY = selectedElement.position.y + deltaY
            break
          case 'n':
            newHeight = Math.max(30, selectedElement.size.height - deltaY)
            newY = selectedElement.position.y + deltaY
            break
          case 's':
            newHeight = Math.max(30, selectedElement.size.height + deltaY)
            break
          case 'w':
            newWidth = Math.max(50, selectedElement.size.width - deltaX)
            newX = selectedElement.position.x + deltaX
            break
          case 'e':
            newWidth = Math.max(50, selectedElement.size.width + deltaX)
            break
        }

        // Update position if it changed
        if (newX !== selectedElement.position.x || newY !== selectedElement.position.y) {
          moveElement(selectedElement.id, { x: newX, y: newY })
        }

        // Update size
        resizeElement(selectedElement.id, { width: newWidth, height: newHeight })

        // Update drag start position for next move
        dragStartPos.current = { x: mouseX, y: mouseY }
      }
    },
    [
      isDragging,
      isResizing,
      draggedElementId,
      selectedElement,
      resizeHandle,
      dragOffset,
      safeArea,
      canvasSize,
      moveElement,
      resizeElement
    ]
  )

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setDragState(false)
    setResizeState(false)
    dragStartPos.current = null
  }, [setDragState, setResizeState])

  // Add event listeners
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }

    return undefined
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp])

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Rulers */}
      <Rulers
        canvasWidth={canvasSize.width}
        canvasHeight={canvasSize.height}
      />

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="relative bg-slate-900 dark:bg-slate-100 border border-border rounded-lg cursor-default overflow-hidden"
        style={{
          width: canvasSize.width,
          height: canvasSize.height,
          marginLeft: showRulers ? 32 : 0,
          marginTop: showRulers ? 32 : 0
        }}
        onClick={handleCanvasClick}
        onMouseDown={(e) => e.preventDefault()}
      >
        {/* Background Logic: Slide background takes precedence over global background */}
        {slideBackgroundType !== 'none' ? (
          <>
            {/* Slide Background */}
            {slideBackgroundType === 'image' && resolvedSlideImageUrl && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `url(${resolvedSlideImageUrl})`,
                  backgroundSize: backgroundSize === 'none' ? 'auto' : backgroundSize,
                  backgroundPosition: backgroundPosition,
                  backgroundRepeat: backgroundSize === 'none' ? 'no-repeat' : 'no-repeat',
                  opacity: slideBackgroundOpacity
                }}
              />
            )}
            {slideBackgroundType === 'video' && 
              (slideBackgroundVideoBlob || resolvedSlideVideoUrl) && (
                <video
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{
                    objectFit:
                      backgroundSize === 'cover'
                        ? 'cover'
                        : backgroundSize === 'contain'
                          ? 'contain'
                          : backgroundSize === 'fill'
                            ? 'fill'
                            : 'none',
                    objectPosition: backgroundPosition,
                    opacity: slideBackgroundOpacity
                  }}
                  src={slideBackgroundVideoBlob || resolvedSlideVideoUrl || ''}
                  autoPlay
                  loop={slideVideoLoop}
                  muted={slideVideoMuted}
                  playsInline
                />
              )}
          </>
        ) : (
          <>
            {/* Global Background (only when no slide background) */}
            {globalBackgroundType === 'image' && resolvedGlobalImageUrl && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `url(${resolvedGlobalImageUrl})`,
                  backgroundSize: backgroundSize === 'none' ? 'auto' : backgroundSize,
                  backgroundPosition: backgroundPosition,
                  backgroundRepeat: backgroundSize === 'none' ? 'no-repeat' : 'no-repeat',
                  opacity: globalBackgroundOpacity
                }}
              />
            )}
            {globalBackgroundType === 'video' &&
              (globalBackgroundVideoBlob || resolvedGlobalVideoUrl) && (
                <video
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{
                    objectFit:
                      backgroundSize === 'cover'
                        ? 'cover'
                        : backgroundSize === 'contain'
                          ? 'contain'
                          : backgroundSize === 'fill'
                            ? 'fill'
                            : 'none',
                    objectPosition: backgroundPosition,
                    opacity: globalBackgroundOpacity
                  }}
                  src={globalBackgroundVideoBlob || resolvedGlobalVideoUrl || ''}
                  autoPlay
                  loop={globalVideoLoop}
                  muted={globalVideoMuted}
                  playsInline
                />
              )}
          </>
        )}

        {/* Grid Overlay */}
        <GridOverlay 
          canvasWidth={canvasSize.width}
          canvasHeight={canvasSize.height}
        />

        {/* Guides Overlay */}
        <GuidesOverlay
          canvasWidth={canvasSize.width}
          canvasHeight={canvasSize.height}
        />

        {/* Safe area guides */}
        <div
          className="absolute border border-dashed border-slate-400 dark:border-slate-600 pointer-events-none"
          style={{
            left: safeArea.left,
            top: safeArea.top,
            right: safeArea.right,
            bottom: safeArea.bottom
          }}
        />

        {/* Canvas elements */}
        {elements.map((element) => (
          <CanvasElement
            key={element.id}
            element={element}
            isSelected={selectedElement?.id === element.id}
            isDragging={isDragging && draggedElementId === element.id}
            onMouseDown={handleElementMouseDown}
            onResizeStart={handleResizeStart}
          />
        ))}

        {/* Canvas info overlay */}
        <div className="absolute bottom-2 right-2 text-xs text-slate-400 dark:text-slate-600 bg-slate-800/80 dark:bg-slate-200/80 px-2 py-1 rounded">
          {canvasSize.width} × {canvasSize.height}
        </div>
      </div>
    </div>
  )
}
