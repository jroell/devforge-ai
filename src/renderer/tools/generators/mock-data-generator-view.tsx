import { useState, useCallback } from 'react'
import { Database, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToolHeader } from '@/components/shared/ToolHeader'
import { CopyButton } from '@/components/shared/CopyButton'
import { PrivacyBadge } from '@/components/ai/PrivacyBadge'
import { StreamingOutput } from '@/components/ai/StreamingOutput'
import { useAi } from '@/hooks/useAi'

type OutputFormat = 'json' | 'csv' | 'sql'

const FORMAT_OPTIONS: { value: OutputFormat; label: string }[] = [
  { value: 'json', label: 'JSON' },
  { value: 'csv', label: 'CSV' },
  { value: 'sql', label: 'SQL INSERT' },
]

const PRESETS = [
  '50 users with names and emails',
  'Product catalog (20 items)',
  'API error responses',
  'Database seed data',
]

const SYSTEM_PROMPT =
  'You are a mock data generation expert. Generate realistic, diverse mock data based on the user\'s description. The data should look authentic \u2014 use real-seeming names, valid formats for emails/phones/addresses, and logical relationships between fields. Output the data in the requested format. Return ONLY the generated data, no explanation.'

export default function MockDataGeneratorView() {
  const [prompt, setPrompt] = useState('')
  const [format, setFormat] = useState<OutputFormat>('json')

  const { output, isStreaming, error, providerUsed, isLocal, generate, cancel, reset } = useAi({
    systemPrompt: SYSTEM_PROMPT,
  })

  const handleGenerate = useCallback(() => {
    if (!prompt.trim() || isStreaming) return
    reset()
    const fullPrompt = `Generate the following data in ${format.toUpperCase()} format: ${prompt}`
    generate(fullPrompt)
  }, [prompt, format, isStreaming, generate, reset])

  const handlePreset = useCallback((preset: string) => {
    setPrompt(preset)
  }, [])

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <ToolHeader
        icon={Database}
        name="AI Mock Data"
        description="Generate realistic mock data with AI"
        toolId="mock-data-generator"
        aiEnabled
      />

      {/* Quick presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Quick:</span>
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={() => handlePreset(preset)}
          >
            {preset}
          </button>
        ))}
      </div>

      {/* Prompt input */}
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Describe the data you want</span>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. 100 realistic e-commerce orders with product names, quantities, prices, and shipping addresses..."
          className="min-h-28 resize-y font-mono"
        />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={format} onValueChange={(v) => setFormat(v as OutputFormat)}>
          <SelectTrigger size="sm" className="w-36">
            <SelectValue placeholder="Output format" />
          </SelectTrigger>
          <SelectContent>
            {FORMAT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isStreaming ? (
          <Button variant="destructive" size="sm" onClick={cancel}>
            <Loader2 className="size-3.5 animate-spin" />
            Cancel
          </Button>
        ) : (
          <Button size="sm" onClick={handleGenerate} disabled={!prompt.trim()}>
            <Sparkles className="size-3.5" />
            Generate
          </Button>
        )}

        {output && !isStreaming && <CopyButton text={output} />}

        <div className="ml-auto">
          <PrivacyBadge isLocal={isLocal} provider={providerUsed} />
        </div>
      </div>

      {/* Output */}
      {(output || isStreaming || error) && (
        <div className="min-h-0 flex-1">
          <StreamingOutput output={output} isStreaming={isStreaming} error={error} />
        </div>
      )}
    </div>
  )
}
