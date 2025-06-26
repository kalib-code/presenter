import React from 'react'
import { useAutoSaveSettings } from '@renderer/store/settings'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Switch } from '@renderer/components/ui/switch'
import { Separator } from '@renderer/components/ui/separator'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@renderer/components/ui/card'

export default function Settings(): JSX.Element {
  const { autoSave, autoSaveInterval, setAutoSave, setAutoSaveInterval } = useAutoSaveSettings()

  const handleAutoSaveToggle = async (enabled: boolean) => {
    await setAutoSave(enabled)
  }

  const handleIntervalChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10)
    if (!isNaN(value) && value > 0) {
      await setAutoSaveInterval(value * 1000) // Convert seconds to milliseconds
    }
  }

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-3xl font-semibold mb-6">Settings</h1>

      <div className="space-y-6">
        {/* Auto-save Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Auto-save</CardTitle>
            <CardDescription>
              Automatically save your work while editing songs and presentations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="autosave-toggle">Enable auto-save</Label>
                <div className="text-sm text-muted-foreground">
                  Automatically save changes as you work
                </div>
              </div>
              <Switch
                id="autosave-toggle"
                checked={autoSave}
                onCheckedChange={handleAutoSaveToggle}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="autosave-interval">Auto-save interval (seconds)</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="autosave-interval"
                  type="number"
                  value={Math.round(autoSaveInterval / 1000)}
                  onChange={handleIntervalChange}
                  disabled={!autoSave}
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
              <span className={autoSave ? 'text-green-600' : 'text-red-600'}>
                {autoSave ? 'Auto-save enabled' : 'Auto-save disabled'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Future Settings Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Editor</CardTitle>
            <CardDescription>Editor appearance and behavior settings</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Editor settings will be available soon.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Presentation</CardTitle>
            <CardDescription>Default presentation and display settings</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Presentation settings will be available soon.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Media</CardTitle>
            <CardDescription>Media library and file management settings</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Media settings will be available soon.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
