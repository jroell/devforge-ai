import { create } from 'zustand'

export type AiProviderId = 'ollama' | 'openai' | 'anthropic' | 'google'

interface AiProviderConfig {
  enabled: boolean
  model: string
  apiKeySet: boolean
}

interface AiConfigState {
  preferredProvider: AiProviderId
  ollamaEndpoint: string
  ollamaAvailable: boolean
  providers: Record<AiProviderId, AiProviderConfig>
  setPreferredProvider: (id: AiProviderId) => void
  setOllamaEndpoint: (url: string) => void
  setOllamaAvailable: (available: boolean) => void
  updateProvider: (id: AiProviderId, config: Partial<AiProviderConfig>) => void
  loadFromKeychain: () => Promise<void>
}

export const useAiConfigStore = create<AiConfigState>((set) => ({
  preferredProvider: 'ollama',
  ollamaEndpoint: 'http://localhost:11434',
  ollamaAvailable: false,
  providers: {
    ollama: { enabled: true, model: 'llama3', apiKeySet: false },
    openai: { enabled: false, model: 'gpt-4o', apiKeySet: false },
    anthropic: { enabled: false, model: 'claude-sonnet-4-20250514', apiKeySet: false },
    google: { enabled: false, model: 'gemini-2.0-flash', apiKeySet: false },
  },
  setPreferredProvider: (id) => set({ preferredProvider: id }),
  setOllamaEndpoint: (url) => set({ ollamaEndpoint: url }),
  setOllamaAvailable: (available) => set({ ollamaAvailable: available }),
  updateProvider: (id, config) =>
    set((state) => ({
      providers: {
        ...state.providers,
        [id]: { ...state.providers[id], ...config },
      },
    })),
  loadFromKeychain: async () => {
    const providers: AiProviderId[] = ['openai', 'anthropic', 'google']
    for (const p of providers) {
      const has = await window.api.keychain.has(p)
      set((state) => ({
        providers: {
          ...state.providers,
          [p]: { ...state.providers[p], apiKeySet: has, enabled: has },
        },
      }))
    }
  },
}))
