import React, { useState } from 'react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Slider } from '@renderer/components/ui/slider'
import { Switch } from '@renderer/components/ui/switch'
import { Separator } from '@renderer/components/ui/separator'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@renderer/components/ui/popover'
import {
  useAlignmentStore,
  useGridEnabled,
  useGridSize,
  useGridVisible,
  useGridColor,
  useGridOpacity,
  useSnapToGrid,
  useSnapToElements,
  useSnapToGuides,
  useSnapTolerance,
  useShowRulers
} from '@renderer/store/editor-alignment'
import { Grid3X3, Settings, Ruler } from 'lucide-react'

interface AlignmentSettingsProps {
  className?: string
}

export const AlignmentSettings: React.FC<AlignmentSettingsProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false)

  // Alignment store actions
  const {
    setGridEnabled,
    setGridSize,
    setGridVisible,
    setGridColor,
    setGridOpacity,
    setSnapToGrid,
    setSnapToElements,
    setSnapToGuides,
    setSnapTolerance,
    setShowRulers
  } = useAlignmentStore()

  // Current values using primitive selectors
  const gridEnabled = useGridEnabled()
  const gridSize = useGridSize()
  const gridVisible = useGridVisible()
  const gridColor = useGridColor()
  const gridOpacity = useGridOpacity()
  const snapToGrid = useSnapToGrid()
  const snapToElements = useSnapToElements()
  const snapToGuides = useSnapToGuides()
  const snapTolerance = useSnapTolerance()
  const showRulers = useShowRulers()

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
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Grid & Alignment Settings</h4>
              <Settings className="w-4 h-4 text-muted-foreground" />
            </div>

            <Separator />

            {/* Grid Settings */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Grid</Label>
              
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Enable Grid</Label>
                <Switch
                  checked={gridEnabled}
                  onCheckedChange={setGridEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Show Grid</Label>
                <Switch
                  checked={gridVisible}
                  onCheckedChange={setGridVisible}
                  disabled={!gridEnabled}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Grid Size</Label>
                  <span className="text-xs text-muted-foreground">{gridSize}px</span>
                </div>
                <Slider
                  value={[gridSize]}
                  onValueChange={([value]) => setGridSize(value)}
                  max={100}
                  min={5}
                  step={5}
                  disabled={!gridEnabled}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Grid Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={gridColor}
                    onChange={(e) => setGridColor(e.target.value)}
                    disabled={!gridEnabled}
                    className="w-12 h-8 p-1 border rounded"
                  />
                  <Input
                    type="text"
                    value={gridColor}
                    onChange={(e) => setGridColor(e.target.value)}
                    disabled={!gridEnabled}
                    placeholder="#E5E7EB"
                    className="flex-1 h-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Grid Opacity</Label>
                  <span className="text-xs text-muted-foreground">{Math.round(gridOpacity * 100)}%</span>
                </div>
                <Slider
                  value={[gridOpacity * 100]}
                  onValueChange={([value]) => setGridOpacity(value / 100)}
                  max={100}
                  min={10}
                  step={10}
                  disabled={!gridEnabled}
                  className="w-full"
                />
              </div>
            </div>

            <Separator />

            {/* Snap Settings */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Snap to</Label>
              
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Grid</Label>
                <Switch
                  checked={snapToGrid}
                  onCheckedChange={setSnapToGrid}
                  disabled={!gridEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Elements</Label>
                <Switch
                  checked={snapToElements}
                  onCheckedChange={setSnapToElements}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Guides</Label>
                <Switch
                  checked={snapToGuides}
                  onCheckedChange={setSnapToGuides}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Snap Tolerance</Label>
                  <span className="text-xs text-muted-foreground">{snapTolerance}px</span>
                </div>
                <Slider
                  value={[snapTolerance]}
                  onValueChange={([value]) => setSnapTolerance(value)}
                  max={50}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>

            <Separator />

            {/* Rulers */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Display</Label>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Ruler className="w-4 h-4" />
                  <Label className="text-xs text-muted-foreground">Show Rulers</Label>
                </div>
                <Switch
                  checked={showRulers}
                  onCheckedChange={setShowRulers}
                />
              </div>
            </div>

            <Separator />

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setGridEnabled(true)
                  setGridVisible(true)
                  setSnapToGrid(true)
                }}
                variant="outline"
                size="sm"
                className="flex-1"
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
                }}
                variant="outline"
                size="sm"
                className="flex-1"
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