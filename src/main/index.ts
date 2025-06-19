import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { open } from 'lmdb'

// Example LMDB setup for songs
type Song = { name: string }
const songDb = open<Song>({
  path: join(app.getPath('userData'), 'songs.lmdb'),
  compression: true
})

// Example: Create a song and list all songs
async function createSong(name: string): Promise<void> {
  const id = Date.now().toString()
  await songDb.put(id, { name })
  console.log(`Created song: ${name}`)
}

async function listSongs(): Promise<Song[]> {
  const songs: Song[] = []
  for (const { value } of songDb.getRange()) {
    songs.push(value)
  }
  console.log('All songs:', songs)
  return songs
}

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    // Open DevTools automatically in development
    if (is.dev) {
      mainWindow.webContents.openDevTools({ mode: 'detach' })
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Add a keyboard shortcut (Ctrl+Shift+I or Cmd+Opt+I) to toggle DevTools in production
  mainWindow.webContents.on('before-input-event', (event, input) => {
    const isDevToolsShortcut =
      (input.control || input.meta) && input.shift && input.key.toLowerCase() === 'i'
    if (isDevToolsShortcut) {
      if (mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.closeDevTools()
      } else {
        mainWindow.webContents.openDevTools({ mode: 'detach' })
      }
      event.preventDefault()
    }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // IPC handler for listing songs
  ipcMain.handle('list-songs', async () => {
    return await listSongs()
  })

  // IPC handler for creating a song
  ipcMain.handle('create-song', async (_event, name: string) => {
    await createSong(name)
    return await listSongs()
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  await createSong('Test Song')
  await listSongs()
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
