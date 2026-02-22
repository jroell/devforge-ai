import { useState, useEffect, useCallback } from 'react'
import { FileCode, Minimize2, Eraser, ArrowRightFromLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MonacoWrapper } from '@/components/editor/MonacoWrapper'
import { ToolHeader } from '@/components/shared/ToolHeader'
import { CopyButton } from '@/components/shared/CopyButton'

function formatXml(xml: string, indent = '  '): string {
  let formatted = ''
  let pad = 0
  const nodes = xml.replace(/(>)(<)(\/*)/g, '$1\n$2$3').split('\n')
  for (const node of nodes) {
    let padding = ''
    if (node.match(/^<\/\w/)) pad--
    padding = indent.repeat(Math.max(0, pad))
    if (node.match(/^<\w[^>]*[^/]>.*$/)) pad++
    formatted += padding + node.trim() + '\n'
  }
  return formatted.trim()
}

function minifyXml(xml: string): string {
  return xml
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function validateXml(xml: string): string | null {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'application/xml')
  const errorNode = doc.querySelector('parsererror')
  if (errorNode) {
    return errorNode.textContent || 'Invalid XML'
  }
  return null
}

export default function XmlFormatterView() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    window.api.clipboard.read().then((text) => {
      const trimmed = text.trim()
      if (/^\s*<\?xml|^\s*<[a-zA-Z]/.test(trimmed)) {
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
    const validationError = validateXml(text)
    if (validationError) {
      setOutput('')
      setError(validationError)
      return
    }
    try {
      setOutput(formatXml(text))
      setError(null)
    } catch (e) {
      setOutput('')
      setError(e instanceof Error ? e.message : 'Failed to format XML')
    }
  }, [])

  const handleFormat = () => handleFormatText(input)

  const handleMinify = () => {
    if (!input.trim()) return
    const validationError = validateXml(input)
    if (validationError) {
      setOutput('')
      setError(validationError)
      return
    }
    try {
      setOutput(minifyXml(input))
      setError(null)
    } catch (e) {
      setOutput('')
      setError(e instanceof Error ? e.message : 'Failed to minify XML')
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
        icon={FileCode}
        name="XML Formatter"
        description="Format and minify XML documents"
        toolId="xml-formatter"
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
            <MonacoWrapper value={input} onChange={(v) => setInput(v)} language="xml" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5 overflow-hidden">
          <span className="text-sm font-medium">Output</span>
          <div className="min-h-0 flex-1 overflow-hidden rounded-md border border-border">
            <MonacoWrapper value={output} language="xml" readOnly />
          </div>
        </div>
      </div>
    </div>
  )
}
