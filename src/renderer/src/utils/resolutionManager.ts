/**
 * Resolution Manager for Display Detection and Multi-Resolution Support
 * 
 * Handles dynamic resolution detection, scaling configuration, and display management
 */

import { 
  Resolution, 
  ResolutionCategory, 
  ResolutionProfile, 
  ScalingConfiguration,
  SUPPORTED_RESOLUTIONS,
  RESOLUTION_PROFILES,
  findBestMatchResolution,
  getResolutionCategory,
  calculateOptimalTextSize
} from '@renderer/types/resolution'
import { DisplayInfo } from './screenScaling'

export interface DisplayResolutionInfo extends DisplayInfo {
  resolution: Resolution
  resolutionProfile: ResolutionProfile
  scalingConfig: ScalingConfiguration
  dpiScale: number
  isOptimal: boolean
}

export interface ResolutionManagerState {
  availableDisplays: DisplayResolutionInfo[]
  currentProjectionDisplay: DisplayResolutionInfo | null
  primaryDisplay: DisplayResolutionInfo | null
  isInitialized: boolean
}

export class ResolutionManager {
  private state: ResolutionManagerState = {
    availableDisplays: [],
    currentProjectionDisplay: null,
    primaryDisplay: null,
    isInitialized: false
  }

  private listeners: Array<(state: ResolutionManagerState) => void> = []
  private baseResolution: Resolution

  constructor() {
    // Use 1080p as base resolution for scaling calculations
    this.baseResolution = SUPPORTED_RESOLUTIONS.find(r => r.name === 'Full HD')!
  }

  /**
   * Initialize the resolution manager
   */
  async initialize(): Promise<void> {
    try {
      console.log('🖥️ [RESOLUTION-MANAGER] Initializing...')
      
      // Get display information from Electron
      const displays = await this.getDisplaysFromElectron()
      
      // Process displays to add resolution information
      this.state.availableDisplays = displays.map(display => this.processDisplay(display))
      
      // Set primary display
      this.state.primaryDisplay = this.state.availableDisplays.find(d => d.isPrimary) || null
      
      // Set initial projection display (fallback to primary)
      this.state.currentProjectionDisplay = await this.getCurrentProjectionDisplay() || this.state.primaryDisplay
      
      this.state.isInitialized = true
      
      // Listen for display changes
      this.setupDisplayChangeListeners()
      
      console.log('🖥️ [RESOLUTION-MANAGER] Initialized with displays:', {
        total: this.state.availableDisplays.length,
        primary: this.state.primaryDisplay?.resolution.commonName,
        projection: this.state.currentProjectionDisplay?.resolution.commonName,
        resolutions: this.state.availableDisplays.map(d => ({
          id: d.id,
          resolution: `${d.resolution.width}x${d.resolution.height}`,
          category: d.resolution.category,
          name: d.resolution.commonName
        }))
      })
      
      this.notifyListeners()
    } catch (error) {
      console.error('🖥️ [RESOLUTION-MANAGER] Failed to initialize:', error)
    }
  }

  /**
   * Get current state
   */
  getState(): ResolutionManagerState {
    return { ...this.state }
  }

  /**
   * Get all available displays with resolution information
   */
  getAvailableDisplays(): DisplayResolutionInfo[] {
    return [...this.state.availableDisplays]
  }

  /**
   * Get current projection display
   */
  getCurrentProjectionDisplay(): DisplayResolutionInfo | null {
    return this.state.currentProjectionDisplay
  }

  /**
   * Get primary display
   */
  getPrimaryDisplay(): DisplayResolutionInfo | null {
    return this.state.primaryDisplay
  }

  /**
   * Set projection display by ID
   */
  async setProjectionDisplay(displayId: number): Promise<DisplayResolutionInfo | null> {
    try {
      const display = this.state.availableDisplays.find(d => d.id === displayId)
      if (!display) {
        console.error('🖥️ [RESOLUTION-MANAGER] Display not found:', displayId)
        return null
      }

      // Update via Electron IPC
      await window.electron?.ipcRenderer.invoke('set-projection-display', displayId)
      
      this.state.currentProjectionDisplay = display
      this.notifyListeners()
      
      console.log('🖥️ [RESOLUTION-MANAGER] Projection display changed:', {
        id: display.id,
        resolution: `${display.resolution.width}x${display.resolution.height}`,
        category: display.resolution.category,
        textScale: display.resolutionProfile.textScale
      })
      
      return display
    } catch (error) {
      console.error('🖥️ [RESOLUTION-MANAGER] Failed to set projection display:', error)
      return null
    }
  }

  /**
   * Get scaling configuration for current projection display
   */
  getCurrentScalingConfig(): ScalingConfiguration | null {
    return this.state.currentProjectionDisplay?.scalingConfig || null
  }

  /**
   * Get optimal text size for current projection display
   */
  getOptimalTextSize(baseSize: number): number {
    if (!this.state.currentProjectionDisplay) return baseSize
    
    return calculateOptimalTextSize(
      baseSize,
      this.state.currentProjectionDisplay.resolution,
      this.state.currentProjectionDisplay.dpiScale
    )
  }

  /**
   * Get resolution profile for current projection display
   */
  getCurrentResolutionProfile(): ResolutionProfile | null {
    return this.state.currentProjectionDisplay?.resolutionProfile || null
  }

  /**
   * Check if current display supports high quality rendering
   */
  supportsHighQuality(): boolean {
    const profile = this.getCurrentResolutionProfile()
    if (!profile) return false
    
    return ['ultra', 'high'].includes(profile.performanceLevel)
  }

