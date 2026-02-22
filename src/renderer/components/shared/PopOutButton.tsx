import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface PopOutButtonProps {
  toolId: string
}

export function PopOutButton({ toolId }: PopOutButtonProps) {
  const handlePopOut = () => {
    window.api.window.popout(toolId)
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon-xs" onClick={handlePopOut} className="text-muted-foreground">
            <ExternalLink className="size-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          Pop out to new window
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
