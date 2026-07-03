import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
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
  const [submitted, setSubmitted] = useState(false)
  const [devToken, setDevToken] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    const res = await api.post('/auth/forgot-password', data)
    setDevToken(res.data.devToken || '')
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Email envoyé</CardTitle>
          <CardDescription>
            Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {devToken && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
              <p className="font-semibold mb-1">Mode développement</p>
              <p className="text-xs text-gray-600 break-all">Token : {devToken}</p>
              <Link
                to={`/reset-password?token=${devToken}`}
                className="text-blue-600 hover:underline text-sm mt-2 inline-block"
              >
                Cliquer pour réinitialiser
              </Link>
            </div>
          )}
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
          Saisissez votre email pour recevoir un lien de réinitialisation
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
            {isSubmitting ? 'Envoi...' : 'Envoyer'}
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
