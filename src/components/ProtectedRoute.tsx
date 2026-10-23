import { Navigate, Outlet, useLocation } from 'react-router'
import { useSession } from '@/lib/auth'

export function ProtectedRoute() {
  const session = useSession()
  const location = useLocation()

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  return <Outlet />
}

export function AdminRoute() {
  const session = useSession()
  if (session?.role !== 'admin') {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}
