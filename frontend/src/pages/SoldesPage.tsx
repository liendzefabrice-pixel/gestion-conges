import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import type { LeaveBalance, BalanceAdjustment, EmployeeBalance } from '../types'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { PageHeader } from '../components/ui/page-header'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { Calendar, Clock, History, Plus, Minus, ChevronDown, ChevronUp, Search } from 'lucide-react'
import { cn } from '../lib/utils'

const operationLabels: Record<string, string> = {
  INITIALISATION: 'Initialisation',
  AJUSTEMENT_MANUAL: 'Ajustement manuel',
  DEDUCTION_CONGES: 'Déduction congé',
  CREDIT_EXCEPTIONNEL: 'Crédit exceptionnel',
  REPORT: 'Report annuel',
  REGULARISATION: 'Régularisation',
}

function BalanceCard({
  balance,
  role,
  onAdjust,
}: {
  balance: LeaveBalance & { leaveType: { color?: string; icon?: string; name: string } }
  role: string
  onAdjust?: (b: LeaveBalance & { leaveType: { color?: string; icon?: string; name: string } }) => void
}) {
  const [showHistory, setShowHistory] = useState(false)
  const { data: adjustments } = useQuery<BalanceAdjustment[]>({
    queryKey: ['balance-adjustments', balance.id],
    queryFn: () => api.get(`/leave-balances/${balance.id}/adjustments`).then((r) => r.data),
    enabled: showHistory && role === 'ADMIN',
  })

  const color = balance.leaveType.color || '#0B6B3A'
  const usagePercent = balance.totalDays > 0 ? Math.round(((balance.usedDays + balance.pendingDays) / (balance.totalDays + balance.adjustedDays)) * 100) : 0
  const isLow = balance.remaining <= 2
  const isExhausted = balance.remaining <= 0

  return (
    <Card className="border-l-4 overflow-hidden" style={{ borderLeftColor: color }}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="font-semibold text-base" style={{ color }}>{balance.leaveType.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Année {balance.year}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold" style={{ color }}>
              {balance.remaining}
            </p>
            <p className="text-xs text-muted-foreground">jour{balance.remaining > 1 ? 's' : ''} restant{balance.remaining > 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(usagePercent, 100)}%`,
              backgroundColor: isExhausted ? '#DC2626' : isLow ? '#F59E0B' : color,
            }}
          />
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-2 rounded-lg bg-gray-50">
            <p className="text-sm font-semibold">{balance.totalDays + balance.adjustedDays}</p>
            <p className="text-xs text-muted-foreground">Acquis</p>
          </div>
          <div className="p-2 rounded-lg bg-gray-50">
            <p className="text-sm font-semibold">{balance.usedDays}</p>
            <p className="text-xs text-muted-foreground">Consommés</p>
          </div>
          <div className="p-2 rounded-lg bg-gray-50">
            <p className="text-sm font-semibold">{balance.pendingDays}</p>
            <p className="text-xs text-muted-foreground">En attente</p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          {role === 'ADMIN' && onAdjust && (
            <Button variant="outline" size="sm" onClick={() => onAdjust(balance)}>
              Ajuster
            </Button>
          )}
          {role === 'ADMIN' && (
            <Button variant="ghost" size="sm" onClick={() => setShowHistory(!showHistory)} className="ml-auto">
              <History className="size-3.5 " />
              Historique
              {showHistory ? <ChevronUp className="size-3.5 " /> : <ChevronDown className="size-3.5 " />}
            </Button>
          )}
        </div>

        {showHistory && adjustments && (
          <div className="mt-4 border-t pt-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mouvements</p>
            {adjustments.length === 0 ? (
              <p className="text-xs text-muted-foreground">Aucun mouvement</p>
            ) : (
              adjustments.map((adj) => (
                <div key={adj.id} className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0">
                  <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-primary" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{operationLabels[adj.operationType] || adj.operationType}</span>
                      <span className={cn(
                        'text-xs font-medium',
                        adj.newRemaining > adj.previousRemaining ? 'text-green-600' : adj.newRemaining < adj.previousRemaining ? 'text-red-600' : 'text-muted-foreground'
                      )}>
                        {adj.previousRemaining} → {adj.newRemaining}
                      </span>
                    </div>
                    {adj.comment && <p className="text-xs text-muted-foreground mt-0.5">{adj.comment}</p>}
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{adj.author?.email || 'Système'}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{new Date(adj.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function AdjustModal({
  balance,
  onClose,
  onSuccess,
}: {
  balance: LeaveBalance & { leaveType: { color?: string; name: string } }
  onClose: () => void
  onSuccess: () => void
}) {
  const [delta, setDelta] = useState(0)
  const [comment, setComment] = useState('')
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: { delta: number; comment: string }) =>
      api.post(`/leave-balances/${balance.id}/adjust`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balances'] })
      onSuccess()
    },
  })

  const remaining = balance.totalDays + balance.adjustedDays - balance.usedDays - balance.pendingDays
  const newRemaining = remaining + delta

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b">
          <h2 className="text-lg font-bold">Ajuster le solde</h2>
          <p className="text-sm text-muted-foreground mt-1">{balance.leaveType.name} — {balance.employee?.user?.email || `Année ${balance.year}`}</p>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
            <span className="text-sm">Solde actuel</span>
            <span className="text-lg font-bold">{remaining} jour{remaining > 1 ? 's' : ''}</span>
          </div>

          <div className="space-y-2">
            <Label>Ajouter / Retirer des jours</Label>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => setDelta(delta - 1)}>
                <Minus className="size-4" />
              </Button>
              <Input
                type="number"
                value={delta}
                onChange={(e) => setDelta(Number(e.target.value))}
                className="text-center text-lg font-bold"
              />
              <Button variant="outline" size="icon" onClick={() => setDelta(delta + 1)}>
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
            <span className="text-sm font-medium">Nouveau solde</span>
            <span className={cn('text-lg font-bold', newRemaining < 0 ? 'text-destructive' : 'text-primary')}>
              {newRemaining} jour{newRemaining > 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-2">
            <Label>Motif de la correction</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ex: régularisation, bonus ancienneté, report..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" onClick={onClose}>Annuler</Button>
            <Button
              onClick={() => mutation.mutate({ delta, comment })}
              disabled={delta === 0 || !comment.trim() || mutation.isPending}
            >
              {mutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SoldesPage() {
  const { user } = useAuth()
  const role = user?.role?.name || ''
  const [selectedEmployee, setSelectedEmployee] = useState<string>('')
  const [adjustingBalance, setAdjustingBalance] = useState<LeaveBalance & { leaveType: { color?: string; name: string } } | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const { data: myBalances = [] } = useQuery<(LeaveBalance & { leaveType: { color?: string; icon?: string; name: string } })[]>({
    queryKey: ['balances', 'my'],
    queryFn: () => api.get('/leave-balances/my').then((r) => r.data),
    enabled: role === 'EMPLOYEE',
  })

  const { data: allBalances = [] } = useQuery<EmployeeBalance[]>({
    queryKey: ['balances', 'all'],
    queryFn: () => api.get('/leave-balances').then((r) => r.data),
    enabled: role !== 'EMPLOYEE',
  })

  const { data: selectedEmployeeBalances } = useQuery<EmployeeBalance>({
    queryKey: ['balances', 'employee', selectedEmployee],
    queryFn: () => api.get(`/leave-balances/${selectedEmployee}`).then((r) => r.data),
    enabled: !!selectedEmployee,
  })

  const queryClient = useQueryClient()

  const handleAdjustSuccess = () => {
    setAdjustingBalance(null)
    queryClient.invalidateQueries({ queryKey: ['balances'] })
  }

  const { data: permBalance } = useQuery({
    queryKey: ['permission-balance', 'my'],
    queryFn: () => api.get('/permissions/balance').then((r) => r.data),
    enabled: role === 'EMPLOYEE',
  })

  if (role === 'EMPLOYEE') {
    const currentYear = new Date().getFullYear()
    const activeBalances = myBalances.filter((b) => b.year === currentYear)
    const totalRemaining = activeBalances.reduce((sum, b) => sum + b.remaining, 0)
    const perm = permBalance?.[0]

    return (
      <div className="space-y-6">
        <PageHeader
          title="Mes soldes"
          description="Consultez l'état de vos compteurs de congés et permissions"
        />

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{totalRemaining}</p>
              <p className="text-xs text-muted-foreground mt-1">Jours de congé restants</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{activeBalances.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Types de congés</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">
                {activeBalances.reduce((s, b) => s + b.pendingDays, 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">En attente</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">
                {perm ? perm.totalDays + perm.adjustedDays - perm.usedDays - perm.pendingDays : 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Permissions restantes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{currentYear}</p>
              <p className="text-xs text-muted-foreground mt-1">Année en cours</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeBalances.map((b) => (
            <BalanceCard key={b.id} balance={b} role={role} />
          ))}
        </div>

        {perm && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Solde des permissions {perm.year}</h3>
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="p-4 rounded-xl bg-gray-50 border">
                <p className="text-lg font-bold">{perm.totalDays}</p>
                <p className="text-xs text-muted-foreground">Acquis</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border">
                <p className="text-lg font-bold text-red-600">{perm.usedDays}</p>
                <p className="text-xs text-muted-foreground">Utilisés</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border">
                <p className="text-lg font-bold text-amber-600">{perm.pendingDays}</p>
                <p className="text-xs text-muted-foreground">En attente</p>
              </div>
              <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                <p className="text-lg font-bold text-green-700">{perm.totalDays + perm.adjustedDays - perm.usedDays - perm.pendingDays}</p>
                <p className="text-xs text-green-600">Disponibles</p>
              </div>
            </div>
          </div>
        )}

        {myBalances.some((b) => b.year !== currentYear) && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Années précédentes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myBalances.filter((b) => b.year !== currentYear).map((b) => (
                <BalanceCard key={b.id} balance={b} role={role} />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const filteredEmployees = allBalances.filter((eb) =>
    !searchTerm ||
    `${eb.employee.firstName} ${eb.employee.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eb.employee.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eb.employee.matricule.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Soldes des congés"
        description="Consultez les soldes de congés des employés"
      />

      {role === 'ADMIN' && (
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un employé (nom, email, matricule)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredEmployees.map((eb) => {
          const currentYearBalances = eb.balances.filter((b) => b.year === new Date().getFullYear())
          const totalRemaining = currentYearBalances.reduce((s, b) => s + b.remaining, 0)

          return (
            <details key={eb.employee.id} className="group">
              <summary className="cursor-pointer list-none">
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{eb.employee.firstName} {eb.employee.lastName}</p>
                        <p className="text-xs text-muted-foreground">{eb.employee.matricule} · {eb.employee.department.name}</p>
                        <p className="text-xs text-muted-foreground">{eb.employee.user.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-primary">{totalRemaining}</p>
                        <p className="text-xs text-muted-foreground">jours restants</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </summary>
              <div className="mt-2 space-y-3 pl-4 border-l-2 border-muted">
                {currentYearBalances.map((b) => (
                  <BalanceCard
                    key={b.id}
                    balance={b}
                    role={role}
                    onAdjust={role === 'ADMIN' ? setAdjustingBalance : undefined}
                  />
                ))}
              </div>
            </details>
          )
        })}
        {filteredEmployees.length === 0 && (
          <p className="text-muted-foreground col-span-full text-center py-8">Aucun employé trouvé</p>
        )}
      </div>

      {adjustingBalance && (
        <AdjustModal
          balance={adjustingBalance}
          onClose={() => setAdjustingBalance(null)}
          onSuccess={handleAdjustSuccess}
        />
      )}
    </div>
  )
}