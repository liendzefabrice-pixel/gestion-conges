import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { PageHeader } from '../components/ui/page-header'
import { CalendarDays, Send, AlertCircle, CheckCircle2, Clock, UserCheck, Calendar, ArrowRight } from 'lucide-react'
import { cn } from '../lib/utils'

const WEEKEND_DAYS = [0, 6]

function addWorkingDays(from: Date, count: number): Date {
  const d = new Date(from)
  let added = 0
  while (added < count) {
    d.setDate(d.getDate() + 1)
    if (!WEEKEND_DAYS.includes(d.getDay())) {
      added++
    }
  }
  return d
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function MyCampaignPage() {
  const queryClient = useQueryClient()
  const [startDate, setStartDate] = useState('')
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['my-campaign-proposal'],
    queryFn: () => api.get('/leave-campaigns/my/proposal').then((r) => r.data),
  })

  const proposal = data?.proposal
  const campaign = data?.campaign
  const balance = data?.annualBalance
  const duration = balance?.available ?? 0

  const preview = useMemo(() => {
    if (!startDate || duration <= 0) return null
    const start = new Date(startDate + 'T00:00:00')
    const end = addWorkingDays(start, duration - 1)
    const returnD = addWorkingDays(end, 1)
    return { start, end, return: returnD }
  }, [startDate, duration])

  const submitMutation = useMutation({
    mutationFn: (data: { desiredStartDate: string; comment?: string }) =>
      api.post('/leave-campaigns/my/proposal', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-campaign-proposal'] })
      setStartDate('')
      setComment('')
      setError('')
      setConfirmed(false)
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Erreur lors de la soumission')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!confirmed) {
      setConfirmed(true)
      return
    }
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

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="size-5 text-primary" />
            Campagne en cours
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!campaign ? (
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
                  <p className="text-sm font-medium text-green-800">{campaign.label}</p>
                  <p className="text-xs text-green-600 mt-0.5">Année {campaign.year}</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  Ouverte
                </span>
              </div>

              {balance && (
                <div className="flex items-center gap-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-700">{balance.available}</p>
                    <p className="text-xs text-blue-600">jours disponibles</p>
                  </div>
                  <div className="text-sm text-blue-700 space-y-0.5">
                    <p>Acquis : {balance.acquired} j</p>
                    <p>Consommés : {balance.consumed} j</p>
                  </div>
                </div>
              )}

              {proposal ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <CheckCircle2 className="size-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Proposition soumise</p>
                      <p className="text-sm text-blue-700 mt-1">
                        Date souhaitée : {formatDate(new Date(proposal.desiredStartDate))}
                      </p>
                      {proposal.duration > 0 && (
                        <p className="text-sm text-blue-700 mt-1">Durée : {proposal.duration} jour(s)</p>
                      )}
                      {proposal.endDate && (
                        <p className="text-sm text-blue-700 mt-1">
                          Fin estimée : {formatDate(new Date(proposal.endDate))}
                        </p>
                      )}
                      {proposal.returnDate && (
                        <p className="text-sm text-blue-700 mt-1">
                          Reprise : {formatDate(new Date(proposal.returnDate))}
                        </p>
                      )}
                      {proposal.comment && (
                        <p className="text-sm text-blue-700 mt-1">Commentaire : {proposal.comment}</p>
                      )}
                      <p className="text-sm text-blue-700 mt-1">Statut : {
                        proposal.status === 'RECUE' ? 'Reçue' :
                        proposal.status === 'EN_ANALYSE' ? 'En analyse' :
                        proposal.status === 'ACCEPTEE' ? 'Acceptée' :
                        proposal.status === 'REPROGRAMMEE' ? 'Reprogrammée' :
                        proposal.status === 'REFUSEE' ? 'Refusée' : proposal.status
                      }</p>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 text-sm text-red-700 bg-red-50 rounded-xl border border-red-200">{error}</div>
                  )}

                  <div className="space-y-2">
                    <Label>Date de début souhaitée</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => { setStartDate(e.target.value); setConfirmed(false) }}
                      required
                    />
                  </div>

                  {preview && (
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                      <p className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-3">
                        <Calendar className="size-4" />
                        Récapitulatif de votre proposition
                      </p>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <UserCheck className="size-4" />
                          <span>Ancienneté</span>
                        </div>
                        <p className="font-medium text-gray-900">
                          {balance?.seniority || 'Calcul en cours...'}
                        </p>

                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="size-4" />
                          <span>Durée calculée</span>
                        </div>
                        <p className="font-medium text-gray-900">{duration} jour(s)</p>

                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="size-4" />
                          <span>Début</span>
                        </div>
                        <p className="font-medium text-gray-900">{formatDate(preview.start)}</p>

                        <div className="flex items-center gap-2 text-gray-600">
                          <ArrowRight className="size-4" />
                          <span>Fin estimée</span>
                        </div>
                        <p className="font-medium text-gray-900">{formatDate(preview.end)}</p>

                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="size-4" />
                          <span>Reprise estimée</span>
                        </div>
                        <p className="font-medium text-gray-900">{formatDate(preview.return)}</p>
                      </div>
                    </div>
                  )}

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

                  {confirmed && preview ? (
                    <div className="p-3 text-sm text-amber-800 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2">
                      <AlertCircle className="size-4 shrink-0 mt-0.5" />
                      <span>Confirmez-vous cette proposition ? Vous recevrez un accusé de réception après validation.</span>
                    </div>
                  ) : null}

                  <Button type="submit" disabled={submitMutation.isPending || !startDate}>
                    <Send className="size-4" />
                    {submitMutation.isPending ? 'Envoi...' :
                     confirmed ? 'Confirmer ma proposition' : 'Soumettre ma proposition'}
                  </Button>

                  {confirmed && (
                    <Button type="button" variant="ghost" onClick={() => setConfirmed(false)}>
                      Annuler
                    </Button>
                  )}
                </form>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}