import React, { useCallback, useState, useEffect } from 'react'
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
  Type,
  Upload
} from 'lucide-react'
import { CustomFontManager } from '@renderer/components/ui/custom-font-manager'
import {
  getCustomFonts,
  loadAllCustomFonts,
  createCustomFontStack,
  type CustomFont
} from '@renderer/utils/fontUtils'

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

  // Custom fonts state
  const [customFonts, setCustomFonts] = useState<CustomFont[]>([])

  // Load custom fonts on component mount
  useEffect(() => {
    loadCustomFonts()
  }, [])

  const loadCustomFonts = async (): Promise<void> => {
    try {
      const fonts = await getCustomFonts()
      setCustomFonts(fonts)

      // Load fonts into CSS
      await loadAllCustomFonts()
    } catch (error) {
      console.error('Failed to load custom fonts:', error)
    }
  }

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

      <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
        {/* Text-specific controls - MOVED TO TOP */}
        {selectedElement.type === 'text' && (
          <>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-blue-600" />
                <Label className="text-sm font-medium">Text</Label>
              </div>

              {/* Font Selection - Most Important First */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Font</Label>
                  <CustomFontManager
                    onFontSelected={(fontName) => {
                      if (selectedElement) {
                        const fontStack = createCustomFontStack(fontName)
                        handleStyleUpdate({ fontFamily: fontStack })
                        loadCustomFonts()
                      }
                    }}
                    trigger={
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                        <Upload className="w-3 h-3 mr-1" />
                        Add
                      </Button>
                    }
                  />
                </div>
                <Select
                  value={selectedElement.style.fontFamily}
                  onValueChange={(value) => handleStyleUpdate({ fontFamily: value })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {customFonts.length > 0 && (
                      <>
                        <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                          Custom
                        </div>
                        {customFonts.map((font, index) => (
                          <SelectItem
                            key={`${font.id}-${index}`}
                            value={createCustomFontStack(font.name)}
                            style={{ fontFamily: font.name }}
                          >
                            {font.name}
                          </SelectItem>
                        ))}
                        <div className="border-t border-border my-1" />
                      </>
                    )}
                    <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                      Popular
                    </div>
                    <SelectItem value="Arial">Arial</SelectItem>
                    <SelectItem value="Helvetica">Helvetica</SelectItem>
                    <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                    <SelectItem value="Georgia">Georgia</SelectItem>
                    <SelectItem value="Verdana">Verdana</SelectItem>
                    <SelectItem value="Impact">Impact</SelectItem>
                    <div className="border-t border-border my-1" />
                    <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                      System
                    </div>
                    <SelectItem value="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif">
                      Default Sans
                    </SelectItem>
                    <SelectItem value="'New York', 'Times New Roman', Times, 'Droid Serif', 'Source Serif Pro', serif">
                      Default Serif
                    </SelectItem>
                    <SelectItem value="'SF Mono', Monaco, Menlo, Consolas, 'Liberation Mono', 'Courier New', monospace">
                      Default Mono
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Size & Weight - Second Most Important */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Size</Label>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={selectedElement.style.fontSize}
                      onChange={(e) =>
                        handleStyleUpdate({ fontSize: parseInt(e.target.value) || 16 })
                      }
                      className="h-8 text-center"
                      min={8}
                      max={120}
                    />
                    <span className="text-xs text-muted-foreground">px</span>
                  </div>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Weight & Style</Label>
                  <div className="flex gap-1">
                    <Select
                      value={selectedElement.style.fontWeight}
                      onValueChange={(value) => handleStyleUpdate({ fontWeight: value as any })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="300">Light</SelectItem>
                        <SelectItem value="400">Regular</SelectItem>
                        <SelectItem value="500">Medium</SelectItem>
                        <SelectItem value="600">Semi Bold</SelectItem>
                        <SelectItem value="700">Bold</SelectItem>
                        <SelectItem value="800">Extra Bold</SelectItem>
                        <SelectItem value="900">Black</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() =>
                        handleStyleUpdate({
                          fontStyle:
                            selectedElement.style.fontStyle === 'italic' ? 'normal' : 'italic'
                        })
                      }
                      variant={selectedElement.style.fontStyle === 'italic' ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 px-3"
                    >
                      <Italic className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Colors - Third Most Important */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Colors</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Text</Label>
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
                        placeholder="#000000"
                        className="flex-1 h-8 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Background</Label>
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
                      <Button
                        onClick={() => handleStyleUpdate({ backgroundColor: 'transparent' })}
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs"
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Quick Color Swatches */}
                <div className="grid grid-cols-8 gap-1">
                  {[
                    '#FFFFFF',
                    '#000000',
                    '#FF0000',
                    '#00FF00',
                    '#0000FF',
                    '#FFFF00',
                    '#FF00FF',
                    '#00FFFF'
                  ].map((color) => (
                    <button
                      key={color}
                      onClick={() => handleStyleUpdate({ color })}
                      className="w-6 h-6 rounded border-2 border-gray-300 hover:border-gray-500 transition-colors"
                      style={{ backgroundColor: color }}
                      title={`Set text color to ${color}`}
                    />
                  ))}
                </div>
              </div>

              {/* Alignment */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Alignment</Label>
                <div className="flex gap-1">
                  <Button
                    onClick={() => handleStyleUpdate({ textAlign: 'left' })}
                    variant={selectedElement.style.textAlign === 'left' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 h-8"
                  >
                    <AlignLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleStyleUpdate({ textAlign: 'center' })}
                    variant={selectedElement.style.textAlign === 'center' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 h-8"
                  >
                    <AlignCenter className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleStyleUpdate({ textAlign: 'right' })}
                    variant={selectedElement.style.textAlign === 'right' ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 h-8"
                  >
                    <AlignRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Advanced Text Options - Collapsible */}
              <details className="group">
                <summary className="cursor-pointer list-none">
                  <div className="flex items-center justify-between py-2 hover:bg-muted/50 rounded px-2 -mx-2">
                    <Label className="text-xs font-medium">Advanced</Label>
                    <div className="transition-transform group-open:rotate-90">
                      <AlignRight className="w-3 h-3" />
                    </div>
                  </div>
                </summary>

                <div className="space-y-3 mt-2">
                  {/* Line Height */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
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

                  {/* Text Effects */}
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">Effects</Label>
                    <div className="grid grid-cols-2 gap-1">
                      <Button
                        onClick={() => handleStyleUpdate({ textShadow: 'none' })}
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                      >
                        No Shadow
                      </Button>
                      <Button
                        onClick={() =>
                          handleStyleUpdate({ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' })
                        }
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                      >
                        Drop Shadow
                      </Button>
                      <Button
                        onClick={() =>
                          handleStyleUpdate({
                            textShadow:
                              '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000'
                          })
                        }
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                      >
                        Outline
                      </Button>
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
                        className="h-7 text-xs"
                      >
                        Gradient
                      </Button>
                    </div>
                  </div>
                </div>
              </details>
            </div>

            <Separator />
          </>
        )}

        {/* Position & Size - Moved below text controls */}
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

        {/* Opacity & Rotation */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Rotation</Label>
              <span className="text-xs text-muted-foreground">
                {selectedElement.rotation || 0}°
              </span>
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
        </div>

        {/* Layer Controls */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Layer Order</Label>
          <div className="flex gap-2">
            <Button onClick={handleBringToFront} variant="outline" size="sm" className="flex-1 h-8">
              Bring to Front
            </Button>
            <Button onClick={handleSendToBack} variant="outline" size="sm" className="flex-1 h-8">
              Send to Back
            </Button>
          </div>
        </div>

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
