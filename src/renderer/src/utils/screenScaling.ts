/**
 * Screen Scaling Utilities for Presenter Application
 *
 * Handles:
 * - Screen resolution detection and management
 * - Consistent scaling between preview and projection
 * - Text scaling based on screen height (16:9 optimized)
 * - Real-time updates when displays change
 */

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

export interface ScalingConfig {
  // Base design canvas size (fixed design canvas - 16:9)
  baseWidth: number
  baseHeight: number

  // Target projection screen
  targetWidth: number
  targetHeight: number

  // Scaling factors
  scaleX: number
  scaleY: number
  uniformScale: number

  // Aspect ratio info
  baseAspectRatio: number
  targetAspectRatio: number

  // Text scaling (based on height for readability)
  textScaleFactor: number
}

// Base design canvas - 16:9 optimized for most projectors/TVs
const BASE_DESIGN_WIDTH = 1920
const BASE_DESIGN_HEIGHT = 1080

/**
 * Calculate scaling configuration for target display
 */
export function calculateScaling(targetDisplay: DisplayInfo): ScalingConfig {
  const { width: targetWidth, height: targetHeight } = targetDisplay.workArea

  const scaleX = targetWidth / BASE_DESIGN_WIDTH
  const scaleY = targetHeight / BASE_DESIGN_HEIGHT

  // Use the smaller scale factor to maintain aspect ratio
  const uniformScale = Math.min(scaleX, scaleY)

  const baseAspectRatio = BASE_DESIGN_WIDTH / BASE_DESIGN_HEIGHT
  const targetAspectRatio = targetWidth / targetHeight

  // Text scaling prioritizes readability - base on height
  const textScaleFactor = targetHeight / BASE_DESIGN_HEIGHT

  return {
    baseWidth: BASE_DESIGN_WIDTH,
    baseHeight: BASE_DESIGN_HEIGHT,
    targetWidth,
    targetHeight,
    scaleX,
    scaleY,
    uniformScale,
    baseAspectRatio,
    targetAspectRatio,
    textScaleFactor
  }
}

/**
 * Scale text size based on target screen height
 */
export function scaleTextSize(originalSize: number, config: ScalingConfig): number {
  // Scale based on height for consistent readability
  const scaledSize = originalSize * config.textScaleFactor

  // Ensure minimum readable size
  return Math.max(scaledSize, 12)
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
  const ratio4_3 = 4 / 3 // 1.333
  const ratioUltrawide = 21 / 9 // 2.333

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
 * Real-time screen detection utilities
 */
export class ScreenManager {
  private displays: DisplayInfo[] = []
  private currentProjectionDisplay: DisplayInfo | null = null
  private listeners: Array<(displays: DisplayInfo[]) => void> = []

  async initialize(): Promise<void> {
    try {
      // Get initial display information
      this.displays = (await window.electron?.ipcRenderer.invoke('get-displays')) || []
      this.currentProjectionDisplay =
        (await window.electron?.ipcRenderer.invoke('get-projection-display')) || null

      // Listen for display changes
      window.electron?.ipcRenderer.on('displays-changed', (_event, displays: DisplayInfo[]) => {
        this.displays = displays
        this.notifyListeners()
      })

      console.log('📺 [SCREEN-MANAGER] Initialized with displays:', this.displays)
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
        this.notifyListeners()
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

  getCurrentScalingConfig(): ScalingConfig | null {
    if (!this.currentProjectionDisplay) return null

    return calculateScaling(this.currentProjectionDisplay)
  }
}

// Singleton instance
export const screenManager = new ScreenManager()
