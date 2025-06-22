import React, { useState } from 'react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Slider } from '@renderer/components/ui/slider'
import { Switch } from '@renderer/components/ui/switch'
import { Separator } from '@renderer/components/ui/separator'
import { Popover, PopoverContent, PopoverTrigger } from '@renderer/components/ui/popover'
import {
  useAlignmentStore,
  useGridEnabled,
  useGridSize,
  useGridMode,
  useGridBoxesX,
  useGridBoxesY,
  useGridVisible,
  useGridColor,
  useGridOpacity,
  useSnapToGrid,
  useSnapToElements,
  useSnapToGuides,
  useSnapToCenter,
  useSnapTolerance,
  useShowRulers,
  useShowGuides
} from '@renderer/store/editor-alignment'
import { Grid3X3, Settings, Ruler, Settings2, Eye, EyeOff, Target, Magnet } from 'lucide-react'

interface AlignmentSettingsProps {
  className?: string
}

export const AlignmentSettings: React.FC<AlignmentSettingsProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false)

  // Alignment store actions
  const {
    setGridEnabled,
    setGridSize,
    setGridMode,
    setGridBoxes,
    setGridVisible,
    setGridColor,
    setGridOpacity,
    setSnapToGrid,
    setSnapToElements,
    setSnapToGuides,
    setSnapToCenter,
    setSnapTolerance,
    setShowRulers,
    setShowGuides,
    clearGuides,
    resetToDefaults
  } = useAlignmentStore()

  // Current values using primitive selectors
  const gridEnabled = useGridEnabled()
  const gridSize = useGridSize()
  const gridMode = useGridMode()
  const gridBoxesX = useGridBoxesX()
  const gridBoxesY = useGridBoxesY()
  const gridVisible = useGridVisible()
  const gridColor = useGridColor()
  const gridOpacity = useGridOpacity()
  const snapToGrid = useSnapToGrid()
  const snapToElements = useSnapToElements()
  const snapToGuides = useSnapToGuides()
  const snapToCenter = useSnapToCenter()
  const snapTolerance = useSnapTolerance()
  const showRulers = useShowRulers()
  const showGuides = useShowGuides()

  return (
    <div className={className}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`${
              gridEnabled ? 'bg-orange-600 hover:bg-orange-700 text-white border-orange-600' : ''
            }`}
          >
            <Grid3X3 className="w-4 h-4 mr-2" />
            Grid & Align
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Grid & Alignment Settings</h4>
              <Settings className="w-4 h-4 text-muted-foreground" />
            </div>

            {/* Grid Settings */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Grid3X3 className="w-4 h-4 text-blue-600" />
                <Label className="text-sm font-medium">Grid</Label>
              </div>
              
              <div className="bg-muted/30 p-2 rounded space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Enable</Label>
                  <Switch checked={gridEnabled} onCheckedChange={setGridEnabled} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Visible</Label>
                  <Switch
                    checked={gridVisible}
                    onCheckedChange={setGridVisible}
                    disabled={!gridEnabled}
                  />
                </div>
                
                {gridEnabled && (
                  <>
                    <div className="flex gap-1">
                      <Button
                        variant={gridMode === 'pixel' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setGridMode('pixel')}
                        className="flex-1 text-xs h-7"
                      >
                        Pixel
                      </Button>
                      <Button
                        variant={gridMode === 'boxes' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setGridMode('boxes')}
                        className="flex-1 text-xs h-7"
                      >
                        Boxes
                      </Button>
                    </div>

                    {gridMode === 'pixel' && (
                      <div className="flex items-center gap-2">
                        <Label className="text-xs w-8">Size:</Label>
                        <Slider
                          value={[gridSize]}
                          onValueChange={([value]) => setGridSize(value)}
                          max={100}
                          min={5}
                          step={5}
                          className="flex-1"
                        />
                        <span className="text-xs w-8">{gridSize}px</span>
                      </div>
                    )}

                    {gridMode === 'boxes' && (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={gridBoxesX}
                          onChange={(e) => setGridBoxes(parseInt(e.target.value) || 1, gridBoxesY)}
                          min={1}
                          max={50}
                          className="w-12 h-6 text-xs"
                        />
                        <span className="text-xs">×</span>
                        <Input
                          type="number"
                          value={gridBoxesY}
                          onChange={(e) => setGridBoxes(gridBoxesX, parseInt(e.target.value) || 1)}
                          min={1}
                          max={50}
                          className="w-12 h-6 text-xs"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Snap Settings */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Magnet className="w-4 h-4 text-green-600" />
                <Label className="text-sm font-medium">Snap To</Label>
              </div>
              
              <div className="bg-muted/30 p-2 rounded grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Grid</Label>
                  <Switch
                    checked={snapToGrid}
                    onCheckedChange={setSnapToGrid}
                    disabled={!gridEnabled}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Elements</Label>
                  <Switch checked={snapToElements} onCheckedChange={setSnapToElements} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Guides</Label>
                  <Switch checked={snapToGuides} onCheckedChange={setSnapToGuides} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Center</Label>
                  <Switch checked={snapToCenter} onCheckedChange={setSnapToCenter} />
                </div>
                
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs w-16">Tolerance:</Label>
                    <Slider
                      value={[snapTolerance]}
                      onValueChange={([value]) => setSnapTolerance(value)}
                      max={50}
                      min={1}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-xs w-8 text-right">{snapTolerance}px</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Display Settings */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-600" />
                <Label className="text-sm font-medium">Display</Label>
              </div>
              
              <div className="bg-muted/30 p-2 rounded space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Ruler className="w-3 h-3" />
                    <Label className="text-xs">Rulers</Label>
                  </div>
                  <Switch checked={showRulers} onCheckedChange={setShowRulers} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-3 h-3" />
                    <Label className="text-xs">Guides</Label>
                  </div>
                  <Switch checked={showGuides} onCheckedChange={setShowGuides} />
                </div>
                <Button onClick={clearGuides} variant="outline" size="sm" className="w-full h-6 text-xs">
                  Clear Guides
                </Button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setGridEnabled(true)
                  setGridVisible(true)
                  setSnapToGrid(true)
                  setSnapToElements(true)
                  setSnapToGuides(true)
                  setSnapToCenter(true)
                }}
                variant="outline"
                size="sm"
                className="flex-1 h-7 text-xs"
              >
                Enable All
              </Button>
              <Button
                onClick={() => {
                  setGridEnabled(false)
                  setGridVisible(false)
                  setSnapToGrid(false)
                  setSnapToElements(false)
                  setSnapToGuides(false)
                  setSnapToCenter(false)
                }}
                variant="outline"
                size="sm"
                className="flex-1 h-7 text-xs"
              >
                Disable All
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
