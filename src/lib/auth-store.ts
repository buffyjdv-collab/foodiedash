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
  isRider: () => boolean
  isRestaurant: () => boolean
  isAdmin: () => boolean
  defaultViewForRole: () => 'home' | 'admin' | 'rider' | 'restaurant-portal'
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
  isRider: () => {
    const u = get().user
    return !!u && u.roles.includes('DELIVERY_PARTNER')
  },
  isRestaurant: () => {
    const u = get().user
    return !!u && u.roles.some((r) => ['RESTAURANT_OWNER', 'RESTAURANT_STAFF'].includes(r))
  },
  isAdmin: () => {
    const u = get().user
    if (!u) return false
    if (u.roles.includes('SUPER_ADMIN')) return true
    // Admin/staff roles (everything except customer, rider, restaurant)
    return u.roles.some((r) =>
      !['CUSTOMER', 'DELIVERY_PARTNER', 'RESTAURANT_OWNER', 'RESTAURANT_STAFF'].includes(r)
    )
  },
  /**
   * Returns the default view a user should land on after login, based on role.
   * - DELIVERY_PARTNER → 'rider'
   * - RESTAURANT_OWNER / RESTAURANT_STAFF → 'restaurant-portal'
   * - Admin/staff roles → 'admin'
   * - CUSTOMER → 'home'
   */
  defaultViewForRole: (): 'home' | 'admin' | 'rider' | 'restaurant-portal' => {
    const u = get().user
    if (!u) return 'home'
    if (u.roles.includes('DELIVERY_PARTNER')) return 'rider'
    if (u.roles.some((r) => ['RESTAURANT_OWNER', 'RESTAURANT_STAFF'].includes(r))) return 'restaurant-portal'
    if (u.roles.some((r) =>
      !['CUSTOMER', 'DELIVERY_PARTNER', 'RESTAURANT_OWNER', 'RESTAURANT_STAFF'].includes(r)
    )) return 'admin'
    return 'home'
  },
}))
