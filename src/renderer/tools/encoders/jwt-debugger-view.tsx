import { useState, useEffect } from 'react'
import { KeyRound, Eraser, ArrowRightFromLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ToolHeader } from '@/components/shared/ToolHeader'
import { CopyButton } from '@/components/shared/CopyButton'

interface JwtParts {
  header: string
  payload: string
  signature: string
  isExpired: boolean | null
}

function decodeJwtPart(part: string): string {
  const base64 = part.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  const decoded = atob(padded)
  const json = JSON.parse(decoded)
  return JSON.stringify(json, null, 2)
}

function parseJwt(token: string): JwtParts | null {
  const parts = token.trim().split('.')
  if (parts.length !== 3) return null

  try {
    const header = decodeJwtPart(parts[0])
    const payload = decodeJwtPart(parts[1])
    const signature = parts[2]

    let isExpired: boolean | null = null
    try {
      const payloadObj = JSON.parse(payload)
      if (typeof payloadObj.exp === 'number') {
        isExpired = payloadObj.exp * 1000 < Date.now()
      }
    } catch {
      // payload parsed ok above, exp check is optional
    }

    return { header, payload, signature, isExpired }
  } catch {
    return null
  }
}

export default function JwtDebuggerView() {
  const [input, setInput] = useState('')
  const [decoded, setDecoded] = useState<JwtParts | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    window.api.clipboard.read().then((text) => {
      const trimmed = text.trim()
      if (trimmed.startsWith('eyJ')) {
        setInput(trimmed)
      }
    })
  }, [])

  useEffect(() => {
    if (!input.trim()) {
      setDecoded(null)
      setError(null)
      return
    }
    const result = parseJwt(input)
    if (result) {
      setDecoded(result)
      setError(null)
    } else {
      setDecoded(null)
      setError('Invalid JWT token. Expected format: header.payload.signature')
    }
  }, [input])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        handleCopyAndClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [decoded])

  const handleClear = () => {
    setInput('')
    setDecoded(null)
    setError(null)
  }

  const handleCopyAndClose = async () => {
    if (!decoded) return
    const text = `HEADER:\n${decoded.header}\n\nPAYLOAD:\n${decoded.payload}\n\nSIGNATURE:\n${decoded.signature}`
    await window.api.clipboard.write(text)
    window.api.window.hide()
  }

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <ToolHeader
        icon={KeyRound}
        name="JWT Debugger"
        description="Decode and inspect JSON Web Tokens"
        toolId="jwt-debugger"
        aiEnabled
      />

      <div className="flex items-center gap-2">
        {decoded && (
          decoded.isExpired === true ? (
            <Badge variant="destructive">Expired</Badge>
          ) : decoded.isExpired === false ? (
            <Badge className="bg-green-600 text-white hover:bg-green-700">Valid</Badge>
          ) : null
        )}
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleClear}>
            <Eraser className="size-3.5" />
            Clear
          </Button>
          <Button size="sm" onClick={handleCopyAndClose} disabled={!decoded}>
            <ArrowRightFromLine className="size-3.5" />
            Copy & Close
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">JWT Token</span>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste a JWT token (eyJhbG...)..."
          className="min-h-[80px] font-mono text-sm"
        />
      </div>

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500">
          {error}
        </div>
      )}

      {decoded && (
        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-blue-500">HEADER</span>
                <CopyButton text={decoded.header} />
              </div>
              <pre className="rounded-md border border-border bg-muted/30 p-3 font-mono text-sm whitespace-pre-wrap">
                {decoded.header}
              </pre>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-purple-500">PAYLOAD</span>
                <CopyButton text={decoded.payload} />
              </div>
              <pre className="rounded-md border border-border bg-muted/30 p-3 font-mono text-sm whitespace-pre-wrap">
                {decoded.payload}
              </pre>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-red-500">SIGNATURE</span>
                <CopyButton text={decoded.signature} />
              </div>
              <pre className="rounded-md border border-border bg-muted/30 p-3 font-mono text-sm whitespace-pre-wrap break-all">
                {decoded.signature}
              </pre>
            </div>
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
