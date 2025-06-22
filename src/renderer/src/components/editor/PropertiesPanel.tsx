import React, { useCallback } from 'react'
import { useCanvasStore, useSelectedElement } from '@renderer/store/editor-canvas'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Slider } from '@renderer/components/ui/slider'
import { Separator } from '@renderer/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import {
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  RotateCw,
  Move,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Palette,
  Underline,
  Type
} from 'lucide-react'

interface PropertiesPanelProps {
  className?: string
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ className = '' }) => {
  const selectedElement = useSelectedElement()
  const {
    updateElement,
    updateElementStyle,
    deleteElement,
    duplicateElement,
    moveElementsToFront,
    moveElementsToBack
  } = useCanvasStore()

  const handleStyleUpdate = useCallback(
    (updates: Partial<typeof selectedElement.style>) => {
      if (!selectedElement) return
      updateElementStyle(selectedElement.id, updates)
    },
    [selectedElement, updateElementStyle]
  )

  const handleElementUpdate = useCallback(
    (updates: Partial<typeof selectedElement>) => {
      if (!selectedElement) return
      updateElement(selectedElement.id, updates)
    },
    [selectedElement, updateElement]
  )

  const handlePositionChange = useCallback(
    (axis: 'x' | 'y', value: string) => {
      if (!selectedElement) return
      const numValue = parseInt(value) || 0
      handleElementUpdate({
        position: {
          ...selectedElement.position,
          [axis]: numValue
        }
      })
    },
    [selectedElement, handleElementUpdate]
  )

  const handleSizeChange = useCallback(
    (dimension: 'width' | 'height', value: string) => {
      if (!selectedElement) return
      const numValue = parseInt(value) || 50
      handleElementUpdate({
        size: {
          ...selectedElement.size,
          [dimension]: Math.max(50, numValue)
        }
      })
    },
    [selectedElement, handleElementUpdate]
  )

  const handleDelete = useCallback(() => {
    if (!selectedElement) return
    if (confirm('Are you sure you want to delete this element?')) {
      deleteElement(selectedElement.id)
    }
  }, [selectedElement, deleteElement])

  const handleDuplicate = useCallback(() => {
    if (!selectedElement) return
    duplicateElement(selectedElement.id)
  }, [selectedElement, duplicateElement])

  const handleBringToFront = useCallback(() => {
    if (!selectedElement) return
    moveElementsToFront([selectedElement.id])
  }, [selectedElement, moveElementsToFront])

  const handleSendToBack = useCallback(() => {
    if (!selectedElement) return
    moveElementsToBack([selectedElement.id])
  }, [selectedElement, moveElementsToBack])

  if (!selectedElement) {
    return (
      <div className={`w-80 bg-card border-l border-border p-4 ${className}`}>
        <div className="text-center text-muted-foreground">
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
              <Move className="w-8 h-8" />
            </div>
            <h3 className="font-medium mb-2">No Element Selected</h3>
            <p className="text-sm">Click on an element to edit its properties</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`w-80 bg-card border-l border-border ${className}`}>
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold capitalize">{selectedElement.type} Properties</h3>
          <div className="flex gap-1">
            <Button onClick={handleDuplicate} variant="ghost" size="sm">
              <Copy className="w-4 h-4" />
            </Button>
            <Button onClick={handleDelete} variant="ghost" size="sm" className="text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
        {/* Position & Size */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Position & Size</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">X</Label>
              <Input
                type="number"
                value={selectedElement.position.x}
                onChange={(e) => handlePositionChange('x', e.target.value)}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Y</Label>
              <Input
                type="number"
                value={selectedElement.position.y}
                onChange={(e) => handlePositionChange('y', e.target.value)}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Width</Label>
              <Input
                type="number"
                value={selectedElement.size.width}
                onChange={(e) => handleSizeChange('width', e.target.value)}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Height</Label>
              <Input
                type="number"
                value={selectedElement.size.height}
                onChange={(e) => handleSizeChange('height', e.target.value)}
                className="h-8"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Opacity */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Opacity</Label>
            <span className="text-xs text-muted-foreground">
              {Math.round((selectedElement.opacity || 1) * 100)}%
            </span>
          </div>
          <Slider
            value={[(selectedElement.opacity || 1) * 100]}
            onValueChange={([value]) => handleElementUpdate({ opacity: value / 100 })}
            max={100}
            min={0}
            step={5}
            className="w-full"
          />
        </div>

        {/* Rotation */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Rotation</Label>
            <span className="text-xs text-muted-foreground">{selectedElement.rotation || 0}°</span>
          </div>
          <Slider
            value={[selectedElement.rotation || 0]}
            onValueChange={([value]) => handleElementUpdate({ rotation: value })}
            max={360}
            min={-360}
            step={5}
            className="w-full"
          />
        </div>

        <Separator />

        {/* Layer Controls */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Layer Order</Label>
          <div className="flex gap-2">
            <Button onClick={handleBringToFront} variant="outline" size="sm" className="flex-1">
              Bring to Front
            </Button>
            <Button onClick={handleSendToBack} variant="outline" size="sm" className="flex-1">
              Send to Back
            </Button>
          </div>
        </div>

        {/* Text-specific controls */}
        {selectedElement.type === 'text' && (
          <>
            <Separator />
            <div className="space-y-4">
              <Label className="text-sm font-medium">Text Styling</Label>

              {/* Font Family */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Font Family</Label>
                <Select
                  value={selectedElement.style.fontFamily}
                  onValueChange={(value) => handleStyleUpdate({ fontFamily: value })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Arial">Arial</SelectItem>
                    <SelectItem value="Helvetica">Helvetica</SelectItem>
                    <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                    <SelectItem value="Georgia">Georgia</SelectItem>
                    <SelectItem value="Verdana">Verdana</SelectItem>
                    <SelectItem value="Trebuchet MS">Trebuchet MS</SelectItem>
                    <SelectItem value="Impact">Impact</SelectItem>
                    <SelectItem value="Comic Sans MS">Comic Sans MS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Font Size */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Font Size</Label>
                  <span className="text-xs text-muted-foreground">
                    {selectedElement.style.fontSize}px
                  </span>
                </div>
                <Slider
                  value={[selectedElement.style.fontSize]}
                  onValueChange={([value]) => handleStyleUpdate({ fontSize: value })}
                  max={120}
                  min={8}
                  step={2}
                  className="w-full"
                />
              </div>

              {/* Font Weight */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Font Weight</Label>
                <Select
                  value={selectedElement.style.fontWeight}
                  onValueChange={(value) => handleStyleUpdate({ fontWeight: value as any })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100">100 - Thin</SelectItem>
                    <SelectItem value="200">200 - Extra Light</SelectItem>
                    <SelectItem value="300">300 - Light</SelectItem>
                    <SelectItem value="400">400 - Normal</SelectItem>
                    <SelectItem value="500">500 - Medium</SelectItem>
                    <SelectItem value="600">600 - Semi Bold</SelectItem>
                    <SelectItem value="700">700 - Bold</SelectItem>
                    <SelectItem value="800">800 - Extra Bold</SelectItem>
                    <SelectItem value="900">900 - Black</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="bold">Bold</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Font Style */}
              <div className="flex gap-2">
                <Button
                  onClick={() =>
                    handleStyleUpdate({
                      fontStyle: selectedElement.style.fontStyle === 'italic' ? 'normal' : 'italic'
                    })
                  }
                  variant={selectedElement.style.fontStyle === 'italic' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                >
                  <Italic className="w-4 h-4 mr-1" />
                  Italic
                </Button>
              </div>

              {/* Text Alignment */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Text Alignment</Label>
                <div className="flex gap-1">
                  <Button
                    onClick={() => handleStyleUpdate({ textAlign: 'left' })}
                    variant={selectedElement.style.textAlign === 'left' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                  >
                    <AlignLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleStyleUpdate({ textAlign: 'center' })}
                    variant={selectedElement.style.textAlign === 'center' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                  >
                    <AlignCenter className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleStyleUpdate({ textAlign: 'right' })}
                    variant={selectedElement.style.textAlign === 'right' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1"
                  >
                    <AlignRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Colors */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Text Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={selectedElement.style.color}
                      onChange={(e) => handleStyleUpdate({ color: e.target.value })}
                      className="w-12 h-8 p-1 border rounded"
                    />
                    <Input
                      type="text"
                      value={selectedElement.style.color}
                      onChange={(e) => handleStyleUpdate({ color: e.target.value })}
                      placeholder="#FFFFFF"
                      className="flex-1 h-8"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Background Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={
                        selectedElement.style.backgroundColor === 'transparent'
                          ? '#000000'
                          : selectedElement.style.backgroundColor
                      }
                      onChange={(e) => handleStyleUpdate({ backgroundColor: e.target.value })}
                      className="w-12 h-8 p-1 border rounded"
                    />
                    <Input
                      type="text"
                      value={selectedElement.style.backgroundColor}
                      onChange={(e) => handleStyleUpdate({ backgroundColor: e.target.value })}
                      placeholder="transparent"
                      className="flex-1 h-8"
                    />
                  </div>
                  <Button
                    onClick={() => handleStyleUpdate({ backgroundColor: 'transparent' })}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Make Transparent
                  </Button>
                </div>
              </div>

              {/* Line Height */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Line Height</Label>
                  <span className="text-xs text-muted-foreground">
                    {selectedElement.style.lineHeight}
                  </span>
                </div>
                <Slider
                  value={[selectedElement.style.lineHeight]}
                  onValueChange={([value]) => handleStyleUpdate({ lineHeight: value })}
                  max={3}
                  min={0.5}
                  step={0.1}
                  className="w-full"
                />
              </div>

              {/* Text Shadow */}
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground">Text Shadow</Label>
                <Input
                  type="text"
                  value={selectedElement.style.textShadow}
                  onChange={(e) => handleStyleUpdate({ textShadow: e.target.value })}
                  placeholder="2px 2px 4px rgba(0,0,0,0.8)"
                  className="h-8"
                />
                <div className="grid grid-cols-2 gap-1">
                  <Button
                    onClick={() => handleStyleUpdate({ textShadow: 'none' })}
                    variant="outline"
                    size="sm"
                  >
                    None
                  </Button>
                  <Button
                    onClick={() => handleStyleUpdate({ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' })}
                    variant="outline"
                    size="sm"
                  >
                    Soft
                  </Button>
                  <Button
                    onClick={() => handleStyleUpdate({ textShadow: '3px 3px 6px rgba(0,0,0,0.9)' })}
                    variant="outline"
                    size="sm"
                  >
                    Medium
                  </Button>
                  <Button
                    onClick={() => handleStyleUpdate({ textShadow: '4px 4px 8px rgba(0,0,0,1)' })}
                    variant="outline"
                    size="sm"
                  >
                    Strong
                  </Button>
                  <Button
                    onClick={() => handleStyleUpdate({ textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' })}
                    variant="outline"
                    size="sm"
                  >
                    Outline
                  </Button>
                  <Button
                    onClick={() => handleStyleUpdate({ textShadow: '0 0 10px rgba(255,255,255,0.8)' })}
                    variant="outline"
                    size="sm"
                  >
                    Glow
                  </Button>
                </div>
              </div>

              {/* Text Effects */}
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground">Text Effects</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => {
                      const currentColor = selectedElement.style.color
                      const gradientText = `linear-gradient(45deg, ${currentColor}, #FFD700)`
                      handleStyleUpdate({ 
                        background: gradientText,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      } as any)
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <Palette className="w-4 h-4 mr-1" />
                    Gradient
                  </Button>
                  <Button
                    onClick={() => {
                      handleStyleUpdate({ 
                        background: 'none',
                        WebkitBackgroundClip: 'unset',
                        WebkitTextFillColor: selectedElement.style.color,
                        backgroundClip: 'unset'
                      } as any)
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <Type className="w-4 h-4 mr-1" />
                    Reset
                  </Button>
                </div>
              </div>

              {/* Quick Color Presets */}
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground">Quick Colors</Label>
                <div className="grid grid-cols-6 gap-1">
                  {[
                    '#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
                    '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFC0CB', '#A52A2A'
                  ].map((color) => (
                    <button
                      key={color}
                      onClick={() => handleStyleUpdate({ color })}
                      className="w-8 h-8 rounded border-2 border-gray-300 hover:border-gray-500 transition-colors"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Media-specific controls */}
        {(selectedElement.type === 'image' || selectedElement.type === 'video') && (
          <>
            <Separator />
            <div className="space-y-3">
              <Label className="text-sm font-medium">Media Source</Label>
              <div className="text-xs text-muted-foreground break-all bg-muted p-2 rounded">
                {selectedElement.content.substring(0, 100)}
                {selectedElement.content.length > 100 && '...'}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
