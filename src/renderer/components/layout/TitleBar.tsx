import { Minus, X, Sun, Moon, PanelLeftClose, PanelLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useSettingsStore } from '@/stores/settings'

const isMac = navigator.userAgent.includes('Mac')

export function TitleBar() {
  const { sidebarCollapsed, toggleSidebar, theme, setTheme } = useSettingsStore()

  return (
    <div className="drag-region flex h-12 shrink-0 items-center border-b border-border bg-background">
      {/* Left: macOS traffic light spacing + sidebar toggle */}
      <div className="flex items-center">
        {isMac && <div className="w-16" />}
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="no-drag ml-2"
                onClick={toggleSidebar}
              >
                {sidebarCollapsed ? (
                  <PanelLeft className="size-4" />
                ) : (
                  <PanelLeftClose className="size-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Center: App title */}
      <div className="flex flex-1 items-center justify-center">
        <span className="text-sm font-semibold text-muted-foreground">DevForge AI</span>
      </div>

      {/* Right: Theme toggle + window controls */}
      <div className="flex items-center gap-1 pr-2">
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="no-drag"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? (
                  <Sun className="size-4" />
                ) : (
                  <Moon className="size-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {!isMac && (
          <>
            <Button
              variant="ghost"
              size="icon-sm"
              className="no-drag"
              onClick={() => window.api.window.minimize()}
            >
              <Minus className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="no-drag hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => window.api.window.hide()}
            >
              <X className="size-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
