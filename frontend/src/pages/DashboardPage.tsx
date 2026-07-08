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

const colorMap: Record<string, string> = {
  blue: 'bg-blue-600',
  green: 'bg-success',
  purple: 'bg-purple-600',
  indigo: 'bg-primary',
  teal: 'bg-teal-600',
  orange: 'bg-warning',
  red: 'bg-destructive',
  pink: 'bg-pink-600',
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <Card className={`${colorMap[color] || color} text-white border-none shadow-md`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-3xl font-bold">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm opacity-90 font-medium">{label}</p>
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
    return <p className="text-muted-foreground">Chargement...</p>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground tracking-tight mb-8">Tableau de bord</h1>
      {role === 'ADMIN' && <AdminDashboard data={data as DashboardAdmin} />}
      {role === 'HR' && <HrDashboard data={data as DashboardHr} />}
      {role === 'DIRECTOR' && <DirectorDashboard data={data as DashboardDirector} />}
      {role === 'EMPLOYEE' && <EmployeeDashboard data={data as DashboardEmployee} />}
    </div>
  )
}

function AdminDashboard({ data }: { data: DashboardAdmin }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Employés actifs" value={data.employeesCount} color="blue" />
        <StatCard label="Utilisateurs" value={data.usersCount} color="indigo" />
        <StatCard label="Demandes en attente" value={data.leaveRequestsPending} color="orange" />
        <StatCard label="Permissions en attente" value={data.permissionRequestsPending} color="purple" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Demandes par statut</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(data.leaveRequestsByStatus || {}).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{status}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Demandes par département</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(data.requestsByDepartment || {}).map(([dept, count]) => (
                <div key={dept} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{dept}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentActivity?.length > 0 ? (
              <div className="space-y-3">
                {data.recentActivity.map((a: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-primary/40 shrink-0" />
                    <span className="text-muted-foreground">{a.description || a.action || `Action #${i + 1}`}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {a.date ? new Date(a.date).toLocaleDateString() : ''}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune activité récente</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function HrDashboard({ data }: { data: DashboardHr }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Employés" value={data.employeesCount} color="blue" />
        <StatCard label="Congés en attente" value={data.leavePending} color="orange" />
        <StatCard label="Permissions en attente" value={data.permissionPending} color="purple" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {data.leaveByStatus && (
          <Card>
            <CardHeader>
              <CardTitle>Congés par statut</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(data.leaveByStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{status}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        {data.upcomingLeave && (
          <Card>
            <CardHeader>
              <CardTitle>Prochains congés</CardTitle>
            </CardHeader>
            <CardContent>
              {data.upcomingLeave.length > 0 ? (
                <div className="space-y-3">
                  {data.upcomingLeave.map((l: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{l.employeeName || 'N/A'}</span>
                      <span className="text-muted-foreground">{l.date ? new Date(l.date).toLocaleDateString() : ''}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Aucun congé à venir</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function DirectorDashboard({ data }: { data: DashboardDirector }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Employés" value={data.employeesCount} color="blue" />
        <StatCard label="Départements" value={data.departmentsCount} color="green" />
        <StatCard label="Congés approuvés" value={data.leaveApproved} color="indigo" />
        <StatCard label="Congés refusés" value={data.leaveRejected} color="red" />
      </div>
    </div>
  )
}

function EmployeeDashboard({ data }: { data: DashboardEmployee }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Mes congés" value={data.myLeaveCount} color="blue" />
        <StatCard label="En attente" value={data.pendingCount} color="orange" />
        <StatCard label="Approuvés" value={data.approvedCount} color="green" />
        <StatCard label="Refusés" value={data.rejectedCount} color="red" />
      </div>
      {data.upcomingLeave && data.upcomingLeave.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Mes prochains congés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.upcomingLeave.map((l: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{l.leaveTypeName || 'N/A'}</span>
                  <span className="text-muted-foreground">
                    {l.startDate ? `${new Date(l.startDate).toLocaleDateString()} - ${l.endDate ? new Date(l.endDate).toLocaleDateString() : ''}` : ''}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
