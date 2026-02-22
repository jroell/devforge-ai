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
    popout(toolId: string): Promise<void>
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
  customTools: {
    list(): Promise<unknown[]>
    get(id: string): Promise<unknown>
    save(config: unknown): Promise<unknown>
    delete(id: string): Promise<void>
  }
  updater: {
    check(): Promise<string | null>
    download(): Promise<void>
    install(): Promise<void>
    onChecking(callback: () => void): () => void
    onAvailable(callback: (info: { version: string; releaseNotes: unknown }) => void): () => void
    onNotAvailable(callback: () => void): () => void
    onProgress(callback: (progress: { percent: number; bytesPerSecond: number; transferred: number; total: number }) => void): () => void
    onDownloaded(callback: () => void): () => void
    onError(callback: (error: string) => void): () => void
  }
  license: {
    fingerprint(): Promise<string>
    activate(): Promise<{
      status: 'trial' | 'expired' | 'licensed'
      machineId: string
      expiresAt: string | null
      timestamp: number
      signature: string
    }>
    validate(): Promise<{
      status: 'trial' | 'expired' | 'licensed'
      machineId: string
      expiresAt: string | null
      timestamp: number
      signature: string
    }>
    check(): Promise<{
      status: 'trial' | 'expired' | 'licensed' | 'unknown'
      expiresAt: string | null
      daysRemaining: number | null
      lastValidated: number | null
    }>
    cached(): Promise<{
      status: 'trial' | 'expired' | 'licensed' | 'unknown'
      expiresAt: string | null
      daysRemaining: number | null
      lastValidated: number | null
    }>
    upgrade(): Promise<string>
    onStatusUpdate(callback: (state: {
      status: 'trial' | 'expired' | 'licensed' | 'unknown'
      expiresAt: string | null
      daysRemaining: number | null
      lastValidated: number | null
    }) => void): () => void
  }
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
