import { useState, useEffect } from 'react'
import { Wand2 } from 'lucide-react'
import { MonacoWrapper } from '@/components/editor/MonacoWrapper'
import { ToolHeader } from '@/components/shared/ToolHeader'
import { MagicPrompt } from '@/components/ai/MagicPrompt'

const EXAMPLE_PROMPTS = [
  'Extract all email addresses as JSON array',
  'Convert this CSV to JSON',
  'Convert this cURL to a Python requests script',
]

export default function MagicTransformView() {
  const [input, setInput] = useState('')

  // Auto-read clipboard content
  useEffect(() => {
    window.api.clipboard.read().then((text) => {
      const trimmed = text.trim()
      if (trimmed) {
        setInput(trimmed)
      }
    })
  }, [])

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <ToolHeader
        icon={Wand2}
        name="Magic Transform"
        description="Transform data using natural language prompts"
        toolId="magic-transform"
        aiEnabled
      />

      {/* Example prompt suggestions */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Try:</span>
        {EXAMPLE_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={() => {
              // Copy prompt text for user convenience - they can paste it into the MagicPrompt
              window.api.clipboard.write(prompt)
            }}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input editor */}
      <div className="flex min-h-0 flex-1 flex-col gap-1.5">
        <span className="text-sm font-medium">Input Data</span>
        <div className="min-h-0 flex-1 overflow-hidden rounded-md border border-border">
          <MonacoWrapper
            value={input}
            onChange={setInput}
            language="plaintext"
          />
        </div>
      </div>

      {/* MagicPrompt handles prompt input, streaming output, and privacy badge */}
      <MagicPrompt input={input} />
    </div>
  )
}
