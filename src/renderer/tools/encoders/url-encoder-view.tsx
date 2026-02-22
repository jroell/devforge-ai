import { useState, useEffect, useCallback } from 'react'
import { Link, Eraser, ArrowRightFromLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ToolHeader } from '@/components/shared/ToolHeader'
import { OutputPanel } from '@/components/shared/OutputPanel'

function hasPercentEncoding(text: string): boolean {
  return /%[0-9A-Fa-f]{2}/.test(text)
}

export default function UrlEncoderView() {
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    window.api.clipboard.read().then((text) => {
      const trimmed = text.trim()
      if (trimmed) {
        if (hasPercentEncoding(trimmed)) {
          setMode('decode')
          setInput(trimmed)
        } else {
          setInput(trimmed)
        }
      }
    })
  }, [])

  const process = useCallback(
    (text: string, currentMode: 'encode' | 'decode') => {
      if (!text.trim()) {
        setOutput('')
        setError(null)
        return
      }
      try {
        const result =
          currentMode === 'encode'
            ? encodeURIComponent(text)
            : decodeURIComponent(text)
        setOutput(result)
        setError(null)
      } catch (e) {
        setOutput('')
        setError(
          currentMode === 'decode'
            ? 'Invalid URL-encoded input'
            : 'Failed to encode input'
        )
      }
    },
    []
  )

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
        icon={Link}
        name="URL Encode/Decode"
        description="Encode and decode URL components"
      />

      <Tabs
        value={mode}
        onValueChange={(v) => setMode(v as 'encode' | 'decode')}
      >
        <div className="flex items-center gap-2">
          <TabsList>
            <TabsTrigger value="encode">Encode</TabsTrigger>
            <TabsTrigger value="decode">Decode</TabsTrigger>
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

        <TabsContent value="encode" className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Text Input</span>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter text to URL-encode..."
              className="min-h-[120px] font-mono text-sm"
            />
          </div>
          {error && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500">
              {error}
            </div>
          )}
          <OutputPanel label="Encoded Output" value={output} placeholder="URL-encoded output will appear here..." />
        </TabsContent>

        <TabsContent value="decode" className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">URL-Encoded Input</span>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter URL-encoded string to decode..."
              className="min-h-[120px] font-mono text-sm"
            />
          </div>
          {error && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500">
              {error}
            </div>
          )}
          <OutputPanel label="Decoded Output" value={output} placeholder="Decoded output will appear here..." />
        </TabsContent>
      </Tabs>
    </div>
  )
}
