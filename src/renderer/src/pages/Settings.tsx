import React from 'react'
import { useSettingsStore } from '@renderer/store/settings'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Switch } from '@renderer/components/ui/switch'
import { Separator } from '@renderer/components/ui/separator'
import { Button } from '@renderer/components/ui/button'
import { Slider } from '@renderer/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@renderer/components/ui/card'
// import { SettingsHeader } from '@renderer/components/ui/settings-header'
// import type { SettingsExport } from '@renderer/lib/settings-import-export'

export default function Settings(): JSX.Element {
  const {
    app,
    editor,
    presentation,
    isLoaded,
    setTheme,
    setLanguage,
    setAutoSave,
    setAutoSaveInterval,
    setDefaultTemplate,
    setMediaLibraryPath,
    setDefaultFont,
    setDefaultFontSize,
    setGridSnap,
    setGridSize,
    setShowRulers,
    setShowGuides,
    setZoomLevel,
    setDefaultTransition,
    setDefaultDuration,
    setAutoAdvance,
    setShowNotes,
    setStageDisplay,
    resetToDefaults,
    saveAllAppSettings,
    saveAllEditorSettings,
    saveAllPresentationSettings
  } = useSettingsStore()

  // Debug logging
  React.useEffect(() => {
    console.log('🔧 [SETTINGS_PAGE] Settings loaded:', {
      app: {
        theme: app?.theme,
        language: app?.language,
        autoSave: app?.autoSave,
        autoSaveInterval: app?.autoSaveInterval
      },
      editor: {
        defaultFont: editor?.defaultFont,
        defaultFontSize: editor?.defaultFontSize,
        gridSnap: editor?.gridSnap
      },
      presentation: {
        defaultTransition: presentation?.defaultTransition,
        autoAdvance: presentation?.autoAdvance
      },
      isLoaded
    })
  }, [app, editor, presentation, isLoaded])

  const handleAutoSaveToggle = async (enabled: boolean) => {
    console.log('🔧 [SETTINGS] AutoSave toggle clicked:', enabled)
    try {
      await setAutoSave(enabled)
      console.log('🔧 [SETTINGS] AutoSave updated successfully')
    } catch (error) {
      console.error('❌ [SETTINGS] Failed to update autoSave:', error)
    }
  }

  const handleIntervalChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10)
    console.log('🔧 [SETTINGS] Interval change:', value)
    if (!isNaN(value) && value > 0) {
      try {
        await setAutoSaveInterval(value * 1000) // Convert seconds to milliseconds
        console.log('🔧 [SETTINGS] Interval updated successfully')
      } catch (error) {
        console.error('❌ [SETTINGS] Failed to update interval:', error)
      }
    }
  }

  const handleMediaPathSelect = async () => {
    // TODO: Implement file dialog for media path selection
    console.log('Media path selection not yet implemented')
  }

  const handleFontSizeChange = async (value: number[]) => {
    console.log('🔧 [SETTINGS] Font size change:', value[0])
    try {
      await setDefaultFontSize(value[0])
      console.log('🔧 [SETTINGS] Font size updated successfully')
    } catch (error) {
      console.error('❌ [SETTINGS] Failed to update font size:', error)
    }
  }

  const handleGridSizeChange = async (value: number[]) => {
    console.log('🔧 [SETTINGS] Grid size change:', value[0])
    try {
      await setGridSize(value[0])
      console.log('🔧 [SETTINGS] Grid size updated successfully')
    } catch (error) {
      console.error('❌ [SETTINGS] Failed to update grid size:', error)
    }
  }

  const handleZoomChange = async (value: number[]) => {
    console.log('🔧 [SETTINGS] Zoom change:', value[0])
    try {
      await setZoomLevel(value[0] / 100) // Convert percentage to decimal
      console.log('🔧 [SETTINGS] Zoom updated successfully')
    } catch (error) {
      console.error('❌ [SETTINGS] Failed to update zoom:', error)
    }
  }

  const handleDurationChange = async (value: number[]) => {
    console.log('🔧 [SETTINGS] Duration change:', value[0])
    try {
      await setDefaultDuration(value[0])
      console.log('🔧 [SETTINGS] Duration updated successfully')
    } catch (error) {
      console.error('❌ [SETTINGS] Failed to update duration:', error)
    }
  }

  // const handleImportSettings = async (data: SettingsExport) => {
  //   // Import all settings from the data
  //   await saveAllAppSettings(data.app)
  //   await saveAllEditorSettings(data.editor)
  //   await saveAllPresentationSettings(data.presentation)
  // }

  const handleResetSettings = async () => {
    console.log('🔧 [SETTINGS] Reset clicked')
    try {
      await resetToDefaults()
      console.log('🔧 [SETTINGS] Reset completed successfully')
    } catch (error) {
      console.error('❌ [SETTINGS] Failed to reset settings:', error)
    }
  }

  // Show loading state if settings aren't loaded yet
  if (!isLoaded) {
    return (
      <div className="p-6 max-w-4xl">
        <h1 className="text-3xl font-semibold mb-6">Settings</h1>
        <div className="text-center py-8">
          <div className="text-muted-foreground">Loading settings...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Customize your application preferences and behavior
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleResetSettings}>
            Reset to Defaults
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* App Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Application</CardTitle>
            <CardDescription>
              General application preferences and behavior
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Theme Settings */}
            <div className="space-y-2">
              <Label htmlFor="theme-select">Theme</Label>
              <Select 
                value={app.theme} 
                onValueChange={(value) => {
                  console.log('🔧 [SETTINGS] Theme change:', value)
                  setTheme(value as 'light' | 'dark' | 'system')
                }}
              >
                <SelectTrigger id="theme-select" className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-sm text-muted-foreground">
                Choose your preferred theme or use system setting
              </div>
            </div>

            <Separator />

            {/* Language Settings */}
            <div className="space-y-2">
              <Label htmlFor="language-select">Language</Label>
              <Select 
                value={app.language} 
                onValueChange={(value) => {
                  console.log('🔧 [SETTINGS] Language change:', value)
                  setLanguage(value)
                }}
              >
                <SelectTrigger id="language-select" className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-sm text-muted-foreground">
                Application language (requires restart)
              </div>
            </div>

            <Separator />

            {/* Auto-save Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autosave-toggle">Enable auto-save</Label>
                  <div className="text-sm text-muted-foreground">
                    Automatically save changes as you work
                  </div>
                </div>
                <Switch
                  id="autosave-toggle"
                  checked={app.autoSave}
                  onCheckedChange={handleAutoSaveToggle}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="autosave-interval">Auto-save interval (seconds)</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="autosave-interval"
                    type="number"
                    value={Math.round(app.autoSaveInterval / 1000)}
                    onChange={handleIntervalChange}
                    disabled={!app.autoSave}
                    min="5"
                    max="300"
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">
                    How often to auto-save (5-300 seconds)
                  </span>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                Current status:{' '}
                <span className={app.autoSave ? 'text-green-600' : 'text-red-600'}>
                  {app.autoSave ? 'Auto-save enabled' : 'Auto-save disabled'}
                </span>
              </div>
            </div>

            <Separator />

            {/* Default Template */}
            <div className="space-y-2">
              <Label htmlFor="template-select">Default Template</Label>
              <Select value={app.defaultTemplate} onValueChange={setDefaultTemplate}>
                <SelectTrigger id="template-select" className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="modern">Modern</SelectItem>
                  <SelectItem value="classic">Classic</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-sm text-muted-foreground">
                Template used when creating new presentations
              </div>
            </div>

            <Separator />

            {/* Media Library Path */}
            <div className="space-y-2">
              <Label htmlFor="media-path">Media Library Path</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="media-path"
                  value={app.mediaLibraryPath || 'Default location'}
                  readOnly
                  className="flex-1"
                />
                <Button onClick={handleMediaPathSelect} variant="outline">
                  Browse
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                Location where media files are stored and organized
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Editor Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Editor</CardTitle>
            <CardDescription>Editor appearance and behavior settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Font Settings */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="font-select">Default Font</Label>
                <Select value={editor.defaultFont} onValueChange={setDefaultFont}>
                  <SelectTrigger id="font-select" className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Arial">Arial</SelectItem>
                    <SelectItem value="Helvetica">Helvetica</SelectItem>
                    <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                    <SelectItem value="Georgia">Georgia</SelectItem>
                    <SelectItem value="Verdana">Verdana</SelectItem>
                    <SelectItem value="Trebuchet MS">Trebuchet MS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="font-size">Default Font Size: {editor.defaultFontSize}px</Label>
                <Slider
                  id="font-size"
                  value={[editor.defaultFontSize]}
                  onValueChange={handleFontSizeChange}
                  min={12}
                  max={72}
                  step={2}
                  className="w-64"
                />
              </div>
            </div>

            <Separator />

            {/* Grid Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="grid-snap">Snap to Grid</Label>
                  <div className="text-sm text-muted-foreground">
                    Automatically align objects to grid
                  </div>
                </div>
                <Switch
                  id="grid-snap"
                  checked={editor.gridSnap}
                  onCheckedChange={setGridSnap}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="grid-size">Grid Size: {editor.gridSize}px</Label>
                <Slider
                  id="grid-size"
                  value={[editor.gridSize]}
                  onValueChange={handleGridSizeChange}
                  min={5}
                  max={50}
                  step={5}
                  className="w-64"
                />
              </div>
            </div>

            <Separator />

            {/* Guides and Rulers */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-rulers">Show Rulers</Label>
                  <div className="text-sm text-muted-foreground">
                    Display rulers around the editor canvas
                  </div>
                </div>
                <Switch
                  id="show-rulers"
                  checked={editor.showRulers}
                  onCheckedChange={setShowRulers}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-guides">Show Guides</Label>
                  <div className="text-sm text-muted-foreground">
                    Display alignment guides when moving objects
                  </div>
                </div>
                <Switch
                  id="show-guides"
                  checked={editor.showGuides}
                  onCheckedChange={setShowGuides}
                />
              </div>
            </div>

            <Separator />

            {/* Zoom Settings */}
            <div className="space-y-2">
              <Label htmlFor="zoom-level">Default Zoom: {Math.round(editor.zoomLevel * 100)}%</Label>
              <Slider
                id="zoom-level"
                value={[Math.round(editor.zoomLevel * 100)]}
                onValueChange={handleZoomChange}
                min={25}
                max={200}
                step={25}
                className="w-64"
              />
            </div>
          </CardContent>
        </Card>

        {/* Presentation Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Presentation</CardTitle>
            <CardDescription>Default presentation and display settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Transition Settings */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="transition-select">Default Transition</Label>
                <Select value={presentation.defaultTransition} onValueChange={setDefaultTransition}>
                  <SelectTrigger id="transition-select" className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="fade">Fade</SelectItem>
                    <SelectItem value="slide">Slide</SelectItem>
                    <SelectItem value="zoom">Zoom</SelectItem>
                    <SelectItem value="flip">Flip</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Transition Duration: {presentation.defaultDuration}ms</Label>
                <Slider
                  id="duration"
                  value={[presentation.defaultDuration]}
                  onValueChange={handleDurationChange}
                  min={100}
                  max={2000}
                  step={100}
                  className="w-64"
                />
              </div>
            </div>

            <Separator />

            {/* Auto-advance Settings */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-advance">Auto-advance Slides</Label>
                <div className="text-sm text-muted-foreground">
                  Automatically advance to next slide after transition
                </div>
              </div>
              <Switch
                id="auto-advance"
                checked={presentation.autoAdvance}
                onCheckedChange={setAutoAdvance}
              />
            </div>

            <Separator />

            {/* Display Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-notes">Show Presenter Notes</Label>
                  <div className="text-sm text-muted-foreground">
                    Display presenter notes during presentation
                  </div>
                </div>
                <Switch
                  id="show-notes"
                  checked={presentation.showNotes}
                  onCheckedChange={setShowNotes}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="stage-display">Enable Stage Display</Label>
                  <div className="text-sm text-muted-foreground">
                    Show additional information on stage display
                  </div>
                </div>
                <Switch
                  id="stage-display"
                  checked={presentation.stageDisplay}
                  onCheckedChange={setStageDisplay}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
