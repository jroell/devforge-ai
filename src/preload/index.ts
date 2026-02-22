import { contextBridge, clipboard, ipcRenderer } from 'electron'

const api = {
  clipboard: {
    readText: (): string => clipboard.readText(),
    writeText: (text: string): void => clipboard.writeText(text)
  },
  window: {
    minimize: (): void => {
      ipcRenderer.send('window:minimize')
    },
    hide: (): void => {
      ipcRenderer.send('window:hide')
    }
  }
}

contextBridge.exposeInMainWorld('api', api)
