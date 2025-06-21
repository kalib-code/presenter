import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI & {
      invoke: (channel: string, ...args: any[]) => Promise<any>
    }
    api: unknown
  }
}
