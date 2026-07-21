import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { PageHeader } from '../components/ui/page-header'
import { CalendarDays, Send, AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '../lib/utils'

export default function MyCampaignPage() {
  const queryClient = useQueryClient()
  const [startDate, setStartDate] = useState('')
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['my-campaign-proposal'],
    queryFn: () => api.get('/leave-campaigns/my/proposal').then((r) => r.data),
  })

  const submitMutation = useMutation({
    mutationFn: (data: { desiredStartDate: string; comment?: string }) =>
      api.post('/leave-campaigns/my/proposal', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-campaign-proposal'] })
      setStartDate('')
      setComment('')
      setError('')
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Erreur lors de la soumission')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    submitMutation.mutate({ desiredStartDate: startDate, comment: comment || undefined })
  }

  if (isLoading) {
    return <p className="text-muted-foreground">Chargement...</p>
  }

  return (
    <div>
      <PageHeader
        title="Ma programmation annuelle"
        description="Soumettez votre proposition de congé annuel"
      />

      {/* Current campaign card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="size-5 text-primary" />
            Campagne en cours
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!data?.campaign ? (
            <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <AlertCircle className="size-5 text-yellow-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Aucune campagne ouverte</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Aucune campagne de programmation des congés n'est ouverte pour le moment. Revenez plus tard.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                <div>
                  <p className="text-sm font-medium text-green-800">{data.campaign.label}</p>
                  <p className="text-xs text-green-600 mt-0.5">Année {data.campaign.year}</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  Ouverte
                </span>
              </div>

              {/* Annual balance */}
              {data.annualBalance && (
                <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-700">{data.annualBalance.available}</p>
                    <p className="text-xs text-blue-600">jours disponibles</p>
                  </div>
                  <div className="text-sm text-blue-700 space-y-0.5">
                    <p>Acquis : {data.annualBalance.acquired} j</p>
                    <p>Consommés : {data.annualBalance.consumed} j</p>
                  </div>
                </div>
              )}

              {/* Existing proposal */}
              {data.proposal ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <CheckCircle2 className="size-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Proposition soumise</p>
                      <p className="text-sm text-blue-700 mt-1">
                        Date souhaitée : {new Date(data.proposal.desiredStartDate).toLocaleDateString('fr-FR')}
                      </p>
                      {data.proposal.comment && (
                        <p className="text-sm text-blue-700 mt-1">Commentaire : {data.proposal.comment}</p>
                      )}
                      <p className="text-sm text-blue-700 mt-1">Statut : {
                        data.proposal.status === 'RECUE' ? 'Reçue' :
                        data.proposal.status === 'EN_ANALYSE' ? 'En analyse' :
                        data.proposal.status === 'ACCEPTEE' ? 'Acceptée' :
                        data.proposal.status === 'REPROGRAMMEE' ? 'Reprogrammée' :
                        data.proposal.status === 'REFUSEE' ? 'Refusée' : data.proposal.status
                      }</p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Proposal form */
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 text-sm text-red-700 bg-red-50 rounded-xl border border-red-200">{error}</div>
                  )}
                  <div className="space-y-2">
                    <Label>Date de début souhaitée</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Commentaire (optionnel)</Label>
                    <textarea
                      className={cn(
                        'flex min-h-[80px] w-full rounded-xl border border-input bg-background px-3 py-2',
                        'text-sm ring-offset-background placeholder:text-muted-foreground',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1',
                        'disabled:cursor-not-allowed disabled:opacity-50 resize-none'
                      )}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Ajoutez un commentaire..."
                      maxLength={500}
                    />
                  </div>
                  <Button type="submit" disabled={submitMutation.isPending}>
                    <Send className="size-4 " />
                    {submitMutation.isPending ? 'Envoi...' : 'Soumettre ma proposition'}
                  </Button>
                </form>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
