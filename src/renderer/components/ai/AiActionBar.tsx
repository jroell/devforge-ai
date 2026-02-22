import { Sparkles, Lightbulb, Code, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { PrivacyBadge } from './PrivacyBadge'
import { cn } from '@/lib/utils'

interface AiActionBarProps {
  input: string
  onMagicFix?: (result: string) => void
  onExplain?: () => void
  onGenerate?: () => void
  showMagicFix?: boolean
  showExplain?: boolean
  showGenerate?: boolean
  isError?: boolean
  isStreaming?: boolean
  activeAction?: 'magic-fix' | 'explain' | 'generate' | null
  providerUsed?: string | null
  isLocal?: boolean | null
  className?: string
}

export function AiActionBar({
  onMagicFix,
  onExplain,
  onGenerate,
  showMagicFix = true,
  showExplain = true,
  showGenerate = true,
  isError = false,
  isStreaming = false,
  activeAction = null,
  providerUsed = null,
  isLocal = null,
  className,
}: AiActionBarProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          'flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2 py-1.5',
          className
        )}
      >
        {showMagicFix && onMagicFix && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isError ? 'default' : 'ghost'}
                size="xs"
                onClick={() => onMagicFix('')}
                disabled={isStreaming}
              >
                {isStreaming && activeAction === 'magic-fix' ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Sparkles className="size-3" />
                )}
                Magic Fix
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              AI-powered auto-fix for errors and issues
            </TooltipContent>
          </Tooltip>
        )}

        {showExplain && onExplain && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="xs"
                onClick={onExplain}
                disabled={isStreaming}
              >
                {isStreaming && activeAction === 'explain' ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Lightbulb className="size-3" />
                )}
                Explain
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              Get an AI explanation of this content
            </TooltipContent>
          </Tooltip>
        )}

        {showGenerate && onGenerate && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="xs"
                onClick={onGenerate}
                disabled={isStreaming}
              >
                {isStreaming && activeAction === 'generate' ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Code className="size-3" />
                )}
                Generate Types
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              Generate TypeScript types from the input
            </TooltipContent>
          </Tooltip>
        )}

        <div className="ml-auto">
          <PrivacyBadge isLocal={isLocal} provider={providerUsed} />
        </div>
      </div>
    </TooltipProvider>
  )
}
