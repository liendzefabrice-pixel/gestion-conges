import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { PageHeader } from '../components/ui/page-header'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { cn } from '../lib/utils'
import { Plus, Pencil, Trash2, Eye, AlertTriangle, Info, Calendar, CalendarCheck, CalendarRange, Search, RotateCcw } from 'lucide-react'

const eventTypeLabels: Record<string, string> = {
  SEMINAIRE: 'Séminaire',
  AUDIT: 'Audit',
  INVENTAIRE: 'Inventaire',
  FORMATION: 'Formation',
  REUNION: 'Réunion',
  MAINTENANCE: 'Maintenance',
  FERMETURE_ANNUELLE: 'Fermeture annuelle',
  AUTRE: 'Autre',
}

const priorityConfig: Record<string, { label: string; className: string }> = {
  FAIBLE: { label: 'Faible', className: 'bg-gray-100 text-gray-600' },
  MOYENNE: { label: 'Moyenne', className: 'bg-blue-100 text-blue-700' },
  HAUTE: { label: 'Haute', className: 'bg-amber-100 text-amber-700' },
  CRITIQUE: { label: 'Critique', className: 'bg-red-100 text-red-700' },
}

const statusConfig: Record<string, { label: string; className: string }> = {
  BROUILLON: { label: 'Brouillon', className: 'bg-gray-100 text-gray-500' },
  ACTIF: { label: 'Actif', className: 'bg-green-100 text-green-700' },
  ARCHIVE: { label: 'Archivé', className: 'bg-gray-100 text-gray-500 line-through' },
}

const defaultForm = {
  title: '',
  description: '',
  type: 'AUTRE',
  startDate: '',
  endDate: '',
  allCompany: true,
  departmentId: '',
  priority: 'MOYENNE',
  status: 'BROUILLON',
}

