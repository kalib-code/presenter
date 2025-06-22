import React, { useCallback, useState } from 'react'
import { useCanvasStore } from '@renderer/store/editor-canvas'
import { Button } from '@renderer/components/ui/button'
import { MediaBrowser } from './MediaBrowser'
import { TemplateSelector } from './TemplateSelector'
import { AlignmentSettings } from './AlignmentSettings'
import { BackgroundSettings } from './BackgroundSettings'
import { createMediaReference } from '@renderer/utils/mediaUtils'
import type { Media } from '@renderer/types/database'
import { Layout, Type, Image, Video, Trash2 } from 'lucide-react'

interface ElementToolbarProps {
  className?: string
}

export const ElementToolbar: React.FC<ElementToolbarProps> = ({ className = '' }) => {
  const { addElement, clearElements, elements } = useCanvasStore()

  // Modal states
  const [mediaBrowserOpen, setMediaBrowserOpen] = useState(false)
  const [mediaBrowserType, setMediaBrowserType] = useState<'image' | 'video'>('image')
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false)

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

        // ✅ SOLUTION: Store only the filename reference, not the binary data
        const mediaReference = createMediaReference(file.filename) // Use utility function

        if (file.type === 'image') {
          addElement('image', {
            content: mediaReference, // Store filename reference, not base64 data
            position: { x: 150, y: 150 },
            size: { width: 200, height: 150 }
          })
          console.log('✅ Image element added with reference:', mediaReference)
        } else if (file.type === 'video') {
          addElement('video', {
            content: mediaReference, // Store filename reference, not base64 data
            position: { x: 200, y: 200 },
            size: { width: 320, height: 240 }
          })
          console.log('✅ Video element added with reference:', mediaReference)
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

  const handleOpenTemplateSelector = useCallback(() => {
    setTemplateSelectorOpen(true)
  }, [])

  return (
    <>
      <div className={`flex flex-wrap gap-2 p-4 bg-card border-b border-border ${className}`}>
        <div className="flex gap-2">
          <Button
            onClick={handleOpenTemplateSelector}
            variant="outline"
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600"
          >
            <Layout className="w-4 h-4 mr-2" />
            Templates
          </Button>

          <AlignmentSettings />

          <BackgroundSettings />

          <Button
            onClick={handleAddText}
            variant="outline"
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
          >
            <Type className="w-4 h-4 mr-2" />
            Text
          </Button>

          <Button
            onClick={handleAddImage}
            variant="outline"
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white border-green-600"
          >
            <Image className="w-4 h-4 mr-2" />
            Image
          </Button>

          <Button
            onClick={handleAddVideo}
            variant="outline"
            size="sm"
            className="bg-purple-600 hover:bg-purple-700 text-white border-purple-600"
          >
            <Video className="w-4 h-4 mr-2" />
            Video
          </Button>
        </div>

        <div className="flex-1" />

        <div className="flex gap-2 items-center">
          <span className="text-sm text-muted-foreground">
            {elements.length} element{elements.length !== 1 ? 's' : ''}
          </span>

          {elements.length > 0 && (
            <Button
              onClick={handleClearAll}
              variant="outline"
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white border-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Template Selector Modal */}
      <TemplateSelector
        isOpen={templateSelectorOpen}
        onClose={() => setTemplateSelectorOpen(false)}
      />

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
