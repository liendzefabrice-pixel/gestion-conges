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
import { Play, XCircle, ChevronDown, ChevronRight } from 'lucide-react'

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

export default function CampaignsPage() {
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [formData, setFormData] = useState({ year: String(new Date().getFullYear()), label: '' })
  const [error, setError] = useState('')
  const [expandedCampaign, setExpandedCampaign] = useState<number | null>(null)

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
    },
  })

  const { data: proposalsData, refetch: refetchProposals } = useQuery<any>({
    queryKey: ['campaign-proposals', expandedCampaign],
    queryFn: () => api.get(`/leave-campaigns/${expandedCampaign}/proposals`).then((r) => r.data),
    enabled: expandedCampaign !== null,
  })

  const updateProposalStatusMutation = useMutation({
    mutationFn: ({ proposalId, status }: { proposalId: number; status: string }) =>
      api.patch(`/leave-campaigns/proposals/${proposalId}/status`, { status }),
    onSuccess: () => {
      refetchProposals()
    },
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    createMutation.mutate({
      year: Number(formData.year),
      label: formData.label,
    })
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
                        )}>
                          {c.status === 'BROUILLON' ? 'Brouillon' : c.status === 'OUVERTE' ? 'Ouverte' : 'Clôturée'}
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
                                    <th className="h-10 px-4 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Solde</th>
                                    <th className="h-10 px-4 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Ancienneté</th>
                                    <th className="h-10 px-4 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground">Statut</th>
                                    <th className="h-10 px-4 text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {proposalsData.proposals.map((p: any) => (
                                    <tr key={p.id} className="bg-white border-b last:border-0 hover:bg-gray-50/50">
                                      <td className="p-3 px-4">
                                        {p.employee?.user?.firstName} {p.employee?.user?.lastName}
                                      </td>
                                      <td className="p-3 px-4 text-muted-foreground">{p.employee?.department?.name}</td>
                                      <td className="p-3 px-4">{new Date(p.desiredStartDate).toLocaleDateString('fr-FR')}</td>
                                      <td className="p-3 px-4">{p.annualBalance ?? '-'} j</td>
                                      <td className="p-3 px-4 text-muted-foreground">{p.seniority}</td>
                                      <td className="p-3 px-4">
                                        <span className={cn(
                                          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                                          proposalStatusColors[p.status] || 'bg-gray-100 text-gray-600',
                                        )}>
                                          {proposalStatusLabels[p.status] || p.status}
                                        </span>
                                      </td>
                                      <td className="p-3 px-4 text-right">
                                        <Select
                                          value={p.status}
                                          onValueChange={(v) => updateProposalStatusMutation.mutate({ proposalId: p.id, status: v })}
                                        >
                                          <SelectTrigger className="h-8 text-xs w-[130px]">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {Object.entries(proposalStatusLabels).map(([value, label]) => (
                                              <SelectItem key={value} value={value}>{label}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </td>
                                    </tr>
                                  ))}
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
    </div>
  )
}
