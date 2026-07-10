import { useState, useEffect, useRef } from 'react'
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
import RequestDetailModal from '../components/RequestDetailModal'
import { Calendar, Filter } from 'lucide-react'

const months = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'warning' | 'success' | 'danger' | 'info'; color: string }> = {
  BROUILLON: { label: 'Brouillon', variant: 'default', color: 'text-gray-500 bg-gray-100' },
  EN_ATTENTE_RH: { label: 'En attente RH', variant: 'warning', color: 'text-amber-700 bg-amber-100' },
  AVIS_RH_RENDU: { label: 'Avis RH rendu', variant: 'info', color: 'text-blue-700 bg-blue-100' },
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
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Nouvelle demande de congé</CardTitle>
      </CardHeader>
      <CardContent>
        {eligibility && (
          <div className="mb-4 p-4 rounded-xl bg-blue-50 border border-blue-200 text-sm">
            <p className="font-medium text-blue-800">
              Éligibilité : {eligibility.eligible ? '✅ Éligible' : '❌ Non éligible (ancienneté < 1 an)'}
            </p>
            {eligibility.planning && (
              <p className="text-blue-700 mt-1">
                Mois planifié : {months[eligibility.planning.month]} {eligibility.planning.year}
              </p>
            )}
          </div>
        )}
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-50 rounded-xl border border-red-200">{error}</div>
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
              <div className="flex gap-6 text-green-700">
                <span>Jours calendaires : <strong>{calcResult.calendarDays}</strong></span>
                <span>Dimanches exclus : <strong>{calcResult.sundays}</strong></span>
                <span>Jours fériés exclus : <strong>{calcResult.holidaysExcluded}</strong></span>
              </div>
              <div className="pt-2 mt-2 border-t border-green-200">
                <span className="text-green-800 font-medium">Jours ouvrables déduits : <strong>{calcResult.workingDays}</strong></span>
              </div>
            </div>
          )}

          {calcLoading && (
            <div className="p-3 text-sm text-muted-foreground bg-muted/30 rounded-xl border border-border">
              Calcul en cours...
            </div>
          )}

          <div className="space-y-2">
            <Label>Motif</Label>
            <Textarea {...register('reason')} placeholder="Motif de la demande" />
            {errors.reason && <p className="text-sm text-destructive">{errors.reason.message}</p>}
          </div>
          <Button type="submit" disabled={isSubmitting || calcLoading}>
            {isSubmitting ? 'Soumission...' : 'Soumettre la demande'}
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
  const [filterStatus, setFilterStatus] = useState<string>('')

  const { data: requests = [], isLoading } = useQuery<LeaveRequest[]>({
    queryKey: ['leave-requests', role],
    queryFn: () => {
      const url = role === 'EMPLOYEE' ? '/leave/requests/my' : '/leave/requests'
      return api.get(url).then((r) => r.data)
    },
  })

  const filtered = filterStatus ? requests.filter((r) => r.status === filterStatus) : requests

  const statusOptions = Object.entries(statusConfig).filter(([key]) => {
    if (role === 'EMPLOYEE') return true
    if (role === 'HR') return ['EN_ATTENTE_RH', 'AVIS_RH_RENDU', 'APPROUVE', 'REFUSE', 'ANNULE'].includes(key)
    if (role === 'DIRECTOR' || role === 'ADMIN') return ['AVIS_RH_RENDU', 'APPROUVE', 'REFUSE', 'ANNULE', 'EN_ATTENTE_RH'].includes(key)
    return true
  })

  return (
    <div>
      <PageHeader
        title="Demandes de congé"
        description="Consultez et gérez les demandes de congé"
        actions={
          role === 'EMPLOYEE' && (
            <Button onClick={() => setShowForm(!showForm)}>
              Nouvelle demande
            </Button>
          )
        }
      />

      {showForm && <NewLeaveForm onSuccess={() => setShowForm(false)} />}

      {role !== 'EMPLOYEE' && (
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
        </div>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Chargement...</p>
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
                  <th className="h-11 px-5 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border/30 transition-colors duration-150 hover:bg-muted/40 cursor-pointer"
                    onClick={() => setSelectedRequest(r)}
                  >
                    <td className="p-4 px-5">{r.employee?.user?.email || 'N/A'}</td>
                    <td className="p-4 px-5">{r.leaveType?.name}</td>
                    <td className="p-4 px-5 text-sm">
                      {new Date(r.startDate).toLocaleDateString()} - {new Date(r.endDate).toLocaleDateString()}
                    </td>
                    <td className="p-4 px-5">{r.duration}</td>
                    <td className="p-4 px-5">
                      <Badge variant={statusConfig[r.status]?.variant}>
                        {statusConfig[r.status]?.label}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-4 px-5 text-center text-muted-foreground">Aucune demande</td>
                  </tr>
                )}
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
