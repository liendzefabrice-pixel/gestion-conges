import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import type {
  DashboardAdmin,
  DashboardHr,
  DashboardDirector,
  DashboardEmployee,
  User,
  LeaveRequest,
} from '../types'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { PageHeader } from '../components/ui/page-header'
import { KpiCard } from '../components/dashboard/KpiCard'
import { DonutChart } from '../components/dashboard/DonutChart'
import { MonthlyChart } from '../components/dashboard/MonthlyChart'
import { RecentActivity } from '../components/dashboard/RecentActivity'
import { RecentUsersTable } from '../components/dashboard/RecentUsersTable'
import { QuickActions } from '../components/dashboard/QuickActions'
import { SystemAlerts } from '../components/dashboard/SystemAlerts'
import { Button } from '../components/ui/button'
import {
  Users,
  Briefcase,
  Building2,
  Clock,
  CalendarDays,
  Plus,
} from 'lucide-react'

type DashboardData = DashboardAdmin | DashboardHr | DashboardDirector | DashboardEmployee

function fetchDashboard(): Promise<DashboardData> {
  return api.get('/dashboard').then((res) => res.data)
}

function formatDate(): string {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const monthsShort = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

function computeMonthlyChart(requests: LeaveRequest[]): { month: string; requests: number }[] {
  const counts = new Array(12).fill(0)
  const now = new Date()
  const currentMonth = now.getMonth()
  for (const r of requests) {
    const d = new Date(r.startDate)
    const month = d.getMonth()
    counts[month]++
  }
  return counts.map((count, i) => ({
    month: monthsShort[i],
    requests: count,
  }))
}

function computeStatusDonut(requests: LeaveRequest[]): { name: string; value: number; color: string }[] {
  const pending = requests.filter((r) => r.status === 'PENDING' || r.status === 'RH_REVIEWED').length
  const approved = requests.filter((r) => r.status === 'APPROVED').length
  const rejected = requests.filter((r) => r.status === 'REJECTED').length
  return [
    { name: 'En attente', value: pending, color: '#F59E0B' },
    { name: 'Approuvées', value: approved, color: '#16A34A' },
    { name: 'Refusées', value: rejected, color: '#DC2626' },
  ]
}

export default function DashboardPage() {
  const { user } = useAuth()
  const role = user?.role?.name || ''
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', role],
    queryFn: fetchDashboard,
  })

  const { data: leaveRequests = [] } = useQuery<LeaveRequest[]>({
    queryKey: ['leave-requests', role],
    queryFn: () => api.get('/leave/requests').then((r) => r.data),
    enabled: role === 'ADMIN',
  })

  const { data: users = [] } = useQuery<(User & { createdAt: string; isActive: boolean })[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data),
    enabled: role === 'ADMIN',
  })

  if (isLoading) {
    return <p className="text-muted-foreground">Chargement...</p>
  }

  return (
    <div className="space-y-6">
      {role === 'ADMIN' && (
        <AdminDashboard
          data={data as DashboardAdmin}
          leaveRequests={leaveRequests}
          users={users}
        />
      )}
      {role === 'HR' && <HrDashboard data={data as DashboardHr} />}
      {role === 'DIRECTOR' && <DirectorDashboard data={data as DashboardDirector} />}
      {role === 'EMPLOYEE' && <EmployeeDashboard data={data as DashboardEmployee} />}
    </div>
  )
}

/* ───── Admin Dashboard ───── */
function AdminDashboard({
  data,
  leaveRequests,
  users,
}: {
  data: DashboardAdmin
  leaveRequests: LeaveRequest[]
  users: (User & { createdAt: string; isActive: boolean })[]
}) {
  const monthlyData = computeMonthlyChart(leaveRequests)
  const statusData = computeStatusDonut(leaveRequests)

  return (
    <div className="space-y-6">
      {/* Section 1: Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Bonjour, Administrateur 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Voici un aperçu de l'activité de votre plateforme.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm text-muted-foreground hidden md:block capitalize">
            {formatDate()}
          </span>
          <Button>
            <Plus className="size-4" />
            Nouveau
          </Button>
        </div>
      </div>

      {/* Section 2: KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <KpiCard
          icon={<Briefcase className="size-5" />}
          label="Employés"
          value={data.employees}
          colorClass="blue"
          evolution="Actifs"
        />
        <KpiCard
          icon={<Users className="size-5" />}
          label="Utilisateurs"
          value={data.users}
          colorClass="indigo"
          evolution="Inscrits"
        />
        <KpiCard
          icon={<Building2 className="size-5" />}
          label="Départements"
          value={data.departments}
          colorClass="emerald"
        />
        <KpiCard
          icon={<Clock className="size-5" />}
          label="Demandes en attente"
          value={data.pendingRequests.total}
          colorClass="amber"
          evolution={`${data.pendingRequests.leave} congés · ${data.pendingRequests.permission} permissions`}
        />
        <KpiCard
          icon={<CalendarDays className="size-5" />}
          label="Types de congés"
          value={data.leaveTypes}
          colorClass="purple"
        />
      </div>

      {/* Section 3: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DonutChart data={statusData} />
        <MonthlyChart data={monthlyData} />
      </div>

      {/* Section 4 & 5: Activity + Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RecentActivity activities={[]} />
        <RecentUsersTable users={users} />
      </div>

      {/* Section 6: Quick Actions */}
      <QuickActions />

      {/* Section 7: System Alerts */}
      <SystemAlerts pendingRequests={data.pendingRequests} usersCount={data.users} />
    </div>
  )
}

