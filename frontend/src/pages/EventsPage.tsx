import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent } from '../components/ui/card'
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
import { Plus, Pencil, Trash2, AlertTriangle, Info } from 'lucide-react'

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

const priorityConfig: Record<string, { label: string; className: string }> = {
  FAIBLE: { label: 'Faible', className: 'bg-gray-100 text-gray-600' },
  MOYENNE: { label: 'Moyenne', className: 'bg-blue-100 text-blue-700' },
  HAUTE: { label: 'Haute', className: 'bg-amber-100 text-amber-700' },
  CRITIQUE: { label: 'Critique', className: 'bg-red-100 text-red-700' },
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
}

export default function EventsPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [error, setError] = useState('')

  const { data: events = [], isLoading } = useQuery<any[]>({
    queryKey: ['internal-events'],
    queryFn: () => api.get('/internal-events').then((r) => r.data),
  })

  const { data: departments = [] } = useQuery<any[]>({
    queryKey: ['departments'],
    queryFn: () => api.get('/departments').then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/internal-events', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-events'] })
      closeForm()
    },
    onError: (err: any) => setError(err.response?.data?.message || 'Erreur'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.patch(`/internal-events/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-events'] })
      closeForm()
    },
    onError: (err: any) => setError(err.response?.data?.message || 'Erreur'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/internal-events/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['internal-events'] }),
  })

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(defaultForm)
    setError('')
  }

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
    })
    setEditingId(e.id)
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const payload = {
      title: form.title,
      description: form.description || undefined,
      type: form.type,
      startDate: form.startDate,
      endDate: form.endDate,
      allCompany: form.allCompany,
      departmentId: form.departmentId ? Number(form.departmentId) : undefined,
      priority: form.priority,
    }
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
        description="Gérez les périodes sensibles de l'entreprise (séminaires, audits, fermetures...)"
        actions={
          <Button onClick={() => { setEditingId(null); setForm(defaultForm); setShowForm(true) }}>
            <Plus className="size-4 mr-2" />
            Nouvel événement
          </Button>
        }
      />

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
                  <th className="h-11 px-5 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Dates</th>
                  <th className="h-11 px-5 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Département</th>
                  <th className="h-11 px-5 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Priorité</th>
                  <th className="h-11 px-5 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Statut</th>
                  <th className="h-11 px-5 text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e: any) => (
                  <tr key={e.id} className="border-b border-border/30 transition-colors duration-150 hover:bg-muted/40">
                    <td className="p-4 px-5 font-medium">
                      <div className="flex items-center gap-2">
                        {e.priority === 'CRITIQUE' || e.priority === 'HAUTE' ? (
                          <AlertTriangle className="size-4 text-amber-500 shrink-0" />
                        ) : (
                          <Info className="size-4 text-muted-foreground shrink-0" />
                        )}
                        {e.title}
                      </div>
                    </td>
                    <td className="p-4 px-5 text-muted-foreground">{eventTypeLabels[e.type] || e.type}</td>
                    <td className="p-4 px-5">
                      {new Date(e.startDate).toLocaleDateString('fr-FR')} → {new Date(e.endDate).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="p-4 px-5 text-muted-foreground">
                      {e.allCompany ? 'Toute l\'entreprise' : e.department?.name || '-'}
                    </td>
                    <td className="p-4 px-5">
                      <span className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        priorityConfig[e.priority]?.className,
                      )}>
                        {priorityConfig[e.priority]?.label || e.priority}
                      </span>
                    </td>
                    <td className="p-4 px-5">
                      <span className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        e.status === 'ACTIF' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500',
                      )}>
                        {e.status === 'ACTIF' ? 'Actif' : 'Archivé'}
                      </span>
                    </td>
                    <td className="p-4 px-5 text-right">
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(e)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(e.id)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={(o) => { if (!o) closeForm() }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Modifier l\'événement' : 'Nouvel événement'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 text-sm text-red-700 bg-red-50 rounded-xl border border-red-200">{error}</div>}
            <div className="space-y-2">
              <Label>Titre</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <textarea
                className={cn(
                  'flex min-h-[60px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm',
                  'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 resize-none',
                )}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(eventTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priorité</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(priorityConfig).map(([value, cfg]) => (
                      <SelectItem key={value} value={value}>{cfg.label}</SelectItem>
                    ))}
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
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allCompany"
                  checked={form.allCompany}
                  onChange={(e) => setForm({ ...form, allCompany: e.target.checked, departmentId: e.target.checked ? '' : form.departmentId })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="allCompany" className="mb-0">Toute l'entreprise</Label>
              </div>
            </div>
            {!form.allCompany && (
              <div className="space-y-2">
                <Label>Département concerné</Label>
                <Select value={form.departmentId} onValueChange={(v) => setForm({ ...form, departmentId: v })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner un département" /></SelectTrigger>
                  <SelectContent>
                    {departments.map((d: any) => (
                      <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeForm}>Annuler</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingId ? 'Modifier' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
