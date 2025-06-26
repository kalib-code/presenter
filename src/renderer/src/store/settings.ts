import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { db } from '@renderer/lib/database'
import type { AppSettings, EditorSettings, PresentationSettings } from '@renderer/types/database'

interface SettingsState {
  app: AppSettings
  editor: EditorSettings
  presentation: PresentationSettings
  isLoaded: boolean
  isLoading: boolean
  error?: string
}

type SettingValue = string | number | boolean | object

interface SettingsActions {
  // App settings
  setTheme: (theme: AppSettings['theme']) => Promise<void>
  setLanguage: (language: string) => Promise<void>
  setAutoSave: (enabled: boolean) => Promise<void>
  setAutoSaveInterval: (interval: number) => Promise<void>
  setDefaultTemplate: (template: string) => Promise<void>
  setMediaLibraryPath: (path: string) => Promise<void>

  // Editor settings
  setDefaultFont: (font: string) => Promise<void>
  setDefaultFontSize: (size: number) => Promise<void>
  setGridSnap: (enabled: boolean) => Promise<void>
  setGridSize: (size: number) => Promise<void>
  setShowRulers: (show: boolean) => Promise<void>
  setShowGuides: (show: boolean) => Promise<void>
  setZoomLevel: (level: number) => Promise<void>

  // Presentation settings
  setDefaultTransition: (transition: string) => Promise<void>
  setDefaultDuration: (duration: number) => Promise<void>
  setAutoAdvance: (enabled: boolean) => Promise<void>
  setShowNotes: (show: boolean) => Promise<void>
  setStageDisplay: (enabled: boolean) => Promise<void>

  // Core actions
  loadSettings: () => Promise<void>
  saveSettings: () => Promise<void>
  resetToDefaults: () => Promise<void>
  initialize: () => Promise<void>
  clearSettings: () => Promise<void>

  // Helper methods
  loadSettingsByCategory: (
    category: 'app' | 'editor' | 'presentation'
  ) => Promise<Record<string, SettingValue>>
  saveAppSetting: (key: string, value: SettingValue) => Promise<void>
  saveEditorSetting: (key: string, value: SettingValue) => Promise<void>
  savePresentationSetting: (key: string, value: SettingValue) => Promise<void>
  saveAllAppSettings: (appSettings: AppSettings) => Promise<void>
  saveAllEditorSettings: (editorSettings: EditorSettings) => Promise<void>
  saveAllPresentationSettings: (presentationSettings: PresentationSettings) => Promise<void>
}

const defaultAppSettings: AppSettings = {
  theme: 'system',
  language: 'en',
  autoSave: true,
  autoSaveInterval: 30000, // 30 seconds
  defaultTemplate: 'default',
  mediaLibraryPath: ''
}

const defaultEditorSettings: EditorSettings = {
  defaultFont: 'Arial',
  defaultFontSize: 32,
  gridSnap: false,
  gridSize: 20,
  showRulers: false,
  showGuides: false,
  zoomLevel: 1.0
}

const defaultPresentationSettings: PresentationSettings = {
  defaultTransition: 'fade',
  defaultDuration: 500,
  autoAdvance: false,
  showNotes: false,
  stageDisplay: false
}

type SettingsStore = SettingsState & SettingsActions

