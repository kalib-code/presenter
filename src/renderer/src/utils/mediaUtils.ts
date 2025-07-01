/**
 * Media utilities for handling media references and URL resolution
 */

// Simple URL cache to prevent burst requests to backend
const urlCache = new Map<string, string>()
const cacheTimestamps = new Map<string, number>()
const CACHE_DURATION = 30000 // 30 seconds cache duration

// Helper function to check if content is a media reference
export const isMediaReference = (content: string): boolean => {
  return content.startsWith('media://')
}

// Helper function to resolve media references to actual URLs
export const resolveMediaUrl = async (content: string): Promise<string> => {
  // Check if content is a media reference (starts with "media://")
  if (content.startsWith('media://')) {
    const filename = content.replace('media://', '')
    
    // Check cache first to prevent burst requests
    const now = Date.now()
    if (urlCache.has(content) && cacheTimestamps.has(content)) {
      const cacheTime = cacheTimestamps.get(content)!
      if (now - cacheTime < CACHE_DURATION) {
        const cachedUrl = urlCache.get(content)!
        console.log('📋 [MEDIA_UTILS] Using cached URL for:', filename)
        return cachedUrl
      } else {
        // Cache expired, remove old entries
        urlCache.delete(content)
        cacheTimestamps.delete(content)
      }
    }
    
    console.log('🔍 [MEDIA_UTILS] Resolving media reference:', filename)

    // Try to get file URL first (more efficient)
    if (window.electron && window.electron.invoke) {
      try {
        const fileUrl = await window.electron.invoke('get-media-file-url', filename)
        if (fileUrl) {
          console.log('✅ [MEDIA_UTILS] Got file URL:', filename)
          // Cache the resolved URL
          urlCache.set(content, fileUrl)
          cacheTimestamps.set(content, Date.now())
          return fileUrl
        }
      } catch (error) {
        console.warn('⚠️ [MEDIA_UTILS] File URL failed, falling back to data URL:', error)
      }
    }

    // Fallback to data URL for compatibility
    if (window.electron && window.electron.invoke) {
      try {
        const dataUrl = await window.electron.invoke('get-media-data-url', filename)
        if (dataUrl) {
          console.log('✅ [MEDIA_UTILS] Got data URL fallback:', filename)
          // Cache the resolved URL
          urlCache.set(content, dataUrl)
          cacheTimestamps.set(content, Date.now())
          return dataUrl
        }
      } catch (error) {
        console.error('❌ [MEDIA_UTILS] Both file URL and data URL failed:', error)
      }
    }

    // If no IPC access available, generate placeholder
    console.log(
      '❌ [MEDIA_UTILS] No IPC access available or file not found, generating placeholder'
    )
    return generatePlaceholderDataUrl(filename)
  }

  // Check if content is a base64 data URL - return as-is for legacy support
  if (content.startsWith('data:')) {
    console.log('📋 [MEDIA_UTILS] Detected base64 data URL, using as-is (legacy support)')
    return content
  }

  // If it's already a URL, return as-is
  return content
}

// New function to get file URL (more efficient than data URL)
export const getMediaFileUrl = async (filename: string): Promise<string> => {
  if (window.electron && window.electron.invoke) {
    try {
      const fileUrl = await window.electron.invoke('get-media-file-url', filename)
      return fileUrl || generatePlaceholderDataUrl(filename)
    } catch (error) {
      console.error('❌ [MEDIA_UTILS] Failed to get file URL:', error)
      return generatePlaceholderDataUrl(filename)
    }
  }
  return generatePlaceholderDataUrl(filename)
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

// Helper to save file to media folder and return media reference
export const saveFileToMedia = async (file: File): Promise<string> => {
  if (!window.electron || !window.electron.invoke) {
    throw new Error('Electron IPC not available')
  }

  try {
    // Convert file to buffer for IPC
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Save file and get filename
    const result = await window.electron.invoke('save-media-file', {
      filename: file.name,
      buffer: Array.from(buffer),
      mimeType: file.type,
      size: file.size
    })

    console.log('✅ [MEDIA_UTILS] File saved to media folder:', result.filename)
    return createMediaReference(result.filename)
  } catch (error) {
    console.error('❌ [MEDIA_UTILS] Failed to save file to media:', error)
    throw error
  }
}

// Helper to check if a media file exists
export const mediaFileExists = async (filename: string): Promise<boolean> => {
  if (!window.electron || !window.electron.invoke) {
    return false
  }

  try {
    return await window.electron.invoke('media-file-exists', filename)
  } catch (error) {
    console.error('❌ [MEDIA_UTILS] Failed to check media file existence:', error)
    return false
  }
}
