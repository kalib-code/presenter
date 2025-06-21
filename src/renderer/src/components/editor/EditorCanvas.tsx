import React, { useEffect } from 'react'
import { useCanvasStore } from '@renderer/store/editor-canvas'
import { useHistoryStore } from '@renderer/store/editor-history'
import { usePersistenceStore } from '@renderer/store/editor-persistence'
import { Canvas } from './Canvas'
import { ElementToolbar } from './ElementToolbar'
import { Button } from '@renderer/components/ui/button'

interface EditorCanvasProps {
  className?: string
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({ className = '' }) => {
  const { elements } = useCanvasStore()
  const { canUndo, canRedo, undo, redo } = useHistoryStore()
  const { autoSaveEnabled, lastAutoSave, saveEditor } = usePersistenceStore()

  // Initialize the canvas store
  useEffect(() => {
    useCanvasStore.getState().initialize()
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'z':
          e.preventDefault()
          if (e.shiftKey) {
            redo()
          } else {
            undo()
          }
          break
        case 's':
          e.preventDefault()
          saveEditor()
          break
      }
    }
  }

  return (
    <div
      className={`flex flex-col h-full bg-gray-900 ${className}`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Header with controls */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-white">Canvas Editor</h2>

          {/* Undo/Redo buttons */}
          <div className="flex gap-2">
            <Button
              onClick={undo}
              disabled={!canUndo}
              variant="outline"
              size="sm"
              className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
            >
              ↶ Undo
            </Button>
            <Button
              onClick={redo}
              disabled={!canRedo}
              variant="outline"
              size="sm"
              className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
            >
              ↷ Redo
            </Button>
          </div>
        </div>

        {/* Save status */}
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-400">
            {autoSaveEnabled ? (
              <span>Auto-save: {lastAutoSave ? 'Saved' : 'Pending'}</span>
            ) : (
              'Auto-save disabled'
            )}
          </div>

          <Button
            onClick={saveEditor}
            variant="outline"
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
          >
            💾 Save
          </Button>
        </div>
      </div>

      {/* Element toolbar */}
      <ElementToolbar />

      {/* Canvas area */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex justify-center">
          <Canvas className="shadow-2xl" />
        </div>
      </div>

      {/* Footer with info */}
      <div className="p-3 bg-gray-800 border-t border-gray-700 text-sm text-gray-400">
        <div className="flex justify-between items-center">
          <span>{elements.length} elements on canvas</span>
          <span>Use Ctrl+Z/Ctrl+Y for undo/redo • Ctrl+S to save</span>
        </div>
      </div>
    </div>
  )
}
