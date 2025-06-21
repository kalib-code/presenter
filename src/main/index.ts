import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { open } from 'lmdb'

// Import types from the shared types file
import type { Song, Media } from './types/database'
// TODO: Import these when implementing their IPC handlers
// import type { Setlist, Presentation, Template, Settings } from './types/database'

// Legacy types for backward compatibility (will be removed)
export type LegacySong = { id: string; name: string }
export type Slide = { id: string; title: string; content: string; createdAt: string }
export type Image = { id: string; name: string; filePath: string; size: number; createdAt: string }
export type Video = {
  id: string
  name: string
  filePath: string
  duration: number
  size: number
  createdAt: string
}
export type Audio = {
  id: string
  name: string
  filePath: string
  duration: number
  size: number
  createdAt: string
}

// LMDB databases
const songDb = open<Song>({
  path: join(app.getPath('userData'), 'songs.lmdb'),
  compression: true
})

// TODO: Initialize these databases when implementing their IPC handlers
// const setlistDb = open<Setlist>({
//   path: join(app.getPath('userData'), 'setlists.lmdb'),
//   compression: true
// })

// const presentationDb = open<Presentation>({
//   path: join(app.getPath('userData'), 'presentations.lmdb'),
//   compression: true
// })

const mediaDb = open<Media>({
  path: join(app.getPath('userData'), 'media.lmdb'),
  compression: true
})

// const templateDb = open<Template>({
//   path: join(app.getPath('userData'), 'templates.lmdb'),
//   compression: true
// })

// const settingsDb = open<Settings>({
//   path: join(app.getPath('userData'), 'settings.lmdb'),
//   compression: true
// })

// Legacy databases (will be migrated)
const slideDb = open<Slide>({
  path: join(app.getPath('userData'), 'slides.lmdb'),
  compression: true
})

const imageDb = open<Image>({
  path: join(app.getPath('userData'), 'images.lmdb'),
  compression: true
})

const videoDb = open<Video>({
  path: join(app.getPath('userData'), 'videos.lmdb'),
  compression: true
})

const audioDb = open<Audio>({
  path: join(app.getPath('userData'), 'audio.lmdb'),
  compression: true
})

// Utility function to generate ID
function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).slice(2)
}

// Song CRUD operations
async function seedSongs(): Promise<void> {
  const keys = Array.from(songDb.getKeys({ limit: 1 }))
  if (keys.length > 0) return

  const defaultSongs = [
    'Amazing Grace',
    'How Great Thou Art',
    '10,000 Reasons',
    'Great Is Thy Faithfulness',
    'Blessed Be Your Name'
  ]

  const now = Date.now()
  await Promise.all(
    defaultSongs.map(async (title) => {
      const id = generateId()
      const song: Song = {
        id,
        name: title,
        lyrics: '',
        slides: [],
        tags: [],
        isPublic: true,
        createdAt: now,
        updatedAt: now,
        createdBy: 'system',
        version: 1
      }
      await songDb.put(id, song)
    })
  )
}

async function listSongs(): Promise<Song[]> {
  const songs: Song[] = []
  for (const { value } of songDb.getRange()) {
    if (value) songs.push(value)
  }
  return songs
}

async function createSong(name: string): Promise<Song[]> {
  const id = generateId()
  const now = Date.now()
  const song: Song = {
    id,
    name,
    lyrics: '',
    slides: [],
    tags: [],
    isPublic: true,
    createdAt: now,
    updatedAt: now,
    createdBy: 'system',
    version: 1
  }
  await songDb.put(id, song)
  return await listSongs()
}

async function getSong(id: string): Promise<Song | null> {
  return (await songDb.get(id)) || null
}

async function updateSong(id: string, data: Partial<Song>): Promise<Song[]> {
  const existing = await songDb.get(id)
  if (!existing) throw new Error('Song not found')

  const updated: Song = {
    ...existing,
    ...data,
    id, // Ensure ID doesn't change
    updatedAt: Date.now(),
    version: existing.version + 1
  }

  await songDb.put(id, updated)
  return await listSongs()
}

async function deleteSong(id: string): Promise<Song[]> {
  if (!id || id.trim() === '') {
    throw new Error('Cannot delete song: ID is empty or undefined')
  }

  await songDb.remove(id)
  return await listSongs()
}

// Media CRUD operations
async function listMedia(): Promise<Media[]> {
  const media: Media[] = []
  for (const { value } of mediaDb.getRange()) {
    if (value) media.push(value)
  }
  return media
}

async function createMedia(
  data: Omit<Media, 'id' | 'createdAt' | 'updatedAt' | 'version'>
): Promise<Media[]> {
  const id = generateId()
  const now = Date.now()
  const media: Media = {
    ...data,
    id,
    createdAt: now,
    updatedAt: now,
    version: 1
  }
  await mediaDb.put(id, media)
  return await listMedia()
}

