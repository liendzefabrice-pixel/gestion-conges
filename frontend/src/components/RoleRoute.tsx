import { useAuth } from '../contexts/AuthContext'
import AccessDeniedPage from '../pages/AccessDeniedPage'

interface RoleRouteProps {
  children: React.ReactNode
  roles: string[]
}

export default function RoleRoute({ children, roles }: RoleRouteProps) {
  const { user } = useAuth()
  const roleName = user?.role?.name || ''

  if (!roles.includes(roleName)) {
    return <AccessDeniedPage />
  }

  return <>{children}</>
}
