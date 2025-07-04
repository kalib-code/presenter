import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {}

// Expose IPC invoke for renderer
const customElectronAPI = {
  ...electronAPI,
  invoke: (channel: string, ...args: unknown[]) => ipcRenderer.invoke(channel, ...args),
  // Auto-updater APIs
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  quitAndInstall: () => ipcRenderer.invoke('quit-and-install')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', customElectronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = customElectronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