async function getMedia(id: string): Promise<Media | null> {
  return (await mediaDb.get(id)) || null
}

async function updateMedia(id: string, data: Partial<Media>): Promise<Media[]> {
  const existing = await mediaDb.get(id)
  if (!existing) throw new Error('Media not found')

  const updated: Media = {
    ...existing,
    ...data,
    id,
    updatedAt: Date.now(),
    version: existing.version + 1
  }

  await mediaDb.put(id, updated)
  return await listMedia()
}

async function deleteMedia(id: string): Promise<Media[]> {
  await mediaDb.remove(id)
  return await listMedia()
}

// Legacy functions (keeping for backward compatibility)
async function seedSlides(): Promise<void> {
  const keys = Array.from(slideDb.getKeys({ limit: 1 }))
  if (keys.length > 0) return

  const defaultSlides = [
    { title: 'Welcome', content: 'Welcome to our service!' },
    { title: 'Announcements', content: 'Church announcements go here' }
  ]

  await Promise.all(
    defaultSlides.map(async (slide) => {
      const id = generateId()
      await slideDb.put(id, {
        id,
        title: slide.title,
        content: slide.content,
        createdAt: new Date().toISOString()
      })
    })
  )
}

async function listSlides(): Promise<Slide[]> {
  const slides: Slide[] = []
  for (const { value } of slideDb.getRange()) {
    if (value) slides.push(value)
  }
  return slides
}

async function createSlide(title: string, content: string): Promise<Slide[]> {
  const id = generateId()
  await slideDb.put(id, {
    id,
    title,
    content,
    createdAt: new Date().toISOString()
  })
  return await listSlides()
}

async function deleteSlide(id: string): Promise<Slide[]> {
  await slideDb.remove(id)
  return await listSlides()
}

// Image CRUD operations
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function seedImages(): Promise<void> {
  const keys = Array.from(imageDb.getKeys({ limit: 1 }))
  if (keys.length > 0) return

  const defaultImages = [
    { name: 'Church Logo.png', filePath: '/images/church-logo.png', size: 45000 },
    { name: 'Background.jpg', filePath: '/images/background.jpg', size: 120000 }
  ]

  await Promise.all(
    defaultImages.map(async (image) => {
      const id = generateId()
      await imageDb.put(id, {
        id,
        name: image.name,
        filePath: image.filePath,
        size: image.size,
        createdAt: new Date().toISOString()
      })
    })
  )
}

async function createImage(name: string, filePath: string, size: number): Promise<void> {
  const id = generateId()
  await imageDb.put(id, { id, name, filePath, size, createdAt: new Date().toISOString() })
}

async function listImages(): Promise<Image[]> {
  const images: Image[] = []
  for (const { value } of imageDb.getRange()) {
    if (value) images.push(value)
  }
  return images
}

async function deleteImage(id: string): Promise<void> {
  await imageDb.remove(id)
}

// Video CRUD operations

async function createVideo(
  name: string,
  filePath: string,
  duration: number,
  size: number
): Promise<void> {
  const id = generateId()
  await videoDb.put(id, { id, name, filePath, duration, size, createdAt: new Date().toISOString() })
}

async function listVideos(): Promise<Video[]> {
  const videos: Video[] = []
  for (const { value } of videoDb.getRange()) {
    if (value) videos.push(value)
  }
  return videos
}

async function deleteVideo(id: string): Promise<void> {
  await videoDb.remove(id)
}

// Audio CRUD operations

async function createAudio(
  name: string,
  filePath: string,
  duration: number,
  size: number
): Promise<void> {
  const id = generateId()
  await audioDb.put(id, { id, name, filePath, duration, size, createdAt: new Date().toISOString() })
}

async function listAudio(): Promise<Audio[]> {
  const audio: Audio[] = []
  for (const { value } of audioDb.getRange()) {
    if (value) audio.push(value)
  }
  return audio
}

async function deleteAudio(id: string): Promise<void> {
  await audioDb.remove(id)
}

// Clear all databases
async function clearAllDatabases(): Promise<void> {
  console.log('Clearing all databases...')

  // Clear songs
  for (const { key } of songDb.getRange()) {
    await songDb.remove(key)
  }
  console.log('Songs database cleared')

  // Clear media
  for (const { key } of mediaDb.getRange()) {
    await mediaDb.remove(key)
  }
  console.log('Media database cleared')

  // Clear slides
  for (const { key } of slideDb.getRange()) {
    await slideDb.remove(key)
  }
  console.log('Slides database cleared')

  // Clear images
  for (const { key } of imageDb.getRange()) {
    await imageDb.remove(key)
  }
  console.log('Images database cleared')

  // Clear videos
  for (const { key } of videoDb.getRange()) {
    await videoDb.remove(key)
  }
  console.log('Videos database cleared')

  // Clear audio
  for (const { key } of audioDb.getRange()) {
    await audioDb.remove(key)
  }
  console.log('Audio database cleared')

  console.log('All databases cleared successfully')
}

