import OpenAI from 'openai'
import type { AiOptions, AiProvider } from './provider'

export class OpenAiProvider implements AiProvider {
  readonly id = 'openai'
  readonly name = 'OpenAI'
  private client: OpenAI
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
    this.client = new OpenAI({ apiKey })
  }

  async isAvailable(): Promise<boolean> {
    return this.apiKey.length > 0
  }

  async listModels(): Promise<string[]> {
    return ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo']
  }

  async *complete(prompt: string, options?: AiOptions): AsyncGenerator<string, void, unknown> {
    const model = options?.model || 'gpt-4o-mini'
    const systemPrompt = options?.systemPrompt || 'You are a helpful developer assistant.'

    try {
      const stream = await this.client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens,
        stream: true
      })

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content
        if (content) {
          yield content
        }
      }
    } catch (error) {
      if (error instanceof OpenAI.AuthenticationError) {
        throw new Error('Invalid OpenAI API key. Check your settings.')
      }
      if (error instanceof OpenAI.RateLimitError) {
        throw new Error('OpenAI rate limit exceeded. Try again later.')
      }
      throw error
    }
  }
}
