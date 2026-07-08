import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { CardDescription } from '../ui/card'
import { Clock, UserPlus, Calendar, CheckCircle, FileText } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ActivityItem {
  id: string | number
  icon: typeof Clock
  colorClass: string
  title: string
  description: string
  date: string
  time: string
}

interface RecentActivityCardProps {
  activities?: ActivityItem[]
  className?: string
}

const iconMap: Record<string, { icon: typeof Clock; color: string }> = {
  USER_CREATED: { icon: UserPlus, color: 'text-blue-600 bg-blue-100' },
  LEAVE_CREATED: { icon: Calendar, color: 'text-amber-600 bg-amber-100' },
  LEAVE_APPROVED: { icon: CheckCircle, color: 'text-emerald-600 bg-emerald-100' },
  LEAVE_REJECTED: { icon: FileText, color: 'text-red-600 bg-red-100' },
}

export function RecentActivityCard({ activities, className }: RecentActivityCardProps) {
  const hasActivities = activities && activities.length > 0

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="size-4 text-muted-foreground" />
          Activité récente
        </CardTitle>
        <CardDescription>Dernières opérations enregistrées</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {hasActivities ? (
          <div className="relative">
            <div className="absolute left-[17px] top-2 bottom-2 w-px bg-border/60" />
            <div className="space-y-0">
              {activities.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.id} className="flex gap-4 pb-5 last:pb-0 relative">
                    <div className={cn('flex items-center justify-center w-9 h-9 rounded-full shrink-0 z-10', item.colorClass)}>
                      <Icon className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                      <p className="text-[11px] text-muted-foreground/60 mt-1">
                        {item.date} à {item.time}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="size-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Aucune activité récente</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Les actions des utilisateurs apparaîtront ici.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default RecentActivityCard
