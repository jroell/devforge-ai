import { useState, useEffect, useCallback } from 'react'
import { Database, Eraser, ArrowRightFromLine } from 'lucide-react'
import { format as sqlFormat } from 'sql-formatter'
import { Button } from '@/components/ui/button'
import { MonacoWrapper } from '@/components/editor/MonacoWrapper'
import { ToolHeader } from '@/components/shared/ToolHeader'
import { CopyButton } from '@/components/shared/CopyButton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

type SqlDialect = 'sql' | 'mysql' | 'postgresql' | 'sqlite' | 'bigquery' | 'transactsql'

const dialects: { value: SqlDialect; label: string }[] = [
  { value: 'sql', label: 'Standard SQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'sqlite', label: 'SQLite' },
  { value: 'bigquery', label: 'BigQuery' },
  { value: 'transactsql', label: 'T-SQL' }
]

export default function SqlFormatterView() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [dialect, setDialect] = useState<SqlDialect>('sql')
  const [keywordCase, setKeywordCase] = useState<'upper' | 'lower' | 'preserve'>('upper')

  useEffect(() => {
    window.api.clipboard.read().then((text) => {
      const trimmed = text.trim()
      if (/\b(?:SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/i.test(trimmed)) {
        setInput(trimmed)
        handleFormatText(trimmed, dialect, keywordCase)
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

  const handleFormatText = useCallback(
    (text: string, lang: SqlDialect, kwCase: 'upper' | 'lower' | 'preserve') => {
      if (!text.trim()) {
        setOutput('')
        setError(null)
        return
      }
      try {
        const formatted = sqlFormat(text, {
          language: lang,
          tabWidth: 2,
          keywordCase: kwCase
        })
        setOutput(formatted)
        setError(null)
      } catch (e) {
        setOutput('')
        setError(e instanceof Error ? e.message : 'Failed to format SQL')
      }
    },
    []
  )

  const handleFormat = () => handleFormatText(input, dialect, keywordCase)

  const handleDialectChange = (value: string) => {
    const d = value as SqlDialect
    setDialect(d)
    if (input.trim()) {
      handleFormatText(input, d, keywordCase)
    }
  }

  const handleKeywordCaseChange = (value: string) => {
    const kc = value as 'upper' | 'lower' | 'preserve'
    setKeywordCase(kc)
    if (input.trim()) {
      handleFormatText(input, dialect, kc)
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
        icon={Database}
        name="SQL Formatter"
        description="Format SQL queries with dialect support"
        toolId="sql-formatter"
      />

      <div className="flex flex-wrap items-center gap-2">
        <Select value={dialect} onValueChange={handleDialectChange}>
          <SelectTrigger size="sm">
            <SelectValue placeholder="Dialect" />
          </SelectTrigger>
          <SelectContent>
            {dialects.map((d) => (
              <SelectItem key={d.value} value={d.value}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={keywordCase} onValueChange={handleKeywordCaseChange}>
          <SelectTrigger size="sm">
            <SelectValue placeholder="Keywords" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="upper">UPPERCASE</SelectItem>
            <SelectItem value="lower">lowercase</SelectItem>
            <SelectItem value="preserve">Preserve</SelectItem>
          </SelectContent>
        </Select>
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
            <MonacoWrapper value={input} onChange={(v) => setInput(v)} language="sql" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5 overflow-hidden">
          <span className="text-sm font-medium">Output</span>
          <div className="min-h-0 flex-1 overflow-hidden rounded-md border border-border">
            <MonacoWrapper value={output} language="sql" readOnly />
          </div>
        </div>
      </div>
    </div>
  )
}
