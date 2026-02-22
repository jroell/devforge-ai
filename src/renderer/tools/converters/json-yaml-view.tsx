import { useState, useEffect, useCallback } from 'react'
import { ArrowLeftRight, Eraser, ArrowRightFromLine } from 'lucide-react'
import yaml from 'js-yaml'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ToolHeader } from '@/components/shared/ToolHeader'
import { MonacoWrapper } from '@/components/editor/MonacoWrapper'
import { CopyButton } from '@/components/shared/CopyButton'

function isJSON(text: string): boolean {
  try {
    JSON.parse(text)
    return true
  } catch {
    return false
  }
}

function jsonToYaml(text: string): string {
  const parsed = JSON.parse(text)
  return yaml.dump(parsed, { indent: 2, lineWidth: -1 })
}

function yamlToJson(text: string): string {
  const parsed = yaml.load(text)
  return JSON.stringify(parsed, null, 2)
}

export default function JsonYamlView() {
  const [mode, setMode] = useState<'json-to-yaml' | 'yaml-to-json'>('json-to-yaml')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    window.api.clipboard.read().then((text) => {
      const trimmed = text.trim()
      if (trimmed) {
        if (isJSON(trimmed)) {
          setMode('json-to-yaml')
        } else {
          setMode('yaml-to-json')
        }
        setInput(trimmed)
      }
    })
  }, [])

  const convert = useCallback((text: string, currentMode: 'json-to-yaml' | 'yaml-to-json') => {
    if (!text.trim()) {
      setOutput('')
      setError(null)
      return
    }
    try {
      const result = currentMode === 'json-to-yaml' ? jsonToYaml(text) : yamlToJson(text)
      setOutput(result)
      setError(null)
    } catch (e) {
      setOutput('')
      setError(e instanceof Error ? e.message : 'Conversion failed')
    }
  }, [])

  useEffect(() => {
    convert(input, mode)
  }, [input, mode, convert])

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

  const inputLang = mode === 'json-to-yaml' ? 'json' : 'yaml'
  const outputLang = mode === 'json-to-yaml' ? 'yaml' : 'json'

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <ToolHeader
        icon={ArrowLeftRight}
        name="JSON ↔ YAML Converter"
        description="Convert between JSON and YAML formats"
      />

      <Tabs value={mode} onValueChange={(v) => setMode(v as 'json-to-yaml' | 'yaml-to-json')}>
        <div className="flex items-center gap-2">
          <TabsList>
            <TabsTrigger value="json-to-yaml">JSON → YAML</TabsTrigger>
            <TabsTrigger value="yaml-to-json">YAML → JSON</TabsTrigger>
          </TabsList>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleClear}>
              <Eraser className="size-3.5" />
              Clear
            </Button>
            <Button size="sm" onClick={handleCopyAndClose} disabled={!output}>
              <ArrowRightFromLine className="size-3.5" />
              Copy & Close
            </Button>
          </div>
        </div>

        <TabsContent value={mode} className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="grid flex-1 grid-cols-2 gap-3" style={{ minHeight: 0 }}>
            <div className="flex flex-col gap-1.5 overflow-hidden">
              <span className="text-sm font-medium">{inputLang.toUpperCase()} Input</span>
              <div className="flex-1 overflow-hidden rounded-md border border-border">
                <MonacoWrapper
                  value={input}
                  onChange={(v) => setInput(v)}
                  language={inputLang}
                  height="100%"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5 overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{outputLang.toUpperCase()} Output</span>
                {output && <CopyButton text={output} />}
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
          </div>
          {error && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500">
              {error}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
