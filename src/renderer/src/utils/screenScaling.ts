/**
 * Enhanced Screen Scaling Utilities for Multi-Resolution Support
 *
 * Handles:
 * - Multi-resolution scaling (4K, 2K, ultra-wide, legacy)
 * - Consistent scaling between preview and projection
 * - Resolution-aware text scaling with DPI support
 * - Real-time updates when displays change
 * - Performance optimization per resolution tier
 */

import { 
  Resolution, 
  ResolutionCategory, 
  ScalingConfiguration,
  ResolutionProfile,
  RESOLUTION_PROFILES,
  findBestMatchResolution,
  calculateOptimalTextSize
} from '@renderer/types/resolution'
import { 
  BASE_CANVAS_WIDTH, 
  BASE_CANVAS_HEIGHT, 
  getCanvasDimensionsForResolution,
  getProjectionCanvasDimensions,
  getTextScaleFactor
} from '@renderer/constants/canvas'

export interface DisplayInfo {
  id: number
  bounds: {
    x: number
    y: number
    width: number
    height: number
  }
  workArea: {
    x: number
    y: number
    width: number
    height: number
  }
  scaleFactor: number
  isPrimary?: boolean
}

// Enhanced scaling config with multi-resolution support
export interface ScalingConfig extends ScalingConfiguration {
  // Legacy compatibility
  baseWidth: number
  baseHeight: number
  targetWidth: number
  targetHeight: number
  baseAspectRatio: number
  targetAspectRatio: number
  textScaleFactor: number
  
  // Enhanced multi-resolution properties
  resolution: Resolution
  resolutionProfile: ResolutionProfile
  canvasDimensions: {
    width: number
    height: number
    scale: number
  }
  performanceLevel: 'ultra' | 'high' | 'balanced' | 'performance' | 'legacy'
  recommendedSettings: {
    backgroundQuality: 'ultra' | 'high' | 'medium' | 'low'
    renderingPipeline: 'gpu' | 'cpu' | 'hybrid'
    enableOptimizations: boolean
  }
}

// Base design canvas - Full HD as reference
const BASE_DESIGN_WIDTH = BASE_CANVAS_WIDTH  // 1920
const BASE_DESIGN_HEIGHT = BASE_CANVAS_HEIGHT // 1080

/**
 * Calculate enhanced scaling configuration for target display with multi-resolution support
 */
export function calculateScaling(targetDisplay: DisplayInfo): ScalingConfig {
  const { width: targetWidth, height: targetHeight } = targetDisplay.workArea
  const dpiScale = targetDisplay.scaleFactor || 1

  // Find best matching resolution
  const resolution = findBestMatchResolution(targetWidth, targetHeight)
  const resolutionProfile = RESOLUTION_PROFILES[resolution.category]
  
  // Get canvas dimensions for this resolution
  const canvasDimensions = getCanvasDimensionsForResolution(resolution)
  
  // Calculate scaling factors
  const scaleX = targetWidth / BASE_DESIGN_WIDTH
  const scaleY = targetHeight / BASE_DESIGN_HEIGHT
  const uniformScale = Math.min(scaleX, scaleY)

  const baseAspectRatio = BASE_DESIGN_WIDTH / BASE_DESIGN_HEIGHT
  const targetAspectRatio = targetWidth / targetHeight

  // Enhanced text scaling with DPI support
  const textScaleFactor = resolutionProfile.textScale * dpiScale
  
  // Determine aspect ratio strategy
  let aspectRatioStrategy: ScalingConfiguration['aspectRatioStrategy']
  if (Math.abs(targetAspectRatio - baseAspectRatio) < 0.1) {
    aspectRatioStrategy = 'stretch'
  } else if (targetAspectRatio < baseAspectRatio) {
    aspectRatioStrategy = 'pillarbox'
  } else {
    aspectRatioStrategy = 'letterbox'
  }

  return {
    // Legacy compatibility
    baseWidth: BASE_DESIGN_WIDTH,
    baseHeight: BASE_DESIGN_HEIGHT,
    targetWidth,
    targetHeight,
    scaleX,
    scaleY,
    uniformScale,
    baseAspectRatio,
    targetAspectRatio,
    textScaleFactor,
    
    // ScalingConfiguration interface
    baseResolution: {
      width: BASE_DESIGN_WIDTH,
      height: BASE_DESIGN_HEIGHT,
      aspectRatio: baseAspectRatio,
      category: '1080p' as ResolutionCategory,
      name: 'Base Design Canvas',
      commonName: 'Base'
    },
    targetResolution: resolution,
    textScale: textScaleFactor,
    aspectRatioStrategy,
    dpiScale,
    
    // Enhanced properties
    resolution,
    resolutionProfile,
    canvasDimensions,
    performanceLevel: resolutionProfile.performanceLevel,
    recommendedSettings: resolutionProfile.recommendedSettings
  }
}

