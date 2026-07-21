import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { CardDescription } from '../ui/card'
import { UserPlus, Users, Building2, Calendar, CalendarCheck, ClipboardList, FileText } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ActionItem {
  icon: typeof UserPlus
  label: string
  description: string
  path: string
  colorClass: string
}

interface QuickActionsCardProps {
  className?: string
}

const defaultActions: ActionItem[] = [
  {
    icon: UserPlus,
    label: 'Créer un utilisateur',
    description: 'Donner un accès à l\'application',
    path: '/users',
    colorClass: 'text-blue-600 bg-blue-100 hover:bg-blue-200',
  },
  {
    icon: Users,
    label: 'Ajouter un employé',
    description: 'Créer une fiche employé',
    path: '/employees',
    colorClass: 'text-emerald-600 bg-emerald-100 hover:bg-emerald-200',
  },
  {
    icon: Building2,
    label: 'Créer un département',
    description: 'Ajouter un service',
    path: '/departments',
    colorClass: 'text-orange-600 bg-orange-100 hover:bg-orange-200',
  },
  {
    icon: Calendar,
    label: 'Créer un type de congé',
    description: 'Définir un nouveau type',
    path: '/leave-types',
    colorClass: 'text-purple-600 bg-purple-100 hover:bg-purple-200',
  },
  {
    icon: ClipboardList,
    label: 'Campagnes de congés',
    description: 'Gérer les campagnes annuelles',
    path: '/leave-campaigns',
    colorClass: 'text-cyan-600 bg-cyan-100 hover:bg-cyan-200',
  },
  {
    icon: FileText,
    label: 'Voir les demandes',
    description: 'Consulter les requêtes',
    path: '/leave',
    colorClass: 'text-rose-600 bg-rose-100 hover:bg-rose-200',
  },
]

export function QuickActionsCard({ className }: QuickActionsCardProps) {
  const navigate = useNavigate()

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarCheck className="size-4 text-muted-foreground" />
          Actions rapides
        </CardTitle>
        <CardDescription>Accès rapide aux fonctionnalités principales</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="grid grid-cols-2 gap-3">
          {defaultActions.map((action) => {
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

export default QuickActionsCard
