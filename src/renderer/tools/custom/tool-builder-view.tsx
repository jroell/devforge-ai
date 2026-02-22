import { useState, useCallback, useRef, useEffect } from 'react'
import { Bot, Send, Square, Save, Trash2, Loader2, Check, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ToolHeader } from '@/components/shared/ToolHeader'
import { MonacoWrapper } from '@/components/editor/MonacoWrapper'
import { useAi } from '@/hooks/useAi'
import { useCustomToolsStore } from '@/stores/custom-tools'
import { useSettingsStore } from '@/stores/settings'
import { registerCustomTools, unregisterCustomTools } from './register-custom'
import type { CustomToolConfig } from './types'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const SYSTEM_PROMPT = `You are an AI assistant that creates custom developer tools. When the user describes a tool they want, generate a complete CustomToolConfig JSON.

The schema is:
{
  "schemaVersion": 1,
  "id": "unique-kebab-case-id",
  "name": "Human Readable Name",
  "description": "Brief description of what the tool does",
  "icon": "LucideIconName",  // e.g. "Hash", "Code", "FileText", "Wrench", "Calculator", "Globe", "Key", "Lock", "Shuffle", "Type"
  "keywords": ["search", "terms"],
  "category": "custom",
  "inputs": [
    {
      "id": "inputId",
      "label": "Input Label",
      "type": "text",  // or "textarea", "number", "select", "checkbox"
      "placeholder": "Placeholder text...",
      "defaultValue": "",
      "required": true
    }
  ],
  "transform": "// JS function body. Receives 'inputs' object with input ids as keys.\\n// Must return a string.\\nconst val = inputs.inputId;\\nreturn val.toUpperCase();",
  "outputFormat": "text",  // or "json", "markdown", "html"
  "createdAt": "",
  "updatedAt": ""
}

Rules:
- Always return a COMPLETE, valid JSON config in a \`\`\`json code block
- The "transform" field is a JS function BODY (not a full function). It receives an "inputs" object.
- The transform must always RETURN a string
- Use common Lucide icon names for the "icon" field
- Make the id unique and kebab-case
- Set createdAt and updatedAt to empty strings (they'll be set by the app)
- If the user asks to modify the tool, output the FULL updated config

Example tool — Word Counter:
\`\`\`json
{
  "schemaVersion": 1,
  "id": "custom-word-counter",
  "name": "Word Counter",
  "description": "Count words, characters, and lines in text",
  "icon": "Type",
  "keywords": ["word", "count", "character", "line"],
  "category": "custom",
  "inputs": [
    { "id": "text", "label": "Text", "type": "textarea", "placeholder": "Paste text here...", "required": true }
  ],
  "transform": "const text = inputs.text || '';\\nconst words = text.trim() ? text.trim().split(/\\\\s+/).length : 0;\\nconst chars = text.length;\\nconst lines = text ? text.split('\\\\n').length : 0;\\nreturn JSON.stringify({ words, characters: chars, lines }, null, 2);",
  "outputFormat": "json",
  "createdAt": "",
  "updatedAt": ""
}
\`\`\`
`

function extractJsonFromText(text: string): CustomToolConfig | null {
  // Try to find JSON in code blocks
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  const jsonStr = codeBlockMatch ? codeBlockMatch[1] : null

  if (!jsonStr) return null

  try {
    const parsed = JSON.parse(jsonStr)
    if (parsed && parsed.schemaVersion === 1 && parsed.id && parsed.name && parsed.transform) {
      return parsed as CustomToolConfig
    }
  } catch {
    // Invalid JSON
  }
  return null
}

