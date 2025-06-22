/**
 * Media utilities for handling media references and URL resolution
 */

// Helper function to resolve media references to actual URLs
export const resolveMediaUrl = async (content: string): Promise<string> => {
  // Check if content is a media reference (starts with "media://")
  if (content.startsWith('media://')) {
    const filename = content.replace('media://', '')
    console.log('🔍 [MEDIA_UTILS] Resolving media reference:', filename)

    // Debug: Check what's available in the window context
    console.log('🔍 [MEDIA_UTILS] Window context debug:', {
      hasElectron: !!window.electron,
      hasElectronInvoke: !!(window.electron && window.electron.invoke),
      hasRequire: !!(window as { require?: unknown }).require,
      hasProcess: typeof process !== 'undefined',
      contextIsolated: typeof process !== 'undefined' ? process.contextIsolated : 'unknown'
    })

    // Try multiple methods to access IPC
    let ipcResult: string | null = null

    // Method 1: Use preload API if available
    if (window.electron && window.electron.invoke) {
      console.log('🔍 [MEDIA_UTILS] Using preload API')
      try {
        ipcResult = await window.electron.invoke('get-media-data-url', filename)
      } catch (error) {
        console.error('❌ [MEDIA_UTILS] Preload API failed:', error)
      }
    }

    // Method 2: Try direct electron access if preload failed
    if (
      !ipcResult &&
      (
        window as {
          require?: (module: string) => {
            ipcRenderer: { invoke: (channel: string, ...args: unknown[]) => Promise<unknown> }
          }
        }
      ).require
    ) {
      console.log('🔍 [MEDIA_UTILS] Trying direct electron access')
      try {
        const electronModule = (
          window as {
            require: (module: string) => {
              ipcRenderer: { invoke: (channel: string, ...args: unknown[]) => Promise<unknown> }
            }
          }
        ).require('electron')
        ipcResult = (await electronModule.ipcRenderer.invoke('get-media-data-url', filename)) as
          | string
          | null
      } catch (error) {
        console.error('❌ [MEDIA_UTILS] Direct electron access failed:', error)
      }
    }

    // If no IPC access available, generate placeholder
    if (!ipcResult) {
      console.log(
        '❌ [MEDIA_UTILS] No IPC access available or file not found, generating placeholder'
      )
      return generatePlaceholderDataUrl(filename)
    }

    console.log('✅ [MEDIA_UTILS] IPC response received:', {
      success: !!ipcResult,
      isDataUrl: ipcResult.startsWith('data:'),
      responseType: typeof ipcResult,
      urlLength: ipcResult.length
    })

    return ipcResult
  }

  // If it's already a data URL or regular URL, return as-is
  return content
}

// Generate a placeholder data URL for missing media files
const generatePlaceholderDataUrl = (filename: string): string => {
  // Create a simple SVG placeholder
  const isVideo = filename.toLowerCase().match(/\.(mp4|webm|mov|avi)$/i)
  const isImage = filename.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i)

  let svg: string

  if (isVideo) {
    svg = `
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" fill="#333"/>
        <text x="200" y="130" text-anchor="middle" fill="white" font-family="Arial" font-size="14">
          Video Not Found
        </text>
        <text x="200" y="150" text-anchor="middle" fill="#ccc" font-family="Arial" font-size="12">
          ${filename}
        </text>
        <circle cx="200" cy="180" r="25" fill="white" opacity="0.7"/>
        <polygon points="190,170 190,190 210,180" fill="#333"/>
      </svg>
    `
  } else if (isImage) {
    svg = `
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" fill="#f0f0f0"/>
        <text x="200" y="130" text-anchor="middle" fill="#666" font-family="Arial" font-size="14">
          Image Not Found
        </text>
        <text x="200" y="150" text-anchor="middle" fill="#999" font-family="Arial" font-size="12">
          ${filename}
        </text>
        <rect x="170" y="170" width="60" height="40" fill="none" stroke="#999" stroke-width="2"/>
        <circle cx="180" cy="185" r="5" fill="#999"/>
        <polygon points="185,195 195,185 205,195 200,200 190,200" fill="#999"/>
      </svg>
    `
  } else {
    svg = `
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" fill="#444"/>
        <text x="200" y="130" text-anchor="middle" fill="white" font-family="Arial" font-size="14">
          Media Not Found
        </text>
        <text x="200" y="150" text-anchor="middle" fill="#ccc" font-family="Arial" font-size="12">
          ${filename}
        </text>
        <rect x="180" y="170" width="40" height="30" fill="none" stroke="white" stroke-width="2"/>
        <text x="200" y="187" text-anchor="middle" fill="white" font-family="Arial" font-size="10">?</text>
      </svg>
    `
  }

  return `data:image/svg+xml;base64,${btoa(svg)}`
}

// Check if a content string is a media reference
export const isMediaReference = (content: string): boolean => {
  return content.startsWith('media://')
}

// Extract filename from media reference
export const getFilenameFromMediaReference = (content: string): string => {
  if (isMediaReference(content)) {
    return content.replace('media://', '')
  }
  return content
}

// Create a media reference from filename
export const createMediaReference = (filename: string): string => {
  return `media://${filename}`
}
