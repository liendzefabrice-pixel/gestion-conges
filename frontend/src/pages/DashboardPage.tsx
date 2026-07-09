import { useState, useEffect } from 'react'
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
  CardDescription,
} from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { PageHeader } from '../components/ui/page-header'
import { AdminKpiCard } from '../components/dashboard/AdminKpiCard'
import { DashboardChartCard } from '../components/dashboard/DashboardChartCard'
import { DashboardDonutChart } from '../components/dashboard/DashboardDonutChart'
import { DashboardLineChart } from '../components/dashboard/DashboardLineChart'
import { DashboardBarChart } from '../components/dashboard/DashboardBarChart'
import { DashboardPieChart } from '../components/dashboard/DashboardPieChart'
import { DashboardAreaChart } from '../components/dashboard/DashboardAreaChart'
import { RecentActivityCard } from '../components/dashboard/RecentActivityCard'
import { RecentRequestsCard } from '../components/dashboard/RecentRequestsCard'
import { UpcomingEventsCard } from '../components/dashboard/UpcomingEventsCard'
import { SystemAlertsCard } from '../components/dashboard/SystemAlertsCard'
import { QuickActionsCard } from '../components/dashboard/QuickActionsCard'
import { HrQuickActionsCard } from '../components/dashboard/HrQuickActionsCard'
import { SystemInformationCard } from '../components/dashboard/SystemInformationCard'
import { DonutChart } from '../components/dashboard/DonutChart'
import { MonthlyChart } from '../components/dashboard/MonthlyChart'
import { RecentActivity } from '../components/dashboard/RecentActivity'
import { RecentUsersTable } from '../components/dashboard/RecentUsersTable'
import { QuickActions } from '../components/dashboard/QuickActions'
import { SystemAlerts } from '../components/dashboard/SystemAlerts'
import { Button } from '../components/ui/button'
import {
  Users,
  BadgeCheck,
  Briefcase,
  Building2,
  Clock,
  CalendarDays,
  Calendar,
  Plus,
  UserPlus,
  UserCog,
  Settings,
  CheckCircle,
  FileText,
  UserX,
  AlertTriangle,
  Bell,
  ClipboardList,
  CalendarCheck,
  ShieldCheck,
  CalendarRange,
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
  const [now, setNow] = useState(new Date())
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    api.get('/notifications/unread/count').then((res) => {
      setUnreadCount(res.data.count ?? res.data ?? 0)
    }).catch(() => {})
  }, [])

  const formattedDate = now.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const formattedTime = now.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

  const roleColors: Record<string, string> = {
    ADMIN: '#3B82F6',
    HR: '#F59E0B',
    DIRECTOR: '#8B5CF6',
    EMPLOYEE: '#10B981',
  }

  const statusLabels: Record<string, string> = {
    PENDING: 'En attente',
    RH_REVIEWED: 'Examiné (RH)',
    APPROVED: 'Validé',
    REJECTED: 'Refusé',
  }

  const statusColors: Record<string, string> = {
    PENDING: '#F59E0B',
    RH_REVIEWED: '#3B82F6',
    APPROVED: '#10B981',
    REJECTED: '#EF4444',
  }

  const roleCounts: Record<string, number> = {}
  users.forEach((u) => {
    const name = u.role?.name || 'INCONNU'
    roleCounts[name] = (roleCounts[name] || 0) + 1
  })
  const userRoleData = Object.entries(roleCounts).map(([name, value]) => ({
    name,
    value: value as number,
    color: roleColors[name] || '#6B7280',
  }))

  const monthlyCounts = new Array(12).fill(0)
  leaveRequests.forEach((r) => {
    const d = new Date(r.startDate)
    monthlyCounts[d.getMonth()]++
  })
  const monthlyData = months.map((month, i) => ({
    month,
    demandes: monthlyCounts[i] as number,
  }))

  const statusCounts: Record<string, number> = { PENDING: 0, RH_REVIEWED: 0, APPROVED: 0, REJECTED: 0 }
  leaveRequests.forEach((r) => {
    if (r.status in statusCounts) statusCounts[r.status]++
  })
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({
    name: statusLabels[name] || name,
    value: value as number,
    color: statusColors[name] || '#6B7280',
  }))

  const typeCounts: Record<string, number> = {}
  leaveRequests.forEach((r) => {
    const name = r.leaveType?.name || 'Inconnu'
    typeCounts[name] = (typeCounts[name] || 0) + 1
  })
  const leaveTypeData = Object.entries(typeCounts).map(([name, value]) => ({
    name,
    demandes: value as number,
  }))

  const userMonthlyCounts = new Array(12).fill(0)
  users.forEach((u) => {
    const d = new Date(u.createdAt)
    userMonthlyCounts[d.getMonth()]++
  })
  const userCreationData = months.map((month, i) => ({
    month,
    créations: userMonthlyCounts[i] as number,
  }))

  const inactiveCount = users.filter((u) => !u.isActive).length
  const hasLeaveData = leaveRequests.length > 0
  const hasUserData = users.length > 0

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Bonjour, Administrateur 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bienvenue sur votre espace d'administration.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5 shrink-0" />
            <span className="capitalize">{formattedDate}</span>
            <span className="text-gray-300">|</span>
            <Clock className="size-3.5 shrink-0" />
            <span>{formattedTime}</span>
          </div>
          <Button>
            <Plus className="size-4" />
            Nouvelle action
          </Button>
        </div>
      </div>

      {/* 2. KPI Zone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <AdminKpiCard
          icon={<Users className="size-5" />}
          title="Utilisateurs"
          value={data.users}
          subtitle="Comptes enregistrés"
          color="blue"
          evolution="+0%"
        />
        <AdminKpiCard
          icon={<BadgeCheck className="size-5" />}
          title="Employés"
          value={data.employees}
          subtitle="Employés actifs"
          color="emerald"
          evolution="+0%"
        />
        <AdminKpiCard
          icon={<Building2 className="size-5" />}
          title="Départements"
          value={data.departments}
          subtitle="Services enregistrés"
          color="orange"
          evolution="+0%"
        />
        <AdminKpiCard
          icon={<Clock className="size-5" />}
          title="Demandes en attente"
          value={data.pendingRequests.total}
          subtitle="À traiter"
          color="red"
          evolution={`${data.pendingRequests.leave} congés · ${data.pendingRequests.permission} permissions`}
        />
        <AdminKpiCard
          icon={<CalendarDays className="size-5" />}
          title="Types de congés"
          value={data.leaveTypes}
          subtitle="Configurés"
          color="purple"
          evolution="+0%"
        />
      </div>

      {/* 3. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DashboardChartCard title="Répartition des utilisateurs" subtitle="Par rôle">
          {hasUserData ? (
            <DashboardDonutChart data={userRoleData} />
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <Users className="size-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
            </div>
          )}
        </DashboardChartCard>

        <DashboardChartCard title="Évolution des demandes" subtitle="Par mois">
          {hasLeaveData ? (
            <DashboardLineChart data={monthlyData} dataKey="demandes" xAxisKey="month" color="#3B82F6" />
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <Clock className="size-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
            </div>
          )}
        </DashboardChartCard>

        <DashboardChartCard title="Demandes par département" subtitle="Répartition par service">
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Building2 className="size-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Les données par département seront bientôt disponibles.
            </p>
          </div>
        </DashboardChartCard>

        <DashboardChartCard title="Statut des demandes" subtitle="En attente / Validées / Refusées">
          {hasLeaveData ? (
            <DashboardPieChart data={statusData} />
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <Clock className="size-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
            </div>
          )}
        </DashboardChartCard>

        <DashboardChartCard title="Répartition des types de congés" subtitle="Par type">
          {hasLeaveData ? (
            <DashboardBarChart data={leaveTypeData} dataKey="demandes" xAxisKey="name" color="#8B5CF6" layout="horizontal" />
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <CalendarDays className="size-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
            </div>
          )}
        </DashboardChartCard>

        <DashboardChartCard title="Création des utilisateurs" subtitle="Comptes créés par mois">
          {hasUserData ? (
            <DashboardAreaChart data={userCreationData} dataKey="créations" xAxisKey="month" color="#F59E0B" />
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <Users className="size-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
            </div>
          )}
        </DashboardChartCard>
      </div>

      {/* 4. Info & Actions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RecentActivityCard
          activities={[
            ...leaveRequests.slice(0, 5).map((r) => {
              const d = new Date(r.createdAt || r.startDate)
              return {
                id: `leave-${r.id}`,
                icon: r.status === 'APPROVED' ? CheckCircle : r.status === 'REJECTED' ? FileText : Calendar,
                colorClass: r.status === 'APPROVED'
                  ? 'text-emerald-600 bg-emerald-100'
                  : r.status === 'REJECTED'
                    ? 'text-red-600 bg-red-100'
                    : 'text-amber-600 bg-amber-100',
                title: r.status === 'APPROVED'
                  ? 'Demande de congé validée'
                  : r.status === 'REJECTED'
                    ? 'Demande de congé refusée'
                    : 'Demande de congé déposée',
                description: `Par ${r.employee?.user?.email || 'un collaborateur'}`,
                date: d.toLocaleDateString('fr-FR'),
                time: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
              }
            }),
            ...users.slice(0, 3).map((u) => {
              const d = new Date(u.createdAt)
              return {
                id: `user-${u.id}`,
                icon: UserPlus,
                colorClass: 'text-blue-600 bg-blue-100',
                title: 'Utilisateur créé',
                description: u.email,
                date: d.toLocaleDateString('fr-FR'),
                time: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
              }
            }),
          ].sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`)).slice(0, 6)}
        />

        <SystemAlertsCard
          alerts={[
            data.pendingRequests.total > 0 && {
              id: 'pending-requests',
              icon: AlertTriangle,
              colorClass: 'text-amber-600 bg-amber-100',
              title: 'Demandes en attente',
              description: 'Nécessitent une validation',
              count: data.pendingRequests.total,
            },
            inactiveCount > 0 && {
              id: 'inactive-users',
              icon: UserX,
              colorClass: 'text-red-600 bg-red-100',
              title: 'Utilisateurs désactivés',
              description: 'Comptes inactifs sur la plateforme',
              count: inactiveCount,
            },
            unreadCount > 0 && {
              id: 'unread-notifications',
              icon: Bell,
              colorClass: 'text-blue-600 bg-blue-100',
              title: 'Notifications non lues',
              description: 'Messages en attente de lecture',
              count: unreadCount,
            },
          ].filter(Boolean) as any[]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <QuickActionsCard />

        <SystemInformationCard
          info={{
            totalUsers: data.users,
            totalEmployees: data.employees,
            totalDepartments: data.departments,
            totalRequests: leaveRequests.length,
            unreadNotifications: unreadCount,
          }}
          lastLogin={formattedDate}
        />
      </div>
    </div>
  )
}

/* ───── HR Dashboard ───── */
function HrDashboard({ data }: { data: DashboardHr }) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const formattedDate = now.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const formattedTime = now.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Bonjour, Responsable RH 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Voici un aperçu de l'activité des ressources humaines.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5 shrink-0" />
            <span className="capitalize">{formattedDate}</span>
            <span className="text-gray-300">|</span>
            <Clock className="size-3.5 shrink-0" />
            <span>{formattedTime}</span>
          </div>
          <Button>
            <Plus className="size-4" />
            Nouveau dossier
          </Button>
        </div>
      </div>

      {/* 2. KPI Zone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <AdminKpiCard
          icon={<Users className="size-5" />}
          title="Employés"
          value={data.planning.totalEmployees}
          subtitle="Employés enregistrés"
          color="blue"
          evolution="+0%"
        />
        <AdminKpiCard
          icon={<Clock className="size-5" />}
          title="Demandes en attente"
          value={data.toReview.total}
          subtitle="À analyser"
          color="amber"
          evolution={`${data.toReview.leave} congés · ${data.toReview.permission} permissions`}
        />
        <AdminKpiCard
          icon={<CalendarCheck className="size-5" />}
          title="Congés approuvés"
          value={data.totalProcessed.leave}
          subtitle="Depuis le début de l'année"
          color="emerald"
          evolution="+0%"
        />
        <AdminKpiCard
          icon={<ShieldCheck className="size-5" />}
          title="Permissions"
          value={data.totalProcessed.permission}
          subtitle="Demandes de permission"
          color="purple"
          evolution="+0%"
        />
        <AdminKpiCard
          icon={<CalendarRange className="size-5" />}
          title="Planning annuel"
          value={data.planning.withPlanning}
          subtitle="Congés annuels programmés"
          color="cyan"
          evolution={`${data.planning.totalEmployees} employés`}
        />
        <AdminKpiCard
          icon={<AlertTriangle className="size-5" />}
          title="Employés à planifier"
          value={data.planning.withoutPlanning}
          subtitle="Action requise"
          color="red"
          evolution="+0%"
        />
      </div>

      {/* 3. Statistics Zone */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DashboardChartCard title="Évolution des demandes" subtitle="Par mois">
          <div className="flex flex-col items-center justify-center h-48 text-center px-4">
            <Calendar className="size-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Aucune donnée mensuelle</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              L'évolution des congés et permissions par mois apparaîtra ici.
            </p>
          </div>
        </DashboardChartCard>

        <DashboardChartCard title="Répartition des demandes" subtitle="En attente et traitées">
          <div className="pt-2">
            <DashboardDonutChart
              data={[
                { name: 'Congés en attente', value: data.toReview.leave, color: '#F59E0B' },
                { name: 'Permissions en attente', value: data.toReview.permission, color: '#F97316' },
                { name: 'Congés traités', value: Math.max(0, data.totalProcessed.leave - data.toReview.leave), color: '#10B981' },
                { name: 'Permissions traitées', value: Math.max(0, data.totalProcessed.permission - data.toReview.permission), color: '#3B82F6' },
              ].filter((d) => d.value > 0)}
            />
          </div>
        </DashboardChartCard>

        <DashboardChartCard title="Demandes par département" subtitle="Par service">
          <div className="flex flex-col items-center justify-center h-48 text-center px-4">
            <Building2 className="size-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              La répartition par département apparaîtra ici.
            </p>
          </div>
        </DashboardChartCard>

        <DashboardChartCard title="Planning annuel des congés" subtitle="Taux de planification">
          <div className="pt-2">
            <DashboardBarChart
              data={[
                { name: 'Planifiés', value: data.planning.withPlanning },
                { name: 'Non planifiés', value: data.planning.withoutPlanning },
              ]}
              dataKey="value"
              xAxisKey="name"
              layout="horizontal"
              color="#10B981"
            />
          </div>
        </DashboardChartCard>

        <DashboardChartCard title="Répartition des types de congés" subtitle="Par catégorie">
          <div className="flex flex-col items-center justify-center h-48 text-center px-4">
            <CalendarDays className="size-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Les types de congés et leur répartition apparaîtront ici.
            </p>
          </div>
        </DashboardChartCard>

        <DashboardChartCard title="Congés vs Permissions" subtitle="Évolution mensuelle">
          <div className="flex flex-col items-center justify-center h-48 text-center px-4">
            <FileText className="size-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              La comparaison mensuelle des congés et permissions apparaîtra ici.
            </p>
          </div>
        </DashboardChartCard>
      </div>

      {/* 4. Info & Actions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RecentRequestsCard />

        <SystemAlertsCard
          alerts={[
            data.toReview.total > 0 && {
              id: 'to-review',
              icon: AlertTriangle,
              colorClass: 'text-amber-600 bg-amber-100',
              title: 'Demandes à examiner',
              description: 'Congés et permissions en attente',
              count: data.toReview.total,
            },
            data.planning.withoutPlanning > 0 && {
              id: 'without-planning',
              icon: CalendarDays,
              colorClass: 'text-blue-600 bg-blue-100',
              title: 'Employés non planifiés',
              description: 'Sans planning annuel',
              count: data.planning.withoutPlanning,
            },
            data.planning.totalEmployees > 0 && {
              id: 'total-employees',
              icon: Users,
              colorClass: 'text-emerald-600 bg-emerald-100',
              title: 'Effectif total',
              description: 'Employés enregistrés',
              count: data.planning.totalEmployees,
            },
          ].filter(Boolean) as any[]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HrQuickActionsCard />
        <UpcomingEventsCard />
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
