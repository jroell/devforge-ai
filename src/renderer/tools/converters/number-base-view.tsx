import { useState, useEffect, useCallback } from 'react'
import { Calculator, Eraser, ArrowRightFromLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { ToolHeader } from '@/components/shared/ToolHeader'
import { CopyButton } from '@/components/shared/CopyButton'

type Base = 2 | 8 | 10 | 16

const baseLabels: Record<Base, string> = {
  2: 'Binary (Base 2)',
  8: 'Octal (Base 8)',
  10: 'Decimal (Base 10)',
  16: 'Hexadecimal (Base 16)'
}

const basePrefixes: Record<Base, string> = {
  2: '0b',
  8: '0o',
  10: '',
  16: '0x'
}

function convertNumber(
  input: string,
  fromBase: Base
): { bin: string; oct: string; dec: string; hex: string } | null {
  const cleaned = input.trim().toLowerCase()
    .replace(/^0b/, '')
    .replace(/^0o/, '')
    .replace(/^0x/, '')

  if (!cleaned) return null

  try {
    let value: bigint
    if (fromBase === 10) {
      if (!/^-?\d+$/.test(cleaned)) return null
      value = BigInt(cleaned)
    } else {
      const validChars: Record<Base, RegExp> = {
        2: /^[01]+$/,
        8: /^[0-7]+$/,
        10: /^[0-9]+$/,
        16: /^[0-9a-f]+$/
      }
      if (!validChars[fromBase].test(cleaned)) return null
      value = BigInt(`0${fromBase === 2 ? 'b' : fromBase === 8 ? 'o' : 'x'}${cleaned}`)
    }

    return {
      bin: value.toString(2),
      oct: value.toString(8),
      dec: value.toString(10),
      hex: value.toString(16).toUpperCase()
    }
  } catch {
    return null
  }
}

export default function NumberBaseView() {
  const [input, setInput] = useState('')
  const [fromBase, setFromBase] = useState<Base>(10)
  const [results, setResults] = useState<{
    bin: string; oct: string; dec: string; hex: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    window.api.clipboard.read().then((text) => {
      const trimmed = text.trim()
      if (/^\d+$/.test(trimmed)) {
        setInput(trimmed)
        setFromBase(10)
      } else if (/^0x[0-9a-f]+$/i.test(trimmed)) {
        setInput(trimmed)
        setFromBase(16)
      } else if (/^0b[01]+$/.test(trimmed)) {
        setInput(trimmed)
        setFromBase(2)
      } else if (/^0o[0-7]+$/.test(trimmed)) {
        setInput(trimmed)
        setFromBase(8)
      }
    })
  }, [])

  const process = useCallback((text: string, base: Base) => {
    if (!text.trim()) {
      setResults(null)
      setError(null)
      return
    }
    const result = convertNumber(text, base)
    if (result) {
      setResults(result)
      setError(null)
    } else {
      setResults(null)
      setError(`Invalid ${baseLabels[base].toLowerCase()} input`)
    }
  }, [])

  useEffect(() => {
    process(input, fromBase)
  }, [input, fromBase, process])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        handleCopyAndClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [results])

  const handleClear = () => {
    setInput('')
    setResults(null)
    setError(null)
  }

  const handleCopyAndClose = async () => {
    if (!results) return
    const all = `Binary: ${results.bin}\nOctal: ${results.oct}\nDecimal: ${results.dec}\nHex: ${results.hex}`
    await window.api.clipboard.write(all)
    window.api.window.hide()
  }

  const outputRows: { label: string; key: keyof NonNullable<typeof results>; prefix: string }[] = [
    { label: 'Binary', key: 'bin', prefix: basePrefixes[2] },
    { label: 'Octal', key: 'oct', prefix: basePrefixes[8] },
    { label: 'Decimal', key: 'dec', prefix: basePrefixes[10] },
    { label: 'Hexadecimal', key: 'hex', prefix: basePrefixes[16] }
  ]

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <ToolHeader
        icon={Calculator}
        name="Number Base Converter"
        description="Convert between binary, octal, decimal, and hexadecimal"
        toolId="number-base"
      />

      <div className="flex items-center gap-2">
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleClear}>
            <Eraser className="size-3.5" />
            Clear
          </Button>
          <Button size="sm" onClick={handleCopyAndClose} disabled={!results}>
            <ArrowRightFromLine className="size-3.5" />
            Copy & Close
          </Button>
        </div>
      </div>

      <div className="flex items-end gap-3">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label>Input Number</Label>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter a number..."
            className="font-mono"
          />
        </div>
        <div className="flex w-48 flex-col gap-1.5">
          <Label>Input Base</Label>
          <Select value={String(fromBase)} onValueChange={(v) => setFromBase(Number(v) as Base)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">Binary (2)</SelectItem>
              <SelectItem value="8">Octal (8)</SelectItem>
              <SelectItem value="10">Decimal (10)</SelectItem>
              <SelectItem value="16">Hexadecimal (16)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {outputRows.map((row) => (
          <div key={row.key} className="flex items-center gap-3 rounded-md border border-border bg-muted/30 px-3 py-2">
            <span className="w-28 shrink-0 text-sm font-medium text-muted-foreground">{row.label}</span>
            <span className="flex-1 font-mono text-sm">
              {results ? (
                <>
                  <span className="text-muted-foreground">{row.prefix}</span>
                  {results[row.key]}
                </>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </span>
            {results && <CopyButton text={`${row.prefix}${results[row.key]}`} />}
          </div>
        ))}
      </div>
    </div>
  )
}
