import { useQuery } from '@tanstack/react-query'
import api from '../services/api'
import type { AnnualLeavePlanning, LeaveEligibility, LeaveAccrual } from '../types'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { PageHeader } from '../components/ui/page-header'

const months = [
  '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'secondary' | 'outline' }> = {
  BROUILLON: { label: 'Brouillon', variant: 'default' },
  EN_ATTENTE_RH: { label: 'En attente RH', variant: 'warning' },
  AVIS_RH_RENDU: { label: 'Avis RH rendu', variant: 'info' },
  APPROUVE: { label: 'Approuvée', variant: 'success' },
  REFUSE: { label: 'Refusée', variant: 'danger' },
  ANNULE: { label: 'Annulée', variant: 'outline' },
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

  const { data: accrual, isLoading: accrualLoading } = useQuery<LeaveAccrual>({
    queryKey: ['leave-accrual'],
    queryFn: () => api.get('/leave-accrual').then((r) => r.data),
    retry: false,
  })

  const loading = planningLoading || eligibilityLoading

  if (loading) return <p className="text-muted-foreground">Chargement...</p>

  return (
    <div>
      <PageHeader
        title="Mon planning annuel"
        description="Consultez votre éligibilité et vos droits à congés"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Droits acquis</CardTitle>
          </CardHeader>
          <CardContent>
            {accrualLoading ? (
              <p className="text-sm text-muted-foreground">Chargement...</p>
            ) : accrual ? (
              <>
                <p className="text-lg font-semibold">
                  {accrual.daysAccrued} jour{accrual.daysAccrued > 1 ? 's' : ''} acquis
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {accrual.seniorityLabel} d'ancienneté — Année de référence {accrual.referenceYear}
                </p>
                {accrual.canTakeLeave ? (
                  <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl p-3 mt-2">
                    Vous pouvez poser un congé annuel
                  </p>
                ) : accrual.message && (
                  <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3 mt-2">
                    {accrual.message}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Indisponible</p>
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
