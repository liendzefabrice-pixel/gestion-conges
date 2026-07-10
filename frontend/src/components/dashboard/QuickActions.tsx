import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Zap, UserPlus, UserCog, Building2, Calendar } from 'lucide-react'

interface ActionItem {
  icon: typeof UserPlus
  label: string
  description: string
  path: string
  colorClass: string
}

const actions: ActionItem[] = [
  {
    icon: UserPlus,
    label: 'Ajouter un employé',
    description: 'Créer une fiche employé',
    path: '/employees',
    colorClass: 'text-blue-600 bg-blue-100 hover:bg-blue-200',
  },
  {
    icon: UserCog,
    label: 'Créer un utilisateur',
    description: 'Donner un accès à l\'application',
    path: '/users',
    colorClass: 'text-indigo-600 bg-indigo-100 hover:bg-indigo-200',
  },
  {
    icon: Building2,
    label: 'Ajouter un département',
    description: 'Créer un nouveau département',
    path: '/departments',
    colorClass: 'text-emerald-600 bg-emerald-100 hover:bg-emerald-200',
  },
  {
    icon: Calendar,
    label: 'Créer un type de congé',
    description: 'Définir un nouveau type',
    path: '/leave-types',
    colorClass: 'text-purple-600 bg-purple-100 hover:bg-purple-200',
  },
]

export function QuickActions() {
  const navigate = useNavigate()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="size-4 text-muted-foreground" />
          Raccourcis rapides
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/50 bg-white transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 group text-left"
              >
                <div className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors duration-150 ${action.colorClass}`}>
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
