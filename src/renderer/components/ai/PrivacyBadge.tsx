import { ShieldCheck, Cloud } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface PrivacyBadgeProps {
  isLocal: boolean | null
  provider: string | null
  className?: string
}

const PROVIDER_LABELS: Record<string, string> = {
  ollama: 'Ollama',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google',
}

export function PrivacyBadge({ isLocal, provider, className }: PrivacyBadgeProps) {
  if (isLocal === null) return null

  const providerLabel = provider ? (PROVIDER_LABELS[provider] ?? provider) : 'Cloud'

  if (isLocal) {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className={cn(
                'border-green-500/30 bg-green-500/10 text-green-500 gap-1',
                className
              )}
            >
              <ShieldCheck className="size-3" />
              Local
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top">
            Running on local Ollama — your data stays private
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              'border-amber-500/30 bg-amber-500/10 text-amber-500 gap-1',
              className
            )}
          >
            <Cloud className="size-3" />
            {providerLabel}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top">
          Using {providerLabel} cloud API — data sent to third party
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
