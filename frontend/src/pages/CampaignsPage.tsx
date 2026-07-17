import { useState, Fragment } from 'react'
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
import { Play, XCircle, ChevronDown, ChevronRight, CheckCircle2, AlertTriangle, CalendarClock, History, ThumbsUp, Pencil, X, Loader2, Archive, Settings, Calendar, FileText, Trash2 } from 'lucide-react'
import { toast } from '../components/Toast'

const proposalStatusLabels: Record<string, string> = {
  RECUE: 'Reçue',
  EN_ANALYSE: 'En analyse',
  ACCEPTEE: 'Acceptée',
  REPROGRAMMEE: 'Reprogrammée',
  REFUSEE: 'Refusée',
}

const proposalStatusColors: Record<string, string> = {
  RECUE: 'bg-blue-100 text-blue-700',
  EN_ANALYSE: 'bg-yellow-100 text-yellow-700',
  ACCEPTEE: 'bg-green-100 text-green-700',
  REPROGRAMMEE: 'bg-purple-100 text-purple-700',
  REFUSEE: 'bg-red-100 text-red-700',
}

const analysisDisplay: Record<string, { label: string; icon: any; className: string }> = {
  COMPATIBLE: { label: 'Compatible', icon: CheckCircle2, className: 'text-green-600 bg-green-50' },
  CONFLIT_DEPARTEMENT: { label: 'Conflit département', icon: AlertTriangle, className: 'text-red-600 bg-red-50' },
  PROPOSITION_AUTOMATIQUE: { label: 'Nouvelle période proposée', icon: CalendarClock, className: 'text-amber-600 bg-amber-50' },
  PENDING: { label: 'En attente...', icon: History, className: 'text-gray-500 bg-gray-50' },
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR')
}

