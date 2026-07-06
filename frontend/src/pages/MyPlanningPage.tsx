import { useQuery } from '@tanstack/react-query'
import api from '../services/api'
import type { AnnualLeavePlanning, LeaveEligibility } from '../types'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'

const months = [
  '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  PENDING: { label: 'En attente', variant: 'secondary' },
  RH_REVIEWED: { label: 'Examinée', variant: 'outline' },
  APPROVED: { label: 'Approuvée', variant: 'default' },
  REJECTED: { label: 'Refusée', variant: 'destructive' },
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

  if (loading) return <p className="text-gray-500">Chargement...</p>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Mon planning annuel</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Éligibilité</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {eligibility?.eligible ? (
                <span className="text-green-600">Éligible aux congés</span>
              ) : (
                <span className="text-red-600">Non éligible (moins d'1 an d'ancienneté)</span>
              )}
            </p>
            {eligibility && (
              <p className="text-sm text-gray-500 mt-1">
                Date d'embauche : {new Date(eligibility.hireDate).toLocaleDateString()} —
                Ancienneté : {eligibility.seniorityYears} an{eligibility.seniorityYears > 1 ? 's' : ''}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Mois planifié</CardTitle>
          </CardHeader>
          <CardContent>
            {planning ? (
              <p className="text-lg font-semibold">
                {months[planning.month]} {planning.year}
              </p>
            ) : (
              <p className="text-sm text-gray-500">
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
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-sm font-medium text-left">Type</th>
                  <th className="p-3 text-sm font-medium text-left">Période</th>
                  <th className="p-3 text-sm font-medium text-left">Jours</th>
                  <th className="p-3 text-sm font-medium text-left">Statut</th>
                </tr>
              </thead>
              <tbody>
                {planning.leaveRequests.map((r) => (
                  <tr key={r.id} className="border-b">
                    <td className="p-3">{r.leaveType?.name}</td>
                    <td className="p-3 text-sm">
                      {new Date(r.startDate).toLocaleDateString()} - {new Date(r.endDate).toLocaleDateString()}
                    </td>
                    <td className="p-3">{r.duration}</td>
                    <td className="p-3">
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
