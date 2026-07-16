import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../services/api'
import { Card, CardContent } from '../components/ui/card'
import { PageHeader } from '../components/ui/page-header'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { cn } from '../lib/utils'
import {
  ChevronLeft, ChevronRight, RotateCcw, Search,
  CalendarDays, CalendarCheck, AlertTriangle, Users, Flag, BadgeAlert, X,
} from 'lucide-react'

const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

const eventTypeColors: Record<string, string> = {
  SEMINAIRE: 'bg-purple-100 border-l-purple-500 text-purple-800',
  AUDIT: 'bg-red-100 border-l-red-500 text-red-800',
  INVENTAIRE: 'bg-amber-100 border-l-amber-500 text-amber-800',
  FORMATION: 'bg-blue-100 border-l-blue-500 text-blue-800',
  REUNION_STRATEGIQUE: 'bg-indigo-100 border-l-indigo-500 text-indigo-800',
  FERMETURE_ANNUELLE: 'bg-gray-100 border-l-gray-500 text-gray-800',
  MAINTENANCE: 'bg-cyan-100 border-l-cyan-500 text-cyan-800',
  AUTRE: 'bg-green-100 border-l-green-500 text-green-800',
}

const eventTypeLabels: Record<string, string> = {
  SEMINAIRE: 'Séminaire',
  AUDIT: 'Audit',
  INVENTAIRE: 'Inventaire',
  FORMATION: 'Formation',
  REUNION_STRATEGIQUE: 'Réunion stratégique',
  FERMETURE_ANNUELLE: 'Fermeture annuelle',
  MAINTENANCE: 'Maintenance',
  AUTRE: 'Autre',
}

const leaveStatusColors: Record<string, string> = {
  APPROUVE: 'bg-green-100 border-green-400 text-green-800',
  EN_ATTENTE_RH: 'bg-amber-100 border-amber-400 text-amber-800',
  EN_ATTENTE_DIRECTION: 'bg-orange-100 border-orange-400 text-orange-800',
  REFUSE: 'bg-red-100 border-red-400 text-red-800',
  AVIS_RH_RENDU: 'bg-blue-100 border-blue-400 text-blue-800',
  ANNULE: 'bg-gray-100 border-gray-400 text-gray-500',
  BROUILLON: 'bg-gray-50 border-gray-300 text-gray-500',
}

const leaveStatusLabels: Record<string, string> = {
  APPROUVE: 'Approuvé',
  EN_ATTENTE_RH: 'Attente RH',
  EN_ATTENTE_DIRECTION: 'Attente Direction',
  REFUSE: 'Refusé',
  AVIS_RH_RENDU: 'Avis RH rendu',
  ANNULE: 'Annulé',
  BROUILLON: 'Brouillon',
}

const proposalStatusColors: Record<string, string> = {
  RECUE: 'bg-indigo-100 border-indigo-400 text-indigo-800',
  EN_ANALYSE: 'bg-cyan-100 border-cyan-400 text-cyan-800',
  ACCEPTEE: 'bg-green-100 border-green-400 text-green-800',
  REPROGRAMMEE: 'bg-amber-100 border-amber-400 text-amber-800',
  REFUSEE: 'bg-red-100 border-red-400 text-red-800',
}

const proposalStatusLabels: Record<string, string> = {
  RECUE: 'Reçue',
  EN_ANALYSE: 'En analyse',
  ACCEPTEE: 'Acceptée',
  REPROGRAMMEE: 'Reprogrammée',
  REFUSEE: 'Refusée',
}

const priorityConfig: Record<string, { label: string; className: string }> = {
  FAIBLE: { label: 'Faible', className: 'bg-gray-100 text-gray-600' },
  MOYENNE: { label: 'Moyenne', className: 'bg-blue-100 text-blue-700' },
  HAUTE: { label: 'Haute', className: 'bg-amber-100 text-amber-800' },
  CRITIQUE: { label: 'Critique', className: 'bg-red-100 text-red-800' },
}

interface DetailItem {
  type: 'leave' | 'event' | 'holiday' | 'proposal' | 'conflict'
  data: any
}

