import { useState, useEffect, useCallback } from 'react'
import { Hash, Eraser, ShieldCheck, Loader2 } from 'lucide-react'
import bcrypt from 'bcryptjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ToolHeader } from '@/components/shared/ToolHeader'
import { CopyButton } from '@/components/shared/CopyButton'

const ALGORITHMS = [
  { id: 'md5', label: 'MD5' },
  { id: 'sha1', label: 'SHA-1' },
  { id: 'sha256', label: 'SHA-256' },
  { id: 'sha512', label: 'SHA-512' }
] as const

interface Hashes {
  md5: string
  sha1: string
  sha256: string
  sha512: string
}

const emptyHashes: Hashes = { md5: '', sha1: '', sha256: '', sha512: '' }

export default function HashGeneratorView() {
  const [input, setInput] = useState('')
  const [hashes, setHashes] = useState<Hashes>(emptyHashes)
  const [bcryptRounds, setBcryptRounds] = useState(10)
  const [bcryptOutput, setBcryptOutput] = useState('')
  const [bcryptLoading, setBcryptLoading] = useState(false)

  const computeHashes = useCallback(async (text: string) => {
    if (!text) {
      setHashes(emptyHashes)
      return
    }

    const results = await Promise.all(
      ALGORITHMS.map(async (algo) => {
        const hash = await window.api.crypto.hash(algo.id, text)
        return [algo.id, hash] as const
      })
    )

    setHashes(Object.fromEntries(results) as unknown as Hashes)
  }, [])

  useEffect(() => {
    computeHashes(input)
  }, [input, computeHashes])

  const handleBcryptGenerate = async () => {
    if (!input.trim()) return
    setBcryptLoading(true)
    try {
      const salt = await bcrypt.genSalt(bcryptRounds)
      const hash = await bcrypt.hash(input, salt)
      setBcryptOutput(hash)
    } finally {
      setBcryptLoading(false)
    }
  }

  const handleClear = () => {
    setInput('')
    setHashes(emptyHashes)
    setBcryptOutput('')
  }

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <ToolHeader
        icon={Hash}
        name="Hash Generator"
        description="Generate MD5, SHA-1, SHA-256, SHA-512, and bcrypt hashes"
        toolId="hash-generator"
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleClear}>
          <Eraser className="size-3.5" />
          Clear
        </Button>
      </div>

      {/* Input */}
      <div className="flex flex-col gap-2">
        <Label>Input Text</Label>
        <Textarea
          placeholder="Enter text to hash..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="min-h-24 resize-y font-mono"
        />
      </div>

      {/* Standard Hash Results */}
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4">
        <span className="text-sm font-medium">Hash Outputs</span>
        <div className="grid gap-3">
          {ALGORITHMS.map((algo) => (
            <div key={algo.id} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-xs font-medium text-muted-foreground">
                {algo.label}
              </span>
              <div className="flex min-w-0 flex-1 items-center gap-1.5">
                <Input
                  readOnly
                  value={hashes[algo.id as keyof Hashes]}
                  placeholder="—"
                  className="min-w-0 flex-1 font-mono text-xs"
                />
                {hashes[algo.id as keyof Hashes] && (
                  <CopyButton text={hashes[algo.id as keyof Hashes]} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bcrypt Section */}
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4">
        <span className="text-sm font-medium">Bcrypt</span>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Rounds</Label>
            <Input
              type="number"
              min={4}
              max={16}
              value={bcryptRounds}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10)
                if (!isNaN(val) && val >= 4 && val <= 16) setBcryptRounds(val)
              }}
              className="w-20 font-mono"
            />
          </div>
          <Button
            size="sm"
            onClick={handleBcryptGenerate}
            disabled={!input.trim() || bcryptLoading}
          >
            {bcryptLoading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <ShieldCheck className="size-3.5" />
            )}
            Generate Bcrypt
          </Button>
        </div>
        {bcryptOutput && (
          <div className="flex items-center gap-1.5">
            <Input readOnly value={bcryptOutput} className="flex-1 font-mono text-xs" />
            <CopyButton text={bcryptOutput} />
          </div>
        )}
      </div>
    </div>
  )
}
