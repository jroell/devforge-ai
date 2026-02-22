import { useState, useEffect, useCallback } from 'react'
import { Braces, Minimize2, Eraser, ArrowRightFromLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MonacoWrapper } from '@/components/editor/MonacoWrapper'
import { ToolHeader } from '@/components/shared/ToolHeader'
import { CopyButton } from '@/components/shared/CopyButton'

export default function JsonFormatterView() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    window.api.clipboard.read().then((text) => {
      const trimmed = text.trim()
      if (/^\s*[\[{]/.test(trimmed)) {
        setInput(trimmed)
        formatJson(trimmed, 2)
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

  const formatJson = useCallback((text: string, indent: number) => {
    if (!text.trim()) {
      setOutput('')
      setError(null)
      return
    }
    try {
      const parsed = JSON.parse(text)
      setOutput(indent === 0 ? JSON.stringify(parsed) : JSON.stringify(parsed, null, indent))
      setError(null)
    } catch (e) {
      setOutput('')
      setError(e instanceof Error ? e.message : 'Invalid JSON')
    }
  }, [])

  const handleFormat = (indent: number) => formatJson(input, indent)

  const handleCompact = () => {
    if (!input.trim()) return
    try {
      const parsed = JSON.parse(input)
      setOutput(JSON.stringify(parsed, null, 0).replace(/,/g, ', '))
      setError(null)
    } catch (e) {
      setOutput('')
      setError(e instanceof Error ? e.message : 'Invalid JSON')
    }
  }

  const handleClear = () => {
    setInput('')
    setOutput('')
    setError(null)
  }

  const handleCopyAndClose = async () => {
    if (!output) return
    await window.api.clipboard.write(output)
    window.api.window.hide()
  }

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <ToolHeader
        icon={Braces}
        name="JSON Formatter"
        description="Format, minify, and validate JSON"
        aiEnabled
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => handleFormat(2)}>
          Format (2-space)
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleFormat(4)}>
          4-Space
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleFormat(0)}>
          <Minimize2 className="size-3.5" />
          Minify
        </Button>
        <Button variant="outline" size="sm" onClick={handleCompact}>
          Compact
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
            <MonacoWrapper value={input} onChange={(v) => setInput(v)} language="json" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5 overflow-hidden">
          <span className="text-sm font-medium">Output</span>
          <div className="min-h-0 flex-1 overflow-hidden rounded-md border border-border">
            <MonacoWrapper value={output} language="json" readOnly />
          </div>
        </div>
      </div>
    </div>
  )
}
