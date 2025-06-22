import { app, shell, BrowserWindow, ipcMain, screen, dialog } from 'electron'
import { join } from 'path'
import { promises as fs } from 'fs'
import * as fsSync from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import icon from '../../resources/icon.png?asset'
import { open } from 'lmdb'
import { basename, extname } from 'path'
import path from 'path'

// Import types from the shared types file
import type { Song, Media, Presentation, Setlist, Settings } from './types/database'
// TODO: Import these when implementing their IPC handlers
// import type { Template } from './types/database'

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

const setlistDb = open<Setlist>({
  path: join(app.getPath('userData'), 'setlists.lmdb'),
  compression: true
})

const presentationDb = open<Presentation>({
  path: join(app.getPath('userData'), 'presentations.lmdb'),
  compression: true
})

const mediaDb = open<Media>({
  path: join(app.getPath('userData'), 'media.lmdb'),
  compression: true
})

// const templateDb = open<Template>({
//   path: join(app.getPath('userData'), 'templates.lmdb'),
//   compression: true
// })

const settingsDb = open<Settings>({
  path: join(app.getPath('userData'), 'settings.lmdb'),
  compression: true
})

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

// Media directory utilities
function getMediaDirectory(): string {
  return join(app.getPath('userData'), 'media')
}

async function ensureMediaDirectory(): Promise<void> {
  const mediaDir = getMediaDirectory()
  try {
    await fs.access(mediaDir)
  } catch {
    await fs.mkdir(mediaDir, { recursive: true })
    console.log('Created media directory:', mediaDir)
  }
}

async function deleteMediaFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath)
  } catch (error) {
    console.warn('Failed to delete media file:', filePath, error)
  }
}

function getMediaUrl(filename: string): string {
  return `file://${join(getMediaDirectory(), filename)}`
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
  console.log('🎵 [BACKEND] Listing all songs...')
  const songs: Song[] = []
  for (const { value } of songDb.getRange()) {
    if (value) {
      console.log('🎵 [BACKEND] Found song:', {
        id: value.id,
        name: value.name,
        artist: value.artist,
        lyricsLength: value.lyrics?.length || 0,
        slidesCount: value.slides?.length || 0,
        tags: value.tags,
        createdAt: new Date(value.createdAt).toISOString()
      })
      songs.push(value)
    }
  }
  console.log('🎵 [BACKEND] Total songs found:', songs.length)
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
  console.log('🎵 [BACKEND] Getting song by ID:', id)
  const song = (await songDb.get(id)) || null
  if (song) {
    console.log('🎵 [BACKEND] Song found:', {
      id: song.id,
      name: song.name,
      artist: song.artist,
      lyricsLength: song.lyrics?.length || 0,
      lyricsPreview: song.lyrics?.substring(0, 100) + (song.lyrics?.length > 100 ? '...' : ''),
      slidesCount: song.slides?.length || 0,
      tags: song.tags
    })
  } else {
    console.log('🎵 [BACKEND] Song not found for ID:', id)
  }
  return song
}

async function updateSong(id: string, data: Partial<Song>): Promise<Song[]> {
  console.log('🎵 [BACKEND] Updating song:', id, 'with data:', {
    name: data.name,
    artist: data.artist,
    lyricsLength: data.lyrics?.length || 0,
    slidesCount: data.slides?.length || 0,
    tags: data.tags
  })

  const existing = await songDb.get(id)
  if (!existing) {
    console.error('🎵 [BACKEND] Song not found for update:', id)
    throw new Error('Song not found')
  }

  const updated: Song = {
    ...existing,
    ...data,
    id, // Ensure ID doesn't change
    updatedAt: Date.now(),
    version: existing.version + 1
  }

  console.log('🎵 [BACKEND] Updated song data:', {
    id: updated.id,
    name: updated.name,
    artist: updated.artist,
    lyricsLength: updated.lyrics?.length || 0,
    version: updated.version
  })

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
  if (!id || id.trim() === '') {
    throw new Error('Cannot delete media: ID is empty or undefined')
  }

  // Get the media entry to find the file path
  const media = await mediaDb.get(id)
  if (media && media.path) {
    // Delete the physical file
    await deleteMediaFile(media.path)
  }

  await mediaDb.remove(id)
  return await listMedia()
}

// Presentation CRUD operations
async function listPresentations(): Promise<Presentation[]> {
  const presentations: Presentation[] = []
  for (const { value } of presentationDb.getRange()) {
    if (value) presentations.push(value)
  }
  return presentations
}

async function createPresentation(
  data: Omit<Presentation, 'id' | 'createdAt' | 'updatedAt' | 'version'>
): Promise<Presentation[]> {
  const id = generateId()
  const now = Date.now()
  const presentation: Presentation = {
    ...data,
    id,
    createdAt: now,
    updatedAt: now,
    version: 1
  }
  await presentationDb.put(id, presentation)
  return await listPresentations()
}

