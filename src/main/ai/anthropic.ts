import Anthropic from '@anthropic-ai/sdk'
import type { AiOptions, AiProvider } from './provider'

export class AnthropicProvider implements AiProvider {
  readonly id = 'anthropic'
  readonly name = 'Anthropic'
  private client: Anthropic
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
    this.client = new Anthropic({ apiKey })
  }

  async isAvailable(): Promise<boolean> {
    return this.apiKey.length > 0
  }

  async listModels(): Promise<string[]> {
    return ['claude-sonnet-4-20250514', 'claude-haiku-4-5-20251001', 'claude-opus-4-20250514']
  }

  async *complete(prompt: string, options?: AiOptions): AsyncGenerator<string, void, unknown> {
    const model = options?.model || 'claude-sonnet-4-20250514'
    const maxTokens = options?.maxTokens || 4096

    try {
      const streamParams: Anthropic.MessageCreateParams = {
        model,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
        stream: true
      }

      if (options?.systemPrompt) {
        streamParams.system = options.systemPrompt
      }

      if (options?.temperature !== undefined) {
        streamParams.temperature = options.temperature
      }

      const stream = this.client.messages.stream(streamParams)

      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          yield event.delta.text
        }
      }
    } catch (error) {
      if (error instanceof Anthropic.AuthenticationError) {
        throw new Error('Invalid Anthropic API key. Check your settings.')
      }
      if (error instanceof Anthropic.RateLimitError) {
        throw new Error('Anthropic rate limit exceeded. Try again later.')
      }
      throw error
    }
  }
}
