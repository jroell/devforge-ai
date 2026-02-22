import { useState, useMemo } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useSettingsStore } from '@/stores/settings'
import { getToolsByCategory } from '@/tools/registry'
import { categoryOrder, categoryLabels } from '@/tools/types'

export function Sidebar() {
  const { activeTool, setActiveTool, sidebarCollapsed } = useSettingsStore()
  const [search, setSearch] = useState('')

  const filteredCategories = useMemo(() => {
    const q = search.toLowerCase().trim()
    return categoryOrder
      .map((category) => {
        const tools = getToolsByCategory(category)
        if (!q) return { category, tools }
        return {
          category,
          tools: tools.filter(
            (t) =>
              t.name.toLowerCase().includes(q) ||
              t.description.toLowerCase().includes(q) ||
              t.id.toLowerCase().includes(q)
          )
        }
      })
      .filter((c) => c.tools.length > 0)
  }, [search])

  return (
    <div
      className={cn(
        'flex shrink-0 flex-col overflow-hidden border-r border-border bg-sidebar-background transition-[width] duration-200 ease-in-out',
        sidebarCollapsed ? 'w-14' : 'w-56'
      )}
    >
      {/* Search box */}
      {!sidebarCollapsed && (
        <div className="shrink-0 border-b border-border p-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tools..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 pr-8 text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 overflow-hidden">
        <TooltipProvider delayDuration={0}>
          <div className="flex flex-col gap-1 p-2">
            {filteredCategories.map(({ category, tools }) => (
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
            ))}
            {filteredCategories.length === 0 && (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                No tools found
              </div>
            )}
          </div>
        </TooltipProvider>
      </ScrollArea>
    </div>
  )
}