/**
 * Scale text size based on target screen with multi-resolution support
 */
export function scaleTextSize(originalSize: number, config: ScalingConfig): number {
  // Use enhanced text scaling that considers resolution category and DPI
  const scaledSize = calculateOptimalTextSize(originalSize, config.resolution, config.dpiScale)
  
  // Ensure minimum readable size based on resolution category
  const minSize = getMinimumTextSize(config.resolution.category)
  return Math.max(scaledSize, minSize)
}

/**
 * Get minimum text size for resolution category
 */
function getMinimumTextSize(category: ResolutionCategory): number {
  const minimums = {
    '8k': 16,
    '4k': 12,
    '2k': 10,
    '1080p': 8,
    'hd': 6,
    'legacy': 4
  }
  return minimums[category]
}

/**
 * Scale text size with resolution-aware calculation (new enhanced version)
 */
export function scaleTextSizeEnhanced(
  originalSize: number, 
  targetResolution: Resolution,
  dpiScale: number = 1,
  context: 'preview' | 'projection' | 'editor' = 'projection'
): number {
  const baseScale = getTextScaleFactor(targetResolution.category)
  
  // Apply context-specific modifiers
  let contextModifier = 1
  switch (context) {
    case 'preview':
      contextModifier = 0.6 // Smaller for preview panels
      break
    case 'editor':
      contextModifier = 0.8 // Slightly smaller for editor
      break
    case 'projection':
      contextModifier = 1.0 // Full scale for projection
      break
  }
  
  const scaledSize = originalSize * baseScale * dpiScale * contextModifier
  const minSize = getMinimumTextSize(targetResolution.category)
  
  return Math.max(scaledSize, minSize)
}

/**
 * Scale element dimensions and positions
 */
export function scaleElement(
  element: {
    x: number
    y: number
    width: number
    height: number
  },
  config: ScalingConfig
): {
  x: number
  y: number
  width: number
  height: number
} {
  return {
    x: element.x * config.scaleX,
    y: element.y * config.scaleY,
    width: element.width * config.scaleX,
    height: element.height * config.scaleY
  }
}

/**
 * Calculate preview size that maintains aspect ratio
 * Used for the preview panels in Home.tsx
 */
export function calculatePreviewSize(
  containerWidth: number,
  containerHeight: number,
  targetAspectRatio: number
): {
  width: number
  height: number
  offsetX: number
  offsetY: number
} {
  const containerAspectRatio = containerWidth / containerHeight

  let width: number, height: number

  if (containerAspectRatio > targetAspectRatio) {
    // Container is wider than target - fit by height
    height = containerHeight
    width = height * targetAspectRatio
  } else {
    // Container is taller than target - fit by width
    width = containerWidth
    height = width / targetAspectRatio
  }

  const offsetX = (containerWidth - width) / 2
  const offsetY = (containerHeight - height) / 2

  return { width, height, offsetX, offsetY }
}

/**
 * Handle different aspect ratios gracefully
 */
export function getAspectRatioStrategy(targetAspectRatio: number): {
  strategy: 'letterbox' | 'pillarbox' | 'stretch' | 'crop'
  description: string
} {
  const ratio16_9 = 16 / 9 // 1.778

  if (Math.abs(targetAspectRatio - ratio16_9) < 0.1) {
    return {
      strategy: 'stretch',
      description: '16:9 - Perfect fit'
    }
  } else if (targetAspectRatio < ratio16_9) {
    return {
      strategy: 'pillarbox',
      description: 'Taller screen - Add side padding'
    }
  } else {
    return {
      strategy: 'letterbox',
      description: 'Wider screen - Add top/bottom padding'
    }
  }
}

/**
 * Apply responsive text scaling based on screen size categories
 */
export function getResponsiveTextScale(screenHeight: number): number {
  if (screenHeight >= 2160) {
    // 4K screens
    return 2.0
  } else if (screenHeight >= 1440) {
    // 1440p screens
    return 1.33
  } else if (screenHeight >= 1080) {
    // 1080p screens (base)
    return 1.0
  } else if (screenHeight >= 900) {
    // Smaller screens
    return 0.83
  } else {
    // Very small screens
    return 0.67
  }
}

/**
 * Calculate CSS transforms for element positioning
 */
export function calculateElementTransform(
  element: {
    x: number
    y: number
    width: number
    height: number
  },
  config: ScalingConfig
): string {
  const scaled = scaleElement(element, config)

  return `translate(${scaled.x}px, ${scaled.y}px) scale(${config.uniformScale})`
}

/**
 * Generate CSS styles for projection container
 */
