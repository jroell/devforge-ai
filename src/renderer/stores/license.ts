import { create } from 'zustand'

export type LicenseStatus = 'trial' | 'expired' | 'licensed' | 'unknown' | 'loading'

interface LicenseState {
  status: LicenseStatus
  expiresAt: string | null
  daysRemaining: number | null
  lastValidated: number | null
  loading: boolean
  initialize: () => Promise<void>
  refresh: () => Promise<void>
  upgrade: () => Promise<void>
  updateFromServer: (state: {
    status: 'trial' | 'expired' | 'licensed' | 'unknown'
    expiresAt: string | null
    daysRemaining: number | null
    lastValidated: number | null
  }) => void
}

export const useLicenseStore = create<LicenseState>((set) => ({
  status: 'loading',
  expiresAt: null,
  daysRemaining: null,
  lastValidated: null,
  loading: true,

  initialize: async () => {
    set({ loading: true })
    try {
      const state = await window.api.license.check()
      if (state.status === 'unknown') {
        await window.api.license.activate()
        const freshState = await window.api.license.check()
        set({ ...freshState, loading: false })
      } else {
        set({ ...state, loading: false })
      }
    } catch {
      try {
        const cached = await window.api.license.cached()
        set({ ...cached, loading: false })
      } catch {
        set({ status: 'unknown', loading: false })
      }
    }
  },

  refresh: async () => {
    try {
      const state = await window.api.license.check()
      set({ ...state })
    } catch {
      // Keep current state on failure
    }
  },

  upgrade: async () => {
    await window.api.license.upgrade()
    const pollInterval = setInterval(async () => {
      try {
        const state = await window.api.license.check()
        if (state.status === 'licensed') {
          set({ ...state })
          clearInterval(pollInterval)
        }
      } catch {
        // Keep polling
      }
    }, 5000)
    setTimeout(() => clearInterval(pollInterval), 600000)
  },

  updateFromServer: (state) => {
    set({ ...state })
  },
}))
