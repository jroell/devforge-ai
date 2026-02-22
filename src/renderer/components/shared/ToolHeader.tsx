import type { LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Sparkles } from 'lucide-react'

interface ToolHeaderProps {
  icon: LucideIcon
  name: string
  description: string
  aiEnabled?: boolean
}

export function ToolHeader({ icon: Icon, name, description, aiEnabled }: ToolHeaderProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-5" />
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">{name}</h1>
          {aiEnabled && (
            <Badge variant="secondary" className="gap-1 text-[10px]">
              <Sparkles className="size-3" />
              AI
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
