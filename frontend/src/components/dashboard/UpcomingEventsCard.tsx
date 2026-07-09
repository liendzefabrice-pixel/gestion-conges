import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card'
import { CalendarDays } from 'lucide-react'
import { cn } from '../../lib/utils'

interface UpcomingEventsCardProps {
  className?: string
}

export function UpcomingEventsCard({ className }: UpcomingEventsCardProps) {
  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="size-4 text-muted-foreground" />
          Évènements à venir
        </CardTitle>
        <CardDescription>Prochains éléments importants</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col items-center justify-center py-12 text-center">
        <CalendarDays className="size-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">Aucun évènement à venir</p>
        <p className="text-xs text-muted-foreground/60 mt-1 max-w-[220px]">
          Les prochains congés, retours et échéances planifiés apparaîtront ici.
        </p>
      </CardContent>
    </Card>
  )
}

export default UpcomingEventsCard
