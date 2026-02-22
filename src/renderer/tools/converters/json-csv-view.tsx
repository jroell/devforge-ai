import { useState, useEffect, useCallback } from 'react'
import { Table, Eraser, ArrowRightFromLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ToolHeader } from '@/components/shared/ToolHeader'
import { MonacoWrapper } from '@/components/editor/MonacoWrapper'
import { CopyButton } from '@/components/shared/CopyButton'

function escapeCsvField(field: string): string {
  const str = String(field ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function jsonToCsv(jsonStr: string): string {
  const data = JSON.parse(jsonStr)
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Input must be a non-empty JSON array of objects')
  }

  const allKeys = new Set<string>()
  for (const item of data) {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      throw new Error('Each array element must be an object')
    }
    Object.keys(item).forEach((k) => allKeys.add(k))
  }

  const headers = Array.from(allKeys)
  const headerRow = headers.map(escapeCsvField).join(',')
  const rows = data.map((item: Record<string, unknown>) =>
    headers.map((h) => escapeCsvField(String(item[h] ?? ''))).join(',')
  )

  return [headerRow, ...rows].join('\n')
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        fields.push(current)
        current = ''
      } else {
        current += ch
      }
    }
  }
  fields.push(current)
  return fields
}

function csvToJson(csv: string): string {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) {
    throw new Error('CSV must have at least a header row and one data row')
  }

  const headers = parseCsvLine(lines[0])
  const result = lines.slice(1).map((line) => {
    const values = parseCsvLine(line)
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => {
      obj[h.trim()] = values[i]?.trim() ?? ''
    })
    return obj
  })

  return JSON.stringify(result, null, 2)
}

function isJSON(text: string): boolean {
  try {
    const parsed = JSON.parse(text)
    return Array.isArray(parsed)
  } catch {
    return false
  }
}

export default function JsonCsvView() {
  const [mode, setMode] = useState<'json-to-csv' | 'csv-to-json'>('json-to-csv')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    window.api.clipboard.read().then((text) => {
      const trimmed = text.trim()
      if (trimmed) {
        if (isJSON(trimmed)) {
          setMode('json-to-csv')
        } else if (trimmed.includes(',') && trimmed.includes('\n')) {
          setMode('csv-to-json')
        }
        setInput(trimmed)
      }
    })
  }, [])

  const convert = useCallback((text: string, currentMode: 'json-to-csv' | 'csv-to-json') => {
    if (!text.trim()) {
      setOutput('')
      setError(null)
      return
    }
    try {
      const result = currentMode === 'json-to-csv' ? jsonToCsv(text) : csvToJson(text)
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

  const inputLang = mode === 'json-to-csv' ? 'json' : 'plaintext'
  const outputLang = mode === 'json-to-csv' ? 'plaintext' : 'json'

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <ToolHeader
        icon={Table}
        name="JSON ↔ CSV Converter"
        description="Convert between JSON arrays and CSV format"
      />

      <Tabs value={mode} onValueChange={(v) => setMode(v as 'json-to-csv' | 'csv-to-json')}>
        <div className="flex items-center gap-2">
          <TabsList>
            <TabsTrigger value="json-to-csv">JSON → CSV</TabsTrigger>
            <TabsTrigger value="csv-to-json">CSV → JSON</TabsTrigger>
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
              <span className="text-sm font-medium">
                {mode === 'json-to-csv' ? 'JSON' : 'CSV'} Input
              </span>
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
                <span className="text-sm font-medium">
                  {mode === 'json-to-csv' ? 'CSV' : 'JSON'} Output
                </span>
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
