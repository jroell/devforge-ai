import { useState, useEffect, useCallback } from 'react'
import { Check, AlertCircle, Loader2, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSettingsStore } from '@/stores/settings'
import { useAiConfigStore, type AiProviderId } from '@/stores/ai-config'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// -- General Tab --

function GeneralTab() {
  const { theme, setTheme } = useSettingsStore()

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Theme</Label>
        <p className="text-xs text-muted-foreground">Choose your preferred color scheme</p>
        <Select value={theme} onValueChange={(v) => setTheme(v as 'dark' | 'light' | 'dracula')}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dark">Dark</SelectItem>
            <SelectItem value="light">Light</SelectItem>
            <SelectItem value="dracula">Dracula</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Global Hotkey</Label>
        <div className="flex items-center gap-2">
          <kbd className="rounded border border-border bg-muted px-2 py-1 text-xs font-mono">
            Alt + Space
          </kbd>
          <span className="text-xs text-muted-foreground">Show / focus DevForge AI</span>
        </div>
      </div>
    </div>
  )
}

// -- Ollama Tab --

function OllamaTab() {
  const { ollamaEndpoint, ollamaAvailable, setOllamaEndpoint, setOllamaAvailable, providers, updateProvider } = useAiConfigStore()
  const [endpoint, setEndpoint] = useState(ollamaEndpoint)
  const [testing, setTesting] = useState(false)
  const [models, setModels] = useState<string[]>([])

  const testConnection = useCallback(async () => {
    setTesting(true)
    try {
      const res = await fetch(`${endpoint}/api/tags`)
      if (res.ok) {
        const data = await res.json() as { models?: { name: string }[] }
        setOllamaAvailable(true)
        setOllamaEndpoint(endpoint)
        const modelNames = (data.models ?? []).map((m: { name: string }) => m.name)
        setModels(modelNames)
      } else {
        setOllamaAvailable(false)
        setModels([])
      }
    } catch {
      setOllamaAvailable(false)
      setModels([])
    } finally {
      setTesting(false)
    }
  }, [endpoint, setOllamaAvailable, setOllamaEndpoint])

  useEffect(() => {
    testConnection()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Endpoint URL</Label>
        <div className="flex gap-2">
          <Input
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder="http://localhost:11434"
          />
          <Button
            variant="outline"
            onClick={testConnection}
            disabled={testing}
          >
            {testing ? <Loader2 className="size-4 animate-spin" /> : 'Test'}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {ollamaAvailable ? (
          <>
            <Check className="size-4 text-green-500" />
            <span className="text-sm text-green-500">Connected</span>
          </>
        ) : (
          <>
            <AlertCircle className="size-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Not connected</span>
          </>
        )}
      </div>

      <div className="space-y-2">
        <Label>Model</Label>
        {models.length > 0 ? (
          <Select
            value={providers.ollama.model}
            onValueChange={(value) => updateProvider('ollama', { model: value })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {models.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input value={providers.ollama.model} onChange={(e) => updateProvider('ollama', { model: e.target.value })} placeholder="llama3" />
        )}
      </div>
    </div>
  )
}

// -- Cloud Provider Tab --

interface CloudProviderTabProps {
  providerId: AiProviderId
  label: string
  models: { value: string; label: string }[]
}

function CloudProviderTab({ providerId, label, models }: CloudProviderTabProps) {
  const { providers, updateProvider } = useAiConfigStore()
  const provider = providers[providerId]
  const [apiKey, setApiKey] = useState('')
  const [saving, setSaving] = useState(false)

  const saveKey = async () => {
    if (!apiKey.trim()) return
    setSaving(true)
    try {
      await window.api.keychain.store(providerId, apiKey.trim())
      updateProvider(providerId, { apiKeySet: true, enabled: true })
      setApiKey('')
    } finally {
      setSaving(false)
    }
  }

  const removeKey = async () => {
    await window.api.keychain.delete(providerId)
    updateProvider(providerId, { apiKeySet: false, enabled: false })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Enable {label}</Label>
          <p className="text-xs text-muted-foreground">Use {label} as an AI provider</p>
        </div>
        <Switch
          checked={provider.enabled}
          onCheckedChange={(checked) => updateProvider(providerId, { enabled: checked })}
          disabled={!provider.apiKeySet}
        />
      </div>

      <div className="space-y-2">
        <Label>API Key</Label>
        <div className="flex items-center gap-2">
          {provider.apiKeySet ? (
            <>
              <div className="flex flex-1 items-center gap-2 rounded-md border border-border bg-muted px-3 py-2">
                <Check className="size-4 text-green-500" />
                <span className="text-sm text-green-500">Key saved securely</span>
              </div>
              <Button variant="outline" size="icon" onClick={removeKey}>
                <Trash2 className="size-4" />
              </Button>
            </>
          ) : (
            <>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={`Enter ${label} API key`}
                className="flex-1"
              />
              <Button onClick={saveKey} disabled={saving || !apiKey.trim()}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : 'Save Key'}
              </Button>
            </>
          )}
        </div>
        {!provider.apiKeySet && (
          <p className="text-xs text-muted-foreground">Not configured</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Model</Label>
        <Select
          value={provider.model}
          onValueChange={(value) => updateProvider(providerId, { model: value })}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {models.map((m) => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

// -- Model Lists --

const OPENAI_MODELS = [
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
]

const ANTHROPIC_MODELS = [
  { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
  { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
  { value: 'claude-opus-4-20250514', label: 'Claude Opus 4' },
]

const GOOGLE_MODELS = [
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
]

// -- Settings Dialog --

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure AI providers and application preferences.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" orientation="horizontal">
          <TabsList className="w-full">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="ollama">Ollama</TabsTrigger>
            <TabsTrigger value="openai">OpenAI</TabsTrigger>
            <TabsTrigger value="anthropic">Anthropic</TabsTrigger>
            <TabsTrigger value="google">Google</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4">
            <GeneralTab />
          </TabsContent>

          <TabsContent value="ollama" className="mt-4">
            <OllamaTab />
          </TabsContent>

          <TabsContent value="openai" className="mt-4">
            <CloudProviderTab
              providerId="openai"
              label="OpenAI"
              models={OPENAI_MODELS}
            />
          </TabsContent>

          <TabsContent value="anthropic" className="mt-4">
            <CloudProviderTab
              providerId="anthropic"
              label="Anthropic"
              models={ANTHROPIC_MODELS}
            />
          </TabsContent>

          <TabsContent value="google" className="mt-4">
            <CloudProviderTab
              providerId="google"
              label="Google"
              models={GOOGLE_MODELS}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
