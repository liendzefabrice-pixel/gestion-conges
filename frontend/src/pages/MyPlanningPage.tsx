import { useQuery } from '@tanstack/react-query'
import api from '../services/api'
import type { AnnualLeavePlanning, LeaveEligibility } from '../types'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { PageHeader } from '../components/ui/page-header'

const months = [
  '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' }> = {
  PENDING: { label: 'En attente', variant: 'warning' },
  RH_REVIEWED: { label: 'Examinée', variant: 'info' },
  APPROVED: { label: 'Approuvée', variant: 'success' },
  REJECTED: { label: 'Refusée', variant: 'danger' },
}

export default function MyPlanningPage() {
  const { data: planning, isLoading: planningLoading } = useQuery<AnnualLeavePlanning | null>({
    queryKey: ['my-planning'],
    queryFn: () => api.get('/leave-planning/my').then((r) => r.data),
  })

  const { data: eligibility, isLoading: eligibilityLoading } = useQuery<LeaveEligibility>({
    queryKey: ['leave-eligibility'],
    queryFn: () => api.get('/leave-planning/eligibility').then((r) => r.data),
  })

  const loading = planningLoading || eligibilityLoading

  if (loading) return <p className="text-muted-foreground">Chargement...</p>

  return (
    <div>
      <PageHeader
        title="Mon planning annuel"
        description="Consultez votre éligibilité et votre planning de congés"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Éligibilité</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {eligibility?.eligible ? (
                <span className="text-success">Éligible aux congés</span>
              ) : (
                <span className="text-destructive">Non éligible (moins d'1 an d'ancienneté)</span>
              )}
            </p>
            {eligibility && (
              <p className="text-sm text-muted-foreground mt-1">
                Date d'embauche : {new Date(eligibility.hireDate).toLocaleDateString()} —
                Ancienneté : {eligibility.seniorityYears} an{eligibility.seniorityYears > 1 ? 's' : ''}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Mois planifié</CardTitle>
          </CardHeader>
          <CardContent>
            {planning ? (
              <p className="text-lg font-semibold">
                {months[planning.month]} {planning.year}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucune planification pour cette année. Veuillez contacter le RH.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {planning && planning.leaveRequests && planning.leaveRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Demandes associées</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/50">
                  <th className="h-11 px-5 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Type</th>
                  <th className="h-11 px-5 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Période</th>
                  <th className="h-11 px-5 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Jours</th>
                  <th className="h-11 px-5 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Statut</th>
                </tr>
              </thead>
              <tbody>
                {planning.leaveRequests.map((r: any) => (
                  <tr key={r.id} className="border-b border-border/30 transition-colors duration-150 hover:bg-muted/40">
                    <td className="p-4 px-5">{r.leaveType?.name}</td>
                    <td className="p-4 px-5 text-sm">
                      {new Date(r.startDate).toLocaleDateString()} - {new Date(r.endDate).toLocaleDateString()}
                    </td>
                    <td className="p-4 px-5">{r.duration}</td>
                    <td className="p-4 px-5">
                      <Badge variant={statusConfig[r.status]?.variant}>
                        {statusConfig[r.status]?.label}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
