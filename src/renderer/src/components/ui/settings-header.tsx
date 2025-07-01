import React from 'react'
import { Button } from '@renderer/components/ui/button'
import { useToast } from '@renderer/hooks/use-toast'
import { SettingsResetDialog } from './settings-reset-dialog'
import {
  downloadSettingsFile,
  uploadSettingsFile,
  type SettingsExport
} from '@renderer/lib/settings-import-export'
import type { AppSettings, EditorSettings, PresentationSettings } from '@renderer/types/database'
import { Download, Upload } from 'lucide-react'

interface SettingsHeaderProps {
  app: AppSettings
  editor: EditorSettings
  presentation: PresentationSettings
  onImportSettings: (data: SettingsExport) => Promise<void>
  onResetSettings: () => Promise<void>
  isLoading?: boolean
}

export function SettingsHeader({
  app,
  editor,
  presentation,
  onImportSettings,
  onResetSettings,
  isLoading = false
}: SettingsHeaderProps): JSX.Element {
  const { toast } = useToast()
  const [importLoading, setImportLoading] = React.useState(false)

  const handleExport = () => {
    try {
      downloadSettingsFile(app, editor, presentation)
      toast({
        title: 'Settings Exported',
        description: 'Your settings have been downloaded as a JSON file.'
      })
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Failed to export settings',
        variant: 'destructive'
      })
    }
  }

  const handleImport = async () => {
    setImportLoading(true)
    try {
      const result = await uploadSettingsFile()
      
      if (!result.success) {
        toast({
          title: 'Import Failed',
          description: result.message,
          variant: 'destructive'
        })
        return
      }

      if (result.data) {
        await onImportSettings(result.data)
        toast({
          title: 'Settings Imported',
          description: 'Your settings have been successfully imported and applied.'
        })
      }
    } catch (error) {
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'Failed to import settings',
        variant: 'destructive'
      })
    } finally {
      setImportLoading(false)
    }
  }

  const handleReset = async () => {
    try {
      await onResetSettings()
      toast({
        title: 'Settings Reset',
        description: 'All settings have been reset to their default values.'
      })
    } catch (error) {
      toast({
        title: 'Reset Failed',
        description: error instanceof Error ? error.message : 'Failed to reset settings',
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Customize your application preferences and behavior
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={isLoading}
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleImport}
          disabled={isLoading || importLoading}
        >
          <Upload className="h-4 w-4 mr-2" />
          {importLoading ? 'Importing...' : 'Import'}
        </Button>
        
        <SettingsResetDialog
          onConfirm={handleReset}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}