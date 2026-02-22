import { useState } from 'react'
import { Minus, X, Sun, Moon, Palette, PanelLeftClose, PanelLeft, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useSettingsStore, type Theme } from '@/stores/settings'
import { SettingsDialog } from '@/components/settings/SettingsDialog'

const isMac = navigator.userAgent.includes('Mac')
const themeOrder: Theme[] = ['dark', 'light', 'dracula']
const themeLabels: Record<Theme, string> = { dark: 'Dark', light: 'Light', dracula: 'Dracula' }

export function TitleBar() {
  const { sidebarCollapsed, toggleSidebar, theme, setTheme } = useSettingsStore()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const nextTheme = themeOrder[(themeOrder.indexOf(theme) + 1) % themeOrder.length]

  return (
    <>
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

      {/* Right: Settings + Theme toggle + window controls */}
      <div className="flex items-center gap-1 pr-2">
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="no-drag"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Settings</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="no-drag"
                onClick={() => setTheme(nextTheme)}
              >
                {theme === 'light' ? (
                  <Sun className="size-4" />
                ) : theme === 'dracula' ? (
                  <Palette className="size-4" />
                ) : (
                  <Moon className="size-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              Switch to {themeLabels[nextTheme]}
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
    <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  )
}
