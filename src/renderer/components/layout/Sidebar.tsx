import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useSettingsStore } from '@/stores/settings'
import { getToolsByCategory } from '@/tools/registry'
import { categoryOrder, categoryLabels } from '@/tools/types'

export function Sidebar() {
  const { activeTool, setActiveTool, sidebarCollapsed } = useSettingsStore()

  return (
    <div
      className={cn(
        'flex shrink-0 flex-col border-r border-border bg-sidebar-background transition-[width] duration-200 ease-in-out',
        sidebarCollapsed ? 'w-14' : 'w-56'
      )}
    >
      <ScrollArea className="flex-1">
        <TooltipProvider delayDuration={0}>
          <div className="flex flex-col gap-1 p-2">
            {categoryOrder.map((category) => {
              const tools = getToolsByCategory(category)
              if (tools.length === 0) return null

              return (
                <div key={category}>
                  {!sidebarCollapsed && (
                    <div className="mb-1 mt-3 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground first:mt-1">
                      {categoryLabels[category]}
                    </div>
                  )}
                  {sidebarCollapsed && <div className="mt-2 first:mt-0" />}
                  {tools.map((tool) => {
                    const isActive = activeTool === tool.id
                    const Icon = tool.icon

                    const button = (
                      <Button
                        key={tool.id}
                        variant="ghost"
                        size={sidebarCollapsed ? 'icon-sm' : 'sm'}
                        className={cn(
                          'w-full justify-start gap-2',
                          sidebarCollapsed && 'justify-center',
                          isActive &&
                            'bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent'
                        )}
                        onClick={() => setActiveTool(tool.id)}
                      >
                        <Icon className="size-4 shrink-0" />
                        {!sidebarCollapsed && (
                          <span className="truncate">{tool.name}</span>
                        )}
                      </Button>
                    )

                    if (sidebarCollapsed) {
                      return (
                        <Tooltip key={tool.id}>
                          <TooltipTrigger asChild>{button}</TooltipTrigger>
                          <TooltipContent side="right">{tool.name}</TooltipContent>
                        </Tooltip>
                      )
                    }

                    return button
                  })}
                </div>
              )
            })}
          </div>
        </TooltipProvider>
      </ScrollArea>
    </div>
  )
}
