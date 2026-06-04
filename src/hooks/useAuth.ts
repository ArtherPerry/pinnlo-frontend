import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser, Role, Plan } from '@/lib/types'

export type { AuthUser, Role, Plan }

interface AuthState {
  user:       AuthUser | null
  _hydrated:  boolean
  setUser:    (user: AuthUser) => void
  logout:     () => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user:      null,
      _hydrated: false,
      setUser:   (user) => set({ user }),
      logout:    () => set({ user: null }),
    }),
    {
      name: 'pinnlo-auth',
      onRehydrateStorage: () => (state) => {
        if (state) state._hydrated = true
      },
    }
  )
)

// Standalone logout function for use outside React components (e.g., API interceptors)
export const clearAuthState = () => useAuth.getState().logout()

export function usePlanTier() {
  return useAuth((s) => s.user?.plan ?? null)
}