async function getPresentation(id: string): Promise<Presentation | null> {
  return (await presentationDb.get(id)) || null
}

async function updatePresentation(
  id: string,
  data: Partial<Presentation>
): Promise<Presentation[]> {
  const existing = await presentationDb.get(id)
  if (!existing) throw new Error('Presentation not found')

  const updated: Presentation = {
    ...existing,
    ...data,
    id, // Ensure ID doesn't change
    updatedAt: Date.now(),
    version: existing.version + 1
  }

  await presentationDb.put(id, updated)
  return await listPresentations()
}

async function deletePresentation(id: string): Promise<Presentation[]> {
  if (!id || id.trim() === '') {
    throw new Error('Cannot delete presentation: ID is empty or undefined')
  }

  await presentationDb.remove(id)
  return await listPresentations()
}

// Settings CRUD operations
async function listSettings(): Promise<Settings[]> {
  const settings: Settings[] = []
  for (const { value } of settingsDb.getRange()) {
    if (value) settings.push(value)
  }
  return settings
}

async function createSetting(
  data: Omit<Settings, 'createdAt' | 'updatedAt' | 'version'>
): Promise<Settings[]> {
  // For settings, the ID is passed in the data since it's the setting key
  const id = data.id
  const now = Date.now()
  const setting: Settings = {
    ...data,
    id,
    createdAt: now,
    updatedAt: now,
    version: 1
  }
  await settingsDb.put(id, setting)
  return await listSettings()
}

async function getSetting(id: string): Promise<Settings | null> {
  return (await settingsDb.get(id)) || null
}

async function updateSetting(id: string, data: Partial<Settings>): Promise<Settings[]> {
  const existing = await settingsDb.get(id)
  if (!existing) throw new Error('Setting not found')

  const updated: Settings = {
    ...existing,
    ...data,
    id,
    updatedAt: Date.now(),
    version: existing.version + 1
  }

  await settingsDb.put(id, updated)
  return await listSettings()
}

async function deleteSetting(id: string): Promise<Settings[]> {
  if (!id || id.trim() === '') {
    throw new Error('Cannot delete setting: ID is empty or undefined')
  }

  await settingsDb.remove(id)
  return await listSettings()
}

// Setlist CRUD operations
async function listSetlists(): Promise<Setlist[]> {
  console.log('📋 [BACKEND] Listing all setlists...')
  const setlists: Setlist[] = []
  for (const { value } of setlistDb.getRange()) {
    if (value) {
      console.log('📋 [BACKEND] Found setlist:', {
        id: value.id,
        name: value.name,
        description: value.description,
        itemsCount: value.items?.length || 0,
        items:
          value.items?.map((item) => ({
            id: item.id,
            title: item.title,
            type: item.type,
            referenceId: item.referenceId
          })) || []
      })
      setlists.push(value)
    }
  }
  console.log('📋 [BACKEND] Total setlists found:', setlists.length)
  return setlists
}

async function createSetlist(
  data: Omit<Setlist, 'id' | 'createdAt' | 'updatedAt' | 'version'>
): Promise<Setlist[]> {
  const id = generateId()
  const now = Date.now()
  const setlist: Setlist = {
    ...data,
    id,
    items: data.items || [], // Ensure items is always an array
    createdAt: now,
    updatedAt: now,
    version: 1
  }
  await setlistDb.put(id, setlist)
  return await listSetlists()
}

async function getSetlist(id: string): Promise<Setlist | null> {
  return (await setlistDb.get(id)) || null
}

async function updateSetlist(id: string, data: Partial<Setlist>): Promise<Setlist[]> {
  console.log('🔧 Backend updateSetlist called:', { id, dataKeys: Object.keys(data) })

  const existing = await setlistDb.get(id)
  if (!existing) {
    console.error('❌ Setlist not found in database:', id)
    throw new Error('Setlist not found')
  }

  // Ensure existing setlist has items array initialized
  if (!existing.items) {
    console.log('⚠️ Existing setlist missing items array, initializing as empty array')
    existing.items = []
  }

  console.log('📋 Existing setlist items:', existing.items?.length || 0, existing.items)
  console.log('📝 Update data items:', data.items?.length || 0, data.items)

  const updated: Setlist = {
    ...existing,
    ...data,
    id, // Ensure ID doesn't change
    updatedAt: Date.now(),
    version: existing.version + 1
  }

  console.log('✨ Final updated setlist items:', updated.items?.length || 0, updated.items)

  await setlistDb.put(id, updated)

  // Verify the save
  const saved = await setlistDb.get(id)
  console.log('💾 Saved setlist items:', saved?.items?.length || 0, saved?.items)

  const allSetlists = await listSetlists()
  console.log('📊 Returning setlists count:', allSetlists.length)

  return allSetlists
}

