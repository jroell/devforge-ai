import { useState, useEffect, useCallback } from 'react'
import { GitCompare, Eraser, ArrowRightFromLine } from 'lucide-react'
import { diffLines, type Change } from 'diff'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ToolHeader } from '@/components/shared/ToolHeader'
import { CopyButton } from '@/components/shared/CopyButton'
import { ScrollArea } from '@/components/ui/scroll-area'

export default function DiffCheckerView() {
  const [left, setLeft] = useState('')
  const [right, setRight] = useState('')
  const [changes, setChanges] = useState<Change[]>([])
  const [diffText, setDiffText] = useState('')

  useEffect(() => {
    window.api.clipboard.read().then((text) => {
      const trimmed = text.trim()
      if (trimmed) setLeft(trimmed)
    })
  }, [])

  const computeDiff = useCallback((a: string, b: string) => {
    if (!a && !b) {
      setChanges([])
      setDiffText('')
      return
    }
    const result = diffLines(a, b)
    setChanges(result)

    const unified = result
      .map((part) => {
        const prefix = part.added ? '+' : part.removed ? '-' : ' '
        return part.value
          .split('\n')
          .filter((_, i, arr) => i < arr.length - 1 || arr[i] !== '')
          .map((line) => `${prefix} ${line}`)
          .join('\n')
      })
      .join('\n')
    setDiffText(unified)
  }, [])

  useEffect(() => {
    computeDiff(left, right)
  }, [left, right, computeDiff])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        handleCopyAndClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [diffText])

  const handleClear = () => {
    setLeft('')
    setRight('')
    setChanges([])
    setDiffText('')
  }

  const handleCopyAndClose = async () => {
    if (!diffText) return
    await window.api.clipboard.write(diffText)
    window.api.window.hide()
  }

  const stats = {
    added: changes.filter((c) => c.added).reduce((n, c) => n + (c.count ?? 0), 0),
    removed: changes.filter((c) => c.removed).reduce((n, c) => n + (c.count ?? 0), 0)
  }

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <ToolHeader
        icon={GitCompare}
        name="Diff Checker"
        description="Compare two texts and highlight differences"
      />

      <div className="flex items-center gap-2">
        {(left || right) && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-green-500">+{stats.added} added</span>
            <span className="text-red-500">-{stats.removed} removed</span>
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleClear}>
            <Eraser className="size-3.5" />
            Clear
          </Button>
          <Button size="sm" onClick={handleCopyAndClose} disabled={!diffText}>
            <ArrowRightFromLine className="size-3.5" />
            Copy & Close
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Original</span>
          <Textarea
            value={left}
            onChange={(e) => setLeft(e.target.value)}
            placeholder="Paste the original text here..."
            className="min-h-[150px] font-mono text-sm"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Modified</span>
          <Textarea
            value={right}
            onChange={(e) => setRight(e.target.value)}
            placeholder="Paste the modified text here..."
            className="min-h-[150px] font-mono text-sm"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Diff Output</span>
          {diffText && <CopyButton text={diffText} />}
        </div>
        <ScrollArea className="max-h-[300px] rounded-md border border-border">
          <div className="font-mono text-sm">
            {changes.length === 0 ? (
              <div className="p-3 text-muted-foreground">
                Enter text in both panels to see differences...
              </div>
            ) : (
              changes.map((part, idx) => {
                const lines = part.value.split('\n')
                if (lines[lines.length - 1] === '') lines.pop()

                return lines.map((line, lineIdx) => (
                  <div
                    key={`${idx}-${lineIdx}`}
                    className={
                      part.added
                        ? 'bg-green-500/15 text-green-400 border-l-2 border-green-500 px-3 py-0.5'
                        : part.removed
                          ? 'bg-red-500/15 text-red-400 border-l-2 border-red-500 px-3 py-0.5'
                          : 'px-3 py-0.5 border-l-2 border-transparent text-muted-foreground'
                    }
                  >
                    <span className="mr-2 select-none opacity-50">
                      {part.added ? '+' : part.removed ? '-' : ' '}
                    </span>
                    {line || ' '}
                  </div>
                ))
              })
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
