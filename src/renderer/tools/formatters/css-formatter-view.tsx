import { useState, useEffect, useCallback } from 'react'
import { Palette, Minimize2, Eraser, ArrowRightFromLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MonacoWrapper } from '@/components/editor/MonacoWrapper'
import { ToolHeader } from '@/components/shared/ToolHeader'
import { CopyButton } from '@/components/shared/CopyButton'

async function formatCss(css: string): Promise<string> {
  const prettier = await import('prettier/standalone')
  const cssPlugin = await import('prettier/plugins/postcss')
  return prettier.format(css, {
    parser: 'css',
    plugins: [cssPlugin]
  })
}

function minifyCss(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim()
}

export default function CssFormatterView() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    window.api.clipboard.read().then((text) => {
      const trimmed = text.trim()
      if (/[.#@][\w-]+\s*\{/.test(trimmed) || /^\s*\*\s*\{/.test(trimmed)) {
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

  const handleFormatText = useCallback(async (text: string) => {
    if (!text.trim()) {
      setOutput('')
      setError(null)
      return
    }
    try {
      const formatted = await formatCss(text)
      setOutput(formatted)
      setError(null)
    } catch (e) {
      setOutput('')
      setError(e instanceof Error ? e.message : 'Failed to format CSS')
    }
  }, [])

  const handleFormat = () => handleFormatText(input)

  const handleMinify = () => {
    if (!input.trim()) return
    try {
      setOutput(minifyCss(input))
      setError(null)
    } catch (e) {
      setOutput('')
      setError(e instanceof Error ? e.message : 'Failed to minify CSS')
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
        icon={Palette}
        name="CSS Formatter"
        description="Format and minify CSS stylesheets"
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleFormat}>
          Format
        </Button>
        <Button variant="outline" size="sm" onClick={handleMinify}>
          <Minimize2 className="size-3.5" />
          Minify
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
            <MonacoWrapper value={input} onChange={(v) => setInput(v)} language="css" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5 overflow-hidden">
          <span className="text-sm font-medium">Output</span>
          <div className="min-h-0 flex-1 overflow-hidden rounded-md border border-border">
            <MonacoWrapper value={output} language="css" readOnly />
          </div>
        </div>
      </div>
    </div>
  )
}