export const useSettingsStore = create<SettingsStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    app: defaultAppSettings,
    editor: defaultEditorSettings,
    presentation: defaultPresentationSettings,
    isLoaded: false,
    isLoading: false,
    error: undefined,

    // App settings actions
    setTheme: async (theme) => {
      const state = get()
      const newAppSettings = { ...state.app, theme }
      set({ app: newAppSettings })
      await get().saveAppSetting('theme', theme)
    },

    setLanguage: async (language) => {
      const state = get()
      const newAppSettings = { ...state.app, language }
      set({ app: newAppSettings })
      await get().saveAppSetting('language', language)
    },

    setAutoSave: async (autoSave) => {
      console.log('🔧 [SETTINGS] Setting autoSave to:', autoSave)
      const state = get()
      const newAppSettings = { ...state.app, autoSave }
      set({ app: newAppSettings })
      console.log('🔧 [SETTINGS] Updated app settings in store:', newAppSettings)

      console.log('🔧 [SETTINGS] Saving autoSave to database...')
      await get().saveAppSetting('autoSave', autoSave)
      console.log('🔧 [SETTINGS] AutoSave saved to database successfully')
    },

    setAutoSaveInterval: async (autoSaveInterval) => {
      const state = get()
      const newAppSettings = { ...state.app, autoSaveInterval }
      set({ app: newAppSettings })
      await get().saveAppSetting('autoSaveInterval', autoSaveInterval)
    },

    setDefaultTemplate: async (defaultTemplate) => {
      const state = get()
      const newAppSettings = { ...state.app, defaultTemplate }
      set({ app: newAppSettings })
      await get().saveAppSetting('defaultTemplate', defaultTemplate)
    },

    setMediaLibraryPath: async (mediaLibraryPath) => {
      const state = get()
      const newAppSettings = { ...state.app, mediaLibraryPath }
      set({ app: newAppSettings })
      await get().saveAppSetting('mediaLibraryPath', mediaLibraryPath)
    },

    // Editor settings actions
    setDefaultFont: async (defaultFont) => {
      const state = get()
      const newEditorSettings = { ...state.editor, defaultFont }
      set({ editor: newEditorSettings })
      await get().saveEditorSetting('defaultFont', defaultFont)
    },

    setDefaultFontSize: async (defaultFontSize) => {
      const state = get()
      const newEditorSettings = { ...state.editor, defaultFontSize }
      set({ editor: newEditorSettings })
      await get().saveEditorSetting('defaultFontSize', defaultFontSize)
    },

    setGridSnap: async (gridSnap) => {
      const state = get()
      const newEditorSettings = { ...state.editor, gridSnap }
      set({ editor: newEditorSettings })
      await get().saveEditorSetting('gridSnap', gridSnap)
    },

    setGridSize: async (gridSize) => {
      const state = get()
      const newEditorSettings = { ...state.editor, gridSize }
      set({ editor: newEditorSettings })
      await get().saveEditorSetting('gridSize', gridSize)
    },

    setShowRulers: async (showRulers) => {
      const state = get()
      const newEditorSettings = { ...state.editor, showRulers }
      set({ editor: newEditorSettings })
      await get().saveEditorSetting('showRulers', showRulers)
    },

    setShowGuides: async (showGuides) => {
      const state = get()
      const newEditorSettings = { ...state.editor, showGuides }
      set({ editor: newEditorSettings })
      await get().saveEditorSetting('showGuides', showGuides)
    },

    setZoomLevel: async (zoomLevel) => {
      const state = get()
      const newEditorSettings = { ...state.editor, zoomLevel }
      set({ editor: newEditorSettings })
      await get().saveEditorSetting('zoomLevel', zoomLevel)
    },

    // Presentation settings actions
    setDefaultTransition: async (defaultTransition) => {
      const state = get()
      const newPresentationSettings = { ...state.presentation, defaultTransition }
      set({ presentation: newPresentationSettings })
      await get().savePresentationSetting('defaultTransition', defaultTransition)
    },

    setDefaultDuration: async (defaultDuration) => {
      const state = get()
      const newPresentationSettings = { ...state.presentation, defaultDuration }
      set({ presentation: newPresentationSettings })
      await get().savePresentationSetting('defaultDuration', defaultDuration)
    },

    setAutoAdvance: async (autoAdvance) => {
      const state = get()
      const newPresentationSettings = { ...state.presentation, autoAdvance }
      set({ presentation: newPresentationSettings })
      await get().savePresentationSetting('autoAdvance', autoAdvance)
    },

    setShowNotes: async (showNotes) => {
      const state = get()
      const newPresentationSettings = { ...state.presentation, showNotes }
      set({ presentation: newPresentationSettings })
      await get().savePresentationSetting('showNotes', showNotes)
    },

    setStageDisplay: async (stageDisplay) => {
      const state = get()
      const newPresentationSettings = { ...state.presentation, stageDisplay }
      set({ presentation: newPresentationSettings })
      await get().savePresentationSetting('stageDisplay', stageDisplay)
    },

    // Core actions
    loadSettings: async () => {
      try {
        console.log('🔧 [SETTINGS] Starting to load settings...')
        set({ isLoading: true, error: undefined })

        // Load all settings from database
        console.log('🔧 [SETTINGS] Loading app settings...')
        const appSettings = await get().loadSettingsByCategory('app')
        console.log('🔧 [SETTINGS] Loaded app settings:', appSettings)

        console.log('🔧 [SETTINGS] Loading editor settings...')
        const editorSettings = await get().loadSettingsByCategory('editor')
        console.log('🔧 [SETTINGS] Loaded editor settings:', editorSettings)

        console.log('🔧 [SETTINGS] Loading presentation settings...')
        const presentationSettings = await get().loadSettingsByCategory('presentation')
        console.log('🔧 [SETTINGS] Loaded presentation settings:', presentationSettings)

        // Check for specific autosave setting
        const hasAutoSaveSetting = 'autoSave' in appSettings
        console.log('🔧 [SETTINGS] Has autoSave setting:', hasAutoSaveSetting)
        console.log('🔧 [SETTINGS] AutoSave value from DB:', appSettings.autoSave)

        // Force autosave to true if it's undefined or doesn't exist
        const finalAppSettings = { ...defaultAppSettings, ...appSettings }
        if (!hasAutoSaveSetting || appSettings.autoSave === undefined) {
          console.log('🔧 [SETTINGS] AutoSave not found or undefined, forcing to true')
          finalAppSettings.autoSave = true
          // Save this to database immediately
          await get().saveAppSetting('autoSave', true)
        }

        // Merge with defaults
        const app = finalAppSettings
        const editor = { ...defaultEditorSettings, ...editorSettings }
        const presentation = { ...defaultPresentationSettings, ...presentationSettings }

        console.log('🔧 [SETTINGS] Final app settings:', app)
        console.log('🔧 [SETTINGS] Default autoSave:', defaultAppSettings.autoSave)
        console.log('🔧 [SETTINGS] Loaded autoSave:', appSettings.autoSave)
        console.log('🔧 [SETTINGS] Final autoSave:', app.autoSave)

        set({
          app,
          editor,
          presentation,
          isLoaded: true,
          isLoading: false
        })

        console.log('✅ Settings loaded successfully:', { app, editor, presentation })
      } catch (error) {
        console.error('❌ Failed to load settings:', error)
        set({
          error: error instanceof Error ? error.message : 'Failed to load settings',
          isLoading: false
        })
      }
    },

    saveSettings: async () => {
      try {
        const state = get()

        // Save all settings to database
        await Promise.all([
          get().saveAllAppSettings(state.app),
          get().saveAllEditorSettings(state.editor),
          get().saveAllPresentationSettings(state.presentation)
        ])

        console.log('✅ All settings saved successfully')
      } catch (error) {
        console.error('❌ Failed to save settings:', error)
        set({ error: error instanceof Error ? error.message : 'Failed to save settings' })
      }
    },

    resetToDefaults: async () => {
      try {
        set({
          app: defaultAppSettings,
          editor: defaultEditorSettings,
          presentation: defaultPresentationSettings
        })

        await get().saveSettings()
        console.log('✅ Settings reset to defaults')
      } catch (error) {
        console.error('❌ Failed to reset settings:', error)
        set({ error: error instanceof Error ? error.message : 'Failed to reset settings' })
      }
    },

    initialize: async () => {
      await get().loadSettings()
    },

    // Development helper to clear settings
    clearSettings: async () => {
      console.log('🗑️ [SETTINGS] Clearing all settings...')
      const allSettings = await db.settings.list()
      for (const setting of allSettings.data) {
        await db.settings.delete(setting.id)
      }
      console.log('🗑️ [SETTINGS] All settings cleared')
    },

    // Helper methods for database operations
    loadSettingsByCategory: async (category: 'app' | 'editor' | 'presentation') => {
      console.log(`🔧 [SETTINGS] Loading settings for category: ${category}`)
      const settings = await db.settings.getByCategory(category)
      console.log(`🔧 [SETTINGS] Raw settings from database for ${category}:`, settings)

      const result: Record<string, SettingValue> = {}

      for (const setting of settings) {
        const key = setting.id.replace(`${category}.`, '')
        result[key] = setting.value
        console.log(`🔧 [SETTINGS] Parsed setting: ${key} = ${setting.value}`)
      }

      console.log(`🔧 [SETTINGS] Final result for ${category}:`, result)
      return result
    },

    saveAppSetting: async (key: string, value: SettingValue) => {
      await db.settings.setValue(`app.${key}`, value, 'app')
    },

    saveEditorSetting: async (key: string, value: SettingValue) => {
      await db.settings.setValue(`editor.${key}`, value, 'editor')
    },

    savePresentationSetting: async (key: string, value: SettingValue) => {
      await db.settings.setValue(`presentation.${key}`, value, 'presentation')
    },

    saveAllAppSettings: async (appSettings: AppSettings) => {
      await Promise.all(
        Object.entries(appSettings).map(([key, value]) =>
          db.settings.setValue(`app.${key}`, value, 'app')
        )
      )
    },

    saveAllEditorSettings: async (editorSettings: EditorSettings) => {
      await Promise.all(
        Object.entries(editorSettings).map(([key, value]) =>
          db.settings.setValue(`editor.${key}`, value, 'editor')
        )
      )
    },

    saveAllPresentationSettings: async (presentationSettings: PresentationSettings) => {
      await Promise.all(
        Object.entries(presentationSettings).map(([key, value]) =>
          db.settings.setValue(`presentation.${key}`, value, 'presentation')
        )
      )
    }
  }))
)

// Utility hook for autosave setting specifically
export const useAutoSaveSettings = () => {
  const autoSave = useSettingsStore((state) => state.app.autoSave)
  const autoSaveInterval = useSettingsStore((state) => state.app.autoSaveInterval)
  const setAutoSave = useSettingsStore((state) => state.setAutoSave)
  const setAutoSaveInterval = useSettingsStore((state) => state.setAutoSaveInterval)

  return {
    autoSave,
    autoSaveInterval,
    setAutoSave,
    setAutoSaveInterval
  }
}