async function deleteSetlist(id: string): Promise<Setlist[]> {
  if (!id || id.trim() === '') {
    throw new Error('Cannot delete setlist: ID is empty or undefined')
  }

  await setlistDb.remove(id)
  return await listSetlists()
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

  // Clear presentations
  for (const { key } of presentationDb.getRange()) {
    await presentationDb.remove(key)
  }
  console.log('Presentations database cleared')

  // Clear setlists
  for (const { key } of setlistDb.getRange()) {
    await setlistDb.remove(key)
  }
  console.log('Setlists database cleared')

  // Clear settings
  for (const { key } of settingsDb.getRange()) {
    await settingsDb.remove(key)
  }
  console.log('Settings database cleared')

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
  // Ensure media directory exists
  await ensureMediaDirectory()

  await Promise.all([
    seedSongs(),
    seedSlides(),
    seedImages()
    // seedVideos(),
    // seedAudio()
  ])
}

// Auto-updater configuration
function setupAutoUpdater(): void {
  // Configure auto-updater
  autoUpdater.checkForUpdatesAndNotify()

  // Auto-updater events
  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for update...')
  })

  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info)
  })

  autoUpdater.on('update-not-available', (info) => {
    console.log('Update not available:', info)
  })

  autoUpdater.on('error', (err) => {
    console.log('Error in auto-updater:', err)
  })

  autoUpdater.on('download-progress', (progressObj) => {
    let log_message = 'Download speed: ' + progressObj.bytesPerSecond
    log_message = log_message + ' - Downloaded ' + progressObj.percent + '%'
    log_message = log_message + ' (' + progressObj.transferred + '/' + progressObj.total + ')'
    console.log(log_message)
  })

  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded:', info)
    autoUpdater.quitAndInstall()
  })
}

// Main window reference
let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
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
    mainWindow?.show()

    // Auto-open DevTools in development
    if (is.dev) {
      console.log('Development mode: Opening DevTools')
      mainWindow?.webContents.openDevTools()
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

// Projection window management
let projectionWindow: BrowserWindow | null = null
let currentProjectionDisplay: Electron.Display | null = null

// Screen detection and management
function getAllDisplays(): Electron.Display[] {
  return screen.getAllDisplays()
}

function getProjectionDisplay(): Electron.Display {
  // If no specific display set, try to find external display first
  const displays = screen.getAllDisplays()
  const primaryDisplay = screen.getPrimaryDisplay()

  // Prefer external display over primary if available
  const externalDisplay = displays.find((display) => display.id !== primaryDisplay.id)
  const targetDisplay = externalDisplay || primaryDisplay

  console.log(
    '📺 [SCREEN] Available displays:',
    displays.map((d) => ({
      id: d.id,
      bounds: d.bounds,
      workArea: d.workArea,
      scaleFactor: d.scaleFactor,
      isPrimary: d.id === primaryDisplay.id
    }))
  )

  console.log('📺 [SCREEN] Selected projection display:', {
    id: targetDisplay.id,
    bounds: targetDisplay.bounds,
    workArea: targetDisplay.workArea,
    scaleFactor: targetDisplay.scaleFactor,
    isPrimary: targetDisplay.id === primaryDisplay.id
  })

  return targetDisplay
}

function createProjectionWindow(): BrowserWindow {
  console.log('Creating projection window...')

  // Get the best display for projection
  currentProjectionDisplay = getProjectionDisplay()
  const { bounds, workArea } = currentProjectionDisplay

  // Use full work area for projection window (can be toggled to fullscreen later)
  const windowWidth = Math.min(1200, workArea.width - 100)
  const windowHeight = Math.min(800, workArea.height - 100)

  projectionWindow = new BrowserWindow({
    x: bounds.x + 100,
    y: bounds.y + 100,
    width: windowWidth,
    height: windowHeight,
    fullscreen: false,
    frame: true,
    show: false,
    title: 'Projection Window',
    backgroundColor: '#000000',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false // Allow loading local files for media
      // Enable nodeIntegration for direct IPC access in presentation window
    }
  })

  // Set up event handlers
  projectionWindow.on('closed', () => {
    projectionWindow = null
  })

  projectionWindow.on('ready-to-show', () => {
    console.log('Projection window ready to show')
    projectionWindow?.show()
  })

  // Load the presentation route
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    projectionWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#/presentation`)
  } else {
    projectionWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: 'presentation' })
  }

  console.log('Projection window created successfully')
  return projectionWindow
}

function getOrCreateProjectionWindow(): BrowserWindow {
  if (!projectionWindow || projectionWindow.isDestroyed()) {
    return createProjectionWindow()
  }
  return projectionWindow
}

