import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { translateRole } from '../lib/utils'
import type { Employee } from '../types'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'

export default function AccountPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: employee, isLoading } = useQuery<Employee>({
    queryKey: ['my-profile'],
    queryFn: () => api.get('/employees/me').then((r) => r.data),
  })

  if (isLoading) return <p className="text-gray-500">Chargement...</p>

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Mon compte</h1>

      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center gap-6 p-6">
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <span className="text-3xl font-bold text-blue-600">
                {employee ? (employee.firstName[0] + employee.lastName[0]).toUpperCase() : '?'}
              </span>
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">
                {employee ? `${employee.firstName} ${employee.lastName}` : user?.email}
              </h2>
              <p className="text-sm text-gray-500">{employee?.position}</p>
              <p className="text-sm text-gray-500">{employee?.department?.name}{employee?.service ? ` — ${employee.service.name}` : ''}</p>
              <Badge variant="outline">{translateRole(user?.role?.name || '')}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Rôle</p>
                <p className="font-medium">{translateRole(user?.role?.name || '')}</p>
              </div>
              {employee && (
                <>
                  <div>
                    <p className="text-sm text-gray-500">Date d'embauche</p>
                    <p className="font-medium">{new Date(employee.hireDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Statut</p>
                    <p className="font-medium">{employee.user.isActive ? 'Actif' : 'Inactif'}</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sécurité du compte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Mot de passe</p>
                <p className="text-sm text-gray-500">Dernière modification inconnue</p>
              </div>
              <Button variant="outline" onClick={() => navigate('/change-password')}>
                Modifier
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assistance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <p>Pour toute question relative à votre compte ou aux congés, contactez le service RH.</p>
            <p>Email : <a href="mailto:rh@siap-pharma.com" className="text-blue-600 hover:underline">rh@siap-pharma.com</a></p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
