import type { AiOptions, AiProvider } from './provider'

export class OllamaProvider implements AiProvider {
  readonly id = 'ollama'
  readonly name = 'Ollama (Local)'
  private endpoint: string

  constructor(endpoint = 'http://localhost:11434') {
    this.endpoint = endpoint.replace(/\/+$/, '')
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.endpoint}/api/tags`, {
        signal: AbortSignal.timeout(3000)
      })
      return response.ok
    } catch {
      return false
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.endpoint}/api/tags`, {
        signal: AbortSignal.timeout(5000)
      })
      if (!response.ok) return []
      const data = (await response.json()) as { models?: Array<{ name: string }> }
      return data.models?.map((m) => m.name) ?? []
    } catch {
      return []
    }
  }

  async *complete(prompt: string, options?: AiOptions): AsyncGenerator<string, void, unknown> {
    const model = options?.model || 'llama3.2'
    const body: Record<string, unknown> = {
      model,
      prompt,
      stream: true
    }

    if (options?.systemPrompt) {
      body.system = options.systemPrompt
    }

    if (options?.temperature !== undefined) {
      body.options = { temperature: options.temperature }
    }

    try {
      const response = await fetch(`${this.endpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        throw new Error(`Ollama returned status ${response.status}`)
      }

      if (!response.body) {
        throw new Error('No response body from Ollama')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.trim()) continue
          try {
            const parsed = JSON.parse(line) as { response?: string; done?: boolean }
            if (parsed.response) {
              yield parsed.response
            }
          } catch {
            // Skip malformed JSON lines
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        try {
          const parsed = JSON.parse(buffer) as { response?: string }
          if (parsed.response) {
            yield parsed.response
          }
        } catch {
          // Skip malformed JSON
        }
      }
    } catch (error) {
      if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('ECONNREFUSED'))) {
        throw new Error('Ollama is not running. Start it with: ollama serve')
      }
      throw error
    }
  }
}
