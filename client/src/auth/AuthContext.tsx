import { createContext, useContext } from 'react'
import type { Me } from './authTypes'

export type AuthState = {
  user: Me | null
  isLoading: boolean
  isDisabled: boolean
}

export type AuthApi = {
  refreshMe: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export type AuthContextValue = AuthState & AuthApi

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within <AuthProvider/>')
  }
  return ctx
}
