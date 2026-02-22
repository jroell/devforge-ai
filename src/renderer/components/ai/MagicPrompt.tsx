import { useState, useCallback } from 'react'
import { Send, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PrivacyBadge } from './PrivacyBadge'
import { StreamingOutput } from './StreamingOutput'
import { useAi } from '@/hooks/useAi'
import { cn } from '@/lib/utils'

interface MagicPromptProps {
  input: string
  className?: string
}

export function MagicPrompt({ input, className }: MagicPromptProps) {
  const [prompt, setPrompt] = useState('')
  const { output, isStreaming, error, providerUsed, isLocal, generate, cancel, reset } =
    useAi({
      systemPrompt:
        'You are a developer tool assistant. The user will provide input data and a natural language instruction. Transform or analyze the input according to the instruction. Return only the result without explanation unless asked.',
    })

  const handleSubmit = useCallback(() => {
    if (!prompt.trim() || isStreaming) return
    const fullPrompt = `Input data:\n\`\`\`\n${input}\n\`\`\`\n\nInstruction: ${prompt}`
    generate(fullPrompt)
  }, [prompt, input, isStreaming, generate])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit]
  )

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Input preview */}
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Input Data</span>
        <ScrollArea className="max-h-[200px] rounded-md border border-border bg-muted/30">
          <pre className="p-3 font-mono text-sm whitespace-pre-wrap break-all text-muted-foreground">
            {input || 'No input data provided'}
          </pre>
        </ScrollArea>
      </div>

      {/* Prompt input */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Prompt</span>
          <PrivacyBadge isLocal={isLocal} provider={providerUsed} />
        </div>
        <div className="flex gap-2">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='e.g. "Extract all IPs that returned 404" or "Convert to TypeScript interface"'
            className="min-h-[60px] resize-none"
            disabled={isStreaming}
          />
          <div className="flex flex-col gap-1">
            {isStreaming ? (
              <Button
                variant="destructive"
                size="icon"
                onClick={cancel}
                className="shrink-0"
              >
                <Square className="size-4" />
              </Button>
            ) : (
              <Button
                variant="default"
                size="icon"
                onClick={handleSubmit}
                disabled={!prompt.trim() || !input}
                className="shrink-0"
              >
                <Send className="size-4" />
              </Button>
            )}
            {(output || error) && !isStreaming && (
              <Button
                variant="ghost"
                size="icon"
                onClick={reset}
                className="shrink-0 text-xs"
                title="Clear output"
              >
                &times;
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Streaming output */}
      {(output || isStreaming || error) && (
        <StreamingOutput
          output={output}
          isStreaming={isStreaming}
          error={error}
        />
      )}
    </div>
  )
}
