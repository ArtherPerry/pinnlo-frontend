import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Role = 'OWNER' | 'MANAGER' | 'STAFF'
export type Plan = 'STARTER' | 'PRO' | 'AGENCY' | 'ENTERPRISE'

export interface AuthUser {
  id:         string
  email:      string
  name:       string
  role:       Role
  agencyId:   string
  agencyName: string
  plan:       Plan
  locale:     string
}

interface AuthState {
  user:    AuthUser | null
  setUser: (user: AuthUser) => void
  logout:  () => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user:    null,
      setUser: (user) => set({ user }),
      logout:  () => set({ user: null }),
    }),
    { name: 'pinnlo-auth' }
  )
)

export function usePlanTier() {
  return useAuth((s) => s.user?.plan ?? null)
}