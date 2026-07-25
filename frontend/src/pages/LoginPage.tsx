import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { loginSchema, type LoginFormData } from '../lib/schemas'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { PasswordInput } from '../components/ui/password-input'
import { Label } from '../components/ui/label'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password)
      navigate('/dashboard')
    } catch (err: any) {
      const message = err.response?.data?.message || 'Adresse email ou mot de passe incorrect'
      setError('root', { message })
    }
  }

  return (
    <div>
      <div className="mb-8 text-center">
        <img
          src="/images/Logo.png"
          alt="SIAP PHARMA"
          className="mx-auto w-20 h-20 mb-4"
        />
        <h1 className="text-xl font-semibold text-gray-900">
          Gestion des congés
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Connectez-vous à votre espace de travail.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {errors.root && (
            <div className="p-3 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200">
              {errors.root.message}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@exemple.com"
              className="h-11"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">Mot de passe</Label>
            <PasswordInput id="password" {...register('password')} />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full h-11 text-sm font-medium" disabled={isSubmitting}>
            {isSubmitting ? 'Connexion...' : 'Se connecter'}
          </Button>

          <div className="text-center">
            <Link to="/forgot-password" className="text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2">
              Mot de passe oublié ?
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
