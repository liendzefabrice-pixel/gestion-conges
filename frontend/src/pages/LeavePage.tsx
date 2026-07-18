import { useState, useEffect, useRef, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { leaveRequestSchema, type LeaveRequestFormData } from '../lib/schemas'
import type { LeaveRequest, LeaveType, LeaveEligibility, WorkingDaysResult } from '../types'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { PageHeader } from '../components/ui/page-header'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { Textarea } from '../components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog'
import RequestDetailModal from '../components/RequestDetailModal'
import Tooltip from '../components/ui/tooltip'
import { Calendar, Filter, Loader2, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react'

const months = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'warning' | 'success' | 'danger' | 'info'; color: string }> = {
  BROUILLON: { label: 'Brouillon', variant: 'default', color: 'text-gray-500 bg-gray-100' },
  EN_ATTENTE_RH: { label: 'En attente RH', variant: 'warning', color: 'text-amber-700 bg-amber-100' },
  EN_ATTENTE_DIRECTION: { label: 'En attente Direction', variant: 'info', color: 'text-blue-700 bg-blue-100' },
  AVIS_RH_RENDU: { label: 'Avis RH rendu', variant: 'info', color: 'text-indigo-700 bg-indigo-100' },
  APPROUVE: { label: 'Approuvé', variant: 'success', color: 'text-green-700 bg-green-100' },
  REFUSE: { label: 'Refusé', variant: 'danger', color: 'text-red-700 bg-red-100' },
  ANNULE: { label: 'Annulé', variant: 'outline', color: 'text-gray-500 bg-gray-100' },
}

function NewLeaveForm({ onSuccess }: { onSuccess: () => void }) {
  const { data: leaveTypes } = useQuery<LeaveType[]>({
    queryKey: ['leave-types'],
    queryFn: () => api.get('/leave/types').then((r) => r.data),
  })
  const { data: eligibility } = useQuery<LeaveEligibility>({
    queryKey: ['leave-eligibility'],
    queryFn: () => api.get('/leave-planning/eligibility').then((r) => r.data),
  })
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [calcResult, setCalcResult] = useState<WorkingDaysResult | null>(null)
  const [calcLoading, setCalcLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<LeaveRequestFormData>({
    resolver: zodResolver(leaveRequestSchema),
  })

  const startDate = watch('startDate')
  const endDate = watch('endDate')

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!startDate || !endDate) {
      setCalcResult(null)
      return
    }
    if (new Date(endDate) < new Date(startDate)) {
      setCalcResult(null)
      return
    }
    setCalcLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get('/leave/calculate', { params: { startDate, endDate } })
        setCalcResult(res.data)
      } catch {
        setCalcResult(null)
      } finally {
        setCalcLoading(false)
      }
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [startDate, endDate])

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
      const msg = err.response?.data?.message
      setError(Array.isArray(msg) ? msg[0] : msg || 'Erreur lors de la soumission')
    },
  })

  const handleTypeChange = (value: string | null) => {
    setSelectedType(value ?? '')
    const leaveType = leaveTypes?.find(t => t.name === value)
    if (leaveType) {
      setValue('leaveTypeId', String(leaveType.id))
    } else {
      setValue('leaveTypeId', '')
    }
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  return (
    <Card className="mb-6 border-primary/20">
      <CardHeader>
        <CardTitle>Nouvelle demande de congé</CardTitle>
      </CardHeader>
      <CardContent>
        {eligibility && (
          <div className={`mb-4 p-4 rounded-xl border text-sm ${eligibility.eligible ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
            <p className={`font-medium ${eligibility.eligible ? 'text-green-800' : 'text-amber-800'}`}>
              {eligibility.eligible ? '✅ Vous êtes éligible aux congés' : '❌ Vous n\'êtes pas encore éligible (ancienneté < 1 an)'}
            </p>
            {eligibility.planning && (
              <p className="text-amber-700 mt-1">
                Mois planifié : {months[eligibility.planning.month]} {eligibility.planning.year}
              </p>
            )}
          </div>
        )}
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-50 rounded-xl border border-red-200 flex items-start gap-2">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          <div className="space-y-2">
            <Label>Type de congé</Label>
            <Select value={selectedType || null} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes?.map((t) => (
                  <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.leaveTypeId && <p className="text-sm text-destructive">{errors.leaveTypeId.message}</p>}
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

          {calcResult && (
            <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-sm space-y-1">
              <p className="font-semibold text-green-800 mb-2">Résumé du calcul</p>
              <p className="text-green-700">
                Période : {formatDate(calcResult.startDate)} → {formatDate(calcResult.endDate)}
              </p>
              <div className="flex gap-6 text-green-700 flex-wrap">
                <span>Jours calendaires : <strong>{calcResult.calendarDays}</strong></span>
                <span>Dimanches exclus : <strong>{calcResult.sundays}</strong></span>
                <span>Jours fériés exclus : <strong>{calcResult.holidaysExcluded}</strong></span>
              </div>
              <div className="pt-2 mt-2 border-t border-green-200">
                <span className="text-green-800 font-medium">Jours ouvrables : <strong>{calcResult.workingDays}</strong></span>
              </div>
            </div>
          )}

          {calcLoading && (
            <div className="p-3 text-sm text-muted-foreground bg-muted/30 rounded-xl border border-border flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Calcul en cours...
            </div>
          )}

          <div className="space-y-2">
            <Label>Motif</Label>
            <Textarea {...register('reason')} placeholder="Motif de la demande" />
            {errors.reason && <p className="text-sm text-destructive">{errors.reason.message}</p>}
          </div>
          <Button type="submit" disabled={isSubmitting || calcLoading}>
            {isSubmitting ? (
              <><Loader2 className="size-4 animate-spin mr-2" />Soumission...</>
            ) : 'Soumettre la demande'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default function LeavePage() {
  const { user } = useAuth()
  const role = user?.role?.name
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [page, setPage] = useState(1)
  const [success, setSuccess] = useState('')

  const { data: requestsData, isLoading } = useQuery({
    queryKey: ['leave-requests', role, page],
    queryFn: () => {
      if (role === 'EMPLOYEE') {
        return api.get('/leave/requests/my').then((r) => ({ data: r.data, total: r.data.length, page: 1, pageSize: r.data.length, totalPages: 1 }))
      }
      return api.get('/leave/requests', { params: { page, pageSize: 20 } }).then((r) => r.data)
    },
  })

  const requests = useMemo(() => {
    const items = requestsData?.data || []
    if (!filterStatus) return items
    return items.filter((r: LeaveRequest) => r.status === filterStatus)
  }, [requestsData, filterStatus])

  const statusOptions = Object.entries(statusConfig).filter(([key]) => {
    if (role === 'EMPLOYEE') return true
    if (role === 'HR') return ['EN_ATTENTE_RH', 'EN_ATTENTE_DIRECTION', 'AVIS_RH_RENDU', 'APPROUVE', 'REFUSE', 'ANNULE'].includes(key)
    if (role === 'DIRECTOR' || role === 'ADMIN') return ['EN_ATTENTE_DIRECTION', 'APPROUVE', 'REFUSE', 'ANNULE', 'EN_ATTENTE_RH', 'AVIS_RH_RENDU'].includes(key)
    return true
  })

  const [requestToDelete, setRequestToDelete] = useState<LeaveRequest | null>(null)

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/leave/requests/${id}`),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
      setRequestToDelete(null)
      setSelectedRequest(null)
      toast(res.data?.message || 'Demande supprimée avec succès', 'success')
    },
    onError: (err: any) => {
      toast(err?.response?.data?.message || 'Erreur lors de la suppression', 'error')
    },
  })

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['leave-requests'] })
    queryClient.invalidateQueries({ queryKey: ['balances'] })
    setSelectedRequest(null)
    setSuccess('Demande mise à jour avec succès')
    setTimeout(() => setSuccess(''), 5000)
  }

  return (
    <div>
      <PageHeader
        title="Demandes de congé"
        description="Consultez et gérez les demandes de congé"
        actions={
          role === 'EMPLOYEE' && (
            <Button onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Fermer le formulaire' : 'Nouvelle demande'}
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

      {showForm && role === 'EMPLOYEE' && <NewLeaveForm onSuccess={() => { setShowForm(false); handleRefresh() }} />}

      <div className="flex items-center gap-2 mb-4">
        <Filter className="size-4 text-muted-foreground shrink-0" />
        <Select value={filterStatus || null} onValueChange={(v) => setFilterStatus(v || '')}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tous les statuts</SelectItem>
            {statusOptions.map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {requestsData && (
          <span className="text-sm text-muted-foreground ml-auto">
            {requestsData.total || 0} demande(s)
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/50">
                  <th className="h-11 px-5 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Employé</th>
                  <th className="h-11 px-5 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Type</th>
                  <th className="h-11 px-5 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Période</th>
                  <th className="h-11 px-5 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Jours</th>
                  <th className="h-11 px-5 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Retour</th>
                  <th className="h-11 px-5 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Statut</th>
                  {(role === 'HR' || role === 'ADMIN') && (
                    <th className="h-11 px-5 text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {requests.map((r: LeaveRequest) => (
                  <tr
                    key={r.id}
                    className="border-b border-border/30 transition-colors duration-150 hover:bg-muted/40 cursor-pointer"
                    onClick={() => setSelectedRequest(r)}
                  >
                    <td className="p-4 px-5">{r.employee?.user?.email || 'N/A'}</td>
                    <td className="p-4 px-5">{r.leaveType?.name}</td>
                    <td className="p-4 px-5 text-sm">
                      {new Date(r.startDate).toLocaleDateString('fr-FR')} - {new Date(r.endDate).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="p-4 px-5">{r.duration}</td>
                    <td className="p-4 px-5 text-sm">
                      {r.returnDate ? new Date(r.returnDate).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="p-4 px-5">
                      <Badge variant={statusConfig[r.status]?.variant}>
                        {statusConfig[r.status]?.label}
                      </Badge>
                    </td>
                    {(role === 'HR' || role === 'ADMIN') && (
                      <td className="p-4 px-5 text-right">
                        <Tooltip content="Supprimer">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={(e) => { e.stopPropagation(); setRequestToDelete(r) }}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </Tooltip>
                      </td>
                    )}
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr>
                    <td colSpan={role === 'HR' || role === 'ADMIN' ? 7 : 6} className="p-4 px-5 text-center text-muted-foreground">Aucune demande</td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {requestsData && requestsData.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage(Math.max(1, page - 1))}>
            Précédent
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {requestsData.page} / {requestsData.totalPages}
          </span>
          <Button variant="ghost" size="sm" disabled={page >= requestsData.totalPages} onClick={() => setPage(Math.min(requestsData.totalPages, page + 1))}>
            Suivant
          </Button>
        </div>
      )}

      {/* Delete confirmation */}
      <Dialog open={!!requestToDelete} onOpenChange={(o) => { if (!o) setRequestToDelete(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Êtes-vous sûr de vouloir supprimer la demande de congé de <strong>{requestToDelete?.employee?.user?.firstName} {requestToDelete?.employee?.user?.lastName}</strong> ?
            Cette action est irréversible.
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRequestToDelete(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(requestToDelete!.id)}
            >
              {deleteMutation.isPending ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Trash2 className="size-4 mr-1.5" />}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedRequest && (
        <RequestDetailModal
          request={selectedRequest}
          type="leave"
          role={role || ''}
          onClose={() => setSelectedRequest(null)}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  )
}
