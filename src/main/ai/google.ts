import { GoogleGenerativeAI } from '@google/generative-ai'
import type { AiOptions, AiProvider } from './provider'

export class GoogleProvider implements AiProvider {
  readonly id = 'google'
  readonly name = 'Google Gemini'
  private genAI: GoogleGenerativeAI
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
    this.genAI = new GoogleGenerativeAI(apiKey)
  }

  async isAvailable(): Promise<boolean> {
    return this.apiKey.length > 0
  }

  async listModels(): Promise<string[]> {
    return ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash']
  }

  async *complete(prompt: string, options?: AiOptions): AsyncGenerator<string, void, unknown> {
    const modelName = options?.model || 'gemini-2.0-flash'

    try {
      const modelConfig: { model: string; systemInstruction?: string } = {
        model: modelName
      }

      if (options?.systemPrompt) {
        modelConfig.systemInstruction = options.systemPrompt
      }

      const model = this.genAI.getGenerativeModel(modelConfig)

      const generationConfig: Record<string, unknown> = {}
      if (options?.temperature !== undefined) {
        generationConfig.temperature = options.temperature
      }
      if (options?.maxTokens !== undefined) {
        generationConfig.maxOutputTokens = options.maxTokens
      }

      const result = await model.generateContentStream({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig
      })

      for await (const chunk of result.stream) {
        const text = chunk.text()
        if (text) {
          yield text
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('PERMISSION_DENIED')) {
        throw new Error('Invalid Google AI API key. Check your settings.')
      }
      if (errorMessage.includes('RESOURCE_EXHAUSTED')) {
        throw new Error('Google AI rate limit exceeded. Try again later.')
      }
      throw error
    }
  }
}
