import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { resetPasswordSchema, type ResetPasswordFormData } from '../lib/schemas'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const emailFromUrl = searchParams.get('email') || ''
  const navigate = useNavigate()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: emailFromUrl, otp: '', newPassword: '', confirmPassword: '' },
  })

  const onSubmit = async (data: ResetPasswordFormData) => {
    setError('')
    try {
      await api.post('/auth/reset-password', {
        email: data.email,
        otp: data.otp,
        newPassword: data.newPassword,
      })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la réinitialisation')
    }
  }

  if (success) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl text-green-600">Mot de passe réinitialisé</CardTitle>
          <CardDescription>
            Tu vas être redirigé vers la page de connexion...
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Réinitialisation</CardTitle>
        <CardDescription>Saisis le code reçu et ton nouveau mot de passe</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-100 rounded">{error}</div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} />
            {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="otp">Code de vérification (6 chiffres)</Label>
            <Input id="otp" type="text" maxLength={6} placeholder="000000" {...register('otp')} />
            {errors.otp && <p className="text-sm text-red-600">{errors.otp.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nouveau mot de passe</Label>
            <Input id="newPassword" type="password" {...register('newPassword')} />
            {errors.newPassword && <p className="text-sm text-red-600">{errors.newPassword.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <Input id="confirmPassword" type="password" {...register('confirmPassword')} />
            {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Réinitialisation...' : 'Réinitialiser'}
          </Button>
          <div className="text-center">
            <Link to="/login" className="text-sm text-blue-600 hover:underline">
              Retour à la connexion
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
