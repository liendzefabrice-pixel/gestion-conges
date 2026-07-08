import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { AlertTriangle, Clock, UserX, Bell } from 'lucide-react'

interface AlertItem {
  icon: typeof AlertTriangle
  colorClass: string
  label: string
  value: string | number
  badge: { label: string; variant: 'warning' | 'danger' | 'info' | 'default' }
}

interface SystemAlertsProps {
  pendingRequests: { leave: number; permission: number; total: number }
  usersCount: number
}

export function SystemAlerts({ pendingRequests, usersCount }: SystemAlertsProps) {
  const alerts: AlertItem[] = [
    {
      icon: Clock,
      colorClass: 'text-amber-600 bg-amber-100',
      label: 'Demandes en attente',
      value: pendingRequests.total,
      badge: pendingRequests.total > 0
        ? { label: `${pendingRequests.leave} congés · ${pendingRequests.permission} permissions`, variant: 'warning' }
        : { label: 'Aucune', variant: 'default' },
    },
    {
      icon: Bell,
      colorClass: 'text-blue-600 bg-blue-100',
      label: 'Notifications importantes',
      value: '—',
      badge: { label: 'À vérifier', variant: 'info' },
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-muted-foreground" />
          Alertes système
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => {
          const Icon = alert.icon
          return (
            <div
              key={alert.label}
              className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-white transition-colors hover:bg-muted/30"
            >
              <div className={`flex items-center justify-center w-9 h-9 rounded-xl shrink-0 ${alert.colorClass}`}>
                <Icon className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{alert.label}</p>
                <p className="text-xs text-muted-foreground">{alert.value}</p>
              </div>
              <Badge variant={alert.badge.variant}>{alert.badge.label}</Badge>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
