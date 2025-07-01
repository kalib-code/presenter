import React, { useState, useEffect, useRef } from 'react'
import { useCanvasStore } from '@renderer/store/editor-canvas'
import { resolveMediaUrl, isMediaReference } from '@renderer/utils/mediaUtils'
import type { EditorElement } from '@renderer/store/editor-canvas'

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
  const { selectElement, deleteElement, updateElement } = useCanvasStore()
  const [resolvedContent, setResolvedContent] = useState<string>(element.content)
  const [isEditing, setIsEditing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Resolve media references when element content changes
  useEffect(() => {
    const loadContent = async (): Promise<void> => {
      if (element.type === 'image' || element.type === 'video') {
        const resolved = await resolveMediaUrl(element.content)
        setResolvedContent(resolved)
      } else {
        setResolvedContent(element.content)
      }
    }

    loadContent()
  }, [element.content, element.type])

  const handleClick = (e: React.MouseEvent): void => {
    e.stopPropagation()
    selectElement(element.id)
  }

  const handleDoubleClick = (e: React.MouseEvent): void => {
    e.stopPropagation()
    if (element.type === 'text') {
      setIsEditing(true)
      // Focus the textarea after state update
      setTimeout(() => {
        textareaRef.current?.focus()
        textareaRef.current?.select()
      }, 0)
    }
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    updateElement(element.id, { content: e.target.value })
  }

  const handleTextBlur = (): void => {
    setIsEditing(false)
  }

  const handleTextKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      setIsEditing(false)
    }
    if (e.key === 'Escape') {
      setIsEditing(false)
    }
    // Stop propagation to prevent canvas shortcuts
    e.stopPropagation()
  }

  const handleDelete = (e: React.MouseEvent): void => {
    e.stopPropagation()
    deleteElement(element.id)
  }

  const handleElementMouseDown = (e: React.MouseEvent): void => {
    // Allow dragging from within the element content
    // Only stop propagation if we're in text editing mode
    if (element.type === 'text' && isEditing) {
      e.stopPropagation()
      return
    }

    // For all other cases, allow the drag to bubble up
    onMouseDown(e, element.id)
  }

  const renderElement = (): JSX.Element | null => {
    switch (element.type) {
      case 'text':
        return (
          <div
            className={`w-full h-full flex items-center justify-center relative ${
              isEditing ? 'cursor-text' : 'cursor-move'
            }`}
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
              opacity: element.opacity,
              padding: '8px',
              wordWrap: 'break-word',
              overflow: 'hidden'
            }}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            onMouseDown={handleElementMouseDown}
          >
            {isEditing ? (
              <textarea
                ref={textareaRef}
                value={element.content}
                onChange={handleTextChange}
                onBlur={handleTextBlur}
                onKeyDown={handleTextKeyDown}
                className="w-full h-full bg-transparent border-none outline-none resize-none text-center"
                style={{
                  fontSize: element.style.fontSize,
                  fontFamily: element.style.fontFamily,
                  color: element.style.color,
                  fontWeight: element.style.fontWeight,
                  fontStyle: element.style.fontStyle,
                  lineHeight: element.style.lineHeight,
                  textAlign: element.style.textAlign,
                  textShadow: element.style.textShadow,
                  padding: '0'
                }}
                placeholder="Type your text here..."
                onMouseDown={(e) => e.stopPropagation()}
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center select-none"
                style={{
                  justifyContent:
                    element.style.textAlign === 'left'
                      ? 'flex-start'
                      : element.style.textAlign === 'right'
                        ? 'flex-end'
                        : 'center',
                  whiteSpace: 'pre-line'
                }}
              >
                {element.content || 'Double-click to edit text'}
              </div>
            )}
          </div>
        )

      case 'image':
        return (
          <img
            src={resolvedContent}
            alt="Slide element"
            className="w-full h-full object-cover rounded"
            style={{ opacity: element.opacity }}
            onMouseDown={handleElementMouseDown}
            onClick={handleClick}
            draggable={false}
            onError={() => {
              console.error('Failed to load image:', element.content, resolvedContent)
              console.log('🖼️ Image info:', {
                originalContent: element.content,
                resolvedContent: resolvedContent,
                isMediaReference: isMediaReference(element.content)
              })
            }}
          />
        )

      case 'video':
        return (
          <video
            src={resolvedContent}
            className="w-full h-full object-cover rounded"
            style={{ opacity: element.opacity }}
            onMouseDown={handleElementMouseDown}
            onClick={handleClick}
            controls
            muted
            playsInline
            onError={() => {
              console.error('Failed to load video:', element.content, resolvedContent)
              console.log('🎬 Video info:', {
                originalContent: element.content,
                resolvedContent: resolvedContent,
                isMediaReference: isMediaReference(element.content)
              })
            }}
          />
        )

      default:
        return null
    }
  }

  return (
    <div
      className={`absolute group ${
        element.type === 'text' && !isEditing
          ? 'cursor-move'
          : element.type === 'text' && isEditing
            ? 'cursor-text'
            : 'cursor-move'
      } ${
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
      data-canvas="true"
    >
      {renderElement()}

      {/* Delete button */}
      <button
        onClick={handleDelete}
        className="absolute -top-6 -right-6 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs z-10"
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
