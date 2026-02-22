import { useEffect } from 'react'
import { TitleBar } from '@/components/layout/TitleBar'
import { Sidebar } from '@/components/layout/Sidebar'
import { ToolShell } from '@/components/layout/ToolShell'
import { useSettingsStore } from '@/stores/settings'
import { useAiConfigStore } from '@/stores/ai-config'

// Side-effect import: triggers tool self-registration
import '@/tools/register'

function App(): React.JSX.Element {
  const setActiveTool = useSettingsStore((s) => s.setActiveTool)

  useEffect(() => {
    const unsubscribe = window.api.onClipboardContent((data) => {
      setActiveTool(data.toolId)
    })
    return unsubscribe
  }, [setActiveTool])

  useEffect(() => {
    useAiConfigStore.getState().loadFromKeychain()
  }, [])

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