export default function CampaignsPage() {
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [formData, setFormData] = useState({ year: String(new Date().getFullYear()), label: '', description: '', startDate: '', endDate: '' })
  const [editingCampaign, setEditingCampaign] = useState<any>(null)
  const [editForm, setEditForm] = useState({ label: '', description: '', startDate: '', endDate: '' })
  const [error, setError] = useState('')
  const [expandedCampaign, setExpandedCampaign] = useState<number | null>(null)
  const [selectedProposal, setSelectedProposal] = useState<any>(null)
  const [dropdownStatus, setDropdownStatus] = useState('')
  const [manualEdit, setManualEdit] = useState(false)
  const [manualStart, setManualStart] = useState('')
  const [manualEnd, setManualEnd] = useState('')

  const { data: campaigns = [], isLoading } = useQuery<any[]>({
    queryKey: ['leave-campaigns'],
    queryFn: () => api.get('/leave-campaigns').then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: { year: number; label: string }) =>
      api.post('/leave-campaigns', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-campaigns'] })
      setShowCreate(false)
      setFormData({ year: String(new Date().getFullYear()), label: '' })
      setError('')
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Erreur lors de la création')
    },
  })

  const openMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/leave-campaigns/${id}/open`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-campaigns'] })
    },
  })

  const closeMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/leave-campaigns/${id}/close`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-campaigns'] })
      toast('Campagne clôturée avec succès', 'success')
    },
  })

  const archiveMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/leave-campaigns/${id}/archive`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-campaigns'] })
      toast('Campagne archivée avec succès', 'success')
    },
  })

  const [campaignToDelete, setCampaignToDelete] = useState<any | null>(null)

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/leave-campaigns/${id}`),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['leave-campaigns'] })
      setCampaignToDelete(null)
      toast(res.data?.message || 'Campagne supprimée avec succès', 'success')
    },
    onError: (err: any) => {
      toast(err?.response?.data?.message || 'Erreur lors de la suppression', 'error')
    },
  })

  const updateCampaignMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number; label?: string; description?: string; startDate?: string; endDate?: string }) =>
      api.patch(`/leave-campaigns/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-campaigns'] })
      setEditingCampaign(null)
      toast('Campagne modifiée avec succès', 'success')
    },
    onError: (err: any) => {
      toast(err?.response?.data?.message || 'Erreur lors de la modification', 'error')
    },
  })

  const { data: proposalsData, refetch: refetchProposals } = useQuery<any>({
    queryKey: ['campaign-proposals', expandedCampaign],
    queryFn: () => api.get(`/leave-campaigns/${expandedCampaign}/proposals`).then((r) => r.data),
    enabled: expandedCampaign !== null,
  })

  const updateProposalStatusMutation = useMutation({
    mutationFn: ({ proposalId, ...body }: { proposalId: number; status: string; newStartDate?: string; newEndDate?: string }) =>
      api.patch(`/leave-campaigns/proposals/${proposalId}/status`, body),
    onSuccess: () => {
      refetchProposals()
      setSelectedProposal(null)
      setManualEdit(false)
    },
    onError: (err: any) => {
      toast(err?.response?.data?.message || 'Erreur lors de la mise à jour du statut', 'error')
    },
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    createMutation.mutate({
      year: Number(formData.year),
      label: formData.label,
      description: formData.description || undefined,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
    })
  }

  const getConstraint = (p: any): { type: 'none' | 'dept' | 'event'; label: string } => {
    const details = p.analysisDetails as any
    if (!details?.results) return { type: 'none', label: 'En attente...' }
    const deptConflict = details.results.find((r: any) => r.ruleName === 'DeptConflictRule' && r.status === 'CONFLIT_DEPARTEMENT')
    if (deptConflict) {
      const name = deptConflict.details?.conflictingEmployee
      return { type: 'dept', label: name ? `Conflit ${name}` : 'Conflit département' }
    }
    const eventConflict = details.results.find((r: any) => r.ruleName === 'InternalEventConflictRule' && r.status === 'CONFLIT_DEPARTEMENT')
    if (eventConflict) {
      const names = eventConflict.details?.eventNames
      return { type: 'event', label: names?.[0] || 'Événement interne' }
    }
    return { type: 'none', label: 'Aucune' }
  }

  return (
    <div>
      <PageHeader
        title="Campagnes de congés"
        description="Gérez les campagnes annuelles de programmation des congés"
        actions={
          <Button onClick={() => setShowCreate(true)}>
            Nouvelle campagne
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-5 text-muted-foreground">Chargement...</p>
          ) : campaigns.length === 0 ? (
            <p className="p-5 text-muted-foreground">Aucune campagne créée</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/50">
                  <th className="h-11 px-5 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Année</th>
                  <th className="h-11 px-5 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Libellé</th>
                  <th className="h-11 px-5 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Statut</th>
                  <th className="h-11 px-5 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Propositions</th>
                  <th className="h-11 px-5 text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c: any) => (
                  <Fragment key={c.id}>
                    <tr
                      className="border-b border-border/30 transition-colors duration-150 hover:bg-muted/40 cursor-pointer"
                      onClick={() => setExpandedCampaign(expandedCampaign === c.id ? null : c.id)}
                    >
                      <td className="p-4 px-5 font-medium">{c.year}</td>
                      <td className="p-4 px-5">{c.label}</td>
                      <td className="p-4 px-5">
                        <span className={cn(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          c.status === 'BROUILLON' && 'bg-gray-100 text-gray-600',
                          c.status === 'OUVERTE' && 'bg-green-100 text-green-700',
                          c.status === 'CLOTUREE' && 'bg-blue-100 text-blue-700',
                          c.status === 'ARCHIVEE' && 'bg-purple-100 text-purple-700',
                        )}>
                          {c.status === 'BROUILLON' ? 'Brouillon' : c.status === 'OUVERTE' ? 'Ouverte' : c.status === 'CLOTUREE' ? 'Clôturée' : 'Archivée'}
                        </span>
                      </td>
                      <td className="p-4 px-5 text-muted-foreground">{c._count?.proposals ?? 0}</td>
                      <td className="p-4 px-5 text-right">
                        <div className="flex gap-1 justify-end items-center">
                          {c.status === 'BROUILLON' && (
                            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); openMutation.mutate(c.id) }}>
                              <Play className="size-3.5 mr-1.5" />
                              Ouvrir
                            </Button>
                          )}
                          {c.status === 'OUVERTE' && (
                            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); closeMutation.mutate(c.id) }}>
                              <XCircle className="size-3.5 mr-1.5" />
                              Clôturer
                            </Button>
                          )}
                          {c.status === 'CLOTUREE' && (
                            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); archiveMutation.mutate(c.id) }}>
                              <Archive className="size-3.5 mr-1.5" />
                              Archiver
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setCampaignToDelete(c) }}>
                            <Trash2 className="size-3.5" />
                          </Button>
                          {c.status !== 'ARCHIVEE' && (
                            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditingCampaign(c); setEditForm({ label: c.label, description: c.description || '', startDate: c.startDate ? c.startDate.slice(0,10) : '', endDate: c.endDate ? c.endDate.slice(0,10) : '' }) }}>
                              <Settings className="size-3.5" />
                            </Button>
                          )}
                          {expandedCampaign === c.id ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
                        </div>
                      </td>
                    </tr>
                    {expandedCampaign === c.id && proposalsData && (
                      <tr key={`${c.id}-proposals`}>
                        <td colSpan={5} className="p-0 bg-gray-50">
                          <div className="p-4">
                            <h4 className="text-sm font-semibold mb-3">
                              Propositions ({proposalsData.proposals?.length ?? 0})
                            </h4>
                            {proposalsData.proposals?.length === 0 ? (
                              <p className="text-sm text-muted-foreground">Aucune proposition soumise</p>
                            ) : (
                              <table className="w-full text-sm border rounded-lg overflow-hidden">
                                <thead>
                                  <tr className="bg-white border-b">
                                    <th className="h-10 px-4 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Employé</th>
                                    <th className="h-10 px-4 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Département</th>
                                    <th className="h-10 px-4 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Date souhaitée</th>
                                    <th className="h-10 px-4 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Analyse</th>
                                    <th className="h-10 px-4 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Contrainte</th>
                                    <th className="h-10 px-4 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Statut</th>
                                    <th className="h-10 px-4 text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {proposalsData.proposals.map((p: any) => {
                                    const analysis = analysisDisplay[p.analysisStatus] || analysisDisplay.PENDING
                                    const Icon = analysis.icon
                                    const constraint = getConstraint(p)
                                    return (
                                      <tr
                                        key={p.id}
                                        className="bg-white border-b last:border-0 hover:bg-gray-50/50 cursor-pointer"
                                        onClick={() => { setSelectedProposal(p); setManualEdit(false); setDropdownStatus(p.status) }}
                                      >
                                        <td className="p-3 px-4 font-medium">
                                          {p.employee?.user?.firstName} {p.employee?.user?.lastName}
                                        </td>
                                        <td className="p-3 px-4 text-muted-foreground">{p.employee?.department?.name}</td>
                                        <td className="p-3 px-4">{formatDate(p.desiredStartDate)}</td>
                                        <td className="p-3 px-4">
                                          <div className="flex items-center gap-1.5">
                                            <Icon className={cn('size-4', analysis.className.split(' ')[0])} />
                                            <span className="text-xs">{analysis.label}</span>
                                          </div>
                                        </td>
                                        <td className="p-3 px-4">
                                          <span className={cn(
                                            'text-xs',
                                            constraint.type === 'none' && 'text-green-600',
                                            constraint.type === 'dept' && 'text-red-600',
                                            constraint.type === 'event' && 'text-amber-600',
                                          )}>
                                            {constraint.label}
                                          </span>
                                        </td>
                                        <td className="p-3 px-4">
                                          <span className={cn(
                                            'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                                            proposalStatusColors[p.status] || 'bg-gray-100 text-gray-600',
                                          )}>
                                            {proposalStatusLabels[p.status] || p.status}
                                          </span>
                                        </td>
                                        <td className="p-3 px-4 text-right">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={(e) => { e.stopPropagation(); setSelectedProposal(p); setManualEdit(false) }}
                                          >
                                            Détails
                                          </Button>
                                        </td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Proposal detail modal */}
      <Dialog open={!!selectedProposal} onOpenChange={(o) => { if (!o) { setSelectedProposal(null); setManualEdit(false) } }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détail de la proposition</DialogTitle>
          </DialogHeader>
          {selectedProposal && (
            <div className="space-y-5">
              {/* Employee info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Employé</p>
                  <p className="text-sm font-medium mt-0.5">
                    {selectedProposal.employee?.user?.firstName} {selectedProposal.employee?.user?.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Département</p>
                  <p className="text-sm font-medium mt-0.5">{selectedProposal.employee?.department?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Date souhaitée</p>
                  <p className="text-sm font-medium mt-0.5">{formatDate(selectedProposal.desiredStartDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Durée</p>
                  <p className="text-sm font-medium mt-0.5">{selectedProposal.duration} jour{selectedProposal.duration > 1 ? 's' : ''}</p>
                </div>
              </div>

              {/* Analysis */}
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="size-4 text-amber-500" />
                  Analyse automatique
                </h4>
                {selectedProposal.analysisDetails?.results?.map((r: any, i: number) => (
                  <div key={i} className={cn(
                    'flex items-start gap-3 p-3 rounded-xl border mb-2',
                    r.status === 'CONFLIT_DEPARTEMENT' && 'bg-red-50 border-red-200',
                    r.status === 'PROPOSITION_AUTOMATIQUE' && 'bg-amber-50 border-amber-200',
                    r.status === 'COMPATIBLE' && 'bg-green-50 border-green-200',
                  )}>
                    {r.status === 'CONFLIT_DEPARTEMENT' ? <AlertTriangle className="size-5 text-red-500 shrink-0 mt-0.5" /> :
                     r.status === 'PROPOSITION_AUTOMATIQUE' ? <CalendarClock className="size-5 text-amber-500 shrink-0 mt-0.5" /> :
                     <CheckCircle2 className="size-5 text-green-500 shrink-0 mt-0.5" />}
                    <div>
                      <p className="text-sm font-medium">{r.message}</p>
                      {r.suggestedStartDate && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Période suggérée : {formatDate(String(r.suggestedStartDate))} → {r.suggestedEndDate ? formatDate(String(r.suggestedEndDate)) : ''}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {(!selectedProposal.analysisDetails?.results || selectedProposal.analysisDetails.results.length === 0) && (
                  <p className="text-sm text-muted-foreground">Analyse non disponible</p>
                )}
              </div>

              {/* Actions */}
              {selectedProposal.analysisStatus === 'PROPOSITION_AUTOMATIQUE' && !manualEdit && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Actions RH</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={updateProposalStatusMutation.isPending}
                      onClick={() => updateProposalStatusMutation.mutate({
                        proposalId: selectedProposal.id,
                        status: 'ACCEPTEE',
                        newStartDate: String(selectedProposal.suggestedStartDate),
                        newEndDate: String(selectedProposal.suggestedEndDate),
                      })}
                    >
                      {updateProposalStatusMutation.isPending ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <ThumbsUp className="size-4 mr-1.5" />}
                      Valider la proposition du moteur
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updateProposalStatusMutation.isPending}
                      onClick={() => {
                        setManualEdit(true)
                        setManualStart(String(selectedProposal.suggestedStartDate).slice(0, 10))
                        setManualEnd(String(selectedProposal.suggestedEndDate).slice(0, 10))
                      }}
                    >
                      <Pencil className="size-4 mr-1.5" />
                      Modifier manuellement
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updateProposalStatusMutation.isPending}
                      className="text-destructive border-destructive/30 hover:bg-red-50"
                      onClick={() => updateProposalStatusMutation.mutate({ proposalId: selectedProposal.id, status: 'REFUSEE' })}
                    >
                      {updateProposalStatusMutation.isPending ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <X className="size-4 mr-1.5" />}
                      Refuser
                    </Button>
                  </div>
                </div>
              )}

              {manualEdit && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Modification manuelle</h4>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="space-y-1">
                      <Label>Nouvelle date de début</Label>
                      <Input type="date" value={manualStart} onChange={(e) => setManualStart(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label>Nouvelle date de fin</Label>
                      <Input type="date" value={manualEnd} onChange={(e) => setManualEnd(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={updateProposalStatusMutation.isPending}
                      onClick={() => updateProposalStatusMutation.mutate({
                        proposalId: selectedProposal.id,
                        status: 'ACCEPTEE',
                        newStartDate: manualStart,
                        newEndDate: manualEnd,
                      })}
                    >
                      {updateProposalStatusMutation.isPending && <Loader2 className="size-4 mr-1.5 animate-spin" />}
                      Valider
                    </Button>
                    <Button size="sm" variant="outline" disabled={updateProposalStatusMutation.isPending} onClick={() => setManualEdit(false)}>
                      Annuler
                    </Button>
                  </div>
                </div>
              )}

              {selectedProposal.analysisStatus === 'COMPATIBLE' && selectedProposal.status === 'RECUE' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={updateProposalStatusMutation.isPending}
                    onClick={() => updateProposalStatusMutation.mutate({ proposalId: selectedProposal.id, status: 'ACCEPTEE' })}
                  >
                    {updateProposalStatusMutation.isPending ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <ThumbsUp className="size-4 mr-1.5" />}
                    Accepter
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={updateProposalStatusMutation.isPending}
                    className="text-destructive border-destructive/30 hover:bg-red-50"
                    onClick={() => updateProposalStatusMutation.mutate({ proposalId: selectedProposal.id, status: 'REFUSEE' })}
                  >
                    {updateProposalStatusMutation.isPending ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <X className="size-4 mr-1.5" />}
                    Refuser
                  </Button>
                </div>
              )}

              {/* History */}
              {selectedProposal.analysisLogs?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                    <History className="size-4 text-muted-foreground" />
                    Historique
                  </h4>
                  <div className="space-y-2">
                    {selectedProposal.analysisLogs.map((log: any) => (
                      <div key={log.id} className="flex items-start gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-primary/40 mt-1.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                          <p className="text-sm truncate">{log.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Current status update */}
              <div className="flex items-center gap-3 pt-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground">Modifier le statut :</p>
                <Select
                  value={dropdownStatus}
                  onValueChange={(v) => {
                    setDropdownStatus(v)
                    updateProposalStatusMutation.mutate({ proposalId: selectedProposal.id, status: v })
                  }}
                >
                  <SelectTrigger className="h-8 text-xs w-[150px]">
                    <SelectValue>{proposalStatusLabels[dropdownStatus] || dropdownStatus}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(proposalStatusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create campaign dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle campagne</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            {error && <div className="p-3 text-sm text-red-700 bg-red-50 rounded-xl border border-red-200">{error}</div>}
            <div className="space-y-2">
              <Label>Année</Label>
              <Input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                required
                min={2020}
              />
            </div>
            <div className="space-y-2">
              <Label>Libellé</Label>
              <Input
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="Campagne 2026"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <textarea
                className={cn('flex min-h-[60px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1 resize-none')}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description facultative"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date de début</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Date de fin</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                Créer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!campaignToDelete} onOpenChange={(o) => { if (!o) setCampaignToDelete(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Êtes-vous sûr de vouloir supprimer la campagne <strong>{campaignToDelete?.label}</strong> ({campaignToDelete?.year}) ?
            Cette action supprimera également toutes les propositions associées et est irréversible.
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCampaignToDelete(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(campaignToDelete.id)}
            >
              {deleteMutation.isPending ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Trash2 className="size-4 mr-1.5" />}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit campaign dialog */}
      <Dialog open={!!editingCampaign} onOpenChange={(o) => { if (!o) setEditingCampaign(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la campagne</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Libellé</Label>
              <Input
                value={editForm.label}
                onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <textarea
                className={cn('flex min-h-[60px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1 resize-none')}
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date de début</Label>
                <Input
                  type="date"
                  value={editForm.startDate}
                  onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Date de fin</Label>
                <Input
                  type="date"
                  value={editForm.endDate}
                  onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingCampaign(null)}>
                Annuler
              </Button>
              <Button
                onClick={() => updateCampaignMutation.mutate({
                  id: editingCampaign.id,
                  label: editForm.label,
                  description: editForm.description || undefined,
                  startDate: editForm.startDate || undefined,
                  endDate: editForm.endDate || undefined,
                })}
                disabled={updateCampaignMutation.isPending}
              >
                Enregistrer
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
