import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { forgotPasswordSchema, type ForgotPasswordFormData } from '../lib/schemas'
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

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [submitted, setSubmitted] = useState(false)
  const [devOtp, setDevOtp] = useState('')
  const [email, setEmail] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    const res = await api.post('/auth/forgot-password', data)
    setEmail(data.email)
    setDevOtp(res.data.devOtp || '')
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Code de vérification</CardTitle>
          <CardDescription>
            Un code à 6 chiffres a été envoyé à <strong>{email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {devOtp && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
              <p className="font-semibold mb-1">Mode développement</p>
              <p className="text-2xl font-mono font-bold text-yellow-800 tracking-widest">{devOtp}</p>
            </div>
          )}
          <Button
            className="w-full"
            onClick={() => navigate(`/reset-password?email=${encodeURIComponent(email)}`)}
          >
            Saisir le code
          </Button>
          <Link to="/login" className="text-sm text-blue-600 hover:underline block">
            Retour à la connexion
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Mot de passe oublié</CardTitle>
        <CardDescription>
          Saisissez votre email pour recevoir un code de vérification
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="email@exemple.com" {...register('email')} />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Envoi...' : 'Envoyer le code'}
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
