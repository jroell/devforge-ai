import { useState, useEffect } from 'react'
import { CaseSensitive, Eraser } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ToolHeader } from '@/components/shared/ToolHeader'
import { CopyButton } from '@/components/shared/CopyButton'

function splitWords(text: string): string[] {
  return text
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[_\-./\\]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

function toCamelCase(text: string): string {
  const words = splitWords(text)
  return words
    .map((w, i) => (i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join('')
}

function toPascalCase(text: string): string {
  const words = splitWords(text)
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('')
}

function toSnakeCase(text: string): string {
  return splitWords(text).map((w) => w.toLowerCase()).join('_')
}

function toKebabCase(text: string): string {
  return splitWords(text).map((w) => w.toLowerCase()).join('-')
}

function toConstantCase(text: string): string {
  return splitWords(text).map((w) => w.toUpperCase()).join('_')
}

function toTitleCase(text: string): string {
  return splitWords(text).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
}

function toSentenceCase(text: string): string {
  const words = splitWords(text).map((w) => w.toLowerCase())
  if (words.length === 0) return ''
  words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1)
  return words.join(' ')
}

function toLowerCase(text: string): string {
  return text.toLowerCase()
}

function toUpperCase(text: string): string {
  return text.toUpperCase()
}

interface CaseOption {
  label: string
  fn: (text: string) => string
}

const caseOptions: CaseOption[] = [
  { label: 'camelCase', fn: toCamelCase },
  { label: 'PascalCase', fn: toPascalCase },
  { label: 'snake_case', fn: toSnakeCase },
  { label: 'kebab-case', fn: toKebabCase },
  { label: 'CONSTANT_CASE', fn: toConstantCase },
  { label: 'Title Case', fn: toTitleCase },
  { label: 'Sentence case', fn: toSentenceCase },
  { label: 'lowercase', fn: toLowerCase },
  { label: 'UPPERCASE', fn: toUpperCase }
]

export default function TextCaseView() {
  const [input, setInput] = useState('')

  useEffect(() => {
    window.api.clipboard.read().then((text) => {
      const trimmed = text.trim()
      if (trimmed) setInput(trimmed)
    })
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleClear = () => {
    setInput('')
  }

  const handleCopyCase = async (fn: (text: string) => string) => {
    const result = fn(input)
    await window.api.clipboard.write(result)
    window.api.window.hide()
  }

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <ToolHeader
        icon={CaseSensitive}
        name="Text Case Converter"
        description="Convert text between camelCase, snake_case, kebab-case, and more"
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
          placeholder="Enter text to convert (e.g. hello world, helloWorld, hello_world)..."
          className="min-h-[100px] font-mono text-sm"
        />
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {caseOptions.map((opt) => {
          const result = input.trim() ? opt.fn(input) : ''
          return (
            <div
              key={opt.label}
              className="flex flex-col gap-1 rounded-md border border-border bg-muted/30 p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{opt.label}</span>
                <div className="flex items-center gap-1">
                  {result && <CopyButton text={result} />}
                </div>
              </div>
              <button
                className="cursor-pointer truncate text-left font-mono text-sm hover:text-primary transition-colors"
                onClick={() => input.trim() && handleCopyCase(opt.fn)}
                title={result || '—'}
              >
                {result || <span className="text-muted-foreground">—</span>}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