export default function ToolBuilderView() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [prompt, setPrompt] = useState('')
  const [configJson, setConfigJson] = useState('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { saveTool, loadTools, deleteTool, tools } = useCustomToolsStore()
  const { setActiveTool } = useSettingsStore()

  const { output, isStreaming, error, generate, cancel, reset } = useAi({
    systemPrompt: SYSTEM_PROMPT,
    temperature: 0.7,
    maxTokens: 4000
  })

  // When AI finishes streaming, add to messages and try to extract config
  const prevStreamingRef = useRef(false)
  useEffect(() => {
    if (prevStreamingRef.current && !isStreaming && output) {
      setMessages((prev) => [...prev, { role: 'assistant', content: output }])

      const extracted = extractJsonFromText(output)
      if (extracted) {
        const now = new Date().toISOString()
        extracted.createdAt = extracted.createdAt || now
        extracted.updatedAt = now
        setConfigJson(JSON.stringify(extracted, null, 2))
      }

      reset()
    }
    prevStreamingRef.current = isStreaming
  }, [isStreaming, output, reset])

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, output])

  const handleSend = useCallback(() => {
    if (!prompt.trim() || isStreaming) return
    const userMsg = prompt.trim()
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }])
    setPrompt('')

    // If we have an existing config, include it as context
    let fullPrompt = userMsg
    if (configJson) {
      fullPrompt = `Current tool config:\n\`\`\`json\n${configJson}\n\`\`\`\n\nUser request: ${userMsg}`
    }

    generate(fullPrompt)
  }, [prompt, isStreaming, configJson, generate])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  const handleSave = useCallback(async () => {
    if (!configJson) return
    setSaveStatus('saving')
    try {
      const config = JSON.parse(configJson) as CustomToolConfig
      const now = new Date().toISOString()
      config.createdAt = config.createdAt || now
      config.updatedAt = now
      config.category = 'custom'

      await saveTool(config)
      await loadTools()

      // Re-register custom tools
      unregisterCustomTools()
      registerCustomTools(useCustomToolsStore.getState().tools)

      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch {
      setSaveStatus('idle')
    }
  }, [configJson, saveTool, loadTools])

  const handleDeleteTool = useCallback(async () => {
    if (!configJson) return
    try {
      const config = JSON.parse(configJson) as CustomToolConfig
      await deleteTool(config.id)
      await loadTools()
      unregisterCustomTools()
      registerCustomTools(useCustomToolsStore.getState().tools)
      setConfigJson('')
    } catch {
      // ignore
    }
  }, [configJson, deleteTool, loadTools])

  const handleTestTool = useCallback(() => {
    if (!configJson) return
    try {
      const config = JSON.parse(configJson) as CustomToolConfig
      // Check if tool exists in registry by trying to navigate to it
      const existingTool = tools.find((t) => t.id === config.id)
      if (existingTool) {
        setActiveTool(config.id)
      }
    } catch {
      // ignore
    }
  }, [configJson, tools, setActiveTool])

  const isConfigValid = (() => {
    if (!configJson) return false
    try {
      const c = JSON.parse(configJson)
      return c && c.schemaVersion === 1 && c.id && c.name && c.transform
    } catch {
      return false
    }
  })()

  const savedToolExists = (() => {
    if (!configJson) return false
    try {
      const c = JSON.parse(configJson)
      return tools.some((t) => t.id === c.id)
    } catch {
      return false
    }
  })()

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <ToolHeader
        icon={Bot}
        name="AI Tool Builder"
        description="Describe a tool and AI will create it for you"
        toolId="ai-tool-builder"
        aiEnabled
      />

      <div className="grid flex-1 grid-cols-2 gap-3" style={{ minHeight: 0 }}>
        {/* Left panel — Chat */}
        <div className="flex flex-col gap-2 overflow-hidden">
          <span className="text-sm font-medium">Chat</span>
          <div className="flex flex-1 flex-col overflow-hidden rounded-md border border-border">
            {/* Messages area */}
            <ScrollArea className="flex-1 p-3">
              <div className="flex flex-col gap-3">
                {messages.length === 0 && !isStreaming && (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    Describe the tool you want to create. For example:
                    <br />
                    <span className="italic">
                      &ldquo;Create a tool that converts comma-separated values to a JSON
                      array&rdquo;
                    </span>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Bot className="size-3.5" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <pre className="whitespace-pre-wrap break-words font-sans">
                        {msg.content}
                      </pre>
                    </div>
                    {msg.role === 'user' && (
                      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted">
                        <User className="size-3.5" />
                      </div>
                    )}
                  </div>
                ))}

                {/* Streaming output */}
                {isStreaming && output && (
                  <div className="flex gap-2">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Bot className="size-3.5" />
                    </div>
                    <div className="max-w-[85%] rounded-lg bg-muted px-3 py-2 text-sm">
                      <pre className="whitespace-pre-wrap break-words font-sans">{output}</pre>
                    </div>
                  </div>
                )}

                {isStreaming && !output && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Generating tool config...
                  </div>
                )}

                {error && (
                  <div className="rounded-md border border-red-500/30 bg-red-500/10 p-2 text-sm text-red-500">
                    {error}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input area */}
            <div className="border-t border-border p-2">
              <div className="flex gap-2">
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe a tool to create..."
                  className="min-h-[44px] max-h-[100px] resize-none text-sm"
                  disabled={isStreaming}
                />
                {isStreaming ? (
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={cancel}
                    className="shrink-0 self-end"
                  >
                    <Square className="size-4" />
                  </Button>
                ) : (
                  <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={!prompt.trim()}
                    className="shrink-0 self-end"
                  >
                    <Send className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right panel — Config editor */}
        <div className="flex flex-col gap-2 overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Tool Config</span>
            <div className="flex items-center gap-1.5">
              {savedToolExists && (
                <Button variant="outline" size="xs" onClick={handleTestTool}>
                  <Check className="size-3" />
                  Open Tool
                </Button>
              )}
              {savedToolExists && (
                <Button variant="outline" size="xs" onClick={handleDeleteTool}>
                  <Trash2 className="size-3" />
                  Delete
                </Button>
              )}
              <Button
                size="xs"
                onClick={handleSave}
                disabled={!isConfigValid || saveStatus === 'saving'}
              >
                {saveStatus === 'saving' ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : saveStatus === 'saved' ? (
                  <Check className="size-3" />
                ) : (
                  <Save className="size-3" />
                )}
                {saveStatus === 'saved' ? 'Saved!' : 'Save Tool'}
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden rounded-md border border-border">
            <MonacoWrapper
              value={configJson}
              onChange={(v) => setConfigJson(v)}
              language="json"
              height="100%"
            />
          </div>
          {configJson && !isConfigValid && (
            <p className="text-xs text-amber-500">
              Config must have schemaVersion: 1, id, name, and transform fields
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
