/**
 * Font utilities for the presentation editor
 * Provides system font stacks and font enumeration capabilities
 */

// System font stacks optimized for different platforms
export const SYSTEM_FONT_STACKS = {
  // Primary system font stack - uses each OS's native UI font
  sansSerif:
    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif",

  // System serif fonts - good for presentations with traditional feel
  serif: "'New York', 'Times New Roman', Times, 'Droid Serif', 'Source Serif Pro', serif",

  // System monospace fonts - perfect for code or technical content
  monospace: "'SF Mono', Monaco, Menlo, Consolas, 'Liberation Mono', 'Courier New', monospace",

  // Alternative system stacks
  rounded: "ui-rounded, 'SF Pro Rounded', system-ui, sans-serif",

  // GitHub's system font stack (popular alternative)
  github:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'"
} as const

// Font categories for UI organization
export const FONT_CATEGORIES = [
  {
    label: 'System Fonts',
    description: 'Native fonts that match your operating system',
    fonts: [
      { name: 'System Default (Sans-serif)', value: SYSTEM_FONT_STACKS.sansSerif, preview: 'Aa' },
      { name: 'System Serif', value: SYSTEM_FONT_STACKS.serif, preview: 'Aa' },
      { name: 'System Monospace', value: SYSTEM_FONT_STACKS.monospace, preview: 'Aa' }
    ]
  },
  {
    label: 'Web Safe Fonts',
    description: 'Fonts available on most systems',
    fonts: [
      { name: 'Arial', value: 'Arial', preview: 'Aa' },
      { name: 'Helvetica', value: 'Helvetica', preview: 'Aa' },
      { name: 'Times New Roman', value: 'Times New Roman', preview: 'Aa' },
      { name: 'Georgia', value: 'Georgia', preview: 'Aa' },
      { name: 'Verdana', value: 'Verdana', preview: 'Aa' },
      { name: 'Trebuchet MS', value: 'Trebuchet MS', preview: 'Aa' },
      { name: 'Impact', value: 'Impact', preview: 'Aa' },
      { name: 'Comic Sans MS', value: 'Comic Sans MS', preview: 'Aa' }
    ]
  }
] as const

// Platform-specific font information
export const PLATFORM_FONTS = {
  macOS: {
    systemFont: 'San Francisco',
    versions: {
      'Monterey+': 'San Francisco Pro (Variable)',
      'El Capitan+': 'San Francisco',
      Yosemite: 'Helvetica Neue',
      'Mavericks-': 'Lucida Grande'
    }
  },
  windows: {
    systemFont: 'Segoe UI',
    versions: {
      'Vista+': 'Segoe UI',
      XP: 'Tahoma',
      'ME-': 'Microsoft Sans Serif'
    }
  },
  linux: {
    systemFont: 'varies',
    common: ['Ubuntu', 'Cantarell', 'DejaVu Sans', 'Liberation Sans', 'Noto Sans']
  },
  android: {
    systemFont: 'Roboto',
    versions: {
      'Ice Cream Sandwich+': 'Roboto',
      'Cupcake-Honeycomb': 'Droid Sans'
    }
  }
} as const

/**
 * Get system fonts from the main process
 * This is an async function that communicates with Electron's main process
 */
export async function getSystemFonts(): Promise<string[]> {
  try {
    if (window.electron?.invoke) {
      return await window.electron.invoke('get-system-fonts')
    }
    return []
  } catch (error) {
    console.error('Failed to get system fonts:', error)
    return []
  }
}

/**
 * Check if a font is available on the current system
 * Uses a canvas-based detection method
 */
export function isFontAvailable(fontName: string): boolean {
  try {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) return false

    // Test text
    const testText = 'abcdefghijklmnopqrstuvwxyz0123456789'

    // Measure with fallback font
    context.font = '72px monospace'
    const fallbackWidth = context.measureText(testText).width

    // Measure with target font
    context.font = `72px "${fontName}", monospace`
    const targetWidth = context.measureText(testText).width

    // If widths differ, the font is likely available
    return Math.abs(targetWidth - fallbackWidth) > 1
  } catch (error) {
    console.error('Font detection error:', error)
    return false
  }
}

/**
 * Get a font stack with fallbacks
 * Ensures graceful degradation if primary font isn't available
 */
export function createFontStack(
  primaryFont: string,
  category: 'sans-serif' | 'serif' | 'monospace' = 'sans-serif'
): string {
  const fallbacks = {
    'sans-serif': SYSTEM_FONT_STACKS.sansSerif,
    serif: SYSTEM_FONT_STACKS.serif,
    monospace: SYSTEM_FONT_STACKS.monospace
  }

  return `"${primaryFont}", ${fallbacks[category]}`
}

/**
 * Parse font family string to extract the primary font name
 */
