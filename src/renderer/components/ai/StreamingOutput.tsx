import { useEffect, useRef } from 'react'
import { AlertCircle } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CopyButton } from '@/components/shared/CopyButton'
import { cn } from '@/lib/utils'

interface StreamingOutputProps {
  output: string
  isStreaming: boolean
  error: string | null
  className?: string
}

/**
 * Renders inline code (backtick-delimited) and fenced code blocks
 * with monospace styling. All other text is rendered as-is.
 */
function renderContent(text: string) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let inCodeBlock = false
  let codeBlockContent: string[] = []
  let codeBlockLang = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Detect fenced code block start/end
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true
        codeBlockLang = line.slice(3).trim()
        codeBlockContent = []
        continue
      } else {
        // End of code block
        inCodeBlock = false
        elements.push(
          <div key={`cb-${i}`} className="my-2 rounded-md border border-border bg-muted/50 overflow-x-auto">
            {codeBlockLang && (
              <div className="border-b border-border px-3 py-1 text-xs text-muted-foreground">
                {codeBlockLang}
              </div>
            )}
            <pre className="p-3 font-mono text-sm leading-relaxed">
              <code>{codeBlockContent.join('\n')}</code>
            </pre>
          </div>
        )
        continue
      }
    }

    if (inCodeBlock) {
      codeBlockContent.push(line)
      continue
    }

    // Render inline code with backticks
    const parts = line.split(/(`[^`]+`)/)
    const lineElements = parts.map((part, j) => {
      if (part.startsWith('`') && part.endsWith('`') && part.length > 1) {
        return (
          <code
            key={j}
            className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]"
          >
            {part.slice(1, -1)}
          </code>
        )
      }
      return <span key={j}>{part}</span>
    })

    elements.push(
      <div key={`line-${i}`} className="min-h-[1.25em]">
        {lineElements}
      </div>
    )
  }

  // Handle unclosed code block (still streaming)
  if (inCodeBlock && codeBlockContent.length > 0) {
    elements.push(
      <div key="cb-open" className="my-2 rounded-md border border-border bg-muted/50 overflow-x-auto">
        {codeBlockLang && (
          <div className="border-b border-border px-3 py-1 text-xs text-muted-foreground">
            {codeBlockLang}
          </div>
        )}
        <pre className="p-3 font-mono text-sm leading-relaxed">
          <code>{codeBlockContent.join('\n')}</code>
        </pre>
      </div>
    )
  }

  return elements
}

export function StreamingOutput({
  output,
  isStreaming,
  error,
  className,
}: StreamingOutputProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom as text streams in
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [output])

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Output</span>
        {output && !isStreaming && <CopyButton text={output} />}
      </div>

      <ScrollArea className="h-full rounded-md border border-border bg-muted/30">
        <div
          ref={scrollRef}
          className="max-h-[400px] overflow-y-auto p-3 text-sm leading-relaxed"
        >
          {error ? (
            <div className="flex items-start gap-2 text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : output ? (
            <div className="whitespace-pre-wrap break-words">
              {renderContent(output)}
              {isStreaming && (
                <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-primary" />
              )}
            </div>
          ) : !isStreaming ? (
            <span className="text-muted-foreground">
              AI output will appear here...
            </span>
          ) : (
            <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-primary" />
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