// Initialize databases
async function initializeDatabases(): Promise<void> {
  await Promise.all([
    seedSongs(),
    seedSlides(),
    seedImages()
    // seedVideos(),
    // seedAudio()
  ])
}

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      // Enable debugging features
      devTools: true,
      webSecurity: false // Allow loading local files for debugging
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()

    // Auto-open DevTools in development
    if (is.dev) {
      console.log('Development mode: Opening DevTools')
      mainWindow.webContents.openDevTools()
    }
  })

  // Log console messages from renderer process
  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    const levelStr = typeof level === 'number' ? level.toString() : level
    console.log(`[RENDERER ${levelStr.toUpperCase()}] ${message}`)
    if (line) console.log(`  at line ${line} in ${sourceId}`)
  })

  // Log any crashes
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('Renderer process gone:', details)
  })

  // Log navigation events
  mainWindow.webContents.on('did-navigate', (_event, url) => {
    console.log('Navigated to:', url)
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    console.log('Loading development URL:', process.env['ELECTRON_RENDERER_URL'])
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    console.log('Loading production HTML file')
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Enable verbose logging in development
  if (is.dev) {
    console.log('Electron app ready - Development mode enabled')
    console.log('User data path:', app.getPath('userData'))
    console.log('App path:', app.getAppPath())
  }

  // Default open or close DevTools by F12 in development
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
    if (is.dev) {
      console.log('Browser window created')
    }
  })

  // Initialize databases
  console.log('Initializing databases...')
  await initializeDatabases()
  console.log('Databases initialized')

  // IPC handlers - Songs
  ipcMain.handle('list-songs', async () => {
    return await listSongs()
  })

  ipcMain.handle('create-song', async (_event, name: string) => {
    return await createSong(name)
  })

  ipcMain.handle('get-song', async (_event, id: string) => {
    return await getSong(id)
  })

  ipcMain.handle('update-song', async (_event, id: string, data: Partial<Song>) => {
    return await updateSong(id, data)
  })

  ipcMain.handle('delete-song', async (_event, id: string) => {
    return await deleteSong(id)
  })

  // Clear database handler
  ipcMain.handle('clear-database', async () => {
    await clearAllDatabases()
    return 'Database cleared successfully'
  })

  // IPC handlers - Media
  ipcMain.handle('list-media', async () => {
    return await listMedia()
  })

  ipcMain.handle(
    'create-media',
    async (_event, data: Omit<Media, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => {
      return await createMedia(data)
    }
  )

  ipcMain.handle('get-media', async (_event, id: string) => {
    return await getMedia(id)
  })

  ipcMain.handle('update-media', async (_event, id: string, data: Partial<Media>) => {
    return await updateMedia(id, data)
  })

  ipcMain.handle('delete-media', async (_event, id: string) => {
    return await deleteMedia(id)
  })

  // Legacy IPC handlers (keeping for backward compatibility)
  ipcMain.handle('list-slides', async () => {
    return await listSlides()
  })

  ipcMain.handle('create-slide', async (_event, title: string, content: string) => {
    return await createSlide(title, content)
  })

  ipcMain.handle('delete-slide', async (_event, id: string) => {
    return await deleteSlide(id)
  })

  // Image IPC handlers
  ipcMain.handle('list-images', async () => {
    return await listImages()
  })

  ipcMain.handle('create-image', async (_event, name: string, filePath: string, size: number) => {
    await createImage(name, filePath, size)
    return await listImages()
  })

  ipcMain.handle('delete-image', async (_event, id: string) => {
    await deleteImage(id)
    return await listImages()
  })

  // Video IPC handlers
  ipcMain.handle('list-videos', async () => {
    return await listVideos()
  })

  ipcMain.handle(
    'create-video',
    async (_event, name: string, filePath: string, duration: number, size: number) => {
      await createVideo(name, filePath, duration, size)
      return await listVideos()
    }
  )

  ipcMain.handle('delete-video', async (_event, id: string) => {
    await deleteVideo(id)
    return await listVideos()
  })

  // Audio IPC handlers
  ipcMain.handle('list-audio', async () => {
    return await listAudio()
  })

  ipcMain.handle(
    'create-audio',
    async (_event, name: string, filePath: string, duration: number, size: number) => {
      await createAudio(name, filePath, duration, size)
      return await listAudio()
    }
  )

  ipcMain.handle('delete-audio', async (_event, id: string) => {
    await deleteAudio(id)
    return await listAudio()
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