export function getPrimaryFontName(fontFamily: string): string {
  // Extract first font from comma-separated list
  const firstFont = fontFamily.split(',')[0].trim()
  // Remove quotes if present
  return firstFont.replace(/['"]/g, '')
}

/**
 * Get display name for font (for UI purposes)
 */
export function getFontDisplayName(fontFamily: string): string {
  const primaryFont = getPrimaryFontName(fontFamily)

  // Check if it's a system font stack
  if (fontFamily === SYSTEM_FONT_STACKS.sansSerif) {
    return 'System Default (Sans-serif)'
  }
  if (fontFamily === SYSTEM_FONT_STACKS.serif) {
    return 'System Serif'
  }
  if (fontFamily === SYSTEM_FONT_STACKS.monospace) {
    return 'System Monospace'
  }

  return primaryFont
}

/**
 * Get font metrics for layout calculations
 */
export function getFontMetrics(
  fontFamily: string,
  fontSize: number
): { width: number; height: number } {
  try {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) return { width: 0, height: fontSize }

    context.font = `${fontSize}px ${fontFamily}`
    const metrics = context.measureText('M') // Use 'M' as it's typically the widest character

    return {
      width: metrics.width,
      height: fontSize * 1.2 // Approximate line height
    }
  } catch (error) {
    console.error('Font metrics error:', error)
    return { width: fontSize * 0.6, height: fontSize * 1.2 }
  }
}

// Custom font types
export interface CustomFont {
  id: string
  name: string
  fileName: string
  originalName: string
  filePath: string
  fileSize: number
  uploadDate: string
  type: 'custom'
}

export interface FontUploadResult {
  success: boolean
  fonts?: CustomFont[]
  message: string
}

// Custom font management functions
export async function uploadCustomFonts(): Promise<FontUploadResult> {
  try {
    return await window.electron.ipcRenderer.invoke('upload-custom-font')
  } catch (error) {
    console.error('Failed to upload custom fonts:', error)
    return { success: false, message: 'Failed to upload fonts' }
  }
}

export async function getCustomFonts(): Promise<CustomFont[]> {
  try {
    return await window.electron.ipcRenderer.invoke('get-custom-fonts')
  } catch (error) {
    console.error('Failed to get custom fonts:', error)
    return []
  }
}

export async function deleteCustomFont(
  fontId: string
): Promise<{ success: boolean; message: string }> {
  try {
    return await window.electron.ipcRenderer.invoke('delete-custom-font', fontId)
  } catch (error) {
    console.error('Failed to delete custom font:', error)
    return { success: false, message: 'Failed to delete font' }
  }
}

export async function getFontUrl(fontId: string): Promise<string | null> {
  try {
    return await window.electron.ipcRenderer.invoke('get-font-url', fontId)
  } catch (error) {
    console.error('Failed to get font URL:', error)
    return null
  }
}

// Load custom font into CSS
export async function loadCustomFont(font: CustomFont): Promise<boolean> {
  try {
    const fontUrl = await getFontUrl(font.id)
    if (!fontUrl) return false

    // Create a new FontFace object
    const fontFace = new FontFace(font.name, `url("${fontUrl}")`)

    // Load the font
    await fontFace.load()

    // Add it to the document's font set
    document.fonts.add(fontFace)

    console.log(`✅ Custom font loaded: ${font.name}`)
    return true
  } catch (error) {
    console.error(`❌ Failed to load custom font ${font.name}:`, error)
    return false
  }
}

// Load all custom fonts
export async function loadAllCustomFonts(): Promise<void> {
  try {
    const customFonts = await getCustomFonts()

    const loadPromises = customFonts.map((font) => loadCustomFont(font))
    const results = await Promise.allSettled(loadPromises)

    const successful = results.filter((r) => r.status === 'fulfilled' && r.value).length
    const failed = results.length - successful

    console.log(`📝 Custom fonts loaded: ${successful} successful, ${failed} failed`)
  } catch (error) {
    console.error('Failed to load custom fonts:', error)
  }
}

// Get all available fonts (system + custom)
export async function getAllAvailableFonts(): Promise<{
  system: string[]
  custom: CustomFont[]
}> {
  try {
    const [systemFonts, customFonts] = await Promise.all([getSystemFonts(), getCustomFonts()])

    return {
      system: systemFonts,
      custom: customFonts
    }
  } catch (error) {
    console.error('Failed to get all available fonts:', error)
    return {
      system: [],
      custom: []
    }
  }
}

// Format font name for CSS usage
export function formatFontNameForCSS(fontName: string): string {
  // If font name contains spaces or special characters, wrap in quotes
  if (/[\s,'"()]/.test(fontName)) {
    return `"${fontName}"`
  }
  return fontName
}

// Create font stack with custom font
export function createCustomFontStack(customFontName: string, fallbacks: string[] = []): string {
  const formattedCustomFont = formatFontNameForCSS(customFontName)
  const defaultFallbacks = ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif']
  const allFallbacks = [...fallbacks, ...defaultFallbacks]

  return [formattedCustomFont, ...allFallbacks].join(', ')
}

// Validate font file
export function validateFontFile(file: File): { valid: boolean; error?: string } {
  const validExtensions = ['.ttf', '.otf', '.woff', '.woff2', '.eot']
  const maxSize = 10 * 1024 * 1024 // 10MB

  const extension = '.' + file.name.split('.').pop()?.toLowerCase()

  if (!validExtensions.includes(extension)) {
    return {
      valid: false,
      error: `Unsupported font format. Supported formats: ${validExtensions.join(', ')}`
    }
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Font file too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB`
    }
  }

  return { valid: true }
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
