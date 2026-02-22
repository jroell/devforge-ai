import { useState, useMemo } from 'react'
import { Timer, Eraser } from 'lucide-react'
import { CronExpressionParser } from 'cron-parser'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ToolHeader } from '@/components/shared/ToolHeader'
import { useAi } from '@/hooks/useAi'
import { AiActionBar } from '@/components/ai/AiActionBar'
import { StreamingOutput } from '@/components/ai/StreamingOutput'

const FIELD_LABELS = [
  { name: 'Minute', range: '0-59' },
  { name: 'Hour', range: '0-23' },
  { name: 'Day of Month', range: '1-31' },
  { name: 'Month', range: '1-12' },
  { name: 'Day of Week', range: '0-7 (0 & 7 = Sun)' },
]

const PRESETS = [
  { label: 'Every minute', value: '* * * * *' },
  { label: 'Every 15 min', value: '*/15 * * * *' },
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Daily midnight', value: '0 0 * * *' },
  { label: 'Weekly (Mon 9am)', value: '0 9 * * 1' },
  { label: 'Monthly (1st)', value: '0 0 1 * *' },
]

export default function CronParserView() {
  const [expression, setExpression] = useState('*/15 * * * *')

  const ai = useAi({
    systemPrompt:
      'You are a cron expression expert. Translate the provided cron expression into a clear, human-readable description. Be specific about the schedule. Keep it concise -- 1-2 sentences.',
  })

  const parsed = useMemo(() => {
    if (!expression.trim()) return null

    try {
      const cron = CronExpressionParser.parse(expression.trim())
      const nextDates: Date[] = []
      for (let i = 0; i < 10; i++) {
        const next = cron.next()
        nextDates.push(next.toDate())
      }
      return { nextDates, error: null }
    } catch (e) {
      return { nextDates: [], error: e instanceof Error ? e.message : 'Invalid cron expression' }
    }
  }, [expression])

  const fields = useMemo(() => {
    const parts = expression.trim().split(/\s+/)
    // Standard 5-field cron
    if (parts.length < 5) return null
    return parts.slice(0, 5).map((value, i) => ({
      ...FIELD_LABELS[i],
      value,
    }))
  }, [expression])

  const handleExplain = () => {
    ai.reset()
    ai.generate(`Explain this cron expression: ${expression}`)
  }

  const handleClear = () => {
    setExpression('')
    ai.reset()
  }

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <ToolHeader
        icon={Timer}
        name="Cron Parser"
        description="Parse and explain cron expressions"
        toolId="cron-parser"
        aiEnabled
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleClear}>
          <Eraser className="size-3.5" />
          Clear
        </Button>
        <div className="flex flex-wrap items-center gap-1.5">
          {PRESETS.map((preset) => (
            <Button
              key={preset.value}
              variant="ghost"
              size="xs"
              className="text-xs"
              onClick={() => setExpression(preset.value)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Cron Expression Input */}
      <div className="flex flex-col gap-2">
        <Label>Cron Expression</Label>
        <Input
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          placeholder="*/15 * * * *"
          className="font-mono"
        />
      </div>

      {/* AI Action Bar */}
      {expression.trim() && (
        <AiActionBar
          input={expression}
          onExplain={handleExplain}
          showMagicFix={false}
          showExplain
          showGenerate={false}
          isStreaming={ai.isStreaming}
          activeAction={ai.isStreaming ? 'explain' : null}
          providerUsed={ai.providerUsed}
          isLocal={ai.isLocal}
        />
      )}

      {/* Error */}
      {parsed?.error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500">
          {parsed.error}
        </div>
      )}

      {/* Field Breakdown */}
      {fields && !parsed?.error && (
        <div className="flex flex-col gap-2">
          <Label>Field Breakdown</Label>
          <div className="grid grid-cols-5 gap-2">
            {fields.map((field, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-1 rounded-md border border-border bg-muted/30 p-2"
              >
                <code className="text-lg font-bold">{field.value}</code>
                <span className="text-xs font-medium">{field.name}</span>
                <span className="text-[10px] text-muted-foreground">{field.range}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Execution Times */}
      {parsed && parsed.nextDates.length > 0 && (
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <div className="flex items-center gap-2">
            <Label>Next 10 Executions</Label>
            <Badge variant="secondary" className="text-[10px]">
              {parsed.nextDates.length} scheduled
            </Badge>
          </div>
          <ScrollArea className="min-h-0 flex-1 rounded-lg border border-border">
            <div className="flex flex-col gap-1 p-3">
              {parsed.nextDates.map((date, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2"
                >
                  <Badge variant="outline" className="font-mono text-[10px]">
                    #{i + 1}
                  </Badge>
                  <code className="font-mono text-sm">
                    {date.toLocaleString(undefined, {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </code>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* AI Explanation */}
      {(ai.isStreaming || ai.output || ai.error) && (
        <StreamingOutput
          output={ai.output}
          isStreaming={ai.isStreaming}
          error={ai.error}
        />
      )}
    </div>
  )
}