/* ───── HR Dashboard ───── */
const colorMap: Record<string, string> = {
  blue: 'from-blue-500/10 to-blue-500/5 border-blue-200/50 [&_.icon-wrap]:bg-blue-500/10 [&_.icon-wrap_svg]:text-blue-600',
  emerald: 'from-emerald-500/10 to-emerald-500/5 border-emerald-200/50 [&_.icon-wrap]:bg-emerald-500/10 [&_.icon-wrap_svg]:text-emerald-600',
  amber: 'from-amber-500/10 to-amber-500/5 border-amber-200/50 [&_.icon-wrap]:bg-amber-500/10 [&_.icon-wrap_svg]:text-amber-600',
  purple: 'from-purple-500/10 to-purple-500/5 border-purple-200/50 [&_.icon-wrap]:bg-purple-500/10 [&_.icon-wrap_svg]:text-purple-600',
}

function MiniStat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-4 ${colorMap[color] || colorMap.blue}`}>
      <div className="icon-wrap flex items-center justify-center w-9 h-9 rounded-xl mb-2">
        {icon}
      </div>
      <p className="text-xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  )
}

function HrDashboard({ data }: { data: DashboardHr }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground tracking-tight">
        Tableau de bord RH
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MiniStat
          icon={<Clock className="size-5" />}
          label="À examiner"
          value={data.toReview.total}
          color="amber"
        />
        <MiniStat
          icon={<Briefcase className="size-5" />}
          label="Total traité"
          value={data.totalProcessed.leave + data.totalProcessed.permission}
          color="blue"
        />
        <MiniStat
          icon={<CalendarDays className="size-5" />}
          label="Planification"
          value={`${data.planning.withPlanning}/${data.planning.totalEmployees}`}
          color="emerald"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Planification annuelle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-muted/50">
                <span className="text-sm text-muted-foreground">Employés planifiés</span>
                <span className="font-semibold">{data.planning.withPlanning}</span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-muted/50">
                <span className="text-sm text-muted-foreground">Non planifiés</span>
                <span className="font-semibold">{data.planning.withoutPlanning}</span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-muted/50">
                <span className="text-sm text-muted-foreground">Total employés</span>
                <span className="font-semibold">{data.planning.totalEmployees}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>À traiter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-muted/50">
                <span className="text-sm text-muted-foreground">Congés</span>
                <Badge variant="warning">{data.toReview.leave}</Badge>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-muted/50">
                <span className="text-sm text-muted-foreground">Permissions</span>
                <Badge variant="warning">{data.toReview.permission}</Badge>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-muted/50">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="font-semibold">{data.toReview.total}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/* ───── Director Dashboard ───── */
function DirectorDashboard({ data }: { data: DashboardDirector }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground tracking-tight">
        Tableau de bord Directeur
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniStat
          icon={<Clock className="size-5" />}
          label="À décider"
          value={data.toDecide.total}
          color="amber"
        />
        <MiniStat
          icon={<Briefcase className="size-5" />}
          label="Congés à décider"
          value={data.toDecide.leave}
          color="blue"
        />
        <MiniStat
          icon={<CalendarDays className="size-5" />}
          label="Permissions à décider"
          value={data.toDecide.permission}
          color="purple"
        />
        <MiniStat
          icon={<Building2 className="size-5" />}
          label="Décisions rendues"
          value={data.decisions.approved + data.decisions.rejected}
          color="emerald"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Décisions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-muted/50">
                <span className="text-sm font-medium text-emerald-600">Approuvées</span>
                <span className="font-semibold">{data.decisions.approved}</span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-muted/50">
                <span className="text-sm font-medium text-red-600">Refusées</span>
                <span className="font-semibold">{data.decisions.rejected}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/* ───── Employee Dashboard ───── */
function EmployeeDashboard({ data }: { data: DashboardEmployee }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground tracking-tight">
        Mon tableau de bord
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniStat
          icon={<Briefcase className="size-5" />}
          label="Mes demandes"
          value={data.pendingRequests.total}
          color="blue"
        />
        <MiniStat
          icon={<Clock className="size-5" />}
          label="En attente"
          value={data.pendingRequests.leave + data.pendingRequests.permission}
          color="amber"
        />
        <MiniStat
          icon={<CalendarDays className="size-5" />}
          label="Éligible"
          value={data.eligibleForLeave ? 'Oui' : 'Non'}
          color="emerald"
        />
        <MiniStat
          icon={<Building2 className="size-5" />}
          label="Soldes"
          value={data.balances.length}
          color="purple"
        />
      </div>

      {data.balances.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Soldes de congés</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className="divide-y divide-border/50">
              {data.balances.map((b, i) => (
                <div key={i} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{b.type}</p>
                    <p className="text-xs text-muted-foreground">{b.year}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Utilisé</p>
                      <p className="text-sm font-medium">{b.used}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Restant</p>
                      <p className="text-sm font-bold text-foreground">{b.remaining}</p>
                    </div>
                    <div className="w-24">
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${b.total > 0 ? ((b.used + b.pending) / b.total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.planning && (
        <Card>
          <CardHeader>
            <CardTitle>Mois planifié</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {monthsShort[data.planning.month - 1] || ''} {data.planning.year}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