export default function CalendarRhPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'year'>('month')
  const [filters, setFilters] = useState({
    departmentId: '', employeeId: '', leaveTypeId: '', eventType: '',
    status: '', priority: '', search: '',
  })
  const [detail, setDetail] = useState<DetailItem | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['calendar-rh', month, year, filters],
    queryFn: () => api.get('/calendar-rh', {
      params: { month, year, ...filters },
      paramsSerializer: { indexes: null },
    }).then((r) => r.data),
    keepPreviousData: true,
  })

  const { data: stats } = useQuery({
    queryKey: ['calendar-rh-stats', month, year],
    queryFn: () => api.get('/calendar-rh/stats', { params: { month, year } }).then((r) => r.data),
  })

  const { data: departments } = useQuery({
    queryKey: ['departments-list'],
    queryFn: () => api.get('/departments').then((r) => r.data),
  })

  const { data: leaveTypes } = useQuery({
    queryKey: ['leave-types-list'],
    queryFn: () => api.get('/leave-types').then((r) => r.data),
  })

  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay()
  const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

  const days = useMemo(() => {
    const result: { day: number; items: DetailItem[]; hasConflict: boolean }[] = []
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month - 1, d)
      const items: DetailItem[] = []
      let hasConflict = false

      ;(data?.holidays || []).forEach((h: any) => {
        const hd = new Date(h.date)
        if (hd.toDateString() === dateObj.toDateString()) {
          items.push({ type: 'holiday', data: h })
        }
      })

      ;(data?.internalEvents || []).forEach((e: any) => {
        const s = new Date(e.startDate)
        s.setHours(0, 0, 0, 0)
        const en = new Date(e.endDate)
        en.setHours(0, 0, 0, 0)
        if (dateObj >= s && dateObj <= en) {
          items.push({ type: 'event', data: e })
          if (e.priority === 'CRITIQUE') hasConflict = true
        }
      })

      ;(data?.leaveRequests || []).forEach((l: any) => {
        const s = new Date(l.startDate)
        s.setHours(0, 0, 0, 0)
        const en = new Date(l.endDate)
        en.setHours(0, 0, 0, 0)
        if (dateObj >= s && dateObj <= en) {
          items.push({ type: 'leave', data: l })
        }
      })

      ;(data?.proposals || []).forEach((p: any) => {
        const ps = new Date(p.desiredStartDate)
        ps.setHours(0, 0, 0, 0)
        let remaining = (p.duration || 1) - 1
        const pe = new Date(ps)
        while (remaining > 0) {
          pe.setDate(pe.getDate() + 1)
          if (pe.getDay() !== 0) remaining--
        }
        if (dateObj >= ps && dateObj <= pe && dateObj.getDay() !== 0) {
          items.push({ type: 'proposal', data: p })
        }
      })

      ;(data?.conflicts || []).forEach((c: any) => {
        if (c.leaveId && items.some((i) => i.type === 'leave' && i.data.id === c.leaveId)) {
          hasConflict = true
        }
        if (c.otherLeaveId && items.some((i) => i.type === 'leave' && i.data.id === c.otherLeaveId)) {
          hasConflict = true
        }
      })

      result.push({ day: d, items, hasConflict })
    }
    return result
  }, [data, year, month, daysInMonth])

  const conflictCount = data?.conflicts?.length || 0

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(year - 1) }
    else { setMonth(month - 1) }
  }
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(year + 1) }
    else { setMonth(month + 1) }
  }
  const goToday = () => {
    const t = new Date()
    setMonth(t.getMonth() + 1)
    setYear(t.getFullYear())
  }

  const resetFilters = () => setFilters({
    departmentId: '', employeeId: '', leaveTypeId: '', eventType: '',
    status: '', priority: '', search: '',
  })

  const formatDate = (d: Date) => d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const renderDetailPanel = () => {
    if (!detail) return null
    const { type, data: item } = detail

    const panelContent = () => {
      switch (type) {
        case 'leave':
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {item.employee?.firstName?.[0]}{item.employee?.lastName?.[0]}
                </div>
                <div>
                  <p className="font-semibold text-base">{item.employee?.firstName} {item.employee?.lastName}</p>
                  <p className="text-xs text-muted-foreground">{item.employee?.department?.name}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Poste</p><p>{item.employee?.position || '-'}</p></div>
                <div><p className="text-xs text-muted-foreground">Type de congé</p><p>{item.leaveType?.name}</p></div>
                <div><p className="text-xs text-muted-foreground">Date début</p><p>{new Date(item.startDate).toLocaleDateString('fr-FR')}</p></div>
                <div><p className="text-xs text-muted-foreground">Date retour</p><p>{new Date(item.endDate).toLocaleDateString('fr-FR')}</p></div>
                <div><p className="text-xs text-muted-foreground">Nombre de jours</p><p>{item.duration}</p></div>
                <div>
                  <p className="text-xs text-muted-foreground">Statut</p>
                  <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-0.5', leaveStatusColors[item.status])}>
                    {leaveStatusLabels[item.status] || item.status}
                  </span>
                </div>
              </div>
              {item.reason && <div><p className="text-xs text-muted-foreground">Motif</p><p className="text-sm">{item.reason}</p></div>}
              {item.hrComment && <div><p className="text-xs text-muted-foreground">Commentaire RH</p><p className="text-sm">{item.hrComment}</p></div>}
              {item.directorComment && <div><p className="text-xs text-muted-foreground">Décision Direction</p><p className="text-sm">{item.directorComment}</p></div>}
              {item.histories?.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Historique</p>
                  <div className="space-y-1">
                    {item.histories.slice(-5).map((h: any) => (
                      <div key={h.id} className="text-xs text-muted-foreground flex gap-2">
                        <span className="text-primary font-medium">{h.newStatus}</span>
                        <span>- {new Date(h.createdAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        case 'event':
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold', eventTypeColors[item.type] || 'bg-gray-100')}>
                  {item.title?.[0] || 'E'}
                </div>
                <div>
                  <p className="font-semibold text-base">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{eventTypeLabels[item.type] || item.type}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Date début</p><p>{new Date(item.startDate).toLocaleDateString('fr-FR')}</p></div>
                <div><p className="text-xs text-muted-foreground">Date fin</p><p>{new Date(item.endDate).toLocaleDateString('fr-FR')}</p></div>
                <div>
                  <p className="text-xs text-muted-foreground">Priorité</p>
                  <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-0.5', priorityConfig[item.priority]?.className)}>
                    {priorityConfig[item.priority]?.label}
                  </span>
                </div>
                <div><p className="text-xs text-muted-foreground">Portée</p><p>{item.allCompany ? 'Toute l\'entreprise' : item.department?.name || '-'}</p></div>
              </div>
              {item.description && <div><p className="text-xs text-muted-foreground">Description</p><p className="text-sm">{item.description}</p></div>}
            </div>
          )
        case 'holiday':
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-lg">🎉</div>
                <div>
                  <p className="font-semibold text-base">{item.name}</p>
                  <p className="text-xs text-muted-foreground">Jour férié</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Date</p><p>{new Date(item.date).toLocaleDateString('fr-FR')}</p></div>
                <div><p className="text-xs text-muted-foreground">Récurrent</p><p>{item.isRecurring ? 'Oui' : 'Non'}</p></div>
              </div>
              {item.description && <div><p className="text-xs text-muted-foreground">Description</p><p className="text-sm">{item.description}</p></div>}
            </div>
          )
        case 'proposal':
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                  {item.employee?.firstName?.[0]}{item.employee?.lastName?.[0]}
                </div>
                <div>
                  <p className="font-semibold text-base">{item.employee?.firstName} {item.employee?.lastName}</p>
                  <p className="text-xs text-muted-foreground">{item.employee?.department?.name}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Poste</p><p>{item.employee?.position || '-'}</p></div>
                <div><p className="text-xs text-muted-foreground">Campagne</p><p>{item.campaign?.label}</p></div>
                <div><p className="text-xs text-muted-foreground">Date souhaitée</p><p>{new Date(item.desiredStartDate).toLocaleDateString('fr-FR')}</p></div>
                <div><p className="text-xs text-muted-foreground">Durée</p><p>{item.duration} jours</p></div>
                <div>
                  <p className="text-xs text-muted-foreground">Statut</p>
                  <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-0.5', proposalStatusColors[item.status])}>
                    {proposalStatusLabels[item.status] || item.status}
                  </span>
                </div>
              </div>
              {item.comment && <div><p className="text-xs text-muted-foreground">Commentaire</p><p className="text-sm">{item.comment}</p></div>}
            </div>
          )
        case 'conflict':
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600"><BadgeAlert className="size-5" /></div>
                <div>
                  <p className="font-semibold text-base">Conflit détecté</p>
                  <p className="text-xs text-muted-foreground">{item.severity === 'HIGH' ? 'Priorité haute' : item.severity === 'MEDIUM' ? 'Attention' : 'Information'}</p>
                </div>
              </div>
              <div className="text-sm space-y-2">
                {item.type === 'LEAVE_EVENT' && (
                  <>
                    <p><span className="font-medium">Employé:</span> {item.leaveEmployee}</p>
                    <p><span className="font-medium">Événement:</span> {item.eventTitle} ({eventTypeLabels[item.eventType] || item.eventType})</p>
                    <p className="text-xs text-muted-foreground mt-2">Ce congé chevauche un événement {item.eventPriority === 'CRITIQUE' ? 'critique' : 'important'}.</p>
                  </>
                )}
                {item.type === 'LEAVE_LEAVE' && (
                  <>
                    <p><span className="font-medium">Employé 1:</span> {item.leaveEmployee}</p>
                    <p><span className="font-medium">Employé 2:</span> {item.otherEmployee}</p>
                    <p className="text-xs text-muted-foreground mt-2">Deux employés du même département sont en congé simultanément.</p>
                  </>
                )}
              </div>
            </div>
          )
      }
    }

    return (
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col animate-in slide-in-from-right">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="font-semibold text-lg">
            {type === 'leave' ? 'Congé' : type === 'event' ? 'Événement' : type === 'holiday' ? 'Jour férié' : type === 'proposal' ? 'Programmation' : 'Conflit'}
          </h2>
          <Button variant="ghost" size="sm" onClick={() => setDetail(null)}><X className="size-4" /></Button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {panelContent()}
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <PageHeader
        title="Calendrier RH"
        description="Pilotez l'ensemble des congés, événements et jours fériés"
      />

      {/* View mode selector */}
      <div className="flex items-center gap-2 mb-6">
        {(['month', 'week', 'year'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => mode === 'month' && setViewMode(mode)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              viewMode === mode
                ? 'bg-primary text-white'
                : 'text-muted-foreground hover:bg-muted',
              mode !== 'month' && 'opacity-40 cursor-not-allowed',
            )}
            title={mode !== 'month' ? 'Disponible prochainement' : undefined}
          >
            {mode === 'month' ? 'Mois' : mode === 'week' ? 'Semaine' : 'Année'}
          </button>
        ))}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="p-2.5 rounded-xl bg-green-50 text-green-600"><CalendarCheck className="size-5" /></div>
            <div>
              <p className="text-xl font-bold">{stats?.leavesToday ?? '-'}</p>
              <p className="text-[11px] text-muted-foreground leading-tight">Congés aujourd'hui</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600"><CalendarDays className="size-5" /></div>
            <div>
              <p className="text-xl font-bold">{stats?.leavesThisMonth ?? '-'}</p>
              <p className="text-[11px] text-muted-foreground leading-tight">Congés ce mois</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600"><Users className="size-5" /></div>
            <div>
              <p className="text-xl font-bold">{stats?.absentEmployeesCount ?? '-'}</p>
              <p className="text-[11px] text-muted-foreground leading-tight">Employés absents</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600"><Flag className="size-5" /></div>
            <div>
              <p className="text-xl font-bold">{stats?.eventsThisMonth ?? '-'}</p>
              <p className="text-[11px] text-muted-foreground leading-tight">Événements du mois</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className={cn('p-2.5 rounded-xl', conflictCount > 0 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400')}>
              <BadgeAlert className="size-5" />
            </div>
            <div>
              <p className={cn('text-xl font-bold', conflictCount > 0 ? 'text-red-600' : '')}>{conflictCount}</p>
              <p className="text-[11px] text-muted-foreground leading-tight">Conflits détectés</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className={cn('p-2.5 rounded-xl', stats?.campaignOpen ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400')}>
              <CalendarCheck className="size-5" />
            </div>
            <div>
              <p className="text-xl font-bold truncate">{stats?.campaignOpen ? 'Active' : 'Aucune'}</p>
              <p className="text-[11px] text-muted-foreground leading-tight truncate">Campagne en cours</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1 min-w-[160px] flex-1">
              <Label className="text-xs">Recherche</Label>
              <div className="relative">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9 h-9 text-sm" placeholder="Employé, département, événement..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1 min-w-[130px]">
              <Label className="text-xs">Département</Label>
              <Select value={filters.departmentId || null} onValueChange={(v) => setFilters({ ...filters, departmentId: v === '__all__' ? '' : v })}>
                <SelectTrigger className="h-9 text-sm">
                  <span className="flex-1 text-left">{filters.departmentId ? departments?.find((d: any) => String(d.id) === filters.departmentId)?.name || filters.departmentId : 'Tous'}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Tous</SelectItem>
                  {(departments || []).map((d: any) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 min-w-[130px]">
              <Label className="text-xs">Type de congé</Label>
              <Select value={filters.leaveTypeId || null} onValueChange={(v) => setFilters({ ...filters, leaveTypeId: v === '__all__' ? '' : v })}>
                <SelectTrigger className="h-9 text-sm">
                  <span className="flex-1 text-left">{filters.leaveTypeId ? leaveTypes?.find((t: any) => String(t.id) === filters.leaveTypeId)?.name || filters.leaveTypeId : 'Tous'}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Tous</SelectItem>
                  {(leaveTypes || []).map((t: any) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 min-w-[130px]">
              <Label className="text-xs">Type d'événement</Label>
              <Select value={filters.eventType || null} onValueChange={(v) => setFilters({ ...filters, eventType: v === '__all__' ? '' : v })}>
                <SelectTrigger className="h-9 text-sm">
                  <span className="flex-1 text-left">{filters.eventType ? eventTypeLabels[filters.eventType] || filters.eventType : 'Tous'}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Tous</SelectItem>
                  {Object.entries(eventTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 min-w-[130px]">
              <Label className="text-xs">Statut</Label>
              <Select value={filters.status || null} onValueChange={(v) => setFilters({ ...filters, status: v === '__all__' ? '' : v })}>
                <SelectTrigger className="h-9 text-sm">
                  <span className="flex-1 text-left">{filters.status ? leaveStatusLabels[filters.status] || filters.status : 'Tous'}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Tous</SelectItem>
                  {Object.entries(leaveStatusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 min-w-[130px]">
              <Label className="text-xs">Priorité</Label>
              <Select value={filters.priority || null} onValueChange={(v) => setFilters({ ...filters, priority: v === '__all__' ? '' : v })}>
                <SelectTrigger className="h-9 text-sm">
                  <span className="flex-1 text-left">{filters.priority ? priorityConfig[filters.priority]?.label || filters.priority : 'Toutes'}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Toutes</SelectItem>
                  {Object.entries(priorityConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button variant="ghost" size="sm" className="h-9" onClick={resetFilters}>
              <RotateCcw className="size-3.5 mr-1.5" />Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Calendar card */}
      <Card>
        <CardContent className="p-5">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={prevMonth}>
                <ChevronLeft className="size-4" />
              </Button>
              <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                <SelectTrigger className="h-9 text-sm min-w-[140px]">
                  <span className="flex-1 text-left">{monthNames[month - 1]}</span>
                </SelectTrigger>
                <SelectContent>
                  {monthNames.map((name, i) => <SelectItem key={i + 1} value={String(i + 1)}>{name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                <SelectTrigger className="h-9 text-sm min-w-[100px]">
                  <span className="flex-1 text-left">{year}</span>
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 11 }, (_, i) => now.getFullYear() - 5 + i).map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={nextMonth}>
                <ChevronRight className="size-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={goToday}>
              Aujourd'hui
            </Button>
          </div>

          {isLoading ? (
            <p className="text-muted-foreground py-10 text-center">Chargement...</p>
          ) : (
            <>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-px bg-border rounded-t-lg overflow-hidden">
                {dayNames.map((name) => (
                  <div key={name} className="bg-muted/50 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">
                    {name}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-px bg-border">
                {Array.from({ length: startOffset }).map((_, i) => (
                  <div key={`empty-${i}`} className="bg-white min-h-[110px] p-1" />
                ))}

                {days.map((dayData) => {
                  const isToday = dayData.day === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear()
                  const dayHolidays = dayData.items.filter((i) => i.type === 'holiday')
                  const dayEvents = dayData.items.filter((i) => i.type === 'event')
                  const dayLeaves = dayData.items.filter((i) => i.type === 'leave')
                  const dayProposals = dayData.items.filter((i) => i.type === 'proposal')

                  return (
                    <div
                      key={dayData.day}
                      className={cn(
                        'bg-white min-h-[110px] p-1.5 transition-colors duration-150 hover:bg-gray-50 relative',
                        isToday && 'ring-2 ring-primary ring-inset',
                        dayData.hasConflict && 'ring-1 ring-red-300 ring-inset bg-red-50/30',
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className={cn(
                          'text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full',
                          isToday && 'bg-primary text-white',
                        )}>
                          {dayData.day}
                        </div>
                        {dayData.hasConflict && <AlertTriangle className="size-3 text-red-500 shrink-0" />}
                      </div>

                      <div className="space-y-0.5">
                        {dayHolidays.slice(0, 1).map((item, i) => (
                          <button
                            key={`hol-${i}`}
                            onClick={() => setDetail(item)}
                            className="w-full text-[10px] px-1 py-0.5 rounded bg-red-100 text-red-700 truncate text-left hover:bg-red-200 transition-colors cursor-pointer"
                          >
                            🎉 {item.data.name}
                          </button>
                        ))}

                        {dayEvents.slice(0, 2).map((item, i) => (
                          <button
                            key={`evt-${i}`}
                            onClick={() => setDetail(item)}
                            className={cn(
                              'w-full text-[10px] px-1 py-0.5 rounded truncate text-left border-l-2 transition-colors cursor-pointer hover:opacity-80',
                              eventTypeColors[item.data.type] || 'bg-gray-100 border-l-gray-400',
                            )}
                          >
                            {item.data.title}
                          </button>
                        ))}

                        {dayLeaves.slice(0, 2).map((item, i) => (
                          <button
                            key={`leave-${i}`}
                            onClick={() => setDetail(item)}
                            className={cn(
                              'w-full text-[10px] px-1 py-0.5 rounded truncate text-left border transition-colors cursor-pointer hover:opacity-80',
                              leaveStatusColors[item.data.status] || 'bg-gray-100',
                            )}
                          >
                            {item.data.employee?.lastName} {item.data.employee?.firstName?.[0]}.
                          </button>
                        ))}

                        {dayProposals.slice(0, 1).map((item, i) => (
                          <button
                            key={`prop-${i}`}
                            onClick={() => setDetail(item)}
                            className={cn(
                              'w-full text-[10px] px-1 py-0.5 rounded truncate text-left border transition-colors cursor-pointer hover:opacity-80',
                              proposalStatusColors[item.data.status] || 'bg-indigo-100',
                            )}
                          >
                            📋 {item.data.employee?.lastName}
                          </button>
                        ))}

                        {(dayLeaves.length + dayEvents.length + dayProposals.length) > 3 && (
                          <div className="text-[10px] text-muted-foreground px-0.5">
                            +{dayLeaves.length + dayEvents.length + dayProposals.length - 3} autres
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-x-5 gap-y-2 mt-5 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-100 border border-red-300" />Jour férié</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-purple-100 border border-purple-300" />Séminaire</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-100 border border-red-300" />Audit</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-100 border border-amber-300" />Inventaire</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-100 border border-blue-300" />Formation</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-gray-100 border border-gray-300" />Fermeture</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-100 border border-green-300" />Congé approuvé</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-100 border border-amber-300" />Congé en attente</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-indigo-100 border border-indigo-300" />Programmation</div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-100 border border-red-400" />Conflit</div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail panel */}
      {renderDetailPanel()}
      {detail && (
        <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setDetail(null)} />
      )}
    </div>
  )
}
