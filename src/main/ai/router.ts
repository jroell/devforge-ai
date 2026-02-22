import { getApiKey } from '../services/keychain'
import type { AiProvider, AiResponse } from './provider'
import { OllamaProvider } from './ollama'
import { OpenAiProvider } from './openai'
import { AnthropicProvider } from './anthropic'
import { GoogleProvider } from './google'

const ollamaProvider = new OllamaProvider()

export interface RouterResult {
  provider: AiProvider
  meta: AiResponse
}

export async function checkOllamaStatus(): Promise<boolean> {
  return ollamaProvider.isAvailable()
}

export async function getProvider(preferredProvider?: string): Promise<RouterResult> {
  // If explicitly requesting Ollama or no preference, try Ollama first
  if (!preferredProvider || preferredProvider === 'ollama') {
    const ollamaAvailable = await ollamaProvider.isAvailable()
    if (ollamaAvailable) {
      return {
        provider: ollamaProvider,
        meta: { provider: 'ollama', isLocal: true }
      }
    }
    // If user explicitly asked for Ollama but it's not available, throw
    if (preferredProvider === 'ollama') {
      throw new Error('Ollama is not running. Start it with: ollama serve')
    }
  }

  // If a specific cloud provider is requested, use it
  if (preferredProvider && preferredProvider !== 'ollama') {
    const provider = buildCloudProvider(preferredProvider)
    if (provider && (await provider.isAvailable())) {
      return {
        provider,
        meta: { provider: preferredProvider, isLocal: false }
      }
    }
    throw new Error(`Provider "${preferredProvider}" is not available. Check your API key in settings.`)
  }

  // Fallback: try each cloud provider in order
  const providerOrder = ['openai', 'anthropic', 'google']
  for (const id of providerOrder) {
    const provider = buildCloudProvider(id)
    if (provider && (await provider.isAvailable())) {
      return {
        provider,
        meta: { provider: id, isLocal: false }
      }
    }
  }

  throw new Error('No AI provider available. Install Ollama for local AI or add an API key in settings.')
}

export async function getProviderById(providerId: string): Promise<AiProvider | null> {
  if (providerId === 'ollama') {
    return ollamaProvider
  }
  return buildCloudProvider(providerId)
}

function buildCloudProvider(id: string): AiProvider | null {
  const apiKey = getApiKey(id)
  if (!apiKey) return null

  switch (id) {
    case 'openai':
      return new OpenAiProvider(apiKey)
    case 'anthropic':
      return new AnthropicProvider(apiKey)
    case 'google':
      return new GoogleProvider(apiKey)
    default:
      return null
  }
}
