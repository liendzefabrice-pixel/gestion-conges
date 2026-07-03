import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { leaveRequestSchema, type LeaveRequestFormData } from '../lib/schemas'
import type { LeaveRequest, LeaveType } from '../types'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { Textarea } from '../components/ui/textarea'
import RequestDetailModal from '../components/RequestDetailModal'

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  PENDING: { label: 'En attente', variant: 'secondary' },
  RH_REVIEWED: { label: 'Examinée', variant: 'outline' },
  APPROVED: { label: 'Approuvée', variant: 'default' },
  REJECTED: { label: 'Refusée', variant: 'destructive' },
}

function NewLeaveForm({ onSuccess }: { onSuccess: () => void }) {
  const { data: leaveTypes } = useQuery<LeaveType[]>({
    queryKey: ['leave-types'],
    queryFn: () => api.get('/leave/types').then((r) => r.data),
  })
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<LeaveRequestFormData>({
    resolver: zodResolver(leaveRequestSchema),
  })

  const mutation = useMutation({
    mutationFn: (data: LeaveRequestFormData) =>
      api.post('/leave/requests', {
        leaveTypeId: Number(data.leaveTypeId),
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
      onSuccess()
    },
    onError: (err: any) => {
      setError(err.response?.data?.message?.[0] || err.response?.data?.message || 'Erreur lors de la soumission')
    },
  })

  const handleTypeChange = (value: string | null) => {
    setSelectedType(value ?? '')
    setValue('leaveTypeId', value ?? '')
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Nouvelle demande de congé</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-100 rounded">{error}</div>
          )}
          <div className="space-y-2">
            <Label>Type de congé</Label>
            <Select value={selectedType || null} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes?.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.leaveTypeId && <p className="text-sm text-red-600">{errors.leaveTypeId.message}</p>}
          </div>
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <Label>Date de début</Label>
              <Input type="date" {...register('startDate')} />
              {errors.startDate && <p className="text-sm text-red-600">{errors.startDate.message}</p>}
            </div>
            <div className="flex-1 space-y-2">
              <Label>Date de fin</Label>
              <Input type="date" {...register('endDate')} />
              {errors.endDate && <p className="text-sm text-red-600">{errors.endDate.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Motif</Label>
            <Textarea {...register('reason')} placeholder="Motif de la demande" />
            {errors.reason && <p className="text-sm text-red-600">{errors.reason.message}</p>}
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Soumission...' : 'Soumettre'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default function LeavePage() {
  const { user } = useAuth()
  const role = user?.role?.name
  const [showForm, setShowForm] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)

  const { data: requests = [], isLoading } = useQuery<LeaveRequest[]>({
    queryKey: ['leave-requests', role],
    queryFn: () => {
      const url = role === 'EMPLOYEE' ? '/leave/requests/my' : '/leave/requests'
      return api.get(url).then((r) => r.data)
    },
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Demandes de congé</h1>
        {role === 'EMPLOYEE' && (
          <Button onClick={() => setShowForm(!showForm)}>
            Nouvelle demande
          </Button>
        )}
      </div>

      {showForm && <NewLeaveForm onSuccess={() => setShowForm(false)} />}

      {isLoading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-sm font-medium text-left">Employé</th>
                  <th className="p-3 text-sm font-medium text-left">Type</th>
                  <th className="p-3 text-sm font-medium text-left">Période</th>
                  <th className="p-3 text-sm font-medium text-left">Jours</th>
                  <th className="p-3 text-sm font-medium text-left">Statut</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedRequest(r)}
                  >
                    <td className="p-3">{r.employee?.user?.email || 'N/A'}</td>
                    <td className="p-3">{r.leaveType?.name}</td>
                    <td className="p-3 text-sm">
                      {new Date(r.startDate).toLocaleDateString()} - {new Date(r.endDate).toLocaleDateString()}
                    </td>
                    <td className="p-3">{r.duration}</td>
                    <td className="p-3">
                      <Badge variant={statusConfig[r.status]?.variant}>
                        {statusConfig[r.status]?.label}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {selectedRequest && (
        <RequestDetailModal
          request={selectedRequest}
          type="leave"
          role={role || ''}
          onClose={() => setSelectedRequest(null)}
          onRefresh={() => {}}
        />
      )}
    </div>
  )
}
