import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function ProtectedRoute() {
  const { user, isLoading, isDisabled } = useAuth()

  if (isLoading) {
    return <div style={{ padding: 16 }}>Loading…</div>
  }

  if (isDisabled) {
    return <div style={{ padding: 16 }}>Account Disabled</div>
  }

  if (!user) {
    // When not authenticated, send users to the public home page
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
