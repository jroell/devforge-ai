export interface ElectronAPI {
  clipboard: {
    read(): Promise<string>
    write(text: string): Promise<void>
    detectType(): Promise<{ toolId: string; content: string; confidence: number }>
  }
  crypto: {
    hash(algorithm: string, data: string): Promise<string>
  }
  window: {
    minimize(): void
    hide(): void
  }
  onClipboardContent(callback: (data: { toolId: string; content: string }) => void): () => void
  keychain: {
    store(provider: string, key: string): Promise<void>
    get(provider: string): Promise<string | null>
    delete(provider: string): Promise<void>
    has(provider: string): Promise<boolean>
  }
  settings: {
    get(key: string, defaultValue?: unknown): Promise<unknown>
    set(key: string, value: unknown): Promise<void>
  }
  ai: {
    complete(params: {
      prompt: string
      systemPrompt?: string
      model?: string
      provider?: string
      temperature?: number
      maxTokens?: number
    }): Promise<{ provider: string; isLocal: boolean }>
    checkOllama(): Promise<boolean>
    listModels(provider: string): Promise<string[]>
    onStreamChunk(callback: (chunk: string) => void): () => void
    onStreamEnd(callback: () => void): () => void
    onStreamError(callback: (error: string) => void): () => void
  }
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
