import { useState, useMemo, useEffect, type ReactNode } from 'react'
import { Regex, Eraser } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ToolHeader } from '@/components/shared/ToolHeader'
import { cn } from '@/lib/utils'
import { useAi } from '@/hooks/useAi'
import { AiActionBar } from '@/components/ai/AiActionBar'
import { StreamingOutput } from '@/components/ai/StreamingOutput'

const FLAG_OPTIONS = [
  { flag: 'g', label: 'g', title: 'Global' },
  { flag: 'i', label: 'i', title: 'Case insensitive' },
  { flag: 'm', label: 'm', title: 'Multiline' },
  { flag: 's', label: 's', title: 'Dotall' },
  { flag: 'u', label: 'u', title: 'Unicode' }
] as const

interface MatchResult {
  text: string
  index: number
  groups: { name: string; value: string }[]
}

const MATCH_COLORS = [
  'bg-yellow-500/25 border-yellow-500/40',
  'bg-blue-500/25 border-blue-500/40',
  'bg-green-500/25 border-green-500/40',
  'bg-purple-500/25 border-purple-500/40',
  'bg-pink-500/25 border-pink-500/40',
  'bg-orange-500/25 border-orange-500/40'
]

export default function RegexTesterView() {
  const [pattern, setPattern] = useState('')
  const [flags, setFlags] = useState<Set<string>>(new Set(['g']))
  const [testString, setTestString] = useState('')
  const [error, setError] = useState<string | null>(null)

  const ai = useAi({
    systemPrompt:
      'You are a regex expert. Explain the provided regular expression step by step in clear, plain English. Break down each part of the pattern, explain capture groups, quantifiers, anchors, and character classes. Format your response with markdown.',
  })

  useEffect(() => {
    window.api.clipboard.read().then((text) => {
      const trimmed = text.trim()
      const regexMatch = /^\/(.+)\/([gimsuy]*)$/.exec(trimmed)
      if (regexMatch) {
        setPattern(regexMatch[1])
        if (regexMatch[2]) {
          setFlags(new Set(regexMatch[2].split('')))
        }
      }
    })
  }, [])

  const toggleFlag = (flag: string) => {
    setFlags((prev) => {
      const next = new Set(prev)
      if (next.has(flag)) {
        next.delete(flag)
      } else {
        next.add(flag)
      }
      return next
    })
  }

  const { matches, regex } = useMemo(() => {
    if (!pattern) {
      setError(null)
      return { matches: [], regex: null }
    }

    try {
      const flagStr = Array.from(flags).join('')
      const re = new RegExp(pattern, flagStr)
      setError(null)

      if (!testString) return { matches: [], regex: re }

      const results: MatchResult[] = []

      if (flags.has('g')) {
        let match: RegExpExecArray | null
        // Safety limit to prevent infinite loops on zero-length matches
        let safetyCounter = 0
        while ((match = re.exec(testString)) !== null && safetyCounter < 10000) {
          safetyCounter++
          const groups: { name: string; value: string }[] = []

          // Named groups
          if (match.groups) {
            for (const [name, value] of Object.entries(match.groups)) {
              groups.push({ name, value: value ?? '' })
            }
          }

          // Numbered groups (skip full match at index 0)
          for (let i = 1; i < match.length; i++) {
            const alreadyNamed = groups.some((g) => g.value === match![i])
            if (!alreadyNamed) {
              groups.push({ name: `Group ${i}`, value: match[i] ?? '' })
            }
          }

          results.push({
            text: match[0],
            index: match.index,
            groups
          })

          // Prevent infinite loops on zero-length matches
          if (match[0].length === 0) {
            re.lastIndex++
          }
        }
      } else {
        const match = re.exec(testString)
        if (match) {
          const groups: { name: string; value: string }[] = []

          if (match.groups) {
            for (const [name, value] of Object.entries(match.groups)) {
              groups.push({ name, value: value ?? '' })
            }
          }

          for (let i = 1; i < match.length; i++) {
            const alreadyNamed = groups.some((g) => g.value === match[i])
            if (!alreadyNamed) {
              groups.push({ name: `Group ${i}`, value: match[i] ?? '' })
            }
          }

          results.push({
            text: match[0],
            index: match.index,
            groups
          })
        }
      }

      return { matches: results, regex: re }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid regular expression')
      return { matches: [], regex: null }
    }
  }, [pattern, flags, testString])

  const highlightedText = useMemo((): ReactNode => {
    if (!testString || matches.length === 0 || !regex) {
      return testString || null
    }

    const parts: ReactNode[] = []
    let lastIndex = 0

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i]
      const colorClass = MATCH_COLORS[i % MATCH_COLORS.length]

      // Text before match
      if (match.index > lastIndex) {
        parts.push(
          <span key={`pre-${i}`}>{testString.slice(lastIndex, match.index)}</span>
        )
      }

      // The match itself
      parts.push(
        <span
          key={`match-${i}`}
          className={cn('rounded-sm border px-0.5', colorClass)}
          title={`Match ${i + 1}: "${match.text}" at index ${match.index}`}
        >
          {match.text}
        </span>
      )

      lastIndex = match.index + match.text.length
    }

    // Text after last match
    if (lastIndex < testString.length) {
      parts.push(<span key="post">{testString.slice(lastIndex)}</span>)
    }

    return parts
  }, [testString, matches, regex])

  const handleClear = () => {
    setPattern('')
    setTestString('')
    setFlags(new Set(['g']))
    setError(null)
    ai.reset()
  }

  const handleExplain = () => {
    const flagStr = Array.from(flags).join('')
    ai.reset()
    ai.generate(`Explain this regex pattern: /${pattern}/${flagStr}`)
  }

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <ToolHeader
        icon={Regex}
        name="Regex Tester"
        description="Test regular expressions with real-time matching and capture groups"
        aiEnabled
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleClear}>
          <Eraser className="size-3.5" />
          Clear
        </Button>
      </div>

      {/* Regex Input */}
      <div className="flex flex-col gap-2">
        <Label>Pattern</Label>
        <div className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-0 rounded-md border border-input bg-transparent shadow-xs focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]">
            <span className="shrink-0 pl-3 font-mono text-sm text-muted-foreground">/</span>
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="Enter regex pattern..."
              className="min-w-0 flex-1 bg-transparent px-1 py-1.5 font-mono text-sm outline-none placeholder:text-muted-foreground"
            />
            <span className="shrink-0 pr-3 font-mono text-sm text-muted-foreground">
              /{Array.from(flags).join('')}
            </span>
          </div>

          {/* Flag toggles */}
          <div className="flex items-center gap-0.5 rounded-md border border-border bg-muted/30 px-1 py-0.5">
            {FLAG_OPTIONS.map((opt) => (
              <button
                key={opt.flag}
                onClick={() => toggleFlag(opt.flag)}
                title={opt.title}
                className={cn(
                  'rounded px-1.5 py-0.5 font-mono text-xs font-medium transition-colors',
                  flags.has(opt.flag)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AI Action Bar for Explain */}
      {pattern && (
        <AiActionBar
          input={pattern}
          onExplain={handleExplain}
          showMagicFix={false}
          showExplain
          showGenerate={false}
          isStreaming={ai.isStreaming}
          activeAction={ai.isStreaming ? 'explain' : null}
          providerUsed={ai.providerUsed}
          isLocal={ai.isLocal}
        />
      )}

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500">
          {error}
        </div>
      )}

      {/* Test String */}
      <div className="flex flex-col gap-2">
        <Label>Test String</Label>
        <Textarea
          placeholder="Enter text to test against..."
          value={testString}
          onChange={(e) => setTestString(e.target.value)}
          className="min-h-24 resize-y font-mono"
        />
      </div>

      {/* Highlighted Preview */}
      {testString && matches.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Label>Highlighted Matches</Label>
            <Badge variant="secondary" className="text-[10px]">
              {matches.length} match{matches.length !== 1 ? 'es' : ''}
            </Badge>
          </div>
          <div className="rounded-md border border-border bg-muted/30 p-3 font-mono text-sm whitespace-pre-wrap break-all">
            {highlightedText}
          </div>
        </div>
      )}

      {/* Match Results */}
      {matches.length > 0 && (
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <Label>Match Details</Label>
          <ScrollArea className="min-h-0 flex-1 rounded-lg border border-border">
            <div className="flex flex-col gap-2 p-3">
              {matches.map((match, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-1.5 rounded-md border border-border bg-background p-3"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[10px]">
                      Match {i + 1}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      index {match.index}
                    </span>
                  </div>
                  <code className="rounded bg-muted/50 px-2 py-1 font-mono text-sm">
                    {match.text}
                  </code>
                  {match.groups.length > 0 && (
                    <div className="mt-1 flex flex-col gap-1">
                      {match.groups.map((group, gi) => (
                        <div key={gi} className="flex items-center gap-2 pl-4">
                          <span className="text-xs font-medium text-muted-foreground">
                            {group.name}:
                          </span>
                          <code className="rounded bg-muted/50 px-1.5 py-0.5 font-mono text-xs">
                            {group.value}
                          </code>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* No matches message */}
      {pattern && testString && matches.length === 0 && !error && (
        <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          No matches found
        </div>
      )}

      {/* AI Explanation Output */}
      {(ai.isStreaming || ai.output || ai.error) && (
        <StreamingOutput
          output={ai.output}
          isStreaming={ai.isStreaming}
          error={ai.error}
        />
      )}
    </div>
  )
}
