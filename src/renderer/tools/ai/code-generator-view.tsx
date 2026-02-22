import { useState, useEffect, useCallback } from 'react'
import { FileType, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MonacoWrapper } from '@/components/editor/MonacoWrapper'
import { ToolHeader } from '@/components/shared/ToolHeader'
import { CopyButton } from '@/components/shared/CopyButton'
import { PrivacyBadge } from '@/components/ai/PrivacyBadge'
import { useAi } from '@/hooks/useAi'

type TargetLanguage = 'typescript' | 'go' | 'rust' | 'python'

const LANGUAGES: { value: TargetLanguage; label: string; monacoLang: string }[] = [
  { value: 'typescript', label: 'TypeScript', monacoLang: 'typescript' },
  { value: 'go', label: 'Go', monacoLang: 'go' },
  { value: 'rust', label: 'Rust', monacoLang: 'rust' },
  { value: 'python', label: 'Python / Pydantic', monacoLang: 'python' },
]

const SYSTEM_PROMPTS: Record<TargetLanguage, string> = {
  typescript:
    'You are a TypeScript expert. Generate strict TypeScript interfaces from the provided JSON. Use proper types (string, number, boolean). Recognize ISO date strings and type them as string with a comment. Use optional properties where values could be null. Return ONLY the TypeScript code, no markdown fences, no explanation.',
  go: 'You are a Go expert. Generate Go struct definitions from the provided JSON. Use proper Go types, json tags, and idiomatic naming. Return ONLY the Go code.',
  rust: 'You are a Rust expert. Generate Rust struct definitions with serde derives from the provided JSON. Use proper Rust types and naming conventions. Return ONLY the Rust code.',
  python:
    'You are a Python expert. Generate Pydantic v2 model definitions from the provided JSON. Use proper Python type hints, field validators where appropriate. Return ONLY the Python code.',
}

export default function CodeGeneratorView() {
  const [input, setInput] = useState('')
  const [language, setLanguage] = useState<TargetLanguage>('typescript')

  const { output, isStreaming, error, providerUsed, isLocal, generate, cancel, reset } = useAi({
    systemPrompt: SYSTEM_PROMPTS[language],
  })

  // Auto-read clipboard if it looks like JSON
  useEffect(() => {
    window.api.clipboard.read().then((text) => {
      const trimmed = text.trim()
      if (/^\s*[\[{]/.test(trimmed)) {
        try {
          JSON.parse(trimmed)
          setInput(trimmed)
        } catch {
          // Not valid JSON, skip
        }
      }
    })
  }, [])

  const handleGenerate = useCallback(() => {
    if (!input.trim() || isStreaming) return
    reset()
    generate(input)
  }, [input, isStreaming, generate, reset])

  const selectedLang = LANGUAGES.find((l) => l.value === language)!

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <ToolHeader
        icon={FileType}
        name="AI Type Generator"
        description="Generate TypeScript, Go, Rust, or Python types from JSON"
        aiEnabled
      />

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={language} onValueChange={(v) => setLanguage(v as TargetLanguage)}>
          <SelectTrigger size="sm" className="w-48">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((lang) => (
              <SelectItem key={lang.value} value={lang.value}>
                {lang.label}
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
          <Button size="sm" onClick={handleGenerate} disabled={!input.trim()}>
            <Sparkles className="size-3.5" />
            Generate
          </Button>
        )}

        <div className="ml-auto">
          <PrivacyBadge isLocal={isLocal} provider={providerUsed} />
        </div>
      </div>

      {/* Editor panes */}
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-3">
        {/* JSON Input */}
        <div className="flex min-h-0 flex-col gap-1.5">
          <span className="text-sm font-medium">JSON Input</span>
          <div className="min-h-0 flex-1 overflow-hidden rounded-md border border-border">
            <MonacoWrapper
              value={input}
              onChange={setInput}
              language="json"
            />
          </div>
        </div>

        {/* Generated Output */}
        <div className="flex min-h-0 flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Generated {selectedLang.label}</span>
            {output && !isStreaming && <CopyButton text={output} />}
          </div>
          <div className="min-h-0 flex-1 overflow-hidden rounded-md border border-border">
            <MonacoWrapper
              value={error ? `// Error: ${error}` : output}
              language={selectedLang.monacoLang}
              readOnly
            />
          </div>
        </div>
      </div>
    </div>
  )
}
