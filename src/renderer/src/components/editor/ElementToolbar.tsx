import React, { useCallback, useState } from 'react'
import { useCanvasStore } from '@renderer/store/editor-canvas'
import { Button } from '@renderer/components/ui/button'
import { MediaBrowser } from './MediaBrowser'
import type { Media } from '@renderer/types/database'

interface ElementToolbarProps {
  className?: string
}

export const ElementToolbar: React.FC<ElementToolbarProps> = ({ className = '' }) => {
  const { addElement, clearElements, elements } = useCanvasStore()

  // Media browser state
  const [mediaBrowserOpen, setMediaBrowserOpen] = useState(false)
  const [mediaBrowserType, setMediaBrowserType] = useState<'image' | 'video'>('image')

  const handleAddText = useCallback(() => {
    addElement('text', {
      content: 'New Text Element',
      position: { x: 100, y: 100 },
      size: { width: 300, height: 100 }
    })
  }, [addElement])

  const handleAddImage = useCallback(() => {
    setMediaBrowserType('image')
    setMediaBrowserOpen(true)
  }, [])

  const handleAddVideo = useCallback(() => {
    setMediaBrowserType('video')
    setMediaBrowserOpen(true)
  }, [])

  const handleMediaSelect = useCallback(
    async (file: Media) => {
      try {
        console.log('🎯 Element media selected:', file.name, file.type)
        const mediaUrl = await window.electron.ipcRenderer.invoke(
          'get-media-data-url',
          file.filename
        )

        if (file.type === 'image') {
          addElement('image', {
            content: mediaUrl,
            position: { x: 150, y: 150 },
            size: { width: 200, height: 150 }
          })
          console.log('✅ Image element added')
        } else if (file.type === 'video') {
          addElement('video', {
            content: mediaUrl,
            position: { x: 200, y: 200 },
            size: { width: 320, height: 240 }
          })
          console.log('✅ Video element added')
        }
      } catch (error) {
        console.error('❌ Failed to add media element:', error)
      }
    },
    [addElement]
  )

  const handleClearAll = useCallback(() => {
    if (elements.length > 0 && confirm('Are you sure you want to clear all elements?')) {
      clearElements()
    }
  }, [clearElements, elements.length])

  return (
    <>
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

      {/* Media Browser Modal */}
      <MediaBrowser
        isOpen={mediaBrowserOpen}
        onClose={() => setMediaBrowserOpen(false)}
        onSelect={handleMediaSelect}
        mediaType={mediaBrowserType}
        title={`Add ${mediaBrowserType === 'image' ? 'Image' : 'Video'} Element`}
      />
    </>
  )
}
