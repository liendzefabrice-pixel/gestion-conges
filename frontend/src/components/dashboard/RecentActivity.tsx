import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Clock, FileText, UserPlus, Calendar, CheckCircle, XCircle } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ActivityItem {
  id: string | number
  icon: typeof Clock
  colorClass: string
  title: string
  description: string
  time: string
  badge?: { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' }
}

interface RecentActivityProps {
  activities: ActivityItem[]
  title?: string
}

const fallbackActivities: ActivityItem[] = [
  {
    id: 1,
    icon: FileText,
    colorClass: 'text-amber-600 bg-amber-100',
    title: 'Nouvelle demande de congé',
    description: 'Sophie Martin a soumis une demande',
    time: 'Il y a 5 min',
    badge: { label: 'En attente', variant: 'warning' },
  },
  {
    id: 2,
    icon: UserPlus,
    colorClass: 'text-blue-600 bg-blue-100',
    title: 'Nouvel employé ajouté',
    description: 'Thomas Dubois a rejoint l\'équipe',
    time: 'Il y a 1h',
  },
  {
    id: 3,
    icon: CheckCircle,
    colorClass: 'text-emerald-600 bg-emerald-100',
    title: 'Demande approuvée',
    description: 'Congé de Marie Lambert approuvé',
    time: 'Il y a 2h',
    badge: { label: 'Approuvé', variant: 'success' },
  },
  {
    id: 4,
    icon: Calendar,
    colorClass: 'text-purple-600 bg-purple-100',
    title: 'Planification mise à jour',
    description: 'Planning de juillet 2026 modifié',
    time: 'Il y a 3h',
  },
  {
    id: 5,
    icon: XCircle,
    colorClass: 'text-red-600 bg-red-100',
    title: 'Demande refusée',
    description: 'Permission de Julien Petit refusée',
    time: 'Il y a 4h',
    badge: { label: 'Refusé', variant: 'danger' },
  },
]

export function RecentActivity({ activities, title = 'Activité récente' }: RecentActivityProps) {
  const items = activities.length > 0 ? activities : fallbackActivities

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="size-4 text-muted-foreground" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <div className="divide-y divide-border/50">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.id}
                className="flex items-start gap-3 px-6 py-3.5 transition-colors hover:bg-muted/30"
              >
                <div className={cn('flex items-center justify-center w-9 h-9 rounded-xl shrink-0', item.colorClass)}>
                  <Icon className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    {item.badge && (
                      <Badge variant={item.badge.variant}>{item.badge.label}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">{item.time}</span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
