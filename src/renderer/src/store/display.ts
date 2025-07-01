/**
 * Display State Management Store
 * 
 * Centralizes display and resolution state management across the application
 * Integrates with resolution manager and screen manager for unified state
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { 
  Resolution, 
  ResolutionCategory, 
  ScalingConfiguration,
  DisplayResolutionInfo 
} from '@renderer/types/resolution'
import { DisplayInfo } from '@renderer/utils/screenScaling'
import { resolutionManager } from '@renderer/utils/resolutionManager'
import { screenManager } from '@renderer/utils/screenScaling'

export interface DisplayState {
  // Display Information
  availableDisplays: DisplayResolutionInfo[]
  currentProjectionDisplay: DisplayResolutionInfo | null
  primaryDisplay: DisplayResolutionInfo | null
  
  // Resolution State
  currentResolution: Resolution | null
  currentResolutionCategory: ResolutionCategory
  scalingConfig: ScalingConfiguration | null
  
  // Quality and Performance Settings
  recommendedBackgroundQuality: 'ultra' | 'high' | 'medium' | 'low'
  performanceLevel: 'ultra' | 'high' | 'balanced' | 'performance' | 'legacy'
  supportsHighQuality: boolean
  isUltraWide: boolean
  isHighDpi: boolean
  
  // Loading States
  isInitialized: boolean
  isLoading: boolean
  error: string | null
  
  // Actions
  initialize: () => Promise<void>
  setProjectionDisplay: (displayId: number) => Promise<boolean>
  refresh: () => Promise<void>
  getOptimalTextSize: (baseSize: number, context?: 'preview' | 'projection' | 'editor') => number
  
  // Internal Actions
  _updateDisplayState: () => void
  _setError: (error: string | null) => void
}

export const useDisplayStore = create<DisplayState>()(
  subscribeWithSelector((set, get) => ({
    // Initial State
    availableDisplays: [],
    currentProjectionDisplay: null,
    primaryDisplay: null,
    currentResolution: null,
    currentResolutionCategory: '1080p',
    scalingConfig: null,
    recommendedBackgroundQuality: 'medium',
    performanceLevel: 'balanced',
    supportsHighQuality: false,
    isUltraWide: false,
    isHighDpi: false,
    isInitialized: false,
    isLoading: false,
    error: null,

    // Actions
    initialize: async () => {
      const state = get()
      if (state.isInitialized) return

      set({ isLoading: true, error: null })

      try {
        console.log('🖥️ [DISPLAY_STORE] Initializing display state...')
        
        // Initialize both managers
        await Promise.all([
          resolutionManager.initialize(),
          screenManager.initialize()
        ])

        // Set up listeners for state changes
        const resolutionUnsubscribe = resolutionManager.onStateChange((resolutionState) => {
          console.log('🖥️ [DISPLAY_STORE] Resolution state changed')
          get()._updateDisplayState()
        })

        const screenUnsubscribe = screenManager.onDisplaysChanged(() => {
          console.log('🖥️ [DISPLAY_STORE] Screen displays changed')
          get()._updateDisplayState()
        })

        // Store cleanup functions (you might want to add these to the state if needed)
        // For now, they'll be handled by the managers themselves

        // Update initial state
        get()._updateDisplayState()

        set({ 
          isInitialized: true, 
          isLoading: false,
          error: null
        })

        console.log('🖥️ [DISPLAY_STORE] Initialization complete')
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to initialize display state'
        console.error('🖥️ [DISPLAY_STORE] Initialization failed:', error)
        set({ 
          error: errorMessage, 
          isLoading: false,
          isInitialized: false
        })
      }
    },

    setProjectionDisplay: async (displayId: number) => {
      set({ isLoading: true, error: null })

      try {
        console.log('🖥️ [DISPLAY_STORE] Setting projection display:', displayId)
        
        const success = await resolutionManager.setProjectionDisplay(displayId)
        
        if (success) {
          get()._updateDisplayState()
          set({ isLoading: false })
          return true
        } else {
          set({ 
            error: 'Failed to set projection display',
            isLoading: false
          })
          return false
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to set projection display'
        set({ 
          error: errorMessage,
          isLoading: false
        })
        return false
      }
    },

    refresh: async () => {
      set({ isLoading: true, error: null })

      try {
        console.log('🖥️ [DISPLAY_STORE] Refreshing display state...')
        
        await Promise.all([
          resolutionManager.refresh(),
          screenManager.initialize() // Re-initialize screen manager
        ])

        get()._updateDisplayState()
        set({ isLoading: false })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to refresh display state'
        console.error('🖥️ [DISPLAY_STORE] Refresh failed:', error)
        set({ 
          error: errorMessage,
          isLoading: false
        })
      }
    },

    getOptimalTextSize: (baseSize: number, context: 'preview' | 'projection' | 'editor' = 'projection') => {
      try {
        return screenManager.getOptimalTextSize(baseSize, context)
      } catch (error) {
        console.warn('🖥️ [DISPLAY_STORE] Failed to get optimal text size:', error)
        return baseSize
      }
    },

    // Internal Actions
    _updateDisplayState: () => {
      try {
        const resolutionState = resolutionManager.getState()
        const scalingConfig = screenManager.getCurrentScalingConfig()
        
        set({
          availableDisplays: resolutionState.availableDisplays,
          currentProjectionDisplay: resolutionState.currentProjectionDisplay,
          primaryDisplay: resolutionState.primaryDisplay,
          currentResolution: resolutionState.currentProjectionDisplay?.resolution || null,
          currentResolutionCategory: resolutionState.currentProjectionDisplay?.resolution.category || '1080p',
          scalingConfig: resolutionState.currentProjectionDisplay?.scalingConfig || null,
          recommendedBackgroundQuality: resolutionManager.getRecommendedBackgroundQuality(),
          performanceLevel: resolutionState.currentProjectionDisplay?.resolutionProfile.performanceLevel || 'balanced',
          supportsHighQuality: resolutionManager.supportsHighQuality(),
          isUltraWide: resolutionManager.isCurrentDisplayUltraWide(),
          isHighDpi: resolutionManager.isCurrentDisplayHighDpi()
        })

        console.log('🖥️ [DISPLAY_STORE] State updated:', {
          currentResolution: resolutionState.currentProjectionDisplay?.resolution.commonName,
          category: resolutionState.currentProjectionDisplay?.resolution.category,
          performanceLevel: resolutionState.currentProjectionDisplay?.resolutionProfile.performanceLevel,
          supportsHighQuality: resolutionManager.supportsHighQuality()
        })
      } catch (error) {
        console.error('🖥️ [DISPLAY_STORE] Failed to update display state:', error)
        get()._setError('Failed to update display state')
      }
    },

    _setError: (error: string | null) => {
      set({ error })
    }
  }))
)

// Selectors for common use cases
export const selectCurrentResolution = (state: DisplayState) => state.currentResolution
export const selectCurrentResolutionCategory = (state: DisplayState) => state.currentResolutionCategory
export const selectScalingConfig = (state: DisplayState) => state.scalingConfig
export const selectSupportsHighQuality = (state: DisplayState) => state.supportsHighQuality
export const selectIsUltraWide = (state: DisplayState) => state.isUltraWide
export const selectRecommendedBackgroundQuality = (state: DisplayState) => state.recommendedBackgroundQuality
export const selectAvailableDisplays = (state: DisplayState) => state.availableDisplays
export const selectCurrentProjectionDisplay = (state: DisplayState) => state.currentProjectionDisplay

// Hook for easy access to common display properties
export const useDisplayInfo = () => {
  const currentResolution = useDisplayStore(selectCurrentResolution)
  const resolutionCategory = useDisplayStore(selectCurrentResolutionCategory)
  const supportsHighQuality = useDisplayStore(selectSupportsHighQuality)
  const isUltraWide = useDisplayStore(selectIsUltraWide)
  const recommendedQuality = useDisplayStore(selectRecommendedBackgroundQuality)
  const getOptimalTextSize = useDisplayStore(state => state.getOptimalTextSize)
  const isInitialized = useDisplayStore(state => state.isInitialized)

  return {
    currentResolution,
    resolutionCategory,
    supportsHighQuality,
    isUltraWide,
    recommendedQuality,
    getOptimalTextSize,
    isInitialized
  }
}

// Hook for display management
export const useDisplayManager = () => {
  const availableDisplays = useDisplayStore(selectAvailableDisplays)
  const currentProjectionDisplay = useDisplayStore(selectCurrentProjectionDisplay)
  const setProjectionDisplay = useDisplayStore(state => state.setProjectionDisplay)
  const refresh = useDisplayStore(state => state.refresh)
  const initialize = useDisplayStore(state => state.initialize)
  const isLoading = useDisplayStore(state => state.isLoading)
  const error = useDisplayStore(state => state.error)

  return {
    availableDisplays,
    currentProjectionDisplay,
    setProjectionDisplay,
    refresh,
    initialize,
    isLoading,
    error
  }
}

// Auto-initialize the display store when the module is loaded
// This ensures the store is ready when components need it
let isAutoInitialized = false

export const autoInitializeDisplayStore = async () => {
  if (isAutoInitialized) return
  
  try {
    await useDisplayStore.getState().initialize()
    isAutoInitialized = true
  } catch (error) {
    console.error('🖥️ [DISPLAY_STORE] Auto-initialization failed:', error)
  }
}

// Call auto-initialization after a short delay to allow other modules to load
setTimeout(autoInitializeDisplayStore, 100)