import { useState, useEffect, useCallback } from 'react'
import { Hash, Eraser, ArrowRightFromLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ToolHeader } from '@/components/shared/ToolHeader'
import { OutputPanel } from '@/components/shared/OutputPanel'

function textToHex(text: string): string {
  return text
    .split('')
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
    .join(' ')
}

function hexToText(hex: string): string {
  const cleaned = hex.trim()
  if (!cleaned) return ''
  return cleaned
    .split(/\s+/)
    .map((h) => {
      const code = parseInt(h, 16)
      if (isNaN(code)) throw new Error(`Invalid hex value: ${h}`)
      return String.fromCharCode(code)
    })
    .join('')
}

function looksLikeHex(text: string): boolean {
  return /^(?:[0-9a-f]{2}\s){3,}/i.test(text.trim())
}

export default function HexAsciiView() {
  const [mode, setMode] = useState<'text-to-hex' | 'hex-to-text'>('text-to-hex')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    window.api.clipboard.read().then((text) => {
      const trimmed = text.trim()
      if (trimmed) {
        if (looksLikeHex(trimmed)) {
          setMode('hex-to-text')
        }
        setInput(trimmed)
      }
    })
  }, [])

  const process = useCallback((text: string, currentMode: 'text-to-hex' | 'hex-to-text') => {
    if (!text.trim()) {
      setOutput('')
      setError(null)
      return
    }
    try {
      const result = currentMode === 'text-to-hex' ? textToHex(text) : hexToText(text)
      setOutput(result)
      setError(null)
    } catch (e) {
      setOutput('')
      setError(e instanceof Error ? e.message : 'Conversion failed')
    }
  }, [])

  useEffect(() => {
    process(input, mode)
  }, [input, mode, process])

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

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <ToolHeader
        icon={Hash}
        name="Hex/ASCII Converter"
        description="Convert between hexadecimal and ASCII text"
        toolId="hex-ascii"
      />

      <Tabs value={mode} onValueChange={(v) => setMode(v as 'text-to-hex' | 'hex-to-text')}>
        <div className="flex items-center gap-2">
          <TabsList>
            <TabsTrigger value="text-to-hex">Text → Hex</TabsTrigger>
            <TabsTrigger value="hex-to-text">Hex → Text</TabsTrigger>
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

        <TabsContent value="text-to-hex" className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Text Input</span>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter text to convert to hex..."
              className="min-h-[120px] font-mono text-sm"
            />
          </div>
          {error && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500">
              {error}
            </div>
          )}
          <OutputPanel label="Hex Output" value={output} placeholder="Hex output will appear here..." />
        </TabsContent>

        <TabsContent value="hex-to-text" className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Hex Input</span>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter hex values separated by spaces (e.g. 48 65 6c 6c 6f)..."
              className="min-h-[120px] font-mono text-sm"
            />
          </div>
          {error && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500">
              {error}
            </div>
          )}
          <OutputPanel label="Text Output" value={output} placeholder="Text output will appear here..." />
        </TabsContent>
      </Tabs>
    </div>
  )
}
