import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card'
import { PlusCircle, Calendar, ShieldCheck, ClipboardList, Bell, User } from 'lucide-react'
import { cn } from '../../lib/utils'

interface EmployeeActionItem {
  icon: typeof PlusCircle
  label: string
  description: string
  path: string
  colorClass: string
}

interface EmployeeQuickActionsCardProps {
  className?: string
}

const actions: EmployeeActionItem[] = [
  {
    icon: PlusCircle,
    label: 'Nouvelle demande',
    description: 'Faire une demande',
    path: '/leave',
    colorClass: 'text-blue-600 bg-blue-100 hover:bg-blue-200',
  },
  {
    icon: Calendar,
    label: 'Mes congés',
    description: 'Consulter mes congés',
    path: '/leave',
    colorClass: 'text-emerald-600 bg-emerald-100 hover:bg-emerald-200',
  },
  {
    icon: ShieldCheck,
    label: 'Mes permissions',
    description: 'Voir mes permissions',
    path: '/permissions',
    colorClass: 'text-amber-600 bg-amber-100 hover:bg-amber-200',
  },
  {
    icon: Calendar,
    label: 'Ma programmation',
    description: 'Soumettre ma proposition annuelle',
    path: '/my-campaign',
    colorClass: 'text-purple-600 bg-purple-100 hover:bg-purple-200',
  },
  {
    icon: Bell,
    label: 'Notifications',
    description: 'Mes alertes',
    path: '/notifications',
    colorClass: 'text-rose-600 bg-rose-100 hover:bg-rose-200',
  },
  {
    icon: User,
    label: 'Mon compte',
    description: 'Voir mon profil',
    path: '/account',
    colorClass: 'text-cyan-600 bg-cyan-100 hover:bg-cyan-200',
  },
]

export function EmployeeQuickActionsCard({ className }: EmployeeQuickActionsCardProps) {
  const navigate = useNavigate()

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlusCircle className="size-4 text-muted-foreground" />
          Actions rapides
        </CardTitle>
        <CardDescription>Accès rapide aux fonctionnalités</CardDescription>
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

export default EmployeeQuickActionsCard
