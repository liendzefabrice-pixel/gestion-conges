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
} from '../types'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { SystemAlertsCard } from '../components/dashboard/SystemAlertsCard'
import { RecentActivityCard } from '../components/dashboard/RecentActivityCard'
import { QuickActionsCard } from '../components/dashboard/QuickActionsCard'
import { HrQuickActionsCard } from '../components/dashboard/HrQuickActionsCard'
import { DirectorQuickActionsCard } from '../components/dashboard/DirectorQuickActionsCard'
import {
  Users,
  Building2,
  Clock,
  CalendarDays,
  FileText,
  ArrowRight,
  Bell,
  PlusCircle,
  CheckCircle,
  XCircle,
  WalletCards,
  Megaphone,
  ClipboardCheck,
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

function formatToday(): string {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
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
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    api.get('/notifications/unread/count').then((res) => {
      setUnreadCount(res.data.count ?? res.data ?? 0)
    }).catch(() => {})
  }, [])

  const inactiveCount = users.filter((u) => !u.isActive).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{getGreeting(user)}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{formatToday()}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SimpleCard icon={<Users className="size-5 text-gray-600" />} label="Utilisateurs" value={String(data.users)} />
        <SimpleCard icon={<Building2 className="size-5 text-gray-600" />} label="Employés" value={String(data.employees)} />
        <SimpleCard icon={<Clock className="size-5 text-gray-600" />} label="Demandes en attente" value={String(data.pendingRequests.total)} sub={`${data.pendingRequests.leave} congés · ${data.pendingRequests.permission} permissions`} />
        <SimpleCard icon={<CalendarDays className="size-5 text-gray-600" />} label="Départements" value={String(data.departments)} />
      </div>

      {data.campaign && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <Megaphone className="size-4 text-gray-500" />
              {data.campaign.label} ({data.campaign.year})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Éligibles</span>
                <p className="font-semibold text-gray-900">{data.campaign.eligibleEmployees}</p>
              </div>
              <div>
                <span className="text-gray-500">Propositions</span>
                <p className="font-semibold text-gray-900">{data.campaign.proposalsReceived}</p>
              </div>
              <div>
                <span className="text-gray-500">Participation</span>
                <p className="font-semibold text-gray-900">{data.campaign.participationRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RecentActivityCard
          activities={[
            ...leaveRequests.slice(0, 5).map((r) => {
              const d = new Date(r.createdAt || r.startDate)
              return {
                id: `leave-${r.id}`,
                icon: r.status === 'APPROUVE' ? CheckCircle : r.status === 'REFUSE' ? FileText : Clock,
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
          ].sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`)).slice(0, 6)}
        />

        <SystemAlertsCard
          alerts={[
            data.pendingRequests.total > 0 && {
              id: 'pending-requests',
              icon: Clock,
              colorClass: 'text-amber-600 bg-amber-100',
              title: 'Demandes en attente',
              description: 'Nécessitent une validation',
              count: data.pendingRequests.total,
            },
            inactiveCount > 0 && {
              id: 'inactive-users',
              icon: Users,
              colorClass: 'text-gray-600 bg-gray-100',
              title: 'Utilisateurs désactivés',
              description: 'Comptes inactifs',
              count: inactiveCount,
            },
            unreadCount > 0 && {
              id: 'unread-notifications',
              icon: Bell,
              colorClass: 'text-blue-600 bg-blue-100',
              title: 'Notifications non lues',
              description: 'Messages en attente',
              count: unreadCount,
            },
          ].filter(Boolean) as any[]}
        />
      </div>

      <QuickActionsCard />
    </div>
  )
}

/* ───── HR Dashboard ───── */
function HrDashboard({ data, user }: { data: DashboardHr; user: User | null }) {
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    api.get('/notifications/unread/count').then((res) => {
      setUnreadCount(res.data.count ?? res.data ?? 0)
    }).catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{getGreeting(user)}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{formatToday()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SimpleCard icon={<Clock className="size-5 text-gray-600" />} label="Demandes en attente" value={String(data.toReview.total)} sub={`${data.toReview.leave} congés · ${data.toReview.permission} permissions`} />
        <SimpleCard icon={<CheckCircle className="size-5 text-gray-600" />} label="Congés traités" value={String(data.totalProcessed.leave)} />
        <SimpleCard icon={<Users className="size-5 text-gray-600" />} label="Employés" value={String(data.employees)} />
      </div>

      {data.campaign && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <Megaphone className="size-4 text-gray-500" />
              {data.campaign.label} ({data.campaign.year})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Éligibles</span>
                <p className="font-semibold text-gray-900">{data.campaign.eligibleEmployees}</p>
              </div>
              <div>
                <span className="text-gray-500">Propositions</span>
                <p className="font-semibold text-gray-900">{data.campaign.proposalsReceived}</p>
              </div>
              <div>
                <span className="text-gray-500">Participation</span>
                <p className="font-semibold text-gray-900">{data.campaign.participationRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <CalendarDays className="size-4 text-gray-500" />
              Demandes récentes
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
              <CalendarDays className="size-10 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">Aucune demande récente</p>
            </div>
            <div className="pt-3 border-t border-gray-100">
              <Button variant="ghost" className="w-full justify-between text-sm" onClick={() => navigate('/leave')}>
                Voir toutes les demandes
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <SystemAlertsCard
          alerts={[
            data.toReview.total > 0 && {
              id: 'to-review',
              icon: Clock,
              colorClass: 'text-amber-600 bg-amber-100',
              title: 'Demandes à examiner',
              description: 'Congés et permissions en attente',
              count: data.toReview.total,
            },
            unreadCount > 0 && {
              id: 'unread',
              icon: Bell,
              colorClass: 'text-blue-600 bg-blue-100',
              title: 'Notifications non lues',
              description: 'Messages en attente',
              count: unreadCount,
            },
          ].filter(Boolean) as any[]}
        />
      </div>

      <HrQuickActionsCard />
    </div>
  )
}

/* ───── Director Dashboard ───── */
function DirectorDashboard({ data, user }: { data: DashboardDirector; user: User | null }) {
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    api.get('/notifications/unread/count').then((res) => {
      setUnreadCount(res.data.count ?? res.data ?? 0)
    }).catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{getGreeting(user)}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{formatToday()}</p>
        </div>
        <Button onClick={() => navigate('/leave')} variant="outline" size="sm">
          <ClipboardCheck className="size-4" />
          Voir les demandes
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SimpleCard icon={<Clock className="size-5 text-gray-600" />} label="Demandes à décider" value={String(data.toDecide.total)} sub={`${data.toDecide.leave} congés · ${data.toDecide.permission} permissions`} />
        <SimpleCard icon={<CheckCircle className="size-5 text-gray-600" />} label="Approuvées" value={String(data.decisions.approved)} />
        <SimpleCard icon={<XCircle className="size-5 text-gray-600" />} label="Refusées" value={String(data.decisions.rejected)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <ClipboardCheck className="size-4 text-gray-500" />
              Décisions récentes
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
              <ClipboardCheck className="size-10 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">Aucune décision récente</p>
            </div>
            <div className="pt-3 border-t border-gray-100">
              <Button variant="ghost" className="w-full justify-between text-sm" onClick={() => navigate('/leave')}>
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
              icon: Clock,
              colorClass: 'text-amber-600 bg-amber-100',
              title: 'Demandes en attente de décision',
              description: 'Nécessitent votre validation',
              count: data.toDecide.total,
            },
            unreadCount > 0 && {
              id: 'unread',
              icon: Bell,
              colorClass: 'text-blue-600 bg-blue-100',
              title: 'Notifications non lues',
              description: 'Messages en attente',
              count: unreadCount,
            },
          ].filter(Boolean) as any[]}
        />
      </div>

      <DirectorQuickActionsCard />
    </div>
  )
}

/* ───── Employee Dashboard ───── */
function EmployeeDashboard({ data, user }: { data: DashboardEmployee; user: User | null }) {
  const navigate = useNavigate()

  const { data: myLeaves = [] } = useQuery<LeaveRequest[]>({
    queryKey: ['my-leaves'],
    queryFn: () => api.get('/leave/requests/my').then((r) => r.data),
  })

  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ['unread-count-employee'],
    queryFn: () => api.get('/notifications/unread/count').then((r) => r.data.count ?? r.data ?? 0),
  })

  const totalRemaining = data.balances
    .filter((b) => b.type.toLowerCase().includes('annuel'))
    .reduce((sum, b) => sum + b.remaining, 0)
  const pendingCount = myLeaves.filter((l) => l.status === 'EN_ATTENTE_RH' || l.status === 'AVIS_RH_RENDU').length
  const approvedCount = myLeaves.filter((l) => l.status === 'APPROUVE').length
  const rejectedCount = myLeaves.filter((l) => l.status === 'REFUSE').length

  const latestRequest = myLeaves.length > 0
    ? myLeaves.sort((a, b) => new Date(b.createdAt || b.startDate).getTime() - new Date(a.createdAt || a.startDate).getTime())[0]
    : null

  const statusLabel: Record<string, string> = {
    EN_ATTENTE_RH: 'En attente RH',
    AVIS_RH_RENDU: 'Avis RH rendu',
    APPROUVE: 'Approuvée',
    REFUSE: 'Refusée',
  }

  const statusColor: Record<string, string> = {
    EN_ATTENTE_RH: 'bg-amber-100 text-amber-700',
    AVIS_RH_RENDU: 'bg-blue-100 text-blue-700',
    APPROUVE: 'bg-emerald-100 text-emerald-700',
    REFUSE: 'bg-red-100 text-red-700',
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{getGreeting(user)}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{formatToday()}</p>
        </div>
        <Button onClick={() => navigate('/leave')} size="sm">
          <PlusCircle className="size-4" />
          Nouvelle demande
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-500">
              <WalletCards className="size-4" />
              Solde des congés annuels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">{totalRemaining} jour{totalRemaining > 1 ? 's' : ''}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-500">
              <FileText className="size-4" />
              État des demandes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">En attente</span>
                <Badge variant="warning">{pendingCount}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Approuvées</span>
                <Badge variant="success">{approvedCount}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Refusées</span>
                <Badge variant="danger">{rejectedCount}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-500">
              <CalendarDays className="size-4" />
              Proposition annuelle
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.proposal ? (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-full',
                    data.proposal.status === 'ACCEPTEE' ? 'bg-emerald-100 text-emerald-700' :
                    data.proposal.status === 'REFUSEE' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  )}>
                    {data.proposal.status === 'ACCEPTEE' ? 'Acceptée' :
                     data.proposal.status === 'REFUSEE' ? 'Refusée' :
                     data.proposal.status === 'REPROGRAMMEE' ? 'Reprogrammée' : 'Soumise'}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  Départ souhaité : {new Date(data.proposal.desiredStartDate).toLocaleDateString('fr-FR')}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500 mb-2">{data.eligibleForLeave ? 'Non soumise' : 'Non éligible'}</p>
                {data.eligibleForLeave && (
                  <Button variant="ghost" className="w-full justify-between text-sm h-8 px-0" onClick={() => navigate('/my-campaign')}>
                    Soumettre une proposition
                    <ArrowRight className="size-4" />
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {latestRequest && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <FileText className="size-4 text-gray-500" />
              Dernière demande
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Type</span>
                <p className="font-medium text-gray-900">{latestRequest.leaveType?.name || 'Congé'}</p>
              </div>
              <div>
                <span className="text-gray-500">Dates</span>
                <p className="font-medium text-gray-900">
                  {new Date(latestRequest.startDate).toLocaleDateString('fr-FR')} - {new Date(latestRequest.endDate).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Durée</span>
                <p className="font-medium text-gray-900">{latestRequest.duration} jour{latestRequest.duration > 1 ? 's' : ''}</p>
              </div>
              <div>
                <span className="text-gray-500">Statut</span>
                <p>
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', statusColor[latestRequest.status] || 'bg-gray-100 text-gray-700')}>
                    {statusLabel[latestRequest.status] || latestRequest.status}
                  </span>
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-gray-100 mt-3">
              <Button variant="ghost" className="w-full justify-between text-sm" onClick={() => navigate('/leave')}>
                Voir toutes mes demandes
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-900">
            <Bell className="size-4 text-gray-500" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="danger" className="ml-auto">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="pt-1 border-t border-gray-100">
            <Button variant="ghost" className="w-full justify-between text-sm" onClick={() => navigate('/notifications')}>
              Voir toutes les notifications
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/* ───── Shared simple card ───── */
function SimpleCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-2">
          {icon}
          <span className="text-sm text-gray-500">{label}</span>
        </div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  )
}

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ')
}
