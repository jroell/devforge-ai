import { useState, useCallback } from 'react'
import { Fingerprint, Eraser, Copy, RefreshCw } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ToolHeader } from '@/components/shared/ToolHeader'
import { CopyButton } from '@/components/shared/CopyButton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

function generateUlid(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 12)
}

export default function UuidGeneratorView() {
  const [uuids, setUuids] = useState<string[]>(() => [uuidv4()])
  const [uppercase, setUppercase] = useState(false)
  const [ulid, setUlid] = useState(() => generateUlid())

  const generate = useCallback(
    (count: number) => {
      const newIds = Array.from({ length: count }, () => uuidv4())
      setUuids(newIds)
      setUlid(generateUlid())
    },
    []
  )

  const handleClear = () => {
    setUuids([])
    setUlid('')
  }

  const handleCopyAll = async () => {
    const text = displayUuids.join('\n')
    await window.api.clipboard.write(text)
  }

  const displayUuids = uuids.map((id) => (uppercase ? id.toUpperCase() : id))
  const displayUlid = uppercase ? ulid.toUpperCase() : ulid

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <ToolHeader
        icon={Fingerprint}
        name="UUID Generator"
        description="Generate UUIDs (v4) and ULID-style sortable IDs"
        toolId="uuid-generator"
      />

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => generate(1)}>
          <RefreshCw className="size-3.5" />
          Generate
        </Button>
        <div className="flex items-center gap-1 rounded-md border border-border bg-muted/30 px-1">
          {[5, 10, 50].map((count) => (
            <Button key={count} variant="ghost" size="xs" onClick={() => generate(count)}>
              {count}
            </Button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={handleCopyAll} disabled={uuids.length === 0}>
          <Copy className="size-3.5" />
          Copy All
        </Button>
        <Button variant="outline" size="sm" onClick={handleClear}>
          <Eraser className="size-3.5" />
          Clear
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setUppercase(false)}
            className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
              !uppercase
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            lowercase
          </button>
          <button
            onClick={() => setUppercase(true)}
            className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
              uppercase
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            UPPERCASE
          </button>
        </div>
      </div>

      {/* ULID Section */}
      {ulid && (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">ULID-style (sortable)</Label>
            <Badge variant="secondary" className="text-[10px]">
              Timestamp-based
            </Badge>
          </div>
          <div className="flex items-center gap-1.5">
            <code className="min-w-0 flex-1 truncate rounded bg-background px-2 py-1 font-mono text-sm">
              {displayUlid}
            </code>
            <CopyButton text={displayUlid} />
          </div>
        </div>
      )}

      {/* UUID List */}
      {uuids.length > 0 && (
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <div className="flex items-center gap-2">
            <Label>UUID v4</Label>
            <Badge variant="outline" className="text-[10px]">
              {uuids.length} generated
            </Badge>
          </div>
          <ScrollArea className="min-h-0 flex-1 rounded-lg border border-border">
            <div className="flex flex-col gap-1 p-2">
              {displayUuids.map((id, i) => (
                <div
                  key={`${id}-${i}`}
                  className="flex items-center gap-1.5 rounded px-2 py-1 hover:bg-muted/50"
                >
                  <span className="w-8 shrink-0 text-right text-xs text-muted-foreground">
                    {i + 1}.
                  </span>
                  <code className="min-w-0 flex-1 font-mono text-sm">{id}</code>
                  <CopyButton text={id} />
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}
