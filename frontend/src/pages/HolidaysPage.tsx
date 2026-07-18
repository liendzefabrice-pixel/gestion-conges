import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import { Button } from '../components/ui/button'
import Tooltip from '../components/ui/tooltip'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { PageHeader } from '../components/ui/page-header'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Calendar, Plus, Pencil, Trash2, Check, X, Repeat } from 'lucide-react'

interface Holiday {
  id: number
  name: string
  date: string
  isRecurring: boolean
  description?: string
}

function HolidayFormModal({
  holiday,
  onClose,
  onSuccess,
}: {
  holiday?: Holiday
  onClose: () => void
  onSuccess: () => void
}) {
  const [name, setName] = useState(holiday?.name || '')
  const [date, setDate] = useState(holiday?.date ? holiday.date.split('T')[0] : '')
  const [isRecurring, setIsRecurring] = useState(holiday?.isRecurring ?? false)
  const [description, setDescription] = useState(holiday?.description || '')
  const [error, setError] = useState('')
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: (data: { name: string; date: string; isRecurring: boolean; description?: string }) =>
      api.post('/holidays', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] })
      onSuccess()
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || "Erreur lors de l'ajout")
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: { name: string; date: string; isRecurring: boolean; description?: string }) =>
      api.patch(`/holidays/${holiday!.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] })
      onSuccess()
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Erreur lors de la modification')
    },
  })

  const isPending = createMutation.isPending || updateMutation.isPending
  const isEditing = !!holiday

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!name.trim() || !date) return
    const payload = { name: name.trim(), date, isRecurring, description: description.trim() || undefined }
    if (isEditing) {
      updateMutation.mutate(payload)
    } else {
      createMutation.mutate(payload)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b">
          <h2 className="text-lg font-bold">{isEditing ? 'Modifier le jour férié' : 'Ajouter un jour férié'}</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-50 rounded-xl border border-red-200">{error}</div>
          )}
          <div className="space-y-2">
            <Label>Nom</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Fête du Travail" required />
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isRecurring"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="accent-primary size-4"
            />
            <Label htmlFor="isRecurring" className="cursor-pointer">Se répète chaque année</Label>
          </div>
          <div className="space-y-2">
            <Label>Description (optionnel)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Description..." />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={isPending || !name.trim() || !date}>
              {isPending ? 'Enregistrement...' : isEditing ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function HolidaysPage() {
  const [showForm, setShowForm] = useState(false)
  const [editingHoliday, setEditingHoliday] = useState<Holiday | undefined>(undefined)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const queryClient = useQueryClient()

  const { data: holidays = [], isLoading } = useQuery<Holiday[]>({
    queryKey: ['holidays'],
    queryFn: () => api.get('/holidays').then((r) => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/holidays/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] })
      setDeletingId(null)
    },
  })

  const openCreate = () => {
    setEditingHoliday(undefined)
    setShowForm(true)
  }

  const openEdit = (holiday: Holiday) => {
    setEditingHoliday(holiday)
    setShowForm(true)
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingHoliday(undefined)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des jours fériés"
        description="Les jours fériés sont automatiquement exclus du calcul des congés."
        actions={
          <Button onClick={openCreate}>
            Ajouter un jour férié
          </Button>
        }
      />

      {isLoading ? (
        <p className="text-muted-foreground">Chargement...</p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Annuel</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holidays.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="font-medium">{h.name}</TableCell>
                    <TableCell>
                      {new Date(h.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </TableCell>
                    <TableCell>
                      {h.isRecurring ? (
                        <Badge variant="info" className="gap-1">
                          <Repeat className="size-3" />
                          Chaque année
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Cette année uniquement</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{h.description || '—'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip content="Modifier">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(h)}>
                            <Pencil className="size-3.5" />
                          </Button>
                        </Tooltip>
                        {deletingId === h.id ? (
                          <div className="flex gap-1">
                            <Tooltip content="Confirmer">
                              <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(h.id)} disabled={deleteMutation.isPending}>
                                <Check className="size-3.5 text-destructive" />
                              </Button>
                            </Tooltip>
                            <Tooltip content="Annuler">
                              <Button size="sm" variant="ghost" onClick={() => setDeletingId(null)}>
                                <X className="size-3.5" />
                              </Button>
                            </Tooltip>
                          </div>
                        ) : (
                          <Tooltip content="Supprimer">
                            <Button variant="ghost" size="sm" onClick={() => setDeletingId(h.id)}>
                              <Trash2 className="size-3.5 text-destructive" />
                            </Button>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {holidays.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Aucun jour férié enregistré
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {showForm && (
        <HolidayFormModal
          holiday={editingHoliday}
          onClose={() => { setShowForm(false); setEditingHoliday(undefined) }}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  )
}
