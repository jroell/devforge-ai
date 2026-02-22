import { create } from 'zustand'

interface HistoryEntry {
  toolId: string
  timestamp: number
}

interface HistoryState {
  recent: HistoryEntry[]
  addEntry: (toolId: string) => void
  getRecent: (limit?: number) => HistoryEntry[]
  clear: () => void
}

const MAX_HISTORY = 20

export const useHistoryStore = create<HistoryState>((set, get) => ({
  recent: [],

  addEntry: (toolId: string) => {
    set((state) => {
      // Remove existing entry for this tool (if any) and add to front
      const filtered = state.recent.filter((e) => e.toolId !== toolId)
      const entry: HistoryEntry = { toolId, timestamp: Date.now() }
      return {
        recent: [entry, ...filtered].slice(0, MAX_HISTORY)
      }
    })
    // Persist to electron-store
    const entries = get().recent
    window.api.settings.set('history.recent', entries).catch(() => {})
  },

  getRecent: (limit = 5) => {
    return get().recent.slice(0, limit)
  },

  clear: () => {
    set({ recent: [] })
    window.api.settings.set('history.recent', []).catch(() => {})
  }
}))

// Load persisted history on startup
export async function loadHistory(): Promise<void> {
  const saved = (await window.api.settings.get('history.recent', [])) as HistoryEntry[]
  if (Array.isArray(saved) && saved.length > 0) {
    useHistoryStore.setState({ recent: saved.slice(0, MAX_HISTORY) })
  }
}
