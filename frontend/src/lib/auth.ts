'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserRole = 'ADMIN' | 'FARM_MANAGER' | 'SALES_OFFICER' | 'ACCOUNTANT'

interface AuthUser {
  username: string
  fullName: string
  role: UserRole
  tenantId: number
  tenantName: string
}

interface AuthState {
  token: string | null
  user: AuthUser | null
  setAuth: (token: string, user: AuthUser) => void
  logout: () => void
  hasRole: (...roles: UserRole[]) => boolean
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      hasRole: (...roles) => {
        const role = get().user?.role
        return role ? roles.includes(role) : false
      },
    }),
    { name: 'farm-auth' }
  )
)
