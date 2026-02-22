import { useState, useEffect, useRef, useCallback } from 'react'
import { BookOpen, Eraser } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import mermaid from 'mermaid'
import { Button } from '@/components/ui/button'
import { ToolHeader } from '@/components/shared/ToolHeader'
import { MonacoWrapper } from '@/components/editor/MonacoWrapper'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useSettingsStore } from '@/stores/settings'

let mermaidId = 0

function MermaidBlock({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const id = `mermaid-${mermaidId++}`

    mermaid
      .render(id, code)
      .then(({ svg: renderedSvg }) => {
        setSvg(renderedSvg)
        setError(null)
      })
      .catch((err) => {
        setError(err?.message || 'Failed to render Mermaid diagram')
        setSvg('')
        // Clean up any error elements mermaid may have created in the DOM
        const errorEl = document.getElementById(`d${id}`)
        if (errorEl) errorEl.remove()
      })
  }, [code])

  if (error) {
    return (
      <div className="my-2 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
        <div className="mb-1 font-semibold">Mermaid Diagram Error</div>
        <pre className="whitespace-pre-wrap text-xs">{error}</pre>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      dangerouslySetInnerHTML={{ __html: svg }}
      className="my-4 flex justify-center overflow-x-auto"
    />
  )
}

const SAMPLE_MARKDOWN = `# Markdown & Mermaid Viewer

Write or paste **Markdown** here with full GFM support.

## Features
- **Bold**, *italic*, ~~strikethrough~~
- [Links](https://example.com)
- Tables, lists, blockquotes
- Code blocks with syntax highlighting
- Mermaid diagrams (all chart types)

## Table Example

| Feature | Supported |
|---------|-----------|
| GFM Tables | Yes |
| Mermaid | Yes |
| Code Blocks | Yes |

## Mermaid Flowchart

\`\`\`mermaid
flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E
\`\`\`

## Mermaid Sequence Diagram

\`\`\`mermaid
sequenceDiagram
    participant User
    participant App
    participant API
    User->>App: Click button
    App->>API: Send request
    API-->>App: Response
    App-->>User: Show result
\`\`\`

> Try editing the Markdown on the left to see live preview!
`

export default function MarkdownViewerView() {
  const [input, setInput] = useState('')
  const { theme } = useSettingsStore()

  // Initialize mermaid with current theme
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: theme === 'dark' ? 'dark' : 'default',
      securityLevel: 'loose',
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      flowchart: { useMaxWidth: true, htmlLabels: true },
      sequence: { useMaxWidth: true },
      gantt: { useMaxWidth: true },
      er: { useMaxWidth: true }
    })
  }, [theme])

  useEffect(() => {
    window.api.clipboard.read().then((text) => {
      const trimmed = text.trim()
      if (trimmed && /^#|^\*\*|^-\s|^```|^>\s/m.test(trimmed)) {
        setInput(trimmed)
      } else {
        setInput(SAMPLE_MARKDOWN)
      }
    })
  }, [])

  const handleClear = () => {
    setInput('')
  }

  // Force re-render of mermaid blocks when theme changes
  const [renderKey, setRenderKey] = useState(0)
  useEffect(() => {
    setRenderKey((k) => k + 1)
  }, [theme])

  const renderCode = useCallback(
    ({
      className,
      children,
      ...props
    }: {
      node?: unknown
      className?: string
      children?: React.ReactNode
      [key: string]: unknown
    }) => {
      const match = /language-(\w+)/.exec(className || '')
      const lang = match?.[1]
      const codeString = String(children).trim()

      if (lang === 'mermaid') {
        return <MermaidBlock key={`${renderKey}-${codeString.slice(0, 20)}`} code={codeString} />
      }

      if (lang) {
        return (
          <pre className="my-2 overflow-x-auto rounded-md bg-zinc-900 p-3">
            <code className={`${className} text-sm`} {...props}>
              {children}
            </code>
          </pre>
        )
      }

      return (
        <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono" {...props}>
          {children}
        </code>
      )
    },
    [renderKey]
  )

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <ToolHeader
        icon={BookOpen}
        name="Markdown/Mermaid Viewer"
        description="Preview Markdown with GFM tables and all Mermaid diagram types"
      />

      <div className="flex items-center gap-2">
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleClear}>
            <Eraser className="size-3.5" />
            Clear
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput(SAMPLE_MARKDOWN)}
          >
            Load Example
          </Button>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-2 gap-3" style={{ minHeight: 0 }}>
        {/* Editor pane */}
        <div className="flex flex-col gap-1.5 overflow-hidden">
          <span className="text-sm font-medium">Markdown Input</span>
          <div className="flex-1 overflow-hidden rounded-md border border-border">
            <MonacoWrapper
              value={input}
              onChange={(v) => setInput(v)}
              language="markdown"
              height="100%"
            />
          </div>
        </div>

        {/* Preview pane */}
        <div className="flex flex-col gap-1.5 overflow-hidden">
          <span className="text-sm font-medium">Preview</span>
          <ScrollArea className="flex-1 rounded-md border border-border bg-muted/10 p-4">
            <div
              className="prose prose-invert max-w-none
                [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6 [&_h1]:border-b [&_h1]:border-border [&_h1]:pb-2
                [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-5
                [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4
                [&_h4]:text-base [&_h4]:font-semibold [&_h4]:mb-2 [&_h4]:mt-3
                [&_h5]:text-sm [&_h5]:font-semibold [&_h5]:mb-1 [&_h5]:mt-3
                [&_h6]:text-sm [&_h6]:font-semibold [&_h6]:mb-1 [&_h6]:mt-3 [&_h6]:text-muted-foreground
                [&_p]:mb-3 [&_p]:leading-relaxed
                [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3
                [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3
                [&_li]:mb-1
                [&_blockquote]:border-l-4 [&_blockquote]:border-primary/50 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:my-3
                [&_table]:w-full [&_table]:border-collapse [&_table]:mb-3
                [&_th]:border [&_th]:border-border [&_th]:px-3 [&_th]:py-2 [&_th]:bg-muted/50 [&_th]:text-left [&_th]:font-semibold
                [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2
                [&_a]:text-primary [&_a]:underline [&_a]:hover:text-primary/80
                [&_hr]:border-border [&_hr]:my-4
                [&_img]:max-w-full [&_img]:rounded-md
                [&_del]:line-through [&_del]:text-muted-foreground
                [&_strong]:font-bold
                [&_em]:italic
              "
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code: renderCode as never
                }}
              >
                {input}
              </ReactMarkdown>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
