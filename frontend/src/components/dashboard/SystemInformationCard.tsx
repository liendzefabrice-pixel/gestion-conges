import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { CardDescription } from '../ui/card'
import { Badge } from '../ui/badge'
import { Info, Users, Briefcase, Building2, FileText, Bell, LogIn } from 'lucide-react'
import { cn } from '../../lib/utils'

interface SystemInfo {
  totalUsers: number
  totalEmployees: number
  totalDepartments: number
  totalRequests: number
  unreadNotifications: number
}

interface SystemInformationCardProps {
  info: SystemInfo
  lastLogin?: string
  className?: string
}

const infoItems = [
  { key: 'totalUsers', icon: Users, label: 'Utilisateurs', color: 'text-blue-600 bg-blue-100' },
  { key: 'totalEmployees', icon: Briefcase, label: 'Employés', color: 'text-emerald-600 bg-emerald-100' },
  { key: 'totalDepartments', icon: Building2, label: 'Départements', color: 'text-orange-600 bg-orange-100' },
  { key: 'totalRequests', icon: FileText, label: 'Demandes', color: 'text-purple-600 bg-purple-100' },
]

export function SystemInformationCard({ info, lastLogin, className }: SystemInformationCardProps) {
  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="size-4 text-muted-foreground" />
          Informations système
        </CardTitle>
        <CardDescription>État général de la plateforme</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {infoItems.map((item) => {
            const Icon = item.icon
            const value = info[item.key as keyof SystemInfo]
            return (
              <div
                key={item.key}
                className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-white"
              >
                <div className={cn('flex items-center justify-center w-9 h-9 rounded-xl shrink-0', item.color)}>
                  <Icon className="size-4" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground leading-tight">{value}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="space-y-2 pt-2 border-t border-border/50">
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Bell className="size-3.5" />
              <span>Notifications non lues</span>
            </div>
            <span className="text-sm font-medium">{info.unreadNotifications}</span>
          </div>

          {lastLogin && (
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <LogIn className="size-3.5" />
                <span>Dernière connexion</span>
              </div>
              <span className="text-xs text-muted-foreground">{lastLogin}</span>
            </div>
          )}

          <div className="flex items-center justify-between py-2 pt-3 border-t border-border/50">
            <span className="text-sm font-medium text-foreground">Statut du système</span>
            <Badge variant="success" className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block animate-pulse" />
              En fonctionnement
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default SystemInformationCard