  /**
   * Check if current display is ultra-wide
   */
  isCurrentDisplayUltraWide(): boolean {
    if (!this.state.currentProjectionDisplay) return false
    return this.state.currentProjectionDisplay.resolution.aspectRatio >= 2.1
  }

  /**
   * Check if current display is high DPI
   */
  isCurrentDisplayHighDpi(): boolean {
    if (!this.state.currentProjectionDisplay) return false
    return this.state.currentProjectionDisplay.dpiScale >= 1.5
  }

  /**
   * Get recommended background quality for current display
   */
  getRecommendedBackgroundQuality(): 'ultra' | 'high' | 'medium' | 'low' {
    const profile = this.getCurrentResolutionProfile()
    return profile?.recommendedSettings.backgroundQuality || 'medium'
  }

  /**
   * Subscribe to resolution manager changes
   */
  onStateChange(callback: (state: ResolutionManagerState) => void): () => void {
    this.listeners.push(callback)
    
    // Return cleanup function
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * Force refresh display information
   */
  async refresh(): Promise<void> {
    console.log('🖥️ [RESOLUTION-MANAGER] Refreshing display information...')
    await this.initialize()
  }

  /**
   * Get displays from Electron main process
   */
  private async getDisplaysFromElectron(): Promise<DisplayInfo[]> {
    try {
      return (await window.electron?.ipcRenderer.invoke('get-displays')) || []
    } catch (error) {
      console.error('🖥️ [RESOLUTION-MANAGER] Failed to get displays from Electron:', error)
      return []
    }
  }

  /**
   * Get current projection display from Electron
   */
  private async getCurrentProjectionDisplay(): Promise<DisplayResolutionInfo | null> {
    try {
      const display = await window.electron?.ipcRenderer.invoke('get-projection-display')
      return display ? this.processDisplay(display) : null
    } catch (error) {
      console.error('🖥️ [RESOLUTION-MANAGER] Failed to get projection display:', error)
      return null
    }
  }

  /**
   * Process display information to add resolution data
   */
  private processDisplay(display: DisplayInfo): DisplayResolutionInfo {
    const { width, height } = display.workArea
    const resolution = findBestMatchResolution(width, height)
    const resolutionProfile = RESOLUTION_PROFILES[resolution.category]
    
    // Calculate DPI scale (Electron provides scaleFactor)
    const dpiScale = display.scaleFactor || 1
    
    // Calculate scaling configuration
    const scalingConfig = this.calculateScalingConfiguration(resolution, dpiScale)
    
    // Check if this is an optimal match
    const isOptimal = resolution.width === width && resolution.height === height
    
    return {
      ...display,
      resolution,
      resolutionProfile,
      scalingConfig,
      dpiScale,
      isOptimal
    }
  }

  /**
   * Calculate scaling configuration for a resolution
   */
  private calculateScalingConfiguration(
    targetResolution: Resolution, 
    dpiScale: number
  ): ScalingConfiguration {
    const scaleX = targetResolution.width / this.baseResolution.width
    const scaleY = targetResolution.height / this.baseResolution.height
    const uniformScale = Math.min(scaleX, scaleY)
    
    // Text scale considers both resolution and DPI
    const profile = RESOLUTION_PROFILES[targetResolution.category]
    const textScale = profile.textScale * dpiScale
    
    // Determine aspect ratio strategy
    const targetAspectRatio = targetResolution.aspectRatio
    const baseAspectRatio = this.baseResolution.aspectRatio
    
    let aspectRatioStrategy: ScalingConfiguration['aspectRatioStrategy']
    if (Math.abs(targetAspectRatio - baseAspectRatio) < 0.1) {
      aspectRatioStrategy = 'stretch'
    } else if (targetAspectRatio < baseAspectRatio) {
      aspectRatioStrategy = 'pillarbox'
    } else {
      aspectRatioStrategy = 'letterbox'
    }
    
    return {
      baseResolution: this.baseResolution,
      targetResolution,
      scaleX,
      scaleY,
      uniformScale,
      textScale,
      aspectRatioStrategy,
      dpiScale
    }
  }

  /**
   * Setup listeners for display changes
   */
  private setupDisplayChangeListeners(): void {
    if (!window.electron?.ipcRenderer) return
    
    window.electron.ipcRenderer.on('displays-changed', async (_event, displays: DisplayInfo[]) => {
      console.log('🖥️ [RESOLUTION-MANAGER] Displays changed, updating...')
      this.state.availableDisplays = displays.map(display => this.processDisplay(display))
      this.state.primaryDisplay = this.state.availableDisplays.find(d => d.isPrimary) || null
      
      // Update current projection display if it still exists
      if (this.state.currentProjectionDisplay) {
        const updatedProjectionDisplay = this.state.availableDisplays.find(
          d => d.id === this.state.currentProjectionDisplay!.id
        )
        this.state.currentProjectionDisplay = updatedProjectionDisplay || this.state.primaryDisplay
      }
      
      this.notifyListeners()
    })
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener({ ...this.state })
      } catch (error) {
        console.error('🖥️ [RESOLUTION-MANAGER] Error in listener:', error)
      }
    })
  }
}

// Singleton instance
export const resolutionManager = new ResolutionManager()

// Helper functions for quick access
export function getCurrentProjectionResolution(): Resolution | null {
  return resolutionManager.getCurrentProjectionDisplay()?.resolution || null
}

export function getCurrentTextScale(): number {
  const config = resolutionManager.getCurrentScalingConfig()
  return config?.textScale || 1
}

export function getCurrentResolutionCategory(): ResolutionCategory {
  const resolution = getCurrentProjectionResolution()
  return resolution?.category || '1080p'
}

export function isCurrentDisplayOptimal(): boolean {
  return resolutionManager.getCurrentProjectionDisplay()?.isOptimal || false
}