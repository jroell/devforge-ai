import { useState, useEffect, useMemo } from 'react'
import { FileSearch, Eraser } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ToolHeader } from '@/components/shared/ToolHeader'

interface TextStats {
  characters: number
  charactersNoSpaces: number
  words: number
  lines: number
  paragraphs: number
  sentences: number
  bytes: number
  uniqueWords: number
  avgWordLength: number
  readingTime: string
}

function analyzeText(text: string): TextStats {
  if (!text) {
    return {
      characters: 0,
      charactersNoSpaces: 0,
      words: 0,
      lines: 0,
      paragraphs: 0,
      sentences: 0,
      bytes: 0,
      uniqueWords: 0,
      avgWordLength: 0,
      readingTime: '0 sec'
    }
  }

  const characters = text.length
  const charactersNoSpaces = text.replace(/\s/g, '').length
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  const lines = text.split(/\r?\n/).length
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim()).length || (text.trim() ? 1 : 0)
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim()).length
  const bytes = new TextEncoder().encode(text).length

  const wordList = text.trim() ? text.trim().toLowerCase().split(/\s+/) : []
  const uniqueWords = new Set(wordList).size

  const totalWordLength = wordList.reduce((sum, w) => sum + w.replace(/[^a-zA-Z0-9]/g, '').length, 0)
  const avgWordLength = words > 0 ? Math.round((totalWordLength / words) * 10) / 10 : 0

  const wpm = 200
  const minutes = words / wpm
  let readingTime: string
  if (minutes < 1) {
    const seconds = Math.ceil(minutes * 60)
    readingTime = `${seconds} sec`
  } else if (minutes < 60) {
    readingTime = `${Math.ceil(minutes)} min`
  } else {
    const hrs = Math.floor(minutes / 60)
    const mins = Math.ceil(minutes % 60)
    readingTime = `${hrs}h ${mins}m`
  }

  return {
    characters,
    charactersNoSpaces,
    words,
    lines,
    paragraphs,
    sentences,
    bytes,
    uniqueWords,
    avgWordLength,
    readingTime
  }
}

function formatNumber(n: number): string {
  return n.toLocaleString()
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface StatCardProps {
  label: string
  value: string
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-border bg-muted/30 p-3">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-lg font-semibold tabular-nums">{value}</span>
    </div>
  )
}

export default function TextInspectorView() {
  const [input, setInput] = useState('')

  useEffect(() => {
    window.api.clipboard.read().then((text) => {
      const trimmed = text.trim()
      if (trimmed) setInput(trimmed)
    })
  }, [])

  const stats = useMemo(() => analyzeText(input), [input])

  const handleClear = () => {
    setInput('')
  }

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <ToolHeader
        icon={FileSearch}
        name="Text Inspector"
        description="Analyze text with character, word, and line statistics"
        toolId="text-inspector"
      />

      <div className="flex items-center gap-2">
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleClear}>
            <Eraser className="size-3.5" />
            Clear
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Input Text</span>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste or type text to analyze..."
          className="min-h-[150px] font-mono text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Characters" value={formatNumber(stats.characters)} />
        <StatCard label="Characters (no spaces)" value={formatNumber(stats.charactersNoSpaces)} />
        <StatCard label="Words" value={formatNumber(stats.words)} />
        <StatCard label="Lines" value={formatNumber(stats.lines)} />
        <StatCard label="Paragraphs" value={formatNumber(stats.paragraphs)} />
        <StatCard label="Sentences" value={formatNumber(stats.sentences)} />
        <StatCard label="Byte Size" value={formatBytes(stats.bytes)} />
        <StatCard label="Unique Words" value={formatNumber(stats.uniqueWords)} />
        <StatCard label="Avg Word Length" value={String(stats.avgWordLength)} />
        <StatCard label="Reading Time" value={stats.readingTime} />
      </div>
    </div>
  )
}
