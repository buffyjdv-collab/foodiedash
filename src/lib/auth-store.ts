'use client'

import { create } from 'zustand'

export interface AuthUser {
  id: string
  phone: string
  name: string | null
  email: string | null
  roles: string[]
  roleLabels: string[]
  permissions: string[]
}

interface AuthState {
  user: AuthUser | null
  loading: boolean // true while /api/auth/me is in-flight
  loginOpen: boolean
  setLoginOpen: (open: boolean) => void
  setUser: (user: AuthUser | null) => void
  setLoading: (loading: boolean) => void
  hydrate: () => Promise<void>
  logout: () => Promise<void>

  // helpers
  hasPermission: (action: string) => boolean
  hasRole: (role: string) => boolean
  isAdmin: () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  loginOpen: false,
  setLoginOpen: (open) => set({ loginOpen: open }),
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),

  hydrate: async () => {
    set({ loading: true })
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' })
      const data = await res.json()
      set({ user: data.user || null, loading: false })
    } catch {
      set({ user: null, loading: false })
    }
  },

  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // ignore
    }
    set({ user: null })
  },

  hasPermission: (action) => {
    const u = get().user
    if (!u) return false
    if (u.roles.includes('SUPER_ADMIN')) return true
    return u.permissions.includes(action)
  },
  hasRole: (role) => {
    const u = get().user
    return !!u && u.roles.includes(role)
  },
  isAdmin: () => {
    const u = get().user
    if (!u) return false
    if (u.roles.includes('SUPER_ADMIN')) return true
    // Any role other than CUSTOMER counts as an admin/staff role for portal access.
    return u.roles.some((r) => r !== 'CUSTOMER')
  },
}))
