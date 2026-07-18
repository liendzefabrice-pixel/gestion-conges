import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import type { AnnualLeavePlanning, Employee } from '../types'
import { Button } from '../components/ui/button'
import Tooltip from '../components/ui/tooltip'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { PageHeader } from '../components/ui/page-header'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Plus, Pencil, Trash2 } from 'lucide-react'

const months = [
  { value: '1', label: 'Janvier' }, { value: '2', label: 'Février' },
  { value: '3', label: 'Mars' }, { value: '4', label: 'Avril' },
  { value: '5', label: 'Mai' }, { value: '6', label: 'Juin' },
  { value: '7', label: 'Juillet' }, { value: '8', label: 'Août' },
  { value: '9', label: 'Septembre' }, { value: '10', label: 'Octobre' },
  { value: '11', label: 'Novembre' }, { value: '12', label: 'Décembre' },
]

export default function LeavePlanningPage() {
  const queryClient = useQueryClient()
  const currentYear = new Date().getFullYear()
  const [formData, setFormData] = useState({ employeeId: '', year: String(currentYear), month: '' })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState('')

  const { data: plannings = [], isLoading } = useQuery<AnnualLeavePlanning[]>({
    queryKey: ['leave-plannings'],
    queryFn: () => api.get('/leave-planning').then((r) => r.data),
  })

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: () => api.get('/employees').then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: { employeeId: number; year: number; month: number }) =>
      api.post('/leave-planning', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-plannings'] })
      resetForm()
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Erreur lors de la création')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { year?: number; month?: number } }) =>
      api.patch(`/leave-planning/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-plannings'] })
      resetForm()
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/leave-planning/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leave-plannings'] }),
  })

  const resetForm = () => {
    setFormData({ employeeId: '', year: String(currentYear), month: '' })
    setEditingId(null)
    setError('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const data = {
      employeeId: Number(formData.employeeId),
      year: Number(formData.year),
      month: Number(formData.month),
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleEdit = (p: AnnualLeavePlanning) => {
    setFormData({
      employeeId: String(p.employeeId),
      year: String(p.year),
      month: String(p.month),
    })
    setEditingId(p.id)
  }

  return (
    <div>
      <PageHeader
        title="Planification des congés"
        description="Planifiez les congés annuels des employés"
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{editingId ? 'Modifier la planification' : 'Nouvelle planification'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 text-sm text-red-700 bg-red-50 rounded-xl border border-red-200">{error}</div>}
            <div className="space-y-2">
              <Label>Employé</Label>
              <Select
                value={formData.employeeId || null}
                onValueChange={(v) => setFormData({ ...formData, employeeId: v || '' })}
                itemToStringLabel={(v: string | null) => {
                  const e = employees.find(emp => String(emp.id) === v)
                  return e ? `${e.firstName} ${e.lastName} - ${e.department?.name}` : ''
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un employé" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.firstName} {e.lastName} - {e.department?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label>Année</Label>
                <Input type="number" value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} />
              </div>
              <div className="flex-1 space-y-2">
                <Label>Mois</Label>
                <Select
                  value={formData.month || null}
                  onValueChange={(v) => setFormData({ ...formData, month: v || '' })}
                  itemToStringLabel={(v: string | null) => months.find(m => m.value === v)?.label || ''}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un mois" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingId ? 'Modifier' : 'Créer'}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm}>Annuler</Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-muted-foreground">Chargement...</p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/50">
                  <th className="h-11 px-5 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Employé</th>
                  <th className="h-11 px-5 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Département</th>
                  <th className="h-11 px-5 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Année</th>
                  <th className="h-11 px-5 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Mois</th>
                  <th className="h-11 px-5 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Planifié par</th>
                  <th className="h-11 px-5 text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {plannings.map((p) => (
                  <tr key={p.id} className="border-b border-border/30 transition-colors duration-150 hover:bg-muted/40">
                    <td className="p-4 px-5">{p.employee?.firstName} {p.employee?.lastName}</td>
                    <td className="p-4 px-5 text-muted-foreground">{p.employee?.department?.name}</td>
                    <td className="p-4 px-5">{p.year}</td>
                    <td className="p-4 px-5">{months.find((m) => m.value === String(p.month))?.label}</td>
                    <td className="p-4 px-5 text-sm text-muted-foreground">{p.plannedBy?.email}</td>
                    <td className="p-4 px-5 text-right">
                      <div className="flex gap-1 justify-end">
                        <Tooltip content="Modifier">
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(p)}>
                            <Pencil className="size-4" />
                          </Button>
                        </Tooltip>
                        <Tooltip content="Supprimer">
                          <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(p.id)} className="text-destructive hover:text-destructive">
                            <Trash2 className="size-4" />
                          </Button>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
                {plannings.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-4 px-5 text-center text-muted-foreground">Aucune planification</td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