function projectContent(title: string, content: string, type: string, slideData?: unknown): void {
  console.log('🎯 [MAIN] Received projection request:', {
    title,
    type,
    contentLength: content.length,
    hasSlideData: !!slideData
  })

  const window = getOrCreateProjectionWindow()

  // Send projection data to the presentation window via IPC
  const projectionData = {
    title,
    content,
    type,
    slideData
  }

  console.log('🎯 [MAIN] Sending projection data to presentation window')
  window.webContents.send('projection-update', projectionData)
}

function blankProjection(): void {
  if (projectionWindow && !projectionWindow.isDestroyed()) {
    console.log('🎯 [MAIN] Blanking projection')
    projectionWindow.webContents.send('projection-blank', true)
  }
}

function showLogo(): void {
  if (projectionWindow && !projectionWindow.isDestroyed()) {
    console.log('🎯 [MAIN] Showing logo')
    projectionWindow.webContents.send('projection-logo', true)
  }
}

function stopProjection(): void {
  if (projectionWindow && !projectionWindow.isDestroyed()) {
    console.log('🎯 [MAIN] Stopping projection')
    projectionWindow.webContents.send('projection-stop')
    projectionWindow.close()
  }
}

// Custom font management
const CUSTOM_FONTS_DIR = path.join(app.getPath('userData'), 'custom-fonts')

// Ensure custom fonts directory exists
if (!fsSync.existsSync(CUSTOM_FONTS_DIR)) {
  fsSync.mkdirSync(CUSTOM_FONTS_DIR, { recursive: true })
}

