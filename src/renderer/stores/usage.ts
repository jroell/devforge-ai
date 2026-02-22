import { create } from 'zustand'

interface UsageEntry {
  toolId: string
  toolName: string
  count: number
}

interface UsageState {
  entries: Record<string, UsageEntry>
  trackUsage: (toolId: string, toolName: string) => void
  getTopTools: (limit?: number) => UsageEntry[]
  getTotalUses: () => number
  loadFromStorage: () => Promise<void>
  saveToStorage: () => Promise<void>
}

export const useUsageStore = create<UsageState>((set, get) => ({
  entries: {},

  trackUsage: (toolId: string, toolName: string) => {
    set((state) => {
      const existing = state.entries[toolId]
      const updated = {
        ...state.entries,
        [toolId]: {
          toolId,
          toolName,
          count: existing ? existing.count + 1 : 1,
        },
      }
      return { entries: updated }
    })
    get().saveToStorage()
  },

  getTopTools: (limit = 5) => {
    const entries = Object.values(get().entries)
    return entries.sort((a, b) => b.count - a.count).slice(0, limit)
  },

  getTotalUses: () => {
    return Object.values(get().entries).reduce((sum, e) => sum + e.count, 0)
  },

  loadFromStorage: async () => {
    try {
      const saved = await window.api.settings.get('usageTracking', {})
      if (saved && typeof saved === 'object') {
        set({ entries: saved as Record<string, UsageEntry> })
      }
    } catch {
      // Start fresh if load fails
    }
  },

  saveToStorage: async () => {
    try {
      await window.api.settings.set('usageTracking', get().entries)
    } catch {
      // Silent failure
    }
  },
}))
