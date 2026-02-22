export interface ElectronAPI {
  clipboard: {
    read(): Promise<string>
    write(text: string): Promise<void>
    detectType(): Promise<{ toolId: string; content: string; confidence: number }>
  }
  window: {
    minimize(): void
    hide(): void
  }
  onClipboardContent(callback: (data: { toolId: string; content: string }) => void): () => void
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
