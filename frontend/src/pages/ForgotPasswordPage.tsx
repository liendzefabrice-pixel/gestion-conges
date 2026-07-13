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
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    await api.post('/auth/forgot-password', data)
    navigate(`/verify-otp?email=${encodeURIComponent(data.email)}`)
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
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Envoi...' : 'Envoyer le code'}
          </Button>
          <div className="text-center">
            <Link to="/login" className="text-sm text-primary hover:underline">
              Retour à la connexion
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
