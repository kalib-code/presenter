/**
 * Resolution Types and Configuration for Multi-Resolution Support
 * 
 * Supports 4K, 2K, ultra-wide, and legacy resolutions with proper scaling
 */

export interface Resolution {
  width: number
  height: number
  aspectRatio: number
  category: ResolutionCategory
  name: string
  commonName: string
}

export type ResolutionCategory = 
  | '8k'
  | '4k' 
  | '2k'
  | '1080p'
  | 'hd'
  | 'legacy'

export type AspectRatioType = 
  | '16:9'
  | '21:9' 
  | '32:9'
  | '16:10'
  | '4:3'
  | '5:4'

export interface ResolutionProfile {
  resolution: Resolution
  textScale: number
  performanceLevel: 'ultra' | 'high' | 'balanced' | 'performance' | 'legacy'
  canvasScale: number
  dpiSupport: number[]
  recommendedSettings: {
    backgroundQuality: 'ultra' | 'high' | 'medium' | 'low'
    renderingPipeline: 'gpu' | 'cpu' | 'hybrid'
    enableOptimizations: boolean
  }
}

export interface ScalingConfiguration {
  baseResolution: Resolution
  targetResolution: Resolution
  scaleX: number
  scaleY: number
  uniformScale: number
  textScale: number
  aspectRatioStrategy: 'letterbox' | 'pillarbox' | 'stretch' | 'crop'
  dpiScale: number
}

// Comprehensive resolution definitions
export const SUPPORTED_RESOLUTIONS: Resolution[] = [
  // 8K Resolutions
  {
    width: 7680,
    height: 4320,
    aspectRatio: 16/9,
    category: '8k',
    name: '8K UHD',
    commonName: '8K'
  },

  // 4K Resolutions
  {
    width: 3840,
    height: 2160,
    aspectRatio: 16/9,
    category: '4k',
    name: '4K UHD',
    commonName: '4K'
  },
  {
    width: 4096,
    height: 2160,
    aspectRatio: 1.896,
    category: '4k',
    name: 'Cinema 4K',
    commonName: 'Cinema 4K'
  },
  {
    width: 3840,
    height: 1600,
    aspectRatio: 2.4,
    category: '4k',
    name: '4K Ultra-Wide',
    commonName: '4K Ultra-Wide'
  },

  // 2K Resolutions
  {
    width: 2560,
    height: 1440,
    aspectRatio: 16/9,
    category: '2k',
    name: '2K QHD',
    commonName: '2K'
  },
  {
    width: 2048,
    height: 1080,
    aspectRatio: 1.896,
    category: '2k',
    name: 'Cinema 2K',
    commonName: 'Cinema 2K'
  },
  {
    width: 3440,
    height: 1440,
    aspectRatio: 21/9,
    category: '2k',
    name: '2K Ultra-Wide',
    commonName: '2K Ultra-Wide'
  },
  {
    width: 5120,
    height: 1440,
    aspectRatio: 32/9,
    category: '2k',
    name: '2K Super Ultra-Wide',
    commonName: '2K Super Ultra-Wide'
  },

  // 1080p Resolutions (Base Reference)
  {
    width: 1920,
    height: 1080,
    aspectRatio: 16/9,
    category: '1080p',
    name: 'Full HD',
    commonName: '1080p'
  },
  {
    width: 2560,
    height: 1080,
    aspectRatio: 21/9,
    category: '1080p',
    name: '1080p Ultra-Wide',
    commonName: '1080p Ultra-Wide'
  },
  {
    width: 1920,
    height: 1200,
    aspectRatio: 16/10,
    category: '1080p',
    name: 'WUXGA',
    commonName: '1200p'
  },

  // HD Resolutions
  {
    width: 1366,
    height: 768,
    aspectRatio: 16/9,
    category: 'hd',
    name: 'HD',
    commonName: 'HD'
  },
  {
    width: 1280,
    height: 720,
    aspectRatio: 16/9,
    category: 'hd',
    name: 'HD Ready',
    commonName: '720p'
  },
  {
    width: 1440,
    height: 900,
    aspectRatio: 16/10,
    category: 'hd',
    name: 'WXGA+',
    commonName: '900p'
  },

  // Legacy Resolutions
  {
    width: 1024,
    height: 768,
    aspectRatio: 4/3,
    category: 'legacy',
    name: 'XGA',
    commonName: 'XGA'
  },
  {
    width: 800,
    height: 600,
    aspectRatio: 4/3,
    category: 'legacy',
    name: 'SVGA',
    commonName: 'SVGA'
  },
  {
    width: 1280,
    height: 1024,
    aspectRatio: 5/4,
    category: 'legacy',
    name: 'SXGA',
    commonName: 'SXGA'
  }
]

