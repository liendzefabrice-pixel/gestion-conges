import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card'
import { FileText, Calendar, ShieldCheck, Building2, Bell, ClipboardList } from 'lucide-react'
import { cn } from '../../lib/utils'

interface DirectorActionItem {
  icon: typeof FileText
  label: string
  description: string
  path: string
  colorClass: string
}

interface DirectorQuickActionsCardProps {
  className?: string
}

const actions: DirectorActionItem[] = [
  {
    icon: FileText,
    label: 'Consulter les demandes',
    description: 'Valider ou refuser',
    path: '/leave',
    colorClass: 'text-blue-600 bg-blue-100 hover:bg-blue-200',
  },
  {
    icon: Calendar,
    label: 'Voir les congés',
    description: 'Calendrier des absences',
    path: '/leave',
    colorClass: 'text-emerald-600 bg-emerald-100 hover:bg-emerald-200',
  },
  {
    icon: ShieldCheck,
    label: 'Voir les permissions',
    description: 'Autorisations en cours',
    path: '/permissions',
    colorClass: 'text-amber-600 bg-amber-100 hover:bg-amber-200',
  },
  {
    icon: Building2,
    label: 'Consulter les départements',
    description: 'Liste des services',
    path: '/departments',
    colorClass: 'text-purple-600 bg-purple-100 hover:bg-purple-200',
  },
  {
    icon: Bell,
    label: 'Consulter les notifications',
    description: 'Mes alertes',
    path: '/notifications',
    colorClass: 'text-rose-600 bg-rose-100 hover:bg-rose-200',
  },
  {
    icon: ClipboardList,
    label: 'Voir les campagnes',
    description: 'Consulter les programmations',
    path: '/leave-campaigns',
    colorClass: 'text-cyan-600 bg-cyan-100 hover:bg-cyan-200',
  },
]

export function DirectorQuickActionsCard({ className }: DirectorQuickActionsCardProps) {
  const navigate = useNavigate()

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="size-4 text-muted-foreground" />
          Actions rapides
        </CardTitle>
        <CardDescription>Accès direct aux fonctionnalités</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/50 bg-white transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 group text-left"
              >
                <div className={cn('flex items-center justify-center w-10 h-10 rounded-xl transition-colors duration-150', action.colorClass)}>
                  <Icon className="size-5" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    {action.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                </div>
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export default DirectorQuickActionsCard
