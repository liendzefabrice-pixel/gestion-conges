import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../services/api'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { PageHeader } from '../components/ui/page-header'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger } from '../components/ui/select'
import { cn } from '../lib/utils'
import { Gauge, Search, RotateCcw, CheckCircle2, AlertTriangle, XCircle, History, Eye } from 'lucide-react'

export default function DecisionEnginePage() {
  const [entityType, setEntityType] = useState<'LEAVE_REQUEST' | 'LEAVE_PROPOSAL'>('LEAVE_REQUEST')
  const [entityId, setEntityId] = useState('')
  const [searchId, setSearchId] = useState('')

  const { data: analysis, isLoading, refetch } = useQuery({
    queryKey: ['decision-analysis-view', entityType, searchId],
    queryFn: async () => {
      if (!searchId) return null
      const res = await api.get(`/decision-engine/analyses/${entityType}/${searchId}`).then((r) => r.data)
      return res?.[0] || null
    },
    enabled: !!searchId,
  })

  const handleSearch = () => {
    setSearchId(entityId)
  }

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

  return (
    <div>
      <PageHeader
        title="Moteur de décision RH"
        description="Analysez les demandes de congé et les programmations annuelles"
      />

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1 min-w-[200px]">
              <Label className="text-xs">Type d'entité</Label>
              <Select value={entityType} onValueChange={(v) => setEntityType(v as any)}>
                <SelectTrigger className="h-9 text-sm">
                  <span className="flex-1 text-left">{entityType === 'LEAVE_REQUEST' ? 'Demande de congé' : 'Programmation annuelle'}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LEAVE_REQUEST">Demande de congé</SelectItem>
                  <SelectItem value="LEAVE_PROPOSAL">Programmation annuelle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 min-w-[160px]">
              <Label className="text-xs">ID de l'entité</Label>
              <Input
                className="h-9 text-sm"
                type="number"
                placeholder="Ex: 42"
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
              />
            </div>
            <Button size="sm" className="h-9" onClick={handleSearch} disabled={!entityId}>
              <Search className="size-3.5 mr-1.5" />Analyser
            </Button>
            <Button variant="ghost" size="sm" className="h-9" onClick={() => { setEntityId(''); setSearchId('') }}>
              <RotateCcw className="size-3.5 mr-1.5" />Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Result */}
      {isLoading ? (
        <p className="text-muted-foreground text-center py-10">Chargement...</p>
      ) : searchId && !analysis ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Gauge className="size-10 mx-auto mb-3 text-muted-foreground/40" />
            <p>Aucune analyse trouvée pour {entityType === 'LEAVE_REQUEST' ? 'la demande' : 'la programmation'} n°{searchId}</p>
            <p className="text-xs mt-1">Lancez une analyse depuis la page de détail de l'entité</p>
          </CardContent>
        </Card>
      ) : analysis ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Gauge className="size-4 text-primary" />
              Résultat de l'analyse
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Score */}
            <div className="flex items-center gap-4">
              <div className={cn('flex items-center justify-center w-20 h-20 rounded-2xl border-2 font-bold text-2xl', scoreBgColor(analysis.score))}>
                {analysis.score}
              </div>
              <div>
                <p className={cn('text-xl font-bold', scoreColor(analysis.score))}>
                  {analysis.score >= 80 ? 'Compatible' : analysis.score >= 50 ? 'Attention requise' : 'Bloqué'}
                </p>
                <p className="text-sm text-muted-foreground">{analysis.summary}</p>
              </div>
            </div>

            {/* Rules */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Détail des règles</p>
              {analysis.rules?.map((rule: any, i: number) => {
                const operational = rule.name === 'operational_risk'
                return (
                  <div key={i} className={cn('flex items-start gap-3 p-3 rounded-xl border', operational ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-100')}>
                    {statusIcon(rule.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{rule.label}</p>
                        <span className={cn(
                          'w-2 h-2 rounded-full shrink-0',
                          rule.status === 'PASS' ? 'bg-green-500' : rule.status === 'WARN' ? 'bg-amber-500' : 'bg-red-500',
                        )} />
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

            {/* Decision */}
            {analysis.decision && (
              <div className={cn(
                'p-3 rounded-xl border text-sm',
                analysis.decision === 'ACCEPT' ? 'bg-green-50 border-green-200 text-green-800'
                  : analysis.decision === 'REJECT' ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800',
              )}>
                <p className="font-medium flex items-center gap-2">
                  <Eye className="size-4" />
                  Décision : {analysis.decision === 'ACCEPT' ? 'Acceptée' : analysis.decision === 'REJECT' ? 'Refusée' : 'Modifiée'}
                </p>
                {analysis.decisionComment && <p className="text-xs mt-1">{analysis.decisionComment}</p>}
              </div>
            )}

            {/* Metadata */}
            <div className="text-xs text-muted-foreground flex gap-4 pt-2 border-t border-border/50">
              <span>Analyse n°{analysis.id}</span>
              <span>Créée le {new Date(analysis.createdAt).toLocaleDateString('fr-FR')}</span>
              {analysis.decision && <span>Décision enregistrée</span>}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
