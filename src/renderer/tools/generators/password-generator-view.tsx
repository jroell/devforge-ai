import { useState, useEffect, useCallback } from 'react'
import { KeyRound, RefreshCw, Eraser, ArrowRightFromLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { ToolHeader } from '@/components/shared/ToolHeader'
import { CopyButton } from '@/components/shared/CopyButton'
import { Badge } from '@/components/ui/badge'

interface PasswordOptions {
  length: number
  uppercase: boolean
  lowercase: boolean
  numbers: boolean
  symbols: boolean
}

function generatePassword(options: PasswordOptions): string {
  let chars = ''
  if (options.lowercase) chars += 'abcdefghijklmnopqrstuvwxyz'
  if (options.uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  if (options.numbers) chars += '0123456789'
  if (options.symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?'

  if (!chars) return ''

  const array = new Uint32Array(options.length)
  crypto.getRandomValues(array)
  return Array.from(array, (v) => chars[v % chars.length]).join('')
}

function getStrength(password: string, options: PasswordOptions): { label: string; color: string; percent: number } {
  if (!password) return { label: 'None', color: 'bg-muted', percent: 0 }

  let score = 0
  const len = password.length

  if (len >= 8) score += 1
  if (len >= 12) score += 1
  if (len >= 16) score += 1
  if (len >= 24) score += 1

  let typesUsed = 0
  if (options.lowercase) typesUsed++
  if (options.uppercase) typesUsed++
  if (options.numbers) typesUsed++
  if (options.symbols) typesUsed++

  score += typesUsed

  if (score <= 2) return { label: 'Weak', color: 'bg-red-500', percent: 25 }
  if (score <= 4) return { label: 'Fair', color: 'bg-orange-500', percent: 50 }
  if (score <= 6) return { label: 'Strong', color: 'bg-yellow-500', percent: 75 }
  return { label: 'Very Strong', color: 'bg-green-500', percent: 100 }
}

export default function PasswordGeneratorView() {
  const [options, setOptions] = useState<PasswordOptions>({
    length: 20,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true
  })
  const [currentPassword, setCurrentPassword] = useState('')
  const [history, setHistory] = useState<string[]>([])

  const generate = useCallback(() => {
    const pw = generatePassword(options)
    setCurrentPassword(pw)
    if (pw) {
      setHistory((prev) => [pw, ...prev].slice(0, 10))
    }
  }, [options])

  useEffect(() => {
    generate()
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
  }, [currentPassword])

  const handleCopyAndClose = async () => {
    if (!currentPassword) return
    await window.api.clipboard.write(currentPassword)
    window.api.window.hide()
  }

  const handleClear = () => {
    setCurrentPassword('')
    setHistory([])
  }

  const strength = getStrength(currentPassword, options)

  const toggleOption = (key: keyof Omit<PasswordOptions, 'length'>) => {
    const newOptions = { ...options, [key]: !options[key] }
    const activeCount = [newOptions.uppercase, newOptions.lowercase, newOptions.numbers, newOptions.symbols].filter(Boolean).length
    if (activeCount === 0) return
    setOptions(newOptions)
  }

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <ToolHeader
        icon={KeyRound}
        name="Password Generator"
        description="Generate secure random passwords with custom options"
      />

      <div className="flex items-center gap-2">
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleClear}>
            <Eraser className="size-3.5" />
            Clear
          </Button>
          <Button size="sm" onClick={handleCopyAndClose} disabled={!currentPassword}>
            <ArrowRightFromLine className="size-3.5" />
            Copy & Close
          </Button>
        </div>
      </div>

      {/* Current password display */}
      <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 p-4">
        <span className="flex-1 break-all font-mono text-lg select-all">
          {currentPassword || <span className="text-muted-foreground">No password generated</span>}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          {currentPassword && <CopyButton text={currentPassword} />}
          <Button variant="ghost" size="icon-xs" onClick={generate} title="Regenerate">
            <RefreshCw className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Strength indicator */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">Strength:</span>
        <div className="h-2 flex-1 rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${strength.color}`}
            style={{ width: `${strength.percent}%` }}
          />
        </div>
        <Badge variant="outline" className="text-xs">
          {strength.label}
        </Badge>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-3 rounded-md border border-border p-3">
        <div className="flex items-center gap-3">
          <Label className="w-20 shrink-0">Length: {options.length}</Label>
          <Input
            type="range"
            min={8}
            max={128}
            value={options.length}
            onChange={(e) => setOptions({ ...options, length: Number(e.target.value) })}
            className="flex-1"
          />
          <Input
            type="number"
            min={8}
            max={128}
            value={options.length}
            onChange={(e) => {
              const val = Number(e.target.value)
              if (val >= 8 && val <= 128) setOptions({ ...options, length: val })
            }}
            className="w-20 font-mono"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {([
            { key: 'lowercase' as const, label: 'a-z' },
            { key: 'uppercase' as const, label: 'A-Z' },
            { key: 'numbers' as const, label: '0-9' },
            { key: 'symbols' as const, label: '!@#$' }
          ]).map(({ key, label }) => (
            <Button
              key={key}
              variant={options[key] ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleOption(key)}
              className="font-mono"
            >
              {label}
            </Button>
          ))}

          <Button variant="secondary" size="sm" onClick={generate} className="ml-auto">
            <RefreshCw className="size-3.5" />
            Generate
          </Button>
        </div>
      </div>

      {/* History */}
      {history.length > 1 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-muted-foreground">Recent</span>
          <div className="flex flex-col gap-1">
            {history.slice(1).map((pw, i) => (
              <div
                key={`${i}-${pw.slice(0, 8)}`}
                className="flex items-center gap-2 rounded-md border border-border/50 bg-muted/20 px-3 py-1.5"
              >
                <span className="flex-1 truncate font-mono text-xs text-muted-foreground">{pw}</span>
                <CopyButton text={pw} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
