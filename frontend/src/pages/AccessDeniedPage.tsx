import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { ShieldX } from 'lucide-react'

export default function AccessDeniedPage() {
  const navigate = useNavigate()
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full text-center">
        <CardContent className="py-12">
          <div className="w-20 h-20 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-6">
            <ShieldX className="size-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">Accès refusé</h1>
          <p className="text-muted-foreground mb-8">
            Vous n'avez pas les autorisations nécessaires pour accéder à cette page.
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            Retour au tableau de bord
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
