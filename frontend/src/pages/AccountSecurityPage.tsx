import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { PasswordInput } from '../components/ui/password-input'
import { Button } from '../components/ui/button'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'

export default function AccountSecurityPage() {
  const navigate = useNavigate()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }
    if (newPassword.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caractères')
      return
    }

    try {
      await api.post('/auth/change-password', { currentPassword, newPassword })
      setSuccess(true)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du changement de mot de passe')
    }
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto">
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-4xl mb-4 text-green-500">✓</div>
            <h2 className="text-xl font-semibold mb-2">Mot de passe modifié</h2>
            <p className="text-gray-500 mb-6">Votre mot de passe a été mis à jour avec succès.</p>
            <Button variant="outline" onClick={() => navigate('/account')}>
              Retour à mon compte
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Modifier le mot de passe</CardTitle>
          <p className="text-sm text-gray-500">Choisissez un mot de passe sécurisé que vous n'utilisez pas ailleurs.</p>
        </CardHeader>
        <CardContent>
          {error && <div className="p-3 text-sm text-red-700 bg-red-100 rounded mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Mot de passe actuel</Label>
              <PasswordInput id="currentPassword" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <PasswordInput id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <PasswordInput id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} />
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => navigate('/account')}>
                Retour
              </Button>
              <Button type="submit">
                Enregistrer
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
