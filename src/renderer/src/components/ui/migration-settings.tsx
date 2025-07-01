import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Switch } from './switch'
import { Button } from './button'
import { Badge } from './badge'
import { Separator } from './separator'
import { usePersistenceStore } from '@renderer/store/editor-persistence'

export const MigrationSettings: React.FC = () => {
  const { migrationEnabled, useLegacyFormat, enableMigration, disableMigration, setLegacyFormat } =
    usePersistenceStore()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Database Optimization
          <Badge variant={migrationEnabled ? 'default' : 'secondary'}>
            {migrationEnabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </CardTitle>
        <CardDescription>
          Optimize database storage by reducing redundant data and improving performance.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Migration Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-sm font-medium">Enable Migration</h4>
            <p className="text-sm text-muted-foreground">
              Apply optimizations when saving songs and presentations
            </p>
          </div>
          <Switch
            checked={migrationEnabled}
            onCheckedChange={(checked) => (checked ? enableMigration() : disableMigration())}
          />
        </div>

        <Separator />

        {/* Format Selection */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Storage Format</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Optimized Format</span>
                  <Badge variant="outline" className="text-xs">
                    Recommended
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Uses style presets and background inheritance to reduce file size
                </p>
              </div>
              <Switch
                checked={!useLegacyFormat}
                onCheckedChange={(checked) => setLegacyFormat(!checked)}
                disabled={!migrationEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Legacy Format</span>
                  <Badge variant="secondary" className="text-xs">
                    Compatibility
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Maintains full compatibility with existing data structure
                </p>
              </div>
              <Switch
                checked={useLegacyFormat}
                onCheckedChange={setLegacyFormat}
                disabled={!migrationEnabled}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Benefits */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Optimization Benefits</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Reduced file sizes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Faster loading times</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Style consistency</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span>Background inheritance</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span>Computed properties</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span>Better organization</span>
              </div>
            </div>
          </div>
        </div>

        {/* Migration Actions */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Migration Actions</h4>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!migrationEnabled}
              onClick={() => {
                // TODO: Implement bulk migration
                console.log('Bulk migration not yet implemented')
              }}
            >
              Migrate All Existing Data
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Reset to defaults
                enableMigration()
                setLegacyFormat(false)
              }}
            >
              Reset to Defaults
            </Button>
          </div>
        </div>

        {/* Warning */}
        {migrationEnabled && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Note:</strong> Migration is applied automatically when saving. Existing data
              remains unchanged until next save.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
