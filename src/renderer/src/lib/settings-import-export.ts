import type { AppSettings, EditorSettings, PresentationSettings } from '@renderer/types/database'
import { validateAppSettings, validateEditorSettings, validatePresentationSettings } from './settings-validation'

export interface SettingsExport {
  version: string
  exportedAt: string
  app: AppSettings
  editor: EditorSettings
  presentation: PresentationSettings
}

export interface ImportResult {
  success: boolean
  message: string
  errors?: string[]
}

const SETTINGS_EXPORT_VERSION = '1.0'

// Export settings to JSON
export function exportSettings(
  app: AppSettings,
  editor: EditorSettings,
  presentation: PresentationSettings
): string {
  const exportData: SettingsExport = {
    version: SETTINGS_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    app,
    editor,
    presentation
  }

  return JSON.stringify(exportData, null, 2)
}

// Download settings as JSON file
export function downloadSettingsFile(
  app: AppSettings,
  editor: EditorSettings,
  presentation: PresentationSettings,
  filename = 'presenter-settings.json'
): void {
  const jsonData = exportSettings(app, editor, presentation)
  const blob = new Blob([jsonData], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

// Validate imported settings structure
function validateImportStructure(data: unknown): data is SettingsExport {
  if (typeof data !== 'object' || data === null) {
    return false
  }

  const obj = data as Record<string, unknown>
  
  return (
    typeof obj.version === 'string' &&
    typeof obj.exportedAt === 'string' &&
    typeof obj.app === 'object' &&
    typeof obj.editor === 'object' &&
    typeof obj.presentation === 'object' &&
    obj.app !== null &&
    obj.editor !== null &&
    obj.presentation !== null
  )
}

// Parse and validate imported settings
export function parseImportedSettings(jsonString: string): ImportResult {
  try {
    const data = JSON.parse(jsonString)
    
    if (!validateImportStructure(data)) {
      return {
        success: false,
        message: 'Invalid settings file format'
      }
    }

    // Check version compatibility
    if (data.version !== SETTINGS_EXPORT_VERSION) {
      return {
        success: false,
        message: `Unsupported settings version: ${data.version}. Expected: ${SETTINGS_EXPORT_VERSION}`
      }
    }

    // Validate each settings category
    const errors: string[] = []
    
    const appErrors = validateAppSettings(data.app as Partial<AppSettings>)
    if (appErrors.length > 0) {
      errors.push(...appErrors.map(e => `App settings - ${e.message}`))
    }

    const editorErrors = validateEditorSettings(data.editor as Partial<EditorSettings>)
    if (editorErrors.length > 0) {
      errors.push(...editorErrors.map(e => `Editor settings - ${e.message}`))
    }

    const presentationErrors = validatePresentationSettings(data.presentation as Partial<PresentationSettings>)
    if (presentationErrors.length > 0) {
      errors.push(...presentationErrors.map(e => `Presentation settings - ${e.message}`))
    }

    if (errors.length > 0) {
      return {
        success: false,
        message: 'Settings validation failed',
        errors
      }
    }

    return {
      success: true,
      message: 'Settings imported successfully'
    }

  } catch (error) {
    return {
      success: false,
      message: `Failed to parse settings file: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// Import settings from JSON string
export function importSettings(jsonString: string): { success: boolean; data?: SettingsExport; message: string; errors?: string[] } {
  const result = parseImportedSettings(jsonString)
  
  if (!result.success) {
    return result
  }

  try {
    const data = JSON.parse(jsonString) as SettingsExport
    return {
      success: true,
      data,
      message: 'Settings imported successfully'
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to parse settings: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// Upload and parse settings file
export function uploadSettingsFile(): Promise<{ success: boolean; data?: SettingsExport; message: string; errors?: string[] }> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (!file) {
        resolve({
          success: false,
          message: 'No file selected'
        })
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        const result = importSettings(content)
        resolve(result)
      }
      
      reader.onerror = () => {
        resolve({
          success: false,
          message: 'Failed to read file'
        })
      }
      
      reader.readAsText(file)
    }
    
    input.oncancel = () => {
      resolve({
        success: false,
        message: 'File selection cancelled'
      })
    }
    
    input.click()
  })
}