export default function EventsPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [error, setError] = useState('')
  const [viewingId, setViewingId] = useState<number | null>(null)

  // Filters
  const [filters, setFilters] = useState({ year: '', type: '', priority: '', status: '', departmentId: '', search: '' })

  const queryParams = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => { if (v) queryParams.set(k, v) })

  const { data: events = [], isLoading } = useQuery<any[]>({
    queryKey: ['internal-events', filters],
    queryFn: () => api.get(`/internal-events?${queryParams}`).then((r) => r.data),
  })

  const { data: stats } = useQuery<any>({
    queryKey: ['internal-events-stats'],
    queryFn: () => api.get('/internal-events/stats').then((r) => r.data),
  })

  const { data: departments = [] } = useQuery<any[]>({
    queryKey: ['departments'],
    queryFn: () => api.get('/departments').then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/internal-events', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['internal-events'] }); closeForm() },
    onError: (err: any) => setError(err.response?.data?.message || 'Erreur'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.patch(`/internal-events/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['internal-events'] }); closeForm() },
    onError: (err: any) => setError(err.response?.data?.message || 'Erreur'),
  })

  const archiveMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/internal-events/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['internal-events'] }),
  })

  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(defaultForm); setError('') }

  const handleEdit = (e: any) => {
    setForm({
      title: e.title,
      description: e.description || '',
      type: e.type,
      startDate: e.startDate.slice(0, 10),
      endDate: e.endDate.slice(0, 10),
      allCompany: e.allCompany,
      departmentId: e.departmentId ? String(e.departmentId) : '',
      priority: e.priority,
      status: e.status,
    })
    setEditingId(e.id)
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const payload: any = {
      title: form.title,
      type: form.type,
      startDate: form.startDate,
      endDate: form.endDate,
      allCompany: form.allCompany,
      priority: form.priority,
    }
    if (form.description) payload.description = form.description
    if (form.departmentId) payload.departmentId = Number(form.departmentId)
    if (!editingId) payload.status = form.status
    if (editingId) Object.assign(payload, form.type !== undefined && {})
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  return (
    <div>
      <PageHeader
        title="Événements internes"
        description="Gérez les périodes importantes de l'entreprise"
        actions={
          <Button onClick={() => { setEditingId(null); setForm(defaultForm); setShowForm(true) }}>
            <Plus className="size-4 mr-2" />
            Nouvel événement
          </Button>
        }
      />

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="p-3 rounded-xl bg-green-50 text-green-600"><CalendarCheck className="size-5" /></div>
            <div><p className="text-2xl font-bold">{stats?.activeCount ?? '-'}</p><p className="text-xs text-muted-foreground">Événements actifs</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600"><Calendar className="size-5" /></div>
            <div><p className="text-2xl font-bold">{stats?.upcomingCount ?? '-'}</p><p className="text-xs text-muted-foreground">À venir</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="p-3 rounded-xl bg-red-50 text-red-600"><AlertTriangle className="size-5" /></div>
            <div><p className="text-2xl font-bold">{stats?.criticalCount ?? '-'}</p><p className="text-xs text-muted-foreground">Critiques</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600"><CalendarRange className="size-5" /></div>
            <div><p className="text-2xl font-bold">{stats?.yearCount ?? '-'}</p><p className="text-xs text-muted-foreground">Cette année</p></div>
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
                <Input className="pl-9 h-9 text-sm" placeholder="Titre..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1 min-w-[130px]">
              <Label className="text-xs">Type</Label>
              <Select value={filters.type || null} onValueChange={(v) => setFilters({ ...filters, type: v || '' })}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Tous" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Tous</SelectItem>
                  {Object.entries(eventTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 min-w-[130px]">
              <Label className="text-xs">Priorité</Label>
              <Select value={filters.priority || null} onValueChange={(v) => setFilters({ ...filters, priority: v || '' })}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Toutes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Toutes</SelectItem>
                  {Object.entries(priorityConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 min-w-[130px]">
              <Label className="text-xs">Statut</Label>
              <Select value={filters.status || null} onValueChange={(v) => setFilters({ ...filters, status: v || '' })}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Tous" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Tous</SelectItem>
                  {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 min-w-[130px]">
              <Label className="text-xs">Département</Label>
              <Select value={filters.departmentId || null} onValueChange={(v) => setFilters({ ...filters, departmentId: v || '' })}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Tous" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Tous</SelectItem>
                  {departments.map((d: any) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button variant="ghost" size="sm" className="h-9" onClick={() => setFilters({ year: '', type: '', priority: '', status: '', departmentId: '', search: '' })}>
              <RotateCcw className="size-3.5 mr-1.5" />Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-5 text-muted-foreground">Chargement...</p>
          ) : events.length === 0 ? (
            <p className="p-5 text-muted-foreground">Aucun événement interne</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/50">
                  <th className="h-11 px-5 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Titre</th>
                  <th className="h-11 px-5 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Type</th>
                  <th className="h-11 px-5 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Département</th>
                  <th className="h-11 px-5 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Début</th>
                  <th className="h-11 px-5 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Fin</th>
                  <th className="h-11 px-5 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Priorité</th>
                  <th className="h-11 px-5 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Statut</th>
                  <th className="h-11 px-5 text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e: any) => (
                  <tr key={e.id} className="border-b border-border/30 transition-colors duration-150 hover:bg-muted/40">
                    <td className="p-4 px-5">
                      <div className="flex items-center gap-2">
                        {e.priority === 'CRITIQUE' || e.priority === 'HAUTE'
                          ? <AlertTriangle className="size-4 text-amber-500 shrink-0" />
                          : <Info className="size-4 text-muted-foreground shrink-0" />}
                        <span className="font-medium">{e.title}</span>
                      </div>
                    </td>
                    <td className="p-4 px-5 text-muted-foreground">{eventTypeLabels[e.type] || e.type}</td>
                    <td className="p-4 px-5 text-muted-foreground">{e.allCompany ? 'Toute l\'entreprise' : e.department?.name || '-'}</td>
                    <td className="p-4 px-5">{new Date(e.startDate).toLocaleDateString('fr-FR')}</td>
                    <td className="p-4 px-5">{new Date(e.endDate).toLocaleDateString('fr-FR')}</td>
                    <td className="p-4 px-5">
                      <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', priorityConfig[e.priority]?.className)}>
                        {priorityConfig[e.priority]?.label || e.priority}
                      </span>
                    </td>
                    <td className="p-4 px-5">
                      <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', statusConfig[e.status]?.className)}>
                        {statusConfig[e.status]?.label || e.status}
                      </span>
                    </td>
                    <td className="p-4 px-5 text-right">
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => setViewingId(viewingId === e.id ? null : e.id)} title="Voir">
                          <Eye className="size-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(e)} title="Modifier">
                          <Pencil className="size-4" />
                        </Button>
                        {e.status !== 'ARCHIVE' && (
                          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => archiveMutation.mutate(e.id)} title="Archiver">
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* View detail inline */}
      {viewingId && (
        <Card className="mt-4">
          <CardContent className="p-5">
            {(() => {
              const e = events.find((x: any) => x.id === viewingId)
              if (!e) return null
              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">{e.title}</h3>
                    <Button variant="ghost" size="sm" onClick={() => setViewingId(null)}>Fermer</Button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div><p className="text-xs text-muted-foreground">Type</p><p>{eventTypeLabels[e.type] || e.type}</p></div>
                    <div><p className="text-xs text-muted-foreground">Priorité</p><span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', priorityConfig[e.priority]?.className)}>{priorityConfig[e.priority]?.label}</span></div>
                    <div><p className="text-xs text-muted-foreground">Début</p><p>{new Date(e.startDate).toLocaleDateString('fr-FR')}</p></div>
                    <div><p className="text-xs text-muted-foreground">Fin</p><p>{new Date(e.endDate).toLocaleDateString('fr-FR')}</p></div>
                    <div><p className="text-xs text-muted-foreground">Portée</p><p>{e.allCompany ? 'Toute l\'entreprise' : e.department?.name || '-'}</p></div>
                    <div><p className="text-xs text-muted-foreground">Statut</p><span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', statusConfig[e.status]?.className)}>{statusConfig[e.status]?.label}</span></div>
                  </div>
                  {e.description && <div><p className="text-xs text-muted-foreground">Description</p><p className="text-sm mt-0.5">{e.description}</p></div>}
                </div>
              )
            })()}
          </CardContent>
        </Card>
      )}

      {/* Create / Edit modal */}
      <Dialog open={showForm} onOpenChange={(o) => { if (!o) closeForm() }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>{editingId ? 'Modifier l\'événement' : 'Nouvel événement'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 text-sm text-red-700 bg-red-50 rounded-xl border border-red-200">{error}</div>}
            <div className="space-y-2">
              <Label>Titre</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <textarea className={cn('flex min-h-[60px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 resize-none')} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(eventTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priorité</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(priorityConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date de début</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Date de fin</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
              </div>
            </div>
            {!editingId && (
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-center gap-2">
              <input type="checkbox" id="allCompany" checked={form.allCompany} onChange={(e) => setForm({ ...form, allCompany: e.target.checked, departmentId: e.target.checked ? '' : form.departmentId })} className="rounded border-gray-300" />
              <Label htmlFor="allCompany" className="mb-0">Toute l'entreprise</Label>
            </div>
            {!form.allCompany && (
              <div className="space-y-2">
                <Label>Département concerné</Label>
                <Select value={form.departmentId} onValueChange={(v) => setForm({ ...form, departmentId: v })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {departments.map((d: any) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeForm}>Annuler</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>{editingId ? 'Modifier' : 'Créer'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