export function generateProjectionStyles(config: ScalingConfig): React.CSSProperties {
  const { strategy } = getAspectRatioStrategy(config.targetAspectRatio)

  const baseStyles: React.CSSProperties = {
    width: config.targetWidth,
    height: config.targetHeight,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#000000'
  }

  if (strategy === 'letterbox' || strategy === 'pillarbox') {
    // Center content with padding
    return {
      ...baseStyles,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }

  return baseStyles
}

/**
 * Enhanced screen detection utilities with multi-resolution support
 */
export class ScreenManager {
  private displays: DisplayInfo[] = []
  private currentProjectionDisplay: DisplayInfo | null = null
  private listeners: Array<(displays: DisplayInfo[]) => void> = []
  private currentScalingConfig: ScalingConfig | null = null

  async initialize(): Promise<void> {
    try {
      // Get initial display information
      this.displays = (await window.electron?.ipcRenderer.invoke('get-displays')) || []
      this.currentProjectionDisplay =
        (await window.electron?.ipcRenderer.invoke('get-projection-display')) || null

      // Calculate initial scaling config
      if (this.currentProjectionDisplay) {
        this.currentScalingConfig = calculateScaling(this.currentProjectionDisplay)
      }

      // Listen for display changes
      window.electron?.ipcRenderer.on('displays-changed', (_event, displays: DisplayInfo[]) => {
        this.displays = displays
        this.updateScalingConfig()
        this.notifyListeners()
      })

      console.log('📺 [SCREEN-MANAGER] Initialized with enhanced resolution support:', {
        displays: this.displays.length,
        currentResolution: this.currentScalingConfig?.resolution.commonName,
        performanceLevel: this.currentScalingConfig?.performanceLevel
      })
    } catch (error) {
      console.error('📺 [SCREEN-MANAGER] Failed to initialize:', error)
    }
  }

  getDisplays(): DisplayInfo[] {
    return this.displays
  }

  getCurrentProjectionDisplay(): DisplayInfo | null {
    return this.currentProjectionDisplay
  }

  async setProjectionDisplay(displayId: number): Promise<DisplayInfo | null> {
    try {
      const display = await window.electron?.ipcRenderer.invoke('set-projection-display', displayId)
      if (display) {
        this.currentProjectionDisplay = display
        this.updateScalingConfig()
        this.notifyListeners()
        
        console.log('📺 [SCREEN-MANAGER] Projection display changed:', {
          resolution: `${display.workArea.width}x${display.workArea.height}`,
          category: this.currentScalingConfig?.resolution.category,
          textScale: this.currentScalingConfig?.textScale
        })
      }
      return display
    } catch (error) {
      console.error('📺 [SCREEN-MANAGER] Failed to set projection display:', error)
      return null
    }
  }

  onDisplaysChanged(callback: (displays: DisplayInfo[]) => void): () => void {
    this.listeners.push(callback)

    // Return cleanup function
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.displays))
  }

  private updateScalingConfig(): void {
    if (this.currentProjectionDisplay) {
      this.currentScalingConfig = calculateScaling(this.currentProjectionDisplay)
    }
  }

  getCurrentScalingConfig(): ScalingConfig | null {
    return this.currentScalingConfig
  }

  // Enhanced methods for multi-resolution support
  getCurrentResolution(): Resolution | null {
    return this.currentScalingConfig?.resolution || null
  }

  getCurrentResolutionCategory(): ResolutionCategory {
    return this.currentScalingConfig?.resolution.category || '1080p'
  }

  getCurrentTextScale(): number {
    return this.currentScalingConfig?.textScale || 1
  }

  getOptimalTextSize(baseSize: number, context: 'preview' | 'projection' | 'editor' = 'projection'): number {
    const resolution = this.getCurrentResolution()
    if (!resolution) return baseSize

    const dpiScale = this.currentProjectionDisplay?.scaleFactor || 1
    return scaleTextSizeEnhanced(baseSize, resolution, dpiScale, context)
  }

  supportsHighQuality(): boolean {
    const config = this.getCurrentScalingConfig()
    return config ? ['ultra', 'high'].includes(config.performanceLevel) : false
  }

  isUltraWide(): boolean {
    const resolution = this.getCurrentResolution()
    return resolution ? resolution.aspectRatio >= 2.1 : false
  }

  isHighDpi(): boolean {
    return (this.currentProjectionDisplay?.scaleFactor || 1) >= 1.5
  }

  getRecommendedBackgroundQuality(): 'ultra' | 'high' | 'medium' | 'low' {
    return this.currentScalingConfig?.recommendedSettings.backgroundQuality || 'medium'
  }

  getCanvasDimensions(): { width: number; height: number; scale: number } | null {
    return this.currentScalingConfig?.canvasDimensions || null
  }
}

// Singleton instance
export const screenManager = new ScreenManager()
