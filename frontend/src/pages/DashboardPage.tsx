import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import type {
  DashboardAdmin,
  DashboardHr,
  DashboardDirector,
  DashboardEmployee,
} from '../types'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card'

type DashboardData = DashboardAdmin | DashboardHr | DashboardDirector | DashboardEmployee

function fetchDashboard(): Promise<DashboardData> {
  return api.get('/dashboard').then((res) => res.data)
}

const colors = [
  'bg-blue-600', 'bg-green-600', 'bg-purple-600',
  'bg-indigo-600', 'bg-teal-600', 'bg-orange-600',
  'bg-red-600', 'bg-pink-600',
]

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <Card className={`${color} text-white border-none`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-3xl font-bold">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm opacity-90">{label}</p>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const role = user?.role?.name || ''
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', role],
    queryFn: fetchDashboard,
  })

  if (isLoading) {
    return <p className="text-gray-500">Chargement...</p>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Tableau de bord</h1>
      {role === 'ADMIN' && <AdminDashboard data={data as DashboardAdmin} />}
      {role === 'HR' && <HrDashboard data={data as DashboardHr} />}
      {role === 'DIRECTOR' && <DirectorDashboard data={data as DashboardDirector} />}
      {role === 'EMPLOYEE' && <EmployeeDashboard data={data as DashboardEmployee} />}
    </div>
  )
}

function AdminDashboard({ data }: { data: DashboardAdmin }) {
  if (!data) return null
  const items = [
    { label: 'Utilisateurs', value: data.users, color: colors[0] },
    { label: 'Employés', value: data.employees, color: colors[1] },
    { label: 'Départements', value: data.departments, color: colors[2] },
    { label: 'Services', value: data.services, color: colors[3] },
    { label: 'Types de congés', value: data.leaveTypes, color: colors[4] },
    { label: 'Demandes en attente', value: data.pendingRequests.total, color: colors[5] },
  ]
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {items.map((item, i) => (
        <StatCard key={i} {...item} />
      ))}
    </div>
  )
}

function HrDashboard({ data }: { data: DashboardHr }) {
  if (!data) return null
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard label="Congés à examiner" value={data.toReview.leave} color={colors[0]} />
      <StatCard label="Permissions à examiner" value={data.toReview.permission} color={colors[2]} />
      <StatCard label="Total à examiner" value={data.toReview.total} color={colors[5]} />
      <StatCard label="Congés traités" value={data.totalProcessed.leave} color={colors[1]} />
      <StatCard label="Permissions traitées" value={data.totalProcessed.permission} color={colors[4]} />
    </div>
  )
}

function DirectorDashboard({ data }: { data: DashboardDirector }) {
  if (!data) return null
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard label="Congés à décider" value={data.toDecide.leave} color={colors[0]} />
      <StatCard label="Permissions à décider" value={data.toDecide.permission} color={colors[2]} />
      <StatCard label="Total à décider" value={data.toDecide.total} color={colors[5]} />
      <StatCard label="Approuvés" value={data.decisions.approved} color={colors[1]} />
      <StatCard label="Refusés" value={data.decisions.rejected} color={colors[6]} />
    </div>
  )
}

function EmployeeDashboard({ data }: { data: DashboardEmployee }) {
  if (!data) return null
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard label="Demandes en attente" value={data.pendingRequests.total} color={colors[5]} />
        <StatCard label="Congés" value={data.pendingRequests.leave} color={colors[0]} />
        <StatCard label="Permissions" value={data.pendingRequests.permission} color={colors[2]} />
      </div>
      <h2 className="text-lg font-semibold mb-3">Mes soldes de congés</h2>
      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-sm font-medium text-left">Type</th>
                <th className="p-3 text-sm font-medium text-left">Année</th>
                <th className="p-3 text-sm font-medium text-left">Total</th>
                <th className="p-3 text-sm font-medium text-left">Utilisé</th>
                <th className="p-3 text-sm font-medium text-left">En attente</th>
                <th className="p-3 text-sm font-medium text-left">Restant</th>
              </tr>
            </thead>
            <tbody>
              {data.balances.map((b, i) => (
                <tr key={i} className="border-b">
                  <td className="p-3">{b.type}</td>
                  <td className="p-3">{b.year}</td>
                  <td className="p-3">{b.total}</td>
                  <td className="p-3">{b.used}</td>
                  <td className="p-3">{b.pending}</td>
                  <td className="p-3 font-semibold">{b.remaining}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
