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
    },
    popout: (toolId: string): Promise<void> =>
      ipcRenderer.invoke('window:popout', toolId)
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
  },
  customTools: {
    list: (): Promise<unknown[]> => ipcRenderer.invoke('custom-tools:list'),
    get: (id: string): Promise<unknown> => ipcRenderer.invoke('custom-tools:get', id),
    save: (config: unknown): Promise<unknown> => ipcRenderer.invoke('custom-tools:save', config),
    delete: (id: string): Promise<void> => ipcRenderer.invoke('custom-tools:delete', id),
  },
  updater: {
    check: (): Promise<string | null> => ipcRenderer.invoke('updater:check'),
    download: (): Promise<void> => ipcRenderer.invoke('updater:download'),
    install: (): Promise<void> => ipcRenderer.invoke('updater:install'),
    onChecking: (callback: () => void): (() => void) => {
      const handler = (): void => { callback() }
      ipcRenderer.on('updater:checking', handler)
      return () => { ipcRenderer.removeListener('updater:checking', handler) }
    },
    onAvailable: (callback: (info: { version: string; releaseNotes: unknown }) => void): (() => void) => {
      const handler = (_e: Electron.IpcRendererEvent, info: { version: string; releaseNotes: unknown }): void => { callback(info) }
      ipcRenderer.on('updater:available', handler)
      return () => { ipcRenderer.removeListener('updater:available', handler) }
    },
    onNotAvailable: (callback: () => void): (() => void) => {
      const handler = (): void => { callback() }
      ipcRenderer.on('updater:not-available', handler)
      return () => { ipcRenderer.removeListener('updater:not-available', handler) }
    },
    onProgress: (callback: (progress: { percent: number; bytesPerSecond: number; transferred: number; total: number }) => void): (() => void) => {
      const handler = (_e: Electron.IpcRendererEvent, progress: { percent: number; bytesPerSecond: number; transferred: number; total: number }): void => { callback(progress) }
      ipcRenderer.on('updater:progress', handler)
      return () => { ipcRenderer.removeListener('updater:progress', handler) }
    },
    onDownloaded: (callback: () => void): (() => void) => {
      const handler = (): void => { callback() }
      ipcRenderer.on('updater:downloaded', handler)
      return () => { ipcRenderer.removeListener('updater:downloaded', handler) }
    },
    onError: (callback: (error: string) => void): (() => void) => {
      const handler = (_e: Electron.IpcRendererEvent, error: string): void => { callback(error) }
      ipcRenderer.on('updater:error', handler)
      return () => { ipcRenderer.removeListener('updater:error', handler) }
    }
  }
}

contextBridge.exposeInMainWorld('api', api)
