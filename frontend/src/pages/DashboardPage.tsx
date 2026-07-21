import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import type {
  DashboardAdmin,
  DashboardHr,
  DashboardDirector,
  DashboardEmployee,
  User,
  LeaveRequest,
  PermissionRequest,
  Notification,
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
import { DirectorQuickActionsCard } from '../components/dashboard/DirectorQuickActionsCard'
import { EmployeeQuickActionsCard } from '../components/dashboard/EmployeeQuickActionsCard'
import { SystemInformationCard } from '../components/dashboard/SystemInformationCard'
import { DonutChart } from '../components/dashboard/DonutChart'
import { MonthlyChart } from '../components/dashboard/MonthlyChart'
import { RecentActivity } from '../components/dashboard/RecentActivity'
import { RecentUsersTable } from '../components/dashboard/RecentUsersTable'
import { QuickActions } from '../components/dashboard/QuickActions'
import { SystemAlerts } from '../components/dashboard/SystemAlerts'
import { cn } from '../lib/utils'
import { Button } from '../components/ui/button'
import {
  Users,
  BadgeCheck,
  Briefcase,
  Building2,
  Clock,
  CalendarDays,
  Calendar,
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
  XCircle,
  FileCheck,
  ClipboardCheck,
  ArrowRight,
  WalletCards,
  BellRing,
  PlusCircle,
  Megaphone,
} from 'lucide-react'

type DashboardData = DashboardAdmin | DashboardHr | DashboardDirector | DashboardEmployee

function fetchDashboard(): Promise<DashboardData> {
  return api.get('/dashboard').then((res) => res.data)
}

function getGreeting(user: { lastName?: string; gender?: string } | null): string {
  if (!user) return 'Bonjour !'
  const prefix = user.gender === 'Homme' ? 'Bonjour M.' : user.gender === 'Femme' ? 'Bonjour Mme' : 'Bonjour'
  return user.lastName ? `${prefix} ${user.lastName} !` : `${prefix} !`
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
  const pending = requests.filter((r) => r.status === 'EN_ATTENTE_RH' || r.status === 'AVIS_RH_RENDU').length
  const approved = requests.filter((r) => r.status === 'APPROUVE').length
  const rejected = requests.filter((r) => r.status === 'REFUSE').length
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
    queryFn: () => api.get('/leave/requests').then((r) => {
      const res = r.data;
      return Array.isArray(res) ? res : (res.data || []);
    }),
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
          user={user}
        />
      )}
      {role === 'HR' && <HrDashboard data={data as DashboardHr} user={user} />}
      {role === 'DIRECTOR' && <DirectorDashboard data={data as DashboardDirector} user={user} />}
      {role === 'EMPLOYEE' && <EmployeeDashboard data={data as DashboardEmployee} user={user} />}
    </div>
  )
}

