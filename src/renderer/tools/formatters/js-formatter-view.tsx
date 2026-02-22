import { useState, useEffect, useCallback } from 'react'
import { FileJson2, Eraser, ArrowRightFromLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MonacoWrapper } from '@/components/editor/MonacoWrapper'
import { ToolHeader } from '@/components/shared/ToolHeader'
import { CopyButton } from '@/components/shared/CopyButton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

type LanguageMode = 'javascript' | 'typescript'

async function formatJs(code: string, mode: LanguageMode): Promise<string> {
  const prettier = await import('prettier/standalone')
  const babelPlugin = await import('prettier/plugins/babel')
  const estreePlugin = await import('prettier/plugins/estree')

  if (mode === 'typescript') {
    const typescriptPlugin = await import('prettier/plugins/typescript')
    return prettier.format(code, {
      parser: 'typescript',
      plugins: [typescriptPlugin, estreePlugin],
      semi: true,
      singleQuote: true
    })
  }

  return prettier.format(code, {
    parser: 'babel',
    plugins: [babelPlugin, estreePlugin],
    semi: true,
    singleQuote: true
  })
}

export default function JsFormatterView() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<LanguageMode>('javascript')

  useEffect(() => {
    window.api.clipboard.read().then((text) => {
      const trimmed = text.trim()
      if (/(?:function|const|let|var|import|export|=>)\s/.test(trimmed)) {
        setInput(trimmed)
        handleFormatText(trimmed, mode)
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

  const handleFormatText = useCallback(async (text: string, lang: LanguageMode) => {
    if (!text.trim()) {
      setOutput('')
      setError(null)
      return
    }
    try {
      const formatted = await formatJs(text, lang)
      setOutput(formatted)
      setError(null)
    } catch (e) {
      setOutput('')
      setError(e instanceof Error ? e.message : 'Failed to format code')
    }
  }, [])

  const handleFormat = () => handleFormatText(input, mode)

  const handleModeChange = (newMode: string) => {
    const lang = newMode as LanguageMode
    setMode(lang)
    if (input.trim()) {
      handleFormatText(input, lang)
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
        icon={FileJson2}
        name="JS/TS Formatter"
        description="Format JavaScript and TypeScript with Prettier"
      />

      <div className="flex flex-wrap items-center gap-2">
        <Tabs value={mode} onValueChange={handleModeChange}>
          <TabsList>
            <TabsTrigger value="javascript">JavaScript</TabsTrigger>
            <TabsTrigger value="typescript">TypeScript</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="outline" size="sm" onClick={handleFormat}>
          Format
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
            <MonacoWrapper value={input} onChange={(v) => setInput(v)} language={mode} />
          </div>
        </div>
        <div className="flex flex-col gap-1.5 overflow-hidden">
          <span className="text-sm font-medium">Output</span>
          <div className="min-h-0 flex-1 overflow-hidden rounded-md border border-border">
            <MonacoWrapper value={output} language={mode} readOnly />
          </div>
        </div>
      </div>
    </div>
  )
}
