import { create } from 'zustand'
import type { CustomToolConfig } from '@/tools/custom/types'

interface CustomToolsState {
  tools: CustomToolConfig[]
  loading: boolean
  loadTools: () => Promise<void>
  saveTool: (config: CustomToolConfig) => Promise<void>
  deleteTool: (id: string) => Promise<void>
}

export const useCustomToolsStore = create<CustomToolsState>((set) => ({
  tools: [],
  loading: false,

  loadTools: async () => {
    set({ loading: true })
    try {
      const raw = await window.api.customTools.list()
      set({ tools: raw as CustomToolConfig[], loading: false })
    } catch {
      set({ tools: [], loading: false })
    }
  },

  saveTool: async (config: CustomToolConfig) => {
    await window.api.customTools.save(config)
    const raw = await window.api.customTools.list()
    set({ tools: raw as CustomToolConfig[] })
  },

  deleteTool: async (id: string) => {
    await window.api.customTools.delete(id)
    const raw = await window.api.customTools.list()
    set({ tools: raw as CustomToolConfig[] })
  }
}))
