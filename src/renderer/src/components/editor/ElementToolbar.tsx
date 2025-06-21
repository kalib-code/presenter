import React, { useCallback } from 'react'
import { useCanvasStore } from '@renderer/store/editor-canvas'
import { Button } from '@renderer/components/ui/button'

interface ElementToolbarProps {
  className?: string
}

export const ElementToolbar: React.FC<ElementToolbarProps> = ({ className = '' }) => {
  const { addElement, clearElements, elements } = useCanvasStore()

  const handleAddText = useCallback(() => {
    addElement('text', {
      content: 'New Text Element',
      position: { x: 100, y: 100 },
      size: { width: 300, height: 100 }
    })
  }, [addElement])

  const handleAddImage = useCallback(() => {
    // Create file input for image selection
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const imageData = event.target?.result as string
          addElement('image', {
            content: imageData,
            position: { x: 150, y: 150 },
            size: { width: 200, height: 150 }
          })
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }, [addElement])

  const handleAddVideo = useCallback(() => {
    // Create file input for video selection
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'video/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const videoData = event.target?.result as string
          addElement('video', {
            content: videoData,
            position: { x: 200, y: 200 },
            size: { width: 320, height: 240 }
          })
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }, [addElement])

  const handleClearAll = useCallback(() => {
    if (elements.length > 0 && confirm('Are you sure you want to clear all elements?')) {
      clearElements()
    }
  }, [clearElements, elements.length])

  return (
    <div className={`flex flex-wrap gap-2 p-4 bg-gray-800 border-b border-gray-700 ${className}`}>
      <div className="flex gap-2">
        <Button
          onClick={handleAddText}
          variant="outline"
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
        >
          📝 Add Text
        </Button>

        <Button
          onClick={handleAddImage}
          variant="outline"
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white border-green-600"
        >
          🖼️ Add Image
        </Button>

        <Button
          onClick={handleAddVideo}
          variant="outline"
          size="sm"
          className="bg-purple-600 hover:bg-purple-700 text-white border-purple-600"
        >
          🎥 Add Video
        </Button>
      </div>

      <div className="flex-1" />

      <div className="flex gap-2 items-center">
        <span className="text-sm text-gray-400">
          {elements.length} element{elements.length !== 1 ? 's' : ''}
        </span>

        {elements.length > 0 && (
          <Button
            onClick={handleClearAll}
            variant="outline"
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white border-red-600"
          >
            🗑️ Clear All
          </Button>
        )}
      </div>
    </div>
  )
}
