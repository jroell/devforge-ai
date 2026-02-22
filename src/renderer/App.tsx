import { useEffect, useMemo, Suspense } from 'react'
import { TitleBar } from '@/components/layout/TitleBar'
import { Sidebar } from '@/components/layout/Sidebar'
import { ToolShell } from '@/components/layout/ToolShell'
import { useSettingsStore } from '@/stores/settings'
import { useAiConfigStore } from '@/stores/ai-config'
import { getToolById } from '@/tools/registry'

// Side-effect import: triggers tool self-registration
import '@/tools/register'

function App(): React.JSX.Element {
  const setActiveTool = useSettingsStore((s) => s.setActiveTool)

  // Check if this is a popped-out window
  const popoutToolId = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('tool')
  }, [])

  useEffect(() => {
    if (popoutToolId) {
      setActiveTool(popoutToolId)
    }
  }, [popoutToolId, setActiveTool])

  useEffect(() => {
    if (!popoutToolId) {
      const unsubscribe = window.api.onClipboardContent((data) => {
        setActiveTool(data.toolId)
      })
      return unsubscribe
    }
  }, [setActiveTool, popoutToolId])

  useEffect(() => {
    useAiConfigStore.getState().loadFromKeychain()
  }, [])

  // Standalone popout mode: render only the tool
  if (popoutToolId) {
    const tool = getToolById(popoutToolId)
    if (!tool) {
      return (
        <div className="flex h-screen items-center justify-center text-muted-foreground">
          Tool not found: {popoutToolId}
        </div>
      )
    }
    const Component = tool.component
    return (
      <div className="flex h-screen flex-col overflow-hidden">
        <div className="drag-region h-8 shrink-0 border-b border-border" />
        <main className="flex-1 overflow-auto">
          <Suspense fallback={<div className="flex h-full items-center justify-center text-muted-foreground">Loading...</div>}>
            <Component />
          </Suspense>
        </main>
      </div>
    )
  }

  // Normal mode: full app layout
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TitleBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto p-4">
          <ToolShell />
        </main>
      </div>
    </div>
  )
}

export default App
