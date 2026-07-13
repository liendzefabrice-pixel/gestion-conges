import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { translateRole } from '../lib/utils'
import type { Employee } from '../types'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { PageHeader } from '../components/ui/page-header'
import { User, Mail, Shield, Calendar, Clock, KeyRound, HelpCircle, Umbrella } from 'lucide-react'

export default function AccountPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: employee, isLoading } = useQuery<Employee>({
    queryKey: ['my-profile'],
    queryFn: () => api.get('/employees/me').then((r) => r.data),
  })

  if (isLoading) return <p className="text-muted-foreground">Chargement...</p>

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="Mon compte" description="Gérez vos informations personnelles" />

      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center gap-6 p-6">
            <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0">
              <img src="/images/Avatar.png" alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-semibold text-foreground">
                {employee ? `${employee.firstName} ${employee.lastName}` : user?.email}
              </h2>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <User className="size-3.5" />
                {employee?.position}
              </p>
              <p className="text-sm text-muted-foreground">{employee?.department?.name}</p>
              <Badge variant="default">{translateRole(user?.role?.name || '')}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-4" />
              Informations personnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Mail className="size-3" />
                  Email
                </p>
                <p className="font-medium text-foreground">{user?.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Shield className="size-3" />
                  Rôle
                </p>
                <p className="font-medium text-foreground">{translateRole(user?.role?.name || '')}</p>
              </div>
              {employee && (
                <>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="size-3" />
                      Date d'embauche
                    </p>
                    <p className="font-medium text-foreground">{new Date(employee.hireDate).toLocaleDateString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Clock className="size-3" />
                      Statut
                    </p>
                    <p className="font-medium text-foreground">{employee.user?.isActive ? 'Actif' : 'Inactif'}</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {employee?.leaveBalances && employee.leaveBalances.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Umbrella className="size-4" />
                Mes droits aux congés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(() => {
                  const annual = employee.leaveBalances!.find(b =>
                    b.leaveType?.name?.toLowerCase().includes('annuel') ||
                    b.leaveType?.name?.toLowerCase().includes('annual')
                  );
                  const perm = employee.leaveBalances!.find(b =>
                    b.leaveType?.name?.toLowerCase().includes('permission')
                  );
                  return (
                    <>
                      {annual && (
                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                          <p className="text-sm font-medium text-muted-foreground mb-1">Congé annuel</p>
                          <p className="text-3xl font-bold text-primary">{annual.remaining} jours</p>
                          <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                            <span>Acquis : {annual.totalDays}</span>
                            <span>Consommés : {annual.usedDays + annual.pendingDays}</span>
                          </div>
                        </div>
                      )}
                      {perm && (
                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                          <p className="text-sm font-medium text-muted-foreground mb-1">Permissions exceptionnelles</p>
                          <p className="text-3xl font-bold text-amber-600">{perm.remaining} jours</p>
                          <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                            <span>Acquis : {perm.totalDays}</span>
                            <span>Consommés : {perm.usedDays + perm.pendingDays}</span>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="size-4" />
              Sécurité du compte
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Mot de passe</p>
                <p className="text-sm text-muted-foreground">Dernière modification inconnue</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/account/security')}>
                Modifier
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="size-4" />
              Assistance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Pour toute question relative à votre compte ou aux congés, contactez le service RH.</p>
            <p>Email : <a href="mailto:rh@siap-pharma.com" className="text-primary hover:underline font-medium">rh@siap-pharma.com</a></p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