// Resolution profiles with scaling and performance settings
export const RESOLUTION_PROFILES: Record<ResolutionCategory, ResolutionProfile> = {
  '8k': {
    resolution: SUPPORTED_RESOLUTIONS.find(r => r.name === '8K UHD')!,
    textScale: 4.0,
    performanceLevel: 'ultra',
    canvasScale: 4.0,
    dpiSupport: [100, 125, 150, 175, 200, 250, 300],
    recommendedSettings: {
      backgroundQuality: 'ultra',
      renderingPipeline: 'gpu',
      enableOptimizations: true
    }
  },
  '4k': {
    resolution: SUPPORTED_RESOLUTIONS.find(r => r.name === '4K UHD')!,
    textScale: 2.0,
    performanceLevel: 'high',
    canvasScale: 2.0,
    dpiSupport: [100, 125, 150, 175, 200, 250],
    recommendedSettings: {
      backgroundQuality: 'high',
      renderingPipeline: 'gpu',
      enableOptimizations: true
    }
  },
  '2k': {
    resolution: SUPPORTED_RESOLUTIONS.find(r => r.name === '2K QHD')!,
    textScale: 1.33,
    performanceLevel: 'balanced',
    canvasScale: 1.33,
    dpiSupport: [100, 125, 150, 175, 200],
    recommendedSettings: {
      backgroundQuality: 'high',
      renderingPipeline: 'hybrid',
      enableOptimizations: true
    }
  },
  '1080p': {
    resolution: SUPPORTED_RESOLUTIONS.find(r => r.name === 'Full HD')!,
    textScale: 1.0,
    performanceLevel: 'balanced',
    canvasScale: 1.0,
    dpiSupport: [100, 125, 150, 175],
    recommendedSettings: {
      backgroundQuality: 'medium',
      renderingPipeline: 'hybrid',
      enableOptimizations: false
    }
  },
  'hd': {
    resolution: SUPPORTED_RESOLUTIONS.find(r => r.name === 'HD')!,
    textScale: 0.8,
    performanceLevel: 'performance',
    canvasScale: 0.8,
    dpiSupport: [100, 125, 150],
    recommendedSettings: {
      backgroundQuality: 'medium',
      renderingPipeline: 'cpu',
      enableOptimizations: true
    }
  },
  'legacy': {
    resolution: SUPPORTED_RESOLUTIONS.find(r => r.name === 'XGA')!,
    textScale: 0.5,
    performanceLevel: 'legacy',
    canvasScale: 0.5,
    dpiSupport: [100, 125],
    recommendedSettings: {
      backgroundQuality: 'low',
      renderingPipeline: 'cpu',
      enableOptimizations: true
    }
  }
}

// Utility functions
export function getResolutionCategory(width: number, height: number): ResolutionCategory {
  const pixelCount = width * height

  if (pixelCount >= 7680 * 4320 * 0.9) return '8k'
  if (pixelCount >= 3840 * 2160 * 0.9) return '4k'
  if (pixelCount >= 2560 * 1440 * 0.9) return '2k'
  if (pixelCount >= 1920 * 1080 * 0.9) return '1080p'
  if (pixelCount >= 1280 * 720 * 0.9) return 'hd'
  return 'legacy'
}

export function findBestMatchResolution(width: number, height: number): Resolution {
  const targetAspectRatio = width / height
  const category = getResolutionCategory(width, height)
  
  // Find exact match first
  const exactMatch = SUPPORTED_RESOLUTIONS.find(r => r.width === width && r.height === height)
  if (exactMatch) return exactMatch

  // Find best match in same category with closest aspect ratio
  const categoryMatches = SUPPORTED_RESOLUTIONS.filter(r => r.category === category)
  if (categoryMatches.length > 0) {
    return categoryMatches.reduce((best, current) => {
      const bestDiff = Math.abs(best.aspectRatio - targetAspectRatio)
      const currentDiff = Math.abs(current.aspectRatio - targetAspectRatio)
      return currentDiff < bestDiff ? current : best
    })
  }

  // Fallback to closest resolution by pixel count
  return SUPPORTED_RESOLUTIONS.reduce((best, current) => {
    const targetPixels = width * height
    const bestDiff = Math.abs((best.width * best.height) - targetPixels)
    const currentDiff = Math.abs((current.width * current.height) - targetPixels)
    return currentDiff < bestDiff ? current : best
  })
}

export function getAspectRatioType(aspectRatio: number): AspectRatioType {
  const ratios = {
    '16:9': 16/9,
    '21:9': 21/9,
    '32:9': 32/9,
    '16:10': 16/10,
    '4:3': 4/3,
    '5:4': 5/4
  }

  const tolerance = 0.05
  for (const [name, ratio] of Object.entries(ratios)) {
    if (Math.abs(aspectRatio - ratio) < tolerance) {
      return name as AspectRatioType
    }
  }

  // Default to closest standard ratio
  return aspectRatio > 2.5 ? '32:9' : aspectRatio > 2 ? '21:9' : '16:9'
}

export function calculateOptimalTextSize(
  baseSize: number, 
  targetResolution: Resolution, 
  dpiScale: number = 1
): number {
  const profile = RESOLUTION_PROFILES[targetResolution.category]
  const scaledSize = baseSize * profile.textScale * dpiScale
  
  // Ensure minimum readable size
  return Math.max(scaledSize, 8)
}

export function isUltraWideDisplay(aspectRatio: number): boolean {
  return aspectRatio >= 2.1 // 21:9 or wider
}

export function isSuperUltraWideDisplay(aspectRatio: number): boolean {
  return aspectRatio >= 3.0 // 32:9 or wider
}

export function isHighDpiDisplay(dpiScale: number): boolean {
  return dpiScale >= 1.5
}