/* ───── Admin Dashboard ───── */
function AdminDashboard({
  data,
  leaveRequests,
  users,
  user,
}: {
  data: DashboardAdmin
  leaveRequests: LeaveRequest[]
  users: (User & { createdAt: string; isActive: boolean })[]
  user: User | null
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

  const roleLabels: Record<string, string> = {
    ADMIN: 'Administrateur',
    HR: 'RH',
    DIRECTOR: 'Directeur',
    EMPLOYEE: 'Employé',
  }

  const roleColors: Record<string, string> = {
    ADMIN: '#3B82F6',
    HR: '#F59E0B',
    DIRECTOR: '#8B5CF6',
    EMPLOYEE: '#10B981',
  }

  const statusLabels: Record<string, string> = {
    EN_ATTENTE_RH: 'En attente RH',
    AVIS_RH_RENDU: 'Avis RH rendu',
    APPROUVE: 'Approuvé',
    REFUSE: 'Refusé',
  }

  const statusColors: Record<string, string> = {
    EN_ATTENTE_RH: '#F59E0B',
    AVIS_RH_RENDU: '#3B82F6',
    APPROUVE: '#10B981',
    REFUSE: '#EF4444',
  }

  const roleCounts: Record<string, number> = {}
  users.forEach((u) => {
    const name = u.role?.name || 'INCONNU'
    roleCounts[name] = (roleCounts[name] || 0) + 1
  })
  const userRoleData = Object.entries(roleCounts).map(([name, value]) => ({
    name: roleLabels[name] || name,
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

  const statusCounts: Record<string, number> = { EN_ATTENTE_RH: 0, AVIS_RH_RENDU: 0, APPROUVE: 0, REFUSE: 0 }
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
            {getGreeting(user)}
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

      {/* 3. Campaign Section */}
      {data.campaign ? (
        <div className="rounded-2xl border bg-gradient-to-br from-rose-500/10 to-rose-500/5 border-rose-200/50 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-rose-500/10">
              <Megaphone className="size-5 text-rose-600" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{data.campaign.label}</p>
              <p className="text-xs text-muted-foreground">Campagne {data.campaign.year}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/60 rounded-xl p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Employés éligibles</p>
              <p className="text-2xl font-bold text-foreground mt-1">{data.campaign.eligibleEmployees}</p>
              <p className="text-xs text-muted-foreground mt-1">Ayant au moins 1 an d'ancienneté</p>
            </div>
            <div className="bg-white/60 rounded-xl p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Propositions reçues</p>
              <p className="text-2xl font-bold text-foreground mt-1">{data.campaign.proposalsReceived}</p>
              <p className="text-xs text-muted-foreground mt-1">Sur {data.campaign.eligibleEmployees} éligibles</p>
            </div>
            <div className="bg-white/60 rounded-xl p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Taux de participation</p>
              <p className="text-2xl font-bold text-foreground mt-1">{data.campaign.participationRate}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                {data.campaign.participationRate >= 80 ? 'Excellent' : data.campaign.participationRate >= 50 ? 'Correct' : 'Faible'}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* 4. Charts Section */}
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
                icon: r.status === 'APPROUVE' ? CheckCircle : r.status === 'REFUSE' ? FileText : Calendar,
                colorClass: r.status === 'APPROUVE'
                  ? 'text-emerald-600 bg-emerald-100'
                  : r.status === 'REFUSE'
                    ? 'text-red-600 bg-red-100'
                    : 'text-amber-600 bg-amber-100',
                title: r.status === 'APPROUVE'
                  ? 'Demande de congé validée'
                  : r.status === 'REFUSE'
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
function HrDashboard({ data, user }: { data: DashboardHr; user: User | null }) {
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
            {getGreeting(user)}
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
        </div>
      </div>

      {/* 2. KPI Zone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <AdminKpiCard
          icon={<Users className="size-5" />}
          title="Employés"
          value={data.employees}
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
      </div>

      {/* 2.5 Campaign Section */}
      {data.campaign ? (
        <div className="rounded-2xl border bg-gradient-to-br from-rose-500/10 to-rose-500/5 border-rose-200/50 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-rose-500/10">
              <Megaphone className="size-5 text-rose-600" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{data.campaign.label}</p>
              <p className="text-xs text-muted-foreground">Campagne {data.campaign.year}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/60 rounded-xl p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Employés éligibles</p>
              <p className="text-2xl font-bold text-foreground mt-1">{data.campaign.eligibleEmployees}</p>
              <p className="text-xs text-muted-foreground mt-1">Ayant au moins 1 an d'ancienneté</p>
            </div>
            <div className="bg-white/60 rounded-xl p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Propositions reçues</p>
              <p className="text-2xl font-bold text-foreground mt-1">{data.campaign.proposalsReceived}</p>
              <p className="text-xs text-muted-foreground mt-1">Sur {data.campaign.eligibleEmployees} éligibles</p>
            </div>
            <div className="bg-white/60 rounded-xl p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Taux de participation</p>
              <p className="text-2xl font-bold text-foreground mt-1">{data.campaign.participationRate}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                {data.campaign.participationRate >= 80 ? 'Excellent' : data.campaign.participationRate >= 50 ? 'Correct' : 'Faible'}
              </p>
            </div>
          </div>
        </div>
      ) : null}

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
function DirectorDashboard({ data, user }: { data: DashboardDirector; user: User | null }) {
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

  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {getGreeting(user)}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Voici un aperçu des validations et des indicateurs stratégiques.
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
          <Button onClick={() => navigate('/leave')}>
            <ClipboardCheck className="size-4" />
            Voir les demandes
          </Button>
        </div>
      </div>

      {/* 2. KPI Zone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <AdminKpiCard
          icon={<Clock className="size-5" />}
          title="Demandes en attente"
          value={data.toDecide.total}
          subtitle="En attente de décision"
          color="orange"
          evolution="+0%"
        />
        <AdminKpiCard
          icon={<CheckCircle className="size-5" />}
          title="Demandes approuvées"
          value={data.decisions.approved}
          subtitle="Validées par vos soins"
          color="emerald"
          evolution="+0%"
        />
        <AdminKpiCard
          icon={<XCircle className="size-5" />}
          title="Demandes refusées"
          value={data.decisions.rejected}
          subtitle="Non validées"
          color="red"
          evolution="+0%"
        />
        <AdminKpiCard
          icon={<CalendarDays className="size-5" />}
          title="Congés validés"
          value={data.decisions.approved}
          subtitle="Depuis le début"
          color="blue"
          evolution="+0%"
        />
        <AdminKpiCard
          icon={<FileCheck className="size-5" />}
          title="Permissions validées"
          value="--"
          subtitle="Demandes de permission"
          color="purple"
        />
        <AdminKpiCard
          icon={<Building2 className="size-5" />}
          title="Départements concernés"
          value="--"
          subtitle="Ayant des demandes"
          color="cyan"
        />
      </div>

      {/* 3. Statistics Zone */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DashboardChartCard title="Évolution des décisions" subtitle="Validations et refus par mois">
          <div className="flex flex-col items-center justify-center h-48 text-center px-4">
            <Calendar className="size-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Aucune donnée mensuelle</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              L'évolution des validations et refus par mois apparaîtra ici.
            </p>
          </div>
        </DashboardChartCard>

        <DashboardChartCard title="Répartition des décisions" subtitle="En attente, approuvées, refusées">
          <div className="pt-2">
            <DashboardDonutChart
              data={[
                { name: 'En attente', value: data.toDecide.total, color: '#F59E0B' },
                { name: 'Approuvées', value: data.decisions.approved, color: '#10B981' },
                { name: 'Refusées', value: data.decisions.rejected, color: '#EF4444' },
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

        <DashboardChartCard title="Congés validés par mois" subtitle="Évolution mensuelle">
          <div className="flex flex-col items-center justify-center h-48 text-center px-4">
            <CalendarDays className="size-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              L'évolution mensuelle des congés validés apparaîtra ici.
            </p>
          </div>
        </DashboardChartCard>

        <DashboardChartCard title="Permissions validées" subtitle="Répartition">
          <div className="flex flex-col items-center justify-center h-48 text-center px-4">
            <FileCheck className="size-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              La répartition des permissions validées apparaîtra ici.
            </p>
          </div>
        </DashboardChartCard>

        <DashboardChartCard title="Charge décisionnelle" subtitle="Décisions par mois">
          <div className="flex flex-col items-center justify-center h-48 text-center px-4">
            <ClipboardCheck className="size-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Le nombre de décisions prises chaque mois apparaîtra ici.
            </p>
          </div>
        </DashboardChartCard>
      </div>

      {/* 4. Info & Actions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="size-4 text-muted-foreground" />
              Décisions récentes
            </CardTitle>
            <CardDescription>Dernières validations effectuées</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
              <ClipboardCheck className="size-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Aucune décision récente</p>
              <p className="text-xs text-muted-foreground/60 mt-1 max-w-[220px]">
                Les dernières validations et refus apparaîtront ici.
              </p>
            </div>
            <div className="pt-2 border-t border-border/50">
              <Button
                variant="ghost"
                className="w-full justify-between text-sm"
                onClick={() => navigate('/leave')}
              >
                Voir toutes les demandes
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <SystemAlertsCard
          alerts={[
            data.toDecide.total > 0 && {
              id: 'to-decide',
              icon: AlertTriangle,
              colorClass: 'text-amber-600 bg-amber-100',
              title: 'Demandes en attente',
              description: 'En attente de votre décision',
              count: data.toDecide.total,
            },
            data.toDecide.leave > 0 && {
              id: 'pending-leaves',
              icon: CalendarDays,
              colorClass: 'text-blue-600 bg-blue-100',
              title: 'Congés à valider',
              description: 'En attente de décision',
              count: data.toDecide.leave,
            },
            data.toDecide.permission > 0 && {
              id: 'pending-permissions',
              icon: ShieldCheck,
              colorClass: 'text-purple-600 bg-purple-100',
              title: 'Permissions à valider',
              description: 'En attente de décision',
              count: data.toDecide.permission,
            },
            data.decisions.approved > 0 && {
              id: 'approved',
              icon: CheckCircle,
              colorClass: 'text-emerald-600 bg-emerald-100',
              title: 'Demandes approuvées',
              description: 'Validées',
              count: data.decisions.approved,
            },
          ].filter(Boolean) as any[]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DirectorQuickActionsCard />

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="size-4 text-muted-foreground" />
              Évènements importants
            </CardTitle>
            <CardDescription>Prochains évènements liés aux congés</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center py-12 text-center">
            <CalendarDays className="size-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Aucun évènement à venir</p>
            <p className="text-xs text-muted-foreground/60 mt-1 max-w-[220px]">
              Les départs, retours et échéances planifiés apparaîtront ici.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/* ───── Employee Dashboard ───── */
function EmployeeDashboard({ data, user }: { data: DashboardEmployee; user: User | null }) {
  const [now, setNow] = useState(new Date())
  const navigate = useNavigate()

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

  const { data: myLeaves = [] } = useQuery<LeaveRequest[]>({
    queryKey: ['my-leaves'],
    queryFn: () => api.get('/leave/requests/my').then((r) => r.data),
  })

  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ['unread-count-employee'],
    queryFn: () => api.get('/notifications/unread/count').then((r) => r.data.count ?? r.data ?? 0),
  })

  const totalRemaining = data.balances.reduce((sum, b) => sum + b.remaining, 0)
  const approvedCount = myLeaves.filter((l) => l.status === 'APPROUVE').length

  const monthlyActivity = Array.from({ length: 12 }, (_, i) => ({
    month: monthsShort[i],
    Congés: myLeaves.filter((l) => new Date(l.startDate).getMonth() === i).length,
  }))

  const statusDonut = [
    { name: 'En attente', value: myLeaves.filter((l) => l.status === 'EN_ATTENTE_RH' || l.status === 'AVIS_RH_RENDU').length, color: '#F59E0B' },
    { name: 'Approuvées', value: myLeaves.filter((l) => l.status === 'APPROUVE').length, color: '#10B981' },
    { name: 'Refusées', value: myLeaves.filter((l) => l.status === 'REFUSE').length, color: '#EF4444' },
  ].filter((d) => d.value > 0)

  const typeCounts: Record<string, number> = {}
  myLeaves.forEach((l) => {
    const name = l.leaveType?.name || 'Inconnu'
    typeCounts[name] = (typeCounts[name] || 0) + 1
  })
  const typePie = Object.entries(typeCounts).map(([name, value], i) => ({
    name,
    value,
    color: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'][i % 6],
  }))

  const latestRequest = myLeaves.length > 0
    ? myLeaves.sort((a, b) => new Date(b.createdAt || b.startDate).getTime() - new Date(a.createdAt || a.startDate).getTime())[0]
    : null

  const statusLabel: Record<string, string> = {
    EN_ATTENTE_RH: 'En attente RH',
    AVIS_RH_RENDU: 'Avis RH rendu',
    APPROUVE: 'Approuvée',
    REFUSE: 'Refusée',
  }

  const statusBadgeColor: Record<string, string> = {
    EN_ATTENTE_RH: 'bg-amber-100 text-amber-700',
    AVIS_RH_RENDU: 'bg-blue-100 text-blue-700',
    APPROUVE: 'bg-emerald-100 text-emerald-700',
    REFUSE: 'bg-red-100 text-red-700',
  }

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {getGreeting(user)}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Voici un aperçu de vos congés et permissions.
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
          <Button onClick={() => navigate('/leave')}>
            <PlusCircle className="size-4" />
            Nouvelle demande
          </Button>
        </div>
      </div>

      {/* 2. KPI Zone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <AdminKpiCard
          icon={<WalletCards className="size-5" />}
          title="Solde de congés"
          value={totalRemaining}
          subtitle="Jours restants"
          color="blue"
          evolution="+0%"
        />
        <AdminKpiCard
          icon={<Clock className="size-5" />}
          title="Demandes en attente"
          value={data.pendingRequests.total}
          subtitle="En cours de traitement"
          color="orange"
          evolution="+0%"
        />
        <AdminKpiCard
          icon={<CheckCircle className="size-5" />}
          title="Congés approuvés"
          value={approvedCount}
          subtitle="Demandes validées"
          color="emerald"
          evolution="+0%"
        />
        <AdminKpiCard
          icon={<CalendarDays className="size-5" />}
          title="Permissions"
          value={data.pendingRequests.permission}
          subtitle="En attente"
          color="purple"
          evolution="+0%"
        />
        <AdminKpiCard
          icon={<CalendarRange className="size-5" />}
          title="Proposition annuelle"
          value={data.proposal?.status === 'ACCEPTEE' ? 'Acceptée' : data.proposal ? 'Soumise' : 'Non soumise'}
          subtitle={data.proposal?.status === 'ACCEPTEE' ? 'Programmée' : data.proposal ? 'En attente' : 'Campagne'}
          color="cyan"
        />
        <AdminKpiCard
          icon={<BellRing className="size-5" />}
          title="Notifications"
          value={unreadCount}
          subtitle="Non lues"
          color="red"
          evolution="+0%"
        />
      </div>

      {/* 3. Statistics Zone */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DashboardChartCard title="Historique de mes demandes" subtitle="Évolution mensuelle">
          {monthlyActivity.some((m) => m.Congés > 0) ? (
            <div className="pt-2">
              <DashboardLineChart
                data={monthlyActivity}
                dataKey="Congés"
                xAxisKey="month"
                color="#3B82F6"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center px-4">
              <Calendar className="size-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Aucune donnée mensuelle</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                L'historique de vos demandes apparaîtra ici.
              </p>
            </div>
          )}
        </DashboardChartCard>

        <DashboardChartCard title="Répartition de mes demandes" subtitle="En attente, approuvées, refusées">
          {statusDonut.length > 0 ? (
            <div className="pt-2">
              <DashboardDonutChart data={statusDonut} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center px-4">
              <CheckCircle className="size-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                La répartition de vos demandes apparaîtra ici.
              </p>
            </div>
          )}
        </DashboardChartCard>

        <DashboardChartCard title="Répartition de mes congés" subtitle="Par type de congé">
          {typePie.length > 0 ? (
            <div className="pt-2">
              <DashboardPieChart data={typePie} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center px-4">
              <CalendarDays className="size-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                La répartition par type de congé apparaîtra ici.
              </p>
            </div>
          )}
        </DashboardChartCard>

        <DashboardChartCard title="Mon activité annuelle" subtitle="Demandes déposées par mois">
          {monthlyActivity.some((m) => m.Congés > 0) ? (
            <div className="pt-2">
              <DashboardAreaChart
                data={monthlyActivity}
                dataKey="Congés"
                xAxisKey="month"
                color="#8B5CF6"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center px-4">
              <Calendar className="size-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Votre activité annuelle apparaîtra ici.
              </p>
            </div>
          )}
        </DashboardChartCard>
      </div>

      {/* 4. Info Section - Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-4 text-muted-foreground" />
              Dernière demande
            </CardTitle>
            <CardDescription>Votre demande la plus récente</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            {latestRequest ? (
              <>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Type</span>
                    <span className="text-sm font-medium">{latestRequest.leaveType?.name || 'Congé'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Dates</span>
                    <span className="text-sm font-medium">
                      {new Date(latestRequest.startDate).toLocaleDateString('fr-FR')} - {new Date(latestRequest.endDate).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Durée</span>
                    <span className="text-sm font-medium">{latestRequest.duration} jour{latestRequest.duration > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Statut</span>
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', statusBadgeColor[latestRequest.status] || 'bg-gray-100 text-gray-700')}>
                      {statusLabel[latestRequest.status] || latestRequest.status}
                    </span>
                  </div>
                  {latestRequest.reason && (
                    <div>
                      <span className="text-sm text-muted-foreground">Motif</span>
                      <p className="text-sm mt-1">{latestRequest.reason}</p>
                    </div>
                  )}
                </div>
                <div className="pt-3 border-t border-border/50 mt-3">
                  <Button
                    variant="ghost"
                    className="w-full justify-between text-sm"
                    onClick={() => navigate('/leave')}
                  >
                    Voir le détail
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
                  <FileText className="size-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">Aucune demande</p>
                  <p className="text-xs text-muted-foreground/60 mt-1 max-w-[220px]">
                    Votre dernière demande de congé apparaîtra ici.
                  </p>
                </div>
                <div className="pt-2 border-t border-border/50">
                  <Button
                    variant="ghost"
                    className="w-full justify-between text-sm"
                    onClick={() => navigate('/leave')}
                  >
                    Nouvelle demande
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarRange className="size-4 text-muted-foreground" />
              Proposition annuelle
            </CardTitle>
            <CardDescription>Votre programme de congés</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-200/50">
                <div>
                  <p className="text-sm text-muted-foreground">Statut</p>
                  <p className="text-lg font-bold text-foreground mt-0.5">
                    {data.proposal?.status === 'ACCEPTEE' ? 'Acceptée' :
                     data.proposal?.status === 'REFUSEE' ? 'Refusée' :
                     data.proposal?.status === 'REPROGRAMMEE' ? 'Reprogrammée' :
                     data.proposal ? 'Soumise' : 'Non soumise'}
                  </p>
                </div>
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-cyan-500/10">
                  <CalendarRange className="size-6 text-cyan-600" />
                </div>
              </div>
              {data.proposal && (
                <div className="flex items-center justify-between py-2 px-4 rounded-xl bg-muted/50">
                  <span className="text-sm text-muted-foreground">Date souhaitée</span>
                  <span className="text-sm font-medium">
                    {new Date(data.proposal.desiredStartDate).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between py-2 px-4 rounded-xl bg-muted/50">
                <span className="text-sm text-muted-foreground">Éligibilité</span>
                <span className={cn('text-sm font-medium', data.eligibleForLeave ? 'text-emerald-600' : 'text-amber-600')}>
                  {data.eligibleForLeave ? 'Éligible' : 'Non éligible'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 5. Info Section - Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="size-4 text-muted-foreground" />
              Prochains évènements
            </CardTitle>
            <CardDescription>Vos prochains congés et permissions</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center py-12 text-center">
            <CalendarDays className="size-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Aucun évènement à venir</p>
            <p className="text-xs text-muted-foreground/60 mt-1 max-w-[220px]">
              Vos prochains congés, retours et permissions apparaîtront ici.
            </p>
          </CardContent>
        </Card>

        <EmployeeQuickActionsCard />
      </div>

      {/* 6. Notifications */}
      <div className="grid grid-cols-1 gap-4">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="size-4 text-muted-foreground" />
              Notifications récentes
            </CardTitle>
            <CardDescription>Vos dernières alertes et notifications</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="size-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Aucune notification récente</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Les notifications apparaîtront ici.
              </p>
            </div>
            <div className="pt-2 border-t border-border/50 mt-2">
              <Button
                variant="ghost"
                className="w-full justify-between text-sm"
                onClick={() => navigate('/notifications')}
              >
                Voir toutes
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
