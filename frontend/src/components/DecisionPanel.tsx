import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import api from '../services/api'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { cn } from '../lib/utils'
import { CheckCircle2, AlertTriangle, XCircle, Lightbulb, Gauge, History, Send } from 'lucide-react'

interface DecisionPanelProps {
  entityType: 'LEAVE_REQUEST' | 'LEAVE_PROPOSAL'
  entityId: number
}

export default function DecisionPanel({ entityType, entityId }: DecisionPanelProps) {
  const [decision, setDecision] = useState('')
  const [comment, setComment] = useState('')
  const [showDecision, setShowDecision] = useState(false)

  const { data: analyses, isLoading, refetch } = useQuery({
    queryKey: ['decision-analyses', entityType, entityId],
    queryFn: () => api.get(`/decision-engine/analyses/${entityType}/${entityId}`).then((r) => r.data),
  })

  const analyzeMutation = useMutation({
    mutationFn: () => api.post(`/decision-engine/analyze/${entityType}/${entityId}`).then((r) => r.data),
    onSuccess: () => refetch(),
  })

  const decisionMutation = useMutation({
    mutationFn: (data: { decision: string; comment?: string }) =>
      api.post(`/decision-engine/${analyses?.[0]?.id}/decision`, data).then((r) => r.data),
    onSuccess: () => { refetch(); setShowDecision(false); setDecision(''); setComment('') },
  })

  const latest = analyses?.[0] || null

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 50) return 'text-amber-600'
    return 'text-red-600'
  }

  const scoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 border-green-300'
    if (score >= 50) return 'bg-amber-100 border-amber-300'
    return 'bg-red-100 border-red-300'
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case 'PASS': return <CheckCircle2 className="size-4 text-green-600 shrink-0" />
      case 'WARN': return <AlertTriangle className="size-4 text-amber-600 shrink-0" />
      case 'FAIL': return <XCircle className="size-4 text-red-600 shrink-0" />
      default: return null
    }
  }

  const statusDot = (status: string) => {
    switch (status) {
      case 'PASS': return 'bg-green-500'
      case 'WARN': return 'bg-amber-500'
      case 'FAIL': return 'bg-red-500'
      default: return 'bg-gray-300'
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Gauge className="size-4 text-primary" />
          Analyse du moteur de décision
        </CardTitle>
        <Button
          size="sm"
          variant="outline"
          onClick={() => analyzeMutation.mutate()}
          disabled={analyzeMutation.isPending}
        >
          {analyzeMutation.isPending ? 'Analyse...' : 'Analyser'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement...</p>
        ) : !latest ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            <Lightbulb className="size-8 mx-auto mb-2 text-muted-foreground/50" />
            <p>Aucune analyse disponible</p>
            <p className="text-xs mt-1">Cliquez sur "Analyser" pour lancer le moteur de décision</p>
          </div>
        ) : (
          <>
            {/* Score */}
            <div className="flex items-center gap-4">
              <div className={cn('flex items-center justify-center w-16 h-16 rounded-2xl border-2 font-bold text-xl', scoreBgColor(latest.score))}>
                {latest.score}
              </div>
              <div>
                <p className={cn('text-lg font-bold', scoreColor(latest.score))}>
                  {latest.score >= 80 ? 'Compatible' : latest.score >= 50 ? 'Attention requise' : 'Bloqué'}
                </p>
                <p className="text-xs text-muted-foreground">{latest.summary}</p>
                <p className="text-xs text-muted-foreground">Score: {latest.score}/{latest.maxScore}</p>
              </div>
            </div>

            {/* Rules */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Règles évaluées</p>
              {latest.rules?.map((rule: any, i: number) => {
                const operational = rule.name === 'operational_risk'
                return (
                  <div key={i} className={cn('flex items-start gap-3 p-3 rounded-xl border', operational ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-100')}>
                    {statusIcon(rule.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{rule.label}</p>
                        <span className={cn('w-2 h-2 rounded-full shrink-0', statusDot(rule.status))} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{rule.message}</p>
                      {rule.details && (
                        <pre className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap font-sans">{rule.details}</pre>
                      )}
                    </div>
                    <p className={cn('text-xs font-semibold shrink-0', scoreColor((rule.score / rule.maxScore) * 100))}>
                      {rule.score}/{rule.maxScore}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Suggestion */}
            {latest.suggestion?.note && (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <Lightbulb className="size-4 text-blue-600" />
                  <p className="text-sm font-medium text-blue-800">Proposition du moteur</p>
                </div>
                <p className="text-xs text-blue-700">{latest.suggestion.note}</p>
                {latest.suggestion.startDate && (
                  <p className="text-xs text-blue-700 mt-1">
                    Période suggérée : {new Date(latest.suggestion.startDate).toLocaleDateString('fr-FR')}
                    {latest.suggestion.endDate && ` → ${new Date(latest.suggestion.endDate).toLocaleDateString('fr-FR')}`}
                  </p>
                )}
              </div>
            )}

            {/* Decision History */}
            {analyses?.length > 1 && (
              <details className="text-sm">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground flex items-center gap-2">
                  <History className="size-4" />
                  Historique des analyses ({analyses.length})
                </summary>
                <div className="mt-2 space-y-2">
                  {analyses.map((a: any) => (
                    <div key={a.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 text-xs text-muted-foreground">
                      <span>Score: {a.score}/100</span>
                      <span>{new Date(a.createdAt).toLocaleDateString('fr-FR')}</span>
                      {a.decision && (
                        <span className={cn(
                          'px-1.5 py-0.5 rounded text-xs font-medium',
                          a.decision === 'ACCEPT' ? 'bg-green-100 text-green-700' : a.decision === 'REJECT' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700',
                        )}>
                          {a.decision === 'ACCEPT' ? 'Accepté' : a.decision === 'REJECT' ? 'Refusé' : 'Modifié'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            )}

            {/* RH Decision */}
            {!latest.decision && (
              <div className="pt-2">
                {!showDecision ? (
                  <Button variant="default" size="sm" className="w-full" onClick={() => setShowDecision(true)}>
                    <Send className="size-4 mr-2" />Enregistrer ma décision
                  </Button>
                ) : (
                  <div className="space-y-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
                    <p className="text-sm font-medium">Décision finale RH</p>
                    <div className="flex gap-2">
                      {['ACCEPT', 'REJECT', 'MODIFY'].map((d) => (
                        <button
                          key={d}
                          onClick={() => setDecision(d)}
                          className={cn(
                            'flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors',
                            decision === d
                              ? d === 'ACCEPT' ? 'bg-green-100 border-green-400 text-green-800'
                                : d === 'REJECT' ? 'bg-red-100 border-red-400 text-red-800'
                                : 'bg-amber-100 border-amber-400 text-amber-800'
                              : 'bg-white border-gray-200 text-muted-foreground hover:border-gray-300',
                          )}
                        >
                          {d === 'ACCEPT' ? 'Accepter' : d === 'REJECT' ? 'Refuser' : 'Modifier'}
                        </button>
                      ))}
                    </div>
                    <textarea
                      className="w-full min-h-[60px] rounded-xl border border-input bg-white px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                      placeholder="Commentaire (optionnel)..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowDecision(false)}>
                        Annuler
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        disabled={!decision || decisionMutation.isPending}
                        onClick={() => decisionMutation.mutate({ decision, comment: comment || undefined })}
                      >
                        {decisionMutation.isPending ? 'Enregistrement...' : 'Confirmer'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Past decision */}
            {latest.decision && (
              <div className={cn(
                'p-3 rounded-xl border text-sm',
                latest.decision === 'ACCEPT' ? 'bg-green-50 border-green-200 text-green-800'
                  : latest.decision === 'REJECT' ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800',
              )}>
                <p className="font-medium">
                  Décision : {latest.decision === 'ACCEPT' ? 'Acceptée' : latest.decision === 'REJECT' ? 'Refusée' : 'Modifiée'}
                </p>
                {latest.decisionComment && <p className="text-xs mt-1">{latest.decisionComment}</p>}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
