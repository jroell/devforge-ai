import { BrowserWindow, ipcMain } from 'electron'
import { getProvider, getProviderById, checkOllamaStatus } from '../ai/router'
import { OllamaProvider } from '../ai/ollama'

interface AiCompleteParams {
  prompt: string
  systemPrompt?: string
  model?: string
  provider?: string
  temperature?: number
  maxTokens?: number
}

export function registerAiHandlers(): void {
  ipcMain.handle(
    'ai:complete',
    async (event, params: AiCompleteParams) => {
      const win = BrowserWindow.fromWebContents(event.sender)
      if (!win) {
        throw new Error('No window found for AI request')
      }

      const { provider, meta } = await getProvider(params.provider)

      // Start streaming in the background -- don't await it
      // The invoke returns the provider metadata immediately
      const streamToRenderer = async (): Promise<void> => {
        try {
          const generator = provider.complete(params.prompt, {
            model: params.model,
            temperature: params.temperature,
            maxTokens: params.maxTokens,
            systemPrompt: params.systemPrompt
          })

          for await (const chunk of generator) {
            if (win.isDestroyed()) break
            win.webContents.send('ai:stream-chunk', chunk)
          }

          if (!win.isDestroyed()) {
            win.webContents.send('ai:stream-end')
          }
        } catch (error) {
          if (!win.isDestroyed()) {
            const message = error instanceof Error ? error.message : 'Unknown AI error'
            win.webContents.send('ai:stream-error', message)
          }
        }
      }

      // Fire and forget the streaming
      streamToRenderer()

      return meta
    }
  )

  ipcMain.handle('ai:check-ollama', async () => {
    return checkOllamaStatus()
  })

  ipcMain.handle('ai:list-models', async (_event, providerId: string) => {
    if (providerId === 'ollama') {
      const ollama = new OllamaProvider()
      return ollama.listModels()
    }

    const provider = await getProviderById(providerId)
    if (!provider) {
      return []
    }
    return provider.listModels()
  })
}
