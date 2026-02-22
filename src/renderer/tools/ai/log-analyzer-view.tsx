import { useState, useEffect } from 'react'
import { Bug, Play, Eraser } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ToolHeader } from '@/components/shared/ToolHeader'
import { useAi } from '@/hooks/useAi'
import { StreamingOutput } from '@/components/ai/StreamingOutput'
import { PrivacyBadge } from '@/components/ai/PrivacyBadge'

export default function LogAnalyzerView() {
  const [input, setInput] = useState('')

  const ai = useAi({
    systemPrompt:
      'You are a senior software engineer and debugging expert. Analyze the provided error log, stack trace, or log output. Identify: 1) The root cause of the error, 2) The specific file and line that likely caused it, 3) A clear explanation of why this error occurred, 4) Suggested fixes or next debugging steps. Format your response with clear markdown headings.',
  })

  // Auto-read clipboard on mount
  useEffect(() => {
    window.api.clipboard.read().then((text) => {
      const trimmed = text.trim()
      // Check if clipboard content looks like a log/error/stack trace
      const looksLikeLog =
        /(?:error|exception|stack|trace|at\s+\w|throw|fatal|warn|panic|caused by)/i.test(trimmed)
      if (looksLikeLog && trimmed.length > 20) {
        setInput(trimmed)
      }
    })
  }, [])

  const handleAnalyze = () => {
    if (!input.trim()) return
    ai.reset()
    ai.generate(`Analyze this error log / stack trace:\n\n${input}`)
  }

  const handleClear = () => {
    setInput('')
    ai.reset()
  }

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <ToolHeader
        icon={Bug}
        name="Log/Error Analyzer"
        description="AI-powered stack trace and error log analysis"
        toolId="log-analyzer"
        aiEnabled
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          onClick={handleAnalyze}
          disabled={!input.trim() || ai.isStreaming}
        >
          <Play className="size-3.5" />
          Analyze
        </Button>
        <Button variant="outline" size="sm" onClick={handleClear}>
          <Eraser className="size-3.5" />
          Clear
        </Button>
        <div className="ml-auto">
          <PrivacyBadge isLocal={ai.isLocal} provider={ai.providerUsed} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Paste logs, stack trace, or error output</Label>
        <Textarea
          placeholder="Paste your error log, stack trace, or log output here..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="min-h-40 resize-y font-mono text-xs"
        />
      </div>

      <div className="min-h-0 flex-1">
        <StreamingOutput
          output={ai.output}
          isStreaming={ai.isStreaming}
          error={ai.error}
          className="h-full"
        />
      </div>
    </div>
  )
}
