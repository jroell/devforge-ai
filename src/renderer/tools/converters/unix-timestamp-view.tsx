import { useState, useEffect, useCallback } from 'react'
import { Clock, Play, Eraser } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ToolHeader } from '@/components/shared/ToolHeader'
import { CopyButton } from '@/components/shared/CopyButton'

function formatRelativeTime(date: Date): string {
  const now = Date.now()
  const diffMs = now - date.getTime()
  const absDiff = Math.abs(diffMs)
  const isFuture = diffMs < 0

  const seconds = Math.floor(absDiff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  let relative: string
  if (seconds < 5) relative = 'just now'
  else if (seconds < 60) relative = `${seconds} seconds`
  else if (minutes === 1) relative = '1 minute'
  else if (minutes < 60) relative = `${minutes} minutes`
  else if (hours === 1) relative = '1 hour'
  else if (hours < 24) relative = `${hours} hours`
  else if (days === 1) relative = '1 day'
  else if (days < 7) relative = `${days} days`
  else if (weeks === 1) relative = '1 week'
  else if (weeks < 5) relative = `${weeks} weeks`
  else if (months === 1) relative = '1 month'
  else if (months < 12) relative = `${months} months`
  else if (years === 1) relative = '1 year'
  else relative = `${years} years`

  if (relative === 'just now') return relative
  return isFuture ? `in ${relative}` : `${relative} ago`
}

function toDatetimeLocal(date: Date): string {
  const pad = (n: number): string => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export default function UnixTimestampView() {
  const [timestampInput, setTimestampInput] = useState('')
  const [dateInput, setDateInput] = useState('')
  const [date, setDate] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    window.api.clipboard.read().then((text) => {
      const trimmed = text.trim()
      if (/^\d{10,13}$/.test(trimmed)) {
        setTimestampInput(trimmed)
        convertFromTimestamp(trimmed)
      }
    })
  }, [])

  const convertFromTimestamp = useCallback((value: string) => {
    const trimmed = value.trim()
    if (!trimmed) {
      setDate(null)
      setDateInput('')
      setError(null)
      return
    }

    const num = Number(trimmed)
    if (isNaN(num)) {
      setError('Invalid timestamp')
      setDate(null)
      setDateInput('')
      return
    }

    // Auto-detect: if 13 digits treat as milliseconds, otherwise seconds
    const ms = trimmed.length >= 13 ? num : num * 1000
    const d = new Date(ms)

    if (isNaN(d.getTime())) {
      setError('Invalid timestamp')
      setDate(null)
      setDateInput('')
      return
    }

    setDate(d)
    setDateInput(toDatetimeLocal(d))
    setError(null)
  }, [])

  const convertFromDate = useCallback((value: string) => {
    if (!value) {
      setDate(null)
      setTimestampInput('')
      setError(null)
      return
    }

    const d = new Date(value)
    if (isNaN(d.getTime())) {
      setError('Invalid date')
      setDate(null)
      setTimestampInput('')
      return
    }

    setDate(d)
    setTimestampInput(Math.floor(d.getTime() / 1000).toString())
    setError(null)
  }, [])

  const handleNow = () => {
    const now = new Date()
    const ts = Math.floor(now.getTime() / 1000).toString()
    setTimestampInput(ts)
    setDate(now)
    setDateInput(toDatetimeLocal(now))
    setError(null)
  }

  const handleClear = () => {
    setTimestampInput('')
    setDateInput('')
    setDate(null)
    setError(null)
  }

  const secondsTimestamp = date ? Math.floor(date.getTime() / 1000).toString() : ''
  const millisTimestamp = date ? date.getTime().toString() : ''

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <ToolHeader
        icon={Clock}
        name="Unix Timestamp"
        description="Convert between Unix timestamps and human-readable dates"
        toolId="unix-timestamp"
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleNow}>
          <Play className="size-3.5" />
          Now
        </Button>
        <Button variant="outline" size="sm" onClick={handleClear}>
          <Eraser className="size-3.5" />
          Clear
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Timestamp Input */}
        <div className="flex flex-col gap-3">
          <Label>Unix Timestamp</Label>
          <Input
            placeholder="e.g. 1700000000"
            value={timestampInput}
            onChange={(e) => {
              setTimestampInput(e.target.value)
              convertFromTimestamp(e.target.value)
            }}
            className="font-mono"
          />
        </div>

        {/* Date Input */}
        <div className="flex flex-col gap-3">
          <Label>Date &amp; Time</Label>
          <Input
            type="datetime-local"
            step="1"
            value={dateInput}
            onChange={(e) => {
              setDateInput(e.target.value)
              convertFromDate(e.target.value)
            }}
          />
        </div>
      </div>

      {/* Results */}
      {date && (
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4">
          <span className="text-sm font-medium">Conversion Results</span>

          <div className="grid gap-3">
            <ResultRow label="Seconds" value={secondsTimestamp} />
            <ResultRow label="Milliseconds" value={millisTimestamp} />
            <ResultRow label="ISO 8601" value={date.toISOString()} />
            <ResultRow label="Local" value={date.toLocaleString()} />
            <ResultRow label="UTC" value={date.toUTCString()} />
            <ResultRow label="Relative" value={formatRelativeTime(date)} />
          </div>
        </div>
      )}
    </div>
  )
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <code className="min-w-0 flex-1 truncate rounded bg-background px-2 py-1 font-mono text-sm">
          {value}
        </code>
        <CopyButton text={value} />
      </div>
    </div>
  )
}
