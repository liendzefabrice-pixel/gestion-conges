import { useState, useRef, useCallback, useEffect } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
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

function useCountdown(initial: number) {
  const [remaining, setRemaining] = useState(initial)
  const timerRef = useRef<ReturnType<typeof setInterval>>()

  const start = useCallback(() => {
    setRemaining(initial)
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(timerRef.current)
          return 0
        }
        return r - 1
      })
    }, 1000)
  }, [initial])

  useEffect(() => {
    return () => clearInterval(timerRef.current)
  }, [])

  return { remaining, start }
}

export default function OtpVerificationPage() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || ''
  const navigate = useNavigate()
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const { remaining, start } = useCountdown(60)

  useEffect(() => { start() }, [start])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length !== 6) return
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/verify-otp', { email, otp })
      navigate(`/reset-password?email=${encodeURIComponent(email)}&otp=${otp}`)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Code invalide')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    setError('')
    try {
      await api.post('/auth/forgot-password', { email })
      start()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du renvoi')
    } finally {
      setResending(false)
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Code de vérification</CardTitle>
        <CardDescription>
          Un code à 6 chiffres a été envoyé à <strong>{email}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-50 rounded-xl border border-red-200">{error}</div>
          )}
          <div className="space-y-2">
            <Label htmlFor="otp">Code de vérification</Label>
            <Input
              id="otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="text-center text-2xl font-mono tracking-[8px] h-14"
              autoFocus
            />
          </div>

          {remaining > 0 ? (
            <p className="text-xs text-center text-muted-foreground">
              Vous pouvez renvoyer un code dans {remaining} seconde{remaining > 1 ? 's' : ''}
            </p>
          ) : (
            <div className="text-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-sm text-primary hover:underline disabled:opacity-50"
              >
                {resending ? 'Envoi...' : 'Renvoyer le code'}
              </button>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
            {loading ? 'Vérification...' : 'Vérifier'}
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
