import type { AppSettings, EditorSettings, PresentationSettings } from '@renderer/types/database'

export interface ValidationResult {
  isValid: boolean
  error?: string
}

export interface ValidationError {
  field: string
  message: string
}

// App Settings Validation
export function validateTheme(theme: string): ValidationResult {
  const validThemes = ['light', 'dark', 'system']
  if (!validThemes.includes(theme)) {
    return { isValid: false, error: 'Theme must be one of: light, dark, system' }
  }
  return { isValid: true }
}

export function validateLanguage(language: string): ValidationResult {
  const validLanguages = ['en', 'es', 'fr', 'de']
  if (!validLanguages.includes(language)) {
    return { isValid: false, error: 'Language must be one of: en, es, fr, de' }
  }
  return { isValid: true }
}

export function validateAutoSaveInterval(interval: number): ValidationResult {
  if (typeof interval !== 'number' || interval < 5000 || interval > 300000) {
    return { isValid: false, error: 'Auto-save interval must be between 5 and 300 seconds' }
  }
  return { isValid: true }
}

export function validateDefaultTemplate(template: string): ValidationResult {
  const validTemplates = ['default', 'minimal', 'modern', 'classic']
  if (!validTemplates.includes(template)) {
    return { isValid: false, error: 'Template must be one of: default, minimal, modern, classic' }
  }
  return { isValid: true }
}

export function validateMediaLibraryPath(path: string): ValidationResult {
  // Basic path validation - could be enhanced with actual file system checks
  if (path && path.length > 500) {
    return { isValid: false, error: 'Media library path is too long' }
  }
  return { isValid: true }
}

// Editor Settings Validation
export function validateDefaultFont(font: string): ValidationResult {
  const validFonts = ['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana', 'Trebuchet MS']
  if (!validFonts.includes(font)) {
    return { isValid: false, error: 'Font must be one of the supported fonts' }
  }
  return { isValid: true }
}

export function validateDefaultFontSize(size: number): ValidationResult {
  if (typeof size !== 'number' || size < 12 || size > 72) {
    return { isValid: false, error: 'Font size must be between 12 and 72 pixels' }
  }
  return { isValid: true }
}

export function validateGridSize(size: number): ValidationResult {
  if (typeof size !== 'number' || size < 5 || size > 50) {
    return { isValid: false, error: 'Grid size must be between 5 and 50 pixels' }
  }
  return { isValid: true }
}

export function validateZoomLevel(level: number): ValidationResult {
  if (typeof level !== 'number' || level < 0.25 || level > 2.0) {
    return { isValid: false, error: 'Zoom level must be between 25% and 200%' }
  }
  return { isValid: true }
}

// Presentation Settings Validation
export function validateDefaultTransition(transition: string): ValidationResult {
  const validTransitions = ['none', 'fade', 'slide', 'zoom', 'flip']
  if (!validTransitions.includes(transition)) {
    return { isValid: false, error: 'Transition must be one of: none, fade, slide, zoom, flip' }
  }
  return { isValid: true }
}

export function validateDefaultDuration(duration: number): ValidationResult {
  if (typeof duration !== 'number' || duration < 100 || duration > 2000) {
    return { isValid: false, error: 'Transition duration must be between 100 and 2000 milliseconds' }
  }
  return { isValid: true }
}

// Complete settings validation
export function validateAppSettings(settings: Partial<AppSettings>): ValidationError[] {
  const errors: ValidationError[] = []

  if (settings.theme) {
    const result = validateTheme(settings.theme)
    if (!result.isValid) errors.push({ field: 'theme', message: result.error! })
  }

  if (settings.language) {
    const result = validateLanguage(settings.language)
    if (!result.isValid) errors.push({ field: 'language', message: result.error! })
  }

  if (settings.autoSaveInterval !== undefined) {
    const result = validateAutoSaveInterval(settings.autoSaveInterval)
    if (!result.isValid) errors.push({ field: 'autoSaveInterval', message: result.error! })
  }

  if (settings.defaultTemplate) {
    const result = validateDefaultTemplate(settings.defaultTemplate)
    if (!result.isValid) errors.push({ field: 'defaultTemplate', message: result.error! })
  }

  if (settings.mediaLibraryPath !== undefined) {
    const result = validateMediaLibraryPath(settings.mediaLibraryPath)
    if (!result.isValid) errors.push({ field: 'mediaLibraryPath', message: result.error! })
  }

  return errors
}

export function validateEditorSettings(settings: Partial<EditorSettings>): ValidationError[] {
  const errors: ValidationError[] = []

  if (settings.defaultFont) {
    const result = validateDefaultFont(settings.defaultFont)
    if (!result.isValid) errors.push({ field: 'defaultFont', message: result.error! })
  }

  if (settings.defaultFontSize !== undefined) {
    const result = validateDefaultFontSize(settings.defaultFontSize)
    if (!result.isValid) errors.push({ field: 'defaultFontSize', message: result.error! })
  }

  if (settings.gridSize !== undefined) {
    const result = validateGridSize(settings.gridSize)
    if (!result.isValid) errors.push({ field: 'gridSize', message: result.error! })
  }

  if (settings.zoomLevel !== undefined) {
    const result = validateZoomLevel(settings.zoomLevel)
    if (!result.isValid) errors.push({ field: 'zoomLevel', message: result.error! })
  }

  return errors
}

export function validatePresentationSettings(settings: Partial<PresentationSettings>): ValidationError[] {
  const errors: ValidationError[] = []

  if (settings.defaultTransition) {
    const result = validateDefaultTransition(settings.defaultTransition)
    if (!result.isValid) errors.push({ field: 'defaultTransition', message: result.error! })
  }

  if (settings.defaultDuration !== undefined) {
    const result = validateDefaultDuration(settings.defaultDuration)
    if (!result.isValid) errors.push({ field: 'defaultDuration', message: result.error! })
  }

  return errors
}

// Helper function to format validation errors for display
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) return ''
  if (errors.length === 1) return errors[0].message
  return `${errors.length} validation errors: ${errors.map(e => e.message).join(', ')}`
}