import { useState, useEffect, useCallback } from 'react'
import { FileText, Eraser, ArrowRightFromLine, Braces } from 'lucide-react'
import yaml from 'js-yaml'
import { Button } from '@/components/ui/button'
import { MonacoWrapper } from '@/components/editor/MonacoWrapper'
import { ToolHeader } from '@/components/shared/ToolHeader'
import { CopyButton } from '@/components/shared/CopyButton'

export default function YamlFormatterView() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showJson, setShowJson] = useState(false)

  useEffect(() => {
    window.api.clipboard.read().then((text) => {
      const trimmed = text.trim()
      if (/^---\s*\n|^\w[\w-]*:\s/m.test(trimmed)) {
        setInput(trimmed)
        handleFormatText(trimmed)
      }
    })
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        handleCopyAndClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [output])

  const handleFormatText = useCallback((text: string) => {
    if (!text.trim()) {
      setOutput('')
      setError(null)
      return
    }
    try {
      const parsed = yaml.load(text)
      const formatted = yaml.dump(parsed, { indent: 2, lineWidth: 120 })
      setOutput(formatted)
      setError(null)
    } catch (e) {
      setOutput('')
      setError(e instanceof Error ? e.message : 'Invalid YAML')
    }
  }, [])

  const handleFormat = () => handleFormatText(input)

  const handleShowJson = () => {
    if (!input.trim()) return
    try {
      const parsed = yaml.load(input)
      setOutput(JSON.stringify(parsed, null, 2))
      setShowJson(true)
      setError(null)
    } catch (e) {
      setOutput('')
      setError(e instanceof Error ? e.message : 'Invalid YAML')
    }
  }

  const handleShowYaml = () => {
    setShowJson(false)
    handleFormatText(input)
  }

  const handleClear = () => {
    setInput('')
    setOutput('')
    setError(null)
    setShowJson(false)
  }

  const handleCopyAndClose = async () => {
    if (!output) return
    await window.api.clipboard.write(output)
    window.api.window.hide()
  }

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <ToolHeader
        icon={FileText}
        name="YAML Formatter"
        description="Format and validate YAML documents"
        toolId="yaml-formatter"
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={!showJson ? 'default' : 'outline'}
          size="sm"
          onClick={showJson ? handleShowYaml : handleFormat}
        >
          Format YAML
        </Button>
        <Button
          variant={showJson ? 'default' : 'outline'}
          size="sm"
          onClick={handleShowJson}
        >
          <Braces className="size-3.5" />
          Show as JSON
        </Button>
        <Button variant="outline" size="sm" onClick={handleClear}>
          <Eraser className="size-3.5" />
          Clear
        </Button>
        <div className="ml-auto flex items-center gap-2">
          {output && <CopyButton text={output} />}
          <Button size="sm" onClick={handleCopyAndClose} disabled={!output}>
            <ArrowRightFromLine className="size-3.5" />
            Copy & Close
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500">
          {error}
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5 overflow-hidden">
          <span className="text-sm font-medium">Input</span>
          <div className="min-h-0 flex-1 overflow-hidden rounded-md border border-border">
            <MonacoWrapper value={input} onChange={(v) => setInput(v)} language="yaml" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5 overflow-hidden">
          <span className="text-sm font-medium">Output {showJson ? '(JSON)' : '(YAML)'}</span>
          <div className="min-h-0 flex-1 overflow-hidden rounded-md border border-border">
            <MonacoWrapper value={output} language={showJson ? 'json' : 'yaml'} readOnly />
          </div>
        </div>
      </div>
    </div>
  )
}
