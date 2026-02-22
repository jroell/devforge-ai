import { Suspense } from 'react'
import { Wrench } from 'lucide-react'
import { useSettingsStore } from '@/stores/settings'
import { getToolById } from '@/tools/registry'
import { ToolSkeleton } from '@/components/shared/ToolSkeleton'

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground">
      <Wrench className="size-12 opacity-30" />
      <div className="text-center">
        <p className="text-lg font-medium">Select a tool</p>
        <p className="text-sm">
          Pick a tool from the sidebar or press{' '}
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs">
            Cmd+K
          </kbd>
        </p>
      </div>
    </div>
  )
}

export function ToolShell() {
  const activeTool = useSettingsStore((s) => s.activeTool)
  const tool = getToolById(activeTool)

  if (!tool) {
    return <EmptyState />
  }

  const ToolComponent = tool.component

  return (
    <div key={activeTool} className="tool-enter h-full">
      <Suspense fallback={<ToolSkeleton />}>
        <ToolComponent />
      </Suspense>
    </div>
  )
}
