import { Suspense } from 'react'
import { Wrench } from 'lucide-react'
import { useSettingsStore } from '@/stores/settings'
import { getToolById } from '@/tools/registry'

function LoadingFallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-sm text-muted-foreground">Loading tool...</div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
      <Wrench className="size-10 opacity-30" />
      <p className="text-sm">Select a tool from the sidebar</p>
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
    <Suspense fallback={<LoadingFallback />}>
      <ToolComponent />
    </Suspense>
  )
}
