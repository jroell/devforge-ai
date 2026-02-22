import { useState, useCallback, useRef, useEffect } from 'react'
import { useAiConfigStore } from '@/stores/ai-config'

interface UseAiOptions {
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
}

interface UseAiReturn {
  output: string
  isStreaming: boolean
  error: string | null
  providerUsed: string | null
  isLocal: boolean | null
  generate: (prompt: string) => Promise<void>
  cancel: () => void
  reset: () => void
}

export function useAi(options: UseAiOptions = {}): UseAiReturn {
  const [output, setOutput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [providerUsed, setProviderUsed] = useState<string | null>(null)
  const [isLocal, setIsLocal] = useState<boolean | null>(null)
  const cleanupRef = useRef<(() => void)[]>([])
  const cancelledRef = useRef(false)

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      cleanupRef.current.forEach((fn) => fn())
      cleanupRef.current = []
    }
  }, [])

  const generate = useCallback(
    async (prompt: string) => {
      // Clean up previous listeners
      cleanupRef.current.forEach((fn) => fn())
      cleanupRef.current = []
      cancelledRef.current = false

      setOutput('')
      setError(null)
      setIsStreaming(true)
      setProviderUsed(null)
      setIsLocal(null)

      // Set up stream listeners BEFORE calling complete
      const unsub1 = window.api.ai.onStreamChunk((chunk) => {
        if (!cancelledRef.current) {
          setOutput((prev) => prev + chunk)
        }
      })
      const unsub2 = window.api.ai.onStreamEnd(() => {
        setIsStreaming(false)
        cleanupRef.current.forEach((fn) => fn())
        cleanupRef.current = []
      })
      const unsub3 = window.api.ai.onStreamError((err) => {
        setError(err)
        setIsStreaming(false)
        cleanupRef.current.forEach((fn) => fn())
        cleanupRef.current = []
      })
      cleanupRef.current = [unsub1, unsub2, unsub3]

      try {
        const { preferredProvider, providers } = useAiConfigStore.getState()
        const providerConfig = providers[preferredProvider]

        const result = await window.api.ai.complete({
          prompt,
          systemPrompt: options.systemPrompt,
          model: providerConfig?.model,
          provider: preferredProvider,
          temperature: options.temperature,
          maxTokens: options.maxTokens,
        })

        setProviderUsed(result.provider)
        setIsLocal(result.isLocal)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to start AI generation')
        setIsStreaming(false)
      }
    },
    [options.systemPrompt, options.temperature, options.maxTokens]
  )

  const cancel = useCallback(() => {
    cancelledRef.current = true
    setIsStreaming(false)
    cleanupRef.current.forEach((fn) => fn())
    cleanupRef.current = []
  }, [])

  const reset = useCallback(() => {
    cancel()
    setOutput('')
    setError(null)
    setProviderUsed(null)
    setIsLocal(null)
  }, [cancel])

  return { output, isStreaming, error, providerUsed, isLocal, generate, cancel, reset }
}
