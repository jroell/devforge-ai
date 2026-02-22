import { useState, useCallback } from 'react'
import { Play, Eraser, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ToolHeader } from '@/components/shared/ToolHeader'
import { CopyButton } from '@/components/shared/CopyButton'
import { MonacoWrapper } from '@/components/editor/MonacoWrapper'
import { useCustomToolsStore } from '@/stores/custom-tools'
import { getIconByName } from './icon-lookup'
import type { CustomToolConfig, CustomToolInput } from './types'

function DynamicField({
  input,
  value,
  onChange
}: {
  input: CustomToolInput
  value: string
  onChange: (val: string) => void
}) {
  switch (input.type) {
    case 'textarea':
      return (
        <div className="flex flex-col gap-1.5">
          <Label>{input.label}</Label>
          <Textarea
            placeholder={input.placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-24 resize-y font-mono"
          />
        </div>
      )
    case 'number':
      return (
        <div className="flex flex-col gap-1.5">
          <Label>{input.label}</Label>
          <Input
            type="number"
            placeholder={input.placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="font-mono"
          />
        </div>
      )
    case 'select':
      return (
        <div className="flex flex-col gap-1.5">
          <Label>{input.label}</Label>
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {input.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )
    case 'checkbox':
      return (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value === 'true'}
            onChange={(e) => onChange(String(e.target.checked))}
            className="size-4 rounded border-input"
          />
          <Label>{input.label}</Label>
        </div>
      )
    default:
      return (
        <div className="flex flex-col gap-1.5">
          <Label>{input.label}</Label>
          <Input
            placeholder={input.placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="font-mono"
          />
        </div>
      )
  }
}

export default function CustomToolRenderer({ toolId }: { toolId: string }) {
  const { tools } = useCustomToolsStore()
  const config = tools.find((t) => t.id === toolId) as CustomToolConfig | undefined

  const [inputValues, setInputValues] = useState<Record<string, string>>(() => {
    if (!config) return {}
    const initial: Record<string, string> = {}
    for (const inp of config.inputs) {
      initial[inp.id] = inp.defaultValue ?? ''
    }
    return initial
  })

  const [output, setOutput] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleRun = useCallback(() => {
    if (!config) return
    setError(null)
    try {
      const fn = new Function('inputs', config.transform)
      const result = fn(inputValues)
      setOutput(typeof result === 'string' ? result : JSON.stringify(result, null, 2))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transform execution failed')
      setOutput(null)
    }
  }, [config, inputValues])

  const handleClear = () => {
    if (!config) return
    const cleared: Record<string, string> = {}
    for (const inp of config.inputs) {
      cleared[inp.id] = inp.defaultValue ?? ''
    }
    setInputValues(cleared)
    setOutput(null)
    setError(null)
  }

  if (!config) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Tool not found. It may have been deleted.
      </div>
    )
  }

  const Icon = getIconByName(config.icon)
  const outputLang =
    config.outputFormat === 'json'
      ? 'json'
      : config.outputFormat === 'markdown'
        ? 'markdown'
        : config.outputFormat === 'html'
          ? 'html'
          : 'plaintext'

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <ToolHeader
        icon={Icon}
        name={config.name}
        description={config.description}
        toolId={config.id}
      />

      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleRun}>
          <Play className="size-3.5" />
          Run
        </Button>
        <Button variant="outline" size="sm" onClick={handleClear}>
          <Eraser className="size-3.5" />
          Clear
        </Button>
      </div>

      {/* Dynamic inputs */}
      <div className="flex flex-col gap-3">
        {config.inputs.map((inp) => (
          <DynamicField
            key={inp.id}
            input={inp}
            value={inputValues[inp.id] ?? ''}
            onChange={(val) =>
              setInputValues((prev) => ({ ...prev, [inp.id]: val }))
            }
          />
        ))}
      </div>

      {/* Error display */}
      {error && (
        <div className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div>
            <div className="font-semibold">Transform Error</div>
            <pre className="mt-1 whitespace-pre-wrap text-xs">{error}</pre>
          </div>
        </div>
      )}

      {/* Output */}
      {output !== null && (
        <div className="flex flex-1 flex-col gap-2" style={{ minHeight: 0 }}>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Output</span>
            <CopyButton text={output} />
          </div>
          <div className="flex-1 overflow-hidden rounded-md border border-border">
            <MonacoWrapper
              value={output}
              language={outputLang}
              readOnly
              height="100%"
            />
          </div>
        </div>
      )}
    </div>
  )
}
