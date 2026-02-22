import { create } from 'zustand'

export type Theme = 'dark' | 'light' | 'dracula'

interface SettingsState {
  activeTool: string
  sidebarCollapsed: boolean
  theme: Theme
  setActiveTool: (toolId: string) => void
  toggleSidebar: () => void
  setTheme: (theme: Theme) => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  activeTool: 'json-formatter',
  sidebarCollapsed: false,
  theme: 'dark',

  setActiveTool: (toolId: string) => set({ activeTool: toolId }),

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setTheme: (theme: Theme) => {
    document.documentElement.classList.remove('light', 'dracula')
    if (theme !== 'dark') {
      document.documentElement.classList.add(theme)
    }
    set({ theme })
  }
}))