// Supported font file extensions
const SUPPORTED_FONT_EXTENSIONS = ['.ttf', '.otf', '.woff', '.woff2', '.eot']

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Initialize databases
  initializeDatabases()

  // Setup auto-updater
  setupAutoUpdater()

  // IPC test
  ipcMain.handle('ping', () => 'pong')

  // Auto-updater IPC handlers
  ipcMain.handle('check-for-updates', async () => {
    return await autoUpdater.checkForUpdatesAndNotify()
  })

  ipcMain.handle('quit-and-install', () => {
    autoUpdater.quitAndInstall()
  })

  // IPC handlers - Screen Detection
  ipcMain.handle('get-displays', () => {
    return getAllDisplays()
  })

  ipcMain.handle('get-projection-display', () => {
    return currentProjectionDisplay || getProjectionDisplay()
  })

  ipcMain.handle('set-projection-display', (_event, displayId: number) => {
    const displays = getAllDisplays()
    const targetDisplay = displays.find((d) => d.id === displayId)
    if (targetDisplay) {
      currentProjectionDisplay = targetDisplay
      console.log('📺 [SCREEN] Switched projection display to:', {
        id: targetDisplay.id,
        bounds: targetDisplay.bounds,
        workArea: targetDisplay.workArea
      })

      // Recreate projection window on new display if it exists
      if (projectionWindow && !projectionWindow.isDestroyed()) {
        const wasVisible = projectionWindow.isVisible()
        projectionWindow.close()
        projectionWindow = createProjectionWindow()
        if (wasVisible) {
          projectionWindow.show()
        }
      }

      return targetDisplay
    }
    return null
  })

  // Monitor display changes
  screen.on('display-added', () => {
    console.log('📺 [SCREEN] Display added, notifying renderer')
    mainWindow?.webContents.send('displays-changed', getAllDisplays())
  })

  screen.on('display-removed', () => {
    console.log('📺 [SCREEN] Display removed, notifying renderer')
    mainWindow?.webContents.send('displays-changed', getAllDisplays())
  })

  screen.on('display-metrics-changed', () => {
    console.log('📺 [SCREEN] Display metrics changed, notifying renderer')
    mainWindow?.webContents.send('displays-changed', getAllDisplays())
  })

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

  // Clear database handler
  ipcMain.handle('clear-database', async () => {
    await clearAllDatabases()
    return 'Database cleared successfully'
  })

  // Media IPC handlers
  ipcMain.handle('upload-media', async (_event, filePath: string) => {
    try {
      await ensureMediaDirectory()
      const filename = basename(filePath)
      const targetPath = join(getMediaDirectory(), filename)

      // Copy file to media directory
      await fs.copyFile(filePath, targetPath)

      // Get file stats
      const stats = await fs.stat(targetPath)

      return {
        filename,
        path: targetPath,
        url: getMediaUrl(filename),
        size: stats.size
      }
    } catch (error) {
      console.error('Failed to upload media:', error)
      throw error
    }
  })

  ipcMain.handle('list-media-files', async () => {
    try {
      await ensureMediaDirectory()
      const mediaDir = getMediaDirectory()
      const files = await fs.readdir(mediaDir)

      const mediaFiles = await Promise.all(
        files
          .filter((file) => {
            const ext = extname(file).toLowerCase()
            return [
              '.jpg',
              '.jpeg',
              '.png',
              '.gif',
              '.mp4',
              '.mov',
              '.avi',
              '.mp3',
              '.wav'
            ].includes(ext)
          })
          .map(async (file) => {
            const filePath = join(mediaDir, file)
            const stats = await fs.stat(filePath)
            const ext = extname(file).toLowerCase()

            return {
              filename: file,
              path: filePath,
              url: getMediaUrl(file),
              size: stats.size,
              type: ['.jpg', '.jpeg', '.png', '.gif'].includes(ext)
                ? 'image'
                : ['.mp4', '.mov', '.avi'].includes(ext)
                  ? 'video'
                  : 'audio',
              createdAt: stats.birthtimeMs
            }
          })
      )

      // Sort by creation time (newest first)
      return mediaFiles.sort((a, b) => b.createdAt - a.createdAt)
    } catch (error) {
      console.error('Failed to list media files:', error)
      return []
    }
  })

  // Delete media file
  ipcMain.handle('delete-media-file', async (_event, filename: string) => {
    try {
      const filePath = join(getMediaDirectory(), filename)
      await fs.unlink(filePath)
      console.log('Media file deleted:', filename)
      return true
    } catch (error) {
      console.error('Failed to delete media file:', filename, error)
      return false
    }
  })

  // Get media file URL (more efficient than data URL)
  ipcMain.handle('get-media-file-url', async (_event, filename: string) => {
    console.log('🔍 [MAIN] get-media-file-url requested for:', filename)
    try {
      const filePath = join(getMediaDirectory(), filename)

      // Check if file exists
      try {
        await fs.access(filePath)
        console.log('✅ [MAIN] Media file found:', filePath)
        // Return file:// URL for efficient access
        return `file://${filePath}`
      } catch {
        console.error('❌ [MAIN] Media file not found:', filePath)
        return null
      }
    } catch (error) {
      console.error('❌ [MAIN] Failed to get media file URL for:', filename, error)
      return null
    }
  })

  // Get media file as data URL for display in browser (fallback)
  ipcMain.handle('get-media-data-url', async (_event, filename: string) => {
    console.log('🔍 [MAIN] get-media-data-url requested for:', filename)
    try {
      const filePath = join(getMediaDirectory(), filename)
      console.log('🔍 [MAIN] Looking for media file at:', filePath)

      // Check if file exists
      try {
        await fs.access(filePath)
        console.log('✅ [MAIN] Media file found:', filePath)
      } catch {
        console.error('❌ [MAIN] Media file not found:', filePath)
        return null
      }

      // Read file and convert to data URL
      const fileBuffer = await fs.readFile(filePath)

      // Determine MIME type based on file extension
      const ext = filename.toLowerCase().split('.').pop()
      let mimeType = 'application/octet-stream'

      if (ext) {
        switch (ext) {
          case 'jpg':
          case 'jpeg':
            mimeType = 'image/jpeg'
            break
          case 'png':
            mimeType = 'image/png'
            break
          case 'gif':
            mimeType = 'image/gif'
            break
          case 'webp':
            mimeType = 'image/webp'
            break
          case 'mp4':
            mimeType = 'video/mp4'
            break
          case 'webm':
            mimeType = 'video/webm'
            break
          case 'mov':
            mimeType = 'video/quicktime'
            break
          case 'avi':
            mimeType = 'video/x-msvideo'
            break
        }
      }

      // Convert to base64 and create data URL
      const base64Data = fileBuffer.toString('base64')
      const dataUrl = `data:${mimeType};base64,${base64Data}`

      console.log(
        '✅ [MAIN] Generated data URL for:',
        filename,
        'size:',
        dataUrl.length,
        'MIME:',
        mimeType
      )
      return dataUrl
    } catch (error) {
      console.error('❌ [MAIN] Failed to get media data URL for:', filename, error)
      return null
    }
  })

  // Find media file by checksum (for base64 to file URL conversion)
  ipcMain.handle('find-media-by-checksum', async (_event, checksum: string) => {
    console.log(
      '🔍 [MAIN] find-media-by-checksum requested for:',
      checksum.substring(0, 16) + '...'
    )
    try {
      const mediaDir = getMediaDirectory()

      // Ensure media directory exists
      try {
        await fs.access(mediaDir)
      } catch {
        console.log('📁 [MAIN] Media directory does not exist:', mediaDir)
        return null
      }

      // Read all files in media directory
      const files = await fs.readdir(mediaDir)
      console.log('📂 [MAIN] Checking', files.length, 'files in media directory')

      // Check each file's checksum
      for (const filename of files) {
        try {
          const filePath = join(mediaDir, filename)
          const stats = await fs.stat(filePath)

          // Skip directories
          if (stats.isDirectory()) continue

          // Read file and generate checksum
          const fileBuffer = await fs.readFile(filePath)
          const crypto = await import('crypto')
          const hash = crypto.createHash('sha256')
          hash.update(fileBuffer)
          const fileChecksum = hash.digest('hex')

          // Check if checksums match
          if (fileChecksum === checksum) {
            console.log('✅ [MAIN] Found matching file by checksum:', filename)
            return filename
          }
        } catch (error) {
          console.warn('⚠️ [MAIN] Failed to check file:', filename, error)
          continue
        }
      }

      console.log('❌ [MAIN] No matching file found for checksum')
      return null
    } catch (error) {
      console.error('❌ [MAIN] Failed to find media by checksum:', error)
      return null
    }
  })

  // Save file to media folder and return filename
  ipcMain.handle(
    'save-media-file',
    async (
      _event,
      fileData: {
        filename: string
        buffer: number[]
        mimeType: string
        size: number
      }
    ) => {
      console.log('💾 [MAIN] save-media-file requested for:', fileData.filename)
      try {
        await ensureMediaDirectory()

        // Convert number array back to buffer
        const buffer = Buffer.from(fileData.buffer)

        // Generate unique filename if needed (check for conflicts)
        let finalFilename = fileData.filename
        let counter = 1

        while (true) {
          const targetPath = join(getMediaDirectory(), finalFilename)
          try {
            await fs.access(targetPath)
            // File exists, generate new name
            const ext = extname(fileData.filename)
            const baseName = basename(fileData.filename, ext)
            finalFilename = `${baseName}_${counter}${ext}`
            counter++
          } catch {
            // File doesn't exist, we can use this name
            break
          }
        }

        const finalPath = join(getMediaDirectory(), finalFilename)

        // Write file to media directory
        await fs.writeFile(finalPath, buffer)

        console.log('✅ [MAIN] File saved to media folder:', finalFilename)

        return {
          filename: finalFilename,
          path: finalPath,
          url: getMediaUrl(finalFilename),
          size: fileData.size
        }
      } catch (error) {
        console.error('❌ [MAIN] Failed to save media file:', error)
        throw error
      }
    }
  )

  // Check if media file exists
  ipcMain.handle('media-file-exists', async (_event, filename: string) => {
    try {
      const filePath = join(getMediaDirectory(), filename)
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  })

  // IPC handlers - Presentations
  ipcMain.handle('list-presentations', async () => {
    return await listPresentations()
  })

  ipcMain.handle(
    'create-presentation',
    async (_event, data: Omit<Presentation, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => {
      return await createPresentation(data)
    }
  )

  ipcMain.handle('get-presentation', async (_event, id: string) => {
    return await getPresentation(id)
  })

  ipcMain.handle('update-presentation', async (_event, id: string, data: Partial<Presentation>) => {
    return await updatePresentation(id, data)
  })

  ipcMain.handle('delete-presentation', async (_event, id: string) => {
    return await deletePresentation(id)
  })

  // IPC handlers - Settings
  ipcMain.handle('list-settings', async () => {
    return await listSettings()
  })

  ipcMain.handle(
    'create-setting',
    async (_event, data: Omit<Settings, 'createdAt' | 'updatedAt' | 'version'>) => {
      return await createSetting(data)
    }
  )

  ipcMain.handle('get-setting', async (_event, id: string) => {
    return await getSetting(id)
  })

  ipcMain.handle('update-setting', async (_event, id: string, data: Partial<Settings>) => {
    return await updateSetting(id, data)
  })

  ipcMain.handle('delete-setting', async (_event, id: string) => {
    return await deleteSetting(id)
  })

  // IPC handlers - Setlists
  ipcMain.handle('list-setlists', async () => {
    console.log('📋 [IPC] Received list-setlists request')
    const result = await listSetlists()
    console.log('📋 [IPC] Returning', result.length, 'setlists with items:')
    result.forEach((setlist) => {
      console.log('📋 [IPC] Setlist:', setlist.name, 'has', setlist.items?.length || 0, 'items')
      setlist.items?.forEach((item) => {
        console.log(
          '📋 [IPC]   - Item:',
          item.title,
          'type:',
          item.type,
          'refId:',
          item.referenceId
        )
      })
    })
    return result
  })

  ipcMain.handle(
    'create-setlist',
    async (_event, data: Omit<Setlist, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => {
      console.log('📋 [IPC] Received create-setlist request for:', data.name)
      const result = await createSetlist(data)
      console.log('📋 [IPC] Setlist created, returning', result.length, 'total setlists')
      return result
    }
  )

  ipcMain.handle('get-setlist', async (_event, id: string) => {
    console.log('📋 [IPC] Received get-setlist request for ID:', id)
    const result = await getSetlist(id)
    if (result) {
      console.log(
        '📋 [IPC] Returning setlist:',
        result.name,
        'with',
        result.items?.length || 0,
        'items'
      )
      result.items?.forEach((item) => {
        console.log(
          '📋 [IPC]   - Item:',
          item.title,
          'type:',
          item.type,
          'refId:',
          item.referenceId
        )
      })
    } else {
      console.log('📋 [IPC] Setlist not found for ID:', id)
    }
    return result
  })

  ipcMain.handle('update-setlist', async (_event, id: string, data: Partial<Setlist>) => {
    console.log(
      '📋 [IPC] Received update-setlist request for ID:',
      id,
      'with keys:',
      Object.keys(data)
    )
    if (data.items) {
      console.log('📋 [IPC] Updating setlist items:', data.items.length, 'items')
      data.items.forEach((item) => {
        console.log(
          '📋 [IPC]   - Item:',
          item.title,
          'type:',
          item.type,
          'refId:',
          item.referenceId
        )
      })
    }
    const result = await updateSetlist(id, data)
    console.log('📋 [IPC] Setlist updated, returning', result.length, 'total setlists')
    return result
  })

  ipcMain.handle('delete-setlist', async (_event, id: string) => {
    console.log('📋 [IPC] Received delete-setlist request for ID:', id)
    const result = await deleteSetlist(id)
    console.log('📋 [IPC] Setlist deleted, returning', result.length, 'remaining setlists')
    return result
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

  // Projection IPC handlers
  ipcMain.on(
    'project-content',
    (_event, data: { title: string; content: string; type: string; slideData?: unknown }) => {
      projectContent(data.title, data.content, data.type, data.slideData)
    }
  )

  ipcMain.on('toggle-blank', (_event, isBlank: boolean) => {
    if (isBlank) {
      blankProjection()
    } else {
      // Unblanking - send false to turn off blank mode
      if (projectionWindow && !projectionWindow.isDestroyed()) {
        projectionWindow.webContents.send('projection-blank', false)
      }
    }
  })

  ipcMain.on('toggle-logo', (_event, showLogoFlag: boolean) => {
    if (showLogoFlag) {
      showLogo()
    } else {
      // Hide logo - send false to turn off logo mode
      if (projectionWindow && !projectionWindow.isDestroyed()) {
        projectionWindow.webContents.send('projection-logo', false)
      }
    }
  })

  ipcMain.on('stop-projection', () => {
    stopProjection()
  })

  // System font enumeration (optional advanced feature)
  ipcMain.handle('get-system-fonts', async () => {
    try {
      // For now, return a basic list of common system fonts
      // This can be enhanced with font-list package if needed
      const systemFonts = [
        // macOS fonts
        'San Francisco',
        'SF Pro Display',
        'SF Pro Text',
        'Helvetica Neue',
        'Lucida Grande',
        'Apple Garamond',
        'Baskerville',

        // Windows fonts
        'Segoe UI',
        'Segoe UI Historic',
        'Segoe UI Emoji',
        'Calibri',
        'Cambria',
        'Consolas',
        'Tahoma',

        // Linux fonts
        'Ubuntu',
        'Cantarell',
        'DejaVu Sans',
        'Liberation Sans',
        'Noto Sans',
        'Roboto',

        // Cross-platform
        'Arial',
        'Times New Roman',
        'Courier New',
        'Verdana',
        'Georgia',
        'Impact',
        'Trebuchet MS'
      ]

      return systemFonts
    } catch (error) {
      console.error('Failed to get system fonts:', error)
      return []
    }
  })

  // Custom font IPC handlers
  ipcMain.handle('upload-custom-font', async () => {
    try {
      const result = await dialog.showOpenDialog({
        title: 'Select Font Files',
        filters: [
          {
            name: 'Font Files',
            extensions: ['ttf', 'otf', 'woff', 'woff2', 'eot']
          }
        ],
        properties: ['openFile', 'multiSelections']
      })

      if (result.canceled || !result.filePaths.length) {
        return { success: false, message: 'No files selected' }
      }

      const uploadedFonts: Array<{
        id: string
        name: string
        fileName: string
        originalName: string
        filePath: string
        fileSize: number
        uploadDate: string
        type: string
      }> = []

      for (let i = 0; i < result.filePaths.length; i++) {
        const filePath = result.filePaths[i]
        try {
          const fileName = path.basename(filePath)
          const fileExt = path.extname(fileName).toLowerCase()

          // Validate file extension
          if (!SUPPORTED_FONT_EXTENSIONS.includes(fileExt)) {
            console.warn(`Skipping unsupported font file: ${fileName}`)
            continue
          }

          // Generate unique filename to avoid conflicts
          // Use timestamp + index to ensure uniqueness even for simultaneous uploads
          const timestamp = Date.now() + i
          const uniqueFileName = `${timestamp}_${fileName}`
          const destPath = path.join(CUSTOM_FONTS_DIR, uniqueFileName)

          // Copy font file to custom fonts directory
          fsSync.copyFileSync(filePath, destPath)

          // Extract font name from filename (remove extension and timestamp)
          const fontName = fileName.replace(fileExt, '').replace(/[-_]/g, ' ')

          const fontInfo = {
            id: timestamp.toString(),
            name: fontName,
            fileName: uniqueFileName,
            originalName: fileName,
            filePath: destPath,
            fileSize: fsSync.statSync(destPath).size,
            uploadDate: new Date().toISOString(),
            type: 'custom'
          }

          uploadedFonts.push(fontInfo)
          console.log(`✅ Font uploaded: ${fontName}`)
        } catch (error) {
          console.error(`❌ Failed to upload font ${path.basename(filePath)}:`, error)
        }
      }

      return {
        success: true,
        fonts: uploadedFonts,
        message: `Successfully uploaded ${uploadedFonts.length} font(s)`
      }
    } catch (error) {
      console.error('Font upload error:', error)
      return { success: false, message: 'Failed to upload fonts' }
    }
  })

  ipcMain.handle('get-custom-fonts', async () => {
    try {
      if (!fsSync.existsSync(CUSTOM_FONTS_DIR)) {
        return []
      }

      const fontFiles = fsSync.readdirSync(CUSTOM_FONTS_DIR)
      const customFonts: Array<{
        id: string
        name: string
        fileName: string
        originalName: string
        filePath: string
        fileSize: number
        uploadDate: string
        type: string
      }> = []

      for (const fileName of fontFiles) {
        const filePath = path.join(CUSTOM_FONTS_DIR, fileName)
        const fileExt = path.extname(fileName).toLowerCase()

        if (SUPPORTED_FONT_EXTENSIONS.includes(fileExt)) {
          try {
            const stats = fsSync.statSync(filePath)

            // Extract timestamp and original name from filename
            const parts = fileName.split('_')
            const timestamp = parts[0]
            const originalName = parts.slice(1).join('_')
            const fontName = originalName.replace(fileExt, '').replace(/[-_]/g, ' ')

            const fontInfo = {
              id: timestamp,
              name: fontName,
              fileName: fileName,
              originalName: originalName,
              filePath: filePath,
              fileSize: stats.size,
              uploadDate: stats.birthtime.toISOString(),
              type: 'custom'
            }

            customFonts.push(fontInfo)
          } catch (error) {
            console.error(`Error reading font file ${fileName}:`, error)
          }
        }
      }

      return customFonts.sort((a, b) => a.name.localeCompare(b.name))
    } catch (error) {
      console.error('Failed to get custom fonts:', error)
      return []
    }
  })

  ipcMain.handle('delete-custom-font', async (_, fontId: string) => {
    try {
      // Get custom fonts directly
      if (!fsSync.existsSync(CUSTOM_FONTS_DIR)) {
        return { success: false, message: 'Font not found' }
      }

      const fontFiles = fsSync.readdirSync(CUSTOM_FONTS_DIR)
      let foundFont: { id: string; fileName: string; filePath: string } | null = null

      for (const fileName of fontFiles) {
        const parts = fileName.split('_')
        const timestamp = parts[0]
        if (timestamp === fontId) {
          foundFont = {
            id: timestamp,
            fileName: fileName,
            filePath: path.join(CUSTOM_FONTS_DIR, fileName)
          }
          break
        }
      }

      if (!foundFont) {
        return { success: false, message: 'Font not found' }
      }

      // Delete the font file
      if (fsSync.existsSync(foundFont.filePath)) {
        fsSync.unlinkSync(foundFont.filePath)
      }

      return { success: true, message: `Font deleted successfully` }
    } catch (error) {
      console.error('Failed to delete custom font:', error)
      return { success: false, message: 'Failed to delete font' }
    }
  })

  ipcMain.handle('get-font-url', async (_, fontId: string) => {
    try {
      // Get custom fonts directly
      if (!fsSync.existsSync(CUSTOM_FONTS_DIR)) {
        return null
      }

      const fontFiles = fsSync.readdirSync(CUSTOM_FONTS_DIR)
      let foundFont: { filePath: string } | null = null

      for (const fileName of fontFiles) {
        const parts = fileName.split('_')
        const timestamp = parts[0]
        if (timestamp === fontId) {
          foundFont = {
            filePath: path.join(CUSTOM_FONTS_DIR, fileName)
          }
          break
        }
      }

      if (!foundFont || !fsSync.existsSync(foundFont.filePath)) {
        return null
      }

      // Return file:// URL for local font file
      return `file://${foundFont.filePath}`
    } catch (error) {
      console.error('Failed to get font URL:', error)
      return null
    }
  })

  // Create main window
  createWindow()

  // Create presentation window automatically on startup
  console.log('🎯 [STARTUP] Creating presentation window on app startup')
  createProjectionWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
