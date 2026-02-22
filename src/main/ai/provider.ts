export interface AiOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
}

export interface AiProvider {
  id: string
  name: string
  isAvailable(): Promise<boolean>
  listModels(): Promise<string[]>
  complete(prompt: string, options?: AiOptions): AsyncGenerator<string, void, unknown>
}

export interface AiResponse {
  provider: string
  isLocal: boolean
}
