/**
 * Canvas Constants for Multi-Resolution Slide Rendering
 *
 * Adaptive canvas dimensions that scale based on target resolution
 * Supports 4K, 2K, ultra-wide, and legacy displays
 */

import { Resolution, ResolutionCategory, RESOLUTION_PROFILES } from '@renderer/types/resolution'

// Base design canvas - 1920x1080 (Full HD) as reference
export const BASE_CANVAS_WIDTH = 1920
export const BASE_CANVAS_HEIGHT = 1080
export const BASE_ASPECT_RATIO = 16 / 9

// Legacy canvas dimensions for compatibility (will be deprecated)
export const CANVAS_WIDTH = 960
export const CANVAS_HEIGHT = 540

// Canvas scaling factors for different resolution categories
export const CANVAS_SCALE_FACTORS: Record<ResolutionCategory, number> = {
  '8k': 4.0,     // 7680x4320
  '4k': 2.0,     // 3840x2160  
  '2k': 1.33,    // 2560x1440
  '1080p': 1.0,  // 1920x1080 (base)
  'hd': 0.75,    // 1366x768, 1280x720
  'legacy': 0.5  // 1024x768, 800x600
}

// Adaptive canvas dimensions based on resolution category
export function getCanvasDimensions(category: ResolutionCategory): {
  width: number
  height: number
  scale: number
} {
  const scale = CANVAS_SCALE_FACTORS[category]
  return {
    width: Math.round(BASE_CANVAS_WIDTH * scale),
    height: Math.round(BASE_CANVAS_HEIGHT * scale),
    scale
  }
}

// Get canvas dimensions for specific resolution
export function getCanvasDimensionsForResolution(resolution: Resolution): {
  width: number
  height: number
  scale: number
  aspectRatio: number
} {
  const profile = RESOLUTION_PROFILES[resolution.category]
  const scale = profile.canvasScale
  
  // Adjust for aspect ratio if needed
  let width = BASE_CANVAS_WIDTH * scale
  let height = BASE_CANVAS_HEIGHT * scale
  
  // For ultra-wide displays, adjust canvas to match aspect ratio
  if (resolution.aspectRatio > 2.0) {
    // Ultra-wide: expand width while maintaining height
    width = height * resolution.aspectRatio
  } else if (resolution.aspectRatio < 1.5) {
    // Taller displays: expand height while maintaining width  
    height = width / resolution.aspectRatio
  }
  
  return {
    width: Math.round(width),
    height: Math.round(height),
    scale,
    aspectRatio: resolution.aspectRatio
  }
}

// Editor canvas dimensions (always use base for consistency)
export function getEditorCanvasDimensions(): {
  width: number
  height: number
} {
  return {
    width: CANVAS_WIDTH,  // Legacy 960x540 for editor
    height: CANVAS_HEIGHT
  }
}

// Preview canvas dimensions (scaled down for UI)
export function getPreviewCanvasDimensions(
  containerWidth: number,
  containerHeight: number,
  targetAspectRatio: number = BASE_ASPECT_RATIO
): {
  width: number
  height: number
  offsetX: number
  offsetY: number
  scale: number
} {
  const containerAspectRatio = containerWidth / containerHeight
  
  let width: number, height: number
  
  if (containerAspectRatio > targetAspectRatio) {
    // Container is wider - fit by height
    height = containerHeight
    width = height * targetAspectRatio
  } else {
    // Container is taller - fit by width
    width = containerWidth
    height = width / targetAspectRatio
  }
  
  const offsetX = (containerWidth - width) / 2
  const offsetY = (containerHeight - height) / 2
  const scale = width / BASE_CANVAS_WIDTH
  
  return {
    width: Math.round(width),
    height: Math.round(height),
    offsetX: Math.round(offsetX),
    offsetY: Math.round(offsetY),
    scale
  }
}

// Get optimal canvas dimensions for projection
export function getProjectionCanvasDimensions(
  targetWidth: number,
  targetHeight: number
): {
  width: number
  height: number
  scale: number
  aspectRatio: number
} {
  const targetAspectRatio = targetWidth / targetHeight
  const category = getResolutionCategoryFromDimensions(targetWidth, targetHeight)
  
  const { width: canvasWidth, height: canvasHeight, scale } = getCanvasDimensions(category)
  
  // Adjust for exact aspect ratio if needed
  let finalWidth = canvasWidth
  let finalHeight = canvasHeight
  
  if (Math.abs(targetAspectRatio - BASE_ASPECT_RATIO) > 0.1) {
    // Adjust canvas to match target aspect ratio
    if (targetAspectRatio > BASE_ASPECT_RATIO) {
      finalWidth = finalHeight * targetAspectRatio
    } else {
      finalHeight = finalWidth / targetAspectRatio
    }
  }
  
  return {
    width: Math.round(finalWidth),
    height: Math.round(finalHeight),
    scale,
    aspectRatio: targetAspectRatio
  }
}

// Helper function to determine resolution category from dimensions
function getResolutionCategoryFromDimensions(width: number, height: number): ResolutionCategory {
  const pixelCount = width * height
  
  if (pixelCount >= 7680 * 4320 * 0.9) return '8k'
  if (pixelCount >= 3840 * 2160 * 0.9) return '4k'
  if (pixelCount >= 2560 * 1440 * 0.9) return '2k'
  if (pixelCount >= 1920 * 1080 * 0.9) return '1080p'
  if (pixelCount >= 1280 * 720 * 0.9) return 'hd'
  return 'legacy'
}

// Canvas viewport utilities
export function calculateCanvasViewport(
  canvasWidth: number,
  canvasHeight: number,
  containerWidth: number,
  containerHeight: number
): {
  viewportWidth: number
  viewportHeight: number
  offsetX: number
  offsetY: number
  scale: number
} {
  const scaleX = containerWidth / canvasWidth
  const scaleY = containerHeight / canvasHeight
  const scale = Math.min(scaleX, scaleY)
  
  const viewportWidth = canvasWidth * scale
  const viewportHeight = canvasHeight * scale
  const offsetX = (containerWidth - viewportWidth) / 2
  const offsetY = (containerHeight - viewportHeight) / 2
  
  return {
    viewportWidth: Math.round(viewportWidth),
    viewportHeight: Math.round(viewportHeight),
    offsetX: Math.round(offsetX),
    offsetY: Math.round(offsetY),
    scale
  }
}

// Text scaling constants
export const TEXT_SCALE_FACTORS: Record<ResolutionCategory, number> = {
  '8k': 4.0,
  '4k': 2.0,
  '2k': 1.33,
  '1080p': 1.0,
  'hd': 0.8,
  'legacy': 0.5
}

// Get text scale factor for resolution category
export function getTextScaleFactor(category: ResolutionCategory): number {
  return TEXT_SCALE_FACTORS[category]
}
