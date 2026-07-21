import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import RequestDetailModal from '../components/RequestDetailModal'
import { permissionRequestSchema, type PermissionRequestFormData } from '../lib/schemas'
import type { PermissionRequest } from '../types'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { PageHeader } from '../components/ui/page-header'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../components/ui/table'
import { Label } from '../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { Loader2, AlertCircle, CheckCircle2, Filter } from 'lucide-react'

const statusConfig: Record<string, { label: string; variant: 'default' | 'warning' | 'success' | 'danger' | 'info' | 'secondary' | 'outline' }> = {
  EN_ATTENTE_RH: { label: 'En attente RH', variant: 'warning' },
  EN_ATTENTE_DIRECTION: { label: 'En attente Direction', variant: 'info' },
  AVIS_RH_RENDU: { label: 'Avis RH rendu', variant: 'info' },
  APPROUVE: { label: 'Approuvée', variant: 'success' },
  REFUSE: { label: 'Refusée', variant: 'danger' },
}

const permissionTypeLabels: Record<string, string> = {
  PERMISSION: 'Permission',
  MARIAGE: 'Mariage',
  NAISSANCE: 'Naissance',
  DECES: 'Décès',
  FAMILIAL: 'Événement familial',
}

function NewPermissionForm({ onSuccess }: { onSuccess: () => void }) {
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const [permissionType, setPermissionType] = useState('PERMISSION')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<PermissionRequestFormData>({
    resolver: zodResolver(permissionRequestSchema),
  })

  const mutation = useMutation({
    mutationFn: (data: PermissionRequestFormData) =>
      api.post('/permissions/requests', {
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason,
        permissionType,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permission-requests'] })
      onSuccess()
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message
      setError(Array.isArray(msg) ? msg[0] : msg || 'Erreur lors de la soumission')
    },
  })

  return (
    <Card className="mb-6 border-primary/20">
      <CardHeader>
        <CardTitle>Nouvelle demande de permission</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg mb-4 border border-red-200 flex items-start gap-2">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div className="space-y-2">
            <Label>Type de permission</Label>
            <Select value={permissionType} onValueChange={setPermissionType}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(permissionTypeLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <Label>Date de début</Label>
              <Input type="date" {...register('startDate')} />
              {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
            </div>
            <div className="flex-1 space-y-2">
              <Label>Date de fin</Label>
              <Input type="date" {...register('endDate')} />
              {errors.endDate && <p className="text-sm text-destructive">{errors.endDate.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Motif</Label>
            <Textarea {...register('reason')} placeholder="Motif de la demande" />
            {errors.reason && <p className="text-sm text-destructive">{errors.reason.message}</p>}
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <><Loader2 className="size-4 animate-spin " />Soumission...</> : 'Soumettre'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default function PermissionsPage() {
  const { user } = useAuth()
  const role = user?.role?.name
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<PermissionRequest | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [success, setSuccess] = useState('')

  const { data: requests = [], isLoading } = useQuery<PermissionRequest[]>({
    queryKey: ['permission-requests', role],
    queryFn: () => {
      const url = role === 'EMPLOYEE' ? '/permissions/requests/my' : '/permissions/requests'
      return api.get(url).then((r) => r.data)
    },
  })

  const filtered = useMemo(() => {
    if (!filterStatus) return requests
    return requests.filter((r) => r.status === filterStatus)
  }, [requests, filterStatus])

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['permission-requests'] })
    setSelectedRequest(null)
    setSuccess('Demande mise à jour avec succès')
    setTimeout(() => setSuccess(''), 5000)
  }

  return (
    <div>
      <PageHeader
        title="Demandes de permission"
        description="Gérez vos demandes de permission"
        actions={
          role === 'EMPLOYEE' && (
            <Button onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Fermer' : 'Nouvelle demande'}
            </Button>
          )
        }
      />

      {success && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="p-4 flex items-center gap-2 text-green-800">
            <CheckCircle2 className="size-5" />
            <span className="text-sm font-medium">{success}</span>
          </CardContent>
        </Card>
      )}

      {showForm && <NewPermissionForm onSuccess={() => setShowForm(false)} />}

      <div className="flex items-center gap-2 mb-4">
        <Filter className="size-4 text-muted-foreground shrink-0" />
        <Select value={filterStatus || null} onValueChange={(v) => setFilterStatus(v || '')}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tous les statuts</SelectItem>
            {Object.entries(statusConfig).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-auto">{requests.length} demande(s)</span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employé</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Période</TableHead>
              <TableHead>Jours</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id} className="cursor-pointer" onClick={() => setSelectedRequest(r)}>
                <TableCell>{r.employee?.user?.email || 'N/A'}</TableCell>
                <TableCell>{permissionTypeLabels[r.permissionType] || 'Permission'}</TableCell>
                <TableCell className="text-sm">
                  {new Date(r.startDate).toLocaleDateString('fr-FR')} - {new Date(r.endDate).toLocaleDateString('fr-FR')}
                </TableCell>
                <TableCell>{r.duration}</TableCell>
                <TableCell>
                  <Badge variant={statusConfig[r.status]?.variant}>
                    {statusConfig[r.status]?.label}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">Aucune demande</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      {selectedRequest && (
        <RequestDetailModal
          request={selectedRequest}
          type="permission"
          role={role || ''}
          onClose={() => setSelectedRequest(null)}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  )
}
