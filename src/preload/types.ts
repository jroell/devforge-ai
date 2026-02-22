export interface ElectronAPI {
  clipboard: {
    readText: () => string
    writeText: (text: string) => void
  }
  window: {
    minimize: () => void
    hide: () => void
  }
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
