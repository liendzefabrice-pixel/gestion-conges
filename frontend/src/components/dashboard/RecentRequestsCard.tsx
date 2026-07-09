import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card'
import { Button } from '../ui/button'
import { FileText, ArrowRight } from 'lucide-react'
import { cn } from '../../lib/utils'

interface RecentRequestsCardProps {
  className?: string
}

export function RecentRequestsCard({ className }: RecentRequestsCardProps) {
  const navigate = useNavigate()

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="size-4 text-muted-foreground" />
          Demandes récentes
        </CardTitle>
        <CardDescription>Dernières demandes enregistrées</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
          <FileText className="size-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Aucune demande récente</p>
          <p className="text-xs text-muted-foreground/60 mt-1 max-w-[220px]">
            Les dernières demandes de congés et permissions apparaîtront ici.
          </p>
        </div>
        <div className="pt-2 border-t border-border/50">
          <Button
            variant="ghost"
            className="w-full justify-between text-sm"
            onClick={() => navigate('/leave')}
          >
            Voir toutes les demandes
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default RecentRequestsCard
