import React, { useCallback } from 'react'
import { useCanvasStore, type EditorElement } from '@renderer/store/editor-canvas'

interface CanvasElementProps {
  element: EditorElement
  isSelected: boolean
  isDragging: boolean
  onMouseDown: (e: React.MouseEvent, elementId: string) => void
  onResizeStart: (e: React.MouseEvent, handle: string, elementId: string) => void
}

export const CanvasElement: React.FC<CanvasElementProps> = ({
  element,
  isSelected,
  isDragging,
  onMouseDown,
  onResizeStart
}) => {
  const { selectElement, deleteElement, updateElementContent } = useCanvasStore()

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      selectElement(element.id)
    },
    [element.id, selectElement]
  )

  const handleContentChange = useCallback(
    (value: string) => {
      updateElementContent(element.id, value)
    },
    [element.id, updateElementContent]
  )

  const handleDelete = useCallback(() => {
    deleteElement(element.id)
  }, [element.id, deleteElement])

  const renderElement = (): React.ReactNode => {
    switch (element.type) {
      case 'text':
        return (
          <div className="relative w-full h-full">
            <div
              className="w-full h-full flex items-center justify-center cursor-text"
              style={{
                fontSize: element.style.fontSize,
                fontFamily: element.style.fontFamily,
                color: element.style.color,
                backgroundColor: element.style.backgroundColor,
                textAlign: element.style.textAlign,
                fontWeight: element.style.fontWeight,
                fontStyle: element.style.fontStyle,
                textShadow: element.style.textShadow,
                lineHeight: element.style.lineHeight,
                opacity: element.opacity
              }}
              onClick={handleClick}
            >
              <textarea
                value={element.content}
                onChange={(e) => handleContentChange(e.target.value)}
                className="bg-transparent border-none outline-none w-full h-full resize-none"
                style={{
                  fontSize: element.style.fontSize,
                  fontFamily: element.style.fontFamily,
                  color: element.style.color,
                  backgroundColor: 'transparent',
                  fontWeight: element.style.fontWeight,
                  fontStyle: element.style.fontStyle,
                  lineHeight: element.style.lineHeight,
                  textAlign: element.style.textAlign,
                  textShadow: element.style.textShadow
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={handleClick}
                onFocus={() => selectElement(element.id)}
                placeholder="Type your text here..."
              />
            </div>
          </div>
        )

      case 'image':
        return (
          <img
            src={element.content}
            alt="Slide element"
            className="w-full h-full object-cover rounded"
            style={{ opacity: element.opacity }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={handleClick}
            draggable={false}
          />
        )

      case 'video':
        return (
          <video
            src={element.content}
            className="w-full h-full object-cover rounded"
            style={{ opacity: element.opacity }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={handleClick}
            controls
            muted
            playsInline
          />
        )

      default:
        return null
    }
  }

  return (
    <div
      className={`absolute group cursor-move ${
        isSelected
          ? 'border-2 border-dashed border-blue-500'
          : 'border-2 border-dashed border-transparent'
      } ${isDragging ? 'opacity-80' : ''}`}
      style={{
        left: element.position.x,
        top: element.position.y,
        width: element.size.width,
        height: element.size.height,
        zIndex: element.zIndex || 0,
        transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined
      }}
      onMouseDown={(e) => onMouseDown(e, element.id)}
      data-canvas="true"
    >
      {renderElement()}

      {/* Delete button */}
      <button
        onClick={handleDelete}
        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs z-10"
      >
        ×
      </button>

      {/* Resize handles - only show when selected */}
      {isSelected && (
        <>
          {/* Corner handles */}
          <div
            className="absolute w-3 h-3 bg-blue-500 border-2 border-white cursor-nw-resize -top-1.5 -left-1.5 rounded-sm shadow-sm hover:bg-blue-600 transition-colors z-10"
            onMouseDown={(e) => onResizeStart(e, 'nw', element.id)}
          />
          <div
            className="absolute w-3 h-3 bg-blue-500 border-2 border-white cursor-ne-resize -top-1.5 -right-1.5 rounded-sm shadow-sm hover:bg-blue-600 transition-colors z-10"
            onMouseDown={(e) => onResizeStart(e, 'ne', element.id)}
          />
          <div
            className="absolute w-3 h-3 bg-blue-500 border-2 border-white cursor-sw-resize -bottom-1.5 -left-1.5 rounded-sm shadow-sm hover:bg-blue-600 transition-colors z-10"
            onMouseDown={(e) => onResizeStart(e, 'sw', element.id)}
          />
          <div
            className="absolute w-3 h-3 bg-blue-500 border-2 border-white cursor-se-resize -bottom-1.5 -right-1.5 rounded-sm shadow-sm hover:bg-blue-600 transition-colors z-10"
            onMouseDown={(e) => onResizeStart(e, 'se', element.id)}
          />

          {/* Edge handles */}
          <div
            className="absolute w-3 h-3 bg-blue-500 border-2 border-white cursor-n-resize -top-1.5 left-1/2 transform -translate-x-1/2 rounded-sm shadow-sm hover:bg-blue-600 transition-colors z-10"
            onMouseDown={(e) => onResizeStart(e, 'n', element.id)}
          />
          <div
            className="absolute w-3 h-3 bg-blue-500 border-2 border-white cursor-s-resize -bottom-1.5 left-1/2 transform -translate-x-1/2 rounded-sm shadow-sm hover:bg-blue-600 transition-colors z-10"
            onMouseDown={(e) => onResizeStart(e, 's', element.id)}
          />
          <div
            className="absolute w-3 h-3 bg-blue-500 border-2 border-white cursor-w-resize -left-1.5 top-1/2 transform -translate-y-1/2 rounded-sm shadow-sm hover:bg-blue-600 transition-colors z-10"
            onMouseDown={(e) => onResizeStart(e, 'w', element.id)}
          />
          <div
            className="absolute w-3 h-3 bg-blue-500 border-2 border-white cursor-e-resize -right-1.5 top-1/2 transform -translate-y-1/2 rounded-sm shadow-sm hover:bg-blue-600 transition-colors z-10"
            onMouseDown={(e) => onResizeStart(e, 'e', element.id)}
          />
        </>
      )}
    </div>
  )
}
