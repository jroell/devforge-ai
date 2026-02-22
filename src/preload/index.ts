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
  },
  keychain: {
    store: (provider: string, key: string): Promise<void> =>
      ipcRenderer.invoke('keychain:store', provider, key),
    get: (provider: string): Promise<string | null> =>
      ipcRenderer.invoke('keychain:get', provider),
    delete: (provider: string): Promise<void> =>
      ipcRenderer.invoke('keychain:delete', provider),
    has: (provider: string): Promise<boolean> =>
      ipcRenderer.invoke('keychain:has', provider),
  },
  settings: {
    get: (key: string, defaultValue?: unknown): Promise<unknown> =>
      ipcRenderer.invoke('settings:get', key, defaultValue),
    set: (key: string, value: unknown): Promise<void> =>
      ipcRenderer.invoke('settings:set', key, value),
  },
  ai: {
    complete: (params: {
      prompt: string
      systemPrompt?: string
      model?: string
      provider?: string
      temperature?: number
      maxTokens?: number
    }): Promise<{ provider: string; isLocal: boolean }> =>
      ipcRenderer.invoke('ai:complete', params),
    checkOllama: (): Promise<boolean> => ipcRenderer.invoke('ai:check-ollama'),
    listModels: (provider: string): Promise<string[]> =>
      ipcRenderer.invoke('ai:list-models', provider),
    onStreamChunk: (callback: (chunk: string) => void): (() => void) => {
      const handler = (_e: Electron.IpcRendererEvent, chunk: string): void => {
        callback(chunk)
      }
      ipcRenderer.on('ai:stream-chunk', handler)
      return () => {
        ipcRenderer.removeListener('ai:stream-chunk', handler)
      }
    },
    onStreamEnd: (callback: () => void): (() => void) => {
      const handler = (): void => {
        callback()
      }
      ipcRenderer.on('ai:stream-end', handler)
      return () => {
        ipcRenderer.removeListener('ai:stream-end', handler)
      }
    },
    onStreamError: (callback: (error: string) => void): (() => void) => {
      const handler = (_e: Electron.IpcRendererEvent, error: string): void => {
        callback(error)
      }
      ipcRenderer.on('ai:stream-error', handler)
      return () => {
        ipcRenderer.removeListener('ai:stream-error', handler)
      }
    }
  }
}

contextBridge.exposeInMainWorld('api', api)
