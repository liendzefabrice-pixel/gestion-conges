import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { CardDescription } from '../ui/card'
import { Badge } from '../ui/badge'
import { AlertTriangle, Bell, UserX, Calendar, CheckCircle } from 'lucide-react'
import { cn } from '../../lib/utils'

interface AlertItem {
  id: string | number
  icon: typeof AlertTriangle
  colorClass: string
  title: string
  description: string
  count: number
}

interface SystemAlertsCardProps {
  alerts?: AlertItem[]
  className?: string
}

export function SystemAlertsCard({ alerts, className }: SystemAlertsCardProps) {
  const hasAlerts = alerts && alerts.length > 0

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-muted-foreground" />
          Alertes système
        </CardTitle>
        <CardDescription>Éléments nécessitant votre attention</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {hasAlerts ? (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const Icon = alert.icon
              return (
                <div
                  key={alert.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-white transition-colors hover:bg-muted/30"
                >
                  <div className={cn('flex items-center justify-center w-9 h-9 rounded-xl shrink-0', alert.colorClass)}>
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{alert.title}</p>
                    <p className="text-xs text-muted-foreground">{alert.description}</p>
                  </div>
                  <Badge variant="danger" className="shrink-0">{alert.count}</Badge>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 mb-3">
              <CheckCircle className="size-6 text-emerald-600" />
            </div>
            <p className="text-sm text-muted-foreground">Tout fonctionne correctement</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Aucune alerte nécessitant votre attention.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default SystemAlertsCard
