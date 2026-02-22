import { Command } from 'cmdk'
import { getTools } from '@/tools/registry'
import { categoryLabels, categoryOrder } from '@/tools/types'
import { useSettingsStore } from '@/stores/settings'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const { setActiveTool } = useSettingsStore()
  const tools = getTools()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <Command
        className="relative w-[560px] rounded-xl border border-border bg-popover shadow-2xl overflow-hidden"
        loop
      >
        <Command.Input
          placeholder="Search tools..."
          className="w-full px-4 py-3 text-sm bg-transparent border-b border-border outline-none placeholder:text-muted-foreground"
          autoFocus
        />
        <Command.List className="max-h-[300px] overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
            No tools found.
          </Command.Empty>
          {categoryOrder.map(category => {
            const categoryTools = tools.filter(t => t.category === category)
            if (categoryTools.length === 0) return null
            return (
              <Command.Group
                key={category}
                heading={categoryLabels[category]}
                className="[&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
              >
                {categoryTools.map(tool => {
                  const Icon = tool.icon
                  return (
                    <Command.Item
                      key={tool.id}
                      value={`${tool.name} ${tool.keywords.join(' ')}`}
                      onSelect={() => {
                        setActiveTool(tool.id)
                        onOpenChange(false)
                      }}
                      className="flex items-center gap-2.5 px-2 py-2 text-sm rounded-md cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span>{tool.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {tool.description}
                      </span>
                    </Command.Item>
                  )
                })}
              </Command.Group>
            )
          })}
        </Command.List>
      </Command>
    </div>
  )
}
