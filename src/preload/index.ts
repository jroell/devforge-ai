import { contextBridge, ipcRenderer } from 'electron'
import type { ElectronAPI } from './types'

const api: ElectronAPI = {
  clipboard: {
    read: (): Promise<string> => ipcRenderer.invoke('clipboard:read'),
    write: (text: string): Promise<void> => ipcRenderer.invoke('clipboard:write', text),
    detectType: (): Promise<{ toolId: string; content: string; confidence: number }> =>
      ipcRenderer.invoke('clipboard:detect')
  },
  crypto: {
    hash: (algorithm: string, data: string): Promise<string> =>
      ipcRenderer.invoke('crypto:hash', algorithm, data)
  },
  window: {
    minimize: (): void => {
      ipcRenderer.send('window:minimize')
    },
    hide: (): void => {
      ipcRenderer.send('window:hide')
    }
  },
  onClipboardContent: (
    callback: (data: { toolId: string; content: string }) => void
  ): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { toolId: string; content: string }): void => {
      callback(data)
    }
    ipcRenderer.on('clipboard:content', handler)
    return () => {
      ipcRenderer.removeListener('clipboard:content', handler)
    }
  }
}

contextBridge.exposeInMainWorld('api', api)
