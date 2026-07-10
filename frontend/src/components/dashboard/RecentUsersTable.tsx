import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Users } from 'lucide-react'
import { translateRole } from '../../lib/utils'
import { cn } from '../../lib/utils'

interface UserEntry {
  id: number
  email: string
  name?: string
  role: { id: number; name: string; description?: string }
  createdAt: string
  isActive: boolean
}

interface RecentUsersTableProps {
  users: UserEntry[]
  title?: string
}

export function RecentUsersTable({ users, title = 'Derniers utilisateurs' }: RecentUsersTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="size-4 text-muted-foreground" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {users.length > 0 ? (
          <div className="divide-y divide-border/50">
            {users.slice(0, 5).map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 px-6 py-3 transition-colors hover:bg-muted/30"
              >
                <img src="/images/Avatar.png" alt="" className="w-9 h-9 rounded-full shrink-0 object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{user.email}</p>
                  <p className="text-xs text-muted-foreground">{translateRole(user.role?.name || '')}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                  <Badge variant={user.isActive ? 'success' : 'danger'} className="mt-0.5">
                    {user.isActive ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Users className="size-8 mb-2 text-muted-foreground/50" />
            <p className="text-sm">Aucun utilisateur</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
