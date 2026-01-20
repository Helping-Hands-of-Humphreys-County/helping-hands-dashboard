import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext } from './AuthContext'
import type { Me } from './authTypes'
import { apiGet, apiPost } from '../api/http'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Me | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDisabled, setIsDisabled] = useState(false)

  const refreshMe = useCallback(async () => {
    setIsLoading(true)
    setIsDisabled(false)
    try {
      const me = await apiGet<Me>('/auth/me')
      if (!me.isActive) {
        setUser(null)
        setIsDisabled(true)
      } else {
        setUser(me)
      }
    } catch (e: unknown) {
      const err = e as { status?: number; code?: string }
      if (err?.status === 403 && err?.code === 'ACCOUNT_DISABLED') {
        setUser(null)
        setIsDisabled(true)
      } else {
        setUser(null)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    setIsDisabled(false)
    try {
      const me = await apiPost<Me>('/auth/login', { email, password })
      // expose briefly for immediate navigation decisions
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).__auth_user__ = me
      if (!me.isActive) {
        setUser(null)
        setIsDisabled(true)
      } else {
        setUser(me)
        // Re-fetch with the issued auth cookie to validate the session and populate any server-derived fields.
        await refreshMe()
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    await apiPost<void>('/auth/logout')
    setUser(null)
  }, [])

  useEffect(() => {
    void refreshMe()
  }, [refreshMe])

  const value = useMemo(
    () => ({ user, isLoading, isDisabled, refreshMe, login, logout }),
    [user, isLoading, isDisabled, refreshMe, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
