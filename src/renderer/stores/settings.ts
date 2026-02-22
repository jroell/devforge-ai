import { create } from 'zustand'

interface SettingsState {
  activeTool: string
  sidebarCollapsed: boolean
  theme: 'dark' | 'light'
  setActiveTool: (toolId: string) => void
  toggleSidebar: () => void
  setTheme: (theme: 'dark' | 'light') => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  activeTool: 'json-formatter',
  sidebarCollapsed: false,
  theme: 'dark',

  setActiveTool: (toolId: string) => set({ activeTool: toolId }),

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setTheme: (theme: 'dark' | 'light') => {
    if (theme === 'light') {
      document.documentElement.classList.add('light')
    } else {
      document.documentElement.classList.remove('light')
    }
    set({ theme })
  }
